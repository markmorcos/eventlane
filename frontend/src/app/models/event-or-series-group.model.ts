import { EventDetail, EventSummary } from "./event.model";

export interface EventOrSeriesGroup {
  type: "standalone" | "series";
  seriesSlug: string | null;
  seriesTitle: string | null;
  upcomingEventsCount: number;
  nextEvent: EventDetail; // Using EventDetail since it has all the data
}
