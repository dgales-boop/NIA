import { Loader2 } from "lucide-react";

export default function Button({
    type = "button",
    onClick,
    children,
    disabled = false,
    variant = "primary",
    icon: Icon,
    loading = false,
    className = "",
}) {
    const base = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";
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
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!loading && Icon && <Icon className="h-4 w-4" />}
            {children}
        </button>
    );
}
