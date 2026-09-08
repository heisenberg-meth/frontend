import api from "../api.js";
import { API_ROUTES } from "../constants/api.routes.js";

export const globalSearch = ({ q, category = "All", limit = 20, signal }) =>
  api.get(API_ROUTES.GLOBAL_SEARCH, {
    params: {
      q,
      category,
      limit,
    },
    signal,
  });
