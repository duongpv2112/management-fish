import { test, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

import CPDate from "@/components/DateInputComponent.vue";

const mountDate = (modelValue = "2026-09-07") => mount(CPDate, { props: { idControl: "d", modelValue } });

test("hiển thị ngày dạng ngày/tháng/năm trong ô gõ được", () => {
  const wrapper = mountDate();
  const input = wrapper.find("input#d");
  expect(input.element.value).toBe("07/09/2026");
  expect(input.attributes("placeholder")).toBe("dd/mm/yyyy");
  expect(input.attributes("inputmode")).toBe("numeric");
});

test("gõ toàn số → tự chèn / và emit YYYY-MM-DD khi đủ ngày", async () => {
  const wrapper = mountDate("");
  await wrapper.find("input#d").setValue("2709");
  expect(wrapper.find("input#d").element.value).toBe("27/09/");
  await wrapper.find("input#d").setValue("27092026");
  expect(wrapper.find("input#d").element.value).toBe("27/09/2026");
  expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["2026-09-27"]);
});

test("rời ô → viết lại gọn dd/mm/yyyy", async () => {
  const wrapper = mountDate("");
  await wrapper.find("input#d").setValue("1/9/26");
  expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["2026-09-01"]);
  await wrapper.setProps({ modelValue: "2026-09-01" });
  await wrapper.find("input#d").trigger("blur");
  expect(wrapper.find("input#d").element.value).toBe("01/09/2026");
});

test("ngày sai → báo lỗi khi rời ô, emit chuỗi rỗng; sửa đúng thì hết lỗi", async () => {
  const wrapper = mountDate();
  await wrapper.find("input#d").setValue("31/02/2026");
  expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([""]);
  // Đang gõ dở chưa báo lỗi
  expect(wrapper.find(".cp-date__error").exists()).toBe(false);
  await wrapper.find("input#d").trigger("blur");
  expect(wrapper.find(".cp-date__error").text()).toBe("Ngày không hợp lệ, nhập theo dạng ngày/tháng/năm.");
  // Model rỗng do chính ô emit → không xóa chữ đang gõ
  await wrapper.setProps({ modelValue: "" });
  expect(wrapper.find("input#d").element.value).toBe("31/02/2026");

  await wrapper.find("input#d").setValue("28/02/2026");
  expect(wrapper.find(".cp-date__error").exists()).toBe(false);
  expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["2026-02-28"]);
});

test("xóa trắng → emit chuỗi rỗng, không báo lỗi", async () => {
  const wrapper = mountDate();
  await wrapper.find("input#d").setValue("");
  await wrapper.find("input#d").trigger("blur");
  expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([""]);
  expect(wrapper.find(".cp-date__error").exists()).toBe(false);
});

test("giá trị đổi từ ngoài → ô hiện ngày mới", async () => {
  const wrapper = mountDate();
  await wrapper.setProps({ modelValue: "2025-12-31" });
  expect(wrapper.find("input#d").element.value).toBe("31/12/2025");
  await wrapper.setProps({ modelValue: "" });
  expect(wrapper.find("input#d").element.value).toBe("");
});

test("nút lịch: chọn ngày trên lịch → emit và ô hiện ngày đó", async () => {
  const wrapper = mountDate();
  const picker = wrapper.find(".cp-date__picker");
  expect(picker.attributes("type")).toBe("date");
  expect(picker.attributes("aria-label")).toBe("Chọn ngày trên lịch");
  await picker.setValue("2026-10-01");
  expect(wrapper.emitted("update:modelValue").at(-1)).toEqual(["2026-10-01"]);
  expect(wrapper.find("input#d").element.value).toBe("01/10/2026");
});

test("bấm nút lịch → mở bảng chọn ngày (showPicker); trình duyệt không cho thì không lỗi", async () => {
  const wrapper = mountDate();
  const picker = wrapper.find(".cp-date__picker");
  await picker.trigger("click");
  picker.element.showPicker = vi.fn();
  await picker.trigger("click");
  expect(picker.element.showPicker).toHaveBeenCalledTimes(1);
  picker.element.showPicker = vi.fn(() => {
    throw new Error("NotAllowedError");
  });
  await picker.trigger("click");
  expect(picker.element.showPicker).toHaveBeenCalledTimes(1);
});
