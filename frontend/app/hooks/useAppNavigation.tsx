import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export function useAppNavigation() {
  const router = useRouter();

  const navigateBack = (fallbackPath: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (document.referrer && window.history.length > 1) {
        window.history.back();
      } else {
        // No referrer means direct access, use fallback
        window.location.href = fallbackPath;
      }
    } else {
      // On native, use standard back navigation
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(fallbackPath as any);
      }
    }
  };

  const navigate = (path: string, replace: boolean = false) => {
    if (replace) {
      router.replace(path as any);
    } else {
      router.push(path as any);
    }
  };

  return { navigateBack, navigate, router };
}