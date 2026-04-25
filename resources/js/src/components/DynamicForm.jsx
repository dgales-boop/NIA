export default function DynamicForm({ fields, values, onChange }) {
    const renderFieldControl = (field) => {
        const value = values[field.key] ?? "";
        const baseType = field.base_type ?? "text";
        const baseClasses = "block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white placeholder:text-gray-400";

        if (baseType === "textarea") {
            return (
                <textarea
                    value={value}
                    onChange={(event) =>
                        onChange(field.key, event.target.value)
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className={baseClasses}
                    rows={4}
                />
            );
        }

        if (baseType === "number") {
            return (
                <input
                    type="number"
                    value={value}
                    onChange={(event) =>
                        onChange(field.key, event.target.value)
                    }
                    placeholder={`e.g. 100`}
                    className={baseClasses}
                />
            );
        }

        if (baseType === "date") {
            return (
                <input
                    type="date"
                    value={value}
                    onChange={(event) =>
                        onChange(field.key, event.target.value)
                    }
                    className={baseClasses}
                />
            );
        }

        if (baseType === "boolean") {
            return (
                <select
                    value={value}
                    onChange={(event) =>
                        onChange(field.key, event.target.value)
                    }
                    className={baseClasses}
                >
                    <option value="">Select option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            );
        }

        if (baseType === "select") {
            const options = Array.isArray(field.settings?.options)
                ? field.settings.options
                : [];

            return (
                <select
                    value={value}
                    onChange={(event) =>
                        onChange(field.key, event.target.value)
                    }
                    className={baseClasses}
                >
                    <option value="">Select option...</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                value={value}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.label}
                className={baseClasses}
            />
        );
    };

    return (
        <div className="grid gap-5">
            {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5 focus-within:text-blue-600 transition-colors">
                    <label className="text-sm font-medium text-gray-700 pointer-events-none">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFieldControl(field)}
                </div>
            ))}
        </div>
    );
}
