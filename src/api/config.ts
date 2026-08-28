import { Platform } from 'react-native';

const fallbackUrl = Platform.select({
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api',
});

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL?.trim() || fallbackUrl).replace(/\/$/, '');

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
