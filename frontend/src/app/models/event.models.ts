export interface Attendee {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: "CONFIRMED" | "WAITLISTED";
  createdAt: string;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  createdAt: string;
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  capacity: number;
  confirmedCount: number;
  waitlistCount: number;
  isAdmin: boolean;
  currentUserAttendee: Attendee | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attendees {
  confirmed: Attendee[];
  waitlisted: Attendee[];
}

export interface RsvpRequest {
  name: string;
}

export interface RsvpResponse {
  status: "CONFIRMED" | "WAITLISTED";
  attendee: Attendee;
}

export interface CancelResponse {
  success: boolean;
  promoted: Attendee | null;
}

export interface CreateEventRequest {
  title: string;
  slug: string;
  capacity: number;
  adminEmails?: string[];
}

export interface UpdateCapacityRequest {
  capacity: number;
}

export interface UpdateCapacityResponse {
  event: EventDetail;
  promoted: Attendee[];
  demoted: Attendee[];
}

export interface AdminEmailRequest {
  adminEmail: string;
}
