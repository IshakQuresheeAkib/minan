import type { Express } from "express";

const RENDER_PRIVATE_INGRESS = ["loopback", "linklocal", "uniquelocal"];

export function configureTrustedProxy(
  app: Express,
  environment = process.env.NODE_ENV,
): void {
  if (environment !== "production") {
    app.set("trust proxy", false);
    return;
  }

  // Render terminates public traffic before forwarding it to the service over
  // its private ingress. Stop at the first public address so a caller cannot
  // make Express trust an arbitrary X-Forwarded-For prefix.
  app.set("trust proxy", RENDER_PRIVATE_INGRESS);
}
