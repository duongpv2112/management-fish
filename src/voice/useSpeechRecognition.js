// Bọc Web Speech API (SpeechRecognition / webkitSpeechRecognition) thành composable Vue
import { onBeforeUnmount, ref } from "vue";

const MESSAGE_NOT_ALLOWED =
  "Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này trong cài đặt trình duyệt.";
const MESSAGE_NETWORK = "Mất kết nối mạng, không nhận dạng được giọng nói.";

const getRecognitionClass = () =>
  typeof window === "undefined"
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

/**
 * @param {{ lang?: string, onFinal: (text: string) => void }} options
 */
export const useSpeechRecognition = ({ lang = "vi-VN", onFinal } = {}) => {
  const RecognitionClass = getRecognitionClass();
  const isSupported = Boolean(RecognitionClass);
  const isListening = ref(false);
  const interimText = ref("");
  const errorMessage = ref("");

  let recognition = null;

  const createRecognition = () => {
    const instance = new RecognitionClass();
    instance.lang = lang;
    instance.continuous = true;
    instance.interimResults = true;

    instance.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          interimText.value = "";
          const text = transcript.trim();
          if (text) onFinal?.(text);
        } else {
          interim += transcript;
        }
      }
      if (interim) interimText.value = interim.trim();
    };

    instance.onerror = (event) => {
      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          // Bị từ chối quyền micro: dừng hẳn, không tự bật lại
          isListening.value = false;
          errorMessage.value = MESSAGE_NOT_ALLOWED;
          break;
        case "network":
          errorMessage.value = MESSAGE_NETWORK;
          break;
        default:
          // "no-speech", "aborted"...: bỏ qua, sự kiện end sẽ tự bật lại
          break;
      }
    };

    instance.onend = () => {
      interimText.value = "";
      // Chrome tự dừng sau vài giây im lặng: bật lại nếu vẫn đang ở chế độ nghe
      if (isListening.value) startRecognition();
    };

    return instance;
  };

  const startRecognition = () => {
    try {
      recognition.start();
    } catch (error) {
      // start() khi đang chạy sẽ throw InvalidStateError: bỏ qua
      console.warn("Không thể bắt đầu nhận dạng giọng nói:", error);
    }
  };

  const start = () => {
    if (!isSupported || isListening.value) return;
    if (!recognition) recognition = createRecognition();
    errorMessage.value = "";
    isListening.value = true;
    startRecognition();
  };

  const stop = () => {
    if (!recognition) return;
    isListening.value = false;
    interimText.value = "";
    recognition.stop();
  };

  onBeforeUnmount(stop);

  return { isSupported, isListening, interimText, errorMessage, start, stop };
};
