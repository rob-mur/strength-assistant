export interface Workout {
  id?: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  rpe: number;
  unit: 'kg' | 'lbs';
}