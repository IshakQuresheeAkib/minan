import { getBkashConfig } from "./bkash.js";
import { getCustomerAuthSecrets } from "./customerAuth.js";
import { getShippingConfig } from "./shipping.js";

export function validateStartupConfiguration(): void {
  getBkashConfig();
  getShippingConfig();
  getCustomerAuthSecrets();
}
