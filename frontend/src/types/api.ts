/* ------------------------------------------------------------------ */
/*  API response types                                                */
/* ------------------------------------------------------------------ */

/** Standard success wrapper — most endpoints return JSON directly,  */
/** but we wrap them for the client to normalise error handling.      */
export interface ApiResponse<T> {
	data: T;
	status: number;
}

/** API error that our client throws on non-2xx responses. */
export interface ApiError {
	status: number;
	message: string;
	/** Zod validation issues (from 400 responses). */
	issues?: ZodIssue[];
}

/** Subset of Zod issue shape returned by the backend. */
export interface ZodIssue {
	code: string;
	path: (string | number)[];
	message: string;
}

/** Paginated wrapper returned by `GET /api/doctors`. */
export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	pages: number;
}

/** Generic message-only response (delete, logout, etc.). */
export interface MessageResponse {
	message: string;
}
