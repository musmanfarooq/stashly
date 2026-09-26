import { baseApi } from "./baseApi";

function toQueryError(error: unknown) {
  return { error: { message: error instanceof Error ? error.message : "Something went wrong." } };
}

export const livePsxPricesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** symbols must be pre-sorted by the caller for a stable cache key. */
    getLivePsxPrices: builder.query<Record<string, number>, string[]>({
      queryFn: async (symbols) => {
        if (symbols.length === 0) return { data: {} };

        try {
          const params = new URLSearchParams({ symbols: symbols.join(",") });
          const response = await fetch(`/api/psx-prices?${params.toString()}`);
          if (!response.ok) {
            throw new Error("Failed to fetch PSX prices.");
          }
          const data = (await response.json()) as { prices: Record<string, number> };
          return { data: data.prices };
        } catch (error) {
          return toQueryError(error);
        }
      },
    }),
  }),
});

export const { useGetLivePsxPricesQuery } = livePsxPricesApi;
