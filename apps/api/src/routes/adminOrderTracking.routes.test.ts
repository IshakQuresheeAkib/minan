import { describe, expect, it } from "vitest";

import { adminRouter } from "./admin.routes.js";

describe("admin Order tracking route", () => {
  it("requires the established admin-auth and CSRF middleware before the tracking write handler", () => {
    const layer = adminRouter.stack.find((candidate) => candidate.route?.path === "/orders/:id/tracking");

    expect(layer?.route?.methods).toEqual({ patch: true });
    expect(layer?.route?.stack.map((handler) => handler.handle.name)).toEqual([
      "requireAuth",
      "requireCsrfHeader",
      "updateOrderTrackingHandler",
    ]);
  });
});
