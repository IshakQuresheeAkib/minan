import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import {
  CUSTOMER_ACCESS_TOKEN_COOKIE,
  CUSTOMER_REFRESH_TOKEN_COOKIE,
  getClearCustomerAuthCookieOptions,
  getCustomerAccessCookieOptions,
  getCustomerRefreshCookieOptions,
} from "../config/customerAuth.js";
import {
  customerLoginSchema,
  customerSignupSchema,
} from "../schemas/customerAuth.schemas.js";
import {
  CustomerAuthError,
  getCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  rotateCustomerTokens,
  signupCustomer,
  type CustomerAuthSession,
  type SafeCustomer,
} from "../services/customerAuth.service.js";

function setCustomerAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    accessToken,
    getCustomerAccessCookieOptions(),
  );
  res.cookie(
    CUSTOMER_REFRESH_TOKEN_COOKIE,
    refreshToken,
    getCustomerRefreshCookieOptions(),
  );
}

function clearCustomerAuthCookies(res: Response): void {
  const options = getClearCustomerAuthCookieOptions();
  res.clearCookie(CUSTOMER_ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(CUSTOMER_REFRESH_TOKEN_COOKIE, options);
}

function allowlistCustomer(customer: SafeCustomer): SafeCustomer {
  return {
    id: customer.id,
    email: customer.email,
    is_active: customer.is_active,
  };
}

function authResponse(session: CustomerAuthSession) {
  return {
    customer: allowlistCustomer(session.customer),
    accessToken: session.accessToken,
  };
}

function handleCustomerAuthError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (error instanceof CustomerAuthError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  next(error);
}

export async function customerSignupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = customerSignupSchema.parse(req.body);
    const session = await signupCustomer(input.email, input.password);
    setCustomerAuthCookies(res, session.accessToken, session.refreshToken);
    res.status(201).json(authResponse(session));
  } catch (error) {
    handleCustomerAuthError(error, res, next);
  }
}

export async function customerLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = customerLoginSchema.parse(req.body);
    const session = await loginCustomer(input.email, input.password);
    setCustomerAuthCookies(res, session.accessToken, session.refreshToken);
    res.status(200).json(authResponse(session));
  } catch (error) {
    handleCustomerAuthError(error, res, next);
  }
}

export async function customerRefreshHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies[CUSTOMER_REFRESH_TOKEN_COOKIE];
    if (typeof refreshToken !== "string" || !refreshToken) {
      throw new CustomerAuthError("Invalid session");
    }
    const session = await rotateCustomerTokens(refreshToken);
    setCustomerAuthCookies(res, session.accessToken, session.refreshToken);
    res.json(authResponse(session));
  } catch (error) {
    handleCustomerAuthError(error, res, next);
  }
}

export async function customerLogoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies[CUSTOMER_REFRESH_TOKEN_COOKIE];
    await logoutCustomer(
      typeof refreshToken === "string" ? refreshToken : undefined,
    );
    clearCustomerAuthCookies(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function customerMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.customer) {
      throw new CustomerAuthError("Unauthorized");
    }
    const customer = await getCurrentCustomer(req.customer.id);
    res.json({ customer: allowlistCustomer(customer) });
  } catch (error) {
    handleCustomerAuthError(error, res, next);
  }
}
