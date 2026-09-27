<template>
  <BottomSheet :open="open" :title="isEdit ? 'Sửa khoản chi' : 'Thêm khoản chi'" @close="emit('close')">
    <div class="expense-form">
      <div class="expense-form__error" v-if="errorMessage">{{ errorMessage }}</div>

      <div class="expense-form__label">Nhóm chi</div>
      <ChoiceGrid
        idPrefix="expenseCategory"
        :items="categoryChoices"
        :modelValue="categoryId"
        textField="categoryName"
        :maxVisible="8"
        moreLabel="Nhóm khác"
        :emptyText="isLoading ? 'Đang tải...' : 'Chưa có nhóm chi.'"
        :showCatalogLink="!isLoading"
        :disabled="isSaving"
        @update="selectCategory"
      />

      <div class="expense-form__label">Chi cho ao nào?</div>
      <ChoiceGrid
        idPrefix="expenseCrop"
        :items="cropChoices"
        :modelValue="cropChoice"
        textField="label"
        :subText="(item) => item.sub"
        :maxVisible="8"
        moreLabel="Ao khác"
        :disabled="isSaving"
        @update="($event) => (cropChoice = $event)"
      />

      <label class="expense-form__label" for="expense-date">Ngày</label>
      <CPDate idControl="expense-date" v-model="date" />

      <div class="expense-form__description">
        <CPInput
          idControl="expense-description"
          labelControl="Mô tả"
          :modelValue="description"
          placeholderText="Ví dụ: Cám viên 40 đạm"
          height="44px"
          @update="($event) => (description = $event)"
        />
        <div v-if="visibleSuggestions.length > 0" class="expense-form__suggestions">
          <button
            v-for="suggestion in visibleSuggestions"
            :key="suggestion.description"
            type="button"
            class="expense-form__suggestion"
            @click="applySuggestion(suggestion)"
          >
            {{ suggestion.description }}
          </button>
        </div>
      </div>

      <div class="expense-form__row">
        <CPInput
          idControl="expense-quantity"
          labelControl="Số lượng"
          :modelValue="quantityText"
          placeholderText="Không bắt buộc"
          :typeInput="1"
          height="44px"
          @update="($event) => (quantityText = $event)"
        />
        <CPInput
          idControl="expense-unit"
          labelControl="Đơn vị"
          :modelValue="unit"
          placeholderText="bao, kg, con…"
          height="44px"
          @update="($event) => (unit = $event)"
        />
      </div>

      <div class="expense-form__row">
        <CPInput
          idControl="expense-unitPrice"
          labelControl="Đơn giá (đ)"
          :modelValue="unitPriceText"
          placeholderText="Không bắt buộc"
          :typeInput="1"
          height="44px"
          @update="($event) => (unitPriceText = $event)"
        />
        <CPInput
          v-if="showKgPerUnit"
          idControl="expense-kgPerUnit"
          :labelControl="`kg / 1 ${unit.trim()}`"
          :modelValue="kgPerUnitText"
          placeholderText="Ví dụ: 25"
          :typeInput="1"
          height="44px"
          @update="($event) => (kgPerUnitText = $event)"
        />
      </div>

      <div v-if="autoAmount !== null" class="expense-form__auto-amount">
        Thành tiền: <strong>{{ formatMoney(autoAmount) }}</strong>
      </div>
      <CPInput
        v-else
        idControl="expense-amount"
        labelControl="Số tiền (đ)"
        :modelValue="amountText"
        placeholderText="Ví dụ: 600.000"
        :typeInput="1"
        height="44px"
        @update="($event) => (amountText = $event)"
      />

      <CPInput
        idControl="expense-note"
        labelControl="Ghi chú"
        :modelValue="note"
        placeholderText="Không bắt buộc"
        height="44px"
        @update="($event) => (note = $event)"
      />

      <div class="expense-form__actions">
        <CPButton
          v-if="isEdit"
          class="btn-expense-delete"
          typeButton="danger"
          textButton="Xóa"
          height="48px"
          :disabled="isSaving"
          @click="deleteExpense"
        />
        <CPButton
          class="btn-expense-save"
          typeButton="primary"
          textButton="Lưu"
          height="48px"
          :disabled="!canSave || isSaving"
          @click="save"
        />
      </div>
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import BottomSheet from "@/components/BottomSheet.vue";
import ChoiceGrid from "@/components/ChoiceGrid.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import CPDate from "@/components/DateInputComponent.vue";
import ExpenseCategoryAPI from "@/services/expenseCategoryAPI";
import CropAPI from "@/services/cropAPI";
import ExpenseAPI from "@/services/expenseAPI";
import { common } from "@/common/common";
import { formatMoney, formatPriceInput, parseMoney } from "@/common/currency";
import { todayInputValue } from "@/common/dateInput";
import { normalizeVi } from "@/voice/vietnameseNumber";

