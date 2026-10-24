// Chạy thử thiệp + API lời chúc trên máy: node dev-server.js  → http://localhost:5173
// Lời chúc được ghi vào file data/wishes.json.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const handler = require("./api/wishes");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".mp3": "audio/mpeg",
};

// Giả lập req/res kiểu Vercel (res.status().json(), req.body đã parse)
const wrap = (res) => Object.assign(res, {
  status(c) { res.statusCode = c; return res; },
  json(o) { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(o)); return res; },
});

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/wishes") {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on("end", () => {
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      handler(req, wrap(res));
    });
    return;
  }
  // File tĩnh, chặn đi ra ngoài thư mục gốc
  const file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)));
  if (!file.startsWith(ROOT) || /[\\/](api|data|_src|\.git)[\\/]/.test(file.slice(ROOT.length))) { res.statusCode = 403; return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(buf);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`Thiệp chạy tại http://localhost:${PORT}`));
