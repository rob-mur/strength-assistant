export interface Workout {
  id?: string;
  exerciseName: string;
  date: string;
  weight: number;
  reps: number;
  rpe: number; // Rate of Perceived Exertion (6.5-10)
  unit: 'kg' | 'lbs';
}