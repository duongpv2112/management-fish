import { test, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/basketTypeAPI", () => ({
  default: {
    getBasketTypes: vi.fn(),
    createBasketType: vi.fn(),
    updateBasketType: vi.fn(),
    deleteBasketType: vi.fn(),
  },
}));

import BasketTypeAPI from "@/services/basketTypeAPI";
import BasketTypeManager from "@/views/Catalog/components/BasketTypeManager.vue";

beforeEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
  vi.mocked(BasketTypeAPI.getBasketTypes).mockResolvedValue({
    success: true,
    data: [{ _id: "b1", basketName: "Giỏ to", basketWeight: 2 }],
  });
});

const mountManager = async () => {
  const wrapper = mount(BasketTypeManager);
  await flushPromises();
  return wrapper;
};

const addBasket = async (wrapper, name, weight) => {
  await wrapper.find("#basketType-new-basketName").setValue(name);
  await wrapper.find("#basketType-new-basketWeight").setValue(weight);
  await wrapper.find(".catalog-add button").trigger("click");
  await flushPromises();
};

test("hiển thị cột trọng lượng giỏ", async () => {
  const wrapper = await mountManager();
  expect(wrapper.find("thead").text()).toContain("Trọng lượng giỏ (kg)");
  expect(wrapper.find("tbody tr").text()).toContain("2");
});

test('thêm giỏ với trọng lượng "1,5" → gửi 1.5', async () => {
  vi.mocked(BasketTypeAPI.createBasketType).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await addBasket(wrapper, "Giỏ vừa", "1,5");
  expect(BasketTypeAPI.createBasketType).toHaveBeenCalledWith({
    basketName: "Giỏ vừa",
    basketWeight: 1.5,
  });
});

test("trọng lượng 0 hợp lệ", async () => {
  vi.mocked(BasketTypeAPI.createBasketType).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await addBasket(wrapper, "Không giỏ", "0");
  expect(BasketTypeAPI.createBasketType).toHaveBeenCalledWith({
    basketName: "Không giỏ",
    basketWeight: 0,
  });
});

test.each(["abc", ""])("trọng lượng %j không hợp lệ: không gọi API", async (weight) => {
  const wrapper = await mountManager();
  await addBasket(wrapper, "Giỏ vừa", weight);
  expect(BasketTypeAPI.createBasketType).not.toHaveBeenCalled();
  expect(wrapper.find(".error-message").text()).toBe("Trọng lượng giỏ không hợp lệ!");
});

test("sửa giỏ gửi cả tên và trọng lượng", async () => {
  vi.mocked(BasketTypeAPI.updateBasketType).mockResolvedValue({ success: true, data: {} });
  const wrapper = await mountManager();
  await wrapper.find(".btn-edit button").trigger("click");
  expect(wrapper.find("#basketType-edit-basketWeight").element.value).toBe("2");
  await wrapper.find("#basketType-edit-basketWeight").setValue("2,5");
  await wrapper.find(".btn-save button").trigger("click");
  await flushPromises();
  expect(BasketTypeAPI.updateBasketType).toHaveBeenCalledWith("b1", {
    basketName: "Giỏ to",
    basketWeight: 2.5,
  });
});

test("xóa hỏi đúng câu xác nhận", async () => {
  const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
  const wrapper = await mountManager();
  await wrapper.find(".btn-delete button").trigger("click");
  expect(confirmSpy).toHaveBeenCalledWith('Xóa loại giỏ "Giỏ to"?');
  expect(BasketTypeAPI.deleteBasketType).not.toHaveBeenCalled();
});
