import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moclife.lifeos',
  appName: 'LifeOS',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
