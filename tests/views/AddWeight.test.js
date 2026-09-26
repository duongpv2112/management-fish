import { test, expect, vi, beforeEach, afterEach, describe } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@/services/fishWeightAPI", () => ({ default: { saveFishWeight: vi.fn(), deleteFishWeight: vi.fn() } }));
vi.mock("@/services/fishTypeAPI", () => ({
  default: { getFishTypes: vi.fn(async () => ({ data: [{ _id: "f1", fishName: "Cá trắm" }] })) },
}));
vi.mock("@/services/basketTypeAPI", () => ({
  default: {
    getBasketTypes: vi.fn(async () => ({ data: [{ _id: "b1", basketName: "Giỏ to", basketWeight: 2 }] })),
  },
}));

import FishWeightAPI from "@/services/fishWeightAPI";
import FishTypeAPI from "@/services/fishTypeAPI";
import AddWeight from "@/views/ManagementFish/components/AddWeight.vue";

const mountForm = async (props = {}) => {
  const wrapper = mount(AddWeight, { props });
  await flushPromises();
  return wrapper;
};

const fillForm = async (wrapper, weightText) => {
  wrapper.vm.setFormValues({ fishType: "f1", basketType: "b1" });
  await wrapper.find("#fishWeight").setValue(weightText);
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

beforeEach(() => {
  localStorage.clear();
  vi.mocked(FishWeightAPI.saveFishWeight).mockReset();
});

test("lưu thành công: gọi API với số thập phân, emit sau khi lưu, xóa hết dữ liệu đã nhập", async () => {
  const saved = { _id: "w1", fishWeight: 25.5 };
  vi.mocked(FishWeightAPI.saveFishWeight).mockResolvedValue({ success: true, data: saved });
  const wrapper = await mountForm();
  await fillForm(wrapper, "25,5");

  const ok = await wrapper.vm.save();
  await flushPromises();

  expect(ok).toBe(true);
  expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledWith({
    fishType: "f1",
    basketType: "b1",
    fishWeight: 25.5,
  });
  expect(wrapper.emitted().weightAdded).toEqual([[saved]]);
  expect(formValues(wrapper)).toEqual({ fishType: "", basketType: "", fishWeight: "" });
  expect(wrapper.text()).toContain("Lưu số cân thành công!");
});

test("lưu thất bại: không emit, giữ nguyên giá trị đã nhập, hiện message server", async () => {
  vi.mocked(FishWeightAPI.saveFishWeight).mockRejectedValue(new Error("Thêm cân cá không thành công!"));
  const wrapper = await mountForm();
  await fillForm(wrapper, "25,5");

  const ok = await wrapper.vm.save();
  await flushPromises();

  expect(ok).toBe(false);
  expect(wrapper.emitted().weightAdded).toBeUndefined();
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "25,5" });
  expect(wrapper.find(".error-message").text()).toBe("Thêm cân cá không thành công!");
});

test("thiếu loại cá: không gọi API", async () => {
  const wrapper = await mountForm();
  wrapper.vm.setFormValues({ basketType: "b1", fishWeight: 10 });
  await wrapper.vm.save();
  await flushPromises();

  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Vui lòng chọn loại cá.");
});

test.each(["0", "abc"])("số cân %j: báo lỗi số dương", async (weightText) => {
  const wrapper = await mountForm();
  await fillForm(wrapper, weightText);
  await wrapper.vm.save();
  await flushPromises();

  expect(FishWeightAPI.saveFishWeight).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain("Số cân cá phải là số dương.");
});

test("setFormValues điền số cân dạng số", async () => {
  const wrapper = await mountForm();
  wrapper.vm.setFormValues({ fishType: "f1", basketType: "b1", fishWeight: 12.5 });
  await flushPromises();
  expect(formValues(wrapper)).toEqual({ fishType: "Cá trắm", basketType: "Giỏ to", fishWeight: "12.5" });
});

test("không dùng cache localStorage cho danh sách loại cá", async () => {
  localStorage.setItem(
    "fishTypes",
    JSON.stringify({ data: [{ _id: "cu", fishName: "Cá cũ" }], timestamp: Date.now() })
  );
  const wrapper = await mountForm();
  wrapper.vm.setFormValues({ fishType: "f1" });
  await flushPromises();
  expect(selectedText(wrapper, "fishType")).toBe("Cá trắm");
});

