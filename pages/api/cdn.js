export default async function handler(req, res) {
  const { file, type } = req.query;
  if (!file) return res.status(400).json({ error: "file query wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const publicId = file.split(".")[0];
  const ext = file.split(".")[1]?.toLowerCase() || "";

  // default fallback
  let resourceType = type || "raw";

  // kalau user gak kirim type, baru kita tebak
  if (!type) {
    const imageExt = ["jpg", "jpeg", "png", "gif", "webp"];
    const videoExt = ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "ogg"];
    if (imageExt.includes(ext)) resourceType = "image";
    else if (videoExt.includes(ext)) resourceType = "video";
  }

  const url = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}.${ext}`;
  return res.redirect(302, url);
}
