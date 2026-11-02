// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, it, vi } from "vitest";
import { fakeHttp } from "../../../tests/fixtures/fake-http.ts";
import { createHttpClient, MAX_RESPONSE_BYTES, trackBlockedOrigins } from "./http.ts";

function respond(body: string, url = "https://issuer.example/a.json", status = 200): Response {
  const response = new Response(body, { status });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

describe("createHttpClient", () => {
  it("refuses plain http without fetching", async () => {
    const fetchSpy = vi.fn<typeof fetch>();
    const client = createHttpClient(fetchSpy);
    expect(await client.getJson("http://issuer.example/a.json")).toEqual({ status: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends no credentials and parses JSON", async () => {
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(respond('{"id":"x"}'));
    const result = await createHttpClient(fetchSpy).getJson("https://issuer.example/a.json");
    expect(result).toEqual({ status: 200, json: { id: "x" } });
    expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ credentials: "omit" });
  });

  it("rejects a redirect to plain http", async () => {
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(respond("{}", "http://issuer.example/a.json"));
    expect(await createHttpClient(fetchSpy).getJson("https://issuer.example/a.json")).toEqual({ status: 0 });
  });

  it("drops oversized bodies", async () => {
    const fetchSpy = vi.fn<typeof fetch>().mockResolvedValue(respond(" ".repeat(MAX_RESPONSE_BYTES + 1)));
    expect(await createHttpClient(fetchSpy).getJson("https://issuer.example/a.json")).toEqual({ status: 200 });
  });

  it("maps network errors to status 0", async () => {
    const fetchSpy = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("offline"));
    expect(await createHttpClient(fetchSpy).getJson("https://issuer.example/a.json")).toEqual({ status: 0 });
  });
});

describe("trackBlockedOrigins", () => {
  it("records origins whose requests failed without permission", async () => {
    const client = trackBlockedOrigins(
      fakeHttp({
        "https://blocked.example/a.json": { status: 0 },
        "https://down.example/a.json": { status: 0 },
        "https://fine.example/a.json": { status: 200, json: {} },
      }),
      (origin) => Promise.resolve(origin === "https://blocked.example"),
    );
    await client.getJson("https://blocked.example/a.json");
    await client.getJson("https://blocked.example/a.json");
    await client.getJson("https://down.example/a.json");
    await client.getJson("https://fine.example/a.json");
    expect(client.blockedOrigins()).toEqual(["https://blocked.example"]);
  });
});
