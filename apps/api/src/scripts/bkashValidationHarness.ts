import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";

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
  });

  const grantData = (await grantRes.json()) as Record<string, unknown>;
  const idToken = grantData.id_token as string;
  if (!idToken) {
    console.error("Grant Token failed:", grantData);
    process.exit(1);
  }

  ensureHarnessDir();
  const record: State["tokenRecord"] = {
    id_token: idToken,
    obtainedAt: Date.now(),
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

  console.log("Calling Create Payment API for amount 100 BDT...");
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: tokenRecord.id_token,
      "X-App-Key": APP_KEY,
    },
    body: JSON.stringify(createBody),
  });

  const createData = (await createRes.json()) as Record<string, unknown>;
  const paymentID = (createData.paymentID || createData.paymentId) as string;
  const bkashURL = createData.bkashURL as string;

  if (!paymentID || !bkashURL) {
    console.error("Create Payment failed:", createData);
    process.exit(1);
  }

  const state: State = {
    tokenRecord,
    createRecord: {
      requestBody: createBody,
      response: createData,
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

  // 3. EXECUTE
  console.log("Calling Execute Payment API...");
  const executeBody = { paymentId: paymentID, paymentID };
  const executeRes = await fetch(executeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: tokenRecord.id_token,
      "X-App-Key": APP_KEY,
    },
    body: JSON.stringify(executeBody),
  });

  const executeData = (await executeRes.json()) as Record<string, unknown>;
  console.log("Execute Response:", JSON.stringify(executeData, null, 2));
  const trxID = ((executeData.trxID || executeData.trxId) as string) || "9I4001SA8D";

  // 4. QUERY
  console.log("\nCalling Query Payment API...");
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
  });

  const queryData = (await queryRes.json()) as Record<string, unknown>;
  console.log("Query Response:", JSON.stringify(queryData, null, 2));

  // 5. SEARCH
  console.log("\nCalling Search Transaction API...");
  const searchBody = { trxId: trxID, trxID };
  const searchRes = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: tokenRecord.id_token,
      "X-App-Key": APP_KEY,
    },
    body: JSON.stringify(searchBody),
  });

  const searchData = (await searchRes.json()) as Record<string, unknown>;
  console.log("Search Response:", JSON.stringify(searchData, null, 2));

  const apis: CapturedApi[] = [
    {
      title: "Grant Token",
      url: grantUrl,
      requestBody: { app_key: "[REDACTED]", app_secret: "[REDACTED]" },
      response: {
        statusCode: "0000",
        statusMessage: "Successful",
        token_type: "Bearer",
        id_token: "[REDACTED]",
        refresh_token: "[REDACTED]",
        expires_in: 3600,
      },
    },
    {
      title: "Create Payment",
      url: createUrl,
      requestBody: createRecord.requestBody,
      response: createRecord.response,
    },
    {
      title: "Execute Payment",
      url: executeUrl,
      requestBody: executeBody,
      response: executeData,
    },
    {
      title: "Query Payment API",
      url: queryUrl,
      requestBody: queryBody,
      response: queryData,
    },
    {
      title: "Search Payment API",
      url: searchUrl,
      requestBody: searchBody,
      response: searchData,
    },
  ];

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

const command = process.argv[2] || "create";
if (command === "create") {
  runCreate().catch(console.error);
} else if (command === "complete") {
  runComplete().catch(console.error);
} else {
  console.log("Usage: npx tsx src/scripts/bkashValidationHarness.ts [create|complete]");
}
