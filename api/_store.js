// Lưu lời chúc vào 1 file JSON.
// - Trên Vercel: file wishes.json ở nhánh "data" của repo GitHub (qua GitHub API, cần env GITHUB_TOKEN).
// - Chạy local (node dev-server.js): file data/wishes.json trên máy.
// Định dạng file: [{ "at": ISO time, "name": "...", "attend": "yes|no", "message": "...", "hidden": false }]
// Muốn ẩn 1 lời chúc: sửa "hidden": true trong file.
"use strict";
const fs = require("fs");
const path = require("path");

const REPO = process.env.GITHUB_REPO || "hoanganhvu20082000/thiep_cuoi";
const BRANCH = process.env.GITHUB_BRANCH || "data";
// Thiệp nhà gái: lưu riêng, không lẫn với lời chúc nhà trai (wishes.json)
const FILE = process.env.GITHUB_FILE || "wishes-nha-gai.json";
const LOCAL = path.join(__dirname, "..", "data", "wishes.json");

const gh = (url, init = {}) =>
  fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}${url}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "thiep-cuoi",
      ...(init.headers || {}),
    },
  });

async function readGithub() {
  const r = await gh(`?ref=${BRANCH}`);
  if (r.status === 404) return { list: [], sha: undefined };
  if (!r.ok) throw new Error(`GitHub read ${r.status}`);
  const j = await r.json();
  return { list: JSON.parse(Buffer.from(j.content, "base64").toString("utf8") || "[]"), sha: j.sha };
}

async function writeGithub(list, sha, note) {
  const r = await gh("", {
    method: "PUT",
    body: JSON.stringify({
      message: `wish: ${note}`.slice(0, 72),
      branch: BRANCH,
      sha,
      content: Buffer.from(JSON.stringify(list, null, 2) + "\n", "utf8").toString("base64"),
    }),
  });
  if (r.status === 409 || r.status === 422) return false; // có người ghi cùng lúc → thử lại
  if (!r.ok) throw new Error(`GitHub write ${r.status}`);
  return true;
}

const useGithub = () => !!process.env.GITHUB_TOKEN;

async function readAll() {
  if (useGithub()) return (await readGithub()).list;
  try { return JSON.parse(fs.readFileSync(LOCAL, "utf8")); } catch { return []; }
}

async function append(entry) {
  if (useGithub()) {
    for (let i = 0; i < 4; i++) {
      const { list, sha } = await readGithub();
      list.push(entry);
      if (await writeGithub(list, sha, entry.name)) return;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
    throw new Error("GitHub write conflict");
  }
  if (process.env.VERCEL) throw new Error("Chưa cấu hình GITHUB_TOKEN trên Vercel");
  const list = await readAll();
  list.push(entry);
  fs.mkdirSync(path.dirname(LOCAL), { recursive: true });
  fs.writeFileSync(LOCAL, JSON.stringify(list, null, 2) + "\n", "utf8");
}

module.exports = { readAll, append };
