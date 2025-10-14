from datetime import datetime, timedelta

# Define the assets your application tracks
assets = ["CBU0.L", "CNDX.L", "EIMI.L", "IB01.L", "IWDA.L", "SMH.L"]

def _get_price_on_or_after(db, asset: str, date_str: str):
    """
    Helper function to get the price for an asset on a specific date from Firestore.
    If the date is not a trading day, it checks the next few days.
    This version is updated for the new /years/{year}/months/{month} structure.
    """
    current_date = datetime.strptime(date_str, '%Y-%m-%d')
    # Look ahead up to 7 days to find the next trading day
    for i in range(7):
        check_date = current_date + timedelta(days=i)
        check_date_str = check_date.strftime('%Y-%m-%d')
        year = check_date.strftime('%Y')
        # Format month with leading zero (e.g., "01", "09", "12")
        month = check_date.strftime('%m')

        try:
            # Construct the new, more specific path to the monthly document
            month_doc_ref = db.collection("historicalData").document(asset).collection("years").document(year).collection("months").document(month)
            month_doc = month_doc_ref.get()

            if month_doc.exists:
                prices = month_doc.to_dict().get("prices", {})
                if check_date_str in prices:
                    # Found the price, return it and the actual date
                    return float(prices[check_date_str]), check_date_str
        except Exception as e:
            print(f"Warning: Could not query Firestore for {asset} on {check_date_str}. Error: {e}")
            continue # Try the next day

    # If no price is found after checking a week
    return None, None


def calculate_portfolio_performance(db, transactions: list):
    """
    Calculates the current value and profit/loss for a list of transactions
    using data from Firestore.
    (This function does not need to change as it uses the updated helper function)
    """
    try:
        all_tickers = list(set([tx['asset'] for tx in transactions]))
        current_prices = {}

        # 1. Get the most recent price for all assets from the 'public' collection
        for ticker in all_tickers:
            signal_ref = db.collection("public").document(ticker)
            signal_doc = signal_ref.get()
            if signal_doc.exists:
                current_prices[ticker] = float(signal_doc.to_dict().get("current_price"))
            else:
                print(f"Warning: Could not find current price for {ticker} in Firestore. It will be excluded.")
                current_prices[ticker] = None

        enriched_transactions = []
        for tx in transactions:
            asset = tx['asset']
            amount_invested = tx['amount']

            if current_prices.get(asset) is None:
                tx['currentValue'] = "N/A"
                tx['profitLoss'] = "N/A"
                enriched_transactions.append(tx)
                continue

            # 2. Get the historical price using our updated helper function
            price_on_date, actual_date = _get_price_on_or_after(db, asset, tx['date'])

            if price_on_date is None:
                print(f"Error: Could not find historical price for {asset} on or after {tx['date']}.")
                tx['currentValue'] = "Error"
                tx['profitLoss'] = "Error"
                enriched_transactions.append(tx)
                continue

            # 3. Perform calculations
            current_price = current_prices[asset]
            current_value = (current_price / price_on_date) * amount_invested
            profit_loss = current_value - amount_invested

            # 4. Add calculated fields to the transaction
            tx['currentValue'] = current_value
            tx['profitLoss'] = profit_loss
            enriched_transactions.append(tx)

        return enriched_transactions

    except Exception as e:
        print(f"Error during portfolio calculation: {e}")
        return transactions


def is_market_open_on_date(db, asset: str, date_str: str):
    """
    Checks if the market for a given asset was open on a specific date
    by checking for a price entry in the new Firestore structure.
    """
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        year = date_obj.strftime('%Y')
        month = date_obj.strftime('%m') # Format month with leading zero

        # Construct the path to the specific month document
        month_doc_ref = db.collection("historicalData").document(asset).collection("years").document(year).collection("months").document(month)
        month_doc = month_doc_ref.get()

        if month_doc.exists:
            prices = month_doc.to_dict().get("prices", {})
            # Return True if the date exists as a key in the prices map
            return date_str in prices
        else:
            # If the month document doesn't exist, the date can't be valid
            return False
    except Exception as e:
        print(f"Error checking market date in Firestore: {e}")
        return False # Assume closed if any error occurs