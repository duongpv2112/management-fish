import { mount } from "@vue/test-utils";
import { expect, test } from "vitest";

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
