<template>
  <div class="catalog-manager">
    <h2>{{ title }}</h2>

    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
    <div class="success-message" v-if="successMessage">{{ successMessage }}</div>

    <div class="catalog-add">
      <template v-for="field in fields" :key="field.key">
        <div v-if="field.type === 'select'" class="catalog-add__field catalog-add__select">
          <label class="catalog-add__label" :for="`${idPrefix}-new-${field.key}`">{{ field.label }}</label>
          <CPSelect
            :idControl="`${idPrefix}-new-${field.key}`"
            v-model="newItem[field.key]"
            :options="field.options"
          />
        </div>
        <CPInput
          v-else
          class="catalog-add__field"
          :idControl="`${idPrefix}-new-${field.key}`"
          :labelControl="field.label"
          :modelValue="newItem[field.key]"
          :placeholderText="field.placeholder"
          :typeInput="field.type === 'number' ? 1 : 2"
          height="40px"
          @update="($event) => (newItem[field.key] = $event)"
          @enter="addItem"
        />
      </template>
      <CPButton
        class="catalog-add__button"
        typeButton="primary"
        textButton="Thêm mới"
        height="40px"
        :disabled="isSaving"
        @click="addItem"
      />
    </div>

    <table class="catalog-table">
      <thead>
        <tr>
          <th v-for="field in fields" :key="field.key">{{ field.label }}</th>
          <th class="catalog-table__actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0">
          <td :colspan="fields.length + 1" class="catalog-table__empty">
            {{ isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu." }}
          </td>
        </tr>
        <tr v-for="item in items" :key="item._id" class="catalog-row">
          <template v-if="editingId === item._id">
            <td v-for="field in fields" :key="field.key">
              <CPSelect
                v-if="field.type === 'select'"
                :idControl="`${idPrefix}-edit-${field.key}`"
                v-model="editingItem[field.key]"
                :options="field.options"
              />
              <CPInput
                v-else
                :idControl="`${idPrefix}-edit-${field.key}`"
                :modelValue="editingItem[field.key]"
                :typeInput="field.type === 'number' ? 1 : 2"
                height="32px"
                @update="($event) => (editingItem[field.key] = $event)"
                @enter="saveEdit"
              />
            </td>
            <td class="catalog-table__actions">
              <CPButton class="btn-save" typeButton="primary" textButton="Lưu" :disabled="isSaving" @click="saveEdit" />
              <CPButton class="btn-cancel" textButton="Hủy" @click="cancelEdit" />
            </td>
          </template>
          <template v-else>
            <td
              v-for="field in fields"
              :key="field.key"
              :class="`catalog-row__${field.type === 'number' ? 'number' : 'name'}`"
            >
              {{ displayValue(field, item[field.key]) }}
            </td>
            <td class="catalog-table__actions">
              <CPButton class="btn-edit" textButton="Sửa" @click="startEdit(item)" />
              <CPButton class="btn-delete" typeButton="danger" textButton="Xóa" @click="deleteItem(item)" />
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";

import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import CPSelect from "@/components/SelectComponent.vue";
import { common } from "@/common/common";

const props = defineProps({
  // Tiêu đề khối, ví dụ "Loại cá"
  title: {
    type: String,
    required: true,
  },
  // Tên dùng trong thông báo, ví dụ "loại cá"
  entityLabel: {
    type: String,
    required: true,
  },
  // Tiền tố id cho các ô nhập, ví dụ "fishType"
  idPrefix: {
    type: String,
    required: true,
  },
  // [{ key, label, type: "text" | "number" | "select", optional?, placeholder, invalidMessage, options?, defaultValue? }];
  // trường text đầu tiên là tên. optional (chỉ cho "number"): bỏ trống gửi null.
  // select: options [{ value, label }] (CPSelect), bảng hiện label, gửi value; defaultValue là giá trị ban đầu khi thêm
  fields: {
    type: Array,
    required: true,
  },
  // { list(), create(data), update(id, data), remove(id) } — trả Promise, reject Error(message) khi lỗi
  api: {
    type: Object,
    required: true,
  },
});

const items = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const editingId = ref(null);

const emptyItem = () =>
  Object.fromEntries(props.fields.map((field) => [field.key, field.defaultValue ?? ""]));

const newItem = reactive(emptyItem());
const editingItem = reactive(emptyItem());

const nameField = props.fields.find((field) => field.type === "text");

// Ô chọn hiện nhãn của lựa chọn thay vì giá trị lưu
const displayValue = (field, value) =>
  field.type === "select" ? field.options.find((option) => option.value === value)?.label ?? value : value;

const clearMessages = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const loadItems = async () => {
  isLoading.value = true;
  try {
    const result = await props.api.list();
    items.value = result?.data ?? [];
  } catch (error) {
    errorMessage.value = `Không thể tải danh sách ${props.entityLabel}, vui lòng thử lại sau.`;
    console.error(`Lỗi khi tải danh sách ${props.entityLabel}:`, error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * Chuẩn hóa và kiểm tra dữ liệu nhập
 * @returns {{ data?: object, message?: string }}
 */
const buildPayload = (values) => {
  const data = {};
  for (const field of props.fields) {
    if (field.type === "select") {
      data[field.key] = values[field.key];
    } else if (field.type === "number") {
      // Trường số không bắt buộc: bỏ trống thì gửi null
      if (field.optional && (values[field.key] ?? "").toString().trim() === "") {
        data[field.key] = null;
        continue;
      }
      const value = common.parseDecimal(values[field.key]);
      if (value === null || value < 0) {
        return { message: field.invalidMessage };
      }
      data[field.key] = value;
    } else {
      const value = (values[field.key] ?? "").toString().trim();
      if (!value) {
        return { message: `Tên ${props.entityLabel} không được để trống!` };
      }
      data[field.key] = value;
    }
  }
  return { data };
};

const runSave = async (action, successText) => {
  isSaving.value = true;
  try {
    await action();
    successMessage.value = successText;
    await loadItems();
    return true;
  } catch (error) {
    // Hiện nguyên văn message server trả về (ví dụ "Tên loại cá đã tồn tại!")
    errorMessage.value = error?.message || "Có lỗi xảy ra, vui lòng thử lại sau.";
    return false;
  } finally {
    isSaving.value = false;
  }
};

const addItem = async () => {
  clearMessages();
  const { data, message } = buildPayload(newItem);
  if (message) {
    errorMessage.value = message;
    return;
  }
  const ok = await runSave(() => props.api.create(data), `Thêm ${props.entityLabel} thành công!`);
  if (ok) Object.assign(newItem, emptyItem());
};

const startEdit = (item) => {
  clearMessages();
  editingId.value = item._id;
  props.fields.forEach((field) => {
    editingItem[field.key] = item[field.key] === undefined || item[field.key] === null ? "" : String(item[field.key]);
  });
};

const cancelEdit = () => {
  editingId.value = null;
};

const saveEdit = async () => {
  clearMessages();
  const { data, message } = buildPayload(editingItem);
  if (message) {
    errorMessage.value = message;
    return;
  }
  const ok = await runSave(
    () => props.api.update(editingId.value, data),
    `Cập nhật ${props.entityLabel} thành công!`
  );
  if (ok) editingId.value = null;
};

const deleteItem = async (item) => {
  clearMessages();
  if (!window.confirm(`Xóa ${props.entityLabel} "${item[nameField.key]}"?`)) return;
  await runSave(() => props.api.remove(item._id), `Xóa ${props.entityLabel} thành công!`);
};

onMounted(loadItems);
</script>

<style lang="scss" scoped>
.catalog-manager {
  flex: 1;
  min-width: 320px;
  background-color: $color-card-background;
  border-radius: $radius-lg;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;

  h2 {
    font-size: 18px;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: 16px;
    text-align: center;
  }

  .error-message,
  .success-message {
    margin-bottom: 16px;
    font-size: 14px;
    padding: 8px;
    border-radius: $radius-md;
    text-align: center;
  }

  .error-message {
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .success-message {
    color: $color-success;
    background-color: lighten($color-success, 40%);
  }

  .catalog-add {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 16px;

    .catalog-add__field {
      flex: 1;
      min-width: 140px;
    }

    // Cùng kiểu nhãn với CPInput
    .catalog-add__label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #172b4d;
    }
  }

  .catalog-table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      border: 1px solid $color-border;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background-color: $color-secondary;
      color: $color-card-background;
      font-weight: 600;
    }

    tr:hover {
      background-color: $color-hover;
    }

    .catalog-table__actions {
      width: 1%;
      white-space: nowrap;

      :deep(.cp-button) {
        display: inline-block;
        margin-right: 8px;
      }
    }

    .catalog-table__empty {
      text-align: center;
      color: $color-text-primary;
    }
  }
}

// Điện thoại: ô nhập và nút trong danh mục cao 48px
@media (max-width: 899.98px) {
  :deep(.cp-input__control),
  :deep(.cp-button__content) {
    min-height: 48px;
  }
}
</style>
