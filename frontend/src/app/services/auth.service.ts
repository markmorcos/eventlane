import { Injectable, signal, computed } from "@angular/core";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
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
  private googleProvider: GoogleAuthProvider;

  readonly currentUser = signal<User | null>(null);
  readonly authLoading = signal<boolean>(true);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userEmail = computed(() => this.currentUser()?.email ?? null);

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);
    this.googleProvider = new GoogleAuthProvider();

    this.authInitPromise = new Promise((resolve) => {
      this.auth.onAuthStateChanged((user) => {
        this.currentUser.set(user);

        if (!this.authInitialized) {
          this.authInitialized = true;
          this.authLoading.set(false);
          resolve();
        }
      });
    });
  }

  async signInWithGoogle() {
    const result = await signInWithPopup(this.auth, this.googleProvider);
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

  async getDisplayName(): Promise<string | null> {
    await this.authInitPromise;

    const user = this.currentUser();
    return user ? user.displayName : null;
  }

  async signOut() {
    await signOut(this.auth);
  }
}
