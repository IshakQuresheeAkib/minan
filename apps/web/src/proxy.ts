import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type AdminRole = "general" | "premium";

const loginPath = "/admin/login";
const dashboardPath = "/admin";
const premiumOnlyPaths = [
  "/admin/products",
  "/admin/categories",
  "/admin/leads",
  "/admin/admins",
] as const;

function isAdminRole(value: unknown): value is AdminRole {
  return value === "general" || value === "premium";
}

function isPremiumOnlyPath(pathname: string) {
  return premiumOnlyPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
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
      if (isAdminRole(payload.role)) {
        return redirectToDashboard(request);
      }
    } catch {
      // Invalid or expired token — show login page
    }

    return NextResponse.next();
  }

  if ((!token || !secret) && refreshToken) {
    return NextResponse.next();
  }

  if (!token || !secret) {
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const role = payload.role;

    if (!isAdminRole(role)) {
      return redirectToLogin(request);
    }

    if (isPremiumOnlyPath(pathname) && role !== "premium") {
      return redirectToDashboard(request);
    }

    const response = NextResponse.next();
    response.headers.set("x-minan-admin-role", role);
    return response;
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
