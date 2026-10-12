import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class HoverCardCoordinator {
  private active: (() => void) | null = null;
  claim(close: () => void) {
    if (this.active !== close) this.active?.();
    this.active = close;
  }
  release(close: () => void) {
    if (this.active === close) this.active = null;
  }
}
