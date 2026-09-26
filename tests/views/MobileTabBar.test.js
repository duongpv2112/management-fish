import { test, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MobileTabBar from "@/views/ManagementFish/components/MobileTabBar.vue";

test("3 tab Cân / Bảng / Tiền, tab đang chọn có aria-current", () => {
  const wrapper = mount(MobileTabBar, { props: { modelValue: "bang" } });
  const tabs = wrapper.findAll(".mobile-tab-bar__tab");
  expect(tabs.map((tab) => tab.find(".mobile-tab-bar__label").text())).toEqual(["Cân", "Bảng", "Tiền"]);
  expect(tabs[1].attributes("aria-current")).toBe("page");
  expect(tabs[0].attributes("aria-current")).toBeUndefined();
});

test("bấm tab → emit update:modelValue", async () => {
  const wrapper = mount(MobileTabBar, { props: { modelValue: "can" } });
  await wrapper.findAll(".mobile-tab-bar__tab")[2].trigger("click");
  expect(wrapper.emitted()["update:modelValue"]).toEqual([["tien"]]);
});
