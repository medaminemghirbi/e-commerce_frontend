import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  /** True when any async work is in flight */
  readonly active = signal(false);
  private count = 0;

  start(): void {
    this.count++;
    this.active.set(true);
  }

  complete(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.active.set(false);
  }
}
