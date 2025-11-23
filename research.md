# Weekly Exercise Planner - Technical Research Findings

**Research Date**: November 22, 2025  
**Feature**: Weekly Exercise Planner for React Native/Expo App  
**Research Scope**: Calendar components, database design, sync patterns, and home screen integration

## React Native Weekly Calendar Components

**Decision**: Use `react-native-calendars` with ExpandableCalendar component

**Rationale**: 
- **Proven Stability**: Most widely adopted calendar library in React Native ecosystem with 9.4k+ GitHub stars
- **Expo Compatibility**: Explicitly documented as Expo/CRNA compatible without ejecting, implemented in pure JavaScript
- **Built-in Week View**: ExpandableCalendar component supports both month and week views with smooth transitions
- **React Native Paper Integration**: Compatible with existing Material Design system used in the app
- **Performance**: Lightweight implementation with virtual scrolling for large date ranges
- **TypeScript Support**: Full TypeScript definitions included

**Alternatives Considered**:
- **Flash Calendar (Expo)**: Excellent performance but newer library with smaller community, less proven in production
- **react-native-calendar-kit**: High performance but requires native module linking (Gesture Handler, Reanimated) which adds complexity
- **react-native-weekly-calendar**: Focused only on weekly view but lacks the expandable month/week functionality needed for future growth
- **Custom Implementation**: Would require significant development time and maintenance burden

**Implementation Notes**:
- Install: `npm install react-native-calendars`
- Use `ExpandableCalendar` + `CalendarProvider` + `AgendaList` pattern
- Configure week start day and theme to match React Native Paper design system
- Leverage existing exercise data structure for event rendering

## Supabase Table Design

**Decision**: Create junction table `exercise_schedules` with composite primary key for many-to-many relationship

**Rationale**:
- **Scalable Design**: Supports multiple exercises per day and same exercise on multiple days
- **User Isolation**: Follows existing RLS pattern with `user_id` filtering for data security
- **Efficient Queries**: Composite indexing on `(user_id, day_of_week)` for fast weekly plan retrieval
- **Future-Proof**: Can easily extend to support multiple weeks, recurring patterns, or advanced scheduling
- **Legend State Compatible**: Simple structure that maps well to observable state management

**Database Schema**:
```sql
CREATE TABLE exercise_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  order_index INTEGER DEFAULT 0, -- For ordering exercises within a day
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Composite primary key to prevent duplicate assignments
  UNIQUE(user_id, exercise_id, day_of_week)
);

-- RLS Policy
CREATE POLICY "Users can manage their own exercise schedules" ON exercise_schedules
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Performance Indexes
CREATE INDEX exercise_schedules_user_day_idx ON exercise_schedules(user_id, day_of_week);
CREATE INDEX exercise_schedules_exercise_idx ON exercise_schedules(exercise_id);
```

**Alternatives Considered**:
- **Weekly JSON Column**: Single row per user with JSON array of weekly data - rejected due to poor queryability and sync complexity
- **Daily Tables**: Separate table per day (monday_exercises, etc.) - rejected due to schema rigidity and maintenance overhead
- **Calendar Events Table**: Generic calendar approach with date ranges - rejected as over-engineering for simple weekly recurring pattern
- **Embedded in Exercises Table**: Adding day assignments directly to exercises - rejected due to normalization violations and limited flexibility

## Legend State Sync Patterns

**Decision**: Extend existing sync configuration with dedicated weekly schedule observables and bidirectional Supabase sync

**Rationale**:
- **Consistency**: Builds on proven sync patterns already established for exercises in `syncConfig.ts`
- **Real-time Updates**: Leverages existing Supabase real-time subscription pattern for immediate UI updates
- **Offline-First**: Maintains local-first architecture with optimistic updates and conflict resolution
- **Type Safety**: Full TypeScript support with proper observable typing
- **Performance**: Minimal overhead using Legend State's efficient reactivity system

