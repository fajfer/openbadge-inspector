// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface Viewport {
  readonly scrollX: number;
  readonly scrollY: number;
  readonly width: number;
  readonly height: number;
}

const GAP = 8;
const MARGIN = 12;
export const MARKER_SIZE = 24;
const MARKER_INSET = 4;

export function markerPosition(target: Box, viewport: Viewport): { left: number; top: number } {
  return {
    left: target.left + viewport.scrollX + Math.max(target.width - MARKER_SIZE - MARKER_INSET, 0),
    top: target.top + viewport.scrollY + Math.min(MARKER_INSET, Math.max(target.height - MARKER_SIZE, 0)),
  };
}

export function cardPosition(
  target: Box,
  card: { width: number; height: number },
  viewport: Viewport,
): { left: number; top: number } {
  const spaceRight = viewport.width - (target.left + target.width);
  const spaceLeft = target.left;
  let left: number;
  if (spaceRight >= card.width + GAP + MARGIN) {
    left = target.left + target.width + GAP;
  } else if (spaceLeft >= card.width + GAP + MARGIN) {
    left = target.left - card.width - GAP;
  } else {
    left = target.left + target.width / 2 - card.width / 2;
  }
  const top = target.top;
  const clampedLeft = clamp(left, MARGIN, viewport.width - card.width - MARGIN);
  const clampedTop = clamp(top, MARGIN, viewport.height - card.height - MARGIN);
  return { left: clampedLeft + viewport.scrollX, top: clampedTop + viewport.scrollY };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
