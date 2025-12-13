export interface UserPreferences {
  language: "en" | "de";
}

export interface UpdateUserPreferencesRequest {
  language: string;
}
