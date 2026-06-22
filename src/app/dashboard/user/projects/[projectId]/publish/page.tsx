"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  FolderOpen,
  CalendarDays,
  Share2,
  Users,
  Bell,
  Settings,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Check,
  Video,
  Play,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  getStoredProjectById,
  updateStoredProject,
  getStoredPosts,
  saveStoredPosts,
  ScheduledPost,
  UserProject,
} from "../../../../../utils/storage";

type PlatformKey = "youtube" | "tiktok" | "instagram" | "linkedin";

export default function UserPublishPage({ params }: { params: Promise<{ projectId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const [project, setProject] = useState<UserProject | null>(null);

  // Selected platforms states
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<PlatformKey, boolean>>({
    youtube: true,
    tiktok: true,
    instagram: true,
    linkedin: false,
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<PlatformKey>("youtube");

  // YouTube settings states
  const [title, setTitle] = useState("Q3 Product Updates: What's New");
  const [description, setDescription] = useState(
    "Check out our latest features for Q3! We've improved performance, added new integrations, and revamped the dashboard."
  );
  const [tags, setTags] = useState(["software", "b2b", "update"]);
  const [newTag, setNewTag] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [category, setCategory] = useState("Science & Technology");

  // Scheduling states
  const [publishSchedule, setPublishSchedule] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const proj = getStoredProjectById(projectId);
    if (proj) {
      setProject(proj);
      if (proj.youtubeTitle) {
        setTitle(proj.youtubeTitle);
      } else if (proj.name) {
        setTitle(proj.name);
      }

      if (proj.youtubeDescription) {
        setDescription(proj.youtubeDescription);
      } else if (proj.generatedScriptText) {
        setDescription(proj.generatedScriptText);
      }

      if (proj.youtubeTags && proj.youtubeTags.length > 0) {
        setTags(proj.youtubeTags);
      }
    }
  }, [projectId]);

  const handleTogglePlatform = (platform: PlatformKey) => {
    setSelectedPlatforms((prev) => {
      const nextVal = { ...prev, [platform]: !prev[platform] };
      // If we disabled the active tab, find another active one
      if (!nextVal[platform] && activeTab === platform) {
        const remaining = Object.keys(nextVal).find((k) => nextVal[k as PlatformKey]) as PlatformKey;
        if (remaining) setActiveTab(remaining);
      }
      return nextVal;
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddHashtag = (hashtag: string) => {
    if (!description.includes(hashtag)) {
      setDescription((prev) => `${prev} ${hashtag}`);
      toast.success(`Added ${hashtag}`);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    toast.info("Connecting to API platforms and initiating uploads...");

    setTimeout(() => {
      setIsPublishing(false);

      // 1. Update project progress/status to completed
      updateStoredProject(projectId, {
        youtubeTitle: title,
        youtubeDescription: description,
        youtubeTags: tags,
        status: "Completed",
        statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
        stage: "Completed",
        progress: 100,
        lastUpdated: "Just now",
      });

      // 2. Add to Publishing history in localStorage
      const activePlatforms = Object.keys(selectedPlatforms).filter(
        (k) => selectedPlatforms[k as PlatformKey]
      );
      
      const newPost: ScheduledPost = {
        id: `post-${Date.now()}`,
        title: title || project?.name || "Untitled Video",
        platforms: activePlatforms,
        status: publishSchedule === "now" ? "published" : "scheduled",
        date: publishSchedule === "now" ? "Today" : `${scheduleDate} ${scheduleTime}`,
        views: "—",
        thumbnailColor: "bg-[#6a9985]",
      };

      const currentPosts = getStoredPosts();
      saveStoredPosts([newPost, ...currentPosts]);

      toast.success(
        publishSchedule === "now"
          ? "Video published successfully!"
          : "Video scheduled successfully!"
      );
      
      // Redirect to Global Publishing Hub
      router.push("/dashboard/user/publish");
    }, 2000);
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back link */}
            <Link
              href={`/dashboard/user/projects/${projectId}`}
              className="inline-flex items-center text-sm font-semibold text-zinc-400 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back to Projects
            </Link>

            {/* Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Publish: {project?.name || "Project"}
            </h1>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (35%) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Video Info Preview */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="bg-zinc-950 rounded-xl aspect-video overflow-hidden relative shadow-inner flex items-center justify-center max-h-[140px]">
                    <Image
                      src="/mountain-sunset.png"
                      alt="Thumbnail preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover opacity-90"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">
                      02:45
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                        <Play size={14} fill="currentColor" className="translate-x-[0.5px]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 truncate">Q3_Promo_Final_v2.mp4</h4>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">1.2 GB • 1080p</p>
                  </div>
                </div>

                {/* Select Platforms Card */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4 select-none">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-2">
                    Select Platforms
                  </h3>
                  <div className="space-y-2.5">
                    {([
                      { key: "youtube", label: "YouTube" },
                      { key: "tiktok", label: "TikTok" },
                      { key: "instagram", label: "Instagram" },
                      { key: "linkedin", label: "LinkedIn" },
                    ] as const).map((platform) => {
                      const isChecked = selectedPlatforms[platform.key];
                      return (
                        <div
                          key={platform.key}
                          onClick={() => handleTogglePlatform(platform.key)}
                          className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                            isChecked
                              ? "border-brand-green bg-brand-green-light/20"
                              : "border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          <span className="text-xs font-bold text-zinc-800">{platform.label}</span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isChecked
                                ? "bg-brand-green border-brand-green text-white"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column (65%) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Per-Platform Tabs */}
                <div className="flex border-b border-zinc-200 overflow-x-auto select-none">
                  {([
                    { key: "youtube", label: "YouTube" },
                    { key: "tiktok", label: "TikTok" },
                    { key: "instagram", label: "Instagram" },
                    { key: "linkedin", label: "LinkedIn" },
                  ] as const)
                    .filter((p) => selectedPlatforms[p.key])
                    .map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`h-11 px-5 text-sm font-semibold capitalize transition-all shrink-0 cursor-pointer ${
                          activeTab === tab.key
                            ? "text-zinc-950 font-bold border-b-2 border-brand-green"
                            : "text-zinc-500 hover:text-zinc-950"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                </div>

                <form onSubmit={handlePublish} className="space-y-6">
                  {/* YouTube Settings Card */}
                  {activeTab === "youtube" && (
                    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-5">
                      <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                        <span className="text-base">📹</span>
                        <h2 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">
                          YouTube Settings
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                              Title *
                            </label>
                            <span className="text-[10px] font-semibold text-zinc-400">
                              {title.length} / 100
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={100}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none transition-all"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                            Description
                          </label>
                          <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 placeholder-zinc-400 outline-none resize-none transition-all"
                          />
                          {/* Suggested hashtags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] font-bold text-zinc-400 self-center">Suggestions:</span>
                            {["#ProductUpdate", "#TechNews", "#UChatAI"].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleAddHashtag(tag)}
                                className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold text-zinc-600 transition-colors cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                            Tags
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5 p-2 border border-zinc-200 rounded-xl min-h-[44px]">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder="Add a tag..."
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={handleAddTag}
                              className="flex-1 min-w-[120px] h-7 px-2 text-sm font-semibold outline-none bg-transparent"
                            />
                          </div>
                        </div>

                        {/* Thumbnail Upload */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400 uppercase block">
                            Thumbnail
                          </label>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              className="h-14 px-5 border border-zinc-250 hover:bg-zinc-50 border-dashed rounded-xl flex items-center justify-center text-zinc-500 gap-1.5 text-xs font-bold cursor-pointer"
                            >
                              <ImageIcon size={16} />
                              Upload Image
                            </button>
                            <button
                              type="button"
                              className="h-14 px-5 border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-700 gap-1.5 text-xs font-bold cursor-pointer"
                            >
                              <ImageIcon size={16} />
                              Use Video Frame
                            </button>
                          </div>
                        </div>

                        {/* Visibility & Category Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {/* Visibility */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">
                              Visibility
                            </span>
                            <div className="space-y-2">
                              {["public", "unlisted", "private"].map((mode) => (
                                <label
                                  key={mode}
                                  className="flex items-center gap-2.5 text-xs font-bold text-zinc-600 capitalize cursor-pointer select-none"
                                >
                                  <input
                                    type="radio"
                                    name="visibility"
                                    checked={visibility === mode}
                                    onChange={() => setVisibility(mode)}
                                    className="w-4 h-4 accent-brand-green cursor-pointer"
                                  />
                                  {mode}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Category */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide block">
                              Category
                            </label>
                            <div className="relative">
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full pl-4 pr-10 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none appearance-none bg-white transition-all cursor-pointer"
                              >
                                <option>Science & Technology</option>
                                <option>Education</option>
                                <option>Entertainment</option>
                                <option>People & Blogs</option>
                              </select>
                              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-400">
                                <ChevronDown size={18} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback Tabs content */}
                  {activeTab !== "youtube" && (
                    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm text-center py-20 text-zinc-400 text-xs font-bold">
                      {activeTab.toUpperCase()} specific settings form panel
                    </div>
                  )}

                  {/* Scheduling Card */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-2">
                      When to publish?
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-3.5 border border-zinc-150 rounded-xl cursor-pointer hover:bg-zinc-50/50 transition-colors">
                        <input
                          type="radio"
                          name="publishSchedule"
                          checked={publishSchedule === "now"}
                          onChange={() => setPublishSchedule("now")}
                          className="w-4.5 h-4.5 accent-brand-green cursor-pointer shrink-0 mt-0.5"
                        />
                        <div className="text-left leading-tight">
                          <span className="text-xs font-bold text-zinc-800 block">Publish Now</span>
                          <span className="text-[10px] font-semibold text-zinc-400 block mt-1">
                            Video will go live immediately on selected platforms.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3.5 border border-zinc-150 rounded-xl cursor-pointer hover:bg-zinc-50/50 transition-colors">
                        <input
                          type="radio"
                          name="publishSchedule"
                          checked={publishSchedule === "later"}
                          onChange={() => setPublishSchedule("later")}
                          className="w-4.5 h-4.5 accent-brand-green cursor-pointer shrink-0 mt-0.5"
                        />
                        <div className="text-left leading-tight">
                          <span className="text-xs font-bold text-zinc-800 block">Schedule for Later</span>
                          <span className="text-[10px] font-semibold text-zinc-400 block mt-1">
                            Pick a specific date and time to publish.
                          </span>
                        </div>
                      </label>

                      {/* Date/Time pickers */}
                      {publishSchedule === "later" && (
                        <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Publish Date</span>
                            <input
                              type="date"
                              required
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Publish Time</span>
                            <input
                              type="time"
                              required
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none bg-white cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Submission */}
                  <div className="flex items-center justify-end gap-5">
                    <button
                      type="button"
                      onClick={() => toast.info("Draft saved successfully!")}
                      className="text-xs font-extrabold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      disabled={isPublishing}
                      className="h-11 px-8 bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center gap-1.5"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          {publishSchedule === "now" ? "Publish Now" : "Schedule Post"}
                          <Check size={16} className="ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
  );
}
