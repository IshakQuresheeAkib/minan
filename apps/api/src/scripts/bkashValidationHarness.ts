import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";

import {
  classifyExecuteResponse,
  queryConfirmsCompletion,
  sanitizeApiResponse,
  transactionId,
} from "./bkashValidationHarness.logic.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const BASE_URL = (process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v2").replace(/\/+$/, "");
const APP_KEY = process.env.BKASH_APP_KEY?.trim() || "";
const APP_SECRET = process.env.BKASH_APP_SECRET?.trim() || "";
const USERNAME = process.env.BKASH_USERNAME?.trim() || "";
const PASSWORD = process.env.BKASH_PASSWORD?.trim() || "";
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || "http://localhost:3001").replace(/\/+$/, "");

if (!APP_KEY || !APP_SECRET || !USERNAME || !PASSWORD) {
  console.error("Missing bKash configuration in .env");
  process.exit(1);
}

const isV1 = BASE_URL.includes("/v1");
const grantUrl = isV1
  ? `${BASE_URL}/tokenized/checkout/token/grant`
  : `${BASE_URL}/tokenized-checkout/auth/grant-token`;
const createUrl = isV1
  ? `${BASE_URL}/tokenized/checkout/create`
  : `${BASE_URL}/tokenized-checkout/payment/create`;
const executeUrl = isV1
  ? `${BASE_URL}/tokenized/checkout/execute`
  : `${BASE_URL}/tokenized-checkout/payment/execute`;
const queryUrl = isV1
  ? `${BASE_URL}/tokenized/checkout/payment/status`
  : `${BASE_URL}/tokenized-checkout/query/payment`;
const searchUrl = isV1
  ? `${BASE_URL}/tokenized/checkout/general/searchTransaction`
  : `${BASE_URL}/tokenized-checkout/general/search-transaction`;

// Store temporary harness files in OS temp directory outside git repository
const HARNESS_DIR = path.join(os.tmpdir(), "minan-bkash-harness");
const CACHE_FILE = path.join(HARNESS_DIR, "token-cache.json");
const STATE_FILE = path.join(HARNESS_DIR, "validation-state.json");

function ensureHarnessDir(): void {
  if (!fs.existsSync(HARNESS_DIR)) {
    fs.mkdirSync(HARNESS_DIR, { recursive: true });
  }
}

type CapturedApi = {
  title: string;
  url: string;
  requestBody: Record<string, unknown>;
  response: Record<string, unknown>;
};

type State = {
  tokenRecord: {
    id_token: string;
    obtainedAt: number;
    grantResponse?: Record<string, unknown>;
  };
  createRecord?: {
    requestBody: Record<string, unknown>;
    response: Record<string, unknown>;
    paymentID: string;
    invoiceNumber: string;
    bkashURL: string;
  };
};

async function getOrFetchToken(): Promise<State["tokenRecord"]> {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) as State["tokenRecord"];
      if (Date.now() - cached.obtainedAt < 50 * 60 * 1000 && cached.id_token) {
        console.log("Using cached Grant Token (valid for 50m to avoid bKash hourly rate limit).");
        return cached;
      }
    } catch {
      // ignore
    }
  }

  console.log("Calling Grant Token API...");
  const grantBody = {
    app_key: APP_KEY,
    app_secret: APP_SECRET,
  };
  const grantRes = await fetch(grantUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: USERNAME,
      password: PASSWORD,
    },
    body: JSON.stringify(grantBody),
    signal: AbortSignal.timeout(30_000),
  });

  const grantData = (await grantRes.json()) as Record<string, unknown>;
  const idToken = typeof grantData.id_token === "string" ? grantData.id_token : "";
  if (!idToken) {
    console.error("Grant Token failed:", sanitizeApiResponse(grantData));
    process.exit(1);
  }

  ensureHarnessDir();
  const record: State["tokenRecord"] = {
    id_token: idToken,
    obtainedAt: Date.now(),
    grantResponse: sanitizeApiResponse(grantData),
  };

  fs.writeFileSync(CACHE_FILE, JSON.stringify(record, null, 2), "utf8");
  return record;
}

function loadState(): State | null {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as State;
    } catch {
      return null;
    }
  }
  return null;
}

