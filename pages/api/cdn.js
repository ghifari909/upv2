export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "file query wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const publicId = file.split(".")[0];
  const ext = file.split(".")[1] || "mp4";

  const videoExt = ["mp4", "mov", "avi", "mkv"];
  const imageExt = ["jpg", "jpeg", "png", "gif", "webp"];
  const type = videoExt.includes(ext) ? "video" : imageExt.includes(ext) ? "image" : "raw";

  const url = `https://res.cloudinary.com/${cloudName}/${type}/upload/${publicId}.${ext}`;
  return res.redirect(302, url);
}
