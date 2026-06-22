export interface UserProject {
  id: string;
  name: string;
  projectId: string;
  priority: "High" | "Medium" | "Low";
  priorityColor: string;
  status: "In Progress" | "Completed" | "Overdue" | "Draft";
  statusColor: string;
  stage: string;
  dueDate: string;
  progress: number;
  created: string;
  lastUpdated: string;
  creator: string;

  // Creative pipeline data
  topic?: string;
  selectedTone?: string;
  duration?: string;
  language?: string;
  instructions?: string;
  generatedScriptText?: string;
  wordCount?: number;
  estDuration?: string;

  selectedVoiceModel?: string;
  voiceSpeed?: string;
  voicePitch?: string;

  selectedAvatar?: string;
  selectedBg?: string;
  resolution?: string;

  editMethod?: "AI" | "Human" | null;
  aiInstructions?: string;
  stylePreset?: string;
  humanInstructions?: string;
  selectedEditor?: string;

  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubeTags?: string[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer" | "support";
  status: "active" | "offline";
  projects: number;
  joined: string;
  avatarLetter: string;
  avatarColor: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  owner: string;
  projectsCount: number;
  membersCount: number;
  status: "active" | "suspended";
}

export interface ScheduledPost {
  id: string;
  title: string;
  platforms: string[];
  status: "published" | "scheduled" | "draft";
  date: string;
  views: string;
  thumbnailColor: string;
}

// ----------------------------------------------------
// DEFAULT SEED DATA
// ----------------------------------------------------

const DEFAULT_PROJECTS: UserProject[] = [
  {
    id: "q3-promo-video",
    name: "Q3 Nature Promo - Final Cut",
    projectId: "PRJ-001",
    priority: "High",
    priorityColor: "bg-red-50 text-red-700 border-red-100",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Video Generation",
    dueDate: "Due: Jun 25",
    progress: 60,
    created: "Jun 20, 2026",
    lastUpdated: "2 hours ago",
    creator: "Sarah J.",
    topic: "Q3 Nature Promo",
    selectedTone: "Professional",
    duration: "2:30",
    language: "English (US)",
    instructions: "Focus on scenic beauty and brand alignment.",
    generatedScriptText: "Are you ready to transform how your team creates videos? Introducing UChat Video AI. UChat Video is the all-in-one platform built for modern teams to automate video production at scale.",
    wordCount: 32,
    estDuration: "0:15",
    selectedVoiceModel: "Marcus",
    voiceSpeed: "1.0x",
    voicePitch: "Normal",
    selectedAvatar: "Marcus",
    selectedBg: "Studio",
    resolution: "1080p",
    youtubeTitle: "Q3 Nature Promo - Final Cut",
    youtubeDescription: "Our nature promo explaining the value of UChat Video."
  },
  {
    id: "onboarding-v2",
    name: "Onboarding Tutorial V2",
    projectId: "PRJ-002",
    priority: "Medium",
    priorityColor: "bg-amber-50 text-amber-700 border-amber-100",
    status: "Completed",
    statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
    stage: "Completed",
    dueDate: "Due: Jun 20",
    progress: 100,
    created: "Jun 18, 2026",
    lastUpdated: "1 day ago",
    creator: "Mike K.",
    topic: "Onboarding Tutorial V2",
    selectedTone: "Educational",
    duration: "5:00",
    language: "English (US)",
    generatedScriptText: "Welcome to UChat Video. In this onboarding tutorial, we will show you how to generate video scripts, select AI voices, and export to social platforms in one click.",
    wordCount: 30,
    estDuration: "0:20",
    selectedVoiceModel: "Sarah",
    selectedAvatar: "Sarah",
    selectedBg: "Office",
    resolution: "1080p",
    editMethod: "AI"
  },
  {
    id: "social-ad",
    name: "Social Media Ad - June",
    projectId: "PRJ-003",
    priority: "High",
    priorityColor: "bg-red-50 text-red-700 border-red-100",
    status: "Overdue",
    statusColor: "bg-red-105 text-red-800 border-red-200",
    stage: "AI Script Gen",
    dueDate: "Due: Jun 15",
    progress: 20,
    created: "Jun 10, 2026",
    lastUpdated: "3 days ago",
    creator: "Sarah J."
  },
  {
    id: "brand-refresh",
    name: "Brand Refresh Announcement",
    projectId: "PRJ-004",
    priority: "Low",
    priorityColor: "bg-zinc-100 text-zinc-650 border-zinc-200",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Voiceover",
    dueDate: "Due: Jul 02",
    progress: 45,
    created: "Jun 21, 2026",
    lastUpdated: "5 hours ago",
    creator: "David M."
  },
  {
    id: "concept-draft",
    name: "Draft Concept #4",
    projectId: "PRJ-005",
    priority: "Low",
    priorityColor: "bg-zinc-100 text-zinc-650 border-zinc-200",
    status: "Draft",
    statusColor: "bg-zinc-50 text-zinc-400 border-zinc-150",
    stage: "Idea Selection",
    dueDate: "Due: Jul 10",
    progress: 10,
    created: "Jun 22, 2026",
    lastUpdated: "Just now",
    creator: "Sarah J."
  },
  {
    id: "req-1",
    name: "Corporate Promo Video Q3",
    projectId: "PRJ-006",
    priority: "Medium",
    priorityColor: "bg-amber-50 text-amber-700 border-amber-100",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Video Editing",
    dueDate: "Due: Jun 25",
    progress: 85,
    created: "Jun 22, 2026",
    lastUpdated: "1 hour ago",
    creator: "Sarah Johnson",
    editMethod: "Human",
    humanInstructions: "Please polish transitions and add brand styling.",
    selectedEditor: "David"
  },
  {
    id: "req-2",
    name: "Social Media Shorts Batch 5",
    projectId: "PRJ-007",
    priority: "Low",
    priorityColor: "bg-zinc-100 text-zinc-650 border-zinc-200",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Video Editing",
    dueDate: "Due: Jun 26",
    progress: 85,
    created: "Jun 22, 2026",
    lastUpdated: "2 hours ago",
    creator: "Marketing Team",
    editMethod: "Human",
    humanInstructions: "Apply color grading preset."
  },
  {
    id: "req-3",
    name: "Product Launch Teaser",
    projectId: "PRJ-008",
    priority: "High",
    priorityColor: "bg-red-50 text-red-700 border-red-100",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Video Editing",
    dueDate: "Due: Jun 28",
    progress: 85,
    created: "Jun 22, 2026",
    lastUpdated: "3 hours ago",
    creator: "R&D Dept",
    editMethod: "Human",
    humanInstructions: "Add custom motion graphics intro."
  },
  {
    id: "ceo-address",
    name: "CEO End of Year Address",
    projectId: "PRJ-009",
    priority: "High",
    priorityColor: "bg-red-50 text-red-700 border-red-100",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Editing",
    dueDate: "Due: Jun 24",
    progress: 87,
    created: "Jun 22, 2026",
    lastUpdated: "30 mins ago",
    creator: "Sarah Johnson",
    editMethod: "Human",
    humanInstructions: "Enhance audio track to remove background hum.",
    selectedEditor: "David"
  },
  {
    id: "editor-brand-refresh",
    name: "Brand Refresh Teaser",
    projectId: "PRJ-010",
    priority: "Low",
    priorityColor: "bg-zinc-100 text-zinc-650 border-zinc-200",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Editing",
    dueDate: "Due: Jun 25",
    progress: 86,
    created: "Jun 22, 2026",
    lastUpdated: "4 hours ago",
    creator: "Design Studio",
    editMethod: "Human"
  },
  {
    id: "app-tour",
    name: "Mobile App Tour Walkthrough",
    projectId: "PRJ-011",
    priority: "Medium",
    priorityColor: "bg-amber-50 text-amber-700 border-amber-100",
    status: "In Progress",
    statusColor: "bg-zinc-100 text-zinc-800",
    stage: "Under Review",
    dueDate: "Due: Jun 23",
    progress: 95,
    created: "Jun 22, 2026",
    lastUpdated: "5 hours ago",
    creator: "Alex Rivera",
    editMethod: "Human"
  },
  {
    id: "comp-1",
    name: "Acme Product Launch Trailer",
    projectId: "PRJ-012",
    priority: "Medium",
    priorityColor: "bg-amber-50 text-amber-700 border-amber-100",
    status: "Completed",
    statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
    stage: "Completed",
    dueDate: "Due: Jun 20",
    progress: 100,
    created: "Jun 15, 2026",
    lastUpdated: "2 days ago",
    creator: "Sarah Johnson",
    estDuration: "1:45",
    editMethod: "Human"
  },
  {
    id: "comp-2",
    name: "Q1 Financial Summary Presentation",
    projectId: "PRJ-013",
    priority: "Low",
    priorityColor: "bg-zinc-100 text-zinc-650 border-zinc-200",
    status: "Completed",
    statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
    stage: "Completed",
    dueDate: "Due: Jun 18",
    progress: 100,
    created: "Jun 12, 2026",
    lastUpdated: "4 days ago",
    creator: "Finance Dept",
    estDuration: "5:30",
    editMethod: "AI"
  },
  {
    id: "comp-3",
    name: "Developer Tutorial: Getting Started",
    projectId: "PRJ-014",
    priority: "High",
    priorityColor: "bg-red-50 text-red-700 border-red-100",
    status: "Completed",
    statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
    stage: "Completed",
    dueDate: "Due: Jun 15",
    progress: 100,
    created: "Jun 10, 2026",
    lastUpdated: "1 week ago",
    creator: "DevRelations",
    estDuration: "10:15",
    editMethod: "Human"
  },
  {
    id: "comp-4",
    name: "Social Ad Clip - Summer Campaign",
    projectId: "PRJ-015",
    priority: "Medium",
    priorityColor: "bg-amber-50 text-amber-700 border-amber-100",
    status: "Completed",
    statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
    stage: "Completed",
    dueDate: "Due: Jun 12",
    progress: 100,
    created: "Jun 05, 2026",
    lastUpdated: "2 weeks ago",
    creator: "Marketing Team",
    estDuration: "0:30",
    editMethod: "Human"
  }
];

const DEFAULT_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "admin",
    status: "active",
    projects: 12,
    joined: "Jan 2026",
    avatarLetter: "S",
    avatarColor: "bg-emerald-500",
  },
  {
    id: "2",
    name: "Tom Wilson",
    email: "tom.w@example.com",
    role: "editor",
    status: "offline",
    projects: 8,
    joined: "Mar 2026",
    avatarLetter: "T",
    avatarColor: "bg-amber-500",
  },
  {
    id: "3",
    name: "Alex Rivera",
    email: "arivera@example.com",
    role: "viewer",
    status: "active",
    projects: 3,
    joined: "Apr 2026",
    avatarLetter: "A",
    avatarColor: "bg-blue-500",
  },
  {
    id: "4",
    name: "Emma Davis",
    email: "emma@example.com",
    role: "editor",
    status: "active",
    projects: 5,
    joined: "Feb 2026",
    avatarLetter: "E",
    avatarColor: "bg-violet-500",
  },
  {
    id: "5",
    name: "John Carter",
    email: "carter.j@example.com",
    role: "viewer",
    status: "offline",
    projects: 2,
    joined: "May 2026",
    avatarLetter: "J",
    avatarColor: "bg-zinc-550",
  }
];

