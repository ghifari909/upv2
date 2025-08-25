import { useRef, useState } from "react";

export default function Home() {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
    return "file";
  }

  async function uploadFile(file) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload Cloudinary gagal");

      // URL clean via API
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const fileUrl = `${baseUrl}/api/cdn?file=${data.public_id}.${data.format}`;

      const fileData = {
        name: file.name,
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        url: fileUrl,
      };

      setUploadedFiles(prev => [...prev, fileData]);
    } catch (e) {
      alert(`❌ Gagal upload: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => uploadFile(file));
    }
  }

  function copyToClipboard(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Uplinx – Upload to Cloudinary</h1>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        onClick={() => fileInputRef.current.click()}
        disabled={uploading}
      >
        {uploading ? "⏳ Uploading..." : "Pilih File"}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        hidden
        multiple
      />

      <div className="mt-6 w-full max-w-lg">
        {uploadedFiles.map((f, idx) => (
          <div
            key={idx}
            className="bg-white shadow rounded-lg p-4 mb-3 flex flex-col"
          >
            <span className="font-medium">{f.name}</span>
            <span className="text-sm text-gray-500">{f.size}</span>

            {/* ✅ Preview sesuai tipe file */}
            {f.type === "image" && (
              <img
                src={f.url}
                alt={f.name}
                className="mt-2 rounded-lg max-h-48 object-contain"
              />
            )}

            {f.type === "audio" && (
              <audio controls className="mt-2 w-full">
                <source src={f.url} type="audio/mpeg" />
                Browser tidak support audio player
              </audio>
            )}

            {f.type === "video" && (
              <video controls className="mt-2 w-full rounded-lg max-h-64">
                <source src={f.url} type="video/mp4" />
                Browser tidak support video player
              </video>
            )}

            {f.type === "file" && (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 break-all mt-1"
              >
                {f.url}
              </a>
            )}

            <button
              onClick={() => copyToClipboard(f.url, idx)}
              className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              {copiedIndex === idx ? "✅ Disalin!" : "Salin URL"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
