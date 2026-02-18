"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleAuthWrapper({ children }: { children: ReactNode }) {
	return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
