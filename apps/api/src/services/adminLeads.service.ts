import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { Lead } from "../models/Lead.js";
import type { LeadUpdateInput } from "../schemas/admin.schemas.js";
import type { LeadListResponse } from "../types/admin.types.js";
import { serializeLead } from "../utils/serializeLead.js";

export async function listAdminLeads(options: {
  page: number;
  limit: number;
  skip: number;
}): Promise<LeadListResponse> {
  const [leads, total] = await Promise.all([
    Lead.find().sort({ createdAt: -1 }).skip(options.skip).limit(options.limit),
    Lead.countDocuments(),
  ]);

  return {
    data: leads.map(serializeLead),
    total,
    page: options.page,
    limit: options.limit,
  };
}

export async function getAdminLeadById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  return serializeLead(lead);
}

export async function updateAdminLead(id: string, input: LeadUpdateInput) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid lead id", 400);
  }

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  if (input.status !== undefined) {
    lead.status = input.status;
  }

  if (input.notes !== undefined) {
    lead.notes = input.notes;
  }

  await lead.save();
  return serializeLead(lead);
}
