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
import {
  deleteUploadsHandler,
  getUploadSignatureHandler,
} from "../controllers/admin/uploads.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const adminRouter = Router();

adminRouter.get("/dashboard", requireAuth, getDashboardHandler);

adminRouter.get("/products", requireAuth, listAdminProductsHandler);
adminRouter.post(
  "/products",
  requireAuth,
  requireCsrfHeader,
  createAdminProductHandler,
);
adminRouter.patch(
  "/products/:id",
  requireAuth,
  requireCsrfHeader,
  updateAdminProductHandler,
);
adminRouter.patch(
  "/products/:id/deactivate",
  requireAuth,
  requireCsrfHeader,
  deactivateAdminProductHandler,
);

adminRouter.get("/categories", requireAuth, listAdminCategoriesHandler);
adminRouter.post(
  "/categories",
  requireAuth,
  requireCsrfHeader,
  createAdminCategoryHandler,
);
adminRouter.patch(
  "/categories/:id",
  requireAuth,
  requireCsrfHeader,
  updateAdminCategoryHandler,
);
adminRouter.patch(
  "/categories/:id/deactivate",
  requireAuth,
  requireCsrfHeader,
  deactivateAdminCategoryHandler,
);

adminRouter.get("/leads", requireAuth, listAdminLeadsHandler);
adminRouter.get("/leads/:id", requireAuth, getAdminLeadHandler);
adminRouter.patch(
  "/leads/:id",
  requireAuth,
  requireCsrfHeader,
  updateAdminLeadHandler,
);

adminRouter.get("/admins", requireAuth, listAdminUsersHandler);
adminRouter.post(
  "/admins",
  requireAuth,
  requireCsrfHeader,
  createAdminUserHandler,
);
adminRouter.patch(
  "/admins/:id",
  requireAuth,
  requireCsrfHeader,
  updateAdminUserHandler,
);
adminRouter.patch(
  "/admins/:id/deactivate",
  requireAuth,
  requireCsrfHeader,
  deactivateAdminUserHandler,
);

adminRouter.get(
  "/uploads/signature",
  requireAuth,
  getUploadSignatureHandler,
);
adminRouter.post(
  "/uploads/delete",
  requireAuth,
  requireCsrfHeader,
  deleteUploadsHandler,
);
