import { Injectable, signal, computed } from "@angular/core";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  User,
  Auth,
} from "firebase/auth";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class AuthService {
  private auth: Auth;
  private authInitialized = false;
  private authInitPromise: Promise<void>;

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userEmail = computed(() => this.currentUser()?.email ?? null);

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);

    this.authInitPromise = new Promise<void>((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        this.currentUser.set(user);

        if (!this.authInitialized) {
          this.authInitialized = true;
          resolve();
          unsubscribe();

          this.auth.onAuthStateChanged((user) => {
            this.currentUser.set(user);
          });
        }
      });
    });
  }

  async sendSignInLinkToEmail(email: string): Promise<void> {
    const actionCodeSettings = {
      url: window.location.origin + "/auth/callback",
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
  }

  async completeSignInWithEmailLink(url: string): Promise<User> {
    if (!isSignInWithEmailLink(this.auth, url)) {
      throw new Error("Invalid sign-in link");
    }

    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
      email = window.prompt("Please provide your email for confirmation");
    }

    if (!email) {
      throw new Error("Email is required");
    }

    const result = await signInWithEmailLink(this.auth, email, url);
    window.localStorage.removeItem("emailForSignIn");

    return result.user;
  }

  async getIdToken(): Promise<string | null> {
    await this.authInitPromise;

    const user = this.currentUser();
    if (!user) {
      return null;
    }
    const token = await user.getIdToken(false);
    return token;
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}
