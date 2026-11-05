// src/hooks/useInactivityTimeout.js
import { useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';

export function useInactivityTimeout(onLogout, timeoutSeconds = 60) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      Alert.alert(
        '🔒 Session Expired',
        'You have been logged out due to 60 seconds of inactivity to protect command security.',
        [{ text: 'OK', onPress: onLogout }]
      );
    }, timeoutSeconds * 1000);
  };

  useEffect(() => {
    resetTimer();

    // Reset timer on app state change (e.g. coming back from background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') resetTimer();
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      subscription.remove();
    };
  }, []);

  // Return a touch/action trigger handler to wrap around main views if needed
  return { handleUserAction: resetTimer };
}