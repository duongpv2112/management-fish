import { test, expect, vi, beforeEach } from "vitest";
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
    };
    return speech.api;
  },
}));

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

const say = async (text) => {
  speech.onFinal(text);
  await flushPromises();
};

const formValues = (wrapper) => ({
  fishType: wrapper.find("#fishType").element.value,
  basketType: wrapper.find("#basketType").element.value,
  fishWeight: wrapper.find("#fishWeight").element.value,
});

const mountForm = async () => {
  const wrapper = mount(AddWeight);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  speech.isSupported = true;
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

test('nói "lưu" thì lưu; sau khi lưu giữ cá và giỏ, xóa số cân; nói tiếp "30 lưu" lưu lần 2', async () => {
  const wrapper = await mountForm();
  await say("trắm giỏ to 25,5");
  await say("lưu");
  expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(1);
  expect(FishWeightAPI.saveFishWeight).toHaveBeenLastCalledWith({
    fishType: "f1",
    basketType: "b1",
    fishWeight: 25.5,
  });
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "" });

  await say("30 lưu");
  expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(2);
  expect(FishWeightAPI.saveFishWeight).toHaveBeenLastCalledWith({
    fishType: "f1",
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
