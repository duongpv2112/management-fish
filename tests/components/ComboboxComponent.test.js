import { test, expect } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import CPCombobox from "@/components/ComboboxComponent.vue";

const lstData = [
  { _id: "id1", fishName: "Cá trắm" },
  { _id: "id2", fishName: "Cá mè" },
];
const baseProps = { dataField: "_id", dataFieldText: "fishName" };

test("hiển thị tên theo modelValue và đồng bộ khi modelValue đổi", async () => {
  const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData, modelValue: "id1" } });
  await nextTick();
  const input = wrapper.find("input");
  expect(input.element.value).toBe("Cá trắm");

  await wrapper.setProps({ modelValue: null });
  expect(input.element.value).toBe("");

  await wrapper.setProps({ modelValue: "id2" });
  expect(input.element.value).toBe("Cá mè");
});

test("hiển thị đúng tên khi lstData đến sau", async () => {
  const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData: [], modelValue: "id2" } });
  expect(wrapper.find("input").element.value).toBe("");

  await wrapper.setProps({ lstData });
  expect(wrapper.find("input").element.value).toBe("Cá mè");
});
