import { Router } from "express";

import { getCheckoutConfigHandler } from "../controllers/checkout.controller.js";

export const checkoutRouter = Router();

checkoutRouter.get("/config", getCheckoutConfigHandler);
