"use client";

import { useState } from "react";
import { Plug, Key, RefreshCw, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type APIKeyItem = {
  id: string;
  name: string;
  keyPreview: string;
  status: "active" | "revoked";
  created: string;
};

export default function OwnerAPIManagementPage() {
  const [keys, setKeys] = useState<APIKeyItem[]>([
    {
      id: "1",
      name: "Acme Production App Key",
      keyPreview: "thinknext_live_8f3d...9a2e",
      status: "active",
      created: "Jun 12, 2026",
    },
    {
      id: "2",
      name: "Staging Testing Endpoint",
      keyPreview: "thinknext_test_7a1b...2c4d",
      status: "active",
      created: "Jun 18, 2026",
    },
  ]);

  const [newKeyName, setNewKeyName] = useState("");

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const newKey: APIKeyItem = {
      id: Date.now().toString(),
      name: newKeyName,
      keyPreview: `thinknext_live_${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
      status: "active",
      created: "Just now",
    };

    setKeys([newKey, ...keys]);
    setNewKeyName("");
    toast.success(`API Key "${newKeyName}" generated successfully!`);
  };

  const handleRevokeKey = (id: string, name: string) => {
    setKeys(keys.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)));
    toast.error(`API Key "${name}" has been revoked.`);
  };

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8 bg-zinc-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div className="text-left leading-normal">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              API Management
              <span className="text-xs font-bold px-2 py-0.5 bg-brand-green-light text-brand-green rounded-full">
                8 API Connections
              </span>
            </h1>
            <p className="text-sm font-semibold text-zinc-400 mt-0.5">
              Review third-party AI integration keys, credit pools, and query quotas.
            </p>
          </div>
        </div>

        {/* Integration channels status */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-2">
            AI Platform Integration Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { provider: "ElevenLabs TTS", status: "Connected", credits: "45k chars used", color: "text-emerald-500 bg-emerald-50" },
              { provider: "Subagic Captions", status: "Connected", credits: "180 mins processed", color: "text-emerald-500 bg-emerald-50" },
              { provider: "HeyGen Avatars", status: "Connected", credits: "12 credits remaining", color: "text-emerald-500 bg-emerald-50" },
            ].map((p, idx) => (
              <div key={idx} className="border border-zinc-150 p-4 rounded-xl flex items-center gap-3 bg-zinc-50/30">
                <div className="w-9 h-9 rounded-full bg-brand-green-light border border-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
                  <Plug size={16} />
                </div>
                <div className="leading-tight">
                  <h4 className="text-xs font-bold text-zinc-900">{p.provider}</h4>
                  <div className="flex items-center gap-1.5 mt-1 select-none">
                    <span className={`w-1.5 h-1.5 rounded-full ${idx === 2 ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase">{p.status}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">{p.credits}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate API Key Form */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm text-left">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-3 mb-4">
            Generate Platform API Key
          </h3>
          <form onSubmit={handleGenerateKey} className="flex gap-4">
            <input
              type="text"
              required
              placeholder="e.g. Analytics Webhook Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-4 h-10 border border-zinc-200 focus:border-brand-green rounded-xl text-xs font-semibold outline-none"
            />
            <button
              type="submit"
              className="h-10 px-5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Generate Key
            </button>
          </form>
        </div>

        {/* Keys List */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm text-left">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-100 pb-3 mb-4">
            Active Workspace API Keys
          </h3>
          <div className="divide-y divide-zinc-100">
            {keys.map((key) => (
              <div key={key.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-900">{key.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-semibold">
                    <span className="font-mono bg-zinc-50 border border-zinc-150 px-1.5 py-0.5 rounded text-zinc-650 font-bold select-all">
                      {key.keyPreview}
                    </span>
                    <span>Created: {key.created}</span>
                  </div>
                </div>
                <div>
                  {key.status === "active" ? (
                    <button
                      onClick={() => handleRevokeKey(key.id, key.name)}
                      className="h-8 px-3 border border-red-200 text-red-650 hover:bg-red-50 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-[10px] text-red-600 font-extrabold select-none bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                      REVOKED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
