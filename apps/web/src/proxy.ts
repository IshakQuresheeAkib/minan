import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const loginPath = "/admin/login";
const dashboardPath = "/admin";

function isAdminPayload(payload: Record<string, unknown>) {
  return typeof payload.id === "string" && typeof payload.email === "string";
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function redirectToDashboard(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = dashboardPath;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const secret = process.env.JWT_ACCESS_SECRET;

  if (pathname === loginPath) {
    if (!token || !secret) {
      return NextResponse.next();
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
      );
      if (isAdminPayload(payload)) {
        return redirectToDashboard(request);
      }
    } catch {
      // Invalid or expired token — show login page
    }

    return NextResponse.next();
  }

  if (!secret) {
    return redirectToLogin(request);
  }

  if (!token && refreshToken) {
    return NextResponse.next();
  }

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    if (!isAdminPayload(payload)) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  } catch {
    if (refreshToken) {
      return NextResponse.next();
    }

    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
