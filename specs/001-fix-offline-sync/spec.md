# Feature Specification: Fix Offline Sync

**Feature Branch**: `001-fix-offline-sync`  
**Created**: 2025-10-30  
**Status**: Draft  
**Input**: User description: "the local first legend state sync with supabase isnt currently working. what i tested was to turn on airplane mode and then add some exercises. when i turn back on the internet the state isnt pushed to the cloud, and when the app restarts it is lost. this branch is responsible for first, writing a real world test that would have caught this bug, and then fixing it"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Offline Exercise Creation and Sync (Priority: P1)

User adds exercises while offline (airplane mode) and expects them to sync to the cloud when connectivity is restored, with data persisting across app restarts.

**Why this priority**: This is the core functionality that's currently broken. Without reliable offline-to-online sync, users lose their workout data, which undermines the app's value proposition of local-first architecture.

**Independent Test**: Can be fully tested by toggling airplane mode, adding exercises, restoring connectivity, and verifying data appears in Supabase database and persists after app restart.

**Acceptance Scenarios**:

1. **Given** user is offline (airplane mode enabled), **When** user adds new exercises to their workout, **Then** exercises are stored locally and available immediately
2. **Given** user has added exercises while offline, **When** connectivity is restored, **Then** exercises sync to Supabase within 30 seconds
3. **Given** exercises have been synced to cloud, **When** user restarts the app, **Then** all exercises remain available and consistent between local and cloud state

---

### User Story 2 - Comprehensive Test Coverage for Sync Scenarios (Priority: P2)

Development team has automated tests that validate offline/online sync behavior to prevent regression of sync functionality.

**Why this priority**: Test coverage is essential to prevent this bug from recurring. The current lack of real-world sync tests allowed this critical bug to reach production.

**Independent Test**: Can be tested by running the test suite and verifying that offline sync scenarios are covered and would have caught the current bug.

**Acceptance Scenarios**:

1. **Given** test suite includes offline sync scenarios, **When** tests are run, **Then** offline exercise creation and sync behavior is validated
2. **Given** sync functionality is broken, **When** tests are run, **Then** test failures clearly indicate the sync issue
3. **Given** developer makes changes to sync logic, **When** tests are run, **Then** any regression in offline sync is immediately detected

---

### User Story 3 - Data Integrity During Network Transitions (Priority: P3)

User experiences seamless data management during network connectivity changes without any data loss or corruption.

**Why this priority**: Beyond basic sync, users need confidence that their data remains intact during all network state transitions, including partial failures and connection drops.

**Independent Test**: Can be tested by simulating various network conditions (slow, intermittent, dropped connections) during exercise creation and sync operations.

**Acceptance Scenarios**:

1. **Given** user is creating exercises during unstable network conditions, **When** connection drops and restores multiple times, **Then** no duplicate or corrupted exercises appear
2. **Given** sync is in progress, **When** user closes the app mid-sync, **Then** partial sync state is handled gracefully and completes on next app launch
3. **Given** conflicting data exists in local and cloud state, **When** sync occurs, **Then** conflicts are resolved using last-write-wins or user preference without data loss

---

### Edge Cases

- What happens when user creates exercises with identical timestamps while offline?
- How does system handle partial sync failures (some exercises sync, others don't)?
- What occurs when Supabase is temporarily unavailable during sync attempts?
- How does system behave when local storage is full during offline usage?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist exercise data locally when created offline
- **FR-002**: System MUST automatically detect when connectivity is restored
- **FR-003**: System MUST sync local exercise data to Supabase when online
- **FR-004**: Local exercise data MUST persist across app restarts
- **FR-005**: System MUST maintain data consistency between Legend State and Supabase
- **FR-006**: System MUST have automated tests covering offline creation and online sync scenarios
- **FR-007**: System MUST handle sync failures gracefully without data loss
- **FR-008**: System MUST provide sync status feedback to users via a simple sync icon in the app bar

### Key Entities *(include if feature involves data)*

- **Exercise**: Workout exercise data with attributes like name, sets, reps, weight, created timestamp
- **SyncStatus**: Tracks synchronization state of local data (pending, syncing, synced, failed)
- **NetworkState**: Monitors online/offline connectivity status
- **LocalStore**: Legend State local persistence layer
- **CloudStore**: Supabase backend persistence layer

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Exercises created offline sync to Supabase within 30 seconds of connectivity restoration
- **SC-002**: Zero data loss occurs during offline-to-online transitions in 100% of test scenarios
- **SC-003**: Exercise data persists across app restarts in 100% of cases
- **SC-004**: Automated tests catch sync functionality regressions with 100% reliability
- **SC-005**: Sync functionality works reliably on production Android builds in real-world conditions