import os
import tempfile
import json as _json
from email import encoders
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Header, BackgroundTasks, APIRouter
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from docxtpl import DocxTemplate
from dotenv import load_dotenv

# Google Auth & Gmail API
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload

import requests
import base64
import secrets
import io
import sys

# Tambahkan path folder 'backend' ke sys.path agar Vercel bisa mengenali file lokal
sys.path.append(os.path.dirname(__file__))
from google_sheets_client import GoogleSheetsClient

# Load file .env (explicit path for Vercel compatibility)
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

# --- INITIAL SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APPS_SCRIPT_URL = os.getenv("APPS_SCRIPT_URL")
EMAIL_TO = os.getenv("EMAIL_TO", "")
_raw_admin_ids = os.getenv("ADMIN_SECRET_IDS", "")
ADMIN_SECRET_IDS = set(aid.strip().lower() for aid in _raw_admin_ids.split(",") if aid.strip())

# Runtime set for hub-authenticated admin users (added dynamically)
HUB_ADMIN_ACCESS: set = set()

# Scopes untuk Gmail + Drive API
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/drive.file',
]

# =========================================================
# GOOGLE API AUTHENTICATION
# =========================================================
def get_google_creds():
    creds = None

    # Prioritas 1: Baca dari Environment Variable (untuk Vercel / production)
    token_env = os.getenv("GOOGLE_TOKEN_JSON")
    if token_env:
        try:
            token_data = _json.loads(token_env)
            creds = Credentials.from_authorized_user_info(token_data, SCOPES)
        except Exception as e:
            print(f"[WARNING] Gagal parse GOOGLE_TOKEN_JSON dari env: {e}")

    # Prioritas 2: Baca dari file token.json (untuk development lokal)
    if not creds and os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                print("[ERROR] Tidak ada token valid dan credentials.json tidak ditemukan!")
                return None
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Simpan ke file hanya jika filesystem writable (lokal), di Vercel ini akan di-skip
        try:
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
        except Exception:
            pass  # Normal terjadi di Vercel karena filesystem read-only

    return creds

def get_gmail_service():
    creds = get_google_creds()
    if not creds: return None
    return build('gmail', 'v1', credentials=creds)

def get_drive_service():
    creds = get_google_creds()
    if not creds: return None
    return build('drive', 'v3', credentials=creds)

# =========================================================
# PDF HELPERS
# =========================================================
def generate_pdf_password() -> str:
    return secrets.token_hex(4).upper()