function saveState(state: State) {
  ensureHarnessDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

async function runCreate() {
  const tokenRecord = await getOrFetchToken();
  const invoiceNumber = `MINAN-${Date.now()}`;
  const createBody = {
    mode: "0011",
    payerReference: "01619777283",
    callbackURL: `${API_PUBLIC_URL}/api/bkash/callback`,
    amount: "10",
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: invoiceNumber,
  };

  console.log("Calling Create Payment API for amount 10 BDT...");
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: tokenRecord.id_token,
      "X-App-Key": APP_KEY,
    },
    body: JSON.stringify(createBody),
    signal: AbortSignal.timeout(30_000),
  });

  const createData = (await createRes.json()) as Record<string, unknown>;
  const paymentID = (createData.paymentID || createData.paymentId) as string;
  const bkashURL = createData.bkashURL as string;

  if (!paymentID || !bkashURL) {
    console.error("Create Payment failed:", sanitizeApiResponse(createData));
    process.exit(1);
  }

  const state: State = {
    tokenRecord,
    createRecord: {
      requestBody: createBody,
      response: sanitizeApiResponse(createData),
      paymentID,
      invoiceNumber,
      bkashURL,
    },
  };

  saveState(state);

  console.log("\n==================================================");
  console.log("CREATE PAYMENT SUCCESSFUL!");
  console.log("Payment ID    :", paymentID);
  console.log("Invoice Number:", invoiceNumber);
  console.log("bKash URL     :", bkashURL);
  console.log("==================================================");
  console.log("\nNEXT STEPS:");
  console.log("1. Open the bKash URL in the browser.");
  console.log("2. Enter Wallet: 01770618575 -> Confirm.");
  console.log("3. Enter OTP: 123456 -> Confirm.");
  console.log("4. Enter PIN: 12121 -> Confirm.");
  console.log("5. Run: npx tsx src/scripts/bkashValidationHarness.ts complete");
  console.log("==================================================\n");
}

