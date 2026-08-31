import { getBkashConfig } from "./bkash.js";
import { getCustomerAuthSecrets } from "./customerAuth.js";
import {
  getGuestOrderAccessTokenSecret,
  getGuestOrderOtpSettings,
} from "./guestOrderAccess.js";
import { getResendConfig } from "./resend.js";
import { getShippingConfig } from "./shipping.js";

export function validateStartupConfiguration(): void {
  getBkashConfig();
  getShippingConfig();
  getCustomerAuthSecrets();
  getGuestOrderAccessTokenSecret();
  getGuestOrderOtpSettings();
  getResendConfig();
}
