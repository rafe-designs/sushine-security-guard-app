import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './src/App';

// Register the root component for both mobile (Android/iOS) and web platforms automatically
registerRootComponent(App);

// Register Service Worker for offline PWA support on iOS/Web
if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('ServiceWorker registration failed:', err);
    });
  });
}