import {
  addBuyTransaction,
  editBuyTransaction,
  fetchTransactions,
  sellShares,
  type AddBuyInput,
  type EditBuyInput,
  type SellSharesInput,
} from "@/services/firebase/transactions";
import type { AssetClass, Transaction } from "@/types/transaction";
import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], { userId: string; assetClass: AssetClass }>({
      queryFn: async ({ userId, assetClass }) => {
        try {
          return { data: await fetchTransactions(userId, assetClass) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Transactions", "Holdings"],
    }),
    addBuy: builder.mutation<Transaction, AddBuyInput>({
      queryFn: async (input) => {
        try {
          return { data: await addBuyTransaction(input) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Transactions", "Holdings"],
    }),
    editBuy: builder.mutation<null, EditBuyInput>({
      queryFn: async (input) => {
        try {
          await editBuyTransaction(input);
          return { data: null };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Transactions", "Holdings"],
    }),
    sellShares: builder.mutation<Transaction, SellSharesInput>({
      queryFn: async (input) => {
        try {
          return { data: await sellShares(input) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Transactions", "Holdings"],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useAddBuyMutation,
  useEditBuyMutation,
  useSellSharesMutation,
} = transactionsApi;
