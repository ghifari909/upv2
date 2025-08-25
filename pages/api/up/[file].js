// pages/api/up/[file].js
export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "file wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // deteksi ekstensi
  const ext = file.split(".").pop().toLowerCase();
  let type = "raw";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) type = "image";
  if (["mp4","webm","mov","avi","mkv"].includes(ext)) type = "video";
  if (["mp3","wav","ogg"].includes(ext)) type = "video"; // audio pakai resource_type=video di Cloudinary

  const cloudUrl = `https://res.cloudinary.com/${cloudName}/${type}/upload/${file}`;

  const response = await fetch(cloudUrl);
  if (!response.ok) {
    return res.status(response.status).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  response.body.pipe(res);
}
