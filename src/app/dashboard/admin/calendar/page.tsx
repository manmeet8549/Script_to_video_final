"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Sparkles,
  Mic,
  Video,
  Share2,
  HelpCircle,
  Settings,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  X,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type EventItem = {
  day: number;
  time: string;
  title: string;
  type: "deadline" | "meeting" | "recording" | "review";
  location: string;
};

export default function AdminCalendarPage() {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState<"deadline" | "meeting" | "recording" | "review">("deadline");
  const [taskDay, setTaskDay] = useState(10);
  const [taskTime, setTaskTime] = useState("10:00 AM");
  const [taskLocation, setTaskLocation] = useState("Conference Room B");

  // Initial event list
  const [events, setEvents] = useState<EventItem[]>([
    { day: 10, time: "10:00 AM", title: "10a Script", type: "review", location: "Conference Room B" },
    { day: 12, time: "2:00 PM", title: "2p Voiceo", type: "recording", location: "Studio 1" },
    { day: 15, time: "1:30 PM", title: "Q3 Promo", type: "deadline", location: "Zoom Meeting" },
    { day: 20, time: "4:00 PM", title: "Final Rend", type: "meeting", location: "Workspace Boardroom" },
  ]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) {
      toast.error("Please enter a task title");
      return;
    }

    const shortTitle = taskTitle.length > 8 ? taskTitle.substring(0, 8) + ".." : taskTitle;
    const newEvent: EventItem = {
      day: Number(taskDay),
      time: taskTime,
      title: shortTitle,
      type: taskType,
      location: taskLocation,
    };

    setEvents([...events, newEvent]);
    setShowNewTaskModal(false);
    setTaskTitle("");
    toast.success("Task scheduled successfully!");
  };

  const getEventsForDay = (day: number) => {
    return events.filter((e) => e.day === day);
  };

  // Summary counts
  const deadlinesCount = events.filter((e) => e.type === "deadline").length + 1; // standard fallbacks + user events
  const meetingsCount = events.filter((e) => e.type === "meeting").length + 4;
  const recordingsCount = events.filter((e) => e.type === "recording").length + 2;
  const reviewsCount = events.filter((e) => e.type === "review").length + 1;
  const totalEvents = deadlinesCount + meetingsCount + recordingsCount + reviewsCount;

  return (
    <>
      {/* Task Modal Overlay */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowNewTaskModal(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-655 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-3 mb-4">
              Schedule New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Script Review"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                    Day (June 2026)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={taskDay}
                    onChange={(e) => setTaskDay(Number(e.target.value))}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-455 uppercase tracking-wide block">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    required
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide block">
                  Task Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "deadline", label: "Deadline" },
                    { key: "meeting", label: "Meeting" },
                    { key: "recording", label: "Recording" },
                    { key: "review", label: "Review" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTaskType(t.key as any)}
                      className={`h-10 text-xs font-bold border rounded-xl cursor-pointer ${
                        taskType === t.key
                          ? "bg-brand-green text-white border-brand-green shadow-sm"
                          : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-450 uppercase tracking-wide">
                  Location / Room
                </label>
                <input
                  type="text"
                  required
                  placeholder="Conference Room B / Zoom"
                  value={taskLocation}
                  onChange={(e) => setTaskLocation(e.target.value)}
                  className="w-full px-4 h-11 border border-zinc-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 rounded-xl text-sm font-semibold text-zinc-900 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 cursor-pointer pt-0.5"
              >
                Schedule Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content Body */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header titles */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Calendar
              </h1>
              <p className="text-sm font-semibold text-zinc-400 leading-normal">
                Manage your team's production deadlines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.info("Exporting calendar data...")}
                className="h-11 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              >
                <Download size={14} className="rotate-180" />
                Export
              </button>
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="h-11 px-5 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-brand-green/10 cursor-pointer transition-colors"
              >
                <Plus size={16} />
                New Task
              </button>
            </div>
          </div>

          {/* Calendar Layout: Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Calendar Main Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Calendar Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-2">
                    <button className="h-8 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-lg cursor-pointer">
                      Today
                    </button>
                    <div className="flex border border-zinc-200 rounded-lg overflow-hidden h-8">
                      <button className="p-1.5 hover:bg-zinc-50 text-zinc-500 border-r border-zinc-200 shrink-0 cursor-pointer">
                        <ChevronLeft size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-zinc-50 text-zinc-500 shrink-0 cursor-pointer">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <span className="text-base font-extrabold text-zinc-800 ml-2">June 2026</span>
                  </div>

                  {/* Mode select */}
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    {(["month", "week", "day"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`h-8 px-4 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          viewMode === mode
                            ? "bg-white text-zinc-800 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-950"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar Grid (Sun to Sat) */}
                <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-xl overflow-hidden border border-zinc-200 select-none">
                  {/* Days Labels */}
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                    <div key={day} className="bg-zinc-50 py-2.5 text-center text-[10px] font-extrabold tracking-wide text-zinc-400">
                      {day}
                    </div>
                  ))}

                  {/* Calendar Grid Days */}
                  {/* Empty cells for May: 31st */}
                  <div className="bg-white min-h-[90px] p-2 text-[10px] font-bold text-zinc-300">31</div>
                  
                  {/* June Days 1 to 20 */}
                  {Array.from({ length: 20 }, (_, idx) => {
                    const dayNum = idx + 1;
                    const isToday = dayNum === 9;
                    const dayEvents = getEventsForDay(dayNum);
                    
                    return (
                      <div
                        key={dayNum}
                        onClick={() => toast.info(`Viewing details for June ${dayNum}`)}
                        className="bg-white min-h-[90px] p-1.5 hover:bg-zinc-50/50 transition-colors cursor-pointer flex flex-col justify-between"
                      >
                        {/* Day Number */}
                        <div className="flex justify-end">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                              isToday
                                ? "bg-brand-green text-white font-extrabold shadow-sm"
                                : "text-zinc-800"
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>

                        {/* Events list */}
                        <div className="space-y-1 mt-2">
                          {dayEvents.map((evt, eidx) => (
                            <div
                              key={eidx}
                              className={`text-[9px] font-bold py-0.5 px-1.5 border-l-2 rounded-r flex items-center overflow-hidden ${
                                evt.type === "deadline"
                                  ? "bg-red-50 text-red-700 border-red-500"
                                  : evt.type === "meeting"
                                  ? "bg-brand-green-light text-brand-green border-brand-green"
                                  : evt.type === "recording"
                                  ? "bg-orange-50 text-orange-700 border-orange-500"
                                  : "bg-brand-green-light text-brand-green border-brand-green"
                              }`}
                              title={`${evt.time} - ${evt.title} (${evt.location})`}
                            >
                              <span className="truncate">{evt.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Widgets Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Today's Events */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                    <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight">Today's Events</h3>
                    <button className="text-[10px] font-bold text-brand-green hover:underline cursor-pointer select-none">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                      <div className="w-1.5 h-1.5 bg-brand-green rounded-full mt-1.5 shrink-0 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">10:00 AM - Final Cut Review</h4>
                        <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} />
                          Conference Room B
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">1:30 PM - Client Sync</h4>
                        <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} />
                          Zoom Meeting
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tomorrow */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight border-b border-zinc-100 pb-2">
                    Tomorrow
                  </h3>
                  <div className="flex items-start gap-3 p-2.5 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                    <div className="w-1.5 h-1.5 bg-brand-green rounded-full mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">2:00 PM - Audio Mixdown</h4>
                      <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} />
                        Studio 1
                      </span>
                    </div>
                  </div>
                </div>

                {/* This Week Summary */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-5 select-none">
                  <h3 className="text-sm font-extrabold text-zinc-800 tracking-tight border-b border-zinc-100 pb-2">
                    This Week Summary
                  </h3>
                  
                  {/* Large Event Counter */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                      {totalEvents}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">Total Events</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-green rounded-full" style={{ width: "50%" }} />
                  </div>

                  {/* Categories Breakdown */}
                  <div className="grid grid-cols-2 gap-3.5 pt-1 text-[11px] font-bold text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {deadlinesCount} Deadlines
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-green" />
                      {meetingsCount} Meetings
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      {recordingsCount} Recordings
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-green-hover" />
                      {reviewsCount} Reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }
