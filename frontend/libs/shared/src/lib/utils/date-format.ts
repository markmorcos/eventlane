import { DateTime } from "luxon";

/**
 * Converts a datetime-local input value to ISO string in the context of a specific timezone.
 * For example, if dateTimeLocal is "2024-12-14T18:10" and timezone is "Europe/Berlin",
 * this returns the ISO string representing 18:10 Berlin time in UTC.
 */
export function convertLocalDateTimeToUTC(
  dateTimeLocal: string,
  timezone: string
): string {
  // Parse the datetime-local string and interpret it in the given timezone
  // Then convert to UTC
  const dt = DateTime.fromISO(dateTimeLocal, { zone: timezone });
  const iso = dt.toUTC().toISO();
  if (!iso) {
    throw new Error(
      `Invalid date/time: ${dateTimeLocal} in timezone ${timezone}`
    );
  }
  return iso;
}

/**
 * Converts a UTC timestamp to a datetime-local string in a specific timezone.
 * For example, if the timestamp represents 17:10 UTC and timezone is "Europe/Berlin" (UTC+1),
 * this returns "2024-12-14T18:10" to display in a datetime-local input.
 */
export function convertUTCToLocalDateTime(
  timestamp: number,
  timezone: string
): string {
  const dt = DateTime.fromMillis(timestamp, { zone: "utc" }).setZone(timezone);
  // Format as datetime-local format: YYYY-MM-DDTHH:mm
  return dt.toFormat("yyyy-MM-dd'T'HH:mm");
}

export function formatEventDateTime(
  timestamp: number,
  timezone: string,
  locale: string
): string {
  try {
    if (!timestamp || !timezone) {
      return "";
    }
    const dt = DateTime.fromMillis(timestamp, { zone: "utc" }).setZone(
      timezone
    );
    if (!dt.isValid) {
      console.error("Invalid DateTime:", dt.invalidReason);
      return "";
    }
    const formatted = dt.setLocale(locale).toLocaleString({
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return formatted || "";
  } catch (error) {
    console.error("Error formatting date:", error);
    try {
      return DateTime.fromMillis(timestamp).toLocaleString() || "";
    } catch {
      return "";
    }
  }
}

export function formatEventDate(
  timestamp: number,
  timezone: string,
  locale: string
) {
  try {
    const dt = DateTime.fromMillis(timestamp, { zone: "utc" }).setZone(
      timezone
    );
    return dt.setLocale(locale).toLocaleString({
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return DateTime.fromMillis(timestamp).toLocaleString();
  }
}

export function formatEventTime(
  timestamp: number,
  timezone: string,
  locale: string
) {
  try {
    const dt = DateTime.fromMillis(timestamp, { zone: "utc" }).setZone(
      timezone
    );
    return dt.setLocale(locale).toLocaleString({
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return DateTime.fromMillis(timestamp).toLocaleString(DateTime.TIME_SIMPLE);
  }
}

export function getRelativeTime(timestamp: number, locale: string): string {
  const dt = DateTime.fromMillis(timestamp);
  // Use Luxon's toRelative which handles all the formatting automatically
  return dt.setLocale(locale).toRelative() || "";
}
