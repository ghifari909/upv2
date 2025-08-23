export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" }, // jangan terlalu besar, Vercel limit serverless ±10MB
  },
};

// 👉 fungsi bikin nama random
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
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: "filename dan content wajib" });
    }

    // pastikan content base64
    let base64Content;
    try {
      // kalau user sudah kirim base64, validasi aja
      Buffer.from(content, "base64");
      base64Content = content;
    } catch (e) {
      // kalau bukan base64 → convert
      base64Content = Buffer.from(content).toString("base64");
    }

    const repo = process.env.GITHUB_REPO; // jangan pake NEXT_PUBLIC
    const dir = process.env.UPLOADS_DIR || "uploads";
    const shortName = randomName(filename);

    const githubToken = process.env.GITHUB_TOKEN;
    const url = `https://api.github.com/repos/${repo}/contents/${dir}/${shortName}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${shortName}`,
        content: base64Content,
      }),
    });

    const result = await response.json();
    console.log("GitHub response:", result); // 🔎 debug di Vercel Logs

    if (result?.content?.path) {
      return res.status(200).json({
        commit: result.commit,
        file: shortName,
      });
    } else {
      return res.status(500).json({ error: "Upload gagal", detail: result });
    }
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message });
  }
}
