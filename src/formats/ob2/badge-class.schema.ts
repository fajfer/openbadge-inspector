// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";
import { issuerSchema } from "./issuer.schema.ts";

export const badgeClassSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  image: z.union([z.string(), z.looseObject({ id: z.string() })]),
  criteria: z.union([z.string(), z.looseObject({})]),
  issuer: z.union([z.url(), issuerSchema]),
});
