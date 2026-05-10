export default function InputField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    icon: Icon,
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            <span>{label}</span>
            <div className="relative">
                {Icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Icon className="h-4 w-4 text-gray-400" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder || undefined}
                    className={`block w-full rounded-md border border-gray-300 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${
                        Icon ? "pl-10 pr-3" : "px-3"
                    }`}
                />
            </div>
        </label>
    );
}
