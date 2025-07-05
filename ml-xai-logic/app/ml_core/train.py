from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, mean_squared_error, precision_score, recall_score, f1_score, mean_absolute_error, r2_score
import pandas as pd
from app.utils.io import check_high_cardinality_and_identifiers
import joblib
import os


def train_model(df: pd.DataFrame, target: str):
    X = df.drop(columns=[target]) # Drop the target column from the dataframe
    y = df[target] # Target column

    # 1. Preprocessing: Drop constant columns, completely null columns, and likely identifiers
    _, likely_identifiers = check_high_cardinality_and_identifiers(X)
    drop_cols = likely_identifiers + [col for col in X.columns if X[col].nunique() <= 1]
    X = X.drop(columns=drop_cols) # Removes any rows in X that have NaNs
    
    # 2. Handle missing values: remove rows with missing values
    # Step 1: Drop rows where y is missing
    non_null_mask = y.notnull()
    X = X.loc[non_null_mask]
    y = y.loc[non_null_mask]

    # Step 2: Drop remaining NaNs in X
    X = X.dropna()
    y = y.loc[X.index]  # realign just in case


    # 3. Encoding and Transformations
    # One hot encoding for object/categorical features
    X = pd.get_dummies(X)


    # Basic type detection: placeholder detection criteria
    if y.dtype in ['float64', 'int64'] and y.nunique() > 15:
        task = "regression"
        model = RandomForestRegressor()
    else:
        task = "classification"
        model = RandomForestClassifier()

   

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # After the training is done, we can save the model in artifacts folder (not tracked by git)
    os.makedirs("artifacts", exist_ok=True)
    joblib.dump(model, "artifacts/latest_model.pkl")
    X_test.to_csv("artifacts/X_test.csv", index=False) # Save X_test in the artifacts folder

    if task == "classification":
        acc = accuracy_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred).tolist()
        precision = precision_score(y_test, y_pred, average="weighted")
        recall = recall_score(y_test, y_pred, average="weighted")
        f1 = f1_score(y_test, y_pred, average="weighted")

    else:
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
    return {
        "task": task,
        "model_type": type(model).__name__,
        "metrics": {
            "accuracy": round(acc, 2),
            "confusion_matrix": cm,
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "f1_score": round(f1, 2)
        } if task == "classification" else {
            "mse": round(mse, 2),
            "mae": round(mae, 2),
            "r2": round(r2, 2)
        },
        "final_columns": X.columns.tolist(),
        "dropped_columns": drop_cols,
        "row_count_before_preprocessing": len(df),
        "row_count_after_preprocessing": len(X),
        "feature_encoding": "one_hot",
        "missing_value_strategy": "drop"
    }
