import os
import json
import time
import requests
import pandas as pd
from tqdm import tqdm
from pathlib import Path

# Configuration - adjust as needed
CONFIG = {
    "base_url": "http://localhost:8000",
    "test_data_path": "../data/last_uploaded.csv",  # Path relative to tests/
    "results_path": "results/test_results.json",
    "request_delay": 0.5  # seconds between API calls
}

def ensure_results_dir():
    """Create results directory inside tests/"""
    results_dir = os.path.join(os.path.dirname(__file__), "results")
    Path(results_dir).mkdir(exist_ok=True)
    CONFIG["results_path"] = os.path.join(results_dir, "test_results.json")  # Update path

def load_test_data():
    """Load the dataset for testing"""
    abs_path = os.path.join(os.path.dirname(__file__), CONFIG["test_data_path"])
    return pd.read_csv(abs_path)

def test_full_pipeline():
    ensure_results_dir()
    df = load_test_data()
    features = df.columns.tolist()
    results = {}

    try:
        with open(os.path.join(os.path.dirname(__file__), CONFIG["test_data_path"]), "rb") as f:
            upload_response = requests.post(
                f"{CONFIG['base_url']}/upload-csv",
                files={"file": f}
            )
            upload_response.raise_for_status()
    except Exception as e:
        # Critical failure - abort entire test
        print(f"🚨 Critical CSV upload failed: {str(e)}")
        return {
            "status": "aborted",
            "error": f"CSV upload failed: {str(e)}",
            "tested_features": []
        }

    for feature in tqdm(features, desc="Testing features"):
        try:
            
            # 2. Train model
            train_response = requests.post(
                f"{CONFIG['base_url']}/train-model",
                json={"target": feature}
            )
            train_response.raise_for_status()

            # 3. Get explanations
            explain_response = requests.get(
                f"{CONFIG['base_url']}/explain-model",
                params={"start": 0, "end": 1}
            )
            explain_response.raise_for_status()

            results[feature] = {
                "status": "success",
                # "encoded_features_used_for_training": train_response.json().get('final_columns'),
                # "encoded_feature_count": len(train_response.json().get('final_columns')),
                "response": explain_response.json()
            }
            
        except Exception as e:
            results[feature] = {
                "status": "failed",
                "error": str(e)
            }
        
        time.sleep(CONFIG["request_delay"])
    
    # Save results
    with open(CONFIG["results_path"], "w") as f:
        json.dump(results, f, indent=2)
    
    # Generate report
    success_count = sum(1 for r in results.values() if r["status"] == "success")
    print(f"\nTest Results ({success_count}/{len(features)} successful):")
    print(f"Full results saved to {CONFIG['results_path']}")
    
    return results

if __name__ == "__main__":
    test_full_pipeline()