import { Injectable, OnDestroy } from "@angular/core";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Subject } from "rxjs";
import { EventDelta } from "../models/event-delta.model";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class EventSocketService implements OnDestroy {
  private client: Client;

  private connectionReady = false;

  private pending: (() => void)[] = [];

  private unsubscribers = new Map<string, () => void>();
  private subjects = new Map<string, Subject<EventDelta[]>>();
  private activeSlugs = new Set<string>();

  constructor() {
    this.client = new Client({
      reconnectDelay: 3000, // ⬅ auto-reconnect
      webSocketFactory: () => new SockJS(environment.wsBaseUrl),
    });

    // When connected (initial + after reconnect)
    this.client.onConnect = () => {
      this.connectionReady = true;

      // Run first-time pending subscriptions
      this.pending.forEach((fn) => fn());
      this.pending = [];

      // Re-subscribe previously active topics
      this.activeSlugs.forEach((slug) => {
        this.resubscribe(slug);
      });
    };

    this.client.onWebSocketClose = () => {
      this.connectionReady = false;
    };

    this.client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers["message"], frame.body);
    };

    this.client.activate();
  }

  // ----------------------------
  //  Subscribe
  // ----------------------------

  subscribeToEvent(slug: string): Subject<EventDelta[]> {
    const destination = `/topic/events/${slug}`;

    const subject = new Subject<EventDelta[]>();
    this.subjects.set(slug, subject);
    this.activeSlugs.add(slug);

    const subscribeFn = () => {
      const sub = this.client.subscribe(destination, (msg: IMessage) => {
        const deltas = JSON.parse(msg.body) as EventDelta[];
        subject.next(deltas);
      });

      this.unsubscribers.set(slug, () => sub.unsubscribe());
    };

    if (this.connectionReady) subscribeFn();
    else this.pending.push(subscribeFn);

    return subject;
  }

  // ----------------------------
  //  Re-subscribe after reconnect
  // ----------------------------

  private resubscribe(slug: string) {
    const subject = this.subjects.get(slug);
    if (!subject) return;

    const destination = `/topic/events/${slug}`;

    const sub = this.client.subscribe(destination, (msg: IMessage) => {
      const deltas = JSON.parse(msg.body) as EventDelta[];
      subject.next(deltas);
    });

    this.unsubscribers.set(slug, () => sub.unsubscribe());
  }

  // ----------------------------
  //  Unsubscribe
  // ----------------------------

  unsubscribeFromEvent(slug: string) {
    const unsub = this.unsubscribers.get(slug);
    if (unsub) unsub();

    this.unsubscribers.delete(slug);
    this.subjects.delete(slug);
    this.activeSlugs.delete(slug);
  }

  ngOnDestroy(): void {
    this.client.deactivate();
  }
}
