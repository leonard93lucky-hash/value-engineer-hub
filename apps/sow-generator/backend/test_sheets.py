import requests
import os
from dotenv import load_dotenv

load_dotenv()

APPS_SCRIPT_URL = os.getenv("APPS_SCRIPT_URL")

print(f"Testing URL: {APPS_SCRIPT_URL}")

def test_get_master_data():
    print("\n--- Testing Get Master Data ---")
    try:
        response = requests.get(APPS_SCRIPT_URL, params={"action": "get_master_data"})
        if response.status_code == 200:
            data = response.json()
            print("SUCCESS!")
            print(f"PIC VE Count: {len(data.get('pic_ve', []))}")
            if data['pic_ve']:
                print(f"Sample PIC VE: {data['pic_ve'][0]}")
            print(f"PIC BD Count: {len(data.get('pic_bd', []))}")
        else:
            print(f"FAILED: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

def test_get_last_number():
    print("\n--- Testing Get Last Number ---")
    try:
        response = requests.get(APPS_SCRIPT_URL, params={"action": "get_last_number", "year": 2026})
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS! Last Number: {data.get('last_urut')}")
        else:
            print(f"FAILED: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    if not APPS_SCRIPT_URL:
        print("Error: APPS_SCRIPT_URL not found in .env")
    else:
        test_get_master_data()
        test_get_last_number()
