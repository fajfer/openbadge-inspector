// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { JsonObject } from "../../src/shared/json.ts";
import {
  FIXTURE_EXPIRED,
  ob2Assertion,
  ob2SignedJws,
  ob3Credential,
  ob3VcJwt,
  OB2_ASSERTION_URL,
  signDataIntegrity,
} from "./credentials.ts";
import { galleryHtml } from "./gallery.ts";
import { itxtChunk, medalPng, medalSvg, type Palette, textChunk, ztxtChunk } from "./images.ts";
import { loadTestKeys } from "./keys.ts";

const ROOT = import.meta.dirname;

const GREEN: Palette = { ring: [27, 94, 32], fill: [67, 160, 71] };
const BLUE: Palette = { ring: [13, 71, 161], fill: [66, 133, 244] };
const ORANGE: Palette = { ring: [191, 54, 12], fill: [255, 138, 50] };
const RED: Palette = { ring: [136, 14, 79], fill: [229, 57, 53] };
const PURPLE: Palette = { ring: [74, 20, 140], fill: [142, 68, 173] };
const GREY: Palette = { ring: [66, 66, 66], fill: [158, 158, 158] };

async function write(path: string, content: Uint8Array | string): Promise<void> {
  const target = resolve(ROOT, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

function json(value: JsonObject): string {
  return JSON.stringify(value);
}

function bakedPng(palette: Palette, payload: string, compressed = false): Uint8Array {
  return medalPng(palette, [itxtChunk("openbadges", payload, compressed)]);
}

function svgCredential(payload: JsonObject): string {
  return `<openbadges:credential><![CDATA[${json(payload)}]]></openbadges:credential>`;
}

const keys = await loadTestKeys();
const rdfc = await signDataIntegrity(keys, ob3Credential(keys), "eddsa-rdfc-2022");
const jcs = await signDataIntegrity(keys, ob3Credential(keys), "eddsa-jcs-2022");
const expired = await signDataIntegrity(
  keys,
  ob3Credential(keys, { validFrom: "2024-01-15T10:00:00Z", validUntil: FIXTURE_EXPIRED }),
  "eddsa-rdfc-2022",
);
const revocable = await signDataIntegrity(
  keys,
  ob3Credential(keys, {
    credentialStatus: {
      id: "https://university.example/status/1#42",
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      statusListIndex: "42",
      statusListCredential: "https://university.example/status/1",
    },
  }),
  "eddsa-rdfc-2022",
);
const didWebMethod = "did:web:university.example#key-1";
const didWeb = await signDataIntegrity(
  keys,
  ob3Credential(keys, {
    issuer: { id: "did:web:university.example", type: ["Profile"], name: "Example University" },
  }),
  "eddsa-rdfc-2022",
  didWebMethod,
);
const tampered = { ...rdfc, name: "Open Badges Grandmaster" };

await write("png/ob3-rdfc.png", bakedPng(GREEN, json(rdfc)));
await write("png/ob3-rdfc-compressed.png", bakedPng(GREEN, json(rdfc), true));
await write("png/ob3-vcjwt.png", bakedPng(BLUE, await ob3VcJwt(keys)));
await write("png/ob3-revocable.png", bakedPng(GREEN, json(revocable)));
await write("png/ob3-didweb.png", bakedPng(PURPLE, json(didWeb)));
await write("png/ob3-expired.png", bakedPng(ORANGE, json(expired)));
await write("png/ob3-tampered.png", bakedPng(RED, json(tampered)));
await write("png/ob2-hosted.png", bakedPng(BLUE, json(ob2Assertion({ embedded: true, signed: false }))));
await write("png/ob2-hosted-url.png", bakedPng(BLUE, OB2_ASSERTION_URL));
await write("png/ob2-signed.png", bakedPng(PURPLE, await ob2SignedJws(keys)));
await write("png/malformed-json.png", bakedPng(RED, '{"@context": "https://w3id.org/openbadges/v2", "type": '));
await write(
  "png/ob2-ztxt-openbadge.png",
  medalPng(BLUE, [ztxtChunk("openbadge", json(ob2Assertion({ embedded: true, signed: false })))]),
);
await write("png/ob3-text-openbadges.png", medalPng(GREEN, [textChunk("openbadges", json(rdfc))]));
await write("png/ob1-text.png", medalPng(GREY, [textChunk("openbadges", OB2_ASSERTION_URL)]));
await write("png/plain.png", medalPng(GREY));
const corrupt = medalPng(GREY, [itxtChunk("openbadges", json(rdfc))]);
corrupt[40] = (corrupt[40] ?? 0) ^ 0xff;
await write("png/corrupt-crc.png", corrupt);

await write("svg/ob3-jcs.svg", medalSvg(GREEN, "OB 3.0", svgCredential(jcs)));
await write(
  "svg/ob3-with-script.svg",
  medalSvg(GREEN, "Script", svgCredential(rdfc), "<script>document.title = 'executed';</script>"),
);
await write(
  "svg/ob2-assertion.svg",
  medalSvg(
    BLUE,
    "OB 2.0",
    `<openbadges:assertion verify="${OB2_ASSERTION_URL}"><![CDATA[${json(
      ob2Assertion({ embedded: true, signed: false }),
    )}]]></openbadges:assertion>`,
  ),
);
await write(
  "svg/ob2-verify-url.svg",
  medalSvg(BLUE, "URL", `<openbadges:assertion verify="${OB2_ASSERTION_URL}"></openbadges:assertion>`),
);
await write("svg/plain.svg", medalSvg(GREY, "Plain"));

await write("online/ob2-key.pem", keys.rsaPublicPem);
await write("online/did-web.json", `${JSON.stringify(didWebDocument(keys.ed25519Public), null, 2)}\n`);

function didWebDocument(publicKey: JsonWebKey): JsonObject {
  return {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: "did:web:university.example",
    verificationMethod: [
      {
        id: didWebMethod,
        type: "JsonWebKey2020",
        controller: "did:web:university.example",
        publicKeyJwk: { kty: publicKey.kty ?? "OKP", crv: publicKey.crv ?? "Ed25519", x: publicKey.x ?? "" },
      },
    ],
    assertionMethod: [didWebMethod],
  };
}

await write("pages/gallery.html", galleryHtml());

process.stdout.write(`Fixtures written to ${ROOT}\n`);
