# 🚀 GEM Portfolio Tracker

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
| **Cloud & Deployment** | ![Google Cloud Badge](https://img.shields.io/badge/Google_Cloud-4285F4?logo=googlecloud&logoColor=white) (Cloud Run, Cloud Scheduler) & Firebase Hosting |

---

## 🌊 Architecture & Data Flow

The application is split into two primary data flows: a daily asynchronous pipeline for the public signal and a real-time synchronous flow for user portfolio calculations.

### 1. Asynchronous Daily Signal Calculation

This pipeline runs automatically once a day to efficiently calculate the public GEM signal without relying on live API calls for every user.



1.  **Trigger (Cloud Scheduler):** ⏰ A scheduled job kicks off the process once every 24 hours.
2.  **Data Service (Scala on Cloud Run):** ⚙️ The Scala microservice wakes up and fetches **only the single latest daily price** for the target asset ('VT') from the **Alpha Vantage API**.
3.  **Data Update (Firestore):** 💾 The service reads a document containing the last ~13 months of historical prices from Firestore, adds the new price, and removes the oldest one.
4.  **Calculation:** 💡 Using this complete historical dataset, the Scala service performs the 12-month return calculation to determine the GEM signal ('VT' or 'BND').
5.  **Result Storage (Firestore):** ✅ The final, simple result (e.g., `{"signal": "VT", "return": 0.1816}`) is written to a public document in Firestore.

### 2. Synchronous User Portfolio Calculation

This flow happens instantly whenever a logged-in user views their dashboard.

1.  **Initial Load (React Frontend):** 💻 The user's browser loads the portfolio dashboard. It reads the raw transaction list (e.g., `date`, `amount`, `asset`) directly from a secure **Firestore** collection.
2.  **Secure API Call (React -> Python API):** 🔐 The frontend gets a secure ID Token from Firebase Auth and sends the raw transaction list to the **Python API** on Cloud Run.
3.  **Live Price Fetching (Python API):** 🐍 The Python API receives the request, validates the user's token, and uses the `yfinance` library to fetch the **current market price** for all assets in the user's portfolio.
4.  **Calculation:** 🧠 The API calculates the current value and profit/loss for each transaction.
5.  **Response & Display:** ✅ The API sends the enriched data back to the React frontend, which then updates the state and displays the final, calculated values to the user.

---

## 🏁 Getting Started

To run this project locally, you will need to set up both the frontend and the backend environments.

### Prerequisites

* Node.js and npm
* Python 3.10+ and pip
* Scala and SBT
* A Firebase project with Authentication and Firestore enabled.

### Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    ```

2.  **Frontend Setup (`gem-frontend-vite`):**
    * Navigate to the frontend directory.
    * Create a `.env` file and populate it with your Firebase project keys (use `.env.example` as a template).
    * Install dependencies: `npm install`
    * Run the development server: `npm run dev`

3.  **Backend Setup (`GEMwebAPP` & `scala-data-service`):**
    * Place your Firebase `serviceAccountKey.json` in both the Python and Scala project root directories.
    * **Python API:**
        * Navigate to the `GEMwebAPP` directory.
        * Create and activate a virtual environment: `python -m venv venv` and `.\venv\Scripts\activate`
        * Install dependencies: `pip install -r requirements.txt`
        * Run the server: `uvicorn main:app --reload`
    * **Scala Service:**
        * Navigate to the `scala-data-service` directory.
        * Add your Alpha Vantage API key to `DataFetcher.scala`.
        * Run the one-time backfill: `sbt "run backfill"`
        * Run a daily update manually: `sbt run`

