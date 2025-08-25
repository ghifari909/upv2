import { useRef, useState } from "react";

export default function Home() {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // format ukuran file
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // deteksi type file
  function getFileType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "image";
    if (["mp4","mov","avi","mkv","webm"].includes(ext)) return "video";
    if (["mp3","wav","ogg"].includes(ext)) return "audio";
    return "file";
  }

  async function uploadFile(file) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload gagal");

      // buat link CDN custom
      const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN || "https://cdn.upv2.app";
      const fileUrl = `${cdnDomain}/${data.public_id}.${data.format}`;

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-extrabold text-indigo-700 mb-4">Uplinx</h1>
      <p className="text-gray-600 mb-8">Upload & share your files instantly 🚀</p>

      {/* tombol upload */}
      <button
        onClick={() => fileInputRef.current.click()}
        disabled={uploading}
        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
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

      {/* daftar file */}
      <div className="mt-10 w-full max-w-2xl space-y-6">
        {uploadedFiles.map((f, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">{f.name}</h2>
                <p className="text-sm text-gray-500">{f.size}</p>
              </div>
              <button
                onClick={() => copyToClipboard(f.url, idx)}
                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition"
              >
                {copiedIndex === idx ? "✅ Disalin" : "Salin URL"}
              </button>
            </div>

            {/* preview */}
            <div className="mt-4">
              {f.type === "image" && (
                <img
                  src={f.url}
                  alt={f.name}
                  className="rounded-lg max-h-64 object-contain mx-auto"
                />
              )}
              {f.type === "audio" && (
                <audio controls className="w-full mt-2">
                  <source src={f.url} type="audio/mpeg" />
                </audio>
              )}
              {f.type === "video" && (
                <video controls className="w-full mt-2 rounded-lg max-h-72">
                  <source src={f.url} type="video/mp4" />
                </video>
              )}
              {f.type === "file" && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 break-all"
                >
                  {f.url}
                </a>
              )}
            </div>

            {/* url link */}
            <div className="mt-3">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-700 underline break-all"
              >
                {f.url}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
