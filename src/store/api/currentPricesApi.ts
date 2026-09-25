import { fetchCurrentPrices, setCurrentPrice, type SetCurrentPriceInput } from "@/services/firebase/current-prices";
import type { CurrentPrice } from "@/types/current-price";
import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const currentPricesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentPrices: builder.query<CurrentPrice[], void>({
      queryFn: async () => {
        try {
          return { data: await fetchCurrentPrices() };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["CurrentPrices"],
    }),
    setCurrentPrice: builder.mutation<null, SetCurrentPriceInput>({
      queryFn: async (input) => {
        try {
          await setCurrentPrice(input);
          return { data: null };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["CurrentPrices"],
    }),
  }),
});

export const { useGetCurrentPricesQuery, useSetCurrentPriceMutation } = currentPricesApi;
