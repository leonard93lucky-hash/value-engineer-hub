// =====================================================
// SOW GENERATOR — GOOGLE APPS SCRIPT
// =====================================================

const SPREADSHEET_ID = "1C3wmrpL_tQEq_p915Ge6lQQjpSQ9HtdPGVHsRLkG4f8";

// Nama sheet — sesuaikan jika perlu
const SHEET_PENDING            = "PENDING_SUBMISSIONS";
const SHEET_LOG                = "LOG_SURAT";
const SHEET_LOG_CREDENTIAL     = "LOG_CREDENTIAL";     // <--- SHEET BARU UNTUK LOG CREDENTIAL
const SHEET_PIC_VE             = "pic_ve";   // sheet master data PIC VE yang sudah ada
const SHEET_PIC_BD             = "pic_bd";   // sheet master data PIC BD yang sudah ada
const SHEET_PENDING_CREDENTIAL = "PENDING_CREDENTIAL"; // <--- DITAMBAHKAN UNTUK CREDENTIAL

// =====================================================
// ROUTER UTAMA
// =====================================================

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "get_master_data")       return respond(getMasterData());
    if (action === "get_last_number")       return respond(getLastNumber(e.parameter.year));
    if (action === "get_submissions")       return respond(getSubmissions());
    if (action === "get_submission_by_id")  return respond(getSubmissionById(e.parameter.submission_id));
    if (action === "get_logs")              return respond(getLogs());
    
    // --- CREDENTIAL GET ENDPOINTS ---
    if (action === "get_credential_submissions") return respond(getCredentialSubmissions());
    if (action === "get_credential_by_id")       return respond(getCredentialById(e.parameter.submission_id));
    
    // --- SEPARATED CREDENTIAL LOG GET ENDPOINTS ---
    if (action === "get_last_credential_number") return respond(getLastCredentialNumber(e.parameter.year));
    if (action === "get_credential_logs")        return respond(getCredentialLogs());

    return respond({ status: "error", message: "Unknown GET action: " + action });
  } catch(err) {
    return respond({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  const body   = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    if (action === "save_log")          return respond(saveLog(body));
    if (action === "save_draft")        return respond(saveDraft(body));
    if (action === "update_submission") return respond(updateSubmission(body));
    if (action === "delete_submission") return respond(deleteSubmission(body));
    if (action === "delete_log")        return respond(deleteLog(body));  
    if (action === "send_email")        return respond(sendEmail(body));
    
    // --- CREDENTIAL POST ENDPOINTS ---
    if (action === "save_credential_draft")        return respond(saveCredentialDraft(body));
    if (action === "delete_credential_submission") return respond(deleteCredentialSubmission(body));
    
    // --- SEPARATED CREDENTIAL LOG POST ENDPOINTS ---
    if (action === "save_credential_log")          return respond(saveCredentialLog(body));
    if (action === "delete_credential_log")        return respond(deleteCredentialLog(body));

    return respond({ status: "error", message: "Unknown POST action: " + action });
  } catch(err) {
    return respond({ status: "error", message: err.toString() });
  }
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// MASTER DATA
// =====================================================

function getMasterData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // PIC VE
  const veSheet = ss.getSheetByName(SHEET_PIC_VE);
  const veData  = veSheet.getDataRange().getValues();
  const picVe   = veData.slice(1).map(row => ({
    name:     row[0], // Kolom A
    privy_id: row[1], // Kolom B
    email:    row[2], // Kolom C
    role:     row[3]  // Kolom D
  }));

  // PIC BD 
  const bdSheet = ss.getSheetByName(SHEET_PIC_BD);
  const bdData  = bdSheet.getDataRange().getValues();
  const picBd   = bdData.slice(1).map(row => ({
    name: row[0],
    id:   row[1] 
  }));

  return { status: "success", pic_ve: picVe, pic_bd: picBd };
}

// =====================================================
// NOMOR URUT (dari LOG_SURAT)
// =====================================================

function getLastNumber(year) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG);
  if (!sheet || sheet.getLastRow() <= 1) return { status: "success", last_urut: 0 };

  const data  = sheet.getDataRange().getValues();
  let lastUrut = 0;
  data.slice(1).forEach(row => {
    if (String(row[5]) === String(year)) {
      const urut = parseInt(row[3]);
      if (!isNaN(urut) && urut > lastUrut) lastUrut = urut;
    }
  });
  return { status: "success", last_urut: lastUrut };
}

