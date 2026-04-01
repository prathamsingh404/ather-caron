import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "ac_session";

type SessionPayload = {
  uid: string;
};

function shouldUseSecureCookies() {
  const explicit = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  if (process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL)) {
    return true;
  }

  const appUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return appUrl.startsWith("https://");
  }

  return false;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SessionPayload;
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken({ uid: userId });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 0,
  });
}

export async function getUserIdFromRequestCookies() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const session = await verifySessionToken(token);
    return session.uid;
  } catch {
    return null;
  }
}

export async function requireUserId() {
  const userId = await getUserIdFromRequestCookies();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}
