export type UserRole = 'Admin' | 'Librarian' | 'Member';
export type AccountStatus = 'Active' | 'Suspended';
export type SafeUser = { id: string; name: string; email: string; role: UserRole; status: AccountStatus; image?: string };
export type ApiError = { error: string; details?: unknown };
export type PaginatedResult<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
