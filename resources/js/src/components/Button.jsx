import { Loader2 } from "lucide-react";

export default function Button({
    type = "button",
    onClick,
    children,
    disabled = false,
    variant = "primary",
    icon: Icon,
    loading = false,
    size = "md",
    className = "",
}) {
    const sizes = {
        md: "rounded-md px-4 py-2 text-sm gap-2",
        sm: "rounded-sm px-2.5 py-1 text-xs gap-1.5",
    };
    const sizeCls = sizes[size] ?? sizes.md;
    const base = `inline-flex cursor-pointer items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${sizeCls}`;
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        secondary: "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${base} ${variants[variant] || variants.primary} ${className}`}
        >
            {loading && <Loader2 className={`animate-spin ${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
            {!loading && Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
            {children}
        </button>
    );
}
