# 🚀 GEM Portfolio Tracker
https://gem-portfolio-tracker.web.app
A full-stack, polyglot web application designed to provide investment signals based on the **Global Equity Momentum (GEM)** strategy. This project was built to practice and demonstrate advanced skills in multi-language backend development, cloud deployment, and data pipeline logic.

---

## ✨ Key Features

* **Public GEM Signal:** A clean, public-facing dashboard that displays the current investment signal for any visitor.
* **User Authentication:** Secure sign-up and login functionality using Firebase Authentication.
* **Portfolio Management:** Logged-in users can create and manage a personal portfolio by adding their investment transactions.
* **Live Performance Tracking:** A secure API calculates and displays the current value and profit/loss for each investment in the user's portfolio in real-time.

---

## 🛠️ Technology Stack

This project utilizes a modern, microservice-based architecture with a clear separation of concerns.

| Category                | Technology                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![React Badge](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black) ![Vite Badge](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS Badge](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) |
| **Backend API** | ![Python Badge](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![FastAPI Badge](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Docker Badge](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) |
| **Data Processing Service** | ![Scala Badge](https://img.shields.io/badge/Scala-DC322F?logo=scala&logoColor=white) ![SBT Badge](https://img.shields.io/badge/SBT-262626?logo=sbt&logoColor=white) ![Docker Badge](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) |
| **Database & Auth** | ![Firebase Badge](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)                |
| **Cloud & Deployment** | ![Google Cloud Badge](https://img.shields.io/badge/Google_Cloud-4285F4?logo=googlecloud&logoColor=white) (Cloud Run, Cloud Scheduler, serverless VPC access, Memorystore for redis) & (Firebase Hosting, Firebase NoSQL DB)  |

---

## 🌊 Architecture & Data Flow

The application is split into two primary data flows: a daily asynchronous pipeline for the public signal and a real-time synchronous flow for user portfolio calculations.

### 1. Asynchronous Daily Signal Calculation

This pipeline runs automatically once a day to efficiently calculate the public GEM signal without relying on live API calls for every user.



1.  **Trigger (Cloud Scheduler):** ⏰ A scheduled job kicks off the process once every 24 hours.
2.  **Data Service (Scala on Cloud Run):** ⚙️ The Scala microservice wakes up and fetches **only the single latest daily price** for the target assets ('IWDA.L', 'CBU0.L', 'EIMI.L', 'IB01.L') from the **Alpha Vantage API**.
3.  **Data Update (Firestore):** 💾 The service adds the new price to historical data base in FireStore
4.  **Calculation:** 💡 Using this complete historical dataset, the Scala service performs the 12-month return calculation to determine the GEM signal ('RISK-ON' - (ETFs on global markets : 'IWDA.L' or 'EIMI.L') or 'RISK-OFF - (Bonds: 'CBU0.L' or 'IB01.L')).
5.  **Result Storage (Firestore):** ✅ The final result is written to a public document in Firestore.

### 2. User Portfolio Calculation (Synchronous)

This flow describes two separate, synchronous API calls a logged-in user's browser makes to the Python backend to populate their portfolio dashboard.

#### Flow A: Current Portfolio Value (Endpoint: `/api/calculate-portfolio`)

This flow happens when the user loads their dashboard to see the *current* value and profit/loss of their individual investments.

1.  **Initial Load (React Frontend):** 💻 The user's browser loads the portfolio dashboard. It's assumed to read the user's raw transaction list (e.g., `date`, `amount`, `asset`) from a secure Firestore collection.
2.  **Secure API Call (React -> Python API):** 🔐 The frontend gets a secure ID Token from Firebase Auth and sends the *raw transaction list* in the request body to the **Python (FastAPI) API**'s `/api/calculate-portfolio` endpoint.
3.  **Authentication & Data Fetching (Python API):** 🐍 The API validates the user's Firebase token. It then performs two distinct data-fetching operations from Firestore:
    * **Current Prices:** It fetches the *most recent price* for all unique assets in the user's portfolio from the `public` collection (e.g., `db.collection("public").document("IWDA.L")`). This data is assumed to be pre-calculated and kept up-to-date by a separate service.
    * **Historical (Purchase) Prices:** For *each* transaction, the API calls the `_get_price_on_or_after` helper function. This function queries the `historicalData` collection (e.g., `historicalData/IWDA.L/years/2023/months/05`) to find the price on the *actual* date of the transaction. It includes logic to look forward up to 7 days to find the next available trading day if the purchase date was a weekend or holiday.
4.  **Calculation:** 🧠 Using the *purchase price* from `historicalData` and the *current price* from `public`, the API calculates the `currentValue` and `profitLoss` for each individual transaction.
5.  **Response & Display:** ✅ The API sends the *enriched* list of transactions (now with `currentValue` and `profitLoss` fields) back to the React frontend, which displays the final, calculated values in the user's dashboard.

---

#### Flow B: Historical Portfolio Performance (Endpoint: `/api/portfolio-history`)

This flow happens when the user's dashboard needs to render the *historical performance chart*, showing the portfolio's value over time.

1.  **Secure API Call (React -> Python API):** 🔐 The frontend sends the *exact same* raw transaction list along with the Firebase ID Token to the `/api/portfolio-history` endpoint.
2.  **Authentication & Bulk Data Fetch (Python API):** 🐍 The API validates the token. It determines the earliest transaction date and all unique assets. It then calls `_get_all_historical_prices` to perform an *efficient bulk fetch* of all daily prices for all assets from that start date to the present. This minimizes Firestore reads by fetching entire month-documents (e.g., `.../months/05`, `.../months/06`, etc.) at once.
3.  **Data Processing & Share Calculation:** 📊 The API uses `pandas` to combine all fetched monthly data into a single time series for each asset. It **forward-fills** any missing dates (weekends/holidays) to ensure there is a price for every single day. Using this complete price history, it calculates the number of *shares* purchased in each transaction.
4.  **Daily History Generation:** 🗓️ The API iterates day-by-day from the user's first transaction to today. On each day, it:
    * Calculates the total `totalInvested` by summing up transactions up to that date.
    * Calculates the total `portfolioValue` by multiplying the *total held shares* of each asset by that specific *day's historical price*.
    * Calculates the `cumulativeProfit` (`portfolioValue - totalInvested`).
5.  **Response & Display:** ✅ The API returns a large array of daily data points (e.g., `[{date, portfolioValue, totalInvested, cumulativeProfit}, ...]`), which the React frontend uses to render the historical performance chart.
