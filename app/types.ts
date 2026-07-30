export type Role = "member" | "admin" | "primary_owner";

export interface Member {
  uid: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  memberNumber: number;
  favoritePlayer: string;
  cityId: string;
  state: string;
  fanSinceYear: number;
  status: "active" | "inactive" | "suspended";
  role: Role;
  createdAt: string;
  seasonsCount: number;
  attendancesCount: number;
  horseshoes: number;
  achievements: string[];
  firstRememberedGame: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  type: "match" | "social" | "special";
  season: string;
  week?: string;
  opponent?: string;
  matchDate: string;
  locationName: string;
  address: string;
  cityId: string;
  maxCapacity: number;
  registrationOpen: boolean;
  attendanceClosed: boolean;
  scoreColts?: number;
  scoreOpponent?: number;
}

export interface Attendance {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  cityId: string;
  checkInTime: string;
  method: "qr_scan" | "manual_admin";
  registeredBy: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  category: "memory" | "jersey" | "travel" | "collection" | "general";
  status: "pending" | "approved" | "rejected";
  reactions: Record<"goColts" | "horseshoe" | "welcome" | "letsGo" | "family" | "mvp", number>;
  createdAt: string;
}

export interface Prediction {
  id: string;
  memberId: string;
  memberName: string;
  eventId: string;
  scoreColts: number;
  scoreOpponent: number;
  firstTdPlayer: string;
  mvpPlayer: string;
  pointsEarned: number;
  createdAt: string;
}

export interface GuestBookMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  cityId: string;
  text: string;
  createdAt: string;
}

export interface Raffle {
  id: string;
  eventId: string;
  prizeName: string;
  winnerMemberId: string;
  winnerName: string;
  drawnAt: string;
  eligibleTicketCount: number;
  drawnBy: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId: string;
  timestamp: string;
}

export interface Travel {
  id: string;
  title: string;
  destination: string;
  travelDate: string;
  memberCount: number;
  description: string;
  imageUrl: string;
  organizerName: string;
}

export interface AppData {
  members: Member[];
  events: CommunityEvent[];
  attendances: Attendance[];
  feedPosts: FeedPost[];
  predictions: Prediction[];
  guestBook: GuestBookMessage[];
  raffles: Raffle[];
  auditLogs: AuditLog[];
  travels: Travel[];
}

export const CITIES = [
  { id: "cdmx", name: "CDMX", venue: "Stagg Bar & Grill" },
  { id: "mty", name: "Monterrey", venue: "Sede por confirmar" },
  { id: "gdl", name: "Guadalajara", venue: "Sede por confirmar" },
  { id: "qro", name: "Querétaro", venue: "Sede por confirmar" },
] as const;
