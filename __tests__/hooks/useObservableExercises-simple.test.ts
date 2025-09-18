import { renderHook } from '@testing-library/react-native';
import { Exercise } from '@/lib/models/Exercise';

// Mock the store module with a simple implementation
const mockObservable = {
  get: jest.fn<Exercise[], []>(() => []),
  set: jest.fn(),
};

jest.mock('@/lib/data/store', () => ({
  exercises$: mockObservable,
}));

// Mock Legend State with a simple implementation
jest.mock('@legendapp/state/react', () => ({
  useObservable: jest.fn(() => mockObservable),
}));

import { useObservableExercises } from '@/lib/hooks/useObservableExercises';

describe('useObservableExercises - Basic Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockObservable.get.mockReturnValue([]);
  });

  it('should return the hook interface', () => {
    const { result } = renderHook(() => useObservableExercises());

    expect(result.current).toHaveProperty('exercises');
    expect(result.current).toHaveProperty('addExercise');
    expect(result.current).toHaveProperty('removeExercise');
    expect(result.current).toHaveProperty('updateExercise');
    expect(typeof result.current.addExercise).toBe('function');
    expect(typeof result.current.removeExercise).toBe('function');
    expect(typeof result.current.updateExercise).toBe('function');
  });

  it('should return exercises from observable', () => {
    const mockExercises: Exercise[] = [
      {
        id: '1',
        name: 'Push-ups',
        user_id: 'user1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted: false,
      },
    ];

    mockObservable.get.mockReturnValue(mockExercises);

    const { result } = renderHook(() => useObservableExercises());

    expect(result.current.exercises).toEqual(mockExercises);
  });
});