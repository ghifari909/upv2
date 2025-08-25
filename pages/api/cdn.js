export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "file query wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const publicId = file.split(".")[0];
  const ext = file.split(".")[1]?.toLowerCase() || "";

  // kelompokkan extension
  const imageExt = ["jpg", "jpeg", "png", "gif", "webp"];
  const videoExt = ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "ogg"]; 
  // 👆 tambahkan mp3, wav, ogg ke sini → Cloudinary taruh di /video/

  let type = "raw";
  if (imageExt.includes(ext)) type = "image";
  else if (videoExt.includes(ext)) type = "video";

  const url = `https://res.cloudinary.com/${cloudName}/${type}/upload/${publicId}.${ext}`;
  return res.redirect(302, url);
}
