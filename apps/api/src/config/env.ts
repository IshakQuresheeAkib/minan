import { config } from "dotenv";

// Resolve the API environment file from this module so configuration loading
// does not depend on the directory used to launch the server.
config({ path: new URL("../../.env", import.meta.url), quiet: true });
