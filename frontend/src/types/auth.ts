/* ------------------------------------------------------------------ */
/*  Auth types                                                        */
/* ------------------------------------------------------------------ */

export interface User {
	id: string;
	email: string;
	name: string | null;
	gender: string | null;
	role: "PATIENT" | "DOCTOR" | "ADMIN";
}

export interface Tokens {
	accessToken: string;
}

/** Successful signup / login / google response. */
export interface AuthResponse {
	message: string;
	user: User;
	tokens: Tokens;
}

/** Refresh-token response — flat (NOT wrapped in `tokens`). */
export interface RefreshTokenResponse {
	accessToken: string;
}

/* — Request bodies — */

export interface LoginRequest {
	email: string;
	password: string;
}

export interface SignupRequest {
	email: string;
	password: string;
	name?: string;
	gender?: "Male" | "Female" | "Other";
}

export interface GoogleAuthRequest {
	idToken: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	token: string;
	password: string;
}
