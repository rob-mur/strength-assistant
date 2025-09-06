import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observable } from "@legendapp/state";
import { initializeFirebaseServices, getDb } from "../data/firebase/initializer";
import { 
  FirebaseFirestoreTypes
} from "@react-native-firebase/firestore";
import { logger } from "../data/firebase/logger";
import { RepositoryLogger } from "./utils/LoggingUtils";
import { RepositoryUtils } from "./utils/RepositoryUtils";

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
        
        // Validate that Firebase is actually ready
        const db = getDb();
        if (!db) {
          throw new Error("Firebase initialization completed but Firestore instance is not available");
        }
        
        this.initialized = true;
        RepositoryLogger.logSuccess("FirebaseExerciseRepo", "initialize");
      } catch (error: any) {
        RepositoryLogger.logError("FirebaseExerciseRepo", "initialize Firebase services", error);
        this.initialized = false; // Ensure we retry on next call
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
      if (!db) {
        throw new Error("Firebase Firestore instance is not available. Ensure Firebase is properly initialized.");
      }
      const exercisesCollection = db.collection(RepositoryUtils.getExercisesCollectionPath(userId));
      
      const newExercise = {
        name: sanitizedName,
        created_at: new Date().toISOString()
      };

      await exercisesCollection.add(newExercise);
      
      RepositoryLogger.logSuccess("FirebaseExerciseRepo", "addExercise");
    } catch (error: any) {
      RepositoryLogger.logError("FirebaseExerciseRepo", "add exercise", error);
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
      const exercisesQuery = this.createExercisesQuery(userId);
      
      // Set up real-time listener
      const unsubscribe = exercisesQuery.onSnapshot((snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        const exercises = this.processSnapshot(snapshot, userId);
        exercises$.set(exercises);
      });

      // Store unsubscribe function for cleanup
      (exercises$ as any)._unsubscribe = unsubscribe;
      
      RepositoryLogger.logSuccess("FirebaseExerciseRepo", "getExercises");
    } catch (error: any) {
      RepositoryLogger.logError("FirebaseExerciseRepo", "get exercises", error);
    }
    
    return exercises$;
  }

  /**
   * Subscribe to real-time exercise updates
   */
  subscribeToExercises(userId: string, callback: (exercises: Exercise[]) => void): () => void {
    this.ensureInitialized();
    
    try {
      const exercisesQuery = this.createExercisesQuery(userId);
      
      const unsubscribe = exercisesQuery.onSnapshot((snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
        const exercises = this.processSnapshot(snapshot, userId);
        callback(exercises);
      });
      
      RepositoryLogger.logSuccess("FirebaseExerciseRepo", "subscribeToExercises");
      
      return unsubscribe;
    } catch (error: any) {
      RepositoryLogger.logError("FirebaseExerciseRepo", "subscribe to exercises", error);
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
      RepositoryUtils.validateExerciseId(exerciseId);

      const db = getDb();
      if (!db) {
        throw new Error("Firebase Firestore instance is not available. Ensure Firebase is properly initialized.");
      }
      const exerciseDoc = db.collection(RepositoryUtils.getExercisesCollectionPath(userId)).doc(exerciseId);
      
      await exerciseDoc.delete();
      
      RepositoryLogger.logSuccess("FirebaseExerciseRepo", "deleteExercise");
    } catch (error: any) {
      RepositoryLogger.logError("FirebaseExerciseRepo", "delete exercise", error);
      throw error;
    }
  }


  /**
   * Get a specific exercise by ID for a user
   */
  async getExerciseById(exerciseId: string, userId: string): Promise<Exercise | undefined> {
    try {
      const exercises$ = this.getExercises(userId);
      const exercises = exercises$.get();
      return exercises.find(exercise => exercise.id === exerciseId);
    } catch (error: any) {
      RepositoryLogger.logError("FirebaseExerciseRepo", "get exercise by ID", error);
      return undefined;
    }
  }

  // Offline-first capabilities (Firebase doesn't directly support these, so we provide defaults)
  /**
   * Check if the repository is currently syncing data
   */
  isSyncing(): boolean {
    return false;
  }

  /**
   * Check if the repository is currently online
   */
  isOnline(): boolean {
    return navigator.onLine ?? true;
  }

  /**
   * Get the count of pending changes that need to be synced
   */
  getPendingChangesCount(): number {
    return 0;
  }

  /**
   * Force synchronization of pending changes
   */
  async forceSync(): Promise<void> {
    // Firebase handles sync automatically, no-op
    return Promise.resolve();
  }

  /**
   * Check if there are any sync errors
   */
  hasErrors(): boolean {
    return false;
  }

  /**
   * Get the current error message if any
   */
  getErrorMessage(): string | null {
    return null;
  }

  /**
   * Create an exercises query for the given user
   */
  private createExercisesQuery(userId: string) {
    const db = getDb();
    if (!db) {
      throw new Error("Firebase Firestore instance is not available. Ensure Firebase is properly initialized.");
    }
    const exercisesCollection = db.collection(RepositoryUtils.getExercisesCollectionPath(userId));
    return exercisesCollection.orderBy("created_at", "desc");
  }

  /**
   * Process snapshot data and convert to Exercise array
   */
  private processSnapshot(snapshot: FirebaseFirestoreTypes.QuerySnapshot, userId: string): Exercise[] {
    const exercises: Exercise[] = [];
    snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      const data = doc.data();
      if (RepositoryUtils.validateExerciseData(data)) {
        exercises.push({
          id: doc.id,
          name: data.name,
          user_id: userId,
          created_at: data.created_at
        });
      }
    });
    return exercises;
  }

}