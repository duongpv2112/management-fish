import { test, expect, vi, beforeEach, describe } from "vitest";
import { ref } from "vue";
import { mount, flushPromises } from "@vue/test-utils";

// Composable giả: giữ lại onFinal để test "nói" trực tiếp
const speech = vi.hoisted(() => ({ onFinal: null, isSupported: true, api: null }));
vi.mock("@/voice/useSpeechRecognition", () => ({
  useSpeechRecognition: (options) => {
    speech.onFinal = options.onFinal;
    speech.api = {
      isSupported: speech.isSupported,
      isListening: ref(false),
      interimText: ref(""),
      errorMessage: ref(""),
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    };
    return speech.api;
  },
}));

const speakMock = vi.hoisted(() => vi.fn((text, { onEnd } = {}) => onEnd?.()));
vi.mock("@/voice/speak", () => ({ speak: speakMock }));

vi.mock("@/services/fishWeightAPI", () => ({ default: { saveFishWeight: vi.fn() } }));
vi.mock("@/services/fishTypeAPI", () => ({
  default: {
    getFishTypes: vi.fn(async () => ({
      data: [
        { _id: "f1", fishName: "Cá trắm" },
        { _id: "f2", fishName: "Cá mè" },
      ],
    })),
  },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: {
    getBasketTypes: vi.fn(async () => ({
      data: [{ _id: "b1", basketName: "Giỏ to", basketWeight: 2 }],
    })),
  },
}));

import FishWeightAPI from "@/services/fishWeightAPI";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";
import { setVoiceReadback } from "@/common/voiceReadback";

const say = async (text) => {
  speech.onFinal(text);
  await flushPromises();
};

// Lưới ChoiceGrid: giá trị đang chọn là nút aria-pressed="true"
const selectedText = (wrapper, id) => {
  const node = wrapper.find(`#${id} [aria-pressed="true"] .choice-grid__text`);
  return node.exists() ? node.text() : "";
};

const formValues = (wrapper) => ({
  fishType: selectedText(wrapper, "fishType"),
  basketType: selectedText(wrapper, "basketType"),
  fishWeight: wrapper.find("#fishWeight").element.value,
});

const mountForm = async () => {
  const wrapper = mount(AddWeight);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  speech.isSupported = true;
  localStorage.clear();
  speakMock.mockClear();
  vi.mocked(FishWeightAPI.saveFishWeight).mockReset();
  vi.mocked(FishWeightAPI.saveFishWeight).mockResolvedValue({ success: true, data: {} });
});

test("nói đủ 3 trường thì điền form nhưng chưa lưu", async () => {
  const wrapper = await mountForm();
  await say("trắm giỏ to 25,5");
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "25.5" });
  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Đã nghe: trắm giỏ to 25,5");
});

test('nói "lưu" thì lưu; sau khi lưu xóa hết form; nói tiếp "mè giỏ to 30 lưu" lưu lần 2', async () => {
  const wrapper = await mountForm();
  await say("trắm giỏ to 25,5");
  await say("lưu");
  expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(1);
  expect(FishWeightAPI.saveFishWeight).toHaveBeenLastCalledWith({
    fishType: "f1",
    basketType: "b1",
    fishWeight: 25.5,
  });
  expect(formValues(wrapper)).toEqual({ fishType: "", basketType: "", fishWeight: "" });

  await say("mè giỏ to 30 lưu");
  expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(2);
  expect(FishWeightAPI.saveFishWeight).toHaveBeenLastCalledWith({
    fishType: "f2",
    basketType: "b1",
    fishWeight: 30,
  });
});

test('"lưu" khi chưa có số cân: báo thiếu, không gọi API', async () => {
  const wrapper = await mountForm();
  await say("trắm giỏ to");
  await say("lưu");
  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
  expect(wrapper.find(".error-message").text()).toBe("Chưa có số cân");
});

test('"lưu" khi chưa chọn loại cá / loại giỏ: báo cụ thể', async () => {
  const wrapper = await mountForm();
  await say("25 lưu");
  expect(wrapper.find(".error-message").text()).toBe("Chưa chọn loại cá");
  await say("mè 25 lưu");
  expect(wrapper.find(".error-message").text()).toBe("Chưa chọn loại giỏ");
  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
});

