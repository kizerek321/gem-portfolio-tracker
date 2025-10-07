import firebase_admin
from firebase_admin import credentials, auth, firestore # Add firestore import
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from gemLogic import calculate_portfolio_performance, is_market_open_on_date

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"!!! CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
    print("!!! Make sure 'serviceAccountKey.json' is in the correct directory.")
app = FastAPI()

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

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
def get_current_user(cred: HTTPAuthorizationCredentials = Depends(token_auth_scheme)):
    try:
        token = cred.credentials
        return auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid auth credentials: {e}")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the GEM Strategy API"}

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
async def read_precalculated_gem_signal():
    """
    Reads the pre-calculated GEM signal directly from Firestore.
    This is much faster and more reliable than calculating it on the fly.
    """
    try:
        # 1. Get a reference to the document created by our Scala service
        signal_ref = db.collection("public").document("gemSignal")
        signal_doc = signal_ref.get()

        if not signal_doc.exists:
            raise HTTPException(status_code=404, detail="Signal data not found. Please run the Scala data service.")

        signal_data = signal_doc.to_dict()

        # 2. Format the data to perfectly match what the React frontend expects
        formatted_data = {
            "recommended_asset": signal_data.get("signal"),
            "signal_date": signal_data.get("calculationDate"),
            "vt_12m_return_pct": float(signal_data.get("return_12m", 0.0)) * 100,
            "calculation_details": {
                "current_price": "N/A",
                "past_price_date": "N/A",
                "past_price": "N/A",
            },
            "signal": signal_data.get("signal"),
            "risk_on_asset": "VT",
        }
        print(formatted_data)
        return formatted_data

    except Exception as e:
        print(f"Error fetching signal from Firestore: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch GEM signal from the database.")

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