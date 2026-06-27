import { Router } from "express";

import {
  getProductBySlugHandler,
  listProductsHandler,
} from "../controllers/products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProductsHandler);
productsRouter.get("/:slug", getProductBySlugHandler);