describe("Hoàn tác lần cân vừa lưu", () => {
  const saveOnce = async () => {
    vi.mocked(FishWeightAPI.saveFishWeight).mockResolvedValue({ success: true, data: { _id: "w9" } });
    const wrapper = await mountForm();
    await fillForm(wrapper, "25");
    await wrapper.vm.save();
    await flushPromises();
    return wrapper;
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  test("lưu xong có nút Hoàn tác; bấm thì xóa lần cân vừa lưu và emit weightUndone", async () => {
    vi.mocked(FishWeightAPI.deleteFishWeight).mockResolvedValue({ success: true });
    const wrapper = await saveOnce();
    await wrapper.find(".btn-undo").trigger("click");
    await flushPromises();

    expect(FishWeightAPI.deleteFishWeight).toHaveBeenCalledWith("w9");
    expect(wrapper.emitted().weightUndone).toHaveLength(1);
    expect(wrapper.find(".success-message").text()).toBe("Đã hoàn tác lần cân vừa lưu.");
    expect(wrapper.find(".btn-undo").exists()).toBe(false);
  });

  test("nút Hoàn tác tự ẩn sau 10 giây", async () => {
    vi.useFakeTimers();
    const wrapper = await saveOnce();
    expect(wrapper.find(".btn-undo").exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(10000);
    expect(wrapper.find(".btn-undo").exists()).toBe(false);
  });

  test("hoàn tác lỗi → hiện message, không emit", async () => {
    vi.mocked(FishWeightAPI.deleteFishWeight).mockRejectedValue(new Error("Phiên cân đã kết thúc!"));
    const wrapper = await saveOnce();
    await wrapper.find(".btn-undo").trigger("click");
    await flushPromises();
    expect(wrapper.find(".error-message").text()).toBe("Phiên cân đã kết thúc!");
    expect(wrapper.emitted().weightUndone).toBeUndefined();
  });

  test("lưu lỗi thì không có nút Hoàn tác", async () => {
    vi.mocked(FishWeightAPI.saveFishWeight).mockRejectedValue(new Error("x"));
    const wrapper = await mountForm();
    await fillForm(wrapper, "25");
    await wrapper.vm.save();
    await flushPromises();
    expect(wrapper.find(".btn-undo").exists()).toBe(false);
  });
});

describe("Lưới chọn cá/giỏ", () => {
  const twoFish = { data: [{ _id: "f1", fishName: "Cá trắm" }, { _id: "f2", fishName: "Cá mè" }] };
  const manyFish = {
    data: ["Cá trắm", "Cá mè", "Cá rô phi loại 1", "Cá rô phi loại 2", "Cá chép", "Cá trôi", "Cá lăng", "Cá rô đồng"].map(
      (fishName, index) => ({ _id: `f${index + 1}`, fishName })
    ),
  };
  const saveButton = (wrapper) => wrapper.find("#btnSaveFishWeight");
  const firstFishText = (wrapper) => wrapper.find("#fishType .choice-grid__item .choice-grid__text").text();

  test("cá cân nhiều trong phiên đứng đầu lưới", async () => {
    vi.mocked(FishTypeAPI.getFishTypes).mockResolvedValueOnce(twoFish);
    const wrapper = await mountForm({
      sessionFishData: [
        { _id: "f1", fishName: "Cá trắm", fishWeightItems: [{ _id: "w1", basketType: "b1" }] },
        {
          _id: "f2",
          fishName: "Cá mè",
          fishWeightItems: [
            { _id: "w2", basketType: "b1" },
            { _id: "w3", basketType: "b1" },
            { _id: "w4", basketType: "b1" },
          ],
        },
      ],
    });
    expect(firstFishText(wrapper)).toBe("Cá mè");
  });

  test("chạm nút cá/giỏ để chọn", async () => {
    const wrapper = await mountForm();
    await wrapper.find("#fishType .choice-grid__item").trigger("click");
    await wrapper.find("#basketType .choice-grid__item").trigger("click");
    expect(formValues(wrapper)).toMatchObject({ fishType: "Cá trắm", basketType: "Giỏ to" });
    expect(wrapper.find("#basketType .choice-grid__sub").text()).toBe("2 kg");
  });

  test("lưu thành công → nhớ cá và giỏ vừa dùng", async () => {
    vi.mocked(FishWeightAPI.saveFishWeight).mockResolvedValue({ success: true, data: { _id: "w1" } });
    const wrapper = await mountForm();
    await fillForm(wrapper, "25");
    await wrapper.vm.save();
    await flushPromises();
    expect(JSON.parse(localStorage.getItem("recentFishTypes"))[0]).toBe("f1");
    expect(JSON.parse(localStorage.getItem("recentBasketTypes"))[0]).toBe("b1");
  });

  test("chọn từ 'Loại khác' → đưa lên nhóm dùng gần đây ngay", async () => {
    vi.mocked(FishTypeAPI.getFishTypes).mockResolvedValueOnce(manyFish);
    const wrapper = await mountForm();
    await wrapper.find("#fishType .choice-grid__more").trigger("click");
    await wrapper.find(".choice-grid__search").setValue("lang");
    await wrapper.find(".choice-grid__option").trigger("click");
    expect(selectedText(wrapper, "fishType")).toBe("Cá lăng");
    expect(JSON.parse(localStorage.getItem("recentFishTypes"))[0]).toBe("f7");
  });

  test("nút Lưu mờ khi thiếu cá, giỏ hoặc số cân; bật khi đủ", async () => {
    const wrapper = await mountForm();
    expect(saveButton(wrapper).element.disabled).toBe(true);
    wrapper.vm.setFormValues({ fishType: "f1", basketType: "b1" });
    await flushPromises();
    expect(saveButton(wrapper).element.disabled).toBe(true);
    await wrapper.find("#fishWeight").setValue("25");
    expect(saveButton(wrapper).element.disabled).toBe(false);
  });

  test("xem trước số cân thực theo giỏ đang chọn", async () => {
    const wrapper = await mountForm();
    await fillForm(wrapper, "25,5");
    expect(wrapper.find(".net-preview").text()).toBe("Còn 23,5 kg sau khi trừ giỏ 2 kg");
    await wrapper.find("#fishWeight").setValue("1,5");
    const preview = wrapper.find(".net-preview");
    expect(preview.text()).toBe("Số cân phải lớn hơn trọng lượng giỏ (2 kg)");
    expect(preview.classes()).toContain("net-preview--error");
  });

  test("nhãn ô số cân ghi rõ gồm giỏ", async () => {
    const wrapper = await mountForm();
    expect(wrapper.text()).toContain("Số cân (gồm giỏ)");
  });

  test("danh mục cá rỗng → thông báo, không lưu được", async () => {
    vi.mocked(FishTypeAPI.getFishTypes).mockResolvedValueOnce({ data: [] });
    const wrapper = await mountForm();
    expect(wrapper.find("#fishType .choice-grid__empty").text()).toContain("Chưa có loại cá — thêm ở trang Danh mục");
    await wrapper.find("#fishWeight").setValue("25");
    expect(saveButton(wrapper).element.disabled).toBe(true);
  });

  test("Enter trong ô số cân → lưu", async () => {
    vi.mocked(FishWeightAPI.saveFishWeight).mockResolvedValue({ success: true, data: { _id: "w1" } });
    const wrapper = await mountForm();
    await fillForm(wrapper, "25");
    await wrapper.find("#fishWeight").trigger("keydown", { key: "Enter", keyCode: 13 });
    await flushPromises();
    expect(FishWeightAPI.saveFishWeight).toHaveBeenCalledTimes(1);
  });
});

test("ô số cân mở bàn phím số trên điện thoại", async () => {
  const wrapper = await mountForm();
  expect(wrapper.find("#fishWeight").attributes("inputmode")).toBe("decimal");
});

test("tải danh mục cá lỗi → báo lỗi tải (không bị xóa khi tải giỏ xong), lưới không bảo đi thêm cá", async () => {
  vi.mocked(FishTypeAPI.getFishTypes).mockRejectedValueOnce(new Error("Network"));
  const wrapper = await mountForm();
  expect(wrapper.find(".error-message").text()).toBe("Không thể tải danh sách loại cá, vui lòng thử lại sau.");
  const empty = wrapper.find("#fishType .choice-grid__empty");
  expect(empty.text()).toBe("Không tải được danh sách loại cá.");
  expect(empty.find("a").exists()).toBe(false);
  expect(wrapper.find("#btnSaveFishWeight").element.disabled).toBe(true);
});

test("đang tải danh mục → lưới hiện 'Đang tải…' thay vì bảo thêm ở Danh mục", async () => {
  let resolveFish;
  vi.mocked(FishTypeAPI.getFishTypes).mockReturnValueOnce(new Promise((resolve) => (resolveFish = resolve)));
  const wrapper = mount(AddWeight);
  await flushPromises();
  expect(wrapper.find("#fishType .choice-grid__empty").text()).toBe("Đang tải…");
  resolveFish({ data: [{ _id: "f1", fishName: "Cá trắm" }] });
  await flushPromises();
  expect(wrapper.find("#fishType .choice-grid__item").text()).toBe("Cá trắm");
});
