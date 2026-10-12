import { ElementRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HoverCardComponent } from "./hover-card.component";

afterEach(() => {
  TestBed.resetTestingModule();
  vi.useRealTimers();
});
describe("HoverCardComponent", () => {
  it("rearma o hover pendente após scroll atrasado e fecha uma prévia já aberta", () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HoverCardComponent);
    const card = fixture.componentInstance;
    Object.assign(card, { cardId: signal("preview") });
    const trigger = document.createElement("span");
    vi.spyOn(trigger, "matches").mockReturnValue(true);
    Object.defineProperty(card, "trigger", {
      value: signal(new ElementRef(trigger)),
    });
    card.enterTrigger({ pointerType: "mouse" } as PointerEvent);
    vi.advanceTimersByTime(100);
    document.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(100);
    expect(card.open()).toBe(false);
    vi.advanceTimersByTime(20);
    expect(card.open()).toBe(true);
    document.dispatchEvent(new Event("scroll"));
    expect(card.open()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(card.open()).toBe(false);
  });
  it("permite atravessar o espaço entre link e card e fecha ao sair de ambos", () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HoverCardComponent);
    const card = fixture.componentInstance;
    Object.assign(card, { cardId: signal("preview") });
    card.enterTrigger({ pointerType: "mouse" } as PointerEvent);
    vi.advanceTimersByTime(120);
    expect(card.open()).toBe(true);
    card.leaveTrigger();
    vi.advanceTimersByTime(100);
    card.enterPanel();
    vi.advanceTimersByTime(300);
    expect(card.open()).toBe(true);
    card.leavePanel();
    vi.advanceTimersByTime(180);
    expect(card.open()).toBe(false);
  });
  it("mantém a prévia no foco, permite Escape e mostra somente um card", () => {
    vi.useFakeTimers();
    const first = TestBed.createComponent(HoverCardComponent).componentInstance;
    const second =
      TestBed.createComponent(HoverCardComponent).componentInstance;
    Object.assign(first, { cardId: signal("first") });
    Object.assign(second, { cardId: signal("second") });
    first.focusIn();
    first.leaveTrigger();
    vi.advanceTimersByTime(300);
    expect(first.open()).toBe(true);
    second.focusIn();
    expect(first.open()).toBe(false);
    expect(second.open()).toBe(true);
    second.escape();
    expect(second.open()).toBe(false);
  });
  it("não abre com hover sintetizado pelo toque e limpa aberturas pendentes", () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HoverCardComponent);
    const card = fixture.componentInstance;
    card.enterTrigger({ pointerType: "touch" } as PointerEvent);
    vi.advanceTimersByTime(300);
    expect(card.open()).toBe(false);
    card.enterTrigger({ pointerType: "mouse" } as PointerEvent);
    fixture.destroy();
    vi.advanceTimersByTime(300);
    expect(card.open()).toBe(false);
  });
});
