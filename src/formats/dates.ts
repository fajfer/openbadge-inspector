// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";

export const isoDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Not a valid ISO 8601 date",
});

export function normaliseDate(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}
