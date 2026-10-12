import {
  addCategory,
  deleteCategory,
  fetchCategories,
  migrateCategoriesToGlobal,
} from "@/services/firebase/categories";
import type { Category } from "@/types/category";
import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      queryFn: async () => {
        try {
          return { data: await fetchCategories() };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Types"],
    }),
    addCategory: builder.mutation<Category, { createdBy: string; name: string }>({
      queryFn: async ({ createdBy, name }) => {
        try {
          return { data: await addCategory(createdBy, name) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Types"],
    }),
    deleteCategory: builder.mutation<null, string>({
      queryFn: async (id) => {
        try {
          await deleteCategory(id);
          return { data: null };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Types"],
    }),
    migrateCategoriesToGlobal: builder.mutation<{ kept: number; removed: number }, string>({
      queryFn: async (adminUid) => {
        try {
          return { data: await migrateCategoriesToGlobal(adminUid) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: ["Types"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useMigrateCategoriesToGlobalMutation,
} = categoriesApi;
