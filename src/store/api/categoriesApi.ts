import { addCategory, fetchCategories } from "@/services/firebase/categories";
import type { Category } from "@/types/category";
import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], string>({
      queryFn: async (userId) => {
        try {
          return { data: await fetchCategories(userId) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Types"],
    }),
    addCategory: builder.mutation<Category, { userId: string; name: string }>({
      queryFn: async ({ userId, name }) => {
        try {
          return { data: await addCategory(userId, name) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Types"],
    }),
  }),
});

export const { useGetCategoriesQuery, useAddCategoryMutation } = categoriesApi;
