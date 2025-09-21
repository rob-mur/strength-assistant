// Clear Supabase local database for testing
// This script works with Supabase local development instance
// Using localhost for web/Chrome tests, 10.0.2.2 for Android emulator

// Determine the base URL - always use localhost for web tests
var baseUrl = "http://127.0.0.1:54321";

// Service role token for admin operations
var serviceToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

var headers = {
  Authorization: "Bearer " + serviceToken,
  apikey: serviceToken,
  "Content-Type": "application/json",
};

// Clear all main tables in correct order (respecting foreign key constraints)
var tablesToClear = [
  "exercise_records",
  "exercises",
  "user_accounts",
  "sync_state_records",
];

// eslint-disable-next-line no-undef
console.log("Clearing Supabase database at " + baseUrl);

// Clear each table
for (var i = 0; i < tablesToClear.length; i++) {
  var table = tablesToClear[i];

  // eslint-disable-next-line no-undef
  console.log("Clearing table: " + table);

  // eslint-disable-next-line no-undef
  var response = http.delete(baseUrl + "/rest/v1/" + table, {
    headers: headers,
  });

  // eslint-disable-next-line no-undef
  console.log("Cleared " + table + ": " + response.status);
}

// eslint-disable-next-line no-undef
console.log("Database cleared successfully");
