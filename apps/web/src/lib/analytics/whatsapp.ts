import { apiRequest } from "@/lib/api/client";
import { getSessionId, getUtmParams } from "@/lib/analytics/session";
import { trackWhatsappLead } from "@/lib/analytics/pixel";

type WhatsappClickPayload = {
  productId?: string;
  categoryId?: string;
  productName: string;
  productUrl: string;
  size?: string;
  color?: string;
};

function formatWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("880")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `880${digits.slice(1)}`;
  }

  return digits;
}

function buildWhatsAppMessage(payload: WhatsappClickPayload): string {
  const lines = [
    `Hi MINAN, I'm interested in *${payload.productName}*.`,
    payload.productUrl,
  ];

  if (payload.size) {
    lines.push(`Size: ${payload.size}`);
  }

  if (payload.color) {
    lines.push(`Color: ${payload.color}`);
  }

  return lines.join("\n");
}

export function openWhatsAppOrder(payload: WhatsappClickPayload): void {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  if (!whatsappNumber) {
    console.error("NEXT_PUBLIC_WHATSAPP_NUMBER is not configured");
    return;
  }

  const phone = formatWhatsAppNumber(whatsappNumber);
  const message = buildWhatsAppMessage(payload);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");

  try {
    const eventId = crypto.randomUUID();
    const sessionId = getSessionId();
    const utm = getUtmParams();

    trackWhatsappLead(eventId, {
      content_name: payload.productName,
      content_ids: payload.productId ? [payload.productId] : undefined,
    });

    void apiRequest("/api/whatsapp-click", {
      method: "POST",
      keepalive: true,
      body: {
        event_id: eventId,
        session_id: sessionId,
        product_id: payload.productId,
        category_id: payload.categoryId,
        ...utm,
      },
    }).catch((error: unknown) => {
      console.error("Failed to track WhatsApp click", error);
    });
  } catch (error) {
    console.error("Failed to track WhatsApp click", error);
  }
}
