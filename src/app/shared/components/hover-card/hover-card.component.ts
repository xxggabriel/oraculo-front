import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  afterRenderEffect,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { HoverCardCoordinator } from "./hover-card-coordinator";

@Component({
  selector: "app-hover-card",
  standalone: true,
  host: { class: "inline" },
  template: `
    <span
      #trigger
      (pointerenter)="enterTrigger($event)"
      (pointerleave)="leaveTrigger()"
      (focusin)="focusIn()"
      (focusout)="focusOut($event)"
      (click)="close()"
      ><ng-content select="[hoverCardTrigger]"
    /></span>
    @if (open()) {
      <span
        #panel
        [id]="cardId()"
        role="tooltip"
        [attr.aria-label]="label()"
        [attr.popover]="nativePopover ? 'manual' : null"
        class="reference-hover-card w-90 max-w-[calc(100vw-24px)] fixed inset-auto z-50 m-0 block overflow-y-auto rounded-xl border border-line bg-white p-4 text-left text-sm leading-6 text-ink shadow-xl whitespace-normal [overflow-wrap:anywhere]"
        (pointerenter)="enterPanel()"
        (pointerleave)="leavePanel()"
        ><ng-content select="[hoverCardContent]"
      /></span>
    }
  `,
})
export class HoverCardComponent implements OnDestroy {
  readonly cardId = input.required<string>();
  readonly label = input("Prévia");
  readonly open = signal(false);
  private readonly trigger = viewChild<ElementRef<HTMLElement>>("trigger");
  private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly coordinator = inject(HoverCardCoordinator);
  readonly nativePopover =
    typeof this.document.createElement("span").showPopover === "function";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private hovered = false;
  private panelHovered = false;
  private focused = false;
  private readonly closeActive = () => this.close();
  private readonly onScroll = (event: Event) => {
    const target = event.target as Node | null;
    if (target && this.panel()?.nativeElement.contains(target)) return;
    // A scroll event may arrive after pointerenter when the link enters the viewport.
    // Preserve a pending hover; an already-open preview still closes on scrolling.
    if (
      !this.open() &&
      this.timer !== null &&
      this.hovered &&
      this.trigger()?.nativeElement.matches(":hover")
    ) {
      this.scheduleOpen();
      return;
    }
    if (this.focused && this.open()) this.position();
    else this.close();
  };

  constructor() {
    this.document.addEventListener("scroll", this.onScroll, true);
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      const trigger = this.trigger()?.nativeElement;
      if (!this.open() || !panel || !trigger) return;
      // The top layer prevents clipping by publication containers. Unsupported
      // browsers retain the same fixed overlay and explicit dismissal behavior.
      if (this.nativePopover && !panel.matches(":popover-open"))
        panel.showPopover();
      this.position();
    });
  }
  private position() {
    const panel = this.panel()?.nativeElement;
    const trigger = this.trigger()?.nativeElement;
    if (!panel || !trigger) return;
    const viewport = this.document.defaultView;
    if (!viewport) return;
    const rects = Array.from(trigger.getClientRects()).filter(
      (rect) =>
        rect.bottom > 0 &&
        rect.top < viewport.innerHeight &&
        rect.right > 0 &&
        rect.left < viewport.innerWidth,
    );
    const anchor = rects[rects.length - 1];
    if (!anchor) {
      this.close();
      return;
    }
    panel.style.left = `${Math.max(12, Math.min(anchor.left, viewport.innerWidth - panel.offsetWidth - 12))}px`;
    const below = anchor.bottom + 8;
    const space = viewport.innerHeight - below - 12;
    // Prefer below the link; a tall preview can scroll. At the very bottom,
    // place it above instead of hiding its content outside the viewport.
    const above = space < 120 && anchor.top > space;
    const height = Math.max(80, above ? anchor.top - 20 : space);
    panel.style.maxHeight = `${height}px`;
    panel.style.top = `${above ? Math.max(12, anchor.top - panel.offsetHeight - 8) : below}px`;
  }
  private cancelTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
  private show() {
    this.cancelTimer();
    this.coordinator.claim(this.closeActive);
    this.open.set(true);
  }
  enterTrigger(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    this.hovered = true;
    this.scheduleOpen();
  }
  private scheduleOpen() {
    this.cancelTimer();
    this.timer = setTimeout(() => {
      if (this.hovered) this.show();
    }, 120);
  }
  leaveTrigger() {
    this.hovered = false;
    this.scheduleClose();
  }
  enterPanel() {
    this.panelHovered = true;
    this.cancelTimer();
  }
  leavePanel() {
    this.panelHovered = false;
    this.scheduleClose();
  }
  focusIn() {
    this.focused = true;
    this.show();
  }
  focusOut(event: FocusEvent) {
    if (
      event.relatedTarget &&
      this.host.nativeElement.contains(event.relatedTarget as Node)
    )
      return;
    this.focused = false;
    this.scheduleClose();
  }
  private scheduleClose() {
    this.cancelTimer();
    if (!this.hovered && !this.panelHovered && !this.focused)
      this.timer = setTimeout(() => this.close(), 180);
  }
  close() {
    this.cancelTimer();
    this.panelHovered = false;
    this.open.set(false);
    this.coordinator.release(this.closeActive);
  }
  @HostListener("document:keydown.escape") escape() {
    this.close();
  }
  @HostListener("document:pointerdown", ["$event"]) outside(
    event: PointerEvent,
  ) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
  @HostListener("window:resize") resize() {
    this.close();
  }
  ngOnDestroy() {
    this.close();
    this.document.removeEventListener("scroll", this.onScroll, true);
  }
}
