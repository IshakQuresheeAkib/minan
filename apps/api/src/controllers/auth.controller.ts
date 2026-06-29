import type { NextFunction, Request, Response } from "express";

import {
  ACCESS_TOKEN_COOKIE,
  getAccessTokenCookieOptions,
  getClearAuthCookieOptions,
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "../config/auth.js";
import {
  AuthError,
  loginAdmin,
  logoutAdmin,
  rotateTokens,
} from "../services/auth.service.js";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

function parseLoginBody(body: LoginBody): { email: string; password: string } {
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    throw new AuthError("Email and password are required", 400);
  }

  const email = body.email.trim();
  const password = body.password;

  if (!email || !password) {
    throw new AuthError("Email and password are required", 400);
  }

  return { email, password };
}

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());
  res.cookie(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );
}

function clearAuthCookies(res: Response): void {
  const options = getClearAuthCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = parseLoginBody(req.body as LoginBody);
    const session = await loginAdmin(email, password);

    setAuthCookies(res, session.accessToken, session.refreshToken);
    res.json({
      accessToken: session.accessToken,
      role: session.payload.role,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (typeof refreshToken !== "string" || !refreshToken) {
      res.status(401).json({ error: "Refresh token missing" });
      return;
    }

    const session = await rotateTokens(refreshToken);
    setAuthCookies(res, session.accessToken, session.refreshToken);
    res.json({
      accessToken: session.accessToken,
      role: session.payload.role,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    await logoutAdmin(
      typeof refreshToken === "string" ? refreshToken : undefined,
    );
    clearAuthCookies(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
