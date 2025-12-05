import { Attendee } from "./event.model";

export type AttendeeStatus = "CONFIRMED" | "WAITLISTED";

export interface BaseDelta {
  type: string;
  version: number;
  timestamp: string;
  eventSlug: string;
}

export interface EventCreatedDelta extends BaseDelta {
  type: "EventCreated";
  title: string;
  capacity: number;
}

export interface EventCapacityUpdatedDelta extends BaseDelta {
  type: "EventCapacityUpdated";
  oldCapacity: number;
  newCapacity: number;
}

export interface EventDeletedDelta extends BaseDelta {
  type: "EventDeleted";
  slug: string;
}

export interface AttendeeAddedDelta extends BaseDelta {
  type: "AttendeeAdded";
  attendee: Attendee;
  status: AttendeeStatus;
}

export interface AttendeeRemovedDelta extends BaseDelta {
  type: "AttendeeRemoved";
  attendeeEmail: string;
}

export interface AttendeeStatusChangedDelta extends BaseDelta {
  type: "AttendeeStatusChanged";
  attendeeEmail: string;
  oldStatus: AttendeeStatus;
  newStatus: AttendeeStatus;
}

export interface AdminAddedDelta extends BaseDelta {
  type: "AdminAdded";
  adminEmail: string;
}

export interface AdminRemovedDelta extends BaseDelta {
  type: "AdminRemoved";
  adminEmail: string;
}

export type EventDelta =
  | EventCreatedDelta
  | EventCapacityUpdatedDelta
  | EventDeletedDelta
  | AttendeeAddedDelta
  | AttendeeRemovedDelta
  | AttendeeStatusChangedDelta
  | AdminAddedDelta
  | AdminRemovedDelta;