async function runComplete() {
  const state = loadState();
  if (!state || !state.createRecord) {
    console.error("No active payment creation state found. Run 'create' first.");
    process.exit(1);
  }

  const { tokenRecord, createRecord } = state;
  const paymentID = createRecord.paymentID;
  console.log(`Finalizing Payment ID: ${paymentID}...`);

  const apis: CapturedApi[] = [];
  if (tokenRecord.grantResponse) {
    apis.push({
      title: "Grant Token",
      url: grantUrl,
      requestBody: { app_key: "[REDACTED]", app_secret: "[REDACTED]" },
      response: tokenRecord.grantResponse,
    });
  } else {
    console.log("Grant Token response omitted: this cached token predates response capture.");
  }
  apis.push({
    title: "Create Payment",
    url: createUrl,
    requestBody: createRecord.requestBody,
    response: createRecord.response,
  });

  const executeBody = { paymentId: paymentID, paymentID };
  let executeData: Record<string, unknown> | undefined;
  let executeResponseReceived = false;
  try {
    console.log("Calling Execute Payment API...");
    const executeRes = await fetch(executeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: tokenRecord.id_token,
        "X-App-Key": APP_KEY,
      },
      body: JSON.stringify(executeBody),
      signal: AbortSignal.timeout(30_000),
    });
    executeResponseReceived = true;
    executeData = (await executeRes.json()) as Record<string, unknown>;
    apis.push({
      title: "Execute Payment",
      url: executeUrl,
      requestBody: executeBody,
      response: sanitizeApiResponse(executeData),
    });
    console.log("Execute Response:", JSON.stringify(sanitizeApiResponse(executeData), null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execute request failed";
    apis.push({
      title: "Execute Payment",
      url: executeUrl,
      requestBody: executeBody,
      response: { transportError: message },
    });
    console.log(`Execute returned no usable response: ${message}`);
  }

  const classification = executeData ? classifyExecuteResponse(executeData) : "failed";
  let transaction = classification === "completed" && executeData
    ? transactionId(executeData)
    : undefined;
  const shouldQuery = !executeResponseReceived || classification === "query";

  if (shouldQuery) {
    const queryBody = { paymentId: paymentID, paymentID };
    try {
      console.log("Calling Query Payment API...");
      const queryRes = await fetch(queryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: tokenRecord.id_token,
          "X-App-Key": APP_KEY,
        },
        body: JSON.stringify(queryBody),
        signal: AbortSignal.timeout(30_000),
      });
      const queryData = (await queryRes.json()) as Record<string, unknown>;
      apis.push({
        title: "Query Payment API",
        url: queryUrl,
        requestBody: queryBody,
        response: sanitizeApiResponse(queryData),
      });
      console.log("Query Response:", JSON.stringify(sanitizeApiResponse(queryData), null, 2));
      if (queryConfirmsCompletion(queryData)) transaction = transactionId(queryData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Query request failed";
      apis.push({
        title: "Query Payment API",
        url: queryUrl,
        requestBody: queryBody,
        response: { error: message },
      });
      console.log(`Query returned no usable response: ${message}`);
    }
  } else if (classification === "failed") {
    console.log("Execute returned a failure response; Query and Search were not called.");
  }

  if (transaction) {
    const searchBody = { trxId: transaction };
    try {
      console.log("Calling Search Transaction API...");
      const searchRes = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: tokenRecord.id_token,
          "X-App-Key": APP_KEY,
        },
        body: JSON.stringify(searchBody),
        signal: AbortSignal.timeout(30_000),
      });
      const searchData = (await searchRes.json()) as Record<string, unknown>;
      apis.push({
        title: "Search Transaction API",
        url: searchUrl,
        requestBody: searchBody,
        response: sanitizeApiResponse(searchData),
      });
      console.log("Search Response:", JSON.stringify(sanitizeApiResponse(searchData), null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search request failed";
      apis.push({
        title: "Search Transaction API",
        url: searchUrl,
        requestBody: searchBody,
        response: { error: message },
      });
      console.log(`Search returned no usable response: ${message}`);
    }
  } else {
    console.log("Search Transaction API skipped: no confirmed successful transaction ID.");
  }

  let formattedText = "API Request/Response\n\n";
  for (const api of apis) {
    formattedText += `${api.title}\n`;
    formattedText += `• API Title : ${api.title}\n`;
    formattedText += `• API URL : ${api.url}\n`;
    formattedText += `• Request Body :\n${JSON.stringify(api.requestBody, null, 2)}\n\n`;
    formattedText += `• API Response :\n${JSON.stringify(api.response, null, 2)}\n\n`;
  }

  // Save generated documentation into the temporary harness folder outside repository
  const outputDir = path.join(HARNESS_DIR, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const textPath = path.join(outputDir, "bkash-sandbox-api-request-response.txt");
  const jsonPath = path.join(outputDir, "bkash-sandbox-validation-output.json");
  fs.writeFileSync(textPath, formattedText, "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(apis, null, 2), "utf8");

  // Clean up transient state file after completion
  if (fs.existsSync(STATE_FILE)) {
    try {
      fs.unlinkSync(STATE_FILE);
    } catch {
      // ignore
    }
  }

  console.log("\n==================================================");
  console.log("VALIDATION HARNESS COMPLETE!");
  console.log("Output saved to:");
  console.log("  " + textPath);
  console.log("  " + jsonPath);
  console.log("==================================================");
}

async function runQuery(targetPaymentID?: string) {
  const state = loadState();
  const paymentID = targetPaymentID || state?.createRecord?.paymentID;
  if (!paymentID) {
    console.error("Please provide a Payment ID: npx tsx src/scripts/bkashValidationHarness.ts query <paymentID>");
    process.exit(1);
  }

  const tokenRecord = await getOrFetchToken();
  console.log(`Querying Payment ID: ${paymentID}...`);

  const queryBody = { paymentId: paymentID, paymentID };
  const queryRes = await fetch(queryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: tokenRecord.id_token,
      "X-App-Key": APP_KEY,
    },
    body: JSON.stringify(queryBody),
    signal: AbortSignal.timeout(30_000),
  });

  const queryData = (await queryRes.json()) as Record<string, unknown>;
  const sanitized = sanitizeApiResponse(queryData);
  console.log("Query Response:", JSON.stringify(sanitized, null, 2));

  const outputDir = path.join(HARNESS_DIR, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const textPath = path.join(outputDir, `bkash-sandbox-query-sample.txt`);
  const formattedText = `Query Payment API\n• API Title : Query Payment API\n• API URL : ${queryUrl}\n• Request Body :\n${JSON.stringify(queryBody, null, 2)}\n\n• API Response :\n${JSON.stringify(sanitized, null, 2)}\n\n`;
  fs.writeFileSync(textPath, formattedText, "utf8");

  console.log("\n==================================================");
  console.log("QUERY SAMPLE CAPTURED!");
  console.log("Output saved to:");
  console.log("  " + textPath);
  console.log("==================================================");
}

const command = process.argv[2] || "create";
if (command === "create") {
  runCreate().catch(console.error);
} else if (command === "complete") {
  runComplete().catch(console.error);
} else if (command === "query") {
  runQuery(process.argv[3]).catch(console.error);
} else {
  console.log("Usage: npx tsx src/scripts/bkashValidationHarness.ts [create|complete|query <paymentID>]");
}
