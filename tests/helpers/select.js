// Chọn một mục trong CPSelect: bấm nút mở rồi bấm mục có data-value tương ứng
export const chooseOption = async (wrapper, selector, value) => {
  await wrapper.find(selector).trigger("click");
  await wrapper.find(`${selector}-list [data-value="${value}"]`).trigger("click");
};
