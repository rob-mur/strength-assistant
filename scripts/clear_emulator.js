// Clear Supabase local database for testing
// This script works with Supabase local development instance
// Using localhost for web/Chrome tests, 10.0.2.2 for Android emulator

const http = require("http");

// Determine the base URL based on environment
// This script runs on the host machine, so use localhost even for Android tests
// The Android app uses 10.0.2.2:54321 but both point to the same database instance
const baseUrl = "http://127.0.0.1:54321";

// Service role token for admin operations
const serviceToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const headers = {
  Authorization: `Bearer ${serviceToken}`,
  apikey: serviceToken,
  "Content-Type": "application/json",
};

// Clear all main tables in correct order (respecting foreign key constraints)
const tablesToClear = [
  "exercise_records",
  "exercises",
  "user_accounts",
  "sync_state_records",
];

console.log(`Clearing Supabase database at ${baseUrl}`);

// Function to make HTTP DELETE request
function deleteTable(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: 54321,
      path: `/rest/v1/${table}`,
      method: "DELETE",
      headers: headers,
    };

    const req = http.request(options, (res) => {
      console.log(`Cleared ${table}: ${res.statusCode}`);

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({ table, status: res.statusCode, data });
      });
    });

    req.on("error", (error) => {
      console.error(`Error clearing ${table}:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Clear tables sequentially
async function clearAllTables() {
  try {
    for (const table of tablesToClear) {
      console.log(`Clearing table: ${table}`);
      await deleteTable(table);
    }
    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Failed to clear database:", error.message);
    process.exit(1);
  }
}

// Run the clearing process
clearAllTables();
