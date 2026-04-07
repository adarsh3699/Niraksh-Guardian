"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (typeof window === "undefined") return;
		if (!("serviceWorker" in navigator)) return;

		void navigator.serviceWorker.register("/sw.js").catch(() => {
			// Registration failure should not block app usage.
		});
	}, []);

	return null;
}
