/**
 * HomeScreen Tests - Comprehensive Coverage
 * 
 * Essential test coverage for the home screen focusing on:
 * - Screen rendering and component structure
 * - Navigation functionality 
 * - Localization integration
 * - User interaction handling
 * - Debug logging in test environments
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)';

// Mock expo-router
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock GettingStartedCard component
jest.mock('@/lib/components/Cards/GettingStartedCard', () => {
  const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
  return ({ content, call_to_action, on_get_started, style }: any) => (
    <View testID="getting-started-card" style={style}>
      <Text testID="card-content">{content}</Text>
      <TouchableOpacity testID="get-started" onPress={on_get_started} accessibilityRole="button">
        <Text testID="card-cta">{call_to_action}</Text>
      </TouchableOpacity>
    </View>
  );
});

// Mock locales
jest.mock('@/lib/locales', () => ({
  Locales: {
    t: jest.fn((key: string) => {
      const translations: Record<string, string> = {
        getStartedMessage: 'Welcome to your fitness journey!',
        getStartedCallToAction: 'Get Started',
      };
      return translations[key] || key;
    }),
  },
}));

describe('HomeScreen', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  describe('Component Rendering', () => {
    it('should render the getting started card', () => {
      const { getByTestId } = render(<HomeScreen />);
      
      expect(getByTestId('getting-started-card')).toBeTruthy();
    });

    it('should apply correct padding style', () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const card = getByTestId('getting-started-card');
      expect(card.props.style).toEqual({ padding: 16 });
    });

    it('should display localized content', () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const content = getByTestId('card-content');
      const cta = getByTestId('card-cta');
      
      expect(content.props.children).toBe('Welcome to your fitness journey!');
      expect(cta.props.children).toBe('Get Started');
    });
  });

  describe('Navigation', () => {
    it('should navigate to exercises on get started button press', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const getStartedButton = getByTestId('get-started');
      fireEvent.press(getStartedButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('./exercises');
      });
    });

    it('should handle multiple navigation calls', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const getStartedButton = getByTestId('get-started');
      
      fireEvent.press(getStartedButton);
      fireEvent.press(getStartedButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(2);
        expect(mockNavigate).toHaveBeenNthCalledWith(1, './exercises');
        expect(mockNavigate).toHaveBeenNthCalledWith(2, './exercises');
      });
    });
  });

  describe('User Interaction', () => {
    it('should handle get started button press', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const getStartedButton = getByTestId('get-started');
      fireEvent.press(getStartedButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('./exercises');
      });
    });

    it('should be accessible for users', () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const getStartedButton = getByTestId('get-started');
      expect(getStartedButton).toBeTruthy();
      expect(getStartedButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('Debug Logging', () => {
    beforeEach(() => {
      // Clear environment variables before each test
      delete process.env.CHROME_TEST;
      delete process.env.CI;
    });

    it('should log component render in Chrome test environment', () => {
      process.env.CHROME_TEST = 'true';
      
      render(<HomeScreen />);
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 HomeScreen: Component rendered');
    });

    it('should log component render in CI environment', () => {
      process.env.CI = 'true';
      
      render(<HomeScreen />);
      
      expect(consoleSpy).toHaveBeenCalledWith('🔍 HomeScreen: Component rendered');
    });

    it('should log navigation in Chrome test environment', async () => {
      process.env.CHROME_TEST = 'true';
      
      const { getByTestId } = render(<HomeScreen />);
      
      fireEvent.press(getByTestId('get-started'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('🔍 HomeScreen: Navigating to exercises screen');
      });
    });

    it('should log navigation in CI environment', async () => {
      process.env.CI = 'true';
      
      const { getByTestId } = render(<HomeScreen />);
      
      fireEvent.press(getByTestId('get-started'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('🔍 HomeScreen: Navigating to exercises screen');
      });
    });

    it('should not log in normal environment', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      fireEvent.press(getByTestId('get-started'));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Localization Integration', () => {
    it('should call Locales.t with correct keys', () => {
      const { Locales } = require('@/lib/locales');
      
      render(<HomeScreen />);
      
      expect(Locales.t).toHaveBeenCalledWith('getStartedMessage');
      expect(Locales.t).toHaveBeenCalledWith('getStartedCallToAction');
    });

    it('should handle missing translation keys gracefully', () => {
      const { Locales } = require('@/lib/locales');
      Locales.t.mockImplementation((key: string) => key);
      
      const { getByTestId } = render(<HomeScreen />);
      
      const content = getByTestId('card-content');
      const cta = getByTestId('card-cta');
      
      expect(content.props.children).toBe('getStartedMessage');
      expect(cta.props.children).toBe('getStartedCallToAction');
    });
  });

  describe('Component Structure', () => {
    it('should render without crashing', () => {
      expect(() => render(<HomeScreen />)).not.toThrow();
    });

    it('should have proper component hierarchy', () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const card = getByTestId('getting-started-card');
      const content = getByTestId('card-content');
      const button = getByTestId('get-started');
      const cta = getByTestId('card-cta');
      
      expect(card).toContainElement(content);
      expect(card).toContainElement(button);
      expect(button).toContainElement(cta);
    });
  });

  describe('Integration', () => {
    it('should integrate properly with router navigation', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      const getStartedButton = getByTestId('get-started');
      fireEvent.press(getStartedButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('./exercises');
      });
    });

    it('should integrate with localization system', () => {
      const { Locales } = require('@/lib/locales');
      
      render(<HomeScreen />);
      
      expect(Locales.t).toHaveBeenCalledTimes(2);
    });
  });
});