// =====================================================
// LOG SURAT (data permanen setelah generate)
// =====================================================

function saveLog(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_LOG);
  if (!sheet) sheet = ss.insertSheet(SHEET_LOG);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "id_form","enterprise_name","enterprise_initial","nomor_urut",
      "bulan","tahun","nomor_surat","pic_ve","merchant_name","created_at","revision_number", "created_by", "kategori"
    ]);
  }

  sheet.appendRow([
    body.id_form, body.enterprise_name, body.enterprise_initial,
    body.nomor_urut, body.bulan, body.tahun, body.nomor_surat,
    body.pic_ve, body.merchant_name, body.created_at, body.revision_number, body.created_by, body.kategori
  ]);

  return { status: "success" };
}

function getLogs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("LOG_SURAT"); 
  if (!sheet || sheet.getLastRow() <= 1) return { status: "success", logs: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; 
  
  const logs = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
  return { status: "success", logs: logs };
}

// =====================================================
// PENDING SUBMISSIONS — SAVE DRAFT
// =====================================================

function saveDraft(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_PENDING);
  if (!sheet) sheet = ss.insertSheet(SHEET_PENDING);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "submission_id","submitted_at", "kategori", "status",
      "enterprise_name","enterprise_initial","merchant_name",
      "pic_ve_id","pic_ve_name","pic_bd_id","pic_bd_name","created_by",
      "environment","revision_number","release_date",
      "plan_stg","uat_date","plan_prod","live_on_market",
      "stg_request","expected_approved","expected_deliver_stg",
      "prod_request","expected_deliver_prod",
      "rasp","rgb", "nfc",
      "sdk_list","app_list","product_config"
    ]);
  }

  const timestamp    = new Date();
  const dateStr      = Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const submission_id = "SUB-" + dateStr;

  sheet.appendRow([
    submission_id,
    Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
    body.kategori              || "",
    "PENDING",
    body.enterprise_name       || "",
    body.enterprise_initial    || "",
    body.merchant_name         || "",
    body.pic_ve_id             || "",
    body.pic_ve_name           || "",
    body.pic_bd_id             || "",
    body.pic_bd_name           || "",
    body.created_by            || "",
    body.environment           || "",
    body.revision_number       || "",
    "'" + (body.release_date   || ""), // <--- Pakai "'" + agar format teks (Lock Date)
    "'" + (body.plan_stg       || ""),
    "'" + (body.uat_date       || ""),
    "'" + (body.plan_prod      || ""),
    "'" + (body.live_on_market || ""),
    "'" + (body.stg_request    || ""),
    "'" + (body.expected_approved     || ""),
    "'" + (body.expected_deliver_stg  || ""),
    "'" + (body.prod_request          || ""),
    "'" + (body.expected_deliver_prod || ""),
    body.rasp                  || "False",
    body.rgb                   || "False",
    body.nfc                   || "Non Active",
    JSON.stringify(body.sdk_list      || []),
    JSON.stringify(body.app_list      || []),
    JSON.stringify(body.product_config || {})
  ]);

  return { status: "success", submission_id: submission_id };
}

// =====================================================
// PENDING SUBMISSIONS — GET ALL
// =====================================================

function getSubmissions() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PENDING);
  if (!sheet || sheet.getLastRow() <= 1) return { status: "success", submissions: [] };

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  const submissions = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (["sdk_list","app_list","product_config"].includes(h)) {
        try { obj[h] = JSON.parse(row[i] || "[]"); }
        catch { obj[h] = row[i]; }
      } else {
        obj[h] = row[i];
      }
    });
    return obj;
  });

  return { status: "success", submissions };
}

function getSubmissionById(submission_id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PENDING);
  if (!sheet || sheet.getLastRow() <= 1) return { status: "error", message: "Not found" };

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const row     = data.slice(1).find(r => r[0] === submission_id);

  if (!row) return { status: "error", message: "Submission not found: " + submission_id };

  const obj = {};
  headers.forEach((h, i) => {
    if (["sdk_list","app_list","product_config"].includes(h)) {
      try { obj[h] = JSON.parse(row[i] || "[]"); }
      catch { obj[h] = row[i]; }
    } else {
      obj[h] = row[i];
    }
  });

  return { status: "success", submission: obj };
}

