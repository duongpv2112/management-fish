<template>
  <div class="login">
    <form class="login__card" @submit.prevent="submit">
      <h1>Quản lý cân cá nhà Đặng Ánh</h1>
      <div v-if="isExpired" class="notice-message">
        Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

      <label class="login__label" for="loginPassword">Mật khẩu</label>
      <input
        id="loginPassword"
        v-model="password"
        class="login__input"
        type="password"
        autocomplete="current-password"
        placeholder="Nhập mật khẩu"
        :disabled="isLoading"
      />
      <button type="submit" class="login__button" :disabled="isLoading">
        {{ isLoading ? "Đang đăng nhập..." : "Đăng nhập" }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import AuthAPI from "@/services/authAPI";
import { setSession } from "@/common/auth";

const route = useRoute();
const router = useRouter();

const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const isExpired = computed(() => route.query.expired === "1");

const submit = async () => {
  errorMessage.value = "";
  if (!password.value) {
    errorMessage.value = "Vui lòng nhập mật khẩu.";
    return;
  }

  isLoading.value = true;
  try {
    const result = await AuthAPI.login(password.value);
    setSession(result.data);
    // Quay lại đúng trang đang dùng trước khi phải đăng nhập
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect || "/");
  } catch (error) {
    errorMessage.value = error?.message || "Đăng nhập không thành công!";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;

  .login__card {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: $color-card-background;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 24px;

    h1 {
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      color: $color-primary;
      margin-bottom: 8px;
    }
  }

  .notice-message,
  .error-message {
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    text-align: center;
  }

  .notice-message {
    color: $color-text-primary;
    background-color: $color-hover;
  }

  .error-message {
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .login__label {
    font-weight: 600;
    color: $color-text-primary;
  }

  .login__input {
    padding: 10px 16px;
    border: 1px solid $color-border;
    border-radius: 5px;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  .login__button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    color: $color-card-background;
    background-color: $color-primary;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// Điện thoại: ô mật khẩu và nút đăng nhập cao 48px, chữ 16px
@media (max-width: 899.98px) {
  .login {
    .login__card h1 {
      font-size: 17px;
    }

    .login__input,
    .login__button {
      min-height: 48px;
      font-size: 16px;
    }
  }
}
</style>
