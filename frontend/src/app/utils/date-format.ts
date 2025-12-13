/**
 * Converts a datetime-local input value to ISO string in the context of a specific timezone.
 * For example, if dateTimeLocal is "2024-12-14T18:10" and timezone is "Europe/Berlin",
 * this returns the ISO string representing 18:10 Berlin time in UTC.
 */
export function convertLocalDateTimeToUTC(
  dateTimeLocal: string,
  timezone: string
): string {
  const [datePart, timePart] = dateTimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  // Initial guess: treat the input as if it were UTC
  let guess = Date.UTC(year, month - 1, day, hours, minutes, 0);

  // Iteratively adjust to find the UTC time that displays as our desired time in the target timezone
  for (let i = 0; i < 3; i++) {
    const date = new Date(guess);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(date);

    const tzHour = parseInt(parts.find((p) => p.type === "hour")!.value);
    const tzMinute = parseInt(parts.find((p) => p.type === "minute")!.value);
    const tzDay = parseInt(parts.find((p) => p.type === "day")!.value);

    // Calculate the difference between desired and actual
    const errorHours = hours - tzHour;
    const errorMinutes = minutes - tzMinute;
    const errorDays = day - tzDay;

    if (errorHours === 0 && errorMinutes === 0 && errorDays === 0) {
      break; // Converged to the correct UTC time
    }

    // Adjust the guess
    guess += (errorDays * 24 * 60 + errorHours * 60 + errorMinutes) * 60 * 1000;
  }

  return new Date(guess).toISOString();
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
  const date = new Date(timestamp);

  // Format the date in the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatEventDateTime(
  timestamp: number,
  timezone: string,
  locale: string
) {
  try {
    const date = new Date(timestamp);

    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return formatter.format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date(timestamp).toLocaleString();
  }
}

export function formatEventDate(
  timestamp: number,
  timezone: string,
  locale: string
) {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return formatter.format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date(timestamp).toLocaleDateString();
  }
}

export function formatEventTime(
  timestamp: number,
  timezone: string,
  locale: string
) {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return formatter.format(date);
  } catch (error) {
    console.error("Error formatting time:", error);
    return new Date(timestamp).toLocaleTimeString();
  }
}

export function getRelativeTime(timestamp: number, locale: string): string {
  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}
