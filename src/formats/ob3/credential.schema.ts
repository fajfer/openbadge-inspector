// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";
import { isoDateTime } from "../dates.ts";

export const VC_V1_CONTEXT = "https://www.w3.org/2018/credentials/v1";
export const VC_V2_CONTEXT = "https://www.w3.org/ns/credentials/v2";
export const OB3_CONTEXT_PREFIX = "https://purl.imsglobal.org/spec/ob/v3p0/context";

const imageSchema = z.union([z.string(), z.looseObject({ id: z.string() })]);

export const profileSchema = z.looseObject({
  id: z.string().min(1),
  type: z.union([z.string(), z.array(z.string())]),
  name: z.string().optional(),
  url: z.string().optional(),
});

export const achievementSchema = z.looseObject({
  id: z.string().min(1),
  type: z.union([z.string(), z.array(z.string())]),
  name: z.string().min(1),
  description: z.string(),
  criteria: z.looseObject({}),
  image: imageSchema.optional(),
});

export const identityObjectSchema = z.looseObject({
  type: z.literal("IdentityObject"),
  identityType: z.string(),
  identityHash: z.string(),
  hashed: z.boolean(),
});

export const proofSchema = z.looseObject({
  type: z.string(),
  cryptosuite: z.string().optional(),
  verificationMethod: z.string().optional(),
  proofPurpose: z.string().optional(),
  proofValue: z.string().optional(),
});

export const credentialSchema = z.looseObject({
  "@context": z
    .array(z.unknown())
    .min(2)
    .refine((contexts) => contexts[0] === VC_V1_CONTEXT || contexts[0] === VC_V2_CONTEXT, {
      message: "The first @context must be the VC context",
    })
    .refine((contexts) => contexts.some((context) => String(context).startsWith(OB3_CONTEXT_PREFIX)), {
      message: "Must include the Open Badges 3.0 context",
    }),
  id: z.string().optional(),
  type: z
    .array(z.string())
    .refine((types) => types.includes("VerifiableCredential"), "Must include VerifiableCredential")
    .refine(
      (types) => types.includes("OpenBadgeCredential") || types.includes("AchievementCredential"),
      "Must include OpenBadgeCredential",
    ),
  issuer: z.union([z.string(), profileSchema]),
  validFrom: isoDateTime.optional(),
  validUntil: isoDateTime.optional(),
  issuanceDate: isoDateTime.optional(),
  expirationDate: isoDateTime.optional(),
  credentialSubject: z.looseObject({
    achievement: achievementSchema,
    identifier: z.array(identityObjectSchema).optional(),
  }),
  credentialStatus: z.looseObject({ type: z.string() }).optional(),
  proof: z.union([proofSchema, z.array(proofSchema)]).optional(),
});
