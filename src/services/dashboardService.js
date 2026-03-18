import api from "./api"

export const dashboardService = {
  async summary() {
    const { data } = await api.get("/api/dashboard/summary")
    return data
  },
}
