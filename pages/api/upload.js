// pages/api/upload.js
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" }, // limit Vercel
  },
};

function randomName(originalName) {
  const ext = originalName.includes(".") ? "." + originalName.split(".").pop() : "";
  const randomStr = Math.random().toString(36).substring(2, 10);
  return randomStr + ext;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, content } = req.body || {};
    if (!filename || !content) {
      return res.status(400).json({ error: "filename dan content wajib" });
    }

    const repo  = process.env.GITHUB_REPO;
    const dir   = process.env.UPLOADS_DIR || "uploads";
    const token = process.env.GITHUB_TOKEN;

    if (!repo || !token) {
      return res.status(500).json({
        error: "Konfigurasi ENV belum lengkap",
        detail: {
          need: ["GITHUB_REPO", "GITHUB_TOKEN"],
          optional: ["UPLOADS_DIR"],
        },
      });
    }

    // validasi base64
    let base64Content;
    try {
      Buffer.from(content, "base64");
      base64Content = content;
    } catch {
      base64Content = Buffer.from(content).toString("base64");
    }

    const shortName = randomName(filename);
    const url = `https://api.github.com/repos/${repo}/contents/${dir}/${shortName}`;

    const ghRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${shortName}`,
        content: base64Content,
      }),
    });

    const result = await ghRes.json();

    if (result?.content?.path) {
      // 🔥 gunakan domain fix, bukan VERCEL_URL random
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const previewUrl = `${baseUrl}/api/preview?file=${encodeURIComponent(shortName)}`;

      return res.status(200).json({
        commit: result.commit,
        file: shortName,
        url: previewUrl, // absolute URL: https://upv2.vercel.app/api/preview?file=xxx
      });
    }

    return res.status(500).json({ error: "Upload gagal", detail: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
