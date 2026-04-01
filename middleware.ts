import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "ac_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest) {
  const secret = getSecret();
  if (!secret) return false;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const authed = await hasValidSession(req);

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("auth", "signin");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

