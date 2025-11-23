# strength-assistant - Product Requirements Document

**Author:** BMad
**Date:** 2025-11-23
**Version:** 1.0

---

## Executive Summary

The Strength Assistant is a mobile application designed for strength training enthusiasts who want to optimize their workouts without the mental overhead of selecting weights. It solves the problem of "what should I lift today?" by automatically progressing the user's weights based on their real-time performance feedback. The primary goal is to provide a seamless, offline-first workout logging experience that intelligently guides users towards their strength goals, replacing a previous, more limited MVP with a robust, production-ready solution.

### What Makes This Special

The core differentiator is the **automatic weight progression** feature. The app uses the user's feedback on set difficulty (e.g., RPE - Rate of Perceived Exertion) to intelligently calculate and suggest the appropriate weight for subsequent sets and future workouts. This removes guesswork and provides a data-driven path to strength gains. A second key differentiator is its **offline-first** architecture, ensuring full functionality in environments with poor or no internet connectivity, a common issue in gyms.

---

## Project Classification

**Technical Type:** Mobile App
**Domain:** General (Fitness)
**Complexity:** Low

The project is classified as a **Mobile App** within the **General (Fitness)** domain. Its technical complexity is considered **Low**, as it leverages a standard mobile app framework and a BaaS (Backend as a Service) platform, with no novel or high-risk technologies identified. The primary challenges are in the application logic for weight selection and ensuring a robust offline-first data synchronization mechanism.

