import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * Firestore reads/writes aren't URL-based, so endpoints injected into this
 * api (by later feature modules) use `queryFn` and call the Firebase service
 * layer directly instead of a URL-based baseQuery.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<{ message: string }>(),
  tagTypes: ["Holdings", "Transactions", "Types", "CurrentPrices", "Dividends"],
  endpoints: () => ({}),
});
