import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../environments/environment";
import { io, Socket } from "socket.io-client";

@Injectable({
  providedIn: "root",
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private subscriptions = new Map<string, Subject<any>>();

  constructor() {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.socket) {
        resolve();
        return;
      }

      // Socket.IO connection
      this.socket = io(environment.wsBaseUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        this.connected = true;
        console.log("WebSocket connected");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
        console.log("WebSocket disconnected");
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.subscriptions.clear();
      console.log("WebSocket disconnected");
    }
  }

  subscribe<T>(topic: string): Observable<T> {
    const subject = this.subscriptions.get(topic) || new Subject<T>();

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, subject);
      console.log(`[WebSocket] Creating subscription for topic: ${topic}`);

      const setupListener = () => {
        if (this.socket) {
          this.socket.on(topic, (data: T) => {
            console.log(`[WebSocket] Received data on topic '${topic}':`, data);
            subject.next(data);
          });
          console.log(`[WebSocket] Listener set up for topic: ${topic}`);
        }
      };

      if (!this.connected) {
        this.connect()
          .then(() => setupListener())
          .catch((error) => subject.error(error));
      } else {
        setupListener();
      }
    }

    return subject.asObservable();
  }

  joinRoom(room: string): void {
    if (this.socket) {
      this.socket.emit("join-room", room);
      console.log(`[WebSocket] Joining room: ${room}`);
    }
  }

  leaveRoom(room: string): void {
    if (this.socket) {
      this.socket.emit("leave-room", room);
      console.log(`Left room: ${room}`);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
