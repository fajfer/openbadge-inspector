// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

const DEBOUNCE_MS = 500;

export function observeNewImages(doc: Document, onChange: () => Promise<void>): MutationObserver {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void onChange();
    }, DEBOUNCE_MS);
  });
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset", "data"],
  });
  return observer;
}
