

export const config = {
  api: {
    bodyParser: { sizeLimit: "110mb" }, // biar bisa upload sampai 100MB
  },
};

// 👉 fungsi bikin nama random
function randomName(originalName) {
  const ext = originalName.includes(".") ? "." + originalName.split(".").pop() : "";
  const randomStr = Math.random().toString(36).substring(2, 10); // 8 karakter
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

    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO; // user/repo
    const dir = process.env.NEXT_PUBLIC_UPLOADS_DIR || "uploads";

    // bikin nama pendek
    const shortName = randomName(filename);

    const githubToken = process.env.GITHUB_TOKEN;
    const url = `https://api.github.com/repos/${repo}/contents/${dir}/${shortName}`;

    const result = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${shortName}`,
        content: content,
      }),
    }).then(r => r.json());

    if (result?.content?.path) {
      return res.status(200).json({
        commit: result.commit,
        file: shortName, // kirim nama pendek
      });
    } else {
      return res.status(500).json({ error: "Upload gagal", detail: result });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
