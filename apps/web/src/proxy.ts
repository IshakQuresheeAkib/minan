import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type AdminRole = "general" | "premium";

const loginPath = "/admin/login";
const dashboardPath = "/admin";
const premiumOnlyPaths = ["/admin/products", "/admin/categories", "/admin/leads", "/admin/admins"] as const;

function isAdminRole(value: unknown): value is AdminRole {
  return value === "general" || value === "premium";
}

function isPremiumOnlyPath(pathname: string) {
  return premiumOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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

  if (pathname === loginPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!token || !secret) {
    return redirectToLogin(request);
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
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
    return redirectToLogin(request);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
