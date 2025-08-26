import React from 'react';
import { Platform, Text, TextStyle, StyleSheet } from 'react-native';

interface WebIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle;
  testID?: string;
}

/**
 * Web-compatible icon component that uses Unicode characters for web platform
 * and falls back to emoji representations for unsupported platforms.
 * 
 * This component solves the TTF font sanitizer issues in Firebase deployments by avoiding
 * font files entirely and using Unicode/emoji characters instead.
 */
export const WebIcon: React.FC<WebIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000000',
  style,
  testID 
}) => {
  // Map common icon names to Unicode characters and emoji
  const iconMap: Record<string, string> = {
    // Home icons
    'home': '🏠',
    'home-outline': '🏘️',
    
    // Exercise/fitness icons
    'sports-gymnastics': '🤸',
    'sports-martial-arts': '🥋',
    'fitness-center': '🏋️',
    'weight-lifter': '🏋️‍♂️',
    
    // Profile icons
    'account': '👤',
    'account-outline': '👥',
    
    // Common fallbacks
    'add': '➕',
    'delete': '🗑️',
    'edit': '✏️',
    'save': '💾',
    'cancel': '❌',
    'check': '✅',
    'menu': '☰',
    'back': '⬅️',
    'forward': '➡️',
    'up': '⬆️',
    'down': '⬇️',
  };

  const iconChar = iconMap[name] || '•';

  return (
    <Text
      testID={testID}
      style={[
        styles.icon,
        {
          fontSize: size,
          color: color,
          lineHeight: size,
          width: size,
          height: size,
        },
        style
      ]}
    >
      {iconChar}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    alignSelf: 'center',
  }
});