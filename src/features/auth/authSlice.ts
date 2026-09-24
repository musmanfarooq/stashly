import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppUser } from "@/types/user";

interface AuthState {
  user: AppUser | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AppUser | null>) {
      state.user = action.payload;
    },
    setInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
  },
});

export const { setUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;
