import crypto from "crypto";

export interface UserPayload {
  sub: string;
  role: string;
  username: string;
  exp?: number;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error("CRITICAL_SECURITY_ERROR: JWT_SECRET environment variable is missing. Set JWT_SECRET in your environment configuration.");
  }
  return secret.trim();
}

export function createToken(payload: { sub: string; role: string; username: string }): string {
  const secret = getJwtSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
  const fullPayload: UserPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): UserPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim().length === 0) {
      // Safe failure: cannot verify without secret
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", secret.trim())
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as UserPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match) {
    return match[1].trim();
  }
  if (authHeader.split(".").length === 3) {
    return authHeader.trim();
  }
  return null;
}
