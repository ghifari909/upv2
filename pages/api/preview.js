// pages/api/preview.js
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

function randomName(originalName) {
  const ext = originalName.includes(".") ? "." + originalName.split(".").pop() : "";
  const randomStr = Math.random().toString(36).substring(2, 10);
  return randomStr + ext;
}

export default async function handler(req, res) {
  const repo = process.env.GITHUB_REPO;
  const dir  = process.env.UPLOADS_DIR || "uploads";
  const token = process.env.GITHUB_TOKEN;

  if (req.method === "GET") {
    // /api/preview?file=<shortName>
    const file = req.query.file;
    if (!file) return res.status(400).json({ error: "query ?file wajib" });
    if (!repo) return res.status(500).json({ error: "GITHUB_REPO belum di-set" });

    const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${dir}/${file}`;
    // Redirect agar browser langsung menampilkan/unduh file
    return res.redirect(302, rawUrl);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, content } = req.body || {};
    if (!filename || !content) {
      return res.status(400).json({ error: "filename dan content wajib" });
    }
    if (!repo || !token) {
      return res.status(500).json({
        error: "ENV belum lengkap",
        detail: { need: ["GITHUB_REPO", "GITHUB_TOKEN"], optional: ["UPLOADS_DIR"] },
      });
    }

    const shortName = randomName(filename);
    const base64Content = Buffer.from(content, "base64").toString("base64");
    const url = `https://api.github.com/repos/${repo}/contents/${dir}/${shortName}`;

    const response = await fetch(url, {
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

    const result = await response.json();
    // console.log("GitHub preview response:", result);

    if (result?.content?.path) {
      const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${dir}/${shortName}`;
      return res.status(200).json({
        commit: result.commit,
        file: shortName,
        url: rawUrl,
      });
    }
    return res.status(500).json({ error: "Upload gagal", detail: result });
  } catch (err) {
    // console.error("Preview error:", err);
    return res.status(500).json({ error: err.message });
  }
}
