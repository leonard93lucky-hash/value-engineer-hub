import requests
import json
import os
import base64
from typing import Dict, List, Any, Optional

class GoogleSheetsClient:
    def __init__(self, script_url: str):
        self.script_url = script_url
        if not self.script_url:
            raise ValueError("APPS_SCRIPT_URL environment variable is not set")

    def get_master_data(self) -> Dict[str, List[Dict[str, Any]]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_master_data"}, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching master data: {e}")
            return {"pic_ve": [], "pic_bd": []}

    def get_last_number(self, year: int) -> int:
        try:
            import time
            response = requests.get(
                self.script_url,
                params={"action": "get_last_number", "year": year, "_t": int(time.time())},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data.get("last_urut", 0)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching last number: {e}")
            return 0

    def save_log(self, data: Dict[str, Any]) -> bool:
        try:
            payload = { "action": "save_log", **data }
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error saving log: {e}")
            return False

    def send_email(self, to: str, subject: str, body: str, file_path: str) -> bool:
        try:
            if not os.path.exists(file_path):
                print(f"File not found for email: {file_path}")
                return False

            with open(file_path, "rb") as f:
                file_content = f.read()
                file_base64 = base64.b64encode(file_content).decode('utf-8')

            filename = os.path.basename(file_path)
            
            payload = {
                "action": "send_email",
                "to": to,
                "subject": subject,
                "body": body,
                "filename": filename,
                "file_content_base64": file_base64
            }
            
            response = requests.post(self.script_url, json=payload, timeout=60)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (Exception, ValueError) as e:
            print(f"Error sending email: {str(e)}")
            return False

    def save_draft(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            payload = {"action": "save_draft", **data}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("status") != "success":
                raise ValueError(f"API Error save_draft: {res_data}")
            return res_data
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error saving draft: {e}")
            raise

    def get_submissions(self) -> List[Dict[str, Any]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_submissions"}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("submissions", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching submissions: {e}")
            return []

    def update_submission(self, submission_id: str, data: Dict[str, Any]) -> bool:
        try:
            payload = {"action": "update_submission", "submission_id": submission_id, **data}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error updating submission {submission_id}: {e}")
            return False

    def delete_submission(self, submission_id: str) -> bool:
        try:
            payload = {"action": "delete_submission", "submission_id": submission_id}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error deleting submission {submission_id}: {e}")
            return False

    def delete_log(self, submission_id: str) -> bool:
        """Hapus baris dari sheet LOG_SURAT berdasarkan id_form."""
        try:
            payload = {"action": "delete_log", "submission_id": submission_id}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error deleting log {submission_id}: {e}")
            return False

    def get_submission_by_id(self, submission_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_submission_by_id", "submission_id": submission_id}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("submission", None)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching submission {submission_id}: {e}")
            return None

    # --- INI SUDAH DIPERBAIKI (Masuk ke dalam class) ---
    def get_logs(self) -> List[Dict[str, Any]]:
        """
        Ambil semua data dari sheet LOG_SURAT untuk ditampilkan di tabel dashboard (Generated).
        """
        try:
            response = requests.get(self.script_url, params={"action": "get_logs"}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("status") == "success":
                return res_data.get("logs", [])
            return []
        except Exception as e:
            print(f"Error fetching logs dari Apps Script: {e}")
            return []

    # =========================================================
    # CREDENTIAL DOCUMENT METHODS
    # =========================================================
    def save_credential_draft(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            payload = {"action": "save_credential_draft", **data}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("status") != "success":
                raise ValueError(f"API Error save_credential_draft: {res_data}")
            return res_data
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error saving credential draft: {e}")
            raise

    def get_credential_submissions(self) -> List[Dict[str, Any]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_credential_submissions"}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("submissions", [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching credential submissions: {e}")
            return []

    def delete_credential_submission(self, submission_id: str) -> bool:
        try:
            payload = {"action": "delete_credential_submission", "submission_id": submission_id}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error deleting credential submission {submission_id}: {e}")
            return False

    def get_credential_by_id(self, submission_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_credential_by_id", "submission_id": submission_id}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            # Unwrapping (sama seperti sub biasa)
            sub = None
            if isinstance(res_data, list) and len(res_data) > 0: sub = res_data[0]
            elif isinstance(res_data, dict): sub = res_data.get("submission") or res_data
            if isinstance(sub, list) and len(sub) > 0: sub = sub[0]
            return sub
        except requests.exceptions.RequestException as e:
            print(f"Error fetching credential {submission_id}: {e}")
            return None

    def get_last_credential_number(self, year: int) -> int:
        try:
            import time
            response = requests.get(
                self.script_url,
                params={"action": "get_last_credential_number", "year": year, "_t": int(time.time())},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data.get("last_urut", 0)
        except requests.exceptions.RequestException as e:
            print(f"Error fetching last credential number: {e}")
            return 0

    def save_credential_log(self, data: Dict[str, Any]) -> bool:
        try:
            payload = { "action": "save_credential_log", **data }
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error saving credential log: {e}")
            return False

    def get_credential_logs(self) -> List[Dict[str, Any]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_credential_logs"}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("status") == "success":
                return res_data.get("logs", [])
            return []
        except Exception as e:
            print(f"Error fetching credential logs: {e}")
            return []

    def delete_credential_log(self, nomor_surat: str) -> bool:
        try:
            # Credential log sheet uses "nomor_surat" as the unique row identifier,
            # NOT "id_form" / "submission_id". Pass it with the correct key so the
            # Apps Script can find and delete the right row.
            payload = {
                "action": "delete_credential_log",
                "nomor_surat": nomor_surat,
                # Also send as submission_id for backwards-compatibility
                # in case the Apps Script checks this field.
                "submission_id": nomor_surat,
            }
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error deleting credential log {nomor_surat}: {e}")
            return False

    # =========================================================
    # UPDATE NOTES (changelog) — visible to all users via popup
    # =========================================================
    def get_update_logs(self) -> List[Dict[str, Any]]:
        try:
            response = requests.get(self.script_url, params={"action": "get_update_logs"}, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("status") == "success":
                return res_data.get("logs", [])
            return []
        except Exception as e:
            print(f"Error fetching update logs: {e}")
            return []

    def save_update_log(self, data: Dict[str, Any]) -> bool:
        try:
            payload = {"action": "save_update_log", **data}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error saving update log: {e}")
            return False

    def delete_update_log(self, update_id: str) -> bool:
        try:
            payload = {"action": "delete_update_log", "id": update_id}
            response = requests.post(self.script_url, json=payload, timeout=30)
            response.raise_for_status()
            res_data = response.json()
            return res_data.get("status") == "success"
        except (requests.exceptions.RequestException, ValueError) as e:
            print(f"Error deleting update log {update_id}: {e}")
            return False