# Firebase Removal Test Validation Contract

**Test Type**: Removal Validation Tests  
**Purpose**: Ensure Firebase removal is complete and Supabase functionality is preserved

## Contract Test Scenarios

### Test 1: Package Dependencies Removed

```typescript
describe("Firebase Package Removal", () => {
  test("should have no Firebase packages in package.json", () => {
    const packageJson = require("../../package.json");
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(dependencies).not.toHaveProperty("@react-native-firebase/app");
    expect(dependencies).not.toHaveProperty("@react-native-firebase/auth");
    expect(dependencies).not.toHaveProperty("@react-native-firebase/firestore");
    expect(dependencies).not.toHaveProperty("firebase");
  });

  test("should build successfully without Firebase packages", async () => {
    const result = await execAsync("npm run build");
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain("firebase");
  });
});
```

### Test 2: Source Code Removal

```typescript
describe("Firebase Source Code Removal", () => {
  test("should have no Firebase source directory", () => {
    const firebaseDir = path.join(__dirname, "../../lib/data/firebase");
    expect(fs.existsSync(firebaseDir)).toBe(false);
  });

  test("should have no Firebase repository implementation", () => {
    const firebaseRepo = path.join(
      __dirname,
      "../../lib/repo/FirebaseExerciseRepo.ts",
    );
    expect(fs.existsSync(firebaseRepo)).toBe(false);
  });

  test("should have no imports of Firebase modules", () => {
    const sourceFiles = glob.sync("**/*.{ts,tsx,js,jsx}", {
      ignore: ["node_modules/**", "__tests__/**"],
    });

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf-8");
      expect(content).not.toMatch(/from ['"].*firebase/);
      expect(content).not.toMatch(/import.*firebase/);
      expect(content).not.toMatch(/@react-native-firebase/);
    }
  });
});
```

### Test 3: Test Infrastructure Removal

```typescript
describe("Firebase Test Infrastructure Removal", () => {
  test("should have no Firebase mock implementations", () => {
    const firebaseMock = path.join(
      __dirname,
      "../__mocks__/@react-native-firebase",
    );
    expect(fs.existsSync(firebaseMock)).toBe(false);

    const mockFactory = path.join(
      __dirname,
      "../test-utils/FirebaseMockFactory.ts",
    );
    expect(fs.existsSync(mockFactory)).toBe(false);
  });

  test("should have no Firebase-specific tests", () => {
    const firebaseTests = glob.sync("**/*Firebase*.test.{ts,tsx}");
    expect(firebaseTests).toHaveLength(0);
  });

  test("should have clean Jest setup without Firebase mocks", () => {
    const jestSetup = fs.readFileSync("jest.setup.js", "utf-8");
    expect(jestSetup).not.toMatch(/firebase/i);
    expect(jestSetup).not.toMatch(/@react-native-firebase/);
  });
});
```

### Test 4: Configuration Removal

```typescript
describe("Firebase Configuration Removal", () => {
  test("should have no Firebase configuration files", () => {
    expect(fs.existsSync("firebase.json")).toBe(false);
    expect(fs.existsSync("google-services.json")).toBe(false);
    expect(fs.existsSync("android/app/google-services.json")).toBe(false);
  });

  test("should have no Firebase environment variables", () => {
    const envFiles = glob.sync(".env*");
    for (const envFile of envFiles) {
      const content = fs.readFileSync(envFile, "utf-8");
      expect(content).not.toMatch(/FIREBASE_/);
    }
  });
});
```

### Test 5: Functional Preservation

