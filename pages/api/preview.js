// pages/api/preview.js
export const config = {
  api: {
    bodyParser: false, // kita streaming, bukan JSON
  },
};

import mime from "mime";
import { Readable } from "stream";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const repo = process.env.GITHUB_REPO;
  const dir  = process.env.UPLOADS_DIR || "uploads";
  const file = req.query.file;

  if (!repo || !file) {
    return res.status(400).json({ error: "GITHUB_REPO & query ?file wajib" });
  }

  try {
    const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${dir}/${file}`;
    const ghRes = await fetch(rawUrl);

    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ error: "File not found di GitHub" });
    }

    // deteksi MIME type berdasarkan ekstensi
    const contentType = mime.getType(file) || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");

    // ✅ konversi WebStream → Node Stream
    const nodeStream = Readable.fromWeb(ghRes.body);
    nodeStream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