{{#if domain_context_summary}}

### Domain Context

{{domain_context_summary}}
{{/if}}

---

## Success Criteria

Success for the Strength Assistant is defined by user adoption and consistent engagement, proving that the app is a valuable part of their fitness routine. Key success criteria include:

*   **High User Retention:** A significant percentage of users continue to actively log workouts with the app 3 and 6 months after their first session. This indicates the app provides lasting value.
*   **Consistent Core Feature Usage:** A high volume of logged sets include the "difficulty" feedback, demonstrating that users are engaging with the core automatic weight progression feature.
*   **Demonstrable User Progress:** The system can show a clear trend of increased strength (e.g., higher calculated 1-rep max, increased volume over time) for active users, validating the effectiveness of the progression algorithm.
*   **Positive Qualitative Feedback:** User reviews and feedback highlight the app's ease of use, the effectiveness of the automatic weight selection, and the reliability of the offline functionality.

{{#if business_metrics}}

### Business Metrics

*   **Monthly Active Users (MAU):** A steady growth in the number of unique users logging at least one workout per month.
*   **Session Frequency:** The average number of workout sessions logged per active user per week. A healthy number would align with common strength training frequencies (e.g., 2-4 times per week).
*   **Feature Adoption Rate:** Percentage of new users who use the automatic weight progression feature within their first week.
{{/if}}

---

## Product Scope

### MVP - Minimum Viable Product

The MVP is focused on delivering the core value proposition on a stable, production-ready architecture. It must include:

*   **Workout Logging:** Ability to start a workout, add exercises, and log sets with reps, weight, and a measure of difficulty (e.g., RPE).
*   **Automatic Weight Progression:** The core algorithm that uses the difficulty metric from a completed workout to calculate and suggest weights for the next session of the same workout.
*   **Offline-First Functionality:** All workout logging and weight suggestions must work perfectly without an internet connection.
*   **Data Synchronization:** A robust mechanism to sync local data with the backend when a connection becomes available.
*   **User Accounts:** Basic sign-up, login, and profile management.
*   **Workout History:** A simple view to see previously completed workouts and their details.

### Growth Features (Post-MVP)

Once the MVP is established, these features will enhance user engagement and expand the app's utility:

*   **Workout Templates:** Ability for users to create and save their own workout routines, and access a library of pre-defined programs.
*   **Advanced Progress Analytics:** Visual dashboards showing progress over time, including charts for volume, estimated 1-rep max, and personal records.
*   **Exercise Library:** An in-app resource with detailed instructions, images, and videos for a wide range of exercises.
*   **Rest Timers:** Configurable timers that automatically start after a set is completed.

### Vision (Future)

The long-term vision is to create a comprehensive, AI-powered training partner:

*   **AI Workout Generation:** An AI coach that generates personalized, long-term training programs based on user goals, experience level, and available equipment.
*   **Wearable Integration:** Connect with devices like Apple Watch or Garmin to automatically track rest periods, heart rate, and workout duration.
*   **Real-time Form Feedback:** Use computer vision via the phone's camera to provide corrective feedback on exercise form.
*   **Community & Social Features:** Allow users to share progress, participate in community challenges, and follow other athletes.

---

{{#if domain_considerations}}

## Domain-Specific Requirements

{{domain_considerations}}

This section shapes all functional and non-functional requirements below.
{{/if}}

---

{{#if innovation_patterns}}

## Innovation & Novel Patterns

The primary innovation is the implementation of **autoregulated training** via a software algorithm. Instead of following a static, pre-defined progression, the app adapts to the user's real-time performance. This pattern involves:

*   **Performance Data Capture:** Capturing not just reps and weight, but also a subjective difficulty score (RPE).
*   **Progression Logic:** An algorithm that processes this data to make informed decisions about future training variables.
*   **Feedback Loop:** The user's performance directly influences their future training, creating a personalized and adaptive feedback loop.

### Validation Approach

The effectiveness of the automatic weight progression is critical and must be validated carefully to ensure it is both safe and effective. The validation will proceed in stages:

1.  **Algorithm Simulation:** The progression logic will be unit-tested with a wide range of simulated user inputs to ensure it behaves as expected and has no edge cases that lead to unsafe recommendations.
2.  **Internal Alpha Testing:** The feature will be tested by a small group of experienced lifters to gather qualitative feedback on the "feel" and accuracy of the weight suggestions.
3.  **A/B Testing (Beta):** The feature will be rolled out to a segment of beta testers. We will compare their adherence, progression, and satisfaction against a control group using a more traditional, linear progression model.
4.  **Monitoring & Tuning:** Post-launch, the algorithm's parameters will be tunable, and its performance will be monitored to allow for continuous improvement based on aggregated, anonymized user data.
{{/if}}

---

{{#if project_type_requirements}}

## {{project_type}} Specific Requirements

As a cross-platform mobile application, the Strength Assistant has several specific requirements. The architecture is built on React Native (Expo) to target both iOS and Android from a single codebase. A critical requirement is the **offline-first** capability, ensuring the app is fully functional for logging workouts without an internet connection. For the MVP, push notifications are not required, but the architecture should not preclude their addition in the future. The app will require standard device permissions for data storage. All releases must adhere to the latest Apple App Store and Google Play Store review guidelines.

{{#if endpoint_specification}}

### API Specification

{{endpoint_specification}}
{{/if}}

{{#if authentication_model}}

### Authentication & Authorization

{{authentication_model}}
{{/if}}

{{#if platform_requirements}}

### Platform Support

The application will be developed using React Native (Expo) and must be buildable for and deployable to:

*   **iOS:** Targeting the latest two major iOS versions at the time of release.
*   **Android:** Targeting a wide range of modern Android devices (API level 23+).
{{/if}}

{{#if device_features}}

### Device Capabilities

The MVP has minimal requirements for native device features:

*   **Local Storage:** The app must have permission to store data locally on the device to support its offline-first architecture. This will likely be managed via a local database like SQLite or WatermelonDB.
*   **Network Access:** The app requires network access to sync user data with the Supabase backend. This process should run opportunistically in the background when a connection is available.
{{/if}}

{{#if tenant_model}}

### Multi-Tenancy Architecture

{{tenant_model}}
{{/if}}

{{#if permission_matrix}}

### Permissions & Roles

{{permission_matrix}}
{{/if}}
{{/if}}

---

{{#if ux_principles}}

## User Experience Principles

The user experience should be clean, focused, and efficient, reflecting the app's role as a utility for serious training.

*   **Clarity over Clutter:** The UI will prioritize showing the user exactly what they need to do for their current set. Information density should be high where it matters (workout screen) and low elsewhere.
*   **Frictionless Logging:** The core action of logging a set must be achievable with minimal taps and no cognitive overhead.
*   **Data-Forward Design:** The UI will present data clearly, reinforcing the app's intelligent, data-driven nature.
*   **Dark Mode First:** The primary theme will be a dark mode, which is better suited for typical gym lighting environments.

### Key Interactions

The user's interaction with the app is centered on the workout loop.

*   **Set Completion:** Tapping a single button to complete a set, which then prompts for the difficulty/RPE.
*   **Weight/Rep Adjustment:** Easily editable fields for weight and reps for each set, pre-filled with the suggested values.
*   **Workout Navigation:** Swiping or tapping to move between exercises within a workout session.
*   **History Review:** A clear, scrollable timeline of past workouts, with the ability to tap to see details.
{{/if}}

---

## Functional Requirements

This section defines the complete set of capabilities required for the MVP.

**User Account & Authentication**
*   **FR1:** Users can create an account using an email and password.
*   **FR2:** Users can log in and log out of their account.
*   **FR3:** The user's session shall be securely maintained between app launches.
*   **FR4:** Users can reset their password via an email link.

**Workout Management**
*   **FR5:** Users can start a new, empty workout session.
*   **FR6:** Users can add exercises to the current workout session from a predefined list.
*   **FR7:** Users can end the current workout session.
*   **FR8:** Users can have only one active workout session at a time.

**Exercise Logging & Progression**
*   **FR9:** For each exercise in a workout, users can add a new set.
*   **FR10:** For each set, users can record the weight used and the number of repetitions performed.
*   **FR11:** After completing a set, users must record a difficulty score (e.g., RPE).
*   **FR12:** The system shall use the weight, reps, and difficulty score of completed sets to calculate a suggested weight for the next workout session involving that exercise.
*   **FR13:** When adding a new set, the system shall pre-fill the weight field with the suggested weight.
*   **FR14:** Users can manually override the suggested weight for any set.

**Data & Synchronization**
*   **FR15:** All workout data (workouts, exercises, sets, RPEs) must be saved locally on the device immediately after being recorded.
*   **FR16:** The application must be fully functional for all workout management and logging tasks without an internet connection.
*   **FR17:** When an internet connection is available, the app must automatically and transparently synchronize all local data with the user's account on the backend.
*   **FR18:** The system must handle synchronization conflicts, prioritizing the most recent data.

**Workout History**
*   **FR19:** Users can view a chronological list of their completed workout sessions.
*   **FR20:** Users can select a past workout session to view all of its details, including exercises, sets, reps, weights, and difficulty scores.

---

## Non-Functional Requirements

{{#if performance_requirements}}

### Performance

*   **NFR1 (Responsiveness):** All UI interactions, especially logging a set or navigating between exercises, must complete in under 200ms on a target device.
*   **NFR2 (App Launch):** The app must launch from a cold start to a usable state in under 3 seconds.
*   **NFR3 (Sync Performance):** Background data synchronization should not noticeably impact UI performance or responsiveness.
{{/if}}

{{#if security_requirements}}

### Security

*   **NFR4 (Authentication):** User passwords must be securely hashed and salted on the backend (handled by Supabase Auth).
*   **NFR5 (Data in Transit):** All communication between the app and the backend must be encrypted using TLS.
*   **NFR6 (Local Data):** Sensitive user data stored on the device should be encrypted.
{{/if}}

{{#if scalability_requirements}}

### Scalability

{{scalability_requirements}}
{{/if}}

{{#if accessibility_requirements}}

### Accessibility

*   **NFR7 (Screen Reader Support):** All interactive elements must have appropriate labels for screen readers (e.g., VoiceOver, TalkBack).
*   **NFR8 (Contrast):** Text and important UI elements must meet WCAG AA contrast ratio guidelines.
*   **NFR9 (Target Size):** All touch targets must be at least 44x44 points to be easily tappable.
{{/if}}

{{#if integration_requirements}}

### Integration

{{integration_requirements}}
{{/if}}



---

_This PRD captures the essence of strength-assistant - the intelligent, offline-first workout logger that removes the guesswork from strength progression._

_Created through collaborative discovery between BMad and AI facilitator._
