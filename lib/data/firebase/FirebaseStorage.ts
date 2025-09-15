/**
 * Firebase Storage Backend Implementation
 * 
 * Implements the StorageBackend interface for Firebase,
 * maintaining compatibility with the existing Firebase backend.
 */

import type { ExerciseRecord } from '../../models/ExerciseRecord';
import type { UserAccount } from '../../models/UserAccount';  
import type { SyncStateRecord } from '../../models/SyncStateRecord';
import { StorageBackend } from '../supabase/SupabaseStorage';

import { 
  createExerciseRecord, 
  updateExerciseRecord, 
  validateExerciseRecord,
  ExerciseRecordInput,
  ExerciseRecordUpdate,
  toDbFormat as exerciseToDb,
  fromDbFormat as exerciseFromDb
} from '../../models/ExerciseRecord';

import {
  createAuthenticatedUser,
  validateCredentials
} from '../../models/UserAccount';

import {
  createSyncState,
  recordSyncFailure,
  isReadyForRetry,
  toDbFormat as syncToDb,
  fromDbFormat as syncFromDb
} from '../../models/SyncStateRecord';

// Firebase imports (using existing Firebase setup)
import { initFirebase, getDb } from './index';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { signInAnonymously as firebaseSignInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';

export class FirebaseStorage implements StorageBackend {
  private firestore: any;
  private auth: any;
  private currentUser: UserAccount | null = null;

  constructor() {
    // Initialize Firebase
    initFirebase();
    this.firestore = getDb();
    
    // For now, we'll use a simplified auth approach
    // In a full implementation, we'd use the existing Firebase auth setup
    this.auth = null;
    
    // Initialize current user from auth state
    this.initializeSession();
  }

  // Exercise CRUD operations
  async createExercise(exercise: Omit<ExerciseRecord, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ExerciseRecord> {
    const input: ExerciseRecordInput = {
      name: exercise.name,
      userId: exercise.userId
    };

    const newExercise = createExerciseRecord(input);
    validateExerciseRecord(newExercise);

    const docRef = await addDoc(collection(this.firestore, 'exercises'), exerciseToDb(newExercise));
    
    // Firebase generates ID, so update our record
    const exerciseWithId = { ...newExercise, id: docRef.id };
    await updateDoc(docRef, { id: docRef.id });

    return exerciseWithId;
  }

  async getExercises(userId?: string): Promise<ExerciseRecord[]> {
    let exercisesQuery;
    
    if (userId) {
      exercisesQuery = query(
        collection(this.firestore, 'exercises'),
        where('user_id', '==', userId),
        orderBy('created_at', 'asc')
      );
    } else {
      // Get exercises for anonymous user (no user_id or null user_id)
      exercisesQuery = query(
        collection(this.firestore, 'exercises'),
        where('user_id', 'in', [null, undefined]),
        orderBy('created_at', 'asc')
      );
    }

    const querySnapshot = await getDocs(exercisesQuery);
    const exercises: ExerciseRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      exercises.push(exerciseFromDb({ ...data, id: doc.id }));
    });

    return exercises;
  }

  async updateExercise(id: string, updates: Partial<Pick<ExerciseRecord, 'name'>>): Promise<ExerciseRecord> {
    const docRef = doc(this.firestore, 'exercises', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Exercise not found');
    }

    const existingData = docSnap.data();
    const existing = exerciseFromDb({ ...existingData, id: docSnap.id });
    const updated = updateExerciseRecord(existing, updates as ExerciseRecordUpdate);

    await updateDoc(docRef, exerciseToDb(updated) as any);

    return updated;
  }

  async deleteExercise(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'exercises', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Exercise not found');
    }

    await deleteDoc(docRef);
  }

  // User management
  async getCurrentUser(): Promise<UserAccount | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    const firebaseUser = this.auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    return this.mapFirebaseUserToAccount(firebaseUser);
  }

  async signInWithEmail(email: string, password: string): Promise<UserAccount> {
    validateCredentials({ email, password });

    const userCredential = await signInWithEmailAndPassword(
      this.auth, 
      email.toLowerCase().trim(), 
      password
    );

    if (!userCredential.user) {
      throw new Error('Sign in failed: No user returned');
    }

    const userAccount = this.mapFirebaseUserToAccount(userCredential.user);
    this.currentUser = userAccount;
    
    return userAccount;
  }

  async signUpWithEmail(email: string, password: string): Promise<UserAccount> {
    validateCredentials({ email, password });

    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email.toLowerCase().trim(),
      password
    );

    if (!userCredential.user) {
      throw new Error('Sign up failed: No user returned');
    }

    const userAccount = this.mapFirebaseUserToAccount(userCredential.user);
    this.currentUser = userAccount;
    
    return userAccount;
  }

  async signInAnonymously(): Promise<UserAccount> {
    const userCredential = await firebaseSignInAnonymously(this.auth);
    
    if (!userCredential.user) {
      throw new Error('Anonymous sign in failed');
    }

    const userAccount = this.mapFirebaseUserToAccount(userCredential.user);
    this.currentUser = userAccount;
    
    return userAccount;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
    this.currentUser = null;
  }

  // Sync management
  async getPendingSyncRecords(): Promise<SyncStateRecord[]> {
    const querySnapshot = await getDocs(
      query(collection(this.firestore, 'sync_states'), orderBy('pending_since', 'asc'))
    );

    const syncStates: SyncStateRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const syncState = syncFromDb({ ...data, record_id: doc.id });
      
      if (isReadyForRetry(syncState)) {
        syncStates.push(syncState);
      }
    });

    return syncStates;
  }

  async markSyncComplete(recordId: string): Promise<void> {
    const docRef = doc(this.firestore, 'sync_states', recordId);
    await deleteDoc(docRef);
  }

  async markSyncError(recordId: string, errorMessage: string): Promise<void> {
    const docRef = doc(this.firestore, 'sync_states', recordId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create new sync error record
      const syncState = createSyncState({
        recordId,
        recordType: 'exercise',
        operation: 'create'
      });

      const failedState = recordSyncFailure(syncState, errorMessage);
      await addDoc(collection(this.firestore, 'sync_states'), syncToDb(failedState));
      return;
    }

    const existingData = docSnap.data();
    const syncState = syncFromDb({ ...existingData, record_id: docSnap.id });
    const failedState = recordSyncFailure(syncState, errorMessage);

    await updateDoc(docRef, syncToDb(failedState) as any);
  }

  // Real-time subscriptions
  subscribeToExercises(userId: string, callback: (exercises: ExerciseRecord[]) => void): () => void {
    let exercisesQuery;
    
    if (userId) {
      exercisesQuery = query(
        collection(this.firestore, 'exercises'),
        where('user_id', '==', userId),
        orderBy('created_at', 'asc')
      );
    } else {
      exercisesQuery = query(
        collection(this.firestore, 'exercises'),
        where('user_id', 'in', [null, undefined]),
        orderBy('created_at', 'asc')
      );
    }

    return onSnapshot(exercisesQuery, (snapshot) => {
      const exercises: ExerciseRecord[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        exercises.push(exerciseFromDb({ ...data, id: doc.id }));
      });
      
      callback(exercises);
    });
  }

  subscribeToAuthState(callback: (user: UserAccount | null) => void): () => void {
    return onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        const userAccount = this.mapFirebaseUserToAccount(firebaseUser);
        this.currentUser = userAccount;
        callback(userAccount);
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
  }

  // Private helper methods
  private initializeSession(): void {
    const firebaseUser = this.auth.currentUser;
    
    if (firebaseUser) {
      this.currentUser = this.mapFirebaseUserToAccount(firebaseUser);
    }
  }

  private mapFirebaseUserToAccount(user: User): UserAccount {
    const isAnonymous = user.isAnonymous;
    
    if (isAnonymous) {
      return {
        id: user.uid,
        isAnonymous: true,
        createdAt: new Date(user.metadata.creationTime || Date.now())
      };
    }

    if (!user.email) {
      throw new Error('Non-anonymous user must have email');
    }

    return createAuthenticatedUser(user.email);
  }

  // Development/testing utilities
  async clearAllData(): Promise<void> {
    // Only available in development/testing
    if (process.env.NODE_ENV === 'production') {
      throw new Error('clearAllData is not available in production');
    }

    // This is a simplified implementation - in practice you'd batch delete
    const exercises = await getDocs(collection(this.firestore, 'exercises'));
    const syncStates = await getDocs(collection(this.firestore, 'sync_states'));

    const deletePromises: Promise<void>[] = [];
    
    exercises.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    syncStates.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
  }
}