// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";

export const inspectSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("url"), url: z.string().min(1).max(2_000_000) }),
  z.object({ kind: z.literal("inline"), mime: z.string().max(100), base64: z.string().max(14_000_000) }),
]);

export type InspectSource = z.infer<typeof inspectSourceSchema>;

const statusSchema = z.enum(["verified", "unverified", "expired", "invalid", "not-baked", "unreadable"]);

export const backgroundRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("inspect"), source: inspectSourceSchema, online: z.boolean() }),
  z.object({
    type: z.literal("report"),
    images: z.array(z.object({ source: z.string().max(2048), status: statusSchema })).max(5000),
  }),
  z.object({ type: z.literal("card-shown"), status: statusSchema, text: z.string().max(10_000) }),
  z.object({ type: z.literal("open-options") }),
  z.object({ type: z.literal("scan-tab"), tabId: z.number().int() }),
  z.object({
    type: z.literal("inspect-in-tab"),
    tabId: z.number().int(),
    srcUrl: z.string(),
    online: z.boolean().optional(),
  }),
  z.object({ type: z.literal("get-tab-report"), tabId: z.number().int() }),
]);

export type BackgroundRequest = z.infer<typeof backgroundRequestSchema>;

export const contentRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scan-page") }),
  z.object({
    type: z.literal("inspect-image"),
    targetElementId: z.number().int().optional(),
    srcUrl: z.string().optional(),
    online: z.boolean().optional(),
  }),
]);

export type ContentRequest = z.infer<typeof contentRequestSchema>;

export interface TabReport {
  readonly images: readonly { source: string; status: z.infer<typeof statusSchema> }[];
  readonly card?: { status: z.infer<typeof statusSchema>; text: string };
}
