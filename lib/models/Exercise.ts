export interface Exercise {
  id?: string;
  name: string;
}

export type ParseExerciseError = "EMPTY_NAME";

export type ParseExerciseResult = 
  | { success: true; exercise: Exercise }
  | { success: false; error: ParseExerciseError };

export function parseExercise(name: string, id?: string): ParseExerciseResult {
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { success: false, error: "EMPTY_NAME" };
  }
  
  return { 
    success: true, 
    exercise: { id, name: trimmedName } 
  };
}
