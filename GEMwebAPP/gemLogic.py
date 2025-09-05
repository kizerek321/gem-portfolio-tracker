import yfinance as yf
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import pandas as pd

# Define the tickers for our strategy
RISK_ON_ASSET = 'VT'  # Vanguard Total World Stock ETF
RISK_OFF_ASSET = 'BND'  # Vanguard Total Bond Market ETF


def get_gem_signal():
    """
    Calculates the Global Equity Momentum signal.

    The strategy is simple:
    1. Look at the total return of the risk-on asset (VT) over the last 12 months.
    2. If the return is positive, the signal is to invest in the risk-on asset.
    3. If the return is zero or negative, the signal is to invest in the risk-off asset.

    Returns:
        dict: A dictionary containing the recommended asset ticker, the strategy name,
              the 12-month return of the risk-on asset, and the date the signal was calculated.
    """
    print("Fetching data to calculate GEM signal...")

    try:
        # 1. Define the date range: today and 12 months ago.
        # We actually need ~13 months of data to ensure we get a valid price for the start date.
        end_date = datetime.now()
        start_date = end_date - relativedelta(months=12)

        # 2. Fetch historical data for the risk-on asset.
        # We only need the data for VT to calculate the signal.
        # auto_adjust=True tells yfinance to give us prices adjusted for dividends and splits,
        # which is crucial for accurate return calculations.
        vt_data = yf.download(RISK_ON_ASSET, start=start_date, end=end_date, progress=False, auto_adjust=True)

        if vt_data.empty:
            return {"error": f"Could not download data for {RISK_ON_ASSET}."}

        # 3. Find the closest available trading days for our start and end points.
        # Get the last available price (our 'current' price).
        # With auto_adjust=True, 'Close' is the adjusted closing price.
        price_today = float(vt_data['Close'].iloc[-1])
        date_today = vt_data.index[-1].strftime('%Y-%m-%d')
        # Find the price from 12 months ago
        date_12_months_ago = end_date - relativedelta(months=12)
        # Find the closest trading day in the past to our target 12-month-ago date
        past_date_index = vt_data.index.get_indexer([date_12_months_ago], method='pad')[0]
        price_12_months_ago = float(vt_data['Close'].iloc[past_date_index])
        date_12_months_ago_actual = vt_data.index[past_date_index].strftime('%Y-%m-%d')

        # 4. Calculate the 12-month return.
        momentum_return = (price_today / price_12_months_ago) - 1
        momentum_return_pct = momentum_return * 100
        # 5. Apply the GEM strategy rule.
        if momentum_return > 0:
            recommended_asset = RISK_ON_ASSET
        else:
            recommended_asset = RISK_OFF_ASSET
        print(f"Signal calculated successfully for {date_today}.")

        # 6. Return the result in a structured format.
        return {
            "strategy": "Global Equity Momentum (GEM)",
            "signal_date": date_today,
            "recommended_asset": recommended_asset,
            "vt_12m_return_pct": round(momentum_return_pct, 2),
            "calculation_details": {
                "current_price": round(price_today, 2),
                "current_price_date": date_today,
                "past_price": round(price_12_months_ago, 2),
                "past_price_date": date_12_months_ago_actual,
            }
        }

    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": str(e)}


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
            amount_invested = tx['amount']

            # Fetch historical data for the specific asset around the investment date
            hist_data = yf.download(asset, start=investment_date,
                                    end=(datetime.strptime(investment_date, '%Y-%m-%d') + timedelta(days=5)).strftime(
                                        '%Y-%m-%d'), auto_adjust=True)
            price_on_date = hist_data['Close'].iloc[0]

            # Perform calculations
            shares_bought = amount_invested / price_on_date
            current_value = shares_bought * current_prices[asset]
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


