export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) return res.status(400).json({ error: "file query wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // deteksi ekstensi
  const parts = file.split(".");
  const publicId = parts.slice(0, -1).join(".");
  const ext = parts.pop().toLowerCase();

  let type = "raw";
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) type = "image";
  if (["mp4","webm","mov","avi","mkv"].includes(ext)) type = "video";
  if (["mp3","wav","ogg"].includes(ext)) type = "video";

  const url = `https://res.cloudinary.com/${cloudName}/${type}/upload/${publicId}.${ext}`;
  return res.redirect(302, url);
}
