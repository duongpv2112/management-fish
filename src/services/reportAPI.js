import { get } from "./baseAPI";

const ReportAPI = {
  // params: { from, to: "YYYY-MM-DD", includeOpen: 0 | 1 }
  // → data: { period, crops, openCrops, cropsTotal, commonExpense, netProfit, excludedForeignCurrency, includeOpen }
  async getOverview(params = {}) {
    return await get("/reports/getOverview", { params });
  },
};

export default ReportAPI;
