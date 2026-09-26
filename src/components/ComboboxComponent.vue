<template>
  <div class="cp-combobox" v-click-outside="handleCloseLstData">
    <label
      class="cp-combobox__label"
      :for="idControl"
      v-if="labelControl && !isCustomLabel"
    >
      {{ labelControl }}
    </label>
    <template v-else>
      <slot name="customLabel"></slot>
    </template>
    <div
      class="cp-combobox__control"
      :class="{ rounded: rounded, 'cp-combobox--focus': isFocusOn, 'cp-combobox--disabled': disabled, 'cp-combobox--error': errorMessage }"
    >
      <div class="cp-combobox__input">
        <input
          :id="idControl"
          class="combobox-input"
          :value="valueInput"
          :placeholder="placeholderText"
          :disabled="disabled"
          autocomplete="off"
          type="text"
          @input="handleChangeInput"
          @keydown="handleKeyPress"
          @focus="handleFocusInput"
          @blur="handleBlurInput"
        />
        <div class="combobox-button" @click="handleClick">
          <i
            class="cp-icon icon-chevron-down"
            :class="{ 'rotate-180': isShowLstData }"
          ></i>
        </div>
      </div>
      <Transition name="fade-down" mode="out-in">
        <div class="cp-combobox__select" v-if="isShowLstData">
          <div class="select-content" v-if="!isCustomCombobox">
            <template v-if="lstDataCombobox && lstDataCombobox.length > 0">
              <div
                v-for="(item, index) in lstDataCombobox"
                class="select-item"
                :class="{
                  'select-item--focus': item.IsFocus,
                  'select-item--selected': item.IsSelected,
                }"
                @click="handleSelectedItem(item, $event)"
              >
                {{ item[dataFieldText] }}

                <i class="cp-icon icon-check" v-if="item.IsSelected"></i>
              </div>
            </template>
            <template v-else>
              <div class="non-data">Không có dữ liệu</div>
            </template>
          </div>
          <slot v-else name="customData"></slot>
        </div>
      </Transition>
    </div>
    <div class="cp-combobox__error" v-if="errorMessage">{{ errorMessage }}</div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  idControl: {
    type: String,
    default: "",
  },
  labelControl: {
    type: String,
    default: "",
  },
  isCustomLabel: {
    type: Boolean,
    default: false,
  },
  lstData: {
    type: Array,
    default: [],
  },
  modelValue: {
    type: [String, Number],
    default: "",
  },
  dataField: {
    type: String,
    default: "",
  },
  dataFieldText: {
    type: String,
    default: "",
  },
  placeholderText: {
    type: String,
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
  rounded: {
    type: Boolean,
    default: true,
  },
  isCustomCombobox: {
    type: Boolean,
    default: false,
  },
  isCustomFilter: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  }
});

const emit = defineEmits(['update']);
const timeoutChangeInput = ref(null);
const isShowLstData = ref(false);
const itemFocusCurrent = ref({});
const itemSelectedCurrent = ref({});
const indexFocusCurrent = ref(null);
const lstDataCombobox = ref(null);
const valueInput = ref(null);
const isFocusOn = ref(false);

onMounted(() => {
  lstDataCombobox.value = remapLstData();
  initTextCombobox();
});

const initTextCombobox = () => {
  let itemInit = props.lstData.find(
    (item) => item[props.dataField] == props.modelValue
  );
  valueInput.value = itemInit?.[props.dataFieldText] ?? "";
};

const handleClick = () => {
  if (!props.disabled) {
    isShowLstData.value = !isShowLstData.value;
  }
};

const handleFocusInput = () => {
  isFocusOn.value = true;
};

const handleBlurInput = () => {
  isFocusOn.value = false;
};

const handleShowLstData = () => {
  if (!props.disabled) {
    isShowLstData.value = true;
  }
};

const handleCloseLstData = () => {
  isShowLstData.value = false;
  lstDataCombobox.value = remapLstData();
};

const handleChangeInput = ($event) => {
  valueInput.value = $event.target.value;
  clearTimeout(timeoutChangeInput.value);
  timeoutChangeInput.value = setTimeout(() => {
    handleShowLstData();
    lstDataCombobox.value = filterValue($event.target.value);
  }, 500);
};

const filterValue = (value) => {
  if (!props.isCustomFilter) {
    indexFocusCurrent.value = null;

    let lstDataFilter = props.lstData.filter((item) => {
      let itemText = removeVietnameseTones(item[props.dataFieldText])
        .toLowerCase()
        .trim();
      let valueText = removeVietnameseTones(value).toLowerCase().trim();
      return itemText.includes(valueText);
    });

    return lstDataFilter;
  }
};

