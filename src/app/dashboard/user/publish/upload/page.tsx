"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, Video, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UserPublishUploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setSelectedFile(file);
        toast.success(`Video file loaded: ${file.name}`);
      } else {
        toast.error("Please drop a valid video file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      toast.success(`Video file loaded: ${file.name}`);
    }
  };

  const handleStartPublish = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success("Video upload complete! Processing metadata...");
          setTimeout(() => {
            router.push("/dashboard/user/publish");
          }, 1000);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard/user/publish"
          className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors text-left"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Publishing Hub
        </Link>

        {/* Heading */}
        <div className="text-left space-y-1 pb-2">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Upload & Publish</h1>
          <p className="text-sm font-semibold text-zinc-400">
            Publish external video files directly to your connected YouTube, TikTok, and Instagram channels.
          </p>
        </div>

        {/* Upload Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm space-y-6">
          {!isUploading && !selectedFile && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 transition-all ${
                dragActive ? "border-blue-500 bg-blue-50/20" : "border-zinc-200 bg-zinc-50/30 hover:bg-zinc-50"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-650 flex items-center justify-center border border-blue-100">
                <UploadCloud size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-800">Drag & drop video files here</h3>
                <p className="text-xs font-semibold text-zinc-400">
                  MP4, MOV, or WEBM up to 1GB.
                </p>
              </div>
              <div className="relative">
                <label className="h-9 px-4 bg-zinc-850 hover:bg-zinc-950 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none active:scale-[0.98]">
                  Browse Files
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                  />
                </label>
              </div>
            </div>
          )}

          {selectedFile && !isUploading && (
            <div className="border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between items-center text-center space-y-5 bg-zinc-50/50">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Video size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 truncate max-w-md">{selectedFile.name}</h4>
                <p className="text-xs text-zinc-400 font-bold mt-1">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="h-9 px-4 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Remove File
                </button>
                <button
                  onClick={handleStartPublish}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  Start Uploading
                </button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="border border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-50/30">
              <Loader2 size={36} className="animate-spin text-blue-600" />
              <div className="space-y-2 w-full max-w-xs">
                <h4 className="text-sm font-bold text-zinc-800">Uploading Video File...</h4>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 block">{uploadProgress}% complete</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
