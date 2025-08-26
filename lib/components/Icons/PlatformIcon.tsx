import React from 'react';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { WebIcon } from './WebIcon';

interface PlatformIconProps {
  library: 'MaterialCommunityIcons' | 'MaterialIcons';
  name: string;
  size?: number;
  color?: string;
  focused?: boolean;
  testID?: string;
}

/**
 * Platform-aware icon component that automatically switches between:
 * - Web: CSS-based Material Design Icons (no TTF font issues)
 * - Native: @expo/vector-icons (works perfectly on mobile)
 * 
 * This solves the Firebase deployment font sanitizer issues while maintaining
 * full functionality across all platforms.
 */
export const PlatformIcon: React.FC<PlatformIconProps> = (props) => {
  const { library, name, size = 24, color, focused, testID, ...otherProps } = props;

  // For web platform, use our CSS-based WebIcon
  if (Platform.OS === 'web') {
    return (
      <WebIcon 
        name={name}
        size={size}
        color={color}
        testID={testID}
      />
    );
  }

  // For native platforms, use the original @expo/vector-icons
  if (library === 'MaterialCommunityIcons') {
    return (
      <MaterialCommunityIcons
        name={name as any}
        size={size}
        color={color}
        testID={testID}
        {...otherProps}
      />
    );
  }

  if (library === 'MaterialIcons') {
    return (
      <MaterialIcons
        name={name as any}
        size={size}
        color={color}
        testID={testID}
        {...otherProps}
      />
    );
  }

  // Fallback - should not reach here
  return null;
};