// Thêm / sửa một khoản chi (VND). Khoản chung (không thuộc vụ nào) dùng lựa chọn "Chung".
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  // null = thêm mới; có giá trị = sửa (category, crop đã populate)
  expense: {
    type: Object,
    default: null,
  },
  // Thêm mới: vụ chọn sẵn; null = "Chung"; bỏ trống = chưa chọn
  defaultCropId: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(["close", "saved", "deleted"]);

const COMMON = "__common";
const MAX_VISIBLE_SUGGESTIONS = 5;

const categories = ref([]);
// Tất cả vụ (kể cả đã kết thúc): lưới chỉ hiện vụ đang nuôi + vụ được chọn sẵn / của khoản đang sửa
const allCrops = ref([]);
const suggestions = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");

const categoryId = ref(null);
const cropChoice = ref(null);
const date = ref(todayInputValue());
const description = ref("");
const quantityText = ref("");
const unit = ref("");
const unitPriceText = ref("");
const kgPerUnitText = ref("");
const amountText = ref("");
const note = ref("");

const isEdit = computed(() => Boolean(props.expense));

const selectedCategory = computed(() => categoryChoices.value.find((category) => category._id === categoryId.value));

// Nhóm chi (còn dùng) + nhóm của khoản đang sửa nếu nhóm đó đã bị xóa, để nhóm đang chọn luôn hiện
const categoryChoices = computed(() => {
  const editingCategory = props.expense?.category;
  if (!editingCategory || categories.value.some((category) => category._id === editingCategory._id)) {
    return categories.value;
  }
  return [...categories.value, editingCategory];
});

// Vụ đang nuôi + vụ đang được chọn (có thể đã kết thúc: thêm từ báo cáo vụ cũ, hoặc sửa khoản cũ) + "Chung"
const cropChoices = computed(() => {
  const crops = allCrops.value.filter((crop) => crop.status === "open" || crop._id === props.defaultCropId);
  const editingCrop = props.expense?.crop;
  if (editingCrop && !crops.some((crop) => crop._id === editingCrop._id)) crops.push(editingCrop);
  return [
    ...crops.map((crop) => ({ _id: crop._id, label: crop.pond?.pondName ?? crop.cropName, sub: crop.cropName })),
    { _id: COMMON, label: "Chung", sub: "Chi phí chung" },
  ];
});

// Số lượng gõ kiểu Việt Nam: "5.000" là năm nghìn (dấu chấm ngăn nghìn), "2,5" hay "1.5" là số lẻ
const parseQuantity = (text) => {
  const trimmed = (text ?? "").toString().trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) return Number(trimmed.replace(/\./g, ""));
  return common.parseDecimal(trimmed);
};

const quantity = computed(() => parseQuantity(quantityText.value));
const unitPrice = computed(() => parseMoney(unitPriceText.value));
// Có cả số lượng và đơn giá thì tự tính thành tiền (server cũng tính lại như vậy)
const autoAmount = computed(() =>
  quantity.value !== null && unitPrice.value !== null ? Math.round(quantity.value * unitPrice.value) : null
);
const amount = computed(() => autoAmount.value ?? parseMoney(amountText.value));

// Chỉ nhóm thức ăn mới cần quy đổi ra kg, khi đơn vị không phải kg
const showKgPerUnit = computed(
  () => selectedCategory.value?.metric === "feed" && unit.value.trim() !== "" && unit.value.trim().toLowerCase() !== "kg"
);

const canSave = computed(() => Boolean(categoryId.value) && cropChoice.value !== null && amount.value > 0);

const visibleSuggestions = computed(() => {
  const typed = normalizeVi(description.value);
  return suggestions.value
    .filter((suggestion) => suggestion.description !== description.value)
    .filter((suggestion) => !typed || normalizeVi(suggestion.description).includes(typed))
    .slice(0, MAX_VISIBLE_SUGGESTIONS);
});

const loadSuggestions = async (id) => {
  try {
    suggestions.value = (await ExpenseAPI.getExpenseSuggestions(id))?.data ?? [];
  } catch (error) {
    suggestions.value = [];
    console.error("Lỗi khi tải gợi ý khoản chi:", error);
  }
};

