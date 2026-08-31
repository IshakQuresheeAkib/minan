import { z } from "zod";

const email = z.string().trim().email().max(320);
const password = z.string().min(1).max(128);

export const customerSignupSchema = z.object({
  email,
  password: password.min(8),
}).strict();

export const customerLoginSchema = z.object({
  email,
  password,
}).strict();

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
