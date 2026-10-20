import type { ConfigContext, ExpoConfig } from 'expo/config';

// Identificadores provisórios até o domínio ser definido (docs/decisoes.md, D14).
// O bundle ID definitivo NÃO pode mudar depois do primeiro envio às lojas.
const bundleId = process.env.APP_BUNDLE_ID ?? 'br.com.srcasamentos.app.dev';
const scheme = process.env.APP_SCHEME ?? 'srcasamentos';
// Exigido pelo plugin do Google no iOS: o "iOS URL scheme" do cliente OAuth iOS
// (com.googleusercontent.apps.<id>). Sem ele o login Google fica desativado.
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sr. Casamentos',
  slug: 'sr-casamentos',
  scheme,
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: bundleId,
    supportsTablet: true,
    usesAppleSignIn: true,
    // Sem rastreamento entre apps (briefing, seção 11): nenhum SDK de anúncios.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          // AsyncStorage/SecureStore usam UserDefaults para a sessão do app.
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  android: {
    package: bundleId,
    // Nenhuma permissão sensível nesta etapa; cada uma entra junto com o recurso que a usa.
    blockedPermissions: ['android.permission.READ_PHONE_STATE'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-apple-authentication',
    'expo-font',
    ['expo-splash-screen', { backgroundColor: '#FAF7F2', imageWidth: 200 }],
    [
      'expo-build-properties',
      // Nível exigido pelo Google Play desde 31/08/2026 (docs/setup.md).
      { android: { targetSdkVersion: 36, compileSdkVersion: 36 } },
    ],
    ...(googleIosUrlScheme
      ? [
          ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [
            string,
            Record<string, string>,
          ],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  },
});
