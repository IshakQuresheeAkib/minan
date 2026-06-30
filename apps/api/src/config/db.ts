import mongoose from "mongoose";

/** Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting */
const READY_STATE_LABEL: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};
/**
 * Pool/timeouts tuned for a single long-running Express instance on Render (OLTP).
 * Assumption: one API process, moderate MVP traffic — revisit after load testing.
 */
const connectionOptions: mongoose.ConnectOptions = {
  // Default maxPoolSize is 100; cap lower for single-instance MVP to limit Atlas connections
  maxPoolSize: 30,
  // Pre-warm a few sockets so first requests after idle don't pay connect latency
  minPoolSize: 5,
  maxIdleTimeMS: 300_000, // 5 min — balance reuse vs idle memory on Atlas
  connectTimeoutMS: 10_000,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 30_000, // fail fast on hung OLTP queries
};

export function getDBStatus(): {
  status: string;
  readyState: number;
  host: string | null;
  name: string | null;
} {
  const { connection } = mongoose;
  return {
    status: READY_STATE_LABEL[connection.readyState] ?? "unknown",
    readyState: connection.readyState,
    host: connection.host || null,
    name: connection.name || null,
  };
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function registerConnectionEvents(): void {
  const { connection } = mongoose;

  connection.on("connected", () => {
    console.log(`MongoDB connected (${connection.host}/${connection.name})`);
  });

  connection.on("error", (error: Error) => {
    console.error("MongoDB connection error:", error.message);
  });

  connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  registerConnectionEvents();
  await mongoose.connect(uri, connectionOptions);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