function updateSubmission(body) {
  const submission_id = body.submission_id;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let sheet = ss.getSheetByName(SHEET_PENDING);
  let data  = sheet ? sheet.getDataRange().getValues() : [];
  let headers = data[0] || [];
  let rowIdx  = data.slice(1).findIndex(r => r[0] === submission_id);

  if (rowIdx === -1) {
    // Coba cari di sheet credential
    sheet = ss.getSheetByName(SHEET_PENDING_CREDENTIAL);
    data  = sheet ? sheet.getDataRange().getValues() : [];
    headers = data[0] || [];
    rowIdx  = data.slice(1).findIndex(r => r[0] === submission_id);
    
    if (rowIdx === -1) {
      return { status: "error", message: "Submission tidak ditemukan di PENDING maupun PENDING_CREDENTIAL: " + submission_id };
    }
  }

  const fieldMap = {};
  headers.forEach((h, i) => { fieldMap[h] = i; });

  const updatable = [
    "enterprise_name","enterprise_initial","merchant_name",
    "environment","revision_number","release_date",
    "plan_stg","uat_date","plan_prod","live_on_market",
    "stg_request","expected_approved","expected_deliver_stg",
    "prod_request","expected_deliver_prod","rasp","rgb", "nfc", "kategori"
  ];

  updatable.forEach(field => {
    if (body[field] !== undefined && body[field] !== null && fieldMap[field] !== undefined) {
      const sheetRow = rowIdx + 2; 
      const sheetCol = fieldMap[field] + 1;
      sheet.getRange(sheetRow, sheetCol).setValue(body[field]);
    }
  });

  return { status: "success" };
}

function deleteSubmission(body) {
  const submission_id = body.submission_id;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PENDING);
  if (!sheet) return { status: "error", message: "Sheet tidak ditemukan" };

  const data   = sheet.getDataRange().getValues();
  const rowIdx = data.slice(1).findIndex(r => r[0] === submission_id);

  if (rowIdx === -1) return { status: "error", message: "Submission tidak ditemukan" };

  sheet.deleteRow(rowIdx + 2); 

  return { status: "success" };
}

function deleteLog(body) {
  const submission_id = body.submission_id;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG);
  if (!sheet) return { status: "error", message: "Sheet LOG_SURAT tidak ditemukan" };

  const data   = sheet.getDataRange().getValues();
  // Kolom A = id_form, cocokkan dengan submission_id
  const rowIdx = data.slice(1).findIndex(r => String(r[0]) === String(submission_id));

  if (rowIdx === -1) return { status: "error", message: "Log tidak ditemukan: " + submission_id };

  sheet.deleteRow(rowIdx + 2); // +1 header, +1 karena 1-indexed

  return { status: "success" };
}

// =====================================================
// KIRIM EMAIL: FLEKSIBEL (Tanpa/Dengan Attachment)
// =====================================================

function sendEmail(body) {
  const to       = body.to;
  const subject  = body.subject;
  const message  = body.body;
  const filename = body.filename;
  const b64      = body.file_content_base64;

  if (!to) return { status: "error", message: "Parameter to (email tujuan) wajib diisi" };

  const options = {};

  // Jika ada base64, kita convert dan lampirkan attachmentnya
  if (b64 && b64.trim() !== "") {
    try {
      const fileBytes = Utilities.base64Decode(b64);
      const blob      = Utilities.newBlob(fileBytes, MimeType.MICROSOFT_WORD, filename || "Document.docx");
      options.attachments = [blob];
    } catch(err) {
      return { status: "error", message: "Gagal me-decode file attachments" };
    }
  }

  // Gunakan GmailApp (mengirim menggunakan account google Apps Script yang mendeploy code ini)
  GmailApp.sendEmail(to, subject, message, options);
  
  return { status: "success" };
}

// =====================================================
// PENDING CREDENTIAL — SAVE DRAFT
// =====================================================

function saveCredentialDraft(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_PENDING_CREDENTIAL);
  if (!sheet) sheet = ss.insertSheet(SHEET_PENDING_CREDENTIAL);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "submission_id", "submitted_at", "kategori", "status",
      "enterprise_name", "enterprise_initial", "merchant_name",
      "pic_ve_id", "pic_ve_name", "environment", "revision_number",
      "release_date", "created_date", "services"
    ]);
  }

  const timestamp    = new Date();
  const dateStr      = Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyyMMdd-HHmmss");
  const submission_id = "CRED-" + dateStr;

  sheet.appendRow([
    submission_id,
    Utilities.formatDate(timestamp, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
    body.kategori              || "credential",
    "PENDING",
    body.enterprise_name       || "",
    body.enterprise_initial    || "",
    body.merchant_name         || "",
    body.pic_ve_id             || "",
    body.pic_ve_name           || "",
    body.environment           || "",
    body.revision_number       || "",
    "'" + (body.release_date   || ""), 
    "'" + (body.created_date   || ""),
    body.services              || "[]"
  ]);

  return { status: "success", submission_id: submission_id };
}