const selectCategory = async (id) => {
  categoryId.value = id;
  await loadSuggestions(id);
  // Đơn vị lần gần nhất của nhóm (vd. Cám → bao) khi chưa nhập
  if (!unit.value.trim() && suggestions.value[0]?.unit) unit.value = suggestions.value[0].unit;
};

const applySuggestion = (suggestion) => {
  description.value = suggestion.description;
  unit.value = suggestion.unit ?? "";
  unitPriceText.value = formatPriceInput(suggestion.unitPrice);
  kgPerUnitText.value = suggestion.kgPerUnit ? String(suggestion.kgPerUnit) : "";
};

const numberText = (value) => (value === null || value === undefined ? "" : String(value).replace(".", ","));

const fillForm = () => {
  const expense = props.expense;
  errorMessage.value = "";
  suggestions.value = [];
  categoryId.value = expense?.category?._id ?? null;
  cropChoice.value = expense
    ? expense.crop?._id ?? COMMON
    : props.defaultCropId === undefined
      ? null
      : props.defaultCropId ?? COMMON;
  date.value = expense ? String(expense.date).slice(0, 10) : todayInputValue();
  description.value = expense?.description ?? "";
  quantityText.value = numberText(expense?.quantity);
  unit.value = expense?.unit ?? "";
  unitPriceText.value = formatPriceInput(expense?.unitPrice);
  kgPerUnitText.value = numberText(expense?.kgPerUnit);
  amountText.value = expense ? formatPriceInput(expense.amount) : "";
  note.value = expense?.note ?? "";
};

const loadChoices = async () => {
  isLoading.value = true;
  try {
    const [categoryResult, cropResult] = await Promise.all([
      ExpenseCategoryAPI.getExpenseCategories(),
      CropAPI.getCrops(),
    ]);
    categories.value = categoryResult?.data ?? [];
    allCrops.value = cropResult?.data ?? [];
  } catch (error) {
    errorMessage.value = "Không thể tải nhóm chi và vụ nuôi, vui lòng thử lại sau.";
    console.error("Lỗi khi tải nhóm chi / vụ nuôi:", error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    fillForm();
    await loadChoices();
    if (categoryId.value) await loadSuggestions(categoryId.value);
  }
);

const buildPayload = () => ({
  categoryId: categoryId.value,
  cropId: cropChoice.value === COMMON ? null : cropChoice.value,
  date: date.value,
  description: description.value.trim(),
  quantity: quantity.value,
  unit: unit.value.trim(),
  unitPrice: unitPrice.value,
  kgPerUnit: showKgPerUnit.value ? common.parseDecimal(kgPerUnitText.value) : null,
  amount: amount.value,
  note: note.value.trim(),
});

const save = async () => {
  errorMessage.value = "";
  isSaving.value = true;
  try {
    const result = isEdit.value
      ? await ExpenseAPI.updateExpense(props.expense._id, buildPayload())
      : await ExpenseAPI.createExpense(buildPayload());
    emit("saved", { expense: result?.data, isNew: !isEdit.value });
  } catch (error) {
    errorMessage.value = error?.message || "Lưu khoản chi không thành công!";
  } finally {
    isSaving.value = false;
  }
};

const deleteExpense = async () => {
  if (!window.confirm("Xóa khoản chi này?")) return;
  errorMessage.value = "";
  isSaving.value = true;
  try {
    await ExpenseAPI.deleteExpense(props.expense._id);
    emit("deleted", props.expense);
  } catch (error) {
    errorMessage.value = error?.message || "Xóa khoản chi không thành công!";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.expense-form {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .expense-form__error {
    padding: 8px;
    border-radius: $radius-md;
    font-size: 14px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .expense-form__label {
    font-weight: 600;
    margin-bottom: -4px;
  }

  .expense-form__suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .expense-form__suggestion {
    min-height: 36px;
    padding: 4px 10px;
    border: 1px solid $color-border-strong;
    border-radius: $radius-md;
    background-color: $color-card-background;
    color: $color-text-primary;
    font-size: 14px;
    cursor: pointer;
  }

  .expense-form__row {
    display: flex;
    gap: 8px;

    > * {
      flex: 1;
      min-width: 0;
    }
  }

  .expense-form__auto-amount {
    padding: 10px 12px;
    border-radius: $radius-md;
    background-color: $color-hover;

    strong {
      color: $color-primary;
    }
  }

  // Nút Lưu luôn thấy được ở đáy sheet dù form dài
  .expense-form__actions {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    gap: 8px;
    padding: 8px 0 4px;
    background-color: $color-card-background;

    > * {
      flex: 1;
    }
  }
}
</style>
