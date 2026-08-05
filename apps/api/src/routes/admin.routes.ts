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
  deleteAdminProductHandler,
  listAdminProductsHandler,
  updateAdminProductHandler,
} from "../controllers/admin/products.controller.js";
import {
  createAdminSubcategoryHandler,
  deactivateAdminSubcategoryHandler,
  listAdminSubcategoriesHandler,
  reactivateAdminSubcategoryHandler,
  reorderAdminSubcategoriesHandler,
  updateAdminSubcategoryHandler,
} from "../controllers/admin/subcategories.controller.js";
import {
  getAdminLeadHandler,
  listAdminLeadsHandler,
  recheckAdminLeadPaymentHandler,
  updateAdminLeadHandler,
} from "../controllers/admin/leads.controller.js";
import {
  createAdminUserHandler,
  deactivateAdminUserHandler,
  listAdminUsersHandler,
  updateAdminUserHandler,
} from "../controllers/admin/admins.controller.js";
import {
  createAdminHomeBannerHandler,
  deleteAdminHomeBannerHandler,
  getAdminHomeBannersHandler,
  reorderAdminHomeBannersHandler,
  syncAdminHomeBannersHandler,
  updateAdminHomeBannerHandler,
} from "../controllers/admin/homeBanners.controller.js";
import {
  deleteUploadsHandler,
  getUploadSignatureHandler,
} from "../controllers/admin/uploads.controller.js";
import { requireCsrfHeader } from "../middleware/csrf.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  appendOrderNoteHandler,
  createOrderExchangeHandler,
  exportAdminOrdersHandler,
  getAdminOrderHandler,
  listAdminOrdersHandler,
  listOrderChangesHandler,
  recheckOrderPaymentHandler,
  recordOrderCodHandler,
  recordOrderRefundHandler,
  recordOrderReturnHandler,
  reviewOrderDuplicateHandler,
  transitionOrderHandler,
  updateOrderCourierHandler,
  updateOrderCustomerHandler,
  updateOrderItemsHandler,
} from "../controllers/admin/orders.controller.js";

export const adminRouter = Router();

adminRouter.get("/dashboard", requireAuth, getDashboardHandler);

adminRouter.get("/orders", requireAuth, listAdminOrdersHandler);
adminRouter.get("/orders/changes", requireAuth, listOrderChangesHandler);
adminRouter.get("/orders/export", requireAuth, exportAdminOrdersHandler);
adminRouter.get("/orders/:id", requireAuth, getAdminOrderHandler);
adminRouter.patch("/orders/:id/customer", requireAuth, requireCsrfHeader, updateOrderCustomerHandler);
adminRouter.patch("/orders/:id/items", requireAuth, requireCsrfHeader, updateOrderItemsHandler);
adminRouter.post("/orders/:id/transitions", requireAuth, requireCsrfHeader, transitionOrderHandler);
adminRouter.patch("/orders/:id/courier", requireAuth, requireCsrfHeader, updateOrderCourierHandler);
adminRouter.post("/orders/:id/cod", requireAuth, requireCsrfHeader, recordOrderCodHandler);
adminRouter.post("/orders/:id/notes", requireAuth, requireCsrfHeader, appendOrderNoteHandler);
adminRouter.patch("/orders/:id/duplicates", requireAuth, requireCsrfHeader, reviewOrderDuplicateHandler);
adminRouter.post("/orders/:id/returns", requireAuth, requireCsrfHeader, recordOrderReturnHandler);
adminRouter.post("/orders/:id/refunds", requireAuth, requireCsrfHeader, recordOrderRefundHandler);
adminRouter.post("/orders/:id/exchanges", requireAuth, requireCsrfHeader, createOrderExchangeHandler);
adminRouter.post("/orders/:id/payments/recheck", requireAuth, requireCsrfHeader, recheckOrderPaymentHandler);

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
adminRouter.post(
  "/leads/:id/payments/recheck",
  requireAuth,
  requireCsrfHeader,
  recheckAdminLeadPaymentHandler,
);

adminRouter.get(
  "/home-banners",
  requireAuth,
  getAdminHomeBannersHandler,
);
adminRouter.post(
  "/home-banners",
  requireAuth,
  requireCsrfHeader,
  createAdminHomeBannerHandler,
);
adminRouter.patch(
  "/home-banners/reorder",
  requireAuth,
  requireCsrfHeader,
  reorderAdminHomeBannersHandler,
);
adminRouter.post(
  "/home-banners/sync",
  requireAuth,
  requireCsrfHeader,
  syncAdminHomeBannersHandler,
);
adminRouter.patch(
  "/home-banners/:id",
  requireAuth,
  requireCsrfHeader,
  updateAdminHomeBannerHandler,
);
adminRouter.delete(
  "/home-banners/:id",
  requireAuth,
  requireCsrfHeader,
  deleteAdminHomeBannerHandler,
);
adminRouter.patch(
  "/products/:id/deactivate",
  requireAuth,
  requireCsrfHeader,
  deactivateAdminProductHandler,
);
adminRouter.delete(
  "/products/:id",
  requireAuth,
  requireCsrfHeader,
  deleteAdminProductHandler,
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

adminRouter.get("/subcategories", requireAuth, listAdminSubcategoriesHandler);
adminRouter.post(
  "/subcategories",
  requireAuth,
  requireCsrfHeader,
  createAdminSubcategoryHandler,
);
adminRouter.patch(
  "/subcategories/reorder",
  requireAuth,
  requireCsrfHeader,
  reorderAdminSubcategoriesHandler,
);
adminRouter.patch(
  "/subcategories/:id",
  requireAuth,
  requireCsrfHeader,
  updateAdminSubcategoryHandler,
);
adminRouter.patch(
  "/subcategories/:id/deactivate",
  requireAuth,
  requireCsrfHeader,
  deactivateAdminSubcategoryHandler,
);
adminRouter.patch(
  "/subcategories/:id/reactivate",
  requireAuth,
  requireCsrfHeader,
  reactivateAdminSubcategoryHandler,
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
