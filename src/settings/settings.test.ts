// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it } from "vitest";
import { parseSettings } from "./settings.schema.ts";

describe("parseSettings", () => {
  it("uses defaults for empty storage", () => {
    expect(parseSettings({})).toEqual({ autoScan: false, onlineVerification: false, showNotBakedMarkers: true });
    expect(parseSettings(undefined)).toEqual(parseSettings({}));
  });

  it("falls back per key when a stored value is invalid", () => {
    expect(parseSettings({ autoScan: "yes", onlineVerification: true, showNotBakedMarkers: 0 })).toEqual({
      autoScan: false,
      onlineVerification: true,
      showNotBakedMarkers: true,
    });
  });
});
