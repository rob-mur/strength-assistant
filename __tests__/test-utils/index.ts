/**
 * Test Utilities Index
 *
 * Central export file for all test infrastructure components.
 * Provides clean imports for test files and maintains consistent API.
 */

// Core Test Infrastructure (currently implemented)
export * from "./TestDevice";
export * from "./TestApp";
export * from "./MigrationTestApp";

// Mock Factories
export * from "./mocks";

// Test Data Builders
export * from "./builders";

// Test Scenarios
export * from "./scenarios";

// Test Fixtures
export * from "./fixtures";

// Core Types (re-exported from contracts for what exists)
export type {
  TestInfrastructureManager,
  MockFactoryCollection,
  TestDataBuilderCollection,
} from "../../specs/001-we-are-actually/contracts/test-infrastructure";
