import { test, expect, describe, afterEach, vi } from "vitest";
import { nextTick } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import CPCombobox from "@/components/ComboboxComponent.vue";
import { mockRects } from "../helpers/rects";

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

test("bấm vào ô nhập thì mở danh sách đầy đủ, chọn một mục thì emit và đóng", async () => {
  const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData, modelValue: "id1" } });
  expect(wrapper.findAll(".select-item")).toHaveLength(0);

  await wrapper.find("input").trigger("click");
  const items = wrapper.findAll(".select-item");
  expect(items.map((item) => item.text())).toEqual(["Cá trắm", "Cá mè"]);

  await items[1].trigger("click");
  expect(wrapper.emitted().update).toEqual([["id2"]]);
  expect(wrapper.findAll(".select-item")).toHaveLength(0);
});

test("bấm vào ô nhập lần nữa khi đang mở thì danh sách vẫn mở (để gõ lọc)", async () => {
  const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData } });
  await wrapper.find("input").trigger("click");
  await wrapper.find("input").trigger("click");
  expect(wrapper.findAll(".select-item")).toHaveLength(2);
});

test("bấm mũi tên thì mở/đóng danh sách", async () => {
  const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData } });
  await wrapper.find(".combobox-button").trigger("click");
  expect(wrapper.findAll(".select-item")).toHaveLength(2);
  await wrapper.find(".combobox-button").trigger("click");
  expect(wrapper.findAll(".select-item")).toHaveLength(0);
});

test("combobox bị khóa thì bấm vào không mở danh sách", async () => {
  const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData, disabled: true } });
  await wrapper.find(".cp-combobox__control").trigger("click");
  await wrapper.find(".combobox-button").trigger("click");
  expect(wrapper.findAll(".select-item")).toHaveLength(0);
});

describe("hướng mở danh sách theo chỗ trống", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  const openAt = async (top) => {
    window.innerWidth = 400;
    window.innerHeight = 800;
    mockRects({
      "cp-combobox__input": { left: 12, top, width: 300, height: 40 },
      "cp-combobox__select": { width: 300, height: 200 },
    });
    const wrapper = mount(CPCombobox, { props: { ...baseProps, lstData, modelValue: null } });
    await wrapper.find("input").trigger("click");
    await flushPromises();
    return wrapper.find(".cp-combobox__select");
  };

  test("đủ chỗ bên dưới → mở xuống", async () => {
    expect((await openAt(100)).classes()).not.toContain("cp-combobox__select--up");
  });

  test("ô sát đáy màn hình → mở lên trên", async () => {
    expect((await openAt(700)).classes()).toContain("cp-combobox__select--up");
  });
});
