import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../environments/environment";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions = new Map<string, Subject<any>>();

  constructor() {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.client) {
        resolve();
        return;
      }

      // Create STOMP client with SockJS
      this.client = new Client({
        webSocketFactory: () => new SockJS(environment.wsBaseUrl),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          console.log("[STOMP Debug]", str);
        },
      });

      this.client.onConnect = () => {
        this.connected = true;
        console.log("WebSocket connected");
        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error("STOMP error:", frame);
        reject(new Error(frame.headers["message"]));
      };

      this.client.onDisconnect = () => {
        this.connected = false;
        console.log("WebSocket disconnected");
      };

      this.client.activate();
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.subscriptions.clear();
      console.log("WebSocket disconnected");
    }
  }

  subscribe<T>(destination: string): Observable<T> {
    const subject = this.subscriptions.get(destination) || new Subject<T>();

    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, subject);
      console.log(`[WebSocket] Creating subscription for: ${destination}`);

      const setupSubscription = () => {
        if (this.client && this.connected) {
          this.client.subscribe(destination, (message: IMessage) => {
            const data = JSON.parse(message.body);
            console.log(`[WebSocket] Received data on ${destination}:`, data);
            subject.next(data);
          });
          console.log(`[WebSocket] Subscribed to: ${destination}`);
        }
      };

      if (!this.connected) {
        this.connect()
          .then(() => setupSubscription())
          .catch((error) => subject.error(error));
      } else {
        setupSubscription();
      }
    }

    return subject.asObservable();
  }
}
