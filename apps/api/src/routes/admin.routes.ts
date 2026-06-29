import { Router } from "express";

import { getDashboardHandler } from "../controllers/dashboard.controller.js";
import {
  createAdminCategoryHandler,
  deactivateAdminCategoryHandler,
  listAdminCategoriesHandler,
  updateAdminCategoryHandler,
} from "../controllers/admin/categories.controller.js";
import {
  createAdminProductHandler,
  deactivateAdminProductHandler,
  listAdminProductsHandler,
  updateAdminProductHandler,
} from "../controllers/admin/products.controller.js";
import {
  getAdminLeadHandler,
  listAdminLeadsHandler,
  updateAdminLeadHandler,
} from "../controllers/admin/leads.controller.js";
import {
  createAdminUserHandler,
  deactivateAdminUserHandler,
  listAdminUsersHandler,
  updateAdminUserHandler,
} from "../controllers/admin/admins.controller.js";
import { getUploadSignatureHandler } from "../controllers/admin/uploads.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const adminRouter = Router();

const premiumOnly = [requireAuth, requireRole(["premium"])] as const;

adminRouter.get(
  "/dashboard",
  requireAuth,
  requireRole(["general", "premium"]),
  getDashboardHandler,
);

adminRouter.get("/products", ...premiumOnly, listAdminProductsHandler);
adminRouter.post(
  "/products",
  ...premiumOnly,
  requireCsrfHeader,
  createAdminProductHandler,
);
adminRouter.patch(
  "/products/:id",
  ...premiumOnly,
  requireCsrfHeader,
  updateAdminProductHandler,
);
adminRouter.patch(
  "/products/:id/deactivate",
  ...premiumOnly,
  requireCsrfHeader,
  deactivateAdminProductHandler,
);

adminRouter.get("/categories", ...premiumOnly, listAdminCategoriesHandler);
adminRouter.post(
  "/categories",
  ...premiumOnly,
  requireCsrfHeader,
  createAdminCategoryHandler,
);
adminRouter.patch(
  "/categories/:id",
  ...premiumOnly,
  requireCsrfHeader,
  updateAdminCategoryHandler,
);
adminRouter.patch(
  "/categories/:id/deactivate",
  ...premiumOnly,
  requireCsrfHeader,
  deactivateAdminCategoryHandler,
);

adminRouter.get("/leads", ...premiumOnly, listAdminLeadsHandler);
adminRouter.get("/leads/:id", ...premiumOnly, getAdminLeadHandler);
adminRouter.patch(
  "/leads/:id",
  ...premiumOnly,
  requireCsrfHeader,
  updateAdminLeadHandler,
);

adminRouter.get("/admins", ...premiumOnly, listAdminUsersHandler);
adminRouter.post(
  "/admins",
  ...premiumOnly,
  requireCsrfHeader,
  createAdminUserHandler,
);
adminRouter.patch(
  "/admins/:id",
  ...premiumOnly,
  requireCsrfHeader,
  updateAdminUserHandler,
);
adminRouter.patch(
  "/admins/:id/deactivate",
  ...premiumOnly,
  requireCsrfHeader,
  deactivateAdminUserHandler,
);

adminRouter.get(
  "/uploads/signature",
  ...premiumOnly,
  getUploadSignatureHandler,
);
