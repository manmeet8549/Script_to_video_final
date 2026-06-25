"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, Video, Loader2, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

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

  const handleStartPublish = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // jsonOk() wraps the payload in { data: ... }, so the URL lives at
            // response.data.url — not response.url.
            const raw = JSON.parse(xhr.responseText);
            const videoUrl: string = raw?.data?.url ?? raw?.url;
            if (!videoUrl) throw new Error("Upload succeeded but no URL was returned.");

            toast.success("Video upload complete! Preparing publication...");

            const newProj = await api.post<any>("/api/projects", {
              title: selectedFile.name.replace(/\.[^/.]+$/, ""),
              description: `Uploaded video: ${selectedFile.name}`,
              status: "editing",
            });

            await api.patch(`/api/projects/${newProj.id}`, {
              video_url: videoUrl,
              progress_percent: 80,
            });

            toast.success("Publication record initialized.");

            setTimeout(() => {
              router.push(`/dashboard/user/projects/${newProj.id}/publish`);
            }, 1000);
          } catch (err) {
            console.error("Failed to initialize project record:", err);
            toast.error("Failed to initialize project record for uploaded video.");
            setIsUploading(false);
          }
        } else {
          toast.error("Failed to upload video to storage.");
          setIsUploading(false);
        }
      });

      xhr.addEventListener("error", () => {
        toast.error("Network error during file upload.");
        setIsUploading(false);
      });

      xhr.open("POST", "/api/media/upload");
      xhr.send(formData);
    } catch (err) {
      console.error("Upload initialization failed:", err);
      toast.error("Upload initialization failed.");
      setIsUploading(false);
    }
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

        {/* Supported formats info bar */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
          Supported formats: MP4, MOV, WEBM — up to 1GB
          <span className="mx-2 text-zinc-200">|</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          Minimum resolution: 720p recommended for best quality
        </div>

        {/* Upload Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm space-y-6">
          {/* Drag & Drop zone */}
          {!isUploading && !selectedFile && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 transition-all ${
                dragActive
                  ? "border-brand-green bg-brand-green-light/20"
                  : "border-zinc-200 bg-zinc-50/30 hover:bg-zinc-50 hover:border-zinc-300"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors ${
                  dragActive
                    ? "bg-brand-green-light border-brand-green text-brand-green"
                    : "bg-zinc-100 border-zinc-200 text-zinc-400"
                }`}
              >
                <UploadCloud size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-800">Drag & drop your video here</h3>
                <p className="text-xs font-semibold text-zinc-400">
                  or browse for a file from your device
                </p>
              </div>
              <div className="relative">
                <label className="h-9 px-5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center select-none active:scale-[0.98] shadow-sm shadow-brand-green/15">
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

          {/* File selected state */}
          {selectedFile && !isUploading && (
            <div className="border border-brand-green/30 rounded-2xl p-6 flex flex-col justify-between items-center text-center space-y-5 bg-brand-green-light/10">
              <div className="w-12 h-12 rounded-xl bg-brand-green-light border border-brand-green/20 text-brand-green flex items-center justify-center">
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
                  className="h-9 px-4 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X size={13} />
                  Remove
                </button>
                <button
                  onClick={handleStartPublish}
                  className="h-9 px-5 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-brand-green/20 active:scale-[0.98] flex items-center gap-1.5"
                >
                  <UploadCloud size={14} />
                  Start Uploading
                </button>
              </div>
            </div>
          )}

          {/* Upload progress state */}
          {isUploading && (
            <div className="border border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6 bg-zinc-50/30">
              {uploadProgress < 100 ? (
                <>
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-green/20" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-brand-green border-t-transparent animate-spin"
                      style={{ animationDuration: "0.8s" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-extrabold text-brand-green">{uploadProgress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2 w-full max-w-xs">
                    <h4 className="text-sm font-bold text-zinc-800">Uploading Video...</h4>
                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-green transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 block">
                      {uploadProgress}% complete — please keep this tab open
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-brand-green-light border border-brand-green/20 flex items-center justify-center">
                    <CheckCircle size={28} className="text-brand-green" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-800">Upload Complete!</h4>
                    <p className="text-xs font-semibold text-zinc-400">
                      Preparing your project for publishing...
                    </p>
                  </div>
                  <Loader2 size={18} className="animate-spin text-brand-green" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Tips */}
        {!isUploading && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wide">
              Upload Tips
            </h4>
            <ul className="space-y-2">
              {[
                "Use MP4 with H.264 encoding for best platform compatibility.",
                "Ensure your video includes captions for better accessibility.",
                "Keep titles under 100 characters to fit all platform character limits.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-semibold text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-green shrink-0 mt-1.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
