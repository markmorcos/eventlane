export interface Attendee {
  name: string;
  email: string;
  createdAt: string;
}

export interface Location {
  streetNumber?: string;
  street?: string;
  additional?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  formatted: string;
}

export interface EventSummary {
  slug: string;
  title: string;
  capacity: number;
  eventDate: number;
  timezone: string;
  location?: Location;
  description?: string;
  coverImageUrl?: string;
  confirmedCount: number;
  waitlistedCount: number;
  requesterStatus?: "CONFIRMED" | "WAITLISTED";
  creatorEmail: string;
  isAdmin: boolean;
  createdAt: string;
  version: number;
}

export interface EventDetail extends EventSummary {
  confirmed?: Attendee[];
  waitlisted?: Attendee[];
  admins?: string[];
}
