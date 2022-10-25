import axios from "axios"
import { getLocalConfig } from "~/newstore/localpersistence"
export function useAxios() {
  const authToken = getLocalConfig("access_token")
  axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL
  axios.defaults.headers = {
    Authorization: `${authToken}`,
  }
  return axios
}
