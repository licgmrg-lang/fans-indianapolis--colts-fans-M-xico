import type { AppData, Member, Role } from "./types";

export const OWNER_EMAIL = "lic.gmrg@gmail.com";
const PREFIX = "colts_mx_";
const DATA_KEY = `${PREFIX}app_data_v1`;
const SESSION_KEY = `${PREFIX}session_user`;

export const OWNER: Member = {
  uid: "guillermo_chief",
  email: OWNER_EMAIL,
  fullName: "Guillermo Ramirez Memo",
  avatarUrl: "",
  memberNumber: 1001,
  favoritePlayer: "Anthony Richardson",
  cityId: "cdmx",
  state: "Ciudad de México",
  fanSinceYear: 1995,
  status: "active",
  role: "primary_owner",
  createdAt: "2020-09-10T12:00:00Z",
  seasonsCount: 6,
  attendancesCount: 0,
  horseshoes: 0,
  achievements: ["Organizador Fundador"],
  firstRememberedGame: "Super Bowl XLI · Colts vs Bears",
};

export const CLEAN_DATA: AppData = {
  members: [OWNER],
  events: [],
  attendances: [],
  feedPosts: [],
  predictions: [],
  guestBook: [],
  raffles: [],
  auditLogs: [],
  travels: [],
};

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
}

export const LocalStore = {
  load(): AppData {
    if (typeof window === "undefined") return CLEAN_DATA;
    try {
      const raw = window.localStorage.getItem(DATA_KEY);
      return raw ? (JSON.parse(raw) as AppData) : CLEAN_DATA;
    } catch {
      return CLEAN_DATA;
    }
  },
  save(data: AppData) {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  },
  session(): SessionUser | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  },
  setSession(session: SessionUser | null) {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  },
  wipe() {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
    this.save(CLEAN_DATA);
  },
  exportData(data: AppData) {
    return JSON.stringify(
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        data,
      },
      null,
      2,
    );
  },
  restore(raw: string): AppData {
    const parsed = JSON.parse(raw) as { schemaVersion?: number; data?: Partial<AppData> };
    const candidate = parsed.data;
    const collectionKeys: (keyof AppData)[] = [
      "members",
      "events",
      "attendances",
      "feedPosts",
      "predictions",
      "guestBook",
      "raffles",
      "auditLogs",
      "travels",
    ];

    if (parsed.schemaVersion !== 1 || !candidate || collectionKeys.some((key) => !Array.isArray(candidate[key]))) {
      throw new Error("El archivo no corresponde a un respaldo válido de Project Horseshoe.");
    }

    const members = (candidate.members as Member[]).filter((member) => member.email !== OWNER_EMAIL);
    const restored: AppData = {
      ...(candidate as AppData),
      members: [OWNER, ...members],
    };
    this.save(restored);
    return restored;
  },
};

export function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
