// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";

export const settingsSchema = z.object({
  autoScan: z.boolean().catch(false),
  onlineVerification: z.boolean().catch(false),
  showNotBakedMarkers: z.boolean().catch(true),
});

export type Settings = z.infer<typeof settingsSchema>;

export const SETTINGS_KEYS = Object.keys(settingsSchema.shape) as (keyof Settings)[];

export function parseSettings(stored: unknown): Settings {
  const source = typeof stored === "object" && stored !== null ? stored : {};
  return settingsSchema.parse(source);
}
