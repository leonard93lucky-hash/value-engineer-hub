# Panduan Konfigurasi Google Sheets & Apps Script untuk API Privypass

Perubahan yang dilakukan pada aplikasi memerlukan penyesuaian di Spreadsheet (opsional namun direkomendasikan) serta *Code.gs* di Google Apps Script (jika Apps Script tidak diatur untuk menerima data dinamis/Kategori).

## 1. Perubahan Pada Google Sheets

Tidak diwajibkan untuk menambahkan kolom yang sama persis seperti nama-nama *Product Config* (contoh: `subscription_type`, `expiration_user`), karena data tersebut disimpan aman dalam format JSON di kolom **`product_config`** pada sheet `Drafts`.

Namun, sangat direkomendasikan untuk menambahkan/memastikan adanya kolom **`kategori`** pada kedua sheet utama agar pencarian/filter di dashboard menjadi lebih efisien kelak:
1. Buka Google Sheet rekap SOW Anda.
2. Di sheet **`Drafts`**, tambahkan kolom dengan header `kategori` (biasanya di paling kanan atau setelah `status`). 
3. Di sheet **`Generated` / `LOG_SURAT`**, tambahkan kolom dengan header `kategori`.

Data `kategori` untuk data yang di-submit via form baru ini akan otomatis bernilai **`api_privypass`**. Untuk data yang sudah lewat, atau SDK, nilainya **`sdk_liveness`**.

## 2. Perubahan di Google Apps Script (`Code.gs`)

Pastikan fungsi `save_draft` di Apps Script Anda sudah menampung dan menyimpan field `kategori` serta `app_list` ke spreadsheet baru. Karena `product_config` menggunakan JSON stringify, ia sudah tertampung aman. 

Contoh snipet jika Anda melalukan mapping array payload secara manual:

```javascript
function save_draft(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Drafts");
  
  // Data yang diterima dari backend FastAPI
  var idForm = Utilities.getUuid();
  var picVeId = payload.pic_ve_id || "";
  var enterpriseName = payload.enterprise_name || "";
  var merchantName = payload.merchant_name || "";
  // ... kolom-kolom lain ...
  
  // BAGIAN PENTING: Tambahkan kategori
  var kategori = payload.kategori || "sdk_liveness";
  var productConfigStr = payload.product_config ? JSON.stringify(payload.product_config) : "{}";
  var appListStr = payload.app_list ? JSON.stringify(payload.app_list) : "[]";
  
  var status = "PENDING";
  var submittedAt = payload.submitted_at || new Date().toISOString();
  
  // Pastikan variabel kategori di-append sesuai dengan urutan kolom sheet Anda!
  sheet.appendRow([
    idForm, 
    submittedAt, 
    picVeId, 
    enterpriseName, 
    merchantName, 
    // ...,
    kategori, // <--- Tambahan disini jika Anda merapikan struktur kolom
    productConfigStr,
    appListStr
  ]);
  
  return { status: "success", submission_id: idForm };
}
```

Pastikan Anda melakukan **New Deployment** (Manage Deployments -> New Version) setiap kali Anda mengubah file `Code.gs` di Google Apps Script.
