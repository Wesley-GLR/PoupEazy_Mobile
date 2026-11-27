import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

export const PRIVACY_POLICY_URL = 'https://poup-eazy.vercel.app/privacidade';

export async function openPrivacyPolicy() {
  try {
    await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  } catch {
    Alert.alert(
      'Não foi possível abrir a política de privacidade',
      `Tente novamente ou acesse ${PRIVACY_POLICY_URL} no navegador.`,
    );
  }
}
