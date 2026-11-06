import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moclife.lifeos',
  appName: 'LifeOS',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover'
    },
    LocalNotifications: {
      iconColor: '#7c3aed',
      presentationOptions: ['badge', 'sound', 'banner', 'list']
    }
  }
};

export default config;
