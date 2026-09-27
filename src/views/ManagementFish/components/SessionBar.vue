<template>
  <div class="session-bar">
    <CPCombobox
      class="session-bar__select"
      idControl="sessionSelect"
      labelControl="Phiên cân"
      :modelValue="selectedId"
      height="40px"
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
        height="40px"
        :disabled="isSaving"
        @click="emit('requestNew')"
      />
      <CPButton
        v-if="selectedSession"
        class="btn-session-crop"
        :textButton="sessionPondName(selectedSession) ? 'Đổi ao' : 'Chọn ao'"
        height="40px"
        :disabled="isSaving"
        @click="emit('requestCrop')"
      />
      <CPButton
        v-if="selectedSession?.status === 'open'"
        class="btn-close-session"
        typeButton="danger"
        textButton="Kết thúc phiên"
        height="40px"
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
import { sessionPondName } from "@/common/sessionLabel";

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

// requestNew / requestCrop: trang cha mở sheet chọn ao (tạo phiên mới / gán ao cho phiên đang chọn)
const emit = defineEmits(["select", "closed", "requestNew", "requestCrop"]);

const isSaving = ref(false);
const errorMessage = ref("");

// "Phiên 26/09/2026 · Ao 1 — Anh Tuấn (đang mở)"
const sessionOptions = computed(() =>
  props.sessions.map((session) => ({
    _id: session._id,
    label:
      session.sessionName +
      (sessionPondName(session) ? ` · ${sessionPondName(session)}` : "") +
      (session.buyerName ? ` — ${session.buyerName}` : "") +
      (session.status === "open" ? " (đang mở)" : ""),
  }))
);

const selectedSession = computed(() =>
  props.sessions.find((session) => session._id === props.selectedId)
);


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
  border-radius: $radius-lg;
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
