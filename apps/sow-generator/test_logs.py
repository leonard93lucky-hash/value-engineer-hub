import os
import sys
# add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))
from google_sheets_client import GoogleSheetsClient
from dotenv import load_dotenv

load_dotenv("backend/.env")
client = GoogleSheetsClient(os.getenv("APPS_SCRIPT_URL"))
logs = client.get_logs()
print(f"Total logs: {len(logs)}")
if logs:
    print("Keys in first log:", list(logs[0].keys()))
    for i in range(min(3, len(logs))):
        print(f"Log {i}:", {k: v for k, v in logs[i].items() if k in ["id_form", "submission_id", "enterprise_name"]})

pending = client.get_submissions()
print(f"\nTotal pending: {len(pending)}")
if pending:
    print("Keys in first pending:", list(pending[0].keys()))
    for i in range(min(3, len(pending))):
        print(f"Pending {i}:", {k: v for k, v in pending[i].items() if k in ["id_form", "submission_id", "enterprise_name"]})
