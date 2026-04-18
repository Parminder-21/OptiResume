import { useEffect, useState } from 'react';
import useSound from 'use-sound';

// A tiny base64 encoded 'pop' sound for UI feedback
const POP_SOUND = 'data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

export function useAudioFeedback() {
  const [playPop] = useSound(POP_SOUND, { volume: 0.5 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Browsers require a user interaction before playing audio
    const enableAudio = () => setIsReady(true);
    window.addEventListener('click', enableAudio, { once: true });
    return () => window.removeEventListener('click', enableAudio);
  }, []);

  const playClick = () => {
    if (isReady) {
      try { playPop(); } catch (e) {}
    }
  };

  return { playClick };
}