def convert_docx_to_pdf_via_drive(docx_path: str) -> str | None:
    """Upload docx ke Drive, export sebagai PDF, download, lalu hapus dari Drive."""
    try:
        drive = get_drive_service()
        if not drive:
            print("[Drive] Service tidak tersedia, skip konversi PDF")
            return None

        # Upload docx
        file_meta = {"name": os.path.basename(docx_path), "mimeType": "application/vnd.google-apps.document"}
        media = MediaFileUpload(docx_path, mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document", resumable=False)
        uploaded = drive.files().create(body=file_meta, media_body=media, fields="id").execute()
        file_id = uploaded.get("id")

        # Export sebagai PDF
        request = drive.files().export_media(fileId=file_id, mimeType="application/pdf")
        pdf_buf = io.BytesIO()
        downloader = MediaIoBaseDownload(pdf_buf, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

        # Hapus file dari Drive
        try:
            drive.files().delete(fileId=file_id).execute()
        except Exception:
            pass

        # Simpan PDF ke tempdir
        pdf_path = docx_path.replace(".docx", ".pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_buf.getvalue())

        print(f"[Drive] Konversi PDF berhasil: {pdf_path}")
        return pdf_path

    except Exception as e:
        print(f"[Drive] Konversi PDF gagal: {e}")
        return None

def encrypt_pdf(pdf_path: str, password: str) -> str | None:
    """Enkripsi PDF dengan password, return path file terenkripsi."""
    try:
        from pypdf import PdfWriter, PdfReader
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(user_password=password, owner_password=password, algorithm="RC4-128")
        enc_path = pdf_path.replace(".pdf", "_enc.pdf")
        with open(enc_path, "wb") as f:
            writer.write(f)
        print(f"[PDF] Enkripsi berhasil: {enc_path}")
        return enc_path
    except Exception as e:
        print(f"[PDF] Enkripsi gagal: {e}")
        return None

# =========================================================
# TELEGRAM NOTIFICATION
# =========================================================
def send_telegram_msg(message: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    raw_chat_ids = os.getenv("TELEGRAM_CHAT_ID", "")
    chat_ids = [cid.strip() for cid in raw_chat_ids.split(",") if cid.strip()]

    if not token or not chat_ids:
        print("[Telegram] Skipped — missing token or chat_ids")
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chat_id in chat_ids:
        payload = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
        try:
            resp = requests.post(url, json=payload, timeout=10)
            resp_data = resp.json()
            if not resp_data.get("ok"):
                print(f"[Telegram] API error (chat {chat_id}): {resp_data.get('description', resp.text)}")
            else:
                print(f"[Telegram] Sent to chat {chat_id}")
        except Exception as e:
            print(f"[Telegram] Error: {e}")

# =========================================================
# HELPERS
# =========================================================
def format_tgl_indo(val_str):
    if not val_str or val_str in ["-", "None", "null", ""]: return "-"
    try:
        clean_date = str(val_str)
        if "T" in clean_date:
            if clean_date.endswith("Z"):
                clean_date = clean_date[:-1] + "+00:00"
            try:
                dt_obj = datetime.fromisoformat(clean_date)
                dt_obj = dt_obj.astimezone(timezone(timedelta(hours=7)))
            except:
                dt_obj = datetime.strptime(clean_date.split("T")[0], "%Y-%m-%d")
        else:
            dt_obj = datetime.strptime(clean_date.split(" ")[0], "%Y-%m-%d")

        bulan_indo = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        return f"{dt_obj.day:02d} {bulan_indo[dt_obj.month]} {dt_obj.year}"
    except:
        return str(val_str)

def verify_admin_id(admin_id: str) -> bool:
    key = admin_id.strip().lower()
    if key in ADMIN_SECRET_IDS:
        return True
    if key in HUB_ADMIN_ACCESS:
        return True
    return False

# =========================================================
# DATA MODELS
# =========================================================
class SdkItem(BaseModel):
    sdk_type: str
    merchant_key: str
    username: str
    password: str

class AppItem(BaseModel):
    app_name: str

class DraftRequest(BaseModel):
    pic_ve_id: str
    pic_bd_id: str
    created_by: Optional[str] = None
    enterprise_name: str
    enterprise_initial: Optional[str] = ""
    merchant_name: str
    revision_number: str
    environment: str
    release_date: str 
    plan_stg: Optional[str] = None
    uat_date: Optional[str] = None
    plan_prod: Optional[str] = None
    live_on_market: Optional[str] = None
    stg_request: Optional[str] = None
    expected_approved: Optional[str] = None
    expected_deliver_stg: Optional[str] = None
    prod_request: Optional[str] = None
    expected_deliver_prod: Optional[str] = None
    rasp: bool = False
    rgb: bool = False
    nfc: str = "Non Active"
    kategori: Optional[str] = "sdk_liveness"
    sdk_list: List[SdkItem] = []
    app_list: List[AppItem] = []
    product_config: Optional[Dict[str, Any]] = None

class AdminUpdateRequest(BaseModel):
    class Config: extra = "ignore"
    enterprise_initial: Optional[str] = None
    enterprise_name: Optional[str] = None
    merchant_name: Optional[str] = None
    pic_ve_id: Optional[str] = None
    pic_bd_id: Optional[str] = None
    environment: Optional[str] = None
    revision_number: Optional[str] = None
    release_date: Optional[str] = None
    nfc: Optional[str] = None

class AdminVerifyRequest(BaseModel):
    admin_id: str

class CredentialService(BaseModel):
    service_type: str
    username: str = ""
    password: str = ""
    merchant_key: str = ""
    url: str = ""
    # API General only
    api_key: str = ""
    secret_key: str = ""
    channel_id: str = ""
    enterprise_token: str = ""
    base_url: str = ""
    doc_owner: str = ""
    ip_address: str = ""
    avengers: bool = False
    general: bool = False
    connect: bool = False

class CredentialSubmitRequest(BaseModel):
    pic_ve_id: str
    enterprise_name: str
    merchant_name: str
    enterprise_initial: Optional[str] = ""
    environment: str          # "Staging" | "Production"
    revision_number: str      # "00" | "01"
    release_date: Optional[str] = ""
    created_date: str
    services: List[CredentialService]
    kategori: str = "credential"


# =========================================================
# FASTAPI & ROUTER SETUP
# =========================================================
sheets_client = GoogleSheetsClient(APPS_SCRIPT_URL)
app = FastAPI() 

# Gunakan APIRouter dengan prefix /api agar alamatnya resmi terdaftar
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GMAIL API BACKGROUND TASK ---
def bg_send_generate_email(email_to, merchant_name, nomor_surat, enterprise_name, file_path, filename):
    try:
        service = get_gmail_service()
        if not service: return
        msg = MIMEMultipart()
        msg["To"] = email_to
        msg["Subject"] = f"New SOW Generated: [{merchant_name}] {nomor_surat}"
        
        body = (
            f"Hello,\n\n"
            f"A new SOW document has been generated with the following details:\n\n"
            f"• Merchant Name: {merchant_name}\n"
            f"• Nomor Surat: {nomor_surat}\n"
            f"• Enterprise Name: {enterprise_name}\n\n"
            f"Please find the attached document for your review."
        )
        msg.attach(MIMEText(body, "plain"))

        with open(file_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={filename}")
            msg.attach(part)

        raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        print(f"✅ SOW dikirim via Gmail API ke {email_to}")
    except Exception as e:
        print(f"❌ Gmail API Error: {e}")

# =========================================================
# ENDPOINTS (Terdaftar pada api_router)
# =========================================================

@api_router.get("/master-data")
def get_master_data(user_id: Optional[str] = None, x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    try:
        data = sheets_client.get_master_data()
        if x_admin_id and verify_admin_id(x_admin_id):
            return {"status": "success", "pic_ve": data.get("pic_ve", []), "pic_bd": data.get("pic_bd", [])}
        if user_id:
            pic_ve_list = data.get("pic_ve", [])
            user = next((u for u in pic_ve_list if str(u.get("privy_id", "")).lower() == user_id.strip().lower()), None)
            if not user:
                raise HTTPException(status_code=401, detail="ID tidak valid.")
        return {"status": "success", "pic_ve": data.get("pic_ve", []), "pic_bd": data.get("pic_bd", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/verify-user")
def verify_user(data: dict):
    try:
        privy_id_clean = str(data.get("access_code", "")).strip().lower()
        master_data = sheets_client.get_master_data()
        pic_ve_list = master_data.get("pic_ve", [])
        user = next((u for u in pic_ve_list if str(u.get("privy_id", "")).lower() == privy_id_clean), None)
        if not user: raise HTTPException(status_code=401, detail="ID tidak ditemukan.")
        return {"status": "success", "user": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/save-draft")
def save_draft(data: DraftRequest, bg_tasks: BackgroundTasks):
    try:
        master_data = sheets_client.get_master_data()
        pic_ve = next((u for u in master_data.get("pic_ve", []) if str(u.get('privy_id', '')).lower() == str(data.pic_ve_id).lower()), None)
        if not pic_ve:
            raise HTTPException(status_code=401, detail="PIC VE ID tidak valid.")
        pic_bd = next((u for u in master_data.get("pic_bd", []) if str(u.get('name', '')).lower() == str(data.pic_bd_id).lower()), None)
        
        pic_ve_name = pic_ve['name']
        pic_bd_name = pic_bd['name'] if pic_bd else "UNKNOWN"

        draft_payload = data.model_dump()
        draft_payload["pic_ve_name"] = pic_ve_name
        draft_payload["pic_bd_name"] = pic_bd_name
        draft_payload["status"] = "PENDING"
        draft_payload["submitted_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # --- LOGIKA KATEGORI ---
        # Prioritas: (1) kategori eksplisit dari frontend, (2) deteksi dari sdk_list
        kategori = data.kategori if data.kategori else ""

        # Deteksi dari sdk_list HANYA jika frontend tidak mengirim kategori eksplisit sama sekali
        # Jika frontend sudah kirim "sdk_liveness" atau "api_privypass" → langsung percaya, tidak di-override
        if not kategori:
            for sdk in data.sdk_list:
                if any(x in sdk.sdk_type.lower() for x in ["api", "privypass"]):
                    kategori = "api_privypass"
                    break
            if not kategori:
                kategori = "sdk_liveness"

        draft_payload["kategori"] = kategori

        result = sheets_client.save_draft(draft_payload)
        
        notif_text = (
            f"📝 <b>SOW Draft Baru!</b>\n"
            f"📝 <b>Kategori: {kategori}</b>\n"
            f"👤 VE: {pic_ve_name}\n"
            f"🏢 Enterprise: {data.enterprise_name}\n"
            f"🤝 Merchant: {data.merchant_name}\n\n"
            f"🔗 <a href='https://ve-document-generator.vercel.app/admin'>Buka Dashboard Admin</a>"
        )
        bg_tasks.add_task(send_telegram_msg, notif_text)
        return {"status": "success", "submission_id": result.get("submission_id", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/verify")
def admin_verify(request: AdminVerifyRequest):
    if not verify_admin_id(request.admin_id): 
        raise HTTPException(status_code=401, detail="ID Admin salah.")
    return {"status": "success", "message": "Akses diterima."}

@api_router.post("/admin/verify-hub")
def admin_verify_hub(data: dict):
    position = (data.get("position") or "").strip().lower()
    if position == "support":
        user_id = (data.get("userId") or "").strip().upper()
        hub_admin_id = f"HUB_{user_id}"
        HUB_ADMIN_ACCESS.add(hub_admin_id.lower())
        return {"status": "success", "message": "Akses diterima.", "admin_id": hub_admin_id}
    raise HTTPException(status_code=401, detail="Akses Admin Ditolak")

@api_router.get("/admin/submissions")
def admin_get_submissions(x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    # Tambahkan print debug ini untuk cek di terminal VS Code kamu
    print(f"--- REQUEST MASUK ---")
    print(f"Header X-Admin-Id: {x_admin_id}")
    
    if not x_admin_id or not verify_admin_id(x_admin_id):
        print(f"HASIL: 403 Forbidden - ID '{x_admin_id}' tidak valid")
        raise HTTPException(status_code=403, detail="Akses Admin Ditolak")
    
    try:
        raw_pending = sheets_client.get_submissions()
        logs = sheets_client.get_logs()
        
        # Gabungkan log credential agar muncul di tab Generated
        credential_logs = sheets_client.get_credential_logs()
        logs.extend(credential_logs)

        # Normalisasi pending: pastikan status = PENDING
        mapped_pending = []
        for item in raw_pending:
            sub_id = str(item.get("submission_id", "")).strip()
            if not sub_id: continue
            item["status"] = "PENDING"
            mapped_pending.append(item)

        # Normalisasi generated: pastikan status = GENERATED
        mapped_logs = []
        for item in logs:
            kategori = item.get("kategori", "sdk_liveness")
            nomor_surat = str(item.get("nomor_surat", "")).strip()
            log_id = str(item.get("id_form", "")).strip()

            # Untuk credential: gunakan nomor_surat sebagai unique key karena
            # satu id_form bisa menghasilkan beberapa credential dengan nomor berbeda
            if kategori == "credential" and nomor_surat:
                log_id = nomor_surat
            elif not log_id:
                log_id = nomor_surat  # Fallback ke nomor_surat untuk data legacy

            if not log_id or log_id == "_legacy": continue

            mapped_logs.append({
                "submission_id": log_id,
                "id_form": str(item.get("id_form", "")).strip(),  # simpan id_form asli
                "submitted_at": item.get("created_at", ""),
                "enterprise_name": item.get("enterprise_name", ""),
                "enterprise_initial": item.get("enterprise_initial", ""),
                "merchant_name": item.get("merchant_name", ""),
                "pic_ve_name": item.get("pic_ve", ""),
                "revision_number": "0" if str(item.get("revision_number", "")).strip() == "0" else (str(item.get("revision_number", "")).zfill(2) if item.get("revision_number") else "-"),
                "nomor_urut": item.get("nomor_urut", 0),
                "status": "GENERATED",
                "nomor_surat": nomor_surat,
                "kategori": kategori,
                "created_by": item.get("created_by", "")
            })

        # Kembalikan dua key terpisah agar frontend tidak perlu filter berdasarkan status
        return {
            "status": "success",
            "submissions": mapped_pending + mapped_logs,  # backward compat
            "pending_submissions": mapped_pending,
            "generated_logs": mapped_logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/admin/submissions/{submission_id}")
def admin_update_submission(submission_id: str, update_data: AdminUpdateRequest, x_admin_id: Optional[str] = Header(None)):
    if not x_admin_id or not verify_admin_id(x_admin_id): 
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        # Hanya ambil data yang dikirim (tidak None)
        payload = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if not payload: 
            raise HTTPException(status_code=400, detail="Tidak ada data yang diupdate.")
        
        # Kirim update ke Google Sheets via Client
        ok = sheets_client.update_submission(submission_id, payload)
        if not ok:
            raise HTTPException(status_code=500, detail="Gagal menyimpan perubahan ke Google Sheets. Pastikan Apps Script sudah di-deploy ulang.")
        return {"status": "success", "message": f"Submission {submission_id} berhasil diupdate."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/submissions/{submission_id}")
def admin_delete_submission(submission_id: str, x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        ok = sheets_client.delete_submission(submission_id)
        if not ok:
            raise HTTPException(status_code=404, detail=f"Submission '{submission_id}' tidak ditemukan atau gagal dihapus di Google Sheets.")
        return {"status": "success", "message": f"Submission {submission_id} berhasil dihapus."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/logs/{submission_id:path}")
def admin_delete_log(submission_id: str, x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    """Hapus entri dari LOG_SURAT (tab Generated)."""
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        ok = sheets_client.delete_log(submission_id)
        if not ok:
            raise HTTPException(status_code=404, detail=f"Log '{submission_id}' tidak ditemukan atau gagal dihapus. Pastikan Apps Script sudah di-update dan di-deploy ulang.")
        return {"status": "success", "message": f"Log {submission_id} berhasil dihapus."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/generate/{submission_id}")
def admin_generate(submission_id: str, bg_tasks: BackgroundTasks, x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    if not x_admin_id or not verify_admin_id(x_admin_id): 
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    
    try:
        # 1. Ambil data mentah dari Google Sheets
        raw_res = sheets_client.get_submission_by_id(submission_id)
        
        # 2. Unwrapping data agar menjadi dictionary yang bisa dibaca
        sub = None
        if isinstance(raw_res, list) and len(raw_res) > 0: sub = raw_res[0]
        elif isinstance(raw_res, dict): sub = raw_res.get("submission") or raw_res
        if isinstance(sub, list) and len(sub) > 0: sub = sub[0]

        if not sub or not isinstance(sub, dict):
            raise HTTPException(status_code=404, detail="Data tidak ditemukan.")

        # 3. Persiapan variabel dasar dan penomoran
        enterprise_initial = sub.get("enterprise_initial", "").strip()
        enterprise_name = sub.get("enterprise_name", "")
        merchant_name = sub.get("merchant_name", "")
        revision_number = sub.get("revision_number", "00")
        environment = sub.get("environment", "Staging")
        pic_ve_name = sub.get("pic_ve_name", "UNKNOWN")

        now = datetime.now()
        thn = now.year
        bln_angka = now.month
        
        last_urut = sheets_client.get_last_number(thn)
        new_urut = last_urut + 1
        bln_romawi = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][bln_angka-1]
        nomor_surat = f"SOW-{enterprise_initial}-{str(new_urut).zfill(3)}/{str(revision_number).zfill(2)}/VE/PID/{bln_romawi}/{thn}"

        # 4. Parsing JSON fields dari Google Sheets
        def parse_json(val):
            try:
                if isinstance(val, str): return _json.loads(val)
                return val if isinstance(val, (dict, list)) else {}
            except: return {}

        p_cfg = parse_json(sub.get("product_config"))
        if not isinstance(p_cfg, dict): p_cfg = {}
        ui = p_cfg.get("ui", {}) if isinstance(p_cfg.get("ui"), dict) else {}
        basic = p_cfg.get("basic", {}) if isinstance(p_cfg.get("basic"), dict) else {}
        assets = p_cfg.get("assets", {}) if isinstance(p_cfg.get("assets"), dict) else {}
        liveness = p_cfg.get("liveness", {}) if isinstance(p_cfg.get("liveness"), dict) else {}
        sdk_l = parse_json(sub.get("sdk_list"))
        if not isinstance(sdk_l, list): sdk_l = []
        app_l = parse_json(sub.get("app_list"))
        if not isinstance(app_l, list): app_l = []

        # Gabungkan nama SDK untuk tag {{ application_clean }} (bukan merchant apps)
        sdk_text = ", ".join([s.get("sdk_type", "") for s in sdk_l]) if isinstance(sdk_l, list) else "-"
        # Gabungkan nama merchant apps untuk tag {{ merchant_app }}
        apps_text = ", ".join([a.get("app_name", "") for a in app_l]) if isinstance(app_l, list) else "-"

        # 5. MAPPING CONTEXT KE TEMPLATE WORD (SESUAI TAG KAMU)
        # Deteksi kategori secara berlapis untuk menangani dua kasus:
        #   - Sheet header BENAR: obj["kategori"] = "api_privypass", obj["status"] = "PENDING"
        #   - Sheet header LAMA (tanpa kolom "kategori"): data bergeser 1 kolom →
        #     obj["status"] = "api_privypass" (berisi nilai kategori), obj["kategori"] = None
        raw_kategori = str(sub.get("kategori") or "").strip().lower()
        raw_status   = str(sub.get("status")   or "").strip().lower()

        # Layer 1: product_config — PrivyPass SELALU punya "subscriptionType", SDK Liveness tidak
        #          Bekerja hanya jika kolom header benar (product_config tidak ter-shift)
        if isinstance(p_cfg, dict) and "subscriptionType" in p_cfg:
            kategori_sub = "api_privypass"
            print(f"[DETECT] api_privypass via product_config.subscriptionType")

        # Layer 2: nilai "kategori" eksplisit dari sheet (header benar)
        elif raw_kategori == "api_privypass":
            kategori_sub = "api_privypass"
            print(f"[DETECT] api_privypass via sheet.kategori")

        # Layer 3: COLUMN SHIFT — sheet lama tanpa kolom "kategori" →
        #          nilai kategori tergeser ke kolom "status"
        elif raw_status == "api_privypass":
            kategori_sub = "api_privypass"
            print(f"[DETECT] api_privypass via sheet.status (column-shift — header lama)")

        elif raw_kategori == "sdk_liveness" or raw_status == "sdk_liveness":
            kategori_sub = "sdk_liveness"
            print(f"[DETECT] sdk_liveness (kategori={raw_kategori!r}, status={raw_status!r})")

        else:
            # Layer 4: cek sdk_list untuk keyword "api" / "privypass"
            if isinstance(sdk_l, list) and any(
                any(x in (s.get("sdk_type", "") or "").lower() for x in ["api", "privypass"])
                for s in sdk_l
            ):
                kategori_sub = "api_privypass"
                print(f"[DETECT] api_privypass via sdk_list keyword")
            else:
                kategori_sub = "sdk_liveness"
                print(f"[DETECT] default sdk_liveness (kategori={raw_kategori!r}, status={raw_status!r})")

        if kategori_sub == "api_privypass":
            context = {
                "nomor_surat": nomor_surat,
                "release_date": format_tgl_indo(sub.get("release_date")),
                "created_date": format_tgl_indo(now.strftime("%Y-%m-%d")),
                "revision_number": str(revision_number).zfill(2),
                "enterprise_name": enterprise_name,
                "merchant_name": merchant_name,
                "pic_ve_name": pic_ve_name,
                "PIC_VE_PrivyID": sub.get("pic_ve_id", "-"),
                "pic_bd_name": sub.get("pic_bd_name", "-"),
                "application_name": apps_text,
                
                "plan_stg": format_tgl_indo(sub.get("plan_stg")),
                "UAT": format_tgl_indo(sub.get("uat_date")),
                "plan_prod": format_tgl_indo(sub.get("plan_prod")),
                "live_on_market": format_tgl_indo(sub.get("live_on_market")),
                "stg_request": format_tgl_indo(sub.get("stg_request")),
                "expected_approved": format_tgl_indo(sub.get("expected_approved")),
                "expected_deliver_stg": format_tgl_indo(sub.get("expected_deliver_stg")),
                "prod_request": format_tgl_indo(sub.get("prod_request")),
                "expected_deliver_prod": format_tgl_indo(sub.get("expected_deliver_prod")),
                
                "subsciption_type": ", ".join(p_cfg.get("subscriptionType", [])) if isinstance(p_cfg.get("subscriptionType"), list) else "-",
                "data_share": ", ".join(p_cfg.get("dataShare", [])) if isinstance(p_cfg.get("dataShare"), list) else "-",
                "expiration_user": p_cfg.get("expirationUser", "5 Minutes"),
                "send_notification": ", ".join(p_cfg.get("sendNotification", [])) if isinstance(p_cfg.get("sendNotification"), list) else "-",
                "level_account": ", ".join(p_cfg.get("levelAccount", [])) if isinstance(p_cfg.get("levelAccount"), list) else p_cfg.get("levelAccount", "Verified Trusted"),
                "callback_url": p_cfg.get("callbackUrl", ""),
                "deeplink": p_cfg.get("deeplink", ""),
                "purpose": p_cfg.get("purpose", "")
            }
            template_path = os.path.join(BASE_DIR, "template_privypass.docx")
            filename = f"[{merchant_name}] SOW API Privypass {environment} Version {revision_number} - {pic_ve_name}.docx"

        else:
            context = {
                "nomor_surat": nomor_surat,
                "created_date": format_tgl_indo(now.strftime("%Y-%m-%d")),
                "enterprise_name": enterprise_name,
            "merchant_name": merchant_name,
            "application_clean": sdk_text,
            "merchant_app": apps_text,
            "revision_number": str(revision_number).zfill(2),
            "environment": environment,
            "pic_ve_name": pic_ve_name,
            "PIC_VE_PrivyID": sub.get("pic_ve_id", "-"),
            "pic_bd_name": sub.get("pic_bd_name", "-"),
            "enterprise_initial": enterprise_initial,
            
            # --- FEATURE SETUP ---
            "nfc": sub.get("nfc", "Non Active"),
            "rasp": "True" if str(sub.get("rasp")).lower() == "true" else "False",
            "rgb": "True" if str(sub.get("rgb")).lower() == "true" else "False",
            
            # --- BASIC SETUP ---
            "liveness_providers": ", ".join(basic.get("livenessProviders", [])) if isinstance(basic.get("livenessProviders"), list) else "-",
            "liveness_threshold": basic.get("livenessThreshold", "50"),
            "masking_threshold": basic.get("maskingThreshold", "True"),
            "liveness_face_flow": basic.get("livenessFaceFlow", "1"),
            # liveness config ada di p_cfg["liveness"], bukan di basic
            "liveness_random_instruction": ", ".join(liveness.get("randomInstruction", [])) if isinstance(liveness.get("randomInstruction"), list) else str(liveness.get("randomInstruction", "-")),
            "liveness_face_validation": ", ".join(liveness.get("faceValidation", [])) if isinstance(liveness.get("faceValidation"), list) else str(liveness.get("faceValidation", "-")),
            "liveness_timeout": liveness.get("timeout", "15"),
            "liveness_max_attempt": liveness.get("maxAttempt", "5"),

            # --- UI SETUP ---
            "ui_onboarding_screen": "Custom" if ui.get("onboardingScreen") not in ["Show", "Hide"] else ui.get("onboardingScreen"),
            "ui_onboarding_screen_desc": ui.get("onboardingScreenCustomText") or "",
            "ui_loading_screen": "Custom" if ui.get("loadingScreen") not in ["Show", "Hide"] else ui.get("loadingScreen"),
            "ui_loading_screen_desc": ui.get("loadingScreenCustomText") or "",
            "ui_result_screen": "Custom" if ui.get("resultScreen") not in ["Show", "Hide"] else ui.get("resultScreen"),
            "ui_result_screen_desc": ui.get("resultScreenCustomText") or "",
            "ui_navigation_bar": "Custom" if ui.get("navigationBar") not in ["Show", "Hide"] else ui.get("navigationBar"),
            "ui_navigation_bar_desc": ui.get("navigationBarCustomText") or "",
            "ui_footnote": "Custom" if ui.get("footnote") not in ["Show", "Hide"] else ui.get("footnote"),
            "ui_footnote_desc": ui.get("footnoteCustomText") or "",
            "ui_footer": "Custom" if ui.get("footer") not in ["Show", "Hide"] else ui.get("footer"),
            "ui_footer_desc": ui.get("footerCustomText") or "",
            "ui_button_color": ui.get("buttonColor", "Red"),
            "ui_button_wording": ui.get("buttonWording", "I'm Ready!"),
            "ui_face_scanner_shape": ui.get("faceScannerShape", "Ellipse"),
            "ui_frame_overlay": ui.get("frameOverlay", "White"),
            "ui_instruction_color": ui.get("instructionColor", "Black"),
            "ui_instruction_bg": ui.get("instructionBg", "White"),
            "ui_liveness_animation": ui.get("livenessAnimation", "Show"),
            "ui_liveness_countdown": ui.get("livenessCountdown", "Show"),
            # defaultLanguage: form menyimpan nilai asli ("Bahasa Indonesia" / "English" / teks custom)
            # defaultLanguageCustomText: teks custom yang diisi user saat memilih Other
            "ui_default_language": ui.get("defaultLanguage", "Bahasa Indonesia") if ui.get("defaultLanguage") in ["Bahasa Indonesia", "English"] else "Custom",
            "ui_default_language_desc": ui.get("defaultLanguageCustomText") or "",
            "ui_support_android": ui.get("supportAndroid", "Yes"),

            # --- ASSET SETUP --- (key harus PERSIS sesuai DEFAULTS di constants.ts)
            # Asset mapping: nilai "Privy" atau kosong = Default, nilai lain (termasuk "Other") = Custom
            # _desc diisi dengan nilai actual yang diinput user (bukan "Other" literal)
            "asset_logo_merchant": "Privy (Default)" if assets.get("logoMerchant") in ["Privy", "", None] else "Custom",
            "asset_logo_merchant_desc": "" if assets.get("logoMerchant") in ["Privy", "", None, "Other"] else assets.get("logoMerchant", ""),
            "asset_main_illustration": "Privy (Default)" if assets.get("mainIllustration") in ["Privy", "", None] else "Custom",
            "asset_main_illustration_desc": "" if assets.get("mainIllustration") in ["Privy", "", None, "Other"] else assets.get("mainIllustration", ""),
            "asset_illustration_1": "Privy (Default)" if assets.get("illustrationImage1") in ["Privy", "", None] else "Custom",
            "asset_illustration_1_desc": "" if assets.get("illustrationImage1") in ["Privy", "", None, "Other"] else assets.get("illustrationImage1", ""),
            "asset_illustration_2": "Privy (Default)" if assets.get("illustrationImage2") in ["Privy", "", None] else "Custom",
            "asset_illustration_2_desc": "" if assets.get("illustrationImage2") in ["Privy", "", None, "Other"] else assets.get("illustrationImage2", ""),
            "asset_illustration_3": "Privy (Default)" if assets.get("illustrationImage3") in ["Privy", "", None] else "Custom",
            "asset_illustration_3_desc": "" if assets.get("illustrationImage3") in ["Privy", "", None, "Other"] else assets.get("illustrationImage3", ""),
            # Term of Use & Privacy Policy: key pakai ID/EN bukan Id/En sesuai DEFAULTS
            "asset_term_of_use": assets.get("termOfUse", "Privy Term of Use"),
            "asset_term_of_use_id": assets.get("termOfUseID", ""),
            "asset_term_of_use_en": assets.get("termOfUseEN", ""),
            "asset_privacy_policy": assets.get("privacyPolicy", "Privy Privacy Policy"),
            "asset_privacy_policy_id": assets.get("privacyPolicyID", ""),
            "asset_privacy_policy_en": assets.get("privacyPolicyEN", ""),

            # --- TIMELINE ---
            "release_date": format_tgl_indo(sub.get("release_date")),
            "plan_stg": format_tgl_indo(sub.get("plan_stg")),
            "UAT": format_tgl_indo(sub.get("uat_date")),
            "plan_prod": format_tgl_indo(sub.get("plan_prod")),
            "live_on_market": format_tgl_indo(sub.get("live_on_market")),
            "stg_request": format_tgl_indo(sub.get("stg_request")),
            "expected_approved": format_tgl_indo(sub.get("expected_approved")),
            "expected_deliver_stg": format_tgl_indo(sub.get("expected_deliver_stg")),
            "prod_request": format_tgl_indo(sub.get("prod_request")),
            "expected_deliver_prod": format_tgl_indo(sub.get("expected_deliver_prod")),

            "credentials": sdk_l
            }
            template_path = os.path.join(BASE_DIR, "template_sow.docx")
            filename = f"[{merchant_name}] SOW SDK Liveness {environment} Version {revision_number} - {pic_ve_name}.docx"

        # 6. Jalankan Rendering Word
        # template_path dan filename sudah diset di pengecekan kategori di atas
        doc = DocxTemplate(template_path)
        doc.render(context)
        
        out_path = os.path.join(tempfile.gettempdir(), filename)
        doc.save(out_path)

        # 7. SAVE LOG KE GOOGLE SHEETS (FIXED: Tambah Bulan & Tahun)
        # Map admin ID ke nama yang lebih readable
        _ADMIN_DISPLAY = {
            "zradm!n": "ZARADMIN",
            "estadm!n": "ESTADMIN",
        }
        admin_display_name = _ADMIN_DISPLAY.get(
            str(x_admin_id).lower().strip(), str(x_admin_id).upper()
        )

        sheets_client.save_log({
            "id_form": submission_id,
            "enterprise_name": enterprise_name,
            "enterprise_initial": enterprise_initial,
            "nomor_urut": new_urut,
            "bulan": bln_angka, # Sesuai kolom E Apps Script
            "tahun": thn,       # Sesuai kolom F Apps Script
            "nomor_surat": nomor_surat,
            "pic_ve": pic_ve_name,
            "merchant_name": merchant_name,
            "created_at": format_tgl_indo(now.strftime("%Y-%m-%d")),
            "revision_number": revision_number,
            "created_by": admin_display_name, # FIX: Nama yang readable (ZARADMIN / ESTADMIN)
            "kategori": kategori_sub  # Gunakan nilai yang sudah terdeteksi dengan benar
        })

        # 8. Hapus draf lama
        sheets_client.delete_submission(submission_id)

        # 9. Jalankan Background Tasks (Email & Telegram)
        if EMAIL_TO:
            bg_tasks.add_task(bg_send_generate_email, EMAIL_TO, merchant_name, nomor_surat, enterprise_name, out_path, filename)
        
        bg_tasks.add_task(send_telegram_msg, f"✅ <b>SOW Generated!</b>\n\n📄 {nomor_surat}\n🏢 {enterprise_name}\n🤝 {merchant_name}")

        return {"status": "success", "nomor_surat": nomor_surat}

    except Exception as e:
        print(f"GENERATE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# CREDENTIAL DOCUMENT — Email helper
# =========================================================
def bg_send_credential_email(email_to, merchant_name, nomor_surat, enterprise_name, docx_path, filename):
    try:
        # Konversi ke PDF via Google Drive
        pdf_password = generate_pdf_password()
        pdf_path = convert_docx_to_pdf_via_drive(docx_path)

        if pdf_path:
            enc_path = encrypt_pdf(pdf_path, pdf_password)
            attach_path = enc_path or pdf_path
            attach_filename = filename.replace(".docx", ".pdf")
            password_note = f"\n• Password PDF      : {pdf_password}"
        else:
            # Fallback: kirim docx tanpa enkripsi
            attach_path = docx_path
            attach_filename = filename
            password_note = ""

        service = get_gmail_service()
        if not service: return
        msg = MIMEMultipart()
        msg["To"] = email_to
        msg["Subject"] = f"New Credential Document: [{merchant_name}] {nomor_surat}"
        body = (
            f"Hello,\n\n"
            f"A new Credential Document has been generated:\n\n"
            f"• Merchant Name   : {merchant_name}\n"
            f"• Nomor Surat     : {nomor_surat}\n"
            f"• Enterprise Name : {enterprise_name}{password_note}\n\n"
            f"Please find the attached document."
        )
        msg.attach(MIMEText(body, "plain"))
        with open(attach_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={attach_filename}")
            msg.attach(part)
        raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw_message}).execute()
        print(f"✅ Credential dikirim via Gmail ke {email_to}")
    except Exception as e:
        print(f"❌ Gmail API Error (Credential): {e}")

# =========================================================
# CREDENTIAL — Submit (VE)
# =========================================================
@api_router.post("/credential/submit")
def credential_submit(data: CredentialSubmitRequest, bg_tasks: BackgroundTasks):
    try:
        master_data = sheets_client.get_master_data()
        pic_ve = next(
            (u for u in master_data.get("pic_ve", [])
             if str(u.get("privy_id", "")).lower() == str(data.pic_ve_id).lower()),
            None
        )
        if not pic_ve:
            raise HTTPException(status_code=401, detail="PIC VE ID tidak valid.")
        pic_ve_name = pic_ve["name"]

        payload = {
            "pic_ve_id": data.pic_ve_id,
            "pic_ve_name": pic_ve_name,
            "enterprise_name": data.enterprise_name,
            "merchant_name": data.merchant_name,
            "enterprise_initial": data.enterprise_initial or "",
            "environment": data.environment,
            "revision_number": data.revision_number,
            "release_date": data.release_date,
            "created_date": data.created_date,
            "services": _json.dumps([s.model_dump() for s in data.services]),
            "kategori": "credential",
            "status": "PENDING",
            "submitted_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        result = sheets_client.save_credential_draft(payload)

        bg_tasks.add_task(send_telegram_msg,
            f"🔑 <b>Credential Draft Baru!</b>\n"
            f"👤 VE: {pic_ve_name}\n"
            f"🏢 Enterprise: {data.enterprise_name}\n"
            f"🤝 Merchant: {data.merchant_name}\n"
            f"🌍 Env: {data.environment}\n\n"
            f"🔗 <a href='https://ve-document-generator.vercel.app/admin'>Buka Dashboard Admin</a>"
        )
        return {"status": "success", "submission_id": result.get("submission_id", "")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# CREDENTIAL — Admin: list pending
# =========================================================
@api_router.get("/admin/credential-submissions")
def admin_get_credential_submissions(x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses Admin Ditolak")
    try:
        pending = sheets_client.get_credential_submissions()
        return {"status": "success", "pending_credentials": pending}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# CREDENTIAL — Admin: generate
# =========================================================
@api_router.post("/admin/credential/generate/{submission_id}")
def admin_credential_generate(
    submission_id: str,
    bg_tasks: BackgroundTasks,
    x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")
):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        raw = sheets_client.get_credential_by_id(submission_id)
        if not raw:
            raise HTTPException(status_code=404, detail="Data credential tidak ditemukan.")

        enterprise_name    = raw.get("enterprise_name", "")
        merchant_name      = raw.get("merchant_name", "")
        enterprise_initial = (raw.get("enterprise_initial") or "").strip()
        environment        = raw.get("environment", "Staging")
        revision_number    = str(raw.get("revision_number", "00")).zfill(2)
        pic_ve_name        = raw.get("pic_ve_name", "UNKNOWN")
        created_date_raw   = raw.get("created_date", "")

        now = datetime.now()
        thn = now.year
        bln_angka = now.month
        bln_romawi = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][bln_angka-1]
        env_code = "STG" if environment == "Staging" else "PRD"

        last_urut = sheets_client.get_last_credential_number(thn)
        new_urut  = last_urut + 1
        init_part = enterprise_initial if enterprise_initial else "XXX"
        nomor_surat = f"CRD-{env_code}/{init_part}-{str(new_urut).zfill(3)}/{revision_number}/VE/PID/{bln_romawi}/{thn}"

        # Parse services
        services_raw = raw.get("services", "[]")
        if isinstance(services_raw, str):
            try: services = _json.loads(services_raw)
            except Exception: services = []
        else:
            services = services_raw if isinstance(services_raw, list) else []

        context = {
            "enterprise_name": enterprise_name,
            "merchant_name":   merchant_name,
            "pic_ve_name":     pic_ve_name,
            "nomor_surat":     nomor_surat,
            "revision_number": revision_number,
            "created_date":    format_tgl_indo(created_date_raw) if created_date_raw else format_tgl_indo(now.strftime("%Y-%m-%d")),
            "environment":     environment,
            "credentials":     services,
            "list_service":    ", ".join([svc.get("service_type", "") for svc in services]),
        }

        template_path = os.path.join(BASE_DIR, "template_credential.docx")
        filename = f"[{merchant_name}] Credential {environment} Rev{revision_number} - {pic_ve_name}.docx"
        doc = DocxTemplate(template_path)
        doc.render(context)
        out_path = os.path.join(tempfile.gettempdir(), filename)
        doc.save(out_path)

        _ADMIN_DISPLAY = {"ZRADM!N": "ZARADMIN", "ESTADM!N": "ESTADMIN"}
        admin_display = _ADMIN_DISPLAY.get(str(x_admin_id).lower().strip(), str(x_admin_id).upper())

        sheets_client.save_credential_log({
            "id_form":           submission_id,
            "enterprise_name":   enterprise_name,
            "enterprise_initial":enterprise_initial,
            "nomor_urut":        new_urut,
            "bulan":             bln_angka,
            "tahun":             thn,
            "nomor_surat":       nomor_surat,
            "pic_ve":            pic_ve_name,
            "merchant_name":     merchant_name,
            "created_at":        format_tgl_indo(now.strftime("%Y-%m-%d")),
            "revision_number":   revision_number,
            "created_by":        admin_display,
            "kategori":          "credential"
        })

        sheets_client.delete_credential_submission(submission_id)

        if EMAIL_TO:
            bg_tasks.add_task(bg_send_credential_email, EMAIL_TO, merchant_name, nomor_surat, enterprise_name, out_path, filename)
        bg_tasks.add_task(send_telegram_msg,
            f"🔑 <b>Credential Generated!</b>\n\n📄 {nomor_surat}\n🏢 {enterprise_name}\n🤝 {merchant_name}")

        return {"status": "success", "nomor_surat": nomor_surat}

    except Exception as e:
        print(f"CREDENTIAL GENERATE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# CREDENTIAL — Admin: delete pending
# =========================================================
@api_router.delete("/admin/credential-pending/{submission_id:path}")
def admin_delete_credential_pending(submission_id: str, x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        ok = sheets_client.delete_credential_submission(submission_id)
        if not ok:
            raise HTTPException(status_code=404, detail=f"Credential '{submission_id}' tidak ditemukan.")
        return {"status": "success"}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# CREDENTIAL — Admin: delete log
# =========================================================
@api_router.delete("/admin/credential-logs")
def admin_delete_credential_log(
    id: str,  # pakai query param ?id=... agar slash dalam nomor_surat tidak merusak routing
    x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")
):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        ok = sheets_client.delete_credential_log(id)
        if not ok:
            raise HTTPException(status_code=404, detail=f"Log credential '{id}' tidak ditemukan.")
        return {"status": "success"}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# UPDATE NOTES (changelog) — admin creates, all users see popup
# =========================================================
class UpdateNoteRequest(BaseModel):
    class Config: extra = "ignore"
    title: str
    description: str = ""
    type: str = "feature"  # "feature" | "fix" | "improvement"

@api_router.get("/updates")
def public_get_updates():
    """Publicly accessible — frontend popup fetches this for all users."""
    try:
        logs = sheets_client.get_update_logs()
        return {"status": "success", "updates": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/updates")
def admin_add_update(
    payload: UpdateNoteRequest,
    x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")
):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        title = (payload.title or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Title wajib diisi.")
        # Stable id: timestamp-based
        now = datetime.now()
        update_id = f"UPD-{now.strftime('%Y%m%d-%H%M%S')}"
        ok = sheets_client.save_update_log({
            "id":          update_id,
            "title":       title,
            "description": (payload.description or "").strip(),
            "type":        (payload.type or "feature").strip().lower(),
            "posted_at":   now.strftime("%Y-%m-%d %H:%M:%S"),
            "posted_by":   x_admin_id,
        })
        if not ok:
            raise HTTPException(status_code=500, detail="Gagal menyimpan update note.")
        return {"status": "success", "id": update_id}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/updates/{update_id}")
def admin_delete_update(
    update_id: str,
    x_admin_id: Optional[str] = Header(None, alias="X-Admin-Id")
):
    if not x_admin_id or not verify_admin_id(x_admin_id):
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    try:
        ok = sheets_client.delete_update_log(update_id)
        if not ok:
            raise HTTPException(status_code=404, detail=f"Update note '{update_id}' tidak ditemukan.")
        return {"status": "success"}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# SANGAT PENTING: Daftarkan Router ke App
app.include_router(api_router)