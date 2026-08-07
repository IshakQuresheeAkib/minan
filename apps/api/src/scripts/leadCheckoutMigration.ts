export function leadCheckoutMigrationOperations() {
  return [
    {
      updateMany: {
        filter: { delivery_status: { $exists: false }, status: "cancelled" },
        update: { $set: { delivery_status: "cancelled" } },
      },
    },
    {
      updateMany: {
        filter: { delivery_status: { $exists: false }, status: "confirmed" },
        update: { $set: { delivery_status: "processing" } },
      },
    },
    {
      updateMany: {
        filter: { delivery_status: { $exists: false } },
        update: { $set: { delivery_status: "pending" } },
      },
    },
    {
      updateMany: {
        filter: { checkout_source: { $exists: false } },
        update: { $set: { checkout_source: "cart" } },
      },
    },
    {
      updateMany: {
        filter: {
          bkash_txn_id: { $exists: true },
          legacy_bkash_txn_id: { $exists: false },
        },
        update: { $rename: { bkash_txn_id: "legacy_bkash_txn_id" } },
      },
    },
    {
      updateMany: {
        filter: { status: { $exists: true } },
        update: { $unset: { status: "" as const } },
      },
    },
  ];
}
