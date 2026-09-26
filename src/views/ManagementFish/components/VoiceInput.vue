<template>
  <div class="voice-input">
    <button
      v-if="isSupported"
      type="button"
      class="voice-input__button"
      :class="{ 'voice-input__button--listening': isListening }"
      :title="isListening ? 'Tắt nhập bằng giọng nói' : 'Bật nhập bằng giọng nói'"
      :aria-pressed="isListening"
      @click="toggleListening"
    >
      <i class="mdi" :class="isListening ? 'mdi-microphone' : 'mdi-microphone-off'"></i>
    </button>
    <div class="voice-input__status">
      <div v-if="!isSupported" class="voice-input__note">
        Trình duyệt này chưa hỗ trợ nhập bằng giọng nói, hãy dùng Chrome.
      </div>
      <label v-if="isSupported" class="voice-input__readback">
        <input type="checkbox" :checked="isReadbackOn" @change="setReadback($event.target.checked)" />
        Đọc xác nhận
      </label>
      <div v-if="errorMessage" class="voice-input__error">{{ errorMessage }}</div>
      <div v-if="interimText" class="voice-input__interim">{{ interimText }}</div>
      <div v-else-if="lastTranscript" class="voice-input__heard">
        Đã nghe: {{ lastTranscript }}
        <span v-if="lastUnrecognized" class="voice-input__unrecognized">
          (Không hiểu: {{ lastUnrecognized }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import "@mdi/font/css/materialdesignicons.css";

import { useSpeechRecognition } from "@/voice/useSpeechRecognition";
import { parseWeightUtterance } from "@/voice/parseWeightUtterance";
import { speak } from "@/voice/speak";

const props = defineProps({
  fishTypes: {
    type: Array,
    default: () => [],
  },
  basketTypes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["parsed"]);

const lastTranscript = ref("");
const lastUnrecognized = ref("");

const handleFinal = (text) => {
  const result = parseWeightUtterance(text, {
    fishTypes: props.fishTypes,
    basketTypes: props.basketTypes,
  });
  lastTranscript.value = text;
  lastUnrecognized.value = result.unrecognized;
  emit("parsed", result);
};

const { isSupported, isListening, interimText, errorMessage, start, stop, pause, resume } =
  useSpeechRecognition({ lang: "vi-VN", onFinal: handleFinal });

const toggleListening = () => {
  if (isListening.value) stop();
  else start();
};

// Công tắc "Đọc xác nhận": mặc định bật, nhớ trong localStorage
const READBACK_KEY = "voiceReadback";
const readStoredReadback = () => {
  try {
    return localStorage.getItem(READBACK_KEY) !== "false";
  } catch {
    return true;
  }
};
const isReadbackOn = ref(readStoredReadback());

const setReadback = (value) => {
  isReadbackOn.value = value;
  try {
    localStorage.setItem(READBACK_KEY, String(value));
  } catch {
    // Trình duyệt chặn localStorage: chỉ nhớ trong phiên hiện tại
  }
};

// Đọc câu xác nhận; tạm dừng nghe trong lúc đọc để không tự nghe chính mình
const announce = (text) => {
  if (!isReadbackOn.value) return;
  pause();
  speak(text, { onEnd: resume });
};

onMounted(() => {
  // Chrome tải danh sách giọng đọc bất đồng bộ: gọi trước để lần đọc đầu có giọng tiếng Việt
  try {
    window.speechSynthesis?.getVoices();
  } catch {
    // bỏ qua
  }
});

defineExpose({ isListening, start, stop, announce });
</script>

<style lang="scss" scoped>
.voice-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  .voice-input__button {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    font-size: 24px;
    color: $color-card-background;
    background-color: $color-primary;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: darken($color-primary, 8%);
    }

    &.voice-input__button--listening {
      background-color: $color-error;
      animation: voice-pulse 1.2s ease-in-out infinite;
    }
  }

  .voice-input__status {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: $color-text-primary;

    .voice-input__readback {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      user-select: none;
    }

    .voice-input__interim {
      font-style: italic;
      opacity: 0.7;
    }

    .voice-input__unrecognized {
      color: $color-error;
    }

    .voice-input__error {
      color: $color-error;
    }
  }
}

@keyframes voice-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(211, 47, 47, 0);
  }
}
</style>
