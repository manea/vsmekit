function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function canonicalizeDossierPayload(payload: unknown): string {
  return JSON.stringify(sortKeysDeep(payload));
}

export async function computePayloadDigest(canonicalText: string): Promise<string> {
  const data = new TextEncoder().encode(canonicalText);
  const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digestBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeDossierSha256(payload: unknown): Promise<string> {
  return computePayloadDigest(canonicalizeDossierPayload(payload));
}
