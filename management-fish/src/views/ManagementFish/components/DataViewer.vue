<template>
  <table class="customers" v-if="isShowTable">
    <thead>
      <tr>
        <th v-for="(fishType, fishTypeIndex) in dataOfTable">
          {{ fishType.fishName }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in numberRowsOfTable">
        <td v-for="(fishType, fishTypeIndex) in dataOfTable">
          {{ fishType.fishWeights[row - 1] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script>
import { onMounted, ref } from "vue";

export default {
  props: {
    lstDataTable: {
      type: Array,
      default: [],
    },
    numberRows: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { emit }) {
    const isShowTable = ref(true);
    const dataOfTable = ref([]);
    const numberRowsOfTable = ref(0);

    const initDataTable = () => {
      isShowTable.value = false;
      if (props.lstDataTable.length > 0) {
        isShowTable.value = true;
        dataOfTable.value = props.lstDataTable;
        numberRowsOfTable.value = props.numberRows;
      }
    };

    onMounted(() => {
      initDataTable();
    });

    return {
      isShowTable,
      dataOfTable,
      numberRowsOfTable,
      initDataTable,
    };
  },
};
</script>
<style lang="scss" scoped>
.customers {
  font-family: Arial, Helvetica, sans-serif;
  border-collapse: collapse;
  width: 100%;
  height: fit-content;

  & td,
  & th {
    border: 1px solid #ddd;
    padding: 8px;
  }

  & tr {
    min-height: 55px;
  }

  & tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  & tr:hover {
    background-color: #ddd;
  }

  & th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #fff;
  }
}
</style>
