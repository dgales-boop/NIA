import { useEffect, useState } from "react";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import PageHeader from "../../components/layout/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { createTemplate, fetchFieldTypes } from "../../services/api";
import { Plus, Trash2 } from "lucide-react";

export default function TemplateBuilderScreen({ onTemplateCreated }) {
    const [name, setName] = useState("");
    const [fieldTypes, setFieldTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fields, setFields] = useState([
        { key: "", label: "", required: false, field_type_id: "" },
    ]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadFieldTypes = async () => {
            try {
                const data = await fetchFieldTypes();
                setFieldTypes(data);

                if (data.length > 0) {
                    setFields((current) =>
                        current.map((field) => ({
                            ...field,
                            field_type_id:
                                field.field_type_id || String(data[0].id),
                        })),
                    );
                }
            } catch (requestError) {
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        loadFieldTypes();
    }, []);

    const updateField = (index, patch) => {
        setFields((current) =>
            current.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );
    };

    const toCode = (label) =>
        label
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s_]/g, "")
            .replace(/\s+/g, "_");

    const addField = () => {
        setFields((current) => [
            ...current,
            {
                key: "",
                label: "",
                required: false,
                field_type_id:
                    fieldTypes.length > 0 ? String(fieldTypes[0].id) : "",
            },
        ]);
    };

    const removeField = (index) => {
        setFields((current) => current.filter((_, i) => i !== index));
    };

    const submit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        try {
            const payload = {
                name,
                schema: {
                    fields: fields.map((field) => {
                        const ft = fieldTypes.find(t => t.id === Number(field.field_type_id));
                        return {
                            key: field.key,
                            label: field.label,
                            required: Boolean(field.required),
                            field_type_id: Number(field.field_type_id),
                            base_type: ft?.base_type ?? "text",
                            settings: ft?.settings ?? null,
                        };
                    }),
                },
            };

            await createTemplate(payload);
            setMessage("Form layout saved successfully.");
            setName("");
            setFields([
                {
                    key: "",
                    label: "",
                    required: false,
                    field_type_id:
                        fieldTypes.length > 0 ? String(fieldTypes[0].id) : "",
                },
            ]);
            onTemplateCreated();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Form Builder" subtitle="Create a form layout for staff data entry." />
                <Skeleton variant="table" rows={4} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Form Builder" subtitle="Create a form layout for staff data entry. Add fields and set whether they are required." />

            <form
                onSubmit={submit}
                className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <div className="max-w-xl">
                    <InputField
                        label="Budget Form Name"
                        value={name}
                        onChange={setName}
                        placeholder="e.g. Maintenance Logs"
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Form Fields</h3>
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={index}
                                className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 md:grid-cols-[2fr_1fr_1fr_auto_auto] items-end transition-colors"
                            >
                                <InputField
                                    label="Field Label"
                                    value={field.label}
                                    onChange={(value) => {
                                        const nextCode = toCode(value);
                                        updateField(index, {
                                            label: value,
                                            key: field.key ? field.key : nextCode,
                                        });
                                    }}
                                    placeholder="e.g. Project Name"
                                />
                                <InputField
                                    label="Internal ID"
                                    value={field.key}
                                    onChange={(value) =>
                                        updateField(index, { key: toCode(value) })
                                    }
                                    placeholder="project_name"
                                />
                                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                                    <span>Input Type</span>
                                    <select
                                        value={field.field_type_id}
                                        onChange={(event) =>
                                            updateField(index, {
                                                field_type_id: event.target.value,
                                            })
                                        }
                                        className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm bg-white"
                                    >
                                        {fieldTypes.map((fieldType) => (
                                            <option
                                                key={fieldType.id}
                                                value={fieldType.id}
                                            >
                                                {fieldType.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 h-[42px] px-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(field.required)}
                                        onChange={(event) =>
                                            updateField(index, {
                                                required: event.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    Required
                                </label>
                                <div className="flex h-[42px] items-end pb-px">
                                    <button
                                        type="button"
                                        onClick={() => removeField(index)}
                                        disabled={fields.length === 1}
                                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={addField}
                        disabled={fieldTypes.length === 0}
                        icon={Plus}
                    >
                        Add Another Field
                    </Button>
                    <Button type="submit" disabled={fieldTypes.length === 0 || !name.trim() || fields.length === 0}>
                        Save Form Layout
                    </Button>
                </div>

                <div className="flex flex-col gap-2">
                    {fieldTypes.length === 0 && (
                        <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                            <p className="text-sm text-amber-800">
                                No active field types yet. Create field types in the Field Library first.
                            </p>
                        </div>
                    )}
                    {message && <p className="text-sm font-medium text-green-700">{message}</p>}
                    {error && <p className="text-sm font-medium text-red-700">{error}</p>}
                </div>
            </form>
        </div>
    );
}
