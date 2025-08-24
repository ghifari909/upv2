// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const fileInputRef = useRef(null);
  const uploadAreaRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // NOTE: baseUrl tidak diperlukan lagi, kita langsung pakai rawUrl dari API

  async function uploadFile(file) {
  const asDataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const base64 = asDataURL.split(",")[1];

  setUploading(true);
  setUploadProgress(0);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        content: base64,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload gagal");

    setUploadProgress(100);
    await new Promise(resolve => setTimeout(resolve, 400));

    const uploadedFile = {
      name: data.file,
      type: getFileType(file.name),
      size: formatFileSize(file.size),
      url: data.url, // sekarang absolute: https://upv2.vercel.app/api/preview?file=xxx
      commit: data.commit?.sha?.slice(0, 7) || "-",
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);
    return uploadedFile;
  } catch (e) {
    alert(`❌ Gagal upload: ${e.message}`);
    throw e;
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
}

  function getFileType(filename) {
    const extension = filename.split(".").pop().toLowerCase();
    if (["jpg","jpeg","png","gif","bmp","webp","svg"].includes(extension)) return "Gambar";
    if (["mp4","mov","avi","wmv","flv","webm"].includes(extension)) return "Video";
    if (["pdf"].includes(extension)) return "PDF Document";
    if (["doc","docx"].includes(extension)) return "Word Document";
    if (["xls","xlsx"].includes(extension)) return "Excel Spreadsheet";
    if (["ppt","pptx"].includes(extension)) return "PowerPoint Presentation";
    if (["mp3","wav","ogg","flac"].includes(extension)) return "Audio File";
    if (["zip","rar","7z","tar","gz"].includes(extension)) return "Arsip Terkompresi";
    return "File";
  }

  function getFileIcon(type) {
    // Ikon sederhana berbasis jenis file (SVG path)
    switch (true) {
      case /Gambar/i.test(type):
        return (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18v14H3zM8 13l2.5 3L14 12l4 5H6z" />);
      case /Video/i.test(type):
        return (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h10v12H4z" />);
      case /PDF|Word|Excel|PowerPoint|Document|File/i.test(type):
        return (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3h8l4 4v14H7zM7 3v6h6" />);
      case /Audio/i.test(type):
        return (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V8l10-2v11M5 19a2 2 0 100-4 2 2 0 000 4z" />);
      case /Arsip/i.test(type):
        return (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16v10H4zM4 7l4-4h8l4 4" />);
      default:
        return (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v16H4z" />);
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  }

  function copyToClipboard(text, index) {
    navigator.clipboard?.writeText(text)
      .then(() => setCopiedIndex(index))
      .catch(() => alert("Gagal menyalin"));
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  function uploadAnother() {
    setUploadedFiles([]);
    fileInputRef.current?.click();
  }

  function handleFiles(list) {
    const files = Array.from(list || []);
    if (files.length === 0) return;

    // Selaraskan limit dengan API: 10MB
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        alert(`❌ ${f.name}: ukuran > 10MB (batas server)`);
        return;
      }
    }
    Promise.all(files.map(uploadFile)).catch(console.error);
  }

  useEffect(() => {
    const area = uploadAreaRef.current;
    if (!area) return;

    const prevent = e => { e.preventDefault(); e.stopPropagation(); };
    const highlight = () => area.classList.add("border-cyan-400", "bg-white/10");
    const unhighlight = () => area.classList.remove("border-cyan-400", "bg-white/10");
    const handleDrop = e => { prevent(e); unhighlight(); handleFiles(e.dataTransfer.files); };

    ["dragenter","dragover","dragleave","drop"].forEach(ev => area.addEventListener(ev, prevent));
    ["dragenter","dragover"].forEach(ev => area.addEventListener(ev, highlight));
    ["dragleave","drop"].forEach(ev => area.addEventListener(ev, unhighlight));
    area.addEventListener("drop", handleDrop);

    return () => {
      ["dragenter","dragover","dragleave","drop"].forEach(ev => area.removeEventListener(ev, prevent));
      ["dragenter","dragover"].forEach(ev => area.removeEventListener(ev, highlight));
      ["dragleave","drop"].forEach(ev => area.removeEventListener(ev, unhighlight));
      area.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="text-center py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2 animate-pulse-slow">
          uplinx
        </h1>
        <p className="text-gray-300 text-lg">Platform Upload File Terpercaya & Aman</p>
      </header>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
          {uploadedFiles.length === 0 && !uploading && (
            <div
              ref={uploadAreaRef}
              id="uploadArea"
              className="border-2 border-dashed border-cyan-400/50 rounded-2xl p-12 text-center hover:border-cyan-400 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="animate-float">
                <svg className="mx-auto h-16 w-16 text-cyan-4 00 mb-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <h3 className="text-2xl font-semibold text-white mb-2">Pilih File untuk Upload</h3>
              <p className="text-gray-300 mb-6">Drag & drop file di sini atau klik untuk memilih</p>

              <input
                type="file"
                id="fileInput"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
              />
              <p className="text-sm text-gray-400 mt-4">Ukuran maksimal: 10MB per file</p>
            </div>
          )}

          {uploading && (
            <div className="border-2 border-cyan-400/50 rounded-2xl p-12 text-center">
              <div className="animate-pulse">
                <svg className="mx-auto h-16 w-16 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Mengupload File...</h3>
              <p className="text-gray-300 mb-6">Harap tunggu sebentar</p>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-cyan-400 text-lg font-semibold">{uploadProgress}%</p>
            </div>
          )}

          {uploadedFiles.length > 0 && !uploading && (
            <div id="uploadResults" className="mt-8">
              <h3 className="text-2xl font-semibold text-white mb-6 text-center">File Berhasil Diupload!</h3>

              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 backdrop-blur-lg rounded-2xl p-6 border border-cyan-400/30 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-cyan-500/20 p-3 rounded-xl mr-4">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {getFileIcon(file.type)}
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-white truncate max-w-xs">{file.name}</h4>
                        <p className="text-gray-400">{file.type}</p>
                      </div>
                    </div>
                    <span className="bg-cyan-400/20 text-cyan-300 text-sm font-medium py-1 px-3 rounded-full">{file.size}</span>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <p className="text-gray-300 text-sm mb-2">Link untuk berbagi:</p>
                    <div className="flex items-center">
                      <input
                        type="text"
                        readOnly
                        className="flex-grow bg-white/10 border border-cyan-400/30 text-white rounded-l-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        value={file.url}
                      />
                      <button
                        onClick={() => copyToClipboard(file.url, index)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-4 rounded-r-lg transition-colors duration-200 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {copiedIndex === index ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2z" />
                          )}
                        </svg>
                        <span>{copiedIndex === index ? "Tersalin!" : "Salin"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 15.5v-11a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2h-16a2 2 0 01-2-2z" />
                      </svg>
                      Preview
                    </a>
                    <a
                      href={file.url}
                      download={file.name}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center" onClick={() => copyToClipboard(file.url, index)}>
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Bagikan
                    </button>
                  </div>
                </div>
              ))}

              <div className="text-center">
                <button
                  onClick={uploadAnother}
                  className="bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Upload File Lain
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ... fitur & footer tetap ... */}
        <footer className="text-center py-8 mt-12">
          <div className="bg-white/5 backdrop-blur-sm py-4">
            <p className="text-gray-400">
              © 2024 <span className="text-cyan-400 font-semibold">PariBotz</span>. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-1">Powered by GitHub API & Next.js</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
