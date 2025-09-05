import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observable } from "@legendapp/state";
import { initializeFirebaseServices, getDb } from "../data/firebase/initializer";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe
} from "firebase/firestore";
import { logger } from "../data/firebase/logger";

/**
 * Firebase implementation of ExerciseRepo
 * Uses Firebase Firestore for data persistence with real-time updates
 */
export class FirebaseExerciseRepo implements IExerciseRepo {
  private static instance: FirebaseExerciseRepo;
  private initialized = false;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): FirebaseExerciseRepo {
    if (!FirebaseExerciseRepo.instance) {
      FirebaseExerciseRepo.instance = new FirebaseExerciseRepo();
    }
    return FirebaseExerciseRepo.instance;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      try {
        initializeFirebaseServices();
        this.initialized = true;
        logger.info("Firebase Exercise Repository initialized", {
          service: "FirebaseExerciseRepo",
          operation: "init"
        });
      } catch (error: any) {
        logger.error("Failed to initialize Firebase services", {
          service: "FirebaseExerciseRepo",
          operation: "init",
          error: { message: error.message, stack: error.stack }
        });
        throw error;
      }
    }
  }

  /**
   * Add a new exercise to Firebase Firestore
   */
  async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Validate and sanitize input
      ExerciseValidator.validateExerciseInput(exercise);
      const sanitizedName = ExerciseValidator.sanitizeExerciseName(exercise.name);

      const db = getDb();
      const exercisesCollection = collection(db, this.getExercisesCollectionPath(userId));
      
      const newExercise = {
        name: sanitizedName,
        created_at: new Date().toISOString()
      };

      await addDoc(exercisesCollection, newExercise);
      
      logger.info("Exercise added successfully", {
        service: "FirebaseExerciseRepo",
        operation: "addExercise",
        userId: userId.substring(0, 8) + "..."
      });
    } catch (error: any) {
      logger.error("Failed to add exercise", {
        service: "FirebaseExerciseRepo",
        operation: "addExercise",
        userId: userId.substring(0, 8) + "...",
        error: { message: error.message, stack: error.stack }
      });
      throw error;
    }
  }

  /**
   * Get all exercises as an Observable
   */
  getExercises(userId: string): Observable<Exercise[]> {
    this.ensureInitialized();
    
    const exercises$ = observable<Exercise[]>([]);
    
    try {
      const db = getDb();
      const exercisesCollection = collection(db, this.getExercisesCollectionPath(userId));
      const exercisesQuery = query(exercisesCollection, orderBy("created_at", "desc"));
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
        const exercises: Exercise[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (this.validateExerciseData(data)) {
            exercises.push({
              id: doc.id,
              name: data.name,
              user_id: userId,
              created_at: data.created_at
            });
          }
        });
        exercises$.set(exercises);
      });

      // Store unsubscribe function for cleanup
      (exercises$ as any)._unsubscribe = unsubscribe;
      
      logger.info("Exercise subscription established", {
        service: "FirebaseExerciseRepo",
        operation: "getExercises",
        userId: userId.substring(0, 8) + "..."
      });
    } catch (error: any) {
      logger.error("Failed to get exercises", {
        service: "FirebaseExerciseRepo",
        operation: "getExercises",
        userId: userId.substring(0, 8) + "...",
        error: { message: error.message, stack: error.stack }
      });
    }
    
    return exercises$;
  }

  /**
   * Subscribe to real-time exercise updates
   */
  subscribeToExercises(userId: string, callback: (exercises: Exercise[]) => void): () => void {
    this.ensureInitialized();
    
    try {
      const db = getDb();
      const exercisesCollection = collection(db, this.getExercisesCollectionPath(userId));
      const exercisesQuery = query(exercisesCollection, orderBy("created_at", "desc"));
      
      const unsubscribe = onSnapshot(exercisesQuery, (snapshot) => {
        const exercises: Exercise[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (this.validateExerciseData(data)) {
            exercises.push({
              id: doc.id,
              name: data.name,
              user_id: userId,
              created_at: data.created_at
            });
          }
        });
        callback(exercises);
      });
      
      logger.info("Exercise subscription callback established", {
        service: "FirebaseExerciseRepo",
        operation: "subscribeToExercises",
        userId: userId.substring(0, 8) + "..."
      });
      
      return unsubscribe;
    } catch (error: any) {
      logger.error("Failed to subscribe to exercises", {
        service: "FirebaseExerciseRepo",
        operation: "subscribeToExercises",
        userId: userId.substring(0, 8) + "...",
        error: { message: error.message, stack: error.stack }
      });
      // Return no-op function on error
      return () => {};
    }
  }

  /**
   * Delete an exercise from Firebase Firestore
   */
  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Validate exerciseId
      if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim().length === 0) {
        throw new Error('Valid exerciseId is required');
      }

      const db = getDb();
      const exerciseDoc = doc(db, this.getExercisesCollectionPath(userId), exerciseId);
      
      await deleteDoc(exerciseDoc);
      
      logger.info("Exercise deleted successfully", {
        service: "FirebaseExerciseRepo",
        operation: "deleteExercise",
        userId: userId.substring(0, 8) + "...",
        exerciseId: exerciseId.substring(0, 8) + "..."
      });
    } catch (error: any) {
      logger.error("Failed to delete exercise", {
        service: "FirebaseExerciseRepo",
        operation: "deleteExercise",
        userId: userId.substring(0, 8) + "...",
        exerciseId: exerciseId.substring(0, 8) + "...",
        error: { message: error.message, stack: error.stack }
      });
      throw error;
    }
  }

  /**
   * Get exercises collection path for a user
   */
  private getExercisesCollectionPath(userId: string): string {
    return `users/${userId}/exercises`;
  }

  /**
   * Validate exercise data from Firestore
   */
  private validateExerciseData(data: any): boolean {
    if (data === null || data === undefined) return false;
    if (typeof data !== 'object') return false;
    if (typeof data.name !== 'string') return false;
    if (data.name.trim().length === 0) return false;
    return true;
  }
}