**Implementation Pattern**:
```typescript
import { configureSyncedSupabase } from '@legendapp/state/sync-plugins/supabase';

// Use Legend State's built-in Supabase sync - no custom sync code
const exerciseSchedules$ = observable(
  configureSyncedSupabase({
    supabase: supabaseClient,
    collection: 'exercise_schedules',
    select: '*, exercises(id, name)',  
    filter: (userId) => `user_id.eq.${userId}`,
    realtime: true, // Automatic real-time subscriptions
    // All sync features handled automatically by Legend State:
    // - Optimistic updates, offline persistence, conflict resolution
    // - Background sync, error handling, retries
  })
);

// Computed weekly plan from synced data
const weeklyPlan$ = observable(() => {
  const schedules = exerciseSchedules$.get();
  // Transform to weekly plan structure
  return computeWeeklyPlan(schedules);
});
```

**Alternatives Considered**:
- **Direct Supabase Queries**: Without Legend State caching - rejected due to poor offline experience and performance
- **Redux Toolkit Query**: Over-engineered for simple CRUD operations and doesn't fit existing Legend State architecture
- **SWR/React Query**: Good caching but requires significant refactoring of existing data layer
- **Manual State Management**: Using useState/useEffect - rejected due to complexity of real-time sync and offline handling

## React Native Home Screen Integration

**Decision**: Replace existing `GettingStartedCard` with `WeeklyPlannerCard` component that expands to show calendar when user has exercises

**Rationale**:
- **Progressive Enhancement**: Maintains simple onboarding flow for new users while providing rich experience for active users
- **Performance**: Lazy load calendar component only when needed to maintain fast home screen load times (<3 seconds)
- **User Experience**: Contextual interface that adapts based on user's exercise library state
- **Minimal Layout Changes**: Leverages existing card-based layout pattern in the home screen

**Component Architecture**:
```typescript
// Home Screen Layout
<ScrollView style={{ padding: 16 }}>
  {hasExercises ? (
    <WeeklyPlannerCard 
      expanded={weekViewExpanded}
      onToggleExpanded={setWeekViewExpanded}
      weeklyPlan={weeklyPlan$}
      exercises={exercises$}
      onDaySelect={handleDaySelect}
      onStartWorkout={handleStartWorkout}
    />
  ) : (
    <GettingStartedCard 
      content={Locales.t("getStartedMessage")}
      call_to_action={Locales.t("getStartedCallToAction")}
      on_get_started={() => router.navigate("./exercises")}
    />
  )}
</ScrollView>
```

**Performance Optimizations**:
- Use `React.lazy()` for calendar component code splitting
- Implement virtualized rendering for exercise lists within days
- Cache weekly plan data in memory with 5-minute TTL
- Use `useMemo` for expensive day/exercise calculations
- Debounce scroll and touch events on calendar interaction

**Alternatives Considered**:
- **Full Calendar Home Screen**: Always show calendar regardless of user state - rejected as overwhelming for new users
- **Separate Weekly Plan Tab**: Add new bottom tab for planning - rejected as increases navigation complexity
- **Modal-Based Planning**: Weekly planner in overlay modal - rejected as reduces discoverability and home screen value
- **Dashboard Widgets**: Multiple small widgets approach - rejected as fragments user attention and doesn't match current design system

## Additional Technical Considerations

### State Management Integration
- Extend existing `ExerciseStore` interface to include weekly planning data
- Maintain referential integrity between exercises and schedule assignments
- Implement optimistic updates with rollback capability for poor network conditions

### Testing Strategy
- Unit tests for sync logic using existing test infrastructure in `__tests__/data/sync/`
- Integration tests for calendar component interaction with Maestro
- Contract tests for Supabase RLS policies and data relationships

### Migration Strategy
- Non-breaking addition to existing database schema
- Backward compatible API changes in repository layer
- Feature flag support for gradual rollout

### Error Handling
- Graceful degradation when offline (show cached weekly plan)
- User-friendly error messages for sync failures
- Prevent duplicate exercise assignments through database constraints

## Implementation Priority

1. **Phase 1**: Database schema and basic CRUD operations
2. **Phase 2**: Legend State sync configuration and observables  
3. **Phase 3**: Calendar UI component with basic day selection
4. **Phase 4**: Exercise assignment interface and home screen integration
5. **Phase 5**: Real-time sync, offline handling, and performance optimization

This research provides a solid foundation for implementing a performant, user-friendly weekly exercise planner that integrates seamlessly with the existing React Native/Expo application architecture.