# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import portfolio, signals

app = FastAPI(title="GEM Strategy API")

origins = ["https://gem-portfolio-tracker.web.app",
           "http://localhost:5173",
            "http://127.0.0.1:5173",]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(portfolio.router)
app.include_router(signals.router)

@app.get("/")
def read_root():
    return {"status": "Active", "version": "2.0"}