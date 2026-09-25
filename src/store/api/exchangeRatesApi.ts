import { fetchPkrExchangeRates } from "@/services/exchange-rates";
import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const exchangeRatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExchangeRates: builder.query<Record<string, number>, void>({
      queryFn: async () => {
        try {
          return { data: await fetchPkrExchangeRates() };
        } catch (error) {
          return toQueryError(error);
        }
      },
      // Rates only update once a day upstream — no point refetching more often.
      keepUnusedDataFor: 60 * 60 * 12,
    }),
  }),
});

export const { useGetExchangeRatesQuery } = exchangeRatesApi;
