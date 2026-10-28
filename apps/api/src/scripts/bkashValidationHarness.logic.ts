type GatewayResponse = Record<string, unknown>;

const sensitiveField = /(?:app[_-]?(?:key|secret)|(?:id|refresh|access)[_-]?token|password|signature|authorization)/i;

const ALREADY_COMPLETED_STATUS_CODES = new Set(["2062", "2068", "2117"]);

export function classifyExecuteResponse(response: GatewayResponse): "completed" | "query" | "failed" {
  const statusCode = String(response.statusCode ?? response.externalCode ?? "");
  const transactionStatus = typeof response.transactionStatus === "string"
    ? response.transactionStatus.toLowerCase()
    : "";
  if (statusCode === "0000" || (!statusCode && transactionStatus === "completed")) return "completed";
  if (ALREADY_COMPLETED_STATUS_CODES.has(statusCode)) return "query";
  return "failed";
}

export function transactionId(response: GatewayResponse): string | undefined {
  const value = response.trxID ?? response.trxId;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function queryConfirmsCompletion(response: GatewayResponse): boolean {
  const statusCode = String(response.statusCode ?? response.externalCode ?? "");
  const transactionStatus = typeof response.transactionStatus === "string"
    ? response.transactionStatus.toLowerCase()
    : "";
  return transactionStatus === "completed" && (!statusCode || statusCode === "0000");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, key = ""): unknown {
  if (sensitiveField.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeValue(childValue, childKey)]),
    );
  }
  if (typeof value === "string" && /url$/i.test(key)) {
    try {
      const url = new URL(value);
      for (const parameter of url.searchParams.keys()) {
        if (sensitiveField.test(parameter)) url.searchParams.set(parameter, "[REDACTED]");
      }
      return url.toString();
    } catch {
      return value;
    }
  }
  return value;
}

export function sanitizeApiResponse(response: GatewayResponse): GatewayResponse {
  const sanitized = sanitizeValue(response);
  return isRecord(sanitized) ? sanitized : {};
}
