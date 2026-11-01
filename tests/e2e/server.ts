// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, resolve, sep } from "node:path";

const FIXTURES = resolve(import.meta.dirname, "../fixtures");
const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

export interface FixtureServer {
  readonly url: string;
  readonly requests: string[];
  close(): Promise<void>;
}

export function serveFixtures(host: string, port: number): Promise<FixtureServer> {
  const requests: string[] = [];
  const server: Server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? "/", "http://x").pathname);
    requests.push(path);
    const file = resolve(FIXTURES, `.${path}`);
    if (!file.startsWith(FIXTURES + sep) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  return new Promise((resolvePromise) => {
    server.listen(port, host, () => {
      resolvePromise({
        url: `http://${host}:${String(port)}`,
        requests,
        close: () =>
          new Promise((done) => {
            server.close(() => {
              done();
            });
          }),
      });
    });
  });
}
