/** Global, shared across every user (admin-managed) — not scoped to any one user. */
export interface Category {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
}
