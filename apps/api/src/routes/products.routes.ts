import { Router } from "express";

import {
  getHomeCatalogHandler,
  getProductFilterOptionsHandler,
  getProductBySlugHandler,
  listProductsHandler,
  quoteProductsHandler,
} from "../controllers/products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProductsHandler);
productsRouter.get("/home", getHomeCatalogHandler);
productsRouter.get("/filters", getProductFilterOptionsHandler);
productsRouter.post("/quote", quoteProductsHandler);
productsRouter.get("/:slug", getProductBySlugHandler);
