import { Injectable, OnDestroy } from "@angular/core";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Subject } from "rxjs";

import { EventDelta } from "../models/event-delta.model";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class EventSocketService implements OnDestroy {
  private client: Client;

  private ready = false;

  private subjects = new Map<string, Subject<EventDelta[]>>();
  private subscriptions = new Map<string, () => void>();
  private activeSlugs = new Set<string>();

  constructor() {
    this.client = new Client({
      reconnectDelay: 3000,
      webSocketFactory: () => new SockJS(environment.wsBaseUrl),
    });

    this.client.onConnect = () => {
      this.ready = true;

      this.activeSlugs.forEach((slug) => {
        if (!this.subscriptions.has(slug)) {
          this.internalSubscribe(slug);
        }
      });
    };

    this.client.onWebSocketClose = () => {
      this.ready = false;

      this.subscriptions.clear();
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

  ngOnDestroy() {
    this.client.deactivate();
  }
}
