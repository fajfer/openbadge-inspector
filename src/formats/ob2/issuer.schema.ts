// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { z } from "zod";

export const issuerSchema = z.looseObject({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().optional(),
  email: z.string().optional(),
  revocationList: z.string().optional(),
});
