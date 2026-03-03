import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const GETBOTS_SESSION_COOKIE = 'getbots_studio_session';
const HANDOFF_VERSION = 1;

export type GetBotsHandoffPayload = {
  v: number;
  userId: string;
  appId: string;
  appName: string;
  prompt: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const parts = header.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey || rest.length === 0) continue;
    if (rawKey === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

function serializeCookie(name: string, value: string, maxAgeSec: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

function parseSignedToken(token: string, secret: string): GetBotsHandoffPayload | null {
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = sign(encoded, secret);
  if (!timingSafeEqualHex(sig, expected)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as GetBotsHandoffPayload;
    if (payload.v !== HANDOFF_VERSION) return null;
    if (!payload.expiresAt || Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyGetBotsHandoffToken(token: string, secret: string): GetBotsHandoffPayload | null {
  return parseSignedToken(token, secret);
}

export function createGetBotsSessionToken(input: {
  userId: string;
  appId: string;
  appName: string;
  prompt: string;
  ttlSec: number;
  secret: string;
}): string {
  const now = Date.now();
  const payload: GetBotsHandoffPayload = {
    v: HANDOFF_VERSION,
    userId: input.userId,
    appId: input.appId,
    appName: input.appName,
    prompt: input.prompt,
    issuedAt: now,
    expiresAt: now + input.ttlSec * 1000,
    nonce: randomBytes(12).toString('hex'),
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const sig = sign(encoded, input.secret);
  return `${encoded}.${sig}`;
}

export function createGetBotsSessionCookie(token: string, maxAgeSec: number): string {
  return serializeCookie(GETBOTS_SESSION_COOKIE, token, maxAgeSec);
}

export function clearGetBotsSessionCookie(): string {
  return serializeCookie(GETBOTS_SESSION_COOKIE, '', 0);
}

export function readGetBotsSessionTokenFromRequest(request: Request): string | null {
  return parseCookie(request.headers.get('Cookie'), GETBOTS_SESSION_COOKIE);
}

export function readGetBotsSessionFromRequest(
  request: Request,
  secret: string,
): { token: string; payload: GetBotsHandoffPayload } | null {
  if (!secret) return null;
  const token = readGetBotsSessionTokenFromRequest(request);
  if (!token) return null;
  const payload = parseSignedToken(token, secret);
  if (!payload) return null;
  return { token, payload };
}

