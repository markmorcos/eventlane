// List of all IANA timezones organized by region
export const TIMEZONES = [
  // Americas
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Adak",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/Mexico_City",
  "America/Cancun",
  "America/Monterrey",
  "America/Sao_Paulo",
  "America/Rio_de_Janeiro",
  "America/Buenos_Aires",
  "America/Santiago",
  "America/Bogota",
  "America/Lima",
  "America/Caracas",

  // Europe
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Lisbon",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Zurich",
  "Europe/Prague",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Europe/Kiev",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Helsinki",

  // Asia
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Mumbai",
  "Asia/Delhi",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Beijing",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Manila",
  "Asia/Jakarta",
  "Asia/Ho_Chi_Minh",
  "Asia/Kuala_Lumpur",
  "Asia/Taipei",
  "Asia/Tehran",
  "Asia/Baghdad",
  "Asia/Riyadh",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Bahrain",
  "Asia/Jerusalem",

  // Pacific
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Guam",
  "Pacific/Tahiti",

  // Africa
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Casablanca",
  "Africa/Algiers",
  "Africa/Tunis",
  "Africa/Accra",
  "Africa/Addis_Ababa",

  // Atlantic
  "Atlantic/Reykjavik",
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",
];

export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
    return offset.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

export function getTimezoneDisplayName(timezone: string): string {
  const offset = getTimezoneOffset(timezone);
  const name = timezone.replace(/_/g, " ");
  return offset ? `${name} (${offset})` : name;
}

export function getCurrentTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function searchTimezones(query: string): string[] {
  if (!query.trim()) {
    return TIMEZONES;
  }

  const lowerQuery = query.toLowerCase();
  return TIMEZONES.filter((tz) => {
    const displayName = getTimezoneDisplayName(tz).toLowerCase();
    return displayName.includes(lowerQuery);
  });
}
