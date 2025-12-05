export interface Attendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface EventSummary {
  slug: string;
  title: string;
  capacity: number;
  confirmedCount: number;
  waitlistedCount: number;
  requesterStatus?: "CONFIRMED" | "WAITLISTED";
  creatorEmail: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface EventDetail extends EventSummary {
  confirmed?: Attendee[];
  waitlisted?: Attendee[];
  admins?: string[];
}
