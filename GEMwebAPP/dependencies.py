import os
import base64
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

def get_db():
    if not firebase_admin._apps:
        try:
            #firebase_creds_b64 = os.environ.get("FIREBASE_CREDENTIALS_BASE64")
            service_account_path = "firebasekey.json"

            #if firebase_creds_b64:
            #    creds_json = base64.b64decode(firebase_creds_b64).decode("utf-8")
            #    cred = credentials.Certificate(json.loads(creds_json))
            #    firebase_admin.initialize_app(cred)
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
        except Exception as e:
            print(f"Firebase Init Error: {e}")
    return firestore.client()

token_auth_scheme = HTTPBearer()

def get_current_user(cred: HTTPAuthorizationCredentials = Depends(token_auth_scheme)):
    if not cred:
        raise HTTPException(401, "No credentials")
    try:
        return auth.verify_id_token(cred.credentials)
    except Exception:
        raise HTTPException(401, "Invalid token")