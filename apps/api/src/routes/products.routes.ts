import { Router } from "express";

import {
  getProductFilterOptionsHandler,
  getProductBySlugHandler,
  listProductsHandler,
} from "../controllers/products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProductsHandler);
productsRouter.get("/filters", getProductFilterOptionsHandler);
productsRouter.get("/:slug", getProductBySlugHandler);
