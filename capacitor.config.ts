import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.604177a7390446d8a552a5c8498bae13',
  appName: 'GuineeGo LAT',
  webDir: 'dist',
  
  // Hot reload from Lovable preview during development
  server: {
    url: 'https://604177a7-3904-46d8-a552-a5c8498bae13.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'GuineeGo',
    backgroundColor: '#ffffff'
  },
  
  // Android specific configuration
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  
  // Plugins configuration
  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    // Geolocation for courier tracking
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    },
    
    // Camera for product photos & QR scanning
    Camera: {
      presentationStyle: 'fullscreen',
      saveToGallery: false
    },
    
    // Keyboard behavior
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    
    // Status bar styling
    StatusBar: {
      style: 'dark',
      backgroundColor: '#E63946'
    },
    
    // Splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#E63946',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
