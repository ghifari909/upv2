import { useEffect, useRef, useState } from "react";

export default function Home() {
  const fileInputRef = useRef(null);
  const uploadAreaRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

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

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

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
      await new Promise(resolve => setTimeout(resolve, 500));

    
      const uploadedFile = {
        name: data.file,
        type: getFileType(file.name),
        size: formatFileSize(file.size),
        url: `${baseUrl}/api/preview?file=${encodeURIComponent(data.file)}`,
        commit: data.commit?.sha?.slice(0, 7) || "-",
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      return uploadedFile;
    } catch (e) {
      alert(`❌ Gagal upload: ${e.message}`);
      throw e;
    } finally {
      clearInterval(interval);
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

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  }

  function handleFiles(list) {
    const files = Array.from(list || []);
    if (files.length === 0) return;
    for (const f of files) {
      if (f.size > 100 * 1024 * 1024) {
        alert(`❌ ${f.name}: ukuran > 100MB`);
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
  {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2 animate-pulse-slow">
          uplinx
        </h1>
        <p className="text-gray-300 text-lg">Platform Upload File Terpercaya & Aman</p>
      </header>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Main Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
          {/* Upload Area - hanya tampil jika belum ada file yang diupload */}
          {uploadedFiles.length === 0 && !uploading && (
            <div
              ref={uploadAreaRef}
              id="uploadArea"
              className="border-2 border-dashed border-cyan-400/50 rounded-2xl p-12 text-center hover:border-cyan-400 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="animate-float">
                <svg className="mx-auto h-16 w-16 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              

              <p className="text-sm text-gray-400 mt-4">Ukuran maksimal: 100MB per file</p>
            </div>
          )}

          {/* Progress Bar - tampil saat uploading */}
          {uploading && (
            <div className="border-2 border-cyan-400/50 rounded-2xl p-12 text-center">
              <div className="animate-pulse">
                <svg className="mx-auto h-16 w-16 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <h3 className="text-2xl font-semibold text-white mb-2">Mengupload File...</h3>
              <p className="text-gray-300 mb-6">Harap tunggu sebentar</p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 h-4 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>

              <p className="text-cyan-400 text-lg font-semibold">{uploadProgress}%</p>
            </div>
          )}

          {/* Upload Results - tampil setelah upload berhasil */}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          )}
                        </svg>
                        <span>{copiedIndex === index ? 'Tersalin!' : 'Salin'}</span>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 15.5v-11a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2h-16a2 2 0 01-2-2z"></path>
                      </svg>
                      Preview
                    </a>
                    <a
                      href={file.url}
                      download={file.name}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Download
                    </a>
                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Security Feature */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-green-500/20 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white">Data Aman</h4>
            </div>
            <p className="text-gray-300">Enkripsi end-to-end dan proteksi berlapis untuk menjamin keamanan file Anda</p>
          </div>

          {/* Permanent Storage */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/20 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white">Penyimpanan Permanen</h4>
            </div>
            <p className="text-gray-300">File tersimpan permanent dengan backup otomatis dan akses 24/7 tanpa batas waktu</p>
          </div>

          {/* Fast Upload */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/20 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white">Upload Cepat</h4>
            </div>
            <p className="text-gray-300">Teknologi kompresi canggih dan server berkecepatan tinggi untuk upload super cepat</p>
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 backdrop-blur-lg rounded-2xl p-8 border border-cyan-400/30">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Kenapa Pilih uplinx?</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="bg-cyan-400 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h5 className="text-lg font-semibold text-white">Privasi Terjamin</h5>
                <p className="text-gray-300">File pribadi Anda tidak akan pernah dibagikan atau diakses pihak ketiga</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-400 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h5 className="text-lg font-semibold text-white">Multi Format</h5>
                <p className="text-gray-300">Support semua jenis file: gambar, video, dokumen, audio, dan lainnya</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-400 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h5 className="text-lg font-semibold text-white">Link Sharing</h5>
                <p className="text-gray-300">Bagikan file dengan mudah melalui link aman yang dapat dikustomisasi</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-400 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h5 className="text-lg font-semibold text-white">Tanpa Iklan</h5>
                <p className="text-gray-300">Pengalaman upload yang bersih tanpa gangguan iklan atau pop-up</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
