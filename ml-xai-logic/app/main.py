from fastapi import FastAPI # class used to create my web application
from app.routes import controller
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="ML Prediction Explanation Interface") # Initializing my app as an instance of the FastAPI class

# Added to fix CORS middleware issue
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080", # Vite dev server
        "https://mlpeek.vercel.app", # Vercel frontend
        ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(controller.router)
@app.get("/") # route decorator - home page of API
def read_root():
    return {
        "message": "API is working"
        }

# uvicorn app.main:app --reload 
'''
    uvicorn --> The ASGI server that runs your app

'''
