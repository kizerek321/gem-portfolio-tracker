import os
import base64
import json
from typing import List

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemLogic import calculate_portfolio_performance, is_market_open_on_date, assets, generate_portfolio_history


def initialize_firebase():
    """Initializes Firebase Admin SDK from Env Var or Local File."""
    try:
        firebase_creds_b64 = os.environ.get("FIREBASE_CREDENTIALS_BASE64")
        if firebase_creds_b64:
            creds_json = base64.b64decode(firebase_creds_b64).decode("utf-8")
            creds_dict = json.loads(creds_json)
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase: Initialized from Environment Variable.")
        else:
            firebase_admin.initialize_app()
            print("Firebase: Initialized from Default Credentials.")
    except Exception as e:
        print(f"CRITICAL: Firebase initialization failed: {e}")
        pass

initialize_firebase()
db = firestore.client()

app = FastAPI(title="GEM Strategy API")

allowed_origins_str = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "https://gem-portfolio-tracker.web.app,"
    "http://localhost:5173"
)

origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DateValidationRequest(BaseModel):
    asset: str
    date: str

class Transaction(BaseModel):
    id: str
    asset: str
    amount: float
    date: str

# --- Authentication ---
token_auth_scheme = HTTPBearer()

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
        raise HTTPException(status_code=401, detail="Invalid authentication credentials.")

# --- API Endpoints ---
@app.get("/")
async def read_root():
    return {"message": "Welcome to the GEM Strategy API"}

@app.post("/api/validate-date")
async def validate_market_date(request: DateValidationRequest):
    """
    Checks if a price exists for the given asset on the provided date in Firestore.
    """
    is_open = is_market_open_on_date(db, request.asset, request.date)
    return {"isValid": is_open}


@app.get("/api/gem-signal")
async def read_precalculated_gem_signal():
    """
    Reads pre-calculated signals for all assets from Firestore, determines the
    asset with the highest momentum, and returns its data.
    """
    try:
        all_signals = []
        for ticker in assets:
            signal_ref = db.collection("public").document(ticker)
            signal_doc = signal_ref.get()
            if signal_doc.exists:
                all_signals.append(signal_doc.to_dict())

        if not all_signals:
            raise HTTPException(status_code=404, detail="No signal data found. Please run the Scala data service.")

        best_signal = max(all_signals, key=lambda s: float(s.get("return_12m", -999)))

        formatted_data = {
            "recommended_asset": best_signal.get("signal"),
            "signal_date": best_signal.get("calculationDate"),
            "vt_12m_return_pct": float(best_signal.get("return_12m", 0.0)) * 100,
            "calculation_details": {
                "current_price": best_signal.get("current_price", "N/A"),
                "past_price_date": best_signal.get("past_price_date", "N/A"),
                "past_price": best_signal.get("past_price", "N/A"),
            },
            "signal": best_signal.get("signal"),
            "risk_on_asset": best_signal.get("signal"),
        }
        return formatted_data

    except Exception as e:
        print(f"Error processing signals from Firestore: {e}")
        raise HTTPException(status_code=500, detail="Could not process GEM signal from the database.")

@app.post("/api/calculate-portfolio")
async def calculate_portfolio(transactions: List[Transaction], user=Depends(get_current_user)):
    """
    Protected endpoint. Calculates portfolio performance using data from Firestore.
    """
    print(f"Processing portfolio for user: {user['uid']}")
    transaction_list = [tx.dict() for tx in transactions]
    # Pass the db instance to the calculation function
    return calculate_portfolio_performance(db, transaction_list)

@app.post("/api/portfolio-history")
async def calculate_portfolio_history(transactions: List[Transaction], user=Depends(get_current_user)):
    """
    Protected endpoint. Generates a day-by-day history of the portfolio's value and profit.
    """
    transaction_list = [tx.dict() for tx in transactions]
    return generate_portfolio_history(db, transaction_list)
