// SPDX-FileCopyrightText: 2026 Damian Fajfer <damian@fajfer.org>
//
// SPDX-License-Identifier: EUPL-1.2

export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export const MAX_JSON_DEPTH = 64;

export function parseJson(text: string): JsonValue | undefined {
  try {
    const value = JSON.parse(text) as JsonValue;
    return depthOf(value) <= MAX_JSON_DEPTH ? value : undefined;
  } catch {
    return undefined;
  }
}

export function parseJsonObject(text: string): JsonObject | undefined {
  const value = parseJson(text);
  return isJsonObject(value) ? value : undefined;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(source: JsonValue | undefined, key: string): string | undefined {
  if (!isJsonObject(source)) {
    return undefined;
  }
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function readObject(source: JsonValue | undefined, key: string): JsonObject | undefined {
  if (!isJsonObject(source)) {
    return undefined;
  }
  const value = source[key];
  return isJsonObject(value) ? value : undefined;
}

export function readStringOrId(source: JsonValue | undefined, key: string): string | undefined {
  return readString(source, key) ?? readString(readObject(source, key), "id");
}

export function asArray(value: JsonValue | undefined): JsonValue[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function typeIncludes(source: JsonValue | undefined, typeName: string): boolean {
  if (!isJsonObject(source)) {
    return false;
  }
  return asArray(source.type).includes(typeName);
}

function depthOf(value: JsonValue): number {
  let maxDepth = 0;
  const stack: { value: JsonValue; depth: number }[] = [{ value, depth: 1 }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      break;
    }
    maxDepth = Math.max(maxDepth, current.depth);
    if (maxDepth > MAX_JSON_DEPTH) {
      return maxDepth;
    }
    const children = Array.isArray(current.value)
      ? current.value
      : isJsonObject(current.value)
        ? Object.values(current.value)
        : [];
    for (const child of children) {
      stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return maxDepth;
}
