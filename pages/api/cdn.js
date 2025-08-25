export default async function handler(req, res) {
  const { file, type } = req.query;
  if (!file) return res.status(400).json({ error: "file query wajib" });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const publicId = file.split(".")[0];
  const ext = file.split(".")[1] || "";

  // pake resource_type asli dari Cloudinary
  const resourceType = type || "raw";

  const url = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}.${ext}`;
  return res.redirect(302, url);
}
