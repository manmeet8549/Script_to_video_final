"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  ArrowRight,
  Upload,
  Video,
  Eye,
  Trash2,
  Edit2,
  Plus,
  Loader2,
  X,
  Check,
  ChevronDown,
  Globe,
  Settings,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api/client";

// Custom SVGs for platforms
const YoutubeIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

const InstagramIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TiktokIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const XIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const LinkedinIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const FacebookIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

type DBAccount = {
  id: string;
  platform: string;
  zernio_account_id: string;
  channel_name: string;
  account_handle: string;
  is_default: boolean;
};

type DBHistoryItem = {
  id: string;
  platform: string;
  status: string;
  watch_url: string | null;
  title: string | null;
  description: string | null;
  error: string | null;
  created_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  social_accounts?: {
    channel_name: string;
    account_handle: string;
  } | null;
};

type WorkspaceVideo = {
  id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
};

const PLATFORMS = [
  { key: "youtube", name: "YouTube", icon: <YoutubeIcon size={18} />, colorBg: "bg-red-500", textBg: "text-red-500", border: "border-red-200" },
  { key: "linkedin", name: "LinkedIn", icon: <LinkedinIcon size={16} />, colorBg: "bg-blue-600", textBg: "text-blue-600", border: "border-blue-200" },
  { key: "facebook", name: "Facebook", icon: <FacebookIcon size={16} />, colorBg: "bg-blue-700", textBg: "text-blue-700", border: "border-blue-300" },
  { key: "instagram", name: "Instagram", icon: <InstagramIcon size={18} />, colorBg: "bg-pink-600", textBg: "text-pink-600", border: "border-pink-200" },
  { key: "tiktok", name: "TikTok", icon: <TiktokIcon size={16} />, colorBg: "bg-zinc-900", textBg: "text-zinc-900", border: "border-zinc-300" },
  { key: "x", name: "Twitter/X", icon: <XIcon size={14} />, colorBg: "bg-zinc-800", textBg: "text-zinc-800", border: "border-zinc-200" },
];

interface PublishSectionProps {
  initialProjectId?: string;
}