const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  {
    id: "w1",
    name: "Acme Corp",
    owner: "John Doe",
    projectsCount: 24,
    membersCount: 8,
    status: "active",
  },
  {
    id: "w2",
    name: "Stark Industries",
    owner: "Pepper Potts",
    projectsCount: 52,
    membersCount: 15,
    status: "active",
  },
  {
    id: "w3",
    name: "Wayne Enterprises",
    owner: "Lucius Fox",
    projectsCount: 41,
    membersCount: 11,
    status: "active",
  },
  {
    id: "w4",
    name: "Oscorp Industries",
    owner: "Norman Osborn",
    projectsCount: 12,
    membersCount: 5,
    status: "suspended",
  }
];

const DEFAULT_POSTS: ScheduledPost[] = [
  {
    id: "p1",
    title: "Q3 Product Launch",
    platforms: ["youtube", "linkedin"],
    status: "published",
    date: "Oct 12, 2026",
    views: "12.4k",
    thumbnailColor: "bg-[#6a9985]",
  },
  {
    id: "p2",
    title: "Brand Story 2026",
    platforms: ["tiktok"],
    status: "scheduled",
    date: "Oct 15, 2026",
    views: "—",
    thumbnailColor: "bg-[#bf7a5c]",
  },
  {
    id: "p3",
    title: "Weekly Update v4",
    platforms: ["youtube"],
    status: "draft",
    date: "Oct 10, 2026",
    views: "—",
    thumbnailColor: "bg-zinc-200",
  }
];

