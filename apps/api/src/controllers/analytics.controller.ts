import type { NextFunction, Request, Response } from "express";

import { getAttributionIp } from "../lib/clientIp.js";
import { parseBody } from "../lib/parseBody.js";
import {
  analyticsEventSchema,
  whatsappClickSchema,
} from "../schemas/analytics.schemas.js";
import {
  logAnalyticsEvent,
  logWhatsappClick,
} from "../services/analytics.service.js";

function getEventSourceUrl(req: Request): string | undefined {
  const origin = req.get("origin");
  const referer = req.get("referer");

  return referer ?? origin;
}

export async function createAnalyticsEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(analyticsEventSchema, req.body);

    await logAnalyticsEvent(input, {
      clientUserAgent: req.get("user-agent"),
      clientIpAddress: getAttributionIp(req),
      eventSourceUrl: getEventSourceUrl(req),
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function createWhatsappClickHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = parseBody(whatsappClickSchema, req.body);

    await logWhatsappClick(input, {
      clientUserAgent: req.get("user-agent"),
      clientIpAddress: getAttributionIp(req),
      eventSourceUrl: getEventSourceUrl(req),
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
}
