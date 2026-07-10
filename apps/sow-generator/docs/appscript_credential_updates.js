/**
 * PETUNJUK UPDATE APPS SCRIPT (Code.gs)
 * 
 * 1. Buka Google Apps Script yang terhubung dengan Spreadsheet Anda.
 * 2. Pastikan Anda sudah membuat sheet/tab baru di Spreadsheet dengan nama: LOG_CREDENTIAL
 * 3. Tambahkan (Copy-Paste) kode di bawah ini ke dalam file `Code.gs` Anda, di bagian paling bawah.
 * 4. Jika fungsi `doGet` dan `doPost` sudah ada, pastikan untuk menambahkannya ke blok `switch(action)`.
 * 5. Lakukan "New Deployment" agar perubahan ini bisa diakses oleh backend.
 */

/* =======================================================================
 * BAGIAN 1: UPDATE FUNGSI doGet(e)
 * Cari fungsi doGet(e) Anda yang sekarang, dan tambahkan case baru ini
 * ke dalam struktur switch(e.parameter.action) atau if (e.parameter.action == ...)
 * ======================================================================= */
/*
    // ... potongan kode sebelumnya di dalam doGet ...
    
    if (action === "get_last_credential_number") {
      var year = parseInt(e.parameter.year) || new Date().getFullYear();
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("LOG_CREDENTIAL"); // Menggunakan sheet khusus
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success", 
          last_urut: 0,
          message: "Sheet LOG_CREDENTIAL tidak ditemukan, mulai dari 0"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var data = sheet.getDataRange().getValues();
      var lastNum = 0;
      
      // Asumsi kolom Tahun ada di index 5 (Kolom F) dan Nomor Urut di index 3 (Kolom D)
      // Ubah index di bawah ini sesuai dengan struktur kolom LOG_CREDENTIAL Anda!
      for (var i = 1; i < data.length; i++) {
        var thnRow = parseInt(data[i][5]) || 0; // Kolom F (Tahun)
        if (thnRow === year) {
          var numRow = parseInt(data[i][3]) || 0; // Kolom D (Nomor Urut)
          if (numRow > lastNum) {
            lastNum = numRow;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success", last_urut: lastNum}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "get_credential_logs") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("LOG_CREDENTIAL");
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: "success", logs: []}))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
         return ContentService.createTextOutput(JSON.stringify({status: "success", logs: []}))
            .setMimeType(ContentService.MimeType.JSON);
      }
      
      var headers = data[0];
      var logs = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row[0] && row[0] !== "") {
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            var val = row[j];
            if (val instanceof Date) {
              val = Utilities.formatDate(val, "GMT+7", "yyyy-MM-dd HH:mm:ss");
            }
            obj[headers[j]] = val;
          }
          logs.push(obj);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", logs: logs}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ... sisa kode doGet Anda ...
*/

/* =======================================================================
 * BAGIAN 2: UPDATE FUNGSI doPost(e)
 * Cari fungsi doPost(e) Anda yang sekarang, dan tambahkan case baru ini
 * ke dalam struktur switch(action) atau if (action === ...)
 * ======================================================================= */
/*
    // ... potongan kode sebelumnya di dalam doPost ...
    
    if (action === "save_credential_log") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("LOG_CREDENTIAL");
      
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error", 
          message: "Sheet LOG_CREDENTIAL belum dibuat di Spreadsheet!"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var idForm = payload.id_form || Utilities.getUuid();
      var enterpriseName = payload.enterprise_name || "";
      var enterpriseInitial = payload.enterprise_initial || "";
      var noUrut = payload.nomor_urut || 0;
      var bln = payload.bulan || "";
      var thn = payload.tahun || "";
      var noSurat = payload.nomor_surat || "";
      var picVe = payload.pic_ve || "";
      var merchantName = payload.merchant_name || "";
      var createdAt = payload.created_at || new Date().toISOString();
      var revisi = payload.revision_number || "00";
      var createdBy = payload.created_by || "";
      var kategori = payload.kategori || "credential";

      // Pastikan urutan appendRow ini SAMA PERSIS dengan urutan header di sheet LOG_CREDENTIAL Anda!
      sheet.appendRow([
        idForm,              // A: id_form
        enterpriseName,      // B: enterprise_name
        enterpriseInitial,   // C: enterprise_initial
        noUrut,              // D: nomor_urut
        bln,                 // E: bulan
        thn,                 // F: tahun
        noSurat,             // G: nomor_surat
        picVe,               // H: pic_ve
        merchantName,        // I: merchant_name
        createdAt,           // J: created_at
        revisi,              // K: revision_number
        createdBy,           // L: created_by
        kategori             // M: kategori
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete_credential_log") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("LOG_CREDENTIAL");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet LOG_CREDENTIAL tidak ditemukan"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var subId = payload.submission_id;
      if (!subId) {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "submission_id missing"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var deleted = false;
      for (var i = 1; i < data.length; i++) {
        // Asumsi ID Form (submission_id) ada di kolom pertama (index 0)
        if (data[i][0] === subId) {
          sheet.deleteRow(i + 1); // deleteRow 1-based index
          deleted = true;
          break;
        }
      }
      if (deleted) {
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Not found in LOG_CREDENTIAL"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ... sisa kode doPost Anda ...
*/