test('"hủy" chỉ xóa số cân', async () => {
  const wrapper = await mountForm();
  await say("trắm giỏ to 25");
  await say("hủy");
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "" });
});

test("phần không hiểu được hiển thị", async () => {
  const wrapper = await mountForm();
  await say("cá rô 10");
  expect(wrapper.text()).toContain("Không hiểu: ca ro");
});

test("bấm nút micro bật/tắt nghe", async () => {
  const wrapper = await mountForm();
  await wrapper.find(".voice-input__button").trigger("click");
  expect(speech.api.start).toHaveBeenCalledTimes(1);
  speech.api.isListening.value = true;
  await flushPromises();
  await wrapper.find(".voice-input__button").trigger("click");
  expect(speech.api.stop).toHaveBeenCalledTimes(1);
});

test("trình duyệt không hỗ trợ: ẩn nút micro và hiện chú thích", async () => {
  speech.isSupported = false;
  const wrapper = await mountForm();
  expect(wrapper.find(".voice-input__button").exists()).toBe(false);
  expect(wrapper.text()).toContain(
    "Trình duyệt này chưa hỗ trợ nhập bằng giọng nói, hãy dùng Chrome."
  );
});

describe("đọc xác nhận", () => {
  test("lưu bằng giọng nói thành công → đọc tên cá bỏ tiền tố và số có dấu phẩy; tạm dừng nghe khi đọc", async () => {
    const wrapper = await mountForm();
    await say("trắm giỏ to 25,5 lưu");
    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(speakMock.mock.calls[0][0]).toBe("Đã lưu trắm 25,5 cân");
    expect(speech.api.pause).toHaveBeenCalledTimes(1);
    expect(speech.api.resume).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".voice-input__readback input").element.checked).toBe(true);
  });

  test("lưu thất bại → đọc 'Lưu thất bại'", async () => {
    vi.mocked(FishWeightAPI.saveFishWeight).mockRejectedValue(new Error("x"));
    await mountForm();
    await say("trắm giỏ to 25 lưu");
    expect(speakMock.mock.calls[0][0]).toBe("Lưu thất bại");
  });

  test("tắt công tắc → không đọc, lưu lựa chọn vào localStorage", async () => {
    const wrapper = await mountForm();
    await wrapper.find(".voice-input__readback input").setValue(false);
    expect(localStorage.getItem("voiceReadback")).toBe("false");
    await say("trắm giỏ to 25 lưu");
    expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(1);
    expect(speakMock).not.toHaveBeenCalled();
  });

  test("nhớ lựa chọn tắt từ localStorage", async () => {
    localStorage.setItem("voiceReadback", "false");
    const wrapper = await mountForm();
    expect(wrapper.find(".voice-input__readback input").element.checked).toBe(false);
  });


  test("tắt trong menu ☰ (trạng thái chung) → không đọc", async () => {
    await mountForm();
    setVoiceReadback(false);
    await say("trắm giỏ to 25 lưu");
    expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(1);
    expect(speakMock).not.toHaveBeenCalled();
  });
  test("bấm nút Lưu bằng tay → không đọc", async () => {
    const wrapper = await mountForm();
    await say("trắm giỏ to 25");
    await wrapper.find("#btnSaveFishWeight").trigger("click");
    await flushPromises();
    expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(1);
    expect(speakMock).not.toHaveBeenCalled();
  });
});

test("server từ chối (số cân <= giỏ) → hiện đúng message của server", async () => {
  vi.mocked(FishWeightAPI.saveFishWeight).mockRejectedValue(
    new Error("Số cân phải lớn hơn trọng lượng giỏ (2 kg)!")
  );
  const wrapper = await mountForm();
  await say("trắm giỏ to 2 lưu");
  expect(wrapper.find(".error-message").text()).toBe("Số cân phải lớn hơn trọng lượng giỏ (2 kg)!");
});
