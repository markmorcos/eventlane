import { Injectable } from "@angular/core";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private client: Client | null = null;
  private subscriptions = new Map<string, (message: any) => void>();
  private connected = false;

  connect(): void {
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsBaseUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      onConnect: () => {
        console.log("WebSocket connected");
        this.connected = true;
        // Re-subscribe to all previous subscriptions
        this.resubscribeAll();
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
        this.connected = false;
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    this.client.activate();
  }

  private resubscribeAll(): void {
    if (!this.client || !this.connected) return;

    console.log("Re-subscribing to all topics...");
    this.subscriptions.forEach((callback, destination) => {
      this.client!.subscribe(destination, (message: IMessage) => {
        const data = JSON.parse(message.body);
        callback(data);
      });
    });
  }

  subscribe(destination: string, callback: (message: any) => void): void {
    this.subscriptions.set(destination, callback);

    if (this.client?.active && this.connected) {
      this.client.subscribe(destination, (message: IMessage) => {
        const data = JSON.parse(message.body);
        callback(data);
      });
    }
  }

  unsubscribe(destination: string): void {
    this.subscriptions.delete(destination);
  }

  disconnect(): void {
    this.subscriptions.clear();
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
