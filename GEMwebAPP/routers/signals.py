from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from dependencies import get_db

router = APIRouter(
    prefix="/api",
    tags=["Signals"],
    responses={404: {"description": "Not found"}},
)

ASSETS = ["CBU0.L", "EIMI.L", "IB01.L", "IWDA.L"]


@router.get("/gem-signal")
async def read_precalculated_gem_signal(db=Depends(get_db)) -> Dict[str, Any]:
    """
    Reads pre-calculated signals for all assets from Firestore, determines the
    asset with the highest momentum (12-month return), and returns its data.
    """
    try:
        all_signals = []
        for ticker in ASSETS:
            doc_ref = db.collection("public").document(ticker)
            doc = doc_ref.get()

            if doc.exists:
                all_signals.append(doc.to_dict())

        if not all_signals:
            raise HTTPException(
                status_code=404,
                detail="No signal data found in Firestore. Please ensure the Scala data service has run."
            )

        best_signal = max(all_signals, key=lambda s: float(s.get("return_12m", -999.0)))

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

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"CRITICAL ERROR in /gem-signal: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal Server Error: Could not process GEM signal."
        )


@router.post("/validate-date")
async def validate_market_date(payload: Dict[str, str], db=Depends(get_db)):
    """
    Checks if a specific date was a trading day for a given asset.
    Payload expects: {"asset": "IWDA.L", "date": "2023-01-01"}
    """
    asset = payload.get("asset")
    date_str = payload.get("date")

    if not asset or not date_str:
        raise HTTPException(status_code=400, detail="Missing 'asset' or 'date' in payload")

    from services.gemLogic import is_market_open_on_date

    is_open = is_market_open_on_date(db, asset, date_str)
    return {"isValid": is_open}