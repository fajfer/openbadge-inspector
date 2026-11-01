// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";
import { isoDateTime } from "../dates.ts";
import { badgeClassSchema } from "./badge-class.schema.ts";

export const OB2_CONTEXT = "https://w3id.org/openbadges/v2";

const typeOf = (name: string) =>
  z.union([z.literal(name), z.array(z.string()).refine((types) => types.includes(name), `Must include ${name}`)]);

export const recipientSchema = z.looseObject({
  type: z.string().min(1),
  identity: z.string().min(1),
  hashed: z.boolean(),
  salt: z.string().optional(),
});

export const verificationSchema = z.looseObject({
  type: z.enum(["hosted", "HostedBadge", "signed", "SignedBadge"]),
  creator: z.string().optional(),
});

export const assertionSchema = z.looseObject({
  "@context": z.union([z.string(), z.array(z.unknown())]).optional(),
  type: typeOf("Assertion"),
  id: z.string().min(1),
  recipient: recipientSchema,
  badge: z.union([z.url(), badgeClassSchema]),
  verification: verificationSchema,
  issuedOn: isoDateTime,
  expires: isoDateTime.optional(),
  revoked: z.boolean().optional(),
});
