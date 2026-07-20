import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { Product } from "../models/Product.js";

async function backfillProductDiscounts(): Promise<void> {
  await connectDB();

  const result = await Product.collection.updateMany(
    {
      $or: [
        { discount: { $exists: false } },
        { discount: null },
      ],
    },
    { $set: { discount: 0 } },
  );

  console.log(
    `Product discount backfill complete: ${result.matchedCount} matched, ${result.modifiedCount} modified.`,
  );
}

backfillProductDiscounts()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Product discount backfill failed:", error);
    await disconnectDB();
    process.exit(1);
  });
