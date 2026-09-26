<template>
  <div class="session-bar">
    <CPCombobox
      class="session-bar__select"
      idControl="sessionSelect"
      labelControl="Phiên cân"
      :modelValue="selectedId"
      height="36px"
      placeholderText="Chưa có phiên cân"
      :lstData="sessionOptions"
      dataField="_id"
      dataFieldText="label"
      @update="($event) => emit('select', $event)"
    />
    <div class="session-bar__actions">
      <CPButton
        class="btn-new-session"
        textButton="Phiên mới"
        height="36px"
        :disabled="isSaving"
        @click="createSession"
      />
      <CPButton
        v-if="selectedSession?.status === 'open'"
        class="btn-close-session"
        textButton="Kết thúc phiên"
        height="36px"
        :disabled="isSaving"
        @click="closeSession"
      />
    </div>
    <div class="session-bar__error" v-if="errorMessage">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

import CPCombobox from "@/components/ComboboxComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import WeighSessionAPI from "@/services/weighSessionAPI";

const props = defineProps({
  // Danh sách phiên, mới nhất trước
  sessions: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["select", "created", "closed"]);

const isSaving = ref(false);
const errorMessage = ref("");

// "Phiên 26/09/2026 — Anh Tuấn (đang mở)"
const sessionOptions = computed(() =>
  props.sessions.map((session) => ({
    _id: session._id,
    label:
      session.sessionName +
      (session.buyerName ? ` — ${session.buyerName}` : "") +
      (session.status === "open" ? " (đang mở)" : ""),
  }))
);

const selectedSession = computed(() =>
  props.sessions.find((session) => session._id === props.selectedId)
);

const createSession = async () => {
  errorMessage.value = "";
  const buyerName = window.prompt("Tên người mua (có thể để trống):", "");
  if (buyerName === null) return;

  isSaving.value = true;
  try {
    const result = await WeighSessionAPI.createWeighSession({ buyerName: buyerName.trim() });
    emit("created", result?.data);
  } catch (error) {
    errorMessage.value = error?.message || "Tạo phiên cân không thành công!";
  } finally {
    isSaving.value = false;
  }
};

const closeSession = async () => {
  errorMessage.value = "";
  const session = selectedSession.value;
  if (!session || !window.confirm(`Kết thúc phiên "${session.sessionName}"?`)) return;

  isSaving.value = true;
  try {
    await WeighSessionAPI.closeWeighSession(session._id);
    emit("closed");
  } catch (error) {
    errorMessage.value = error?.message || "Kết thúc phiên cân không thành công!";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.session-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  background-color: $color-card-background;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;

  .session-bar__select {
    flex: 1;
    min-width: 240px;
  }

  .session-bar__actions {
    display: flex;
    gap: 8px;
  }

  .session-bar__error {
    width: 100%;
    color: $color-error;
    font-size: 14px;
  }
}
</style>
