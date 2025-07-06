# SHAP logic
import shap
import pandas as pd
import joblib
import numpy as np
from app.utils.io import preprocess_dataset
import os

############################################################
### Common utilities (used in both tasks)

def load_model_and_test_data():
    # Load saved model and X_test
    model = joblib.load("artifacts/latest_model.pkl")
    model_name = type(model).__name__
    if model_name == 'RandomForestRegressor':
        task = 'regression'
    else:
        task = 'classification'
    
    uploaded_dataset = pd.read_csv("artifacts/uploaded_dataset.csv")
    X_test = pd.read_csv("artifacts/X_test.csv")

    # Load model columns 
    model_columns = X_test.columns.tolist()
    # Preprocess dataset
    X_processed = preprocess_dataset(uploaded_dataset, model_columns)
    X_processed.to_csv("artifacts/X_processed.csv", index=False)

    return model, X_processed, X_test, task

# Group one-hot encoded features to their base name
def get_feature_group_map(columns):
    mapping = {}
    for col in columns:
        # For one-hot encoded features, split at the first "_"
        if "_" in col:
            base = col.split("_")[0]
        else:
            base = col
        if base not in mapping:
            mapping[base] = []
        mapping[base].append(col)
    return mapping

############################################################
### Regression
def group_global_shap_values_regression(global_vals, columns):
    mapping = get_feature_group_map(columns)
    grouped = []
    for base_feature, subcols in mapping.items():
        indices = [columns.get_loc(c) for c in subcols] # get_loc returns the index of the column
        total_importance = sum(global_vals[i] for i in indices)
        grouped.append({
            "feature": base_feature,
            "importance": round(total_importance, 3)
        })
    grouped.sort(key=lambda x: x["importance"], reverse=True)
    return grouped

def compute_local_shap_values_regression(model, X_processed_slice, shap_values, base_values, start=0, end=1):
    # shape_dict = {}
    # shape_dict["shap_values"] = shap_values.shape
    # shape_dict["global_importances"] = global_importances.shape

    # Local explanations: For the queried rows, corresponding shap values (from shap_values) are processed with a grouping logic and explanation is added as a dictionary.
    local_explanations = []
    mapping = get_feature_group_map(X_processed_slice.columns)

    for i in range(len(X_processed_slice)):
        row = X_processed_slice.iloc[i:i+1]
        prediction = model.predict(row)[0]
        shap_row = shap_values[i]

        local_explanation = {} # A map for each feature's contribution for the current row
        for feature, subcols in mapping.items():
            feature_contribution = sum(shap_row[X_processed_slice.columns.get_loc(c)] for c in subcols)
            local_explanation[feature] = round(feature_contribution, 3)
        
        # Sum of all feature's shap value for a prediction = deviation of model output from baseline
        # verify shap values make sense by checking the difference of shap values and model deviation from baseline are equal
        sum_of_shap_values = sum(local_explanation.values())
        check = sum_of_shap_values - (prediction - base_values[0]) # This should be zero for any row

        local_explanations.append({
            "row_index": start + i,
            "prediction": prediction,
            "shap_contributions": local_explanation,
            "check": check
        })
    return local_explanations

############################################################
### Classification

# Helper function to safely convert predictions and class_labels based on data type of the target variable (np types -> python native to fix errors in json response)
def convert_predictions_and_class_labels(val):
    if isinstance(val, (np.integer, int)):
        return int(val)
    elif isinstance(val, (np.floating, float)):
        return float(val)
    elif isinstance(val, (np.bool_, bool)):
        return bool(val)
    else:
        return str(val)  # Fallback to string representation
    
def group_global_shap_values_classification(global_importances, columns, classes):
    num_classes = global_importances.shape[1] # here, global_importances has a shape (num_features, classes), say (20, 6)
    feature_mapping = get_feature_group_map(columns)
    grouped = []

    for class_idx in range(num_classes):
        global_importances_current_class = global_importances[:, class_idx]
        
        # Group features
        grouped_global_importances_current_class = []
        for feature, subcols in feature_mapping.items():
            indices = [columns.get_loc(c) for c in subcols]
            total_importance_for_current_feature = sum(global_importances_current_class[i] for i in indices)
            grouped_global_importances_current_class.append({
                "feature": feature,
                "importance": round(total_importance_for_current_feature, 3)
            })
        
        grouped_global_importances_current_class.sort(key=lambda x: x["importance"], reverse=True)
        grouped.append({
            "class": convert_predictions_and_class_labels(classes[class_idx]),
            "features": grouped_global_importances_current_class,
        })

    return grouped

def compute_local_shap_values_classification(model, X_processed_slice, shap_values, base_values, start=0, end=1):
    local_explanations = []
    feature_mapping = get_feature_group_map(X_processed_slice.columns)
    num_classes = shap_values.shape[2]
    classes = model.classes_

    for i in range(len(X_processed_slice)):
        
        row = X_processed_slice.iloc[i: i+1]
        prediction = model.predict(row)[0]
        proba = model.predict_proba(row)[0]


        current_row_shap_values = shap_values[i] # (n_features, num_classes)

        class_explanations = []
        for class_idx in range(num_classes):
            current_class_shap_values = current_row_shap_values[:, class_idx] # (n_features, )

            contributions = {}

            for feature, subcols in feature_mapping.items():
                indices = [X_processed_slice.columns.get_loc(c) for c in subcols]
                contributions[feature] = round(float(sum(current_class_shap_values[i] for i in indices)), 3)
            
            class_explanations.append({
                "class": convert_predictions_and_class_labels(classes[class_idx]),
                "contributions": contributions,
                "probability": float(proba[class_idx]),
                # Sum of contributions should equal proba - base_value; similar logic as in regression case
                "check": round(sum(contributions.values()), 3) - round(proba[class_idx] - base_values[class_idx], 3)
            })
        
        local_explanations.append({
            "row_index": start + i,
            "prediction": convert_predictions_and_class_labels(prediction),
            "class_wise_feature_contributions": class_explanations
        })

    return local_explanations

############################################################
# Main driver function for /explain-model endpoint
def shap_values(start=0, end=1):
    model, X_processed, X_test, task = load_model_and_test_data()

    # Build a SHAP explainer object.
    explainer = shap.Explainer(model) # Explainer class automatically detects the model type
    base_values = explainer.expected_value

    # X_test shap values will be used for global feature importances
    x_test_shap_values = explainer.shap_values(X_test) # shape: (num_rows, num_features) for regression; (num_rows, num_features, num_classes) and is an np array
    global_importances = np.abs(x_test_shap_values).mean(axis=0) # Global importance (mean absolute SHAP value across rows)

    # Entire dataset shap values will be used for local shap explanations
    X_processed_slice = X_processed[start:end]
    shap_values = explainer.shap_values(X_processed_slice)

    if task == 'regression':
        grouped_global_importances = group_global_shap_values_regression(global_importances, X_test.columns)
        local_explanations = compute_local_shap_values_regression(model, X_processed_slice, shap_values, base_values, start, end)

        return {
            "model_type": type(model).__name__,
            # "baseline": base_values,
            "global_feature_importance": grouped_global_importances,
            "local_explanations": local_explanations,
        }

    else:
        grouped_global_importances = group_global_shap_values_classification(global_importances, X_test.columns, model.classes_)
        local_explanations = compute_local_shap_values_classification(model, X_processed_slice, shap_values, base_values, start, end)

        return {
            "model_type": type(model).__name__,
            # "baseline": base_values,
            "global_feature_importance": grouped_global_importances,
            "local_explanations": local_explanations,
        }



