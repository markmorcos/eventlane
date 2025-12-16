export interface EventSeries {
  slug: string;
  title: string;
  interval: string | null;
  leadWeeks: number;
  autoGenerate: boolean;
  anchorDate: number;
  timezone: string;
  endDate: number | null;
  nextEventDate: number | null;
  nextEventSlug: string | null;
  upcomingEventsCount: number;
  creatorEmail: string;
  admins: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface CreateEventSeriesRequest {
  title: string;
  interval: string | null;
  leadWeeks: number;
  autoGenerate: boolean;
  endDate: number | null;
}

export interface UpdateEventSeriesRequest {
  anchorDate?: number;
  timezone?: string;
  interval?: string | null;
  leadWeeks?: number;
  autoGenerate?: boolean;
  endDate?: number | null;
}
