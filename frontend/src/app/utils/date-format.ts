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
