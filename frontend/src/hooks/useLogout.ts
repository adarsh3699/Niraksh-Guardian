"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthProvider";

export function useLogout(onAfterLogout?: () => void) {
	const { logout } = useAuth();

	return useCallback(async () => {
		await logout();
		onAfterLogout?.();
	}, [logout, onAfterLogout]);
}
