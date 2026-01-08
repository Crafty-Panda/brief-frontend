import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brief.app',
  appName: 'Brief',
  webDir: 'dist',
  server: {
    // For development: uncomment to use local server
    // url: 'http://localhost:8080',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    allowMixedContent: true, // Allow HTTP connections (useful for development)
  },
  ios: {
    scheme: 'Brief',
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
    },
  },
};

export default config;
