"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  ArrowRight,
  Upload,
  Laptop,
  Image as ImageIcon,
  Video,
  Eye,
  BarChart3,
  Trash2,
  Edit2,
  Music,
  Briefcase,
  ThumbsUp,
  AtSign,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredPosts, saveStoredPosts, ScheduledPost } from "../../../utils/storage";

// Custom inline SVG components to bypass missing lucide-react brand icons
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

export default function UserPublishHubPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    setPosts(getStoredPosts());
  }, []);

  const handleDeletePost = (id: string, title: string) => {
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    saveStoredPosts(updated);
    toast.success(`Removed post: "${title}"`);
  };

  const getThumbnailIcon = (status: string, thumbnailColor: string) => {
    if (status === "draft") {
      return <Video size={16} className="text-zinc-550" />;
    }
    if (thumbnailColor.includes("bf7a5c")) {
      return <ImageIcon size={16} className="text-white" />;
    }
    return <Laptop size={16} className="text-white" />;
  };

  const [connections, setConnections] = useState([
    { name: "YouTube", key: "youtube", connected: true, icon: <YoutubeIcon size={20} className="text-red-650" />, iconBg: "bg-red-50" },
    { name: "TikTok", key: "tiktok", connected: true, icon: <Music size={18} className="text-zinc-900" />, iconBg: "bg-zinc-100" },
    { name: "Instagram", key: "instagram", connected: false, icon: <InstagramIcon size={20} className="text-pink-600" />, iconBg: "bg-pink-50" },
    { name: "LinkedIn", key: "linkedin", connected: true, icon: <Briefcase size={18} className="text-blue-650" />, iconBg: "bg-blue-50" },
    { name: "Facebook", key: "facebook", connected: false, icon: <ThumbsUp size={18} className="text-blue-600" />, iconBg: "bg-blue-100" },
    { name: "X", key: "x", connected: false, icon: <AtSign size={18} className="text-zinc-700" />, iconBg: "bg-zinc-100" },
  ]);

  const toggleConnection = (key: string, name: string) => {
    setConnections(
      connections.map((c) => {
        if (c.key === key) {
          const newState = !c.connected;
          toast.success(newState ? `Connected to ${name}!` : `Disconnected from ${name}`);
          return { ...c, connected: newState };
        }
        return c;
      })
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <span key={platform} className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center text-red-650" title="YouTube"><YoutubeIcon size={12} /></span>;
      case "linkedin":
        return <span key={platform} className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-650" title="LinkedIn"><Briefcase size={12} /></span>;
      case "tiktok":
        return <span key={platform} className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900" title="TikTok"><Music size={12} /></span>;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="text-left space-y-1 pb-4">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Publishing Hub</h1>
          <p className="text-sm font-semibold text-zinc-400">
            Publish and schedule your videos across all your social channels
          </p>
        </div>

        {/* Core Double Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Publish Generated Video (Solid Forest Green) */}
          <div className="bg-brand-green rounded-3xl p-8 text-white text-left flex flex-col justify-between min-h-[220px] shadow-sm select-none">
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight">Publish Generated Video</h2>
              <p className="text-xs text-white/80 font-medium leading-relaxed max-w-sm">
                Select a completed video from your workflow and instantly push it to your connected platforms or schedule for later.
              </p>
            </div>
            <button
              onClick={() => toast.info("Opening project selector panel...")}
              className="mt-6 self-start bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            >
              Select from your projects
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Upload & Publish (White with Green Border) */}
          <div className="bg-white border-2 border-brand-green rounded-3xl p-8 text-left flex flex-col justify-between min-h-[220px] shadow-sm select-none">
            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-brand-green tracking-tight">Upload & Publish</h2>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">
                Have a video rendered outside UChat? Upload it directly here to utilize our cross-platform scheduling tools.
              </p>
            </div>
            <Link
              href="/dashboard/user/publish/upload"
              className="mt-6 self-start bg-brand-green hover:bg-brand-green-hover text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            >
              Upload your own video
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Platform Connections Section */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-zinc-900 text-left">
            Platform Connections
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {connections.map((c) => (
              <div
                key={c.key}
                className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-3xs flex flex-col items-center text-center space-y-4"
              >
                <div className={`w-11 h-11 rounded-full ${c.iconBg} flex items-center justify-center`}>
                  {c.icon}
                </div>
                <div className="space-y-1">
                  <span className="font-extrabold text-xs text-zinc-900 block">{c.name}</span>
                  <span
                    className={`inline-block text-[9px] font-extrabold py-0.5 px-2 rounded-full leading-none ${
                      c.connected ? "bg-brand-green-light text-brand-green" : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {c.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>

                {c.connected ? (
                  <button
                    onClick={() => toggleConnection(c.key, c.name)}
                    className="w-full py-1.5 bg-sidebar-bg hover:bg-zinc-200/80 text-zinc-700 font-bold text-[10px] rounded-xl transition-colors cursor-pointer"
                  >
                    Manage
                  </button>
                ) : (
                  <button
                    onClick={() => toggleConnection(c.key, c.name)}
                    className="w-full py-1.5 border border-brand-green text-brand-green hover:bg-brand-green-light font-bold text-[10px] rounded-xl transition-colors cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Publishing History Section */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
            <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
              Publishing History
            </h3>
            <button
              onClick={() => toast.info("Viewing all publishing history logs...")}
              className="text-xs font-bold text-brand-green hover:text-brand-green-hover flex items-center gap-0.5 cursor-pointer"
            >
              View All
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-zinc-800">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold select-none pb-2.5">
                  <th className="py-3 uppercase tracking-wider">Video</th>
                  <th className="py-3 uppercase tracking-wider">Platform</th>
                  <th className="py-3 uppercase tracking-wider">Status</th>
                  <th className="py-3 uppercase tracking-wider">Date</th>
                  <th className="py-3 uppercase tracking-wider">Views</th>
                  <th className="py-3 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50/50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-8 rounded-lg ${post.thumbnailColor} flex items-center justify-center shadow-3xs select-none`}
                        >
                          {getThumbnailIcon(post.status, post.thumbnailColor)}
                        </div>
                        <span className="font-extrabold text-zinc-900">{post.title}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        {post.platforms.map((p) => getPlatformIcon(p))}
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-block text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase tracking-wide leading-none ${
                          post.status === "published"
                            ? "bg-brand-green-light text-brand-green"
                            : post.status === "scheduled"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-500 font-medium">
                      {post.date}
                    </td>
                    <td className="py-4 font-extrabold text-zinc-900">
                      {post.views}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {post.status === "draft" ? (
                          <button
                            onClick={() => toast.info(`Editing draft project: "${post.title}"`)}
                            className="p-1.5 text-zinc-400 hover:text-brand-green rounded-lg cursor-pointer transition-colors"
                            title="Edit Draft"
                          >
                            <Edit2 size={14} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => toast.info(`Opening clip metrics for: "${post.title}"`)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg cursor-pointer transition-colors"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => toast.info(`Opening performance graphs for: "${post.title}"`)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg cursor-pointer transition-colors"
                              title="Analytics"
                            >
                              <BarChart3 size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="p-1.5 text-zinc-400 hover:text-red-655 rounded-lg cursor-pointer transition-colors"
                          title="Delete Post Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
