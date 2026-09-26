import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useSpeechRecognition } from "@/voice/useSpeechRecognition";

let instances = [];

class FakeRecognition {
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn(() => this.onend?.());
    this.abort = vi.fn();
    instances.push(this);
  }

  emitResult(transcript, isFinal) {
    const result = [{ transcript }];
    result.isFinal = isFinal;
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
}

// Gọi composable trong một component để onBeforeUnmount hoạt động
const setup = (options) => {
  let api;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useSpeechRecognition(options);
        return () => h("div");
      },
    })
  );
  return { api, wrapper, recognition: () => instances[instances.length - 1] };
};

beforeEach(() => {
  instances = [];
  window.webkitSpeechRecognition = FakeRecognition;
});

afterEach(() => {
  delete window.webkitSpeechRecognition;
  delete window.SpeechRecognition;
});

test("không có API → isSupported false, start không làm gì", () => {
  delete window.webkitSpeechRecognition;
  const { api } = setup({ onFinal: vi.fn() });
  expect(api.isSupported).toBe(false);
  api.start();
  expect(api.isListening.value).toBe(false);
  expect(instances).toHaveLength(0);
});

test("start cấu hình tiếng Việt, liên tục, có kết quả tạm", () => {
  const { api, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  const r = recognition();
  expect(r.lang).toBe("vi-VN");
  expect(r.continuous).toBe(true);
  expect(r.interimResults).toBe(true);
  expect(r.start).toHaveBeenCalledTimes(1);
  expect(api.isListening.value).toBe(true);
});

test("kết quả tạm cập nhật interimText; kết quả cuối gọi onFinal và xóa interimText", () => {
  const onFinal = vi.fn();
  const { api, recognition } = setup({ onFinal });
  api.start();
  recognition().emitResult("trắm", false);
  expect(api.interimText.value).toBe("trắm");
  recognition().emitResult(" trắm 25 ", true);
  expect(onFinal).toHaveBeenCalledWith("trắm 25");
  expect(api.interimText.value).toBe("");
});

test("end khi đang nghe → tự bật lại", () => {
  const { api, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  recognition().onend();
  expect(recognition().start).toHaveBeenCalledTimes(2);
  expect(api.isListening.value).toBe(true);
});

test("end sau stop() → không bật lại", () => {
  const { api, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  api.stop();
  recognition().onend?.();
  expect(recognition().start).toHaveBeenCalledTimes(1);
  expect(api.isListening.value).toBe(false);
});

test("lỗi not-allowed → tắt nghe, báo quyền micro, end sau đó không bật lại", () => {
  const { api, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  recognition().onerror({ error: "not-allowed" });
  recognition().onend();
  expect(api.isListening.value).toBe(false);
  expect(api.errorMessage.value).toBe(
    "Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này trong cài đặt trình duyệt."
  );
  expect(recognition().start).toHaveBeenCalledTimes(1);
});

test("lỗi network → báo mất mạng nhưng vẫn thử lại", () => {
  const { api, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  recognition().onerror({ error: "network" });
  recognition().onend();
  expect(api.errorMessage.value).toBe("Mất kết nối mạng, không nhận dạng được giọng nói.");
  expect(recognition().start).toHaveBeenCalledTimes(2);
});

test("lỗi no-speech bị bỏ qua", () => {
  const { api, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  recognition().onerror({ error: "no-speech" });
  expect(api.errorMessage.value).toBe("");
  expect(api.isListening.value).toBe(true);
});

test("unmount thì dừng nghe", () => {
  const { api, wrapper, recognition } = setup({ onFinal: vi.fn() });
  api.start();
  wrapper.unmount();
  expect(recognition().stop).toHaveBeenCalled();
  expect(api.isListening.value).toBe(false);
});
