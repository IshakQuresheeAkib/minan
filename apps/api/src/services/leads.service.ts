import { Lead } from "../models/Lead.js";
import type { LeadCreateInput } from "../schemas/lead.schemas.js";
import type { LeadResponse } from "../types/admin.types.js";
import { serializeLead } from "../utils/serializeLead.js";

export async function createLead(
  input: LeadCreateInput,
): Promise<LeadResponse> {
  const lead = await Lead.create(input);

  return serializeLead(lead);
}
