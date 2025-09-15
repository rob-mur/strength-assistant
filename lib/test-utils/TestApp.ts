/**
 * TestApp Implementation
 * 
 * Application-level test utility that provides a mock React Native Expo app
 * context for integration testing. Complements TestDevice by providing
 * higher-level app simulation including navigation, UI context, and
 * cross-component interactions.
 */

import { TestDevice } from './TestDevice';
import { Exercise } from '../models/Exercise';
import { UserAccount } from '../models/UserAccount';

export interface TestAppOptions {
  testId?: string;
  device?: TestDevice;
}

/**
 * TestApp class for application-level testing
 * 
 * Provides mock app context, navigation, and UI simulation for integration tests.
 * Works in conjunction with TestDevice for complete testing scenarios.
 */
export class TestApp {
  private device: TestDevice;
  private currentScreen: string = 'home';
  private navigationStack: string[] = ['home'];
  private modalStack: string[] = [];
  private theme: 'light' | 'dark' = 'light';
  private initialized: boolean = false;
  private testId: string;

  constructor(options: TestAppOptions | string = {}) {
    if (typeof options === 'string') {
      // Legacy string constructor
      this.device = new TestDevice(options);
      this.testId = options;
    } else {
      // New options constructor
      this.testId = options.testId || 'TestApp';
      this.device = options.device || new TestDevice(this.testId);
    }
  }

