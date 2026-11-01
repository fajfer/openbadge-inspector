// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

export type MessageKey = keyof typeof import("../../_locales/en/messages.json");

export type Translate = (key: MessageKey, substitutions?: readonly string[]) => string;

export const translate: Translate = (key, substitutions) =>
  browser.i18n.getMessage(key, substitutions === undefined ? undefined : [...substitutions]);

export function formatDate(iso: string | undefined): string | undefined {
  if (iso === undefined) {
    return undefined;
  }
  const time = Date.parse(iso);
  if (Number.isNaN(time)) {
    return undefined;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(time));
}
