import { inject, Injectable, OnDestroy, PLATFORM_ID } from "@angular/core";
import { Client, IMessage } from "@stomp/stompjs";
import { Subject } from "rxjs";

import { environment } from "../../environments/environment";

import { EventDelta } from "../models/event-delta.model";
import { isPlatformBrowser } from "@angular/common";

@Injectable({ providedIn: "root" })
export class EventSocketService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private client: Client;

  private ready = false;

  private subjects = new Map<string, Subject<EventDelta[]>>();
  private subscriptions = new Map<string, () => void>();
  private activeSlugs = new Set<string>();

  private userSubject?: Subject<EventDelta[]>;
  private userSubscription?: () => void;
  private activeUserEmail?: string;

  constructor() {
    if (!this.isBrowser) {
      this.client = {} as Client;
      return;
    }

    this.client = new Client({
      reconnectDelay: 3000,
      debug: (str) => {
        if (!environment.production) {
          console.log(str);
        }
      },
      webSocketFactory: () => new WebSocket(environment.wsBaseUrl),
    });

    this.client.onConnect = () => {
      this.ready = true;

      this.activeSlugs.forEach((slug) => {
        if (!this.subscriptions.has(slug)) {
          this.internalSubscribe(slug);
        }
      });

      if (this.activeUserEmail && !this.userSubscription) {
        this.internalSubscribeToUser(this.activeUserEmail);
      }
    };

    this.client.onWebSocketClose = () => {
      this.ready = false;

      this.subscriptions.clear();
      this.userSubscription = undefined;
    };

    this.client.activate();
  }

  subscribeToEvent(slug: string): Subject<EventDelta[]> {
    if (this.subjects.has(slug)) {
      return this.subjects.get(slug)!;
    }

    const subject = new Subject<EventDelta[]>();
    this.subjects.set(slug, subject);
    this.activeSlugs.add(slug);

    if (this.ready) {
      this.internalSubscribe(slug);
    }

    return subject;
  }

  private internalSubscribe(slug: string) {
    const subject = this.subjects.get(slug);
    if (!subject) return;

    const dest = `/topic/events/${slug}`;

    const sub = this.client.subscribe(dest, (msg: IMessage) => {
      console.log("Received event notification", slug, msg.body);
      subject.next(JSON.parse(msg.body));
    });

    this.subscriptions.set(slug, () => sub.unsubscribe());
  }

  unsubscribeFromEvent(slug: string) {
    const unsub = this.subscriptions.get(slug);
    unsub?.();

    this.subscriptions.delete(slug);
    this.subjects.delete(slug);
    this.activeSlugs.delete(slug);
  }

  subscribeToUserNotifications(email: string): Subject<EventDelta[]> {
    if (this.userSubject && this.activeUserEmail === email) {
      return this.userSubject;
    }

    if (this.activeUserEmail && this.activeUserEmail !== email) {
      this.unsubscribeFromUserNotifications();
    }

    const subject = new Subject<EventDelta[]>();
    this.userSubject = subject;
    this.activeUserEmail = email;

    if (this.ready) {
      this.internalSubscribeToUser(email);
    }

    return subject;
  }

  private internalSubscribeToUser(email: string) {
    const subject = this.userSubject;
    if (!subject) return;

    const dest = `/topic/users/${email}`;

    const sub = this.client.subscribe(dest, (msg: IMessage) => {
      console.log("Received user notification", msg.body);
      subject.next(JSON.parse(msg.body));
    });

    this.userSubscription = () => sub.unsubscribe();
  }

  unsubscribeFromUserNotifications() {
    this.userSubscription?.();
    this.userSubscription = undefined;
    this.userSubject = undefined;
    this.activeUserEmail = undefined;
  }

  ngOnDestroy() {
    if (!this.isBrowser) return;

    this.client.deactivate();
  }
}