export function PublishSection({ initialProjectId }: PublishSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data Loading States
  const [accounts, setAccounts] = useState<DBAccount[]>([]);
  const [history, setHistory] = useState<DBHistoryItem[]>([]);
  const [videos, setVideos] = useState<WorkspaceVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected state
  const [selectedVideo, setSelectedVideo] = useState<WorkspaceVideo | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({});
  const [platformAccounts, setPlatformAccounts] = useState<Record<string, string>>({}); // platform -> accountId
  const [activeTab, setActiveTab] = useState<string>("");

  // Platform specific input copy fields
  const [ytTitle, setYtTitle] = useState("");
  const [ytDesc, setYtDesc] = useState("");
  const [ytTags, setYtTags] = useState("");
  const [ytVisibility, setYtVisibility] = useState("public");

  const [linkedinCaption, setLinkedinCaption] = useState("");
  const [facebookCaption, setFacebookCaption] = useState("");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [tiktokCaption, setTiktokCaption] = useState("");
  const [twitterText, setTwitterText] = useState("");

  // Scheduling states
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Account Management States
  const [managingPlatform, setManagingPlatform] = useState<string | null>(null);
  const [renameAccountId, setRenameAccountId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showSimulateInput, setShowSimulateInput] = useState(false);
  const [simulateName, setSimulateName] = useState("");

  // File Upload states (for custom local video)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Submitting publish task state
  const [isPublishing, setIsPublishing] = useState(false);

  // Post-publish results modal
  const [showResults, setShowResults] = useState(false);
  const [publishResults, setPublishResults] = useState<DBHistoryItem[]>([]);

  // Load everything
  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, historyData, projectsData] = await Promise.all([
        api.get<DBAccount[]>("/api/publish/accounts"),
        api.get<DBHistoryItem[]>("/api/publish/status"),
        api.get<WorkspaceVideo[]>("/api/projects"),
      ]);

      setAccounts(accountsData);
      setHistory(historyData);

      // Filter only finished/export projects with video urls
      const publishableVideos = projectsData.filter(v => v.video_url);
      setVideos(publishableVideos);

      // If initialProjectId is provided, set the selected video
      if (initialProjectId) {
        const matchingVideo = projectsData.find(v => v.id === initialProjectId);
        if (matchingVideo) {
          setSelectedVideo(matchingVideo);
          // Set initial copy templates
          setYtTitle(matchingVideo.title);
          setYtDesc(`Check out this video!`);
          setLinkedinCaption(`Check out this video!`);
          setFacebookCaption(`Check out this video!`);
          setInstagramCaption(`Check out this video!`);
          setTiktokCaption(`Check out this video!`);
          setTwitterText(`Check out this video!`);
        }
      }

      // Automatically pre-populate default accounts for platforms
      const initialPlatformAccounts: Record<string, string> = {};
      PLATFORMS.forEach(p => {
        const platformAccs = accountsData.filter(a => a.platform === p.key);
        const defAcc = platformAccs.find(a => a.is_default) || platformAccs[0];
        if (defAcc) {
          initialPlatformAccounts[p.key] = defAcc.id;
        }
      });
      setPlatformAccounts(initialPlatformAccounts);

    } catch (err) {
      console.error("Failed to load publishing console data:", err);
      toast.error("Failed to load page data. Check backend configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialProjectId]);

  // Status Polling logic
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only poll if there's any active publishing task
      const hasActive = history.some(h => h.status === "publishing" || h.status === "Preparing video...");
      if (hasActive) {
        try {
          const historyData = await api.get<DBHistoryItem[]>("/api/publish/status");
          setHistory(historyData);
        } catch {}
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [history]);

  // Handles platform toggling
  const handleTogglePlatform = (platformKey: string) => {
    setSelectedPlatforms(prev => {
      const next = { ...prev, [platformKey]: !prev[platformKey] };
      // Select the active tab if none is selected, or update active tab
      if (next[platformKey]) {
        setActiveTab(platformKey);
      } else if (activeTab === platformKey) {
        // Find another selected platform to make active
        const remaining = Object.keys(next).find(k => next[k]);
        setActiveTab(remaining || "");
      }
      return next;
    });
  };

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Asks the server for the Zernio OAuth URL, then navigates the browser to it.
  // We only navigate on success — if the Zernio key is missing/invalid the error
  // is shown as a toast and the page stays put (no confusing "refresh").
  const handleConnectRedirect = async (platform: string) => {
    setConnectingPlatform(platform);
    const toastId = toast.loading(`Preparing ${platform} connection...`);
    try {
      const { auth_url } = await api.post<{ auth_url: string }>(
        "/api/integrations/social-auth",
        { platform },
      );
      toast.dismiss(toastId);
      if (!auth_url) {
        toast.error("Zernio did not return a login URL. Please try again.");
        setConnectingPlatform(null);
        return;
      }
      // Redirect the whole window to the platform's OAuth login page.
      window.location.href = auth_url;
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || "Failed to start the connection. Check the Zernio API key.");
      setConnectingPlatform(null);
    }
  };

  // Add simulated/mock account for developer convenience
  const handleAddSimulatedAccount = async () => {
    if (!simulateName.trim() || !managingPlatform) return;
    try {
      const mockId = `mock-${managingPlatform}-${Date.now()}`;
      await api.post("/api/publish/accounts", {
        platform: managingPlatform,
        zernio_account_id: mockId,
        channel_name: simulateName.trim(),
        account_handle: `@${simulateName.toLowerCase().replace(/\s+/g, "")}`,
      });
      toast.success(`Mock ${managingPlatform} account added successfully!`);
      setSimulateName("");
      setShowSimulateInput(false);
      loadData();
    } catch (err) {
      toast.error("Failed to add mock account.");
    }
  };

  // Rename account
  const handleRenameAccount = async (accountId: string) => {
    if (!renameValue.trim()) return;
    try {
      await api.patch("/api/publish/accounts", {
        id: accountId,
        channel_name: renameValue.trim(),
      });
      toast.success("Account renamed successfully.");
      setRenameAccountId(null);
      setRenameValue("");
      loadData();
    } catch (err) {
      toast.error("Failed to rename account.");
    }
  };

  // Set default account
  const handleSetDefaultAccount = async (accountId: string) => {
    try {
      await api.patch("/api/publish/accounts", {
        id: accountId,
        is_default: true,
      });
      toast.success("Default account updated.");
      loadData();
    } catch (err) {
      toast.error("Failed to set default.");
    }
  };

  // Disconnect account
  const handleDisconnectAccount = async (accountId: string) => {
    try {
      await api.del(`/api/publish/accounts?id=${accountId}`);
      toast.success("Account disconnected.");
      loadData();
    } catch (err) {
      toast.error("Failed to disconnect account.");
    }
  };

  // File Upload Logic for local file
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // jsonOk() wraps the payload in { data: ... }, so the URL lives at
            // raw.data.url — not raw.url.
            const raw = JSON.parse(xhr.responseText);
            const videoUrl: string = raw?.data?.url ?? raw?.url;
            if (!videoUrl) throw new Error("Upload succeeded but no URL was returned.");

            toast.success("Custom video uploaded successfully!");

            const customProject = await api.post<any>("/api/projects", {
              title: file.name.replace(/\.[^/.]+$/, ""),
              description: `Uploaded: ${file.name}`,
              status: "editing",
            });

            await api.patch(`/api/projects/${customProject.id}`, {
              video_url: videoUrl,
              progress_percent: 100,
            });

            const newVideoItem: WorkspaceVideo = {
              id: customProject.id,
              title: customProject.title,
              video_url: videoUrl,
              thumbnail_url: null,
              status: "editing",
            };

            setVideos(prev => [newVideoItem, ...prev]);
            setSelectedVideo(newVideoItem);
            setYtTitle(newVideoItem.title);

            setIsUploading(false);
          } catch (err: any) {
            console.error("Failed to create project for uploaded video:", err);
            toast.error(err?.message || "Failed to link uploaded video. Please try again.");
            setIsUploading(false);
          }
        } else {
          toast.error("Upload failed.");
          setIsUploading(false);
        }
      });

      xhr.addEventListener("error", () => {
        toast.error("Upload error.");
        setIsUploading(false);
      });

      xhr.open("POST", "/api/media/upload");
      xhr.send(formData);

    } catch (err) {
      console.error(err);
      toast.error("Initialization failed.");
      setIsUploading(false);
    }
  };

  // Submit Publishing Task
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVideo || !selectedVideo.video_url) {
      toast.error("Please select a video to publish.");
      return;
    }

    const activePlatforms = Object.keys(selectedPlatforms).filter(p => selectedPlatforms[p]);
    if (activePlatforms.length === 0) {
      toast.error("Please select at least one platform.");
      return;
    }

    // Check that we have a selected account for each selected platform
    const targets = [];
    for (const platform of activePlatforms) {
      const accountId = platformAccounts[platform];
      if (!accountId) {
        toast.error(`Please select or connect an account for ${platform}.`);
        return;
      }

      let content = "";
      let title = undefined;
      let tags = undefined;

      if (platform === "youtube") {
        content = ytDesc;
        title = ytTitle;
        tags = ytTags ? ytTags.split(",").map(t => t.trim()) : [];
      } else if (platform === "linkedin") {
        content = linkedinCaption;
      } else if (platform === "facebook") {
        content = facebookCaption;
      } else if (platform === "instagram") {
        content = instagramCaption;
      } else if (platform === "tiktok") {
        content = tiktokCaption;
      } else if (platform === "x") {
        content = twitterText;
      }

      targets.push({
        platform,
        socialAccountId: accountId,
        content,
        title,
        tags,
      });
    }

    setIsPublishing(true);

    try {
      let endpoint = "/api/publish/upload";
      const payload: Record<string, any> = {
        projectId: selectedVideo.id,
        targets,
      };

      if (scheduleType === "later") {
        if (!scheduleDate || !scheduleTime) {
          toast.error("Please choose date and time for scheduled posting.");
          setIsPublishing(false);
          return;
        }
        endpoint = "/api/publish/schedule";
        payload.scheduledAt = `${scheduleDate}T${scheduleTime}:00.000Z`;
      }

      const results = await api.post<DBHistoryItem[]>(endpoint, payload);

      // Surface a clear per-platform outcome instead of a vague toast.
      setPublishResults(Array.isArray(results) ? results : []);
      setShowResults(true);

      const succeeded = (results || []).filter(
        (r) => r.status === "published" || r.status === "completed"
      ).length;
      const failed = (results || []).filter((r) => r.status === "failed").length;

      if (scheduleType === "later") {
        toast.success("Post scheduled successfully!");
      } else if (failed === 0 && succeeded > 0) {
        toast.success(`Published to ${succeeded} platform${succeeded > 1 ? "s" : ""}!`);
      } else if (succeeded > 0 && failed > 0) {
        toast.warning(`Published to ${succeeded}, but ${failed} failed. See details.`);
      } else if (failed > 0) {
        toast.error(`Publishing failed on ${failed} platform${failed > 1 ? "s" : ""}. See details.`);
      }

      // Reset selection states
      setSelectedPlatforms({});
      setScheduleType("now");

      // Reload history
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  const resultMeta = (status: string) => {
    if (status === "published" || status === "completed")
      return { label: "Published", cls: "text-brand-green bg-brand-green-light", Icon: CheckCircle2 };
    if (status === "scheduled")
      return { label: "Scheduled", cls: "text-blue-600 bg-blue-50", Icon: Clock };
    if (status === "review")
      return { label: "Pending Approval", cls: "text-amber-600 bg-amber-50", Icon: Clock };
    if (status === "failed")
      return { label: "Failed", cls: "text-red-600 bg-red-50", Icon: AlertTriangle };
    return { label: status, cls: "text-zinc-500 bg-zinc-100", Icon: Loader2 };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Post-publish Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-150 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-green-light flex items-center justify-center">
                  <Share2 size={18} className="text-brand-green" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900">Publishing Results</h3>
                  <p className="text-[10px] font-semibold text-zinc-400">
                    Outcome for each selected platform
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {publishResults.length === 0 ? (
                <p className="text-xs text-zinc-400 font-semibold py-6 text-center">
                  No results were returned. Check the history log below.
                </p>
              ) : (
                publishResults.map((r) => {
                  const platformObj = PLATFORMS.find((p) => p.key === r.platform);
                  const meta = resultMeta(r.status);
                  return (
                    <div
                      key={r.id}
                      className="flex items-start justify-between gap-3 p-3 border border-zinc-150 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${platformObj?.colorBg || "bg-zinc-500"}`}>
                          {platformObj?.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-zinc-950 block leading-tight">
                            {platformObj?.name || r.platform}
                          </span>
                          {r.status === "failed" && r.error ? (
                            <span className="text-[10px] text-red-500 font-semibold block truncate max-w-[160px]" title={r.error}>
                              {r.error}
                            </span>
                          ) : r.watch_url ? (
                            <a
                              href={r.watch_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-brand-green font-bold flex items-center gap-1 hover:underline"
                            >
                              View post <ExternalLink size={9} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-semibold">
                              {r.scheduled_at
                                ? `For ${new Date(r.scheduled_at).toLocaleString()}`
                                : "Processing..."}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-full ${meta.cls}`}>
                        <meta.Icon size={10} />
                        {meta.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-zinc-150">
              <button
                onClick={() => setShowResults(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Connection Inline Manager Modal */}
      {managingPlatform && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-zinc-150 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  PLATFORMS.find(p => p.key === managingPlatform)?.colorBg || "bg-zinc-500"
                }`}>
                  {PLATFORMS.find(p => p.key === managingPlatform)?.icon}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900">
                    Manage {PLATFORMS.find(p => p.key === managingPlatform)?.name} Accounts
                  </h3>
                  <p className="text-[10px] font-semibold text-zinc-400">
                    Connect or edit publishing accounts
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setManagingPlatform(null);
                  setShowSimulateInput(false);
                }}
                className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Account list */}
              <div className="space-y-3">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  Connected Accounts
                </span>
                {accounts.filter(a => a.platform === managingPlatform).length === 0 ? (
                  <p className="text-xs text-zinc-400 font-semibold py-4 text-center border border-dashed border-zinc-150 rounded-xl bg-zinc-50/50">
                    No accounts connected yet.
                  </p>
                ) : (
                  accounts
                    .filter(a => a.platform === managingPlatform)
                    .map(acc => (
                      <div
                        key={acc.id}
                        className={`flex flex-col gap-2 p-3 border rounded-xl bg-zinc-50/30 transition-all ${
                          acc.is_default ? "border-brand-green bg-brand-green-light/5" : "border-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            {renameAccountId === acc.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  className="px-2 py-1 text-xs border rounded-lg bg-white w-32 focus:border-brand-green outline-none"
                                />
                                <button
                                  onClick={() => handleRenameAccount(acc.id)}
                                  className="p-1 text-white bg-brand-green rounded-lg"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => setRenameAccountId(null)}
                                  className="p-1 text-zinc-400 border rounded-lg"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div>
                                <span className="font-extrabold text-xs text-zinc-950 block leading-tight">
                                  {acc.channel_name}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold">
                                  {acc.account_handle}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {renameAccountId !== acc.id && (
                              <button
                                onClick={() => {
                                  setRenameAccountId(acc.id);
                                  setRenameValue(acc.channel_name);
                                }}
                                className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
                                title="Rename Account"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDisconnectAccount(acc.id)}
                              className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-650 rounded-lg cursor-pointer"
                              title="Disconnect Account"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-100 pt-2 mt-1">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            acc.is_default ? "bg-brand-green-light text-brand-green" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            {acc.is_default ? "Default Account" : "Secondary Account"}
                          </span>
                          {!acc.is_default && (
                            <button
                              onClick={() => handleSetDefaultAccount(acc.id)}
                              className="text-[9px] font-bold text-brand-green hover:underline cursor-pointer"
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Action triggers */}
              <div className="border-t border-zinc-150 pt-4 space-y-3">
                {showSimulateInput ? (
                  <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-3">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Mock Account Username / Handle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CreatorStudio"
                      value={simulateName}
                      onChange={e => setSimulateName(e.target.value)}
                      className="w-full text-xs font-semibold text-zinc-950 placeholder:text-zinc-300 border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:border-brand-green bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowSimulateInput(false)}
                        className="px-3 py-1.5 text-xs text-zinc-500 font-bold border rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddSimulatedAccount}
                        className="px-3 py-1.5 text-xs text-white bg-brand-green hover:bg-brand-green-hover font-bold rounded-lg cursor-pointer"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleConnectRedirect(managingPlatform)}
                      disabled={connectingPlatform === managingPlatform}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 hover:bg-black disabled:bg-zinc-400 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-3xs"
                    >
                      {connectingPlatform === managingPlatform ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          OAuth Login
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowSimulateInput(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-zinc-300 hover:border-brand-green hover:bg-brand-green-light/10 text-zinc-500 hover:text-brand-green text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      <Sparkles size={13} />
                      Simulate Connect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Choose Video & Platforms */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section 1: Choose Video */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs text-left space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                1. Select Video
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-brand-green hover:text-brand-green-hover flex items-center gap-1 cursor-pointer"
              >
                <Upload size={12} />
                Upload Local
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleLocalFileUpload}
                className="hidden"
              />
            </div>

            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="animate-spin text-brand-green" size={24} />
                <span className="text-xs font-bold text-zinc-900">Uploading Video ({uploadProgress}%)</span>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-brand-green h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : selectedVideo ? (
              <div className="space-y-4">
                <div className="relative bg-zinc-950 rounded-2xl aspect-video overflow-hidden group shadow-inner">
                  {selectedVideo.video_url ? (
                    <video
                      src={selectedVideo.video_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-semibold text-xs">
                      No video source available
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-zinc-900 block truncate" title={selectedVideo.title}>
                      {selectedVideo.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      Ready to Publish • 1080p
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="p-1 text-zinc-300 hover:text-zinc-550 border border-zinc-200 rounded-lg cursor-pointer"
                    title="Deselect Video"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                  Select render from Library
                </label>
                <div className="relative">
                  <select
                    onChange={e => {
                      const vid = videos.find(v => v.id === e.target.value);
                      if (vid) {
                        setSelectedVideo(vid);
                        setYtTitle(vid.title);
                      }
                    }}
                    value=""
                    className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-bold text-zinc-800 bg-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choose a finished video...</option>
                    {videos.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                    <ChevronDown size={16} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Choose Platforms */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs text-left space-y-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-2 block select-none">
              2. Select Targets
            </span>

            <div className="space-y-2.5">
              {PLATFORMS.map(platform => {
                const isSelected = !!selectedPlatforms[platform.key];
                const platformAccs = accounts.filter(a => a.platform === platform.key);
                const selectedAccId = platformAccounts[platform.key];
                const selectedAcc = platformAccs.find(a => a.id === selectedAccId);

                return (
                  <div
                    key={platform.key}
                    className={`flex flex-col gap-2 p-3 border rounded-2xl transition-all ${
                      isSelected
                        ? "border-brand-green bg-brand-green-light/5"
                        : "border-zinc-200 hover:bg-zinc-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => handleTogglePlatform(platform.key)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${platform.colorBg}`}>
                          {platform.icon}
                        </div>
                        <span className="font-extrabold text-xs text-zinc-950 select-none">
                          {platform.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setManagingPlatform(platform.key)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                        <div
                          onClick={() => handleTogglePlatform(platform.key)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? "bg-brand-green border-brand-green text-white"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="border-t border-zinc-100 pt-2 mt-1 animate-in slide-in-from-top-1">
                        {platformAccs.length === 0 ? (
                          <div className="flex items-center justify-between gap-2 py-1 bg-amber-50/50 border border-amber-100/50 rounded-lg px-2 text-[10px] text-amber-700 font-bold">
                            <span>No accounts connected</span>
                            <button
                              onClick={() => setManagingPlatform(platform.key)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded font-extrabold cursor-pointer"
                            >
                              Connect
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={selectedAccId || ""}
                              onChange={e =>
                                setPlatformAccounts(prev => ({
                                  ...prev,
                                  [platform.key]: e.target.value,
                                }))
                              }
                              className="w-full pl-2 pr-8 py-1.5 border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-800 bg-white outline-none cursor-pointer"
                            >
                              {platformAccs.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.channel_name} ({acc.account_handle}) {acc.is_default ? "★" : ""}
                                </option>
                              ))}
                            </select>
                            <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-zinc-400">
                              <ChevronDown size={12} />
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Write Copy and Publish */}
        <div className="lg:col-span-8 space-y-6 text-left">
          {/* Per-Platform Input Tabs */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-3 block select-none">
              3. Customize Social Post Content
            </span>

            {/* Tabs Selector */}
            <div className="flex border-b border-zinc-200 overflow-x-auto select-none gap-1">
              {PLATFORMS.filter(p => selectedPlatforms[p.key]).map(p => (
                <button
                  key={p.key}
                  onClick={() => setActiveTab(p.key)}
                  className={`h-10 px-4 text-xs font-extrabold transition-all shrink-0 cursor-pointer rounded-t-xl border-b-2 flex items-center gap-1.5 ${
                    activeTab === p.key
                      ? "text-brand-green border-brand-green bg-brand-green-light/5"
                      : "text-zinc-500 hover:text-zinc-800 border-transparent hover:bg-zinc-50"
                  }`}
                >
                  <span className={activeTab === p.key ? "text-brand-green" : "text-zinc-400"}>
                    {p.icon}
                  </span>
                  {p.name}
                </button>
              ))}
              {PLATFORMS.filter(p => selectedPlatforms[p.key]).length === 0 && (
                <div className="text-xs text-zinc-400 font-semibold py-2 select-none">
                  Select one or more platforms on the left to start writing copy.
                </div>
              )}
            </div>

            {/* Inputs Panel */}
            <div className="pt-2">
              {activeTab === "youtube" && (
                <div className="space-y-4 animate-in fade-in-40 duration-150">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      value={ytTitle}
                      onChange={e => setYtTitle(e.target.value)}
                      className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30"
                      placeholder="Enter YouTube title..."
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Description
                    </label>
                    <textarea
                      rows={5}
                      value={ytDesc}
                      onChange={e => setYtDesc(e.target.value)}
                      className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30 resize-none"
                      placeholder="Write description content..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={ytTags}
                      onChange={e => setYtTags(e.target.value)}
                      className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30"
                      placeholder="e.g. ai, coding, tutorial"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Visibility
                    </label>
                    <div className="flex gap-4">
                      {["public", "unlisted", "private"].map(mode => (
                        <label key={mode} className="flex items-center gap-2 text-xs font-bold text-zinc-650 capitalize cursor-pointer select-none">
                          <input
                            type="radio"
                            name="visibility"
                            checked={ytVisibility === mode}
                            onChange={() => setYtVisibility(mode)}
                            className="accent-brand-green"
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "linkedin" && (
                <div className="space-y-1.5 animate-in fade-in-40 duration-150">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                    LinkedIn Caption
                  </label>
                  <textarea
                    rows={5}
                    value={linkedinCaption}
                    onChange={e => setLinkedinCaption(e.target.value)}
                    className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30 resize-none"
                    placeholder="Type post caption for LinkedIn..."
                  />
                </div>
              )}

              {activeTab === "facebook" && (
                <div className="space-y-1.5 animate-in fade-in-40 duration-150">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                    Facebook Caption
                  </label>
                  <textarea
                    rows={5}
                    value={facebookCaption}
                    onChange={e => setFacebookCaption(e.target.value)}
                    className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30 resize-none"
                    placeholder="Type post caption for Facebook..."
                  />
                </div>
              )}

              {activeTab === "instagram" && (
                <div className="space-y-1.5 animate-in fade-in-40 duration-150">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                    Instagram Caption
                  </label>
                  <textarea
                    rows={5}
                    value={instagramCaption}
                    onChange={e => setInstagramCaption(e.target.value)}
                    className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30 resize-none"
                    placeholder="Type caption for Instagram..."
                  />
                </div>
              )}

              {activeTab === "tiktok" && (
                <div className="space-y-1.5 animate-in fade-in-40 duration-150">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                    TikTok Caption
                  </label>
                  <textarea
                    rows={5}
                    value={tiktokCaption}
                    onChange={e => setTiktokCaption(e.target.value)}
                    className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30 resize-none"
                    placeholder="Type caption for TikTok..."
                  />
                </div>
              )}

              {activeTab === "x" && (
                <div className="space-y-1.5 animate-in fade-in-40 duration-150">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
                      Tweet text
                    </label>
                    <span className={`text-[10px] font-bold ${
                      twitterText.length > 280 ? "text-red-500" : "text-zinc-400"
                    }`}>
                      {twitterText.length} / 280
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={twitterText}
                    onChange={e => setTwitterText(e.target.value)}
                    className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 rounded-xl text-sm font-semibold text-zinc-950 bg-zinc-50/30 resize-none"
                    placeholder="Type tweet..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Scheduling Configuration */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-3 block select-none">
              4. Schedule Publication
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer hover:bg-zinc-50/30 transition-colors ${
                scheduleType === "now" ? "border-brand-green bg-brand-green-light/5" : "border-zinc-200"
              }`}>
                <input
                  type="radio"
                  name="scheduleType"
                  checked={scheduleType === "now"}
                  onChange={() => setScheduleType("now")}
                  className="accent-brand-green mt-0.5"
                />
                <div className="leading-tight select-none">
                  <span className="text-xs font-bold text-zinc-800 block">Publish Now</span>
                  <span className="text-[10px] font-semibold text-zinc-400 block mt-1">
                    Send to connected networks immediately
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer hover:bg-zinc-50/30 transition-colors ${
                scheduleType === "later" ? "border-brand-green bg-brand-green-light/5" : "border-zinc-200"
              }`}>
                <input
                  type="radio"
                  name="scheduleType"
                  checked={scheduleType === "later"}
                  onChange={() => setScheduleType("later")}
                  className="accent-brand-green mt-0.5"
                />
                <div className="leading-tight select-none">
                  <span className="text-xs font-bold text-zinc-800 block">Schedule Post</span>
                  <span className="text-[10px] font-semibold text-zinc-400 block mt-1">
                    Hold and publish at a specific date & time
                  </span>
                </div>
              </label>
            </div>

            {scheduleType === "later" && (
              <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase">Publish Date</span>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-bold text-zinc-800 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase">Publish Time</span>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-bold text-zinc-800 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handlePublishSubmit}
              disabled={isPublishing}
              className="h-12 px-8 bg-brand-green hover:bg-brand-green-hover disabled:bg-zinc-250 text-white rounded-xl text-xs font-extrabold shadow-md shadow-brand-green/10 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              {isPublishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Initiating...
                </>
              ) : (
                <>
                  {scheduleType === "now" ? "Publish Immediately" : "Schedule Publication"}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          {/* Publishing History Logs */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-3 block select-none">
              Publishing History & Progress logs
            </span>

            <div className="overflow-x-auto">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Share2 size={24} className="text-zinc-200 animate-pulse" />
                  <p className="text-xs font-semibold text-zinc-400">
                    No publishing history logs found.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs font-bold text-zinc-800">
                  <thead>
                    <tr className="border-b border-zinc-150 text-zinc-400 font-extrabold select-none pb-2 bg-zinc-50/50">
                      <th className="py-2.5 px-3 uppercase tracking-wider">Video Target</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Channel</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Platform</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Status</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Post Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {history.map(item => {
                      const platformObj = PLATFORMS.find(p => p.key === item.platform);
                      return (
                        <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="py-3 px-3 font-extrabold text-zinc-950 truncate max-w-[150px]">
                            {item.title || "External Video"}
                          </td>
                          <td className="py-3 px-3 text-zinc-500 font-medium">
                            {item.social_accounts?.channel_name || "Unknown"}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] ${
                                platformObj?.colorBg || "bg-zinc-500"
                              }`}>
                                {platformObj?.icon}
                              </span>
                              <span className="font-semibold text-[10px] text-zinc-600">
                                {platformObj?.name || item.platform}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase tracking-wide leading-none ${
                              item.status === "published" || item.status === "completed"
                                ? "bg-brand-green-light text-brand-green"
                                : item.status === "failed"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : item.status === "scheduled"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}>
                              {item.status}
                            </span>
                            {item.error && (
                              <span className="block text-[8px] text-red-500 font-medium mt-0.5 max-w-[120px] truncate" title={item.error}>
                                {item.error}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-zinc-500 font-medium">
                            {item.published_at
                              ? new Date(item.published_at).toLocaleDateString()
                              : item.scheduled_at
                              ? new Date(item.scheduled_at).toLocaleString()
                              : new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