// ----------------------------------------------------
// LOCAL STORAGE WRAPPERS
// ----------------------------------------------------

const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) {
      window.localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error("Local Storage Error:", error);
    return defaultValue;
  }
};

const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Local Storage Error:", error);
  }
};

// --- Projects Store ---

export const getStoredProjects = (): UserProject[] => {
  return getLocalStorageItem<UserProject[]>("script_to_vid_projects", DEFAULT_PROJECTS);
};

export const saveStoredProjects = (projects: UserProject[]): void => {
  setLocalStorageItem("script_to_vid_projects", projects);
};

export const getStoredProjectById = (id: string): UserProject | undefined => {
  const projects = getStoredProjects();
  return projects.find((p) => p.id === id);
};

export const updateStoredProject = (id: string, updates: Partial<UserProject>): UserProject | undefined => {
  const projects = getStoredProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  
  const updatedProj = { ...projects[index], ...updates };
  projects[index] = updatedProj;
  saveStoredProjects(projects);
  return updatedProj;
};

// --- Members Store ---

export const getStoredMembers = (): Member[] => {
  return getLocalStorageItem<Member[]>("script_to_vid_members", DEFAULT_MEMBERS);
};

export const saveStoredMembers = (members: Member[]): void => {
  setLocalStorageItem("script_to_vid_members", members);
};

// --- Workspaces Store ---

export const getStoredWorkspaces = (): WorkspaceItem[] => {
  return getLocalStorageItem<WorkspaceItem[]>("script_to_vid_workspaces", DEFAULT_WORKSPACES);
};

export const saveStoredWorkspaces = (workspaces: WorkspaceItem[]): void => {
  setLocalStorageItem("script_to_vid_workspaces", workspaces);
};

// --- Posts Store ---

export const getStoredPosts = (): ScheduledPost[] => {
  return getLocalStorageItem<ScheduledPost[]>("script_to_vid_posts", DEFAULT_POSTS);
};

export const saveStoredPosts = (posts: ScheduledPost[]): void => {
  setLocalStorageItem("script_to_vid_posts", posts);
};
