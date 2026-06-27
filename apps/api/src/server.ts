import "dotenv/config";
import cors from "cors";
import express from "express";
import {
  connectDB,
  disconnectDB,
  getDBStatus,
  isDBConnected,
} from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { productsRouter } from "./routes/products.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  const db = getDBStatus();
  const healthy = isDBConnected();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db,
  });
});

app.use("/api/products", productsRouter);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
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
