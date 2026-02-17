from fastapi import APIRouter, Depends
from typing import List
from dependencies import get_db, get_current_user
from services.gemLogic import calculate_portfolio_performance, generate_portfolio_history
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["Portfolio"])

class Transaction(BaseModel):
    id: str
    asset: str
    amount: float
    date: str

@router.post("/calculate-portfolio")
async def calculate(
    transactions: List[Transaction],
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    # Convert Pydantic models to dict for your existing logic
    tx_list = [tx.dict() for tx in transactions]
    return calculate_portfolio_performance(db, tx_list)

@router.post("/portfolio-history")
async def history(
    transactions: List[Transaction],
    user=Depends(get_current_user),
    db=Depends(get_db)
):
    tx_list = [tx.dict() for tx in transactions]
    return generate_portfolio_history(db, tx_list)