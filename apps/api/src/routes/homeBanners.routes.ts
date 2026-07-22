import { Router } from "express";

import { listHomeBannersHandler } from "../controllers/homeBanners.controller.js";

export const homeBannersRouter = Router();

homeBannersRouter.get("/", listHomeBannersHandler);
