// Đọc xác nhận bằng giọng nói; không có giọng tiếng Việt thì phát tiếng "bíp". Không bao giờ throw.

const BEEP_FREQUENCY = 880;
const BEEP_SECONDS = 0.15;

const findVietnameseVoice = (synthesis) => {
  try {
    return synthesis.getVoices().find((voice) => voice.lang?.toLowerCase().startsWith("vi")) ?? null;
  } catch {
    return null;
  }
};

const beep = (onEnd) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = BEEP_FREQUENCY;
      gain.gain.value = 0.2;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + BEEP_SECONDS);
      setTimeout(() => context.close?.(), BEEP_SECONDS * 1000 + 50);
    }
  } catch (error) {
    console.warn("Không phát được tiếng bíp:", error);
  }
  setTimeout(() => onEnd?.(), BEEP_SECONDS * 1000 + 50);
};

/**
 * @param {string} text Câu cần đọc
 * @param {{ onEnd?: () => void }} options onEnd luôn được gọi đúng một lần khi đọc/bíp xong
 */
export const speak = (text, { onEnd } = {}) => {
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    onEnd?.();
  };

  try {
    const synthesis = window.speechSynthesis;
    const voice = synthesis && window.SpeechSynthesisUtterance ? findVietnameseVoice(synthesis) : null;
    if (!voice) {
      beep(finish);
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.onend = finish;
    utterance.onerror = finish;
    synthesis.cancel?.();
    synthesis.speak(utterance);
  } catch (error) {
    console.warn("Không đọc được xác nhận:", error);
    finish();
  }
};
