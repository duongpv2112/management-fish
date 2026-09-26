import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { speak } from "@/voice/speak";

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

const makeAudioContext = () => {
  const oscillator = {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    onended: null,
  };
  const gain = { connect: vi.fn(), gain: { value: 1 } };
  const ctor = vi.fn(function () {
    this.createOscillator = () => oscillator;
    this.createGain = () => gain;
    this.destination = {};
    this.currentTime = 0;
    this.close = vi.fn();
  });
  return { ctor, oscillator };
};

beforeEach(() => {
  vi.useFakeTimers();
  window.SpeechSynthesisUtterance = FakeUtterance;
});

afterEach(() => {
  vi.useRealTimers();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
  delete window.AudioContext;
});

test("có giọng tiếng Việt → đọc bằng giọng đó, gọi onEnd khi đọc xong", () => {
  const viVoice = { lang: "vi-VN", name: "Tiếng Việt" };
  window.speechSynthesis = {
    getVoices: () => [{ lang: "en-US", name: "English" }, viVoice],
    speak: vi.fn(),
    cancel: vi.fn(),
  };
  const onEnd = vi.fn();

  speak("Đã lưu trắm 25,5 cân", { onEnd });

  const utterance = window.speechSynthesis.speak.mock.calls[0][0];
  expect(utterance.text).toBe("Đã lưu trắm 25,5 cân");
  expect(utterance.voice).toBe(viVoice);
  expect(utterance.lang).toBe("vi-VN");
  expect(onEnd).not.toHaveBeenCalled();
  utterance.onend();
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test("không có giọng tiếng Việt → phát tiếng bíp 880 Hz", () => {
  window.speechSynthesis = { getVoices: () => [{ lang: "en-US" }], speak: vi.fn(), cancel: vi.fn() };
  const { ctor, oscillator } = makeAudioContext();
  window.AudioContext = ctor;
  const onEnd = vi.fn();

  speak("Đã lưu", { onEnd });

  expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  expect(oscillator.frequency.value).toBe(880);
  expect(oscillator.start).toHaveBeenCalled();
  expect(oscillator.stop).toHaveBeenCalledWith(0.15);
  vi.advanceTimersByTime(200);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test("không có speechSynthesis lẫn AudioContext → không throw, vẫn gọi onEnd", () => {
  delete window.speechSynthesis;
  const onEnd = vi.fn();
  expect(() => speak("Đã lưu", { onEnd })).not.toThrow();
  vi.advanceTimersByTime(200);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test("speechSynthesis.speak throw → không throw ra ngoài", () => {
  window.speechSynthesis = {
    getVoices: () => [{ lang: "vi-VN" }],
    speak: () => {
      throw new Error("boom");
    },
    cancel: vi.fn(),
  };
  expect(() => speak("Đã lưu")).not.toThrow();
});
