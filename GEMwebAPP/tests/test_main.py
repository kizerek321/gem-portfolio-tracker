import pytest
from unittest.mock import MagicMock, patch
import json

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the GEM Strategy API"}

@patch("main.is_market_open_on_date")
def test_validate_market_date(mock_is_open, client):
    mock_is_open.return_value = True
    response = client.post("/api/validate-date", json={"asset": "SPY", "date": "2023-10-27"})
    assert response.status_code == 200
    assert response.json() == {"isValid": True}

@patch("main.assets", ["SPY", "BND"])
def test_gem_signal_cache_miss(client, mock_firestore, mock_redis):
    # Setup mock Firestore
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "signal": "SPY",
        "calculationDate": "2023-10-27",
        "return_12m": 0.15,
        "current_price": 420.0,
        "past_price_date": "2022-10-27",
        "past_price": 365.0
    }
    
    # Mock collection().document().get()
    mock_firestore.collection.return_value.document.return_value.get.return_value = mock_doc
    
    # Mock Redis get to return None (cache miss)
    mock_redis.get.return_value = None
    
    response = client.get("/api/gem-signal")
    
    assert response.status_code == 200
    data = response.json()
    assert data["recommended_asset"] == "SPY"
    assert data["vt_12m_return_pct"] == 15.0

@patch("main.calculate_portfolio_performance")
def test_calculate_portfolio(mock_calc, client):
    mock_calc.return_value = {"total_value": 10000, "profit": 500}
    
    transactions = [
        {"id": "1", "asset": "SPY", "amount": 10, "date": "2023-01-01"}
    ]
    
    response = client.post("/api/calculate-portfolio", json=transactions)
    
    assert response.status_code == 200
    assert response.json() == {"total_value": 10000, "profit": 500}

@patch("main.generate_portfolio_history")
def test_portfolio_history(mock_hist, client):
    mock_hist.return_value = [{"date": "2023-01-01", "value": 10000}]
    
    transactions = [
        {"id": "1", "asset": "SPY", "amount": 10, "date": "2023-01-01"}
    ]
    
    response = client.post("/api/portfolio-history", json=transactions)
    
    assert response.status_code == 200
    assert response.json() == [{"date": "2023-01-01", "value": 10000}]