const handleKeyPress = ($event) => {
  if (props.disabled) return;
  
  let keyCode = $event.keyCode;
  switch (keyCode) {
    case keyPressCode.value.ArrowDown:
      handleShowLstData();
      if (indexFocusCurrent.value == null) {
        indexFocusCurrent.value = 0;
      } else {
        if (indexFocusCurrent.value >= lstDataCombobox.value.length - 1) {
          indexFocusCurrent.value = lstDataCombobox.value.length - 1;
        } else indexFocusCurrent.value++;
      }

      itemFocusCurrent.value =
        lstDataCombobox.value[indexFocusCurrent.value];
      lstDataCombobox.value = remapFocusLstData();
      break;
    case keyPressCode.value.ArrowUp:
      handleShowLstData();
      if (indexFocusCurrent.value == null || indexFocusCurrent.value == 0) {
        indexFocusCurrent.value = 0;
      } else {
        indexFocusCurrent.value--;
      }

      itemFocusCurrent.value =
        lstDataCombobox.value[indexFocusCurrent.value];
      lstDataCombobox.value = remapFocusLstData();
      break;
    case keyPressCode.value.Enter:
      itemFocusCurrent.value =
        lstDataCombobox.value[indexFocusCurrent.value];
      handleSelectedItem(null, $event);
      break;
    case keyPressCode.value.ESC:
      handleCloseLstData();
      break;
    default:
      break;
  }
};

const handleSelectedItem = (item, $event) => {
  $event?.stopPropagation();
  let itemSelected = item ?? itemFocusCurrent.value;
  if (!itemSelected) {
    handleCloseLstData();
    return;
  }
  valueInput.value = itemSelected[props.dataFieldText];
  itemSelectedCurrent.value = itemSelected;
  lstDataCombobox.value = remapSelectedLstData();
  handleCloseLstData();

  emit("update", itemSelected[props.dataField]);
};

const remapLstData = () => {
  let newLstData = deepClone(props.lstData);
  newLstData = newLstData.map((item) => {
    item.IsSelected = false;
    item.IsFocus = false;
    if (
      item[props.dataField] == itemSelectedCurrent.value[props.dataField]
    ) {
      item.IsSelected = true;
    } else if (
      item[props.dataField] == props.modelValue &&
      !itemSelectedCurrent.value[props.dataField]
    ) {
      item.IsSelected = true;
    }

    return item;
  });

  return newLstData;
};

const remapFocusLstData = () => {
  let newLstData = deepClone(lstDataCombobox.value);
  let result = newLstData.map((item) => {
    let newItem = { ...item };
    if (
      newItem[props.dataField] == itemFocusCurrent.value[props.dataField]
    ) {
      newItem.IsFocus = true;
    } else newItem.IsFocus = false;

    return newItem;
  });

  return result;
};

const remapSelectedLstData = () => {
  let newLstData = deepClone(lstDataCombobox.value);
  let result = newLstData.map((item) => {
    let newItem = { ...item };
    newItem.IsSelected = false;
    if (
      newItem[props.dataField] == itemSelectedCurrent.value[props.dataField]
    ) {
      newItem.IsSelected = true;
    }

    return newItem;
  });

  return result;
};

const removeVietnameseTones = (str) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  str = str.replace(/ + /g, " ");
  str = str.trim();
  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
    " "
  );
  return str;
};

const deepClone = (dataClone) => {
  if (!dataClone) {
    return dataClone;
  }

  return JSON.parse(JSON.stringify(dataClone));
};

const keyPressCode = ref({
  Enter: 13,
  ArrowUp: 38,
  ArrowDown: 40,
  ESC: 27,
});
</script>
<style lang="scss" scoped>
.cp-combobox {
  .cp-combobox__label {
    color: #172b4d;
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .cp-combobox__control {
    user-select: none;
    position: relative;
    display: flex;
    border: 1px solid #dfe1e6;
    border-radius: 5px;
    padding: 1px 0 1px 1px;
    width: v-bind(width);
    height: v-bind(height);

    &.cp-combobox--focus {
      border-color: #0065ff !important;
    }

    &.cp-combobox--disabled {
      background-color: #f0f2f4;
      cursor: not-allowed;
    }

    &.cp-combobox--error {
      border-color: #dc3545;
    }

    &:hover:not(.cp-combobox--disabled) {
      border-color: #6b778c;
    }

    .cp-combobox__input {
      display: flex;
      align-items: center;
      flex: 1;

      .combobox-input {
        flex: 1;
        border: none;
        outline: none;
        padding: 8px 16px;
        background: transparent;

        &::placeholder {
          opacity: 0.7;
        }

        &:disabled {
          cursor: not-allowed;
          color: #6c757d;
        }
      }

      .combobox-button {
        width: calc(v-bind(height) - 2px);
        height: calc(v-bind(height) - 2px);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;

        &:hover:not(:disabled) {
          background-color: #f0f2f4;
        }
      }
    }

    .cp-combobox__select {
      position: absolute;
      z-index: 100;
      top: calc(v-bind(height) + 3px);
      left: 0;
      right: 0;
      animation: fadeIn ease-out 0.3s;

      .select-content {
        display: flex;
        flex-direction: column;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
        background-color: #fff;

        .select-item {
          padding: 8px 16px;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          border-bottom: 1px solid #dfe1e6;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: #f0f2f4;
          }

          &.select-item--focus {
            background-color: #f0f2f4;
          }

          &.select-item--selected {
            color: #0065ff;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
        }

        .non-data {
          text-align: center;
          padding: 8px 16px;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          color: #0065ff;
        }
      }
    }
  }

  .cp-combobox__error {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
    font-weight: 400;
  }
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: all 0.25s ease-out;
}

.fade-down-enter-from {
  opacity: 0;
  transform: translateY(-3px);
}

.fade-down-leave-to {
  opacity: 0;
  transform: translateY(3px);
}

.rotate-180 {
  transform: rotate(180deg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
