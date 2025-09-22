import firebase_admin
from firebase_admin import credentials, auth
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from gemLogic import get_gem_signal, calculate_portfolio_performance, is_market_open_on_date

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"!!! CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
    print("!!! Make sure 'serviceAccountKey.json' is in the correct directory.")
app = FastAPI()

origins = [
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

class DateValidationRequest(BaseModel):
    asset: str
    date: str

class Transaction(BaseModel):
    id: str
    asset: str
    amount: float
    date: str

token_auth_scheme = HTTPBearer()

@app.post("/api/validate-date")
async def validate_market_date(request: DateValidationRequest):
    """
    Checks if the market for a given asset was open on the provided date.
    """

    is_open = is_market_open_on_date(request.asset, request.date)
    return {"isValid": is_open}

def get_current_user(cred: HTTPAuthorizationCredentials = Depends(token_auth_scheme)):
    """
    Dependency that verifies the Firebase ID token and returns the user's UID.
    """
    if cred is None:
        raise HTTPException(status_code=401, detail="Bearer authentication required.")

    try:
        token = cred.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"!!! FIREBASE AUTHENTICATION ERROR: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials. See server logs for details.")

@app.get("/api/gem-signal")
async def read_gem_signal():
    """
    This is API endpoint.
    When a GET request is made to '/api/gem-signal', this function will be called.
    It runs core logic from gem_logic.py and returns the result.
    FastAPI automatically converts the Python dictionary into JSON format for the response.
    """
    signal = get_gem_signal()
    return signal

@app.get("/")
async def read_root():
    return {"message": "Welcome to the GEM Strategy API"}


@app.post("/api/calculate-portfolio")
async def calculate_portfolio(transactions: List[Transaction], user=Depends(get_current_user)):
    """
    Protected endpoint.
    Receives a list of transactions, calculates their performance, and returns the enriched list.
    The user dependency ensures only authenticated users can access this.
    """
    # Convert Pydantic models back to a list of dicts for the calculation function
    transaction_list = [tx.dict() for tx in transactions]
    #logging the user's UID for auditing is possible, e.g., print(f"Processing for user: {user['uid']}")
    print(user)
    print(transaction_list)
    print(f"Processing for user: {user['uid']}")
    return calculate_portfolio_performance(transaction_list)