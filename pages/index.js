import { useEffect, useRef, useState } from "react";

export default function Home() {
  const fileInputRef = useRef(null);
  const uploadAreaRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // format ukuran file
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // tipe file buat icon / keterangan
  function getFileType(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
    return "file";
  }

  // fungsi upload ke Cloudinary
  async function uploadFile(file) {
    setUploading(true);
    setUploadProgress(0);

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

      // 👉 kalau mau langsung pakai link asli Cloudinary
      // const fileUrl = data.secure_url;

      // 👉 kalau mau tetap pakai URL clean via domain kamu
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const fileUrl = `${baseUrl}/api/cdn?file=${data.public_id}.${data.format}`;

      const fileData = {
        name: file.name,
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        url: fileUrl,
        provider: "cloudinary",
      };

      setUploadedFiles(prev => [...prev, fileData]); // ✅ update state
    } catch (e) {
      alert(`❌ Gagal upload: ${e.message}`);
      throw e;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  // drag & drop
  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => uploadFile(file));
    }
  }

  function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => uploadFile(file));
    }
  }

  // copy url
  function copyToClipboard(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Uplinx – Upload to Cloudinary</h1>

      <div
        ref={uploadAreaRef}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="w-full max-w-lg h-40 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-xl bg-white"
      >
        <div className="text-center">
          <p className="text-gray-600">Drag & drop file di sini</p>
          <p className="text-gray-500">atau</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
          >
            Pilih File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            hidden
            multiple
          />
        </div>
      </div>

      {uploading && (
        <p className="mt-4 text-blue-600">⏳ Sedang upload...</p>
      )}

      <div className="mt-6 w-full max-w-lg">
        {uploadedFiles.map((f, idx) => (
          <div
            key={idx}
            className="bg-white shadow rounded-lg p-4 mb-3 flex flex-col"
          >
            <span className="font-medium">{f.name}</span>
            <span className="text-sm text-gray-500">{f.size}</span>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 break-all mt-1"
            >
              {f.url}
            </a>
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
