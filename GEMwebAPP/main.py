import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Import the refactored functions and the assets list
from gemLogic import calculate_portfolio_performance, is_market_open_on_date, assets, generate_portfolio_history

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"!!! CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
    print("!!! Make sure 'serviceAccountKey.json' is in the correct directory.")
    exit()

app = FastAPI()

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
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
        # 1. Fetch the signal document for every asset
        for ticker in assets:
            signal_ref = db.collection("public").document(ticker)
            signal_doc = signal_ref.get()
            if signal_doc.exists:
                all_signals.append(signal_doc.to_dict())

        if not all_signals:
            raise HTTPException(status_code=404, detail="No signal data found. Please run the Scala data service.")

        # 2. Find the asset with the highest 12-month return
        # Your Scala app stores return_12m as a string, so we cast to float
        best_signal = max(all_signals, key=lambda s: float(s.get("return_12m", -999)))

        # 3. Format the data from the winning asset to match the frontend's expectation
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
            "risk_on_asset": best_signal.get("signal"), # The winning asset is the risk-on asset
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
    print("api called")
    transaction_list = [tx.dict() for tx in transactions]
    return generate_portfolio_history(db, transaction_list)
