import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { Lead } from "../models/Lead.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import type { LeadUpdateInput } from "../schemas/admin.schemas.js";
import type { LeadListResponse } from "../types/admin.types.js";
import { serializeLead } from "../utils/serializeLead.js";

async function expireAbandonedAttempts(): Promise<void> {
  await PaymentAttempt.updateMany(
    {
      status: { $in: ["initiated", "verification_pending"] },
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    {
      $set: {
        status: "expired",
        provider_status_message: "Payment attempt expired before completion",
      },
    },
  );
}

export async function listAdminLeads(options: {
  page: number;
  limit: number;
  skip: number;
}): Promise<LeadListResponse> {
  await expireAbandonedAttempts();
  const [leads, total] = await Promise.all([
    Lead.find().sort({ createdAt: -1 }).skip(options.skip).limit(options.limit),
    Lead.countDocuments(),
  ]);

  const attempts = await PaymentAttempt.find({ lead_id: { $in: leads.map((lead) => lead._id) } })
    .sort({ sequence: -1 });
  const latestByLead = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const key = attempt.lead_id.toString();
    if (!latestByLead.has(key)) latestByLead.set(key, attempt);
  }

  return {
    data: leads.map((lead) => {
      const latest = latestByLead.get(lead._id.toString());
      return serializeLead(lead, latest ? [latest] : []);
    }),
    total,
    page: options.page,
    limit: options.limit,
  };
}

export async function getAdminLeadById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  await expireAbandonedAttempts();
  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  const attempts = await PaymentAttempt.find({ lead_id: lead._id }).sort({ sequence: -1 });
  return serializeLead(lead, attempts);
}

export async function updateAdminLead(id: string, input: LeadUpdateInput) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (input.delivery_status !== undefined) {
    lead.delivery_status = input.delivery_status;
  }

  if (input.notes !== undefined) {
    lead.notes = input.notes;
  }

  await lead.save();
  const attempts = await PaymentAttempt.find({ lead_id: lead._id }).sort({ sequence: -1 });
  return serializeLead(lead, attempts);
}