// =====================================================
// PENDING CREDENTIAL — GET ALL
// =====================================================

function getCredentialSubmissions() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PENDING_CREDENTIAL);
  if (!sheet || sheet.getLastRow() <= 1) return { status: "success", submissions: [] };

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  const submissions = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (h === "services") {
        try { obj[h] = JSON.parse(row[i] || "[]"); }
        catch { obj[h] = row[i]; }
      } else {
        obj[h] = row[i];
      }
    });
    return obj;
  });

  return { status: "success", submissions };
}

// =====================================================
// PENDING CREDENTIAL — GET BY ID
// =====================================================

function getCredentialById(submission_id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PENDING_CREDENTIAL);
  if (!sheet || sheet.getLastRow() <= 1) return { status: "error", message: "Not found" };

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const row     = data.slice(1).find(r => r[0] === submission_id);

  if (!row) return { status: "error", message: "Credential submission not found: " + submission_id };

  const obj = {};
  headers.forEach((h, i) => {
    if (h === "services") {
      try { obj[h] = JSON.parse(row[i] || "[]"); }
      catch { obj[h] = row[i]; }
    } else {
      obj[h] = row[i];
    }
  });

  return { status: "success", submission: obj };
}

// =====================================================
// PENDING CREDENTIAL — DELETE
// =====================================================

function deleteCredentialSubmission(body) {
  const submission_id = body.submission_id;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PENDING_CREDENTIAL);
  if (!sheet) return { status: "error", message: "Sheet tidak ditemukan" };

  const data   = sheet.getDataRange().getValues();
  const rowIdx = data.slice(1).findIndex(r => r[0] === submission_id);

  if (rowIdx === -1) return { status: "error", message: "Credential submission tidak ditemukan" };

  sheet.deleteRow(rowIdx + 2); 

  return { status: "success" };
}

// =====================================================
// CREDENTIAL LOG (DATA PERMANEN SETELAH GENERATE)
// =====================================================

function getLastCredentialNumber(year) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG_CREDENTIAL);
  
  if (!sheet || sheet.getLastRow() <= 1) return { status: "success", last_urut: 0 };

  const data  = sheet.getDataRange().getValues();
  let lastUrut = 0;
  
  data.slice(1).forEach(row => {
    if (String(row[5]) === String(year)) { // Asumsi Kolom F (index 5) adalah Tahun
      const urut = parseInt(row[3]);       // Asumsi Kolom D (index 3) adalah Nomor Urut
      if (!isNaN(urut) && urut > lastUrut) lastUrut = urut;
    }
  });
  return { status: "success", last_urut: lastUrut };
}

function saveCredentialLog(body) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_LOG_CREDENTIAL);
  
  if (!sheet) sheet = ss.insertSheet(SHEET_LOG_CREDENTIAL);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "id_form","enterprise_name","enterprise_initial","nomor_urut",
      "bulan","tahun","nomor_surat","pic_ve","merchant_name","created_at","revision_number", "created_by", "kategori"
    ]);
  }

  sheet.appendRow([
    body.id_form, body.enterprise_name, body.enterprise_initial,
    body.nomor_urut, body.bulan, body.tahun, body.nomor_surat,
    body.pic_ve, body.merchant_name, body.created_at, body.revision_number, body.created_by, body.kategori
  ]);

  return { status: "success" };
}

function getCredentialLogs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG_CREDENTIAL); 
  if (!sheet || sheet.getLastRow() <= 1) return { status: "success", logs: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; 
  
  const logs = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
  return { status: "success", logs: logs };
}

function deleteCredentialLog(body) {
  const submission_id = body.submission_id;
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG_CREDENTIAL);
  if (!sheet) return { status: "error", message: "Sheet LOG_CREDENTIAL tidak ditemukan" };

  const data   = sheet.getDataRange().getValues();
  const rowIdx = data.slice(1).findIndex(r => String(r[0]) === String(submission_id));

  if (rowIdx === -1) return { status: "error", message: "Log credential tidak ditemukan: " + submission_id };

  sheet.deleteRow(rowIdx + 2);

  return { status: "success" };
}
