export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "file query wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const publicId = file.split(".")[0];
  const ext = file.split(".")[1]?.toLowerCase() || "";

  // kelompokkan extension
  const imageExt = ["jpg", "jpeg", "png", "gif", "webp"];
  const videoExt = ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "ogg"]; 
  const docExt   = ["pdf", "zip", "txt", "csv", "json", "docx"];

  let type = "raw"; // default fallback
  if (imageExt.includes(ext)) type = "image";
  else if (videoExt.includes(ext)) type = "video";
  else if (docExt.includes(ext)) type = "raw";

  const url = `https://res.cloudinary.com/${cloudName}/${type}/upload/${publicId}.${ext}`;
  
  // 🚀 tetap redirect → tapi user gak lihat url ini, mereka tetap lihat /api/cdn?file=...
  return res.redirect(302, url);
}
