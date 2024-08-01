<template>
  <div class="cp-button">
    <div class="cp-button__content">
      <div class="button-icon" :class="leftIcon" v-if="leftIcon"></div>
      <button class="button-control" :id="idControl" :class="typeButton">
        {{ textButton }}
      </button>
      <div class="button-icon" :class="rightIcon" v-if="rightIcon"></div>
    </div>
  </div>
</template>
<script>
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "CPButton",
  props: {
    idControl: {
      type: String,
      default: "",
    },
    typeButton: {
      type: String,
      default: "",
    },
    textButton: {
      type: String,
      default: "",
    },
    leftIcon: {
      type: String,
      default: "",
    },
    rightIcon: {
      type: String,
      default: "",
    },
    modelValue: {
      type: [String, Number],
      default: "",
    },
    width: {
      type: [String, Number],
      default: "",
    },
    height: {
      type: [String, Number],
      default: "",
    },
    minWidth: {
      type: [String, Number],
      default: "",
    },
    minHeight: {
      type: [String, Number],
      default: "",
    },
  },
  setup(props, { emit }) {
    return {
      // Computed
      // Property
      // Function
    };
  },
});
</script>
<style lang="scss" scoped>
.cp-button {
  .cp-button__content {
    user-select: none;
    display: flex;
    border: 1px solid #dfe1e6;
    border-radius: 5px;
    width: v-bind(width);
    height: v-bind(height);
    overflow: hidden;

    .button-control {
      cursor: pointer;
      flex: 1;
      border: none;
      outline: none;
      padding: 8px 16px;

      &:hover {
        background-color: #dfe1e6;
      }

      &:active {
        background-color: #0065ff;
        color: #fff;
      }
    }
  }
}
</style>
