/// <reference types="expo-router/types/expect" />

import '@testing-library/jest-native/extend-expect';
import { load } from '@expo/env';

jest.mock(
	'@react-native-async-storage/async-storage',
	() => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock').default
);

jest.mock('expo-constants', () => jest.requireActual('expo-constants').default);

jest.mock(
	'react-native-safe-area-context',
	() => jest.requireActual('react-native-safe-area-context/jest/mock').default
);

load(process.cwd());

