import "./config/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getBkashConfig } from "./config/bkash.js";
import {
  connectDB,
  disconnectDB,
  getDBStatus,
  isDBConnected,
} from "./config/db.js";
import { getShippingConfig } from "./config/shipping.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { adminRouter } from "./routes/admin.routes.js";
import {
  analyticsRouter,
  whatsappClickRouter,
} from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { bkashRouter } from "./routes/bkash.routes.js";
import { checkoutRouter } from "./routes/checkout.routes.js";
import { homeBannersRouter } from "./routes/homeBanners.routes.js";
import { productsRouter } from "./routes/products.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
  
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  const db = getDBStatus();
  const healthy = isDBConnected();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db,
  });
});

app.use("/api/products", productsRouter);
app.use("/api/home-banners", homeBannersRouter);
app.use("/api/bkash", bkashRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/whatsapp-click", whatsappClickRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  // Fail during startup instead of creating checkout attempts that cannot be paid.
  getBkashConfig();
  getShippingConfig();
  await connectDB();

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received — closing server and MongoDB connection`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
