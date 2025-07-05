from fastapi import UploadFile
import pandas as pd
import os
import io
from pandas.api.types import is_numeric_dtype, is_string_dtype, is_categorical_dtype

def detect_column_types(df: pd.DataFrame) -> dict:
    result = {
        "numeric": [],
        "categorical": []
    }

    for col in df.columns:
        series = df[col]
        nunique = series.nunique()

        # Step 1: If it's already numeric
        if pd.api.types.is_numeric_dtype(series):
            if nunique > 15:
                result["numeric"].append(col)
            else:
                result["categorical"].append(col)

        # Step 2: If it's string or categorical type
        elif pd.api.types.is_string_dtype(series) or pd.api.types.is_categorical_dtype(series):
            result["categorical"].append(col)

        # Step 3: Try to coerce to numeric (e.g., object that looks like numbers)
        else:
            coerced = pd.to_numeric(series, errors='coerce')
            valid_ratio = coerced.notnull().sum() / len(series)

            if valid_ratio > 0.8:  # It's mostly coercible to numeric
                if coerced.nunique() > 15:
                    result["numeric"].append(col)
                else:
                    result["categorical"].append(col)
            else:
                result["categorical"].append(col)

    return result



# function takes in the CSV file (of type FastAPI UploadFile) and returns a dataframe
def read_uploaded_csv(file: UploadFile) -> pd.DataFrame: 
    try:
        contents = file.file.read()
        df = pd.read_csv(io.BytesIO(contents)) # io.BytesIO(contents) -> wrapping the raw bytes in a file-like object in memory
        return df
    except Exception as e:
        raise ValueError(f"Error reading CSV: {str(e)}")


def validate_dataframe(df: pd.DataFrame) -> dict:
    # Deal with errors first
    if df.shape[0] < 10:
        raise ValueError("Too few rows.")
    if df.shape[1] < 2:
        raise ValueError("Too few columns.")
    if df.isnull().all().all():
        raise ValueError("Dataframe contains only null values.")
    # Note: Pandas unable to read the file is handled by the read_uploaded_csv function

    # Detect column types
    column_types = detect_column_types(df)
    warnings = []
    # Look for null/missing values anywhere in the dataframe
    if df.isnull().sum().any():
        warnings.append("Contains null values")
    
    total_nulls = int(df.isnull().sum().sum())

    
    # Same values for all rows in a column doesn't add any value while predicting
    constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
    if constant_cols:
        warnings.append(f"Constant or empty columns: {constant_cols}")
    
    high_cardinality, likely_ids = check_high_cardinality_and_identifiers(df)
    if high_cardinality:
        warnings.append(f"High cardinality columns: {high_cardinality}")
    if likely_ids:
        warnings.append(f"Likely identifier columns: {likely_ids}")

    # Target candidates are columns that have more than 1 unique value and less than 90% of the rows are unique
    # Unique columns like identifiers doesn't help either. So primary identifiers like ID, Name, etc. are filtered out

    target_candidates = [col for col in df.columns if df[col].nunique() > 1 and df[col].nunique() < df.shape[0] * 0.9]

    return {
        "columns": df.columns.tolist(),
        "column_types": column_types,
        "row_count": df.shape[0],
        "missing_values": total_nulls,
        "column_count": df.shape[1],
        "target_candidates": target_candidates,
        "warnings": warnings
    }

def check_high_cardinality_and_identifiers(df: pd.DataFrame) -> tuple:
    high_cardinality = []
    likely_ids = []
    identifier_keywords = ["id", "uuid", "name", "code", "ref", "number"]

    for col in df.columns:
        nunique = df[col].nunique()
        total = len(df)
        # High cardinality: >90% unique values
        if nunique > 0.9 * total:
            high_cardinality.append(col)
            # Further check if it likely represents an identifier (initial template logic to filter out identifiers). Obviously, likely_ids is a subset of high_cardinality
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in identifier_keywords):
                likely_ids.append(col)

    return high_cardinality, likely_ids