```typescript
describe("Supabase-Only Functionality", () => {
  test("should authenticate successfully with Supabase", async () => {
    const auth = useAuth();
    const result = await auth.signIn("test@example.com", "password");
    expect(result.success).toBe(true);
    expect(result.provider).toBe("supabase");
  });

  test("should perform CRUD operations with Supabase", async () => {
    const exerciseRepo = new SupabaseExerciseRepo();

    // Create
    const newExercise = await exerciseRepo.create({
      name: "Test Exercise",
      type: "strength",
    });
    expect(newExercise.id).toBeDefined();

    // Read
    const retrieved = await exerciseRepo.getById(newExercise.id);
    expect(retrieved.name).toBe("Test Exercise");

    // Update
    const updated = await exerciseRepo.update(newExercise.id, {
      name: "Updated Exercise",
    });
    expect(updated.name).toBe("Updated Exercise");

    // Delete
    await exerciseRepo.delete(newExercise.id);
    const deleted = await exerciseRepo.getById(newExercise.id);
    expect(deleted).toBeNull();
  });

  test("should receive real-time updates from Supabase", async () => {
    const exerciseRepo = new SupabaseExerciseRepo();
    const updates = [];

    const subscription = exerciseRepo.subscribe((data) => {
      updates.push(data);
    });

    await exerciseRepo.create({ name: "Real-time Test" });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(updates.length).toBeGreaterThan(0);
    subscription.unsubscribe();
  });
});
```

### Test 6: Factory Pattern Simplification

```typescript
describe("Repository Factory Simplification", () => {
  test("should always return Supabase repository", () => {
    process.env.USE_SUPABASE_DATA = "false"; // Test that this is ignored
    const repo = ExerciseRepoFactory.create();
    expect(repo).toBeInstanceOf(SupabaseExerciseRepo);

    process.env.USE_SUPABASE_DATA = "true";
    const repo2 = ExerciseRepoFactory.create();
    expect(repo2).toBeInstanceOf(SupabaseExerciseRepo);

    delete process.env.USE_SUPABASE_DATA;
    const repo3 = ExerciseRepoFactory.create();
    expect(repo3).toBeInstanceOf(SupabaseExerciseRepo);
  });

  test("should not have Firebase option in factory", () => {
    const factoryCode = fs.readFileSync(
      "lib/repo/ExerciseRepoFactory.ts",
      "utf-8",
    );
    expect(factoryCode).not.toMatch(/Firebase/);
    expect(factoryCode).not.toMatch(/USE_SUPABASE_DATA/);
  });
});
```

### Test 7: Build and Integration Validation

```typescript
describe("Build and Integration Tests", () => {
  test("should pass all unit tests", async () => {
    const result = await execAsync("npm test");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/All tests passed/);
  });

  test("should pass devbox test suite", async () => {
    const result = await execAsync("devbox run test");
    expect(result.exitCode).toBe(0);
  });

  test("should pass Maestro integration tests", async () => {
    const result = await execAsync("devbox run maestro-test");
    expect(result.exitCode).toBe(0);
  });

  test("should build for all platforms", async () => {
    const webBuild = await execAsync("npm run build:web");
    expect(webBuild.exitCode).toBe(0);

    const iosBuild = await execAsync("npx expo build:ios");
    expect(iosBuild.exitCode).toBe(0);

    const androidBuild = await execAsync("npx expo build:android");
    expect(androidBuild.exitCode).toBe(0);
  });
});
```

## Validation Success Criteria

### Complete Removal Validation

- ✅ Zero Firebase package dependencies
- ✅ Zero Firebase source files
- ✅ Zero Firebase imports or references
- ✅ Zero Firebase configuration files
- ✅ Zero Firebase test infrastructure

### Functional Preservation Validation

- ✅ Authentication works on all platforms
- ✅ CRUD operations work through Supabase
- ✅ Real-time updates work through Supabase
- ✅ Offline capabilities preserved
- ✅ Performance metrics unchanged

### Build and Test Validation

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ devbox run test succeeds
- ✅ Maestro integration tests succeed
- ✅ Build succeeds for all platforms

### Cleanup Validation

- ✅ No broken imports or dependencies
- ✅ No orphaned configuration
- ✅ No unused environment variables
- ✅ Clean git history without Firebase artifacts

## Test Execution Contract

These tests MUST be run in the following order:

1. **Pre-removal validation** - Ensure Supabase works perfectly
2. **Incremental removal tests** - Validate at each removal step
3. **Post-removal validation** - Complete functional testing
4. **Integration validation** - Full test suite execution

**CRITICAL**: If any test fails during removal process, rollback to previous working state and investigate before proceeding.
