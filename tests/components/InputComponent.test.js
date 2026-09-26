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
