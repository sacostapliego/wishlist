import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useIsDesktopWeb() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const mq = window.matchMedia('(pointer: fine) and (hover: hover)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update);

    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update);
    };
  }, []);

  return isDesktop;
}

export default useIsDesktopWeb;