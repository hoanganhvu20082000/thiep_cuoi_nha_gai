/**
 * Backend lời chúc / RSVP cho thiệp cưới - chạy trên Google Apps Script, lưu vào Google Sheet.
 *
 * Cài đặt:
 * 1. Tạo 1 Google Sheet mới → Extensions (Tiện ích) → Apps Script → dán toàn bộ file này.
 * 2. Deploy → New deployment → Type: Web app
 *      Execute as: Me | Who has access: Anyone
 * 3. Copy URL dạng https://script.google.com/macros/s/.../exec → dán vào rsvpEndpoint trong config.js
 *
 * Kiểm duyệt: gõ "x" vào cột E (an) của dòng nào thì lời chúc đó bị ẩn khỏi thiệp.
 */
const SHEET_NAME = 'LoiChuc';
const MAX_SHOWN = 100;

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['thoi_gian', 'ten', 'tham_du', 'loi_chuc', 'an']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Chặn công thức (formula injection) khi ghi chuỗi của khách vào Sheet
function safe_(s, max) {
  s = String(s || '').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true }); // honeypot: bot điền ô ẩn → bỏ qua
  const name = safe_(p.name, 80);
  if (!name) return json_({ ok: false, error: 'missing name' });
  const row = [new Date(), name, p.attend === 'no' ? 'không' : 'có', safe_(p.message, 500), ''];

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try { getSheet_().appendRow(row); } finally { lock.releaseLock(); }
  return json_({ ok: true });
}

// Trả về danh sách lời chúc (mới nhất trước) để hiển thị trên thiệp
function doGet() {
  const rows = getSheet_().getDataRange().getDisplayValues().slice(1);
  const wishes = rows
    .filter((r) => r[3] && String(r[4]).toLowerCase() !== 'x')
    .slice(-MAX_SHOWN)
    .reverse()
    .map((r) => ({ name: r[1].replace(/^'/, ''), message: r[3].replace(/^'/, '') }));
  return json_({ wishes });
}
