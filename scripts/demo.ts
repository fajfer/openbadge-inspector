// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { spawn } from "node:child_process";
import { IMAGE_HOST, IMAGE_PORT, PAGE_HOST, PAGE_PORT } from "../tests/fixtures/gallery.ts";
import { serveFixtures } from "../tests/e2e/server.ts";

const pages = await serveFixtures(PAGE_HOST, PAGE_PORT);
const images = await serveFixtures(IMAGE_HOST, IMAGE_PORT);
const startUrl = `${pages.url}/pages/gallery.html`;
process.stdout.write(`Serving the test gallery at ${startUrl}\n`);
const firefox = spawn("npx", ["web-ext", "run", "-s", "dist", "--start-url", startUrl], { stdio: "inherit" });
firefox.on("exit", () => {
  void Promise.all([pages.close(), images.close()]).then(() => process.exit(0));
});
