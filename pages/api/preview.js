export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" }, // tetap hati2 limit Vercel
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
    const { filename, content } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: "filename dan content wajib" });
    }

    const repo = process.env.GITHUB_REPO; // jangan NEXT_PUBLIC
    const dir = process.env.UPLOADS_DIR || "uploads";
    const shortName = randomName(filename);

    // pastikan content base64
    const base64Content = Buffer.from(content, "base64").toString("base64");

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
    console.log("GitHub preview response:", result);

    if (result?.content?.path) {
      const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${dir}/${shortName}`;
      return res.status(200).json({
        commit: result.commit,
        file: shortName,
        url: rawUrl, // kasih link preview langsung
      });
    } else {
      return res.status(500).json({ error: "Upload gagal", detail: result });
    }
  } catch (err) {
    console.error("Preview error:", err);
    return res.status(500).json({ error: err.message });
  }
}
