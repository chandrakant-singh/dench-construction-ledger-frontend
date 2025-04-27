// toast.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts: any[] = [];

  show(message: string, type: 'success' | 'danger' | 'info' = 'info') {
    const classes = `text-bg-${type}`;
    this.toasts.push({ message, classes });
    setTimeout(() => this.remove(this.toasts[0]), 3000);
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  clear() {
    this.toasts = [];
  }
}
