import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import PageHeader from "../../components/layout/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import {
    createFieldType,
    deactivateFieldType,
    fetchFieldTypes,
} from "../../services/api";
import { Plus, Archive, Tag } from "lucide-react";

const BASE_TYPE_OPTIONS = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Yes/No" },
    { value: "select", label: "Dropdown" },
];

export default function FieldTypeLibraryScreen() {
    const [fieldTypes, setFieldTypes] = useState([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [baseType, setBaseType] = useState("text");
    const [optionsCsv, setOptionsCsv] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadFieldTypes = async (nextIncludeInactive = includeInactive) => {
        try {
            setLoading(true);
            const data = await fetchFieldTypes(nextIncludeInactive);
            setFieldTypes(data);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFieldTypes();
    }, []);

    const grouped = useMemo(() => {
        const active = fieldTypes.filter((item) => item.is_active);
        const inactive = fieldTypes.filter((item) => !item.is_active);
        return { active, inactive };
    }, [fieldTypes]);

    const submit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        try {
            const payload = {
                name,
                key,
                base_type: baseType,
                settings:
                    baseType === "select"
                        ? {
                              options: optionsCsv
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                          }
                        : null,
            };

            await createFieldType(payload);
            setMessage("Field type created.");
            setName("");
            setKey("");
            setBaseType("text");
            setOptionsCsv("");
            await loadFieldTypes();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    const deactivate = async (fieldTypeId) => {
        setMessage("");
        setError("");

        try {
            await deactivateFieldType(fieldTypeId);
            setMessage("Field type deactivated.");
            await loadFieldTypes();
        } catch (requestError) {
            setError(requestError.message);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Field Library" subtitle="Create approved field types that form builders can choose from." />

            <form
                onSubmit={submit}
                className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <h3 className="text-sm font-semibold text-gray-800">New Field Type</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                        label="Field Label"
                        value={name}
                        onChange={(val) => {
                            setName(val);
                            if (!key || key === name.toLowerCase().trim().replace(/[^a-z0-9\s_]/g, "").replace(/\s+/g, "_")) {
                                setKey(val.toLowerCase().trim().replace(/[^a-z0-9\s_]/g, "").replace(/\s+/g, "_"));
                            }
                        }}
                        placeholder="e.g. Amount Allocated"
                    />
                    <InputField
                        label="Internal ID"
                        value={key}
                        onChange={setKey}
                        placeholder="amount_allocated"
                    />
                </div>

                <label className="flex max-w-md flex-col gap-1.5 text-sm font-medium text-gray-700">
                    <span>Base Type</span>
                    <select
                        value={baseType}
                        onChange={(event) => setBaseType(event.target.value)}
                        className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm bg-white"
                    >
                        {BASE_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                {baseType === "select" && (
                    <InputField
                        label="Dropdown Options (comma-separated)"
                        value={optionsCsv}
                        onChange={setOptionsCsv}
                        placeholder="Option A, Option B"
                    />
                )}

                <div className="flex items-center gap-4 pt-1">
                    <Button type="submit" icon={Plus}>Add Field Type</Button>
                    {message && <p className="text-sm font-medium text-green-700">{message}</p>}
                    {error && <p className="text-sm font-medium text-red-700">{error}</p>}
                </div>
            </form>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Approved Types</h3>
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={includeInactive}
                            onChange={async (event) => {
                                const next = event.target.checked;
                                setIncludeInactive(next);
                                await loadFieldTypes(next);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        Show inactive
                    </label>
                </div>

                {loading ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} variant="card" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {grouped.active.length === 0 && (
                            <div className="col-span-full py-8 text-center">
                                <Tag className="mx-auto h-8 w-8 text-gray-300" />
                                <p className="mt-2 text-sm text-gray-500">No active field types yet.</p>
                            </div>
                        )}
                        {grouped.active.map((fieldType) => (
                            <div
                                key={fieldType.id}
                                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
                            >
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{fieldType.name}</p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{fieldType.base_type}</span>
                                        <span className="text-xs text-gray-400">{fieldType.key}</span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => deactivate(fieldType.id)}
                                    icon={Archive}
                                >
                                    Deactivate
                                </Button>
                            </div>
                        ))}

                        {includeInactive &&
                            grouped.inactive.map((fieldType) => (
                                <div
                                    key={fieldType.id}
                                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60"
                                >
                                    <div className="flex-1 text-gray-500">
                                        <p className="font-semibold text-gray-700">
                                            {fieldType.name} <span className="text-xs font-normal bg-gray-200 px-1.5 py-0.5 rounded ml-1">Inactive</span>
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{fieldType.base_type}</span>
                                            <span className="text-xs">{fieldType.key}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
