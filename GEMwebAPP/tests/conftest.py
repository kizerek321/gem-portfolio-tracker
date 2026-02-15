import pytest
import unittest
from unittest.mock import MagicMock, AsyncMock
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock Firebase Admin and its submodules BEFORE importing main
mock_firebase = MagicMock()
sys.modules["firebase_admin"] = mock_firebase
sys.modules["firebase_admin.auth"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()
sys.modules["google.auth"] = MagicMock()

# Mock Redis
mock_redis_module = MagicMock()
mock_redis_client = AsyncMock()
mock_redis_module.from_url.return_value = mock_redis_client
sys.modules["redis"] = mock_redis_module
sys.modules["redis.asyncio"] = mock_redis_module

# Patch FastAPILimiter.init to avoid redis calls
mock_limiter = MagicMock()
mock_limiter.FastAPILimiter.init = AsyncMock()
sys.modules["fastapi_limiter"] = mock_limiter

# We need Request and Response for type hinting FakeRateLimiter, 
# but we can't import them from fastapi yet if fastapi depends on something we haven't mocked?
# Actually fastapi should be fine.
from fastapi import Request, Response

# Define a FakeRateLimiter that has a proper signature for FastAPI
class FakeRateLimiter:
    def __init__(self, times=1, seconds=1, **kwargs):
        pass
    
    async def __call__(self, request: Request, response: Response):
        return None

mock_depends = MagicMock()
mock_depends.RateLimiter = FakeRateLimiter
sys.modules["fastapi_limiter.depends"] = mock_depends

# Now import main
from main import app, get_current_user, get_redis
from fastapi.testclient import TestClient

@pytest.fixture
def mock_firestore():
    mock_db = MagicMock()
    # Mock the firestore client call in main.py
    with unittest.mock.patch("main.db", mock_db):
        yield mock_db

@pytest.fixture
def mock_redis():
    mock_redis_client = AsyncMock()
    return mock_redis_client

@pytest.fixture
def client(mock_redis):
    # Override the get_current_user dependency
    def mock_get_current_user():
        return {"uid": "test_user_id", "email": "test@example.com"}

    # Override the get_redis dependency
    async def mock_get_redis_dep():
        return mock_redis

    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[get_redis] = mock_get_redis_dep
    
    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()
