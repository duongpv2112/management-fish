<template>
  <BottomSheet :open="open" title="Phiên cân" @close="emit('close')">
    <div class="session-sheet">
      <div class="session-sheet__error" v-if="errorMessage">{{ errorMessage }}</div>

      <div v-if="sessions.length === 0" class="session-sheet__empty">Chưa có phiên cân.</div>
      <button
        v-for="session in sessions"
        :key="session._id"
        type="button"
        class="session-sheet__item"
        :class="{ 'session-sheet__item--selected': session._id === selectedId }"
        :disabled="isSaving"
        @click="selectSession(session._id)"
      >
        <span class="session-sheet__info">
          <span class="session-sheet__name">{{ session.sessionName }}</span>
          <span class="session-sheet__date">
            {{ common.formatDateWithType(session.createdAt, "DD/MM/YYYY") }}
            <template v-if="sessionPondName(session)"> · {{ sessionPondName(session) }}</template>
            <template v-if="session.buyerName"> · {{ session.buyerName }}</template>
          </span>
        </span>
        <span
          class="session-sheet__badge"
          :class="{ 'session-sheet__badge--open': session.status === 'open' }"
        >
          {{ session.status === "open" ? "đang mở" : "đã kết thúc" }}
        </span>
        <span class="session-sheet__check" v-if="session._id === selectedId">✓</span>
      </button>

      <div class="session-sheet__actions">
        <button type="button" class="btn-sheet-new" :disabled="isSaving" @click="request('requestNew')">Phiên mới</button>
        <button
          v-if="selectedSession"
          type="button"
          class="btn-sheet-crop"
          :disabled="isSaving"
          @click="request('requestCrop')"
        >
          {{ sessionPondName(selectedSession) ? "Đổi ao" : "Chọn ao" }}
        </button>
        <button
          v-if="selectedSession?.status === 'open'"
          type="button"
          class="btn-sheet-close"
          :disabled="isSaving"
          @click="closeSession"
        >
          Kết thúc phiên
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed, ref } from "vue";

import BottomSheet from "@/components/BottomSheet.vue";
import WeighSessionAPI from "@/services/weighSessionAPI";
import { common } from "@/common/common";
import { sessionPondName } from "@/common/sessionLabel";

// Chọn / tạo / kết thúc phiên trên điện thoại (thay cho SessionBar)
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  // Mới nhất trước
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
const emit = defineEmits(["close", "select", "closed", "requestNew", "requestCrop"]);

const isSaving = ref(false);
const errorMessage = ref("");

const selectedSession = computed(() => props.sessions.find((session) => session._id === props.selectedId));

const selectSession = (sessionId) => {
  emit("select", sessionId);
  emit("close");
};

// Đóng sheet này rồi để trang cha mở sheet tương ứng
const request = (eventName) => {
  emit(eventName);
  emit("close");
};

// Kết thúc phiên không hoàn tác được nên nói rõ hậu quả
const closeSession = async () => {
  errorMessage.value = "";
  const session = selectedSession.value;
  if (
    !session ||
    !window.confirm(`Kết thúc phiên "${session.sessionName}"? Sau khi kết thúc sẽ không thêm/sửa lần cân được.`)
  ) {
    return;
  }

  isSaving.value = true;
  try {
    const result = await WeighSessionAPI.closeWeighSession(session._id);
    emit("closed", result?.data);
    emit("close");
  } catch (error) {
    errorMessage.value = error?.message || "Kết thúc phiên cân không thành công!";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.session-sheet {
  .session-sheet__error {
    margin-bottom: 8px;
    padding: 8px;
    border-radius: $radius-md;
    font-size: 14px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .session-sheet__empty {
    padding: 12px 8px;
    font-size: 14px;
  }

  .session-sheet__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 56px;
    padding: 6px 8px;
    border: none;
    border-bottom: 1px solid $color-border;
    background: transparent;
    color: $color-text-primary;
    text-align: left;
    cursor: pointer;

    &.session-sheet__item--selected {
      background-color: $color-hover;
    }
  }

  .session-sheet__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .session-sheet__name {
    font-size: 16px;
    font-weight: 600;
  }

  .session-sheet__date {
    font-size: 13px;
    opacity: 0.7;
  }

  .session-sheet__badge {
    padding: 2px 8px;
    border-radius: $radius-sm;
    font-size: 12px;
    background-color: $color-border;

    &.session-sheet__badge--open {
      background-color: $color-hover;
      color: $color-primary;
      font-weight: 600;
    }
  }

  .session-sheet__check {
    color: $color-primary;
    font-weight: 700;
  }

  .session-sheet__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;

    button {
      flex: 1;
      min-height: 48px;
      border-radius: $radius-md;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-sheet-crop {
      border: 1px solid $color-primary;
      background-color: $color-card-background;
      color: $color-primary;
    }

    .btn-sheet-new {
      border: none;
      background-color: $color-primary;
      color: $color-card-background;
    }

    .btn-sheet-close {
      border: 1px solid lighten($color-error, 32%);
      background-color: $color-card-background;
      color: $color-error;
    }
  }
}
</style>
