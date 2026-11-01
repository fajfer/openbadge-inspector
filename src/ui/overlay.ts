// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import type { BadgeStatus } from "../registry/types.ts";
import type { Translate } from "../shared/i18n.ts";
import { type CardActions, type CardModel, renderCard } from "./card.ts";
import { element } from "./dom.ts";
import styles from "./overlay.css?raw";
import { type Box, cardPosition, markerPosition, type Viewport } from "./position.ts";
import { STATUS_APPEARANCE } from "./status.ts";

const TOAST_MS = 4000;
const MIN_TARGET_SIZE = 1;

export interface Overlay {
  setMarker(target: Element, status: BadgeStatus, onActivate: () => void): void;
  showCard(target: Element | undefined, model: CardModel, actions: CardActions): HTMLElement;
  closeCard(): void;
  cardTarget(): Element | undefined;
  showToast(text: string): void;
  destroy(): void;
}

interface Marker {
  readonly button: HTMLButtonElement;
}

export function createOverlay(doc: Document, t: Translate): Overlay {
  const host = doc.createElement("div");
  host.setAttribute("style", "all: initial; position: absolute; top: 0; left: 0; width: 0; height: 0;");
  const root = host.attachShadow({ mode: "closed" });
  const style = doc.createElement("style");
  style.textContent = styles;
  const layer = element("div", "layer");
  root.append(style, layer);
  doc.documentElement.append(host);

  const markers = new Map<Element, Marker>();
  let card: { element: HTMLElement; target: Element | undefined; restoreFocus: Element | null } | undefined;
  let toast: { element: HTMLElement; timer: ReturnType<typeof setTimeout> } | undefined;
  let frame: number | undefined;

  const viewport = (): Viewport => {
    const view = doc.defaultView;
    return {
      scrollX: view?.scrollX ?? 0,
      scrollY: view?.scrollY ?? 0,
      width: doc.documentElement.clientWidth,
      height: view?.innerHeight ?? doc.documentElement.clientHeight,
    };
  };

  const boxOf = (target: Element): Box | undefined => {
    if (!target.isConnected) {
      return undefined;
    }
    const rect = target.getBoundingClientRect();
    if (rect.width < MIN_TARGET_SIZE || rect.height < MIN_TARGET_SIZE) {
      return undefined;
    }
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  };

  const placeMarker = (target: Element, marker: Marker) => {
    const box = boxOf(target);
    marker.button.hidden = box === undefined;
    if (box !== undefined) {
      const position = markerPosition(box, viewport());
      marker.button.style.left = `${String(position.left)}px`;
      marker.button.style.top = `${String(position.top)}px`;
    }
  };

  const placeCard = () => {
    if (card === undefined) {
      return;
    }
    const current = viewport();
    const box = (card.target === undefined ? undefined : boxOf(card.target)) ?? {
      left: current.width,
      top: 0,
      width: 0,
      height: 0,
    };
    const size = { width: card.element.offsetWidth, height: card.element.offsetHeight };
    const position = cardPosition(box, size, current);
    card.element.style.left = `${String(position.left)}px`;
    card.element.style.top = `${String(position.top)}px`;
  };

  const repositionAll = () => {
    frame = undefined;
    for (const [target, marker] of markers) {
      placeMarker(target, marker);
    }
    placeCard();
  };

  const scheduleReposition = () => {
    if (frame === undefined) {
      frame = requestAnimationFrame(repositionAll);
    }
  };

  const closeCard = () => {
    if (card === undefined) {
      return;
    }
    const { element: cardElement, restoreFocus } = card;
    card = undefined;
    cardElement.remove();
    if (restoreFocus instanceof HTMLElement) {
      restoreFocus.focus({ preventScroll: true });
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && card !== undefined) {
      closeCard();
    }
  };

  const onPointerDown = (event: Event) => {
    if (card !== undefined && !event.composedPath().includes(host)) {
      closeCard();
    }
  };

  const view = doc.defaultView;
  view?.addEventListener("resize", scheduleReposition);
  doc.addEventListener("scroll", scheduleReposition, { capture: true, passive: true });
  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("mousedown", onPointerDown, true);

  return {
    setMarker(target, status, onActivate) {
      const appearance = STATUS_APPEARANCE[status];
      const existing = markers.get(target);
      const button = existing?.button ?? element("button", undefined);
      button.type = "button";
      button.className = `marker tone-${appearance.tone}`;
      button.textContent = appearance.symbol;
      const label = t("iconTitle", [t(appearance.label)]);
      button.title = label;
      button.setAttribute("aria-label", label);
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        onActivate();
      };
      if (existing === undefined) {
        const marker = { button };
        markers.set(target, marker);
        layer.append(button);
        placeMarker(target, marker);
      }
    },
    showCard(target, model, actions) {
      const previous = card;
      const restoreFocus = previous?.restoreFocus ?? doc.activeElement;
      previous?.element.remove();
      const cardElement = renderCard(model, { ...actions, onClose: closeCard }, t);
      card = { element: cardElement, target, restoreFocus };
      layer.append(cardElement);
      placeCard();
      if (previous === undefined) {
        cardElement.focus({ preventScroll: true });
      }
      return cardElement;
    },
    closeCard,
    cardTarget: () => card?.target,
    showToast(text) {
      if (toast !== undefined) {
        clearTimeout(toast.timer);
        toast.element.remove();
      }
      const toastElement = element("div", "toast", text);
      toastElement.setAttribute("role", "status");
      root.append(toastElement);
      toast = {
        element: toastElement,
        timer: setTimeout(() => {
          toastElement.remove();
          toast = undefined;
        }, TOAST_MS),
      };
    },
    destroy() {
      view?.removeEventListener("resize", scheduleReposition);
      doc.removeEventListener("scroll", scheduleReposition, { capture: true });
      doc.removeEventListener("keydown", onKeyDown, true);
      doc.removeEventListener("mousedown", onPointerDown, true);
      host.remove();
    },
  };
}
