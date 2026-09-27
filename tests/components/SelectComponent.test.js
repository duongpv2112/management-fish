import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, test, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mockRects } from "../helpers/rects";

import CPSelect from "@/components/SelectComponent.vue";

const options = [
  { value: "VND", label: "VND (đ)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

const mountSelect = (props = {}) =>
  mount(CPSelect, { props: { idControl: "sel", options, modelValue: "VND", ...props } });

const optionTexts = (wrapper) => wrapper.findAll("[role='option']").map((item) => item.text());

test("hiện nhãn của giá trị đang chọn, danh sách đóng", () => {
  const wrapper = mountSelect();
  expect(wrapper.find("#sel").text()).toContain("VND (đ)");
  expect(wrapper.find("#sel").attributes("aria-expanded")).toBe("false");
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
});

test("bấm vào thì mở danh sách, mục đang chọn có aria-selected", async () => {
  const wrapper = mountSelect();
  await wrapper.find("#sel").trigger("click");
  expect(wrapper.find("#sel").attributes("aria-expanded")).toBe("true");
  expect(optionTexts(wrapper)).toEqual(["VND (đ)", "USD ($)", "EUR (€)"]);
  expect(wrapper.find("[data-value='VND']").attributes("aria-selected")).toBe("true");
  expect(wrapper.find("[data-value='USD']").attributes("aria-selected")).toBe("false");
});

test("bấm một mục khác: phát update:modelValue và change rồi đóng", async () => {
  const wrapper = mountSelect();
  await wrapper.find("#sel").trigger("click");
  await wrapper.find("[data-value='USD']").trigger("click");
  expect(wrapper.emitted("update:modelValue")).toEqual([["USD"]]);
  expect(wrapper.emitted("change")).toEqual([["USD"]]);
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
});

test("bấm lại mục đang chọn: không phát sự kiện, chỉ đóng", async () => {
  const wrapper = mountSelect();
  await wrapper.find("#sel").trigger("click");
  await wrapper.find("[data-value='VND']").trigger("click");
  expect(wrapper.emitted("change")).toBeUndefined();
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
});

test("bàn phím: mũi tên xuống mở và di chuyển, Enter chọn", async () => {
  const wrapper = mountSelect();
  const trigger = wrapper.find("#sel");
  await trigger.trigger("keydown", { key: "ArrowDown" });
  expect(wrapper.find("[role='listbox']").exists()).toBe(true);
  expect(wrapper.find(".cp-select__option--active").text()).toContain("VND (đ)");

  await trigger.trigger("keydown", { key: "ArrowDown" });
  await trigger.trigger("keydown", { key: "ArrowDown" });
  expect(wrapper.find(".cp-select__option--active").text()).toContain("EUR (€)");
  await trigger.trigger("keydown", { key: "ArrowDown" });
  expect(wrapper.find(".cp-select__option--active").text()).toContain("EUR (€)");
  await trigger.trigger("keydown", { key: "ArrowUp" });
  await trigger.trigger("keydown", { key: "Enter" });
  expect(wrapper.emitted("change")).toEqual([["USD"]]);
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
});

test("Esc đóng danh sách mà không chọn", async () => {
  const wrapper = mountSelect();
  const trigger = wrapper.find("#sel");
  await trigger.trigger("click");
  await trigger.trigger("keydown", { key: "ArrowDown" });
  await trigger.trigger("keydown", { key: "Escape" });
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
  expect(wrapper.emitted("change")).toBeUndefined();
});

test("bị khóa thì bấm không mở", async () => {
  const wrapper = mountSelect({ disabled: true });
  await wrapper.find("#sel").trigger("click");
  expect(wrapper.find("#sel").attributes("disabled")).toBeDefined();
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
});

test("bấm ra ngoài thì đóng", async () => {
  const wrapper = mountSelect();
  await wrapper.find("#sel").trigger("click");
  document.body.click();
  await wrapper.vm.$nextTick();
  expect(wrapper.find("[role='listbox']").exists()).toBe(false);
});

test("đổi modelValue từ ngoài thì nhãn đổi theo", async () => {
  const wrapper = mountSelect();
  await wrapper.setProps({ modelValue: "USD" });
  expect(wrapper.find("#sel").text()).toContain("USD ($)");
});

describe("hướng mở danh sách theo chỗ trống", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  const openAt = async (rects) => {
    window.innerWidth = 400;
    window.innerHeight = 800;
    mockRects(rects);
    const wrapper = mountSelect();
    await wrapper.find("#sel").trigger("click");
    await flushPromises();
    return wrapper.find("[role='listbox']");
  };

  test("đủ chỗ → căn phải, mở xuống như cũ", async () => {
    const list = await openAt({
      "cp-select__trigger": { left: 200, top: 100, width: 140, height: 40 },
      "cp-select__list": { width: 200, height: 150 },
    });
    expect(list.classes()).not.toContain("cp-select__list--start");
    expect(list.classes()).not.toContain("cp-select__list--up");
  });

  test("ô sát mép trái, danh sách rộng hơn ô → căn trái (mở sang phải)", async () => {
    const list = await openAt({
      "cp-select__trigger": { left: 12, top: 100, width: 140, height: 40 },
      "cp-select__list": { width: 260, height: 150 },
    });
    expect(list.classes()).toContain("cp-select__list--start");
  });

  test("ô sát đáy màn hình → mở lên trên", async () => {
    const list = await openAt({
      "cp-select__trigger": { left: 200, top: 700, width: 140, height: 40 },
      "cp-select__list": { width: 140, height: 150 },
    });
    expect(list.classes()).toContain("cp-select__list--up");
  });

  test("danh sách dài hơn cả hai phía → giới hạn chiều cao, cuộn trong danh sách", async () => {
    const list = await openAt({
      "cp-select__trigger": { left: 200, top: 100, width: 140, height: 40 },
      "cp-select__list": { width: 140, height: 900 },
    });
    expect(list.attributes("style")).toContain("max-height: 648px");
  });
});
