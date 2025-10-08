import yfinance as yf
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd

# Define the tickers for our strategy
RISK_ON_ASSET = 'VT'  # Vanguard Total World Stock ETF
RISK_OFF_ASSET = 'BND'  # Vanguard Total Bond Market ETF

def calculate_portfolio_performance(transactions: list):
    """
    Calculates the current value and profit/loss for a list of transactions.
    """
    try:
        all_tickers = list(set([tx['asset'] for tx in transactions]))

        # Get the most recent trading data for all unique assets in the portfolio
        data = yf.download(all_tickers, period="5d", auto_adjust=True)
        current_prices = {ticker: data['Close'][ticker].iloc[-1] for ticker in all_tickers}

        enriched_transactions = []
        for tx in transactions:
            asset = tx['asset']
            investment_date = tx['date']
            investment_date_str = tx['date']
            start_date = datetime.strptime(investment_date_str, '%Y-%m-%d')
            end_date = start_date + timedelta(days=5)
            amount_invested = tx['amount']

            # Fetch historical data for the specific asset around the investment date
            hist_data = yf.download(asset, start=start_date.strftime('%Y-%m-%d'),
                                    end=end_date.strftime('%Y-%m-%d'),
                                    auto_adjust=True,
                                    progress=False)
            price_on_date = float(hist_data['Close'].iloc[0])

            # Perform calculations
            current_value = current_prices[asset] / price_on_date * amount_invested
            profit_loss = current_value - amount_invested

            # Add calculated fields to the transaction
            tx['currentValue'] = current_value
            tx['profitLoss'] = profit_loss
            enriched_transactions.append(tx)

        return enriched_transactions

    except Exception as e:
        print(f"Error during portfolio calculation: {e}")
        # In case of an error, return the original transactions
        return transactions

def is_market_open_on_date(asset: str, date_str: str):
    """
    Checks if the market for a given asset was open on a specific date by fetching data for that day.
    """
    try:
        # Fetch data for a single day. yfinance is start-date inclusive.
        data = yf.download(asset, start=date_str, period="1d", progress=False)
        # If the returned DataFrame is empty, the market was closed.
        return not data.empty
    except Exception:
        return False # Assume closed if any error occurs

if __name__ == '__main__':
    # This block runs when you execute the script directly
    signal_result = get_gem_signal()

    # Pretty print the result
    import json

    print("\n--- GEM Signal Result ---")
    print(json.dumps(signal_result, indent=2))
    print("-----------------------\n")

    if 'recommended_asset' in signal_result:
        print(
            f"Based on the 12-month return of {signal_result['vt_12m_return_pct']}%, the recommended asset is: {signal_result['recommended_asset']}")
    print(calculate_portfolio_performance([{'id': 'IJcFwc43rtHY8alo2Evi', 'asset': 'VT', 'amount': 10000.0, 'date': '2025-01-09'}, {'id': 'TKn4343xg76QuOY91Pmk', 'asset': 'VT', 'amount': 100.0, 'date': '2025-06-04'}]))