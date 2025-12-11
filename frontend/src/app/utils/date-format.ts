export function formatEventDateTime(
  timestamp: number,
  timezone: string,
  options: {
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
  } = {}
): string {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      dateStyle: options.dateStyle || "long",
      timeStyle: options.timeStyle || "short",
      timeZoneName: "short",
    });
    return formatter.format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date(timestamp).toLocaleString();
  }
}

export function formatEventDate(timestamp: number, timezone: string): string {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("en-US", {
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

export function formatEventTime(timestamp: number, timezone: string): string {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("en-US", {
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

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (diff < 0) {
    return "Past";
  } else if (days > 0) {
    return `In ${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `In ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return "Now";
  }
}
