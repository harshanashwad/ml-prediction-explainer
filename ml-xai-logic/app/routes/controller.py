'''
The API layer. It defines what API endpoints exist and what they trigger. 

This is where the API routes live.
'''
import os
from fastapi import APIRouter, UploadFile, HTTPException, Query
from app.utils.io import read_uploaded_csv, validate_dataframe
from pydantic import BaseModel
import pandas as pd
from app.ml_core.train import train_model
from app.ml_core.explain import shap_values

router = APIRouter() # Create a router instance. Lets you modularize routes — good for scaling APIs.

@router.post("/upload-csv") # define a POST endpoint at /upload-csv. Expects a file in request body
async def upload_csv(file: UploadFile):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        # Create directories if they don't exist
        os.makedirs("data", exist_ok=True)
        os.makedirs("artifacts", exist_ok=True)

        df = read_uploaded_csv(file)
        validation = validate_dataframe(df)

        # Optional: Save it for reuse. If you observe corrupted csv files are mostly handled in except block so it's not even saved temporarily. It means in many cases, corrupted files are (mostly) not even allowed to enter the pipeline let alone dealing with that in a later step.
        df.to_csv("data/last_uploaded.csv", index=False)
        df.to_csv("artifacts/uploaded_dataset.csv", index=False)

        return validation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

'''
Pydantic model for the request body: 
Incoming json request is parsed into a TrainRequest object by FastAPI. 
This keeps the code clean and secure — no manual request.json()["target"] or checks.
'''

class TrainRequest(BaseModel):
    target: str

@router.post("/train-model")
async def train_endpoint(request: TrainRequest):
    try:
        df = pd.read_csv("data/last_uploaded.csv")
        if request.target not in df.columns:
            raise HTTPException(status_code=400, detail="Invalid target column")
        
        result = train_model(df, request.target)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Query parameters are are specified in the URL after a ?. so if not provided, it will default to 0 and 5.
@router.get("/explain-model")
async def explain_endpoint(start: int = Query(0), end: int = Query(1)):
    try:
        return shap_values(start, end)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))