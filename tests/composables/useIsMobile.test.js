import { test, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { useIsMobile, MOBILE_QUERY } from "@/composables/useIsMobile";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

const mockMatchMedia = (matches) => {
  const listeners = [];
  const mql = {
    matches,
    addEventListener: vi.fn((_, listener) => listeners.push(listener)),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn(() => mql);
  return { mql, fire: (value) => listeners.forEach((listener) => listener({ matches: value })) };
};

const mountProbe = () =>
  mount({
    setup() {
      return { isMobile: useIsMobile() };
    },
    template: "<div>{{ isMobile }}</div>",
  });

test("ngưỡng 900px", () => {
  expect(MOBILE_QUERY).toBe("(max-width: 899.98px)");
});

test("theo matchMedia và cập nhật khi đổi kích thước; gỡ listener khi unmount", async () => {
  const { mql, fire } = mockMatchMedia(true);
  const wrapper = mountProbe();
  expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 899.98px)");
  expect(wrapper.vm.isMobile).toBe(true);

  fire(false);
  await nextTick();
  expect(wrapper.vm.isMobile).toBe(false);

  wrapper.unmount();
  expect(mql.removeEventListener).toHaveBeenCalled();
});

test("không có matchMedia → máy tính", () => {
  window.matchMedia = undefined;
  expect(mountProbe().vm.isMobile).toBe(false);
});

test("đang in (beforeprint → afterprint) thì bỏ qua thay đổi cỡ trang: không đổi bố cục giữa lúc in", async () => {
  const { mql, fire } = mockMatchMedia(false);
  const wrapper = mountProbe();

  window.dispatchEvent(new Event("beforeprint"));
  mql.matches = true;
  fire(true);
  await nextTick();
  expect(wrapper.vm.isMobile).toBe(false);

  mql.matches = false;
  window.dispatchEvent(new Event("afterprint"));
  await nextTick();
  expect(wrapper.vm.isMobile).toBe(false);

  // In xong: thay đổi kích thước thật lại có tác dụng
  fire(true);
  await nextTick();
  expect(wrapper.vm.isMobile).toBe(true);
  wrapper.unmount();
});

test("sau khi in, lấy lại giá trị hiện tại của màn hình", async () => {
  const { mql, fire } = mockMatchMedia(false);
  const wrapper = mountProbe();
  window.dispatchEvent(new Event("beforeprint"));
  fire(true);
  mql.matches = true;
  window.dispatchEvent(new Event("afterprint"));
  await nextTick();
  expect(wrapper.vm.isMobile).toBe(true);
  wrapper.unmount();
});
