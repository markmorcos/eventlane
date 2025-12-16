import { InjectionToken } from "@angular/core";

export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  wsBaseUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  googleMapsApiKey: string;
}

export const ENVIRONMENT = new InjectionToken<Environment>("environment");
