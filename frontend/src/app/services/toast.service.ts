import { Injectable, signal, computed } from "@angular/core";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
  duration: number;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = computed(() => this._toasts());

  private readonly defaultDuration = 3000; // 3 seconds

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private addToast(toast: Omit<Toast, "id">): string {
    const id = this.generateId();
    const newToast: Toast = { ...toast, id };

    this._toasts.update((toasts) => [...toasts, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      this.dismiss(id);
    }, toast.duration);

    return id;
  }

  success(
    title: string,
    description?: string,
    duration = this.defaultDuration
  ): string {
    return this.addToast({ type: "success", title, description, duration });
  }

  error(
    title: string,
    description?: string,
    duration = this.defaultDuration
  ): string {
    return this.addToast({ type: "error", title, description, duration });
  }

  info(
    title: string,
    description?: string,
    duration = this.defaultDuration
  ): string {
    return this.addToast({ type: "info", title, description, duration });
  }

  warning(
    title: string,
    description?: string,
    duration = this.defaultDuration
  ): string {
    return this.addToast({ type: "warning", title, description, duration });
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this._toasts.set([]);
  }
}
