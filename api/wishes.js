// API lời chúc: GET /api/wishes → danh sách; POST /api/wishes → thêm 1 lời chúc.
"use strict";
const { readAll, append } = require("./_store");

const MAX_SHOWN = 300;
// Bỏ ký tự điều khiển, cắt độ dài. Hiển thị phía client luôn escape HTML.
const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const list = await readAll();
      const wishes = list
        .filter((w) => !w.hidden && w.message)
        .slice(-MAX_SHOWN)
        .reverse()
        .map((w) => ({ name: w.name, message: w.message }));
      return res.status(200).json({ wishes });
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      body = body || {};
      if (body.website) return res.status(200).json({ ok: true }); // honeypot: bot → bỏ qua
      const entry = {
        at: new Date().toISOString(),
        name: clean(body.name, 80),
        attend: body.attend === "no" ? "no" : "yes",
        message: clean(body.message, 500),
        hidden: false,
      };
      if (!entry.name) return res.status(400).json({ ok: false, error: "Thiếu tên" });
      await append(entry);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(503).json({ ok: false, error: "Tạm thời chưa lưu được lời chúc" });
  }
};