  // App Lifecycle
  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('TestApp is already initialized');
    }

    // Only init the device if it's not already initialized
    if (!this.device.initialized) {
      await this.device.init();
    }
    
    // Reset app state
    this.currentScreen = 'home';
    this.navigationStack = ['home'];
    this.modalStack = [];
    this.theme = 'light';
    
    this.initialized = true;
  }

  async cleanup(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await this.device.cleanup();
    
    // Reset app state
    this.currentScreen = 'home';
    this.navigationStack = ['home'];
    this.modalStack = [];
    
    this.initialized = false;
  }

  // Network and Connectivity
  async setNetworkStatus(online: boolean): Promise<void> {
    this._ensureInitialized();
    await this.device.setNetworkStatus(online);
  }

  async isOnline(): Promise<boolean> {
    this._ensureInitialized();
    return this.device.networkStatus;
  }

  async simulateNetworkIssues(enabled: boolean, config?: Record<string, unknown>): Promise<void> {
    this._ensureInitialized();
    await this.device.simulateNetworkIssues(enabled, config as any);
  }

  // Authentication Methods (delegated to device)
  async signUp(email: string, password: string): Promise<UserAccount> {
    this._ensureInitialized();
    return await this.device.signUp(email, password);
  }

  async signIn(email: string, password: string): Promise<UserAccount> {
    this._ensureInitialized();
    return await this.device.signIn(email, password);
  }

  async signOut(): Promise<void> {
    this._ensureInitialized();
    await this.device.signOut();
  }

  async signOutAll(): Promise<void> {
    this._ensureInitialized();
    await this.device.signOutAll();
  }

  async getCurrentUser(): Promise<UserAccount | null> {
    this._ensureInitialized();
    const user = this.device.authState.currentUser || null;
    
    // Return user as-is since UserAccount interface doesn't include isAuthenticated
    // The test should check isAnonymous property instead
    return user;
  }

  async isAuthenticated(): Promise<boolean> {
    this._ensureInitialized();
    return this.device.authState.authenticated;
  }

  // Navigation Simulation
  async navigateToHome(): Promise<void> {
    this._ensureInitialized();
    await this._simulateNavigation();
    this._pushToStack('home');
    this.currentScreen = 'home';
  }

  async navigateToExerciseList(): Promise<void> {
    this._ensureInitialized();
    await this._simulateNavigation();
    this._pushToStack('exercises');
    this.currentScreen = 'exercises';
  }

  async navigateToExerciseCreation(): Promise<void> {
    this._ensureInitialized();
    await this._simulateNavigation();
    this._pushToStack('exercises/add');
    this.currentScreen = 'exercises/add';
  }

  async navigateToWorkout(): Promise<void> {
    this._ensureInitialized();
    await this._simulateNavigation();
    this._pushToStack('workout');
    this.currentScreen = 'workout';
  }

  async navigateBack(): Promise<void> {
    this._ensureInitialized();
    
    if (this.navigationStack.length <= 1) {
      throw new Error('Cannot navigate back from root screen');
    }
    
    await this._simulateNavigation();
    this.navigationStack.pop();
    this.currentScreen = this.navigationStack[this.navigationStack.length - 1];
  }

  async getCurrentScreen(): Promise<string> {
    this._ensureInitialized();
    return this.currentScreen;
  }

  async getNavigationStack(): Promise<string[]> {
    this._ensureInitialized();
    return [...this.navigationStack];
  }

  // Modal Management
  async openModal(modalName: string): Promise<void> {
    this._ensureInitialized();
    await this._simulateNavigation();
    this.modalStack.push(modalName);
  }

  async closeModal(): Promise<void> {
    this._ensureInitialized();
    
    if (this.modalStack.length === 0) {
      throw new Error('No modal open to close');
    }
    
    await this._simulateNavigation();
    this.modalStack.pop();
  }

  async isModalOpen(modalName?: string): Promise<boolean> {
    this._ensureInitialized();
    
    if (modalName) {
      return this.modalStack.includes(modalName);
    }
    
    return this.modalStack.length > 0;
  }

  // Exercise Operations (delegated to device with UI simulation)
  async addExercise(name: string): Promise<Exercise> {
    this._ensureInitialized();
    
    // Simulate UI interaction delay
    await this._simulateUIInteraction();
    
    return await this.device.addExercise(name) as any;
  }

  async updateExercise(id: string, name: string): Promise<Exercise> {
    this._ensureInitialized();
    
    // Simulate UI interaction delay
    await this._simulateUIInteraction();
    
    return await this.device.updateExercise(id, name) as any;
  }

  async deleteExercise(id: string): Promise<void> {
    this._ensureInitialized();
    
    // Simulate UI interaction delay
    await this._simulateUIInteraction();
    
    await this.device.deleteExercise(id);
  }

  async getExercises(): Promise<Exercise[]> {
    this._ensureInitialized();
    return await this.device.getExercises() as any;
  }

  async getExercise(id: string): Promise<Exercise | null> {
    this._ensureInitialized();
    return await this.device.getExercise(id);
  }

  // UI State Simulation
  async getExerciseList(): Promise<string[]> {
    this._ensureInitialized();
    
    const exercises = await this.device.getExercises();
    return exercises.map(ex => ex.name);
  }

  async getExerciseCount(): Promise<number> {
    this._ensureInitialized();
    
    const exercises = await this.device.getExercises();
    return exercises.length;
  }

  async isExerciseVisible(name: string): Promise<boolean> {
    this._ensureInitialized();
    
    const exerciseList = await this.getExerciseList();
    return exerciseList.includes(name);
  }

  // Theme and UI State
  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    this._ensureInitialized();
    this.theme = theme;
    await this._simulateUIUpdate();
  }

  async getTheme(): Promise<'light' | 'dark'> {
    this._ensureInitialized();
    return this.theme;
  }

  // Sync Status and Operations
  async getSyncStatus(exerciseId?: string): Promise<{ hasErrors: boolean; errorMessage?: string }> {
    this._ensureInitialized();
    
    if (exerciseId) {
      return await this.device.getSyncStatus(exerciseId) as any;
    }
    
    // Return overall sync status in expected format
    const pendingOps = await this.device.getPendingSyncOperations();
    return {
      hasErrors: pendingOps.some(op => op.status === 'error'),
      errorMessage: (pendingOps.find(op => op.status === 'error') as any)?.error?.message
    };
  }

  async waitForSync(timeoutMs: number = 10000): Promise<void> {
    this._ensureInitialized();
    await this.device.waitForSyncComplete(timeoutMs);
  }

  async retryFailedSyncs(): Promise<void> {
    this._ensureInitialized();
    await this.device.retryFailedSyncs();
  }

  // Form and Input Simulation
  async fillForm(_formData: Record<string, string>): Promise<void> {
    this._ensureInitialized();
    
    // Simulate form filling delay
    await this._simulateUIInteraction();
    
    // Form data would be processed by the actual form components
    // This is just for test simulation
  }

  async submitForm(): Promise<void> {
    this._ensureInitialized();
    
    // Simulate form submission delay
    await this._simulateUIInteraction();
  }

  async tapButton(buttonName: string): Promise<void> {
    this._ensureInitialized();
    
    // Simulate button tap delay
    await this._simulateUIInteraction();
    
    // Handle common button actions
    switch (buttonName.toLowerCase()) {
      case 'add exercise':
      case 'add':
        await this.navigateToExerciseCreation();
        break;
      case 'save':
      case 'submit':
        await this.submitForm();
        break;
      case 'back':
        await this.navigateBack();
        break;
      case 'home':
        await this.navigateToHome();
        break;
      case 'exercises':
        await this.navigateToExerciseList();
        break;
      default:
        // Generic button tap simulation
        break;
    }
  }

  // Wait and Timing Utilities
  async waitFor(ms: number): Promise<void> {
    return await this.device.waitFor(ms);
  }

  async waitForElement(elementName: string, timeoutMs: number = 5000): Promise<void> {
    this._ensureInitialized();
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      // Simulate element presence check
      await this.waitFor(100);
      
      // In a real implementation, this would check for actual UI elements
      // For testing purposes, we assume elements exist based on current screen
      const isElementVisible = await this._isElementVisible(elementName);
      if (isElementVisible) {
        return;
      }
    }
    
    throw new Error(`Element '${elementName}' not found within ${timeoutMs}ms`);
  }

  // Device State Access
  async getDeviceState(): Promise<Record<string, unknown>> {
    this._ensureInitialized();
    return this.device.getDeviceState() as any;
  }

  async getAppState(): Promise<Record<string, unknown>> {
    this._ensureInitialized();
    return {
      app: {
        initialized: this.initialized,
        currentScreen: this.currentScreen,
        navigationStack: [...this.navigationStack],
        modalStack: [...this.modalStack],
        theme: this.theme
      },
      device: this.device.getDeviceState()
    };
  }

  // App Restart Simulation
  async restart(): Promise<void> {
    this._ensureInitialized();
    
    // Preserve user state and data across restart
    const currentUser = this.device.authState.currentUser;
    const exercises = await this.device.getExercises();
    
    // Simulate app shutdown
    await this.cleanup();
    
    // Pre-set user state before init to ensure it's preserved
    if (currentUser) {
      (this.device as any)._authState = {
        authenticated: !currentUser.isAnonymous,
        currentUser: currentUser,
        session: currentUser.isAnonymous ? undefined : { userId: currentUser.id }
      };
    }
    
    // Simulate app startup
    await this.init();
    
    // Restore exercises - need to access the internal state since getExercises() returns transformed format
    // Convert back from contract format to internal Exercise format
    for (const exercise of exercises) {
      const internalExercise = {
        id: exercise.id,
        name: exercise.name,
        user_id: exercise.userId || currentUser?.id || 'anonymous',
        created_at: exercise.createdAt,
        updated_at: exercise.updatedAt,
        deleted: false
      };
      
      // Add to internal exercises array directly
      (this.device as any)._exercises.push(internalExercise);
      
      // Restore sync queue entries if they were pending
      if (exercise.syncStatus === 'pending') {
        (this.device as any)._addToSyncQueue('create', exercise.id, 'exercise', internalExercise);
      }
    }
  }
  
  // Sync state management
  async getSyncState(): Promise<Record<string, unknown>> {
    this._ensureInitialized();
    
    // Get pending sync operations count from the device's sync queue
    const pendingChanges = this.device.getPendingSyncCount();
    
    return {
      isOnline: this.device.isNetworkConnected(),
      isSyncing: false,
      lastSyncAt: undefined,
      pendingChanges,
      errors: []
    };
  }
  
  // Storage configuration
  async getStorageConfig(): Promise<Record<string, unknown>> {
    this._ensureInitialized();
    
    return {
      local: {
        name: 'strengthassistant_test',
        asyncStorage: {
          preload: true
        }
      },
      sync: {
        enabled: false
      }
    };
  }
  
  // Feature flags
  async getFeatureFlags(): Promise<Record<string, unknown>> {
    this._ensureInitialized();
    
    return {
      useSupabaseData: false
    };
  }

  // Subscription Management
  subscribeToExerciseChanges(callback: (exercises: Exercise[]) => void): () => void {
    this._ensureInitialized();
    return this.device.subscribeToExerciseChanges(callback);
  }

  // Private Helper Methods
  private _ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('TestApp must be initialized before use. Call init() first.');
    }
  }

  private async _simulateNavigation(): Promise<void> {
    // Simulate navigation transition delay
    await this.waitFor(50);
  }

  private async _simulateUIInteraction(): Promise<void> {
    // Simulate UI interaction delay (touch, tap, etc.)
    await this.waitFor(25);
  }

  private async _simulateUIUpdate(): Promise<void> {
    // Simulate UI update/render delay
    await this.waitFor(10);
  }

  private _pushToStack(screen: string): void {
    // Avoid duplicate consecutive screens
    const lastScreen = this.navigationStack[this.navigationStack.length - 1];
    if (lastScreen !== screen) {
      this.navigationStack.push(screen);
    }
  }

  private async _isElementVisible(elementName: string): Promise<boolean> {
    // Simulate element visibility check based on current screen and modal state
    const normalizedElement = elementName.toLowerCase();
    
    // Check modal elements first
    if (this.modalStack.length > 0) {
      const currentModal = this.modalStack[this.modalStack.length - 1];
      return normalizedElement.includes(currentModal);
    }
    
    // Check screen-specific elements
    switch (this.currentScreen) {
      case 'home':
        return ['welcome', 'home', 'navigation'].some(keyword => 
          normalizedElement.includes(keyword)
        );
      case 'exercises':
        return ['exercise', 'list', 'add', 'exercise list'].some(keyword => 
          normalizedElement.includes(keyword)
        );
      case 'exercises/add':
        return ['form', 'input', 'save', 'submit', 'exercise name'].some(keyword => 
          normalizedElement.includes(keyword)
        );
      case 'workout':
        return ['workout', 'start', 'exercise'].some(keyword => 
          normalizedElement.includes(keyword)
        );
      default:
        return false;
    }
  }
}

// Export for tests
export default TestApp;