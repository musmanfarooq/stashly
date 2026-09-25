import { addDividend, fetchDividends, type AddDividendInput } from "@/services/firebase/dividends";
import type { Dividend } from "@/types/dividend";
import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const dividendsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDividends: builder.query<Dividend[], string>({
      queryFn: async (userId) => {
        try {
          return { data: await fetchDividends(userId) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Dividends"],
    }),
    addDividend: builder.mutation<Dividend, AddDividendInput>({
      queryFn: async (input) => {
        try {
          return { data: await addDividend(input) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Dividends"],
    }),
  }),
});

export const { useGetDividendsQuery, useAddDividendMutation } = dividendsApi;
