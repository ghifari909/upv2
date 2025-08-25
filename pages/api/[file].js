// pages/[file].js
export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "file wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // deteksi ekstensi buat resource_type
  const ext = file.split(".").pop().toLowerCase();
  let type = "raw";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) type = "image";
  if (["mp4", "webm", "mov", "avi", "mkv", "mp3", "wav", "ogg"].includes(ext)) type = "video";

  // URL Cloudinary asli
  const cloudUrl = `https://res.cloudinary.com/${cloudName}/${type}/upload/${file}`;

  const response = await fetch(cloudUrl);
  if (!response.ok) {
    return res.status(response.status).json({ error: "File not found" });
  }

  // pass header biar preview WA/Telegram jalan
  res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000"); // cache lama biar cepat
  response.body.pipe(res);
}
