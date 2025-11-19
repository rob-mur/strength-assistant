# Feature Specification: Exercise Set Logging

**Feature Branch**: `001-exercise-set-logging`  
**Created**: 2025-11-18  
**Status**: Draft  

## Overview

Enable users to log weight, repetitions, and Rate of Perceived Exertion (RPE) for each set during their workout session. This feature focuses on friction-free data entry to maximize session completion and user retention, assuming the user has already selected an exercise and is actively in a workout.

## Success Criteria

- Users can log a complete set (weight, reps, RPE) in under 15 seconds
- 95% of logged sets are saved and immediately visible in session history  
- New users complete at least 3 workouts in their first 14 days (target: >40% retention)
- Set data defaults reduce input time by 50% compared to blank forms
- Users can edit or delete recently logged sets within 30 seconds

## User Scenarios & Testing _(mandatory)_

### Primary User Story

Sarah is at the gym performing bench press. She has already selected "Bench Press" and is on the workout screen. She completes her first set with 135 lbs for 8 reps and felt it was moderately challenging (RPE 7). She wants to quickly log this data and move on to her next set. The system should save her input immediately and show it in her session log, then prepare for her next set with the same weight and rep count pre-filled.

### Acceptance Scenarios

1. **Given** I'm on the workout screen with an exercise selected, **When** I enter weight (135), reps (8), and RPE (7) and tap "Log Set", **Then** the set appears immediately in my session history and the form resets with weight/reps pre-filled to last set's values
2. **Given** I have logged 2 sets today, **When** I view my workout screen, **Then** I see today's sets by default without needing to navigate elsewhere
3. **Given** I just logged a set with incorrect weight, **When** I tap edit on that set within 30 seconds, **Then** I can modify any field and save the changes
4. **Given** I want to see my previous workout data, **When** I tap "View Previous Sessions", **Then** I can browse historical workout data from other days
5. **Given** I accidentally log a set, **When** I delete it within 30 seconds, **Then** it's removed from my session history immediately

### Edge Cases

- What happens when I enter invalid data (negative weight, 0 reps, RPE outside 1-10 range)?
- How does the system handle network connectivity issues during save operations?
- What occurs if I try to log multiple sets rapidly in succession?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide input fields for weight, repetitions, and RPE (1-10 scale) on the workout screen
- **FR-002**: System MUST validate input data (positive weight, positive reps, RPE between 1-10)
- **FR-003**: System MUST save logged set data immediately upon user confirmation
- **FR-004**: System MUST display all sets logged for today's workout session by default
- **FR-005**: System MUST pre-fill weight and reps fields with previous set's values for new sets
- **FR-006**: System MUST leave RPE field blank or with neutral placeholder for new sets
- **FR-007**: Users MUST be able to edit any logged set within the current session
- **FR-008**: Users MUST be able to delete any logged set within the current session
- **FR-009**: System MUST provide access to view workout data from previous sessions
- **FR-010**: System MUST support both metric (kg) and imperial (lbs) weight units
- **FR-011**: System MUST handle offline scenarios by persisting data locally until sync is possible
- **FR-012**: System MUST prevent data loss during rapid successive set logging

### Key Entities

- **Workout Set**: Represents a single set of exercise performance containing weight, repetitions, RPE rating, timestamp, and associated exercise
- **Workout Session**: Collection of sets performed on a specific date, linked to current user
- **Exercise Context**: Current selected exercise that sets are being logged against

## Assumptions

- Users have appropriate permissions to log workout data for their account
- Exercise selection occurs before reaching this logging interface
- Weight unit preference is stored in user profile or app settings
- Network connectivity issues are handled gracefully with local persistence
- Data synchronization with backend occurs automatically when connectivity is restored
- User sessions are properly authenticated and secure
- Standard mobile app performance expectations apply (sub-second response times)

---
