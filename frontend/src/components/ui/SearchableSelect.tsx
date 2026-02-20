"use client";

import { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent } from "react";
import { ChevronDown, Check, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface SelectOption {
	/** The value stored in the form (e.g. state name "Maharashtra") */
	value: string;
	/** Human-readable label shown in the dropdown (same as value here, or different) */
	label: string;
}

interface SearchableSelectProps {
	/** Current selected value */
	value: string;
	/** Called with the new value string when user selects an option */
	onChange: (value: string) => void;
	/** Called on blur — for react-hook-form Controller */
	onBlur?: () => void;
	options: SelectOption[];
	placeholder?: string;
	label?: string;
	error?: string;
	disabled?: boolean;
	/** Show a loading spinner while options are being fetched */
	loading?: boolean;
	/** Message shown when no options match the search */
	emptyMessage?: string;
}

/* ------------------------------------------------------------------ */
/*  SearchableSelect                                                  */
/* ------------------------------------------------------------------ */

export function SearchableSelect({
	value,
	onChange,
	onBlur,
	options,
	placeholder = "Select…",
	label,
	error,
	disabled,
	loading,
	emptyMessage = "No results found",
}: SearchableSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [activeIndex, setActiveIndex] = useState(-1);

	const containerRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	/* Derived */
	const selectedLabel = useMemo(
		() => options.find((o) => o.value === value)?.label ?? value ?? "",
		[options, value],
	);

	const filtered = useMemo(() => {
		if (!search.trim()) return options;
		const q = search.toLowerCase();
		return options.filter((o) => o.label.toLowerCase().includes(q));
	}, [options, search]);

	/* Open/close helpers */
	const open = useCallback(() => {
		if (disabled) return;
		setIsOpen(true);
		setSearch("");
		setActiveIndex(-1);
		// Focus the search input after the dropdown renders
		setTimeout(() => searchRef.current?.focus(), 0);
	}, [disabled]);

	const close = useCallback(() => {
		setIsOpen(false);
		setSearch("");
		setActiveIndex(-1);
		onBlur?.();
	}, [onBlur]);

	const select = useCallback(
		(opt: SelectOption) => {
			onChange(opt.value);
			close();
		},
		[onChange, close],
	);

	/* Close on outside click */
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				close();
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [isOpen, close]);

	/* Scroll active option into view */
	useEffect(() => {
		if (activeIndex < 0 || !listRef.current) return;
		const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
		item?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	/* Keyboard navigation on the search input */
	const handleSearchKey = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setActiveIndex((i) => Math.max(i - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (activeIndex >= 0 && filtered[activeIndex]) {
						select(filtered[activeIndex]);
					} else if (filtered.length === 1) {
						select(filtered[0]);
					}
					break;
				case "Escape":
					e.preventDefault();
					close();
					break;
				case "Tab":
					close();
					break;
			}
		},
		[filtered, activeIndex, select, close],
	);

	return (
		<div ref={containerRef} className="relative">
			{/* Label */}
			{label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}

			{/* Trigger button */}
			<button
				type="button"
				onClick={isOpen ? close : open}
				disabled={disabled}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				className={cn(
					"flex h-11 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm transition-colors",
					"focus:outline-none focus:ring-2 focus:ring-primary/20",
					error
						? "border-destructive focus:border-destructive"
						: isOpen
							? "border-primary ring-2 ring-primary/20"
							: "border-border hover:border-primary/50",
					disabled && "cursor-not-allowed opacity-60",
					value ? "text-foreground" : "text-muted",
				)}
			>
				<span className="truncate">{value ? selectedLabel : placeholder}</span>
				<ChevronDown
					className={cn(
						"size-4 flex-shrink-0 text-muted transition-transform duration-150",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{/* Error */}
			{error && <p className="mt-1 text-xs text-destructive">{error}</p>}

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg ring-1 ring-black/5">
					{/* Search bar inside dropdown */}
					<div className="flex items-center gap-2 border-b border-border px-3 py-2">
						<Search className="size-3.5 flex-shrink-0 text-muted" />
						<input
							ref={searchRef}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setActiveIndex(-1);
							}}
							onKeyDown={handleSearchKey}
							placeholder="Type to search…"
							className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
						/>
						{loading && <Loader2 className="size-3.5 animate-spin text-muted" />}
					</div>

					{/* Options list */}
					<ul ref={listRef} role="listbox" className="max-h-52 overflow-y-auto py-1">
						{loading && options.length === 0 ? (
							<li className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
								<Loader2 className="size-4 animate-spin" /> Loading…
							</li>
						) : filtered.length === 0 ? (
							<li className="py-6 text-center text-sm text-muted">{emptyMessage}</li>
						) : (
							filtered.map((opt, idx) => {
								const isActive = idx === activeIndex;
								const isSelected = opt.value === value;
								return (
									<li
										key={opt.value}
										role="option"
										aria-selected={isSelected}
										onMouseDown={(e) => e.preventDefault()} // keep focus on search
										onClick={() => select(opt)}
										onMouseEnter={() => setActiveIndex(idx)}
										className={cn(
											"flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors",
											isActive && "bg-primary/8 text-primary",
											isSelected && !isActive && "bg-primary/5 font-medium text-primary",
											!isSelected && !isActive && "text-foreground hover:bg-border/40",
										)}
									>
										<span className="truncate">{opt.label}</span>
										{isSelected && <Check className="size-3.5 flex-shrink-0 text-primary" />}
									</li>
								);
							})
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
