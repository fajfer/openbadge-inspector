// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { translate as t, type MessageKey } from "../shared/i18n.ts";
import type { Settings } from "./settings.schema.ts";
import { ALL_URLS, getSettings, updateSettings } from "./store.ts";
import styles from "./options.css?raw";

interface OptionDefinition {
  readonly key: keyof Settings;
  readonly label: MessageKey;
  readonly help: MessageKey;
  readonly needsAllUrls: boolean;
}

const OPTIONS: readonly OptionDefinition[] = [
  { key: "autoScan", label: "optionAutoScan", help: "optionAutoScanHelp", needsAllUrls: true },
  { key: "onlineVerification", label: "optionOnline", help: "optionOnlineHelp", needsAllUrls: true },
  { key: "showNotBakedMarkers", label: "optionNotBakedIcons", help: "optionNotBakedIconsHelp", needsAllUrls: false },
];

function renderOption(option: OptionDefinition, settings: Settings): HTMLElement {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = option.key;
  input.name = option.key;
  input.checked = settings[option.key];
  const label = document.createElement("label");
  label.htmlFor = option.key;
  label.textContent = t(option.label);
  const help = document.createElement("p");
  help.className = "help";
  help.id = `${option.key}-help`;
  help.textContent = t(option.help);
  input.setAttribute("aria-describedby", help.id);
  const error = document.createElement("p");
  error.className = "error";
  error.hidden = true;
  error.setAttribute("role", "alert");
  input.addEventListener("change", () => {
    error.hidden = true;
    const enabling = input.checked && option.needsAllUrls;
    const permission = enabling ? browser.permissions.request({ origins: [ALL_URLS] }) : Promise.resolve(true);
    void permission.then(async (granted) => {
      if (!granted) {
        input.checked = false;
        error.textContent = t("optionPermissionDenied");
        error.hidden = false;
        return;
      }
      await updateSettings({ [option.key]: input.checked });
    });
  });
  const row = document.createElement("div");
  row.className = "option";
  const control = document.createElement("div");
  control.className = "control";
  control.append(input, label);
  row.append(control, help, error);
  return row;
}

async function main(): Promise<void> {
  document.title = t("optionsTitle");
  const style = document.createElement("style");
  style.textContent = styles;
  document.head.append(style);
  const settings = await getSettings();
  const form = document.createElement("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  form.append(...OPTIONS.map((option) => renderOption(option, settings)));
  const privacy = document.createElement("p");
  privacy.className = "privacy";
  privacy.textContent = t("optionsPrivacy");
  document.body.append(form, privacy);
}

void main();
