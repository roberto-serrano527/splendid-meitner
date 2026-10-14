/**
 * Audio synthesis helper using native Web Speech API.
 * Supports Android Chrome, Desktop browsers and iOS Safari.
 */

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };

    // Fallback timeout in case onvoiceschanged does not fire
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 250);
  });
}

// Preload voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

/**
 * Pronounce a given text in the specified target language code (e.g. 'en-US', 'es-ES').
 */
export async function speakWord(text: string, langCode: string = 'en-US', rate: number = 0.9): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported on this device');
    return;
  }

  // Cancel any ongoing speech to prevent overlap
  window.speechSynthesis.cancel();

  const voices = cachedVoices.length > 0 ? cachedVoices : await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate; // slightly slower for language learners

  // Match voice by exact lang code or prefix (e.g. 'en-US' or 'en')
  const baseLang = langCode.split('-')[0].toLowerCase();
  const voice =
    voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(baseLang));

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = langCode;
  }

  window.speechSynthesis.speak(utterance);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
