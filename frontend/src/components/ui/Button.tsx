import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/* ------------------------------------------------------------------ */
/*  Variant / Size maps (CVA-style, inline for tree-shaking)          */
/* ------------------------------------------------------------------ */

const BASE =
	"inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

const VARIANT_MAP = {
	primary: "bg-primary text-white shadow-sm hover:brightness-110 active:brightness-95",
	accent: "bg-accent text-white shadow-sm hover:brightness-110 active:brightness-95",
	outline:
		"border-2 border-primary text-primary bg-transparent hover:bg-primary/10 active:bg-primary/20",
	ghost: "text-foreground bg-transparent hover:bg-border active:bg-border/80",
	destructive: "bg-destructive text-white shadow-sm hover:brightness-110 active:brightness-95",
} as const;

const SIZE_MAP = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-5 text-sm",
	lg: "h-12 px-7 text-base",
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface ButtonProps extends ComponentProps<"button"> {
	variant?: keyof typeof VARIANT_MAP;
	size?: keyof typeof SIZE_MAP;
	loading?: boolean;
}

export function Button({
	variant = "primary",
	size = "md",
	loading = false,
	disabled,
	className,
	children,
	ref,
	...props
}: ButtonProps) {
	return (
		<button
			ref={ref}
			disabled={disabled || loading}
			className={cn(BASE, VARIANT_MAP[variant], SIZE_MAP[size], className)}
			{...props}
		>
			{loading && <Spinner size="sm" />}
			{children}
		</button>
	);
}
