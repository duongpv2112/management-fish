import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CPInput from "@/components/InputComponent.vue";

const pressKey = (wrapper, key) => {
  const event = new KeyboardEvent("keydown", { key, cancelable: true });
  wrapper.find("input").element.dispatchEvent(event);
  return event.defaultPrevented;
};

test.each([",", ".", "5"])("ô số cho phép phím %j", (key) => {
  const wrapper = mount(CPInput, { props: { typeInput: 1 } });
  expect(pressKey(wrapper, key)).toBe(false);
});

test("ô số chặn phím chữ", () => {
  const wrapper = mount(CPInput, { props: { typeInput: 1 } });
  expect(pressKey(wrapper, "a")).toBe(true);
});

test("ô số (typeInput 1) bật bàn phím số thập phân trên điện thoại", () => {
  const wrapper = mount(CPInput, { props: { typeInput: 1 } });
  expect(wrapper.find("input").attributes("inputmode")).toBe("decimal");
});

test("ô chữ không đặt inputmode; truyền inputmode thì dùng giá trị đó", () => {
  expect(mount(CPInput).find("input").attributes("inputmode")).toBeUndefined();
  const numeric = mount(CPInput, { props: { typeInput: 1, inputmode: "numeric" } });
  expect(numeric.find("input").attributes("inputmode")).toBe("numeric");
});
