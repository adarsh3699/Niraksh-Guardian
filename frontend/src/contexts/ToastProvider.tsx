"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
	id: string;
	type: ToastType;
	message: string;
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (type: ToastType, message: string) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
	success: CheckCircle,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info,
};

const STYLE_MAP: Record<ToastType, string> = {
	success: "border-success bg-success/10 text-success",
	error: "border-destructive bg-destructive/10 text-destructive",
	warning: "border-warning bg-warning/10 text-warning",
	info: "border-info bg-info/10 text-info",
};

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const addToast = useCallback(
		(type: ToastType, message: string) => {
			const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			setToasts((prev) => {
				const next = [...prev, { id, type, message }];
				// Keep only the latest MAX_TOASTS
				return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
			});
			// Auto-dismiss
			setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
		},
		[removeToast],
	);

	const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}

			{/* Toast container — top-right */}
			{toasts.length > 0 && (
				<div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 pointer-events-none">
					{toasts.map((toast) => {
						const Icon = ICON_MAP[toast.type];
						return (
							<div
								key={toast.id}
								className={cn(
									"flex w-80 items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm pointer-events-auto",
								"animate-[slide-in-right_0.3s_ease-out]",
								"bg-surface",
								STYLE_MAP[toast.type],
								"",
							)}
							role="alert"
							>
								<Icon className="size-5 shrink-0" />
								<p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>
								<button
									onClick={() => removeToast(toast.id)}
									className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-border"
									aria-label="Dismiss"
								>
									<X className="size-4" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</ToastContext.Provider>
	);
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function useToast(): ToastContextType {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
	return ctx;
}
