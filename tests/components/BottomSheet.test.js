import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import BottomSheet from "@/components/BottomSheet.vue";

const mountSheet = (props = {}) =>
  mount(BottomSheet, {
    props: { open: true, title: "Chọn loại cá", ...props },
    slots: { default: '<p class="content">Nội dung</p>' },
  });

test("đóng thì không render", () => {
  const wrapper = mountSheet({ open: false });
  expect(wrapper.find(".bottom-sheet").exists()).toBe(false);
  wrapper.unmount();
});

test("mở thì có tiêu đề, nội dung và role dialog", () => {
  const wrapper = mountSheet();
  const sheet = wrapper.find(".bottom-sheet");
  expect(sheet.attributes("role")).toBe("dialog");
  expect(sheet.attributes("aria-modal")).toBe("true");
  expect(sheet.text()).toContain("Chọn loại cá");
  expect(wrapper.find(".content").exists()).toBe(true);
  wrapper.unmount();
});

test("bấm nền → emit close; bấm trong sheet thì không", async () => {
  const wrapper = mountSheet();
  await wrapper.find(".content").trigger("click");
  expect(wrapper.emitted().close).toBeUndefined();
  await wrapper.find(".bottom-sheet__backdrop").trigger("click");
  expect(wrapper.emitted().close).toHaveLength(1);
  wrapper.unmount();
});

test("phím Esc → emit close", () => {
  const wrapper = mountSheet();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(wrapper.emitted().close).toHaveLength(1);
  wrapper.unmount();
});

test("đang đóng thì Esc không emit", () => {
  const wrapper = mountSheet({ open: false });
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(wrapper.emitted().close).toBeUndefined();
  wrapper.unmount();
});
