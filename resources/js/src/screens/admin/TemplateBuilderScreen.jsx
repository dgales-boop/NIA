import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import PageHeader from "../../components/layout/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { createTemplate, fetchTemplate, updateTemplate } from "../../services/api";
import { Info, Plus, Trash2 } from "lucide-react";

const TEXT_LENGTH_HINT =
    "Written answers in text columns are limited automatically (about 2,000 characters) so the system stays fast.";

const BASE_TYPES = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Yes / No" },
];

/** Slug from label for new columns; server assigns stable keys for existing rows on edit. */
const toCode = (label) =>
    label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_")
        .replace(/^_+|_+$/g, "");

const defaultField = () => ({
    label: "",
    required: false,
    base_type: "text",
    persistedKey: null,
});

/**
 * @param {Array<{ label: string, base_type: string, required: boolean, persistedKey: string | null }>} rows
 * @returns {Array<{ key: string, label: string, base_type: string, required: boolean }>}
 */
function buildSchemaFields(rows) {
    const used = new Set();
    return rows.map((f, i) => {
        let key =
            f.persistedKey != null && String(f.persistedKey).trim() !== ""
                ? String(f.persistedKey).trim()
                : toCode(f.label) || `column_${i + 1}`;

        const base = key;
        let n = 2;
        while (used.has(key)) {
            key = `${base}_${n}`;
            n += 1;
        }
        used.add(key);

        return {
            key,
            label: f.label.trim(),
            required: Boolean(f.required),
            base_type: f.base_type,
        };
    });
}

export default function TemplateBuilderScreen({
    templateId = null,
    onSaved,
    onCancel,
}) {
    const isEdit = Boolean(templateId);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(Boolean(templateId));
    const [fields, setFields] = useState([defaultField()]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const saveInFlightRef = useRef(false);

    useEffect(() => {
        if (!templateId) {
            setLoading(false);
            setName("");
            setFields([defaultField()]);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const t = await fetchTemplate(templateId);
                if (cancelled) return;
                setName(t.name ?? "");
                const loaded = (t.schema?.fields ?? []).map((f) => ({
                    label: f.label ?? "",
                    required: Boolean(f.required),
                    base_type: f.base_type ?? "text",
                    persistedKey: f.key ?? null,
                }));
                setFields(loaded.length ? loaded : [defaultField()]);
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [templateId]);

    const updateField = (index, patch) => {
        setFields((current) =>
            current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        );
    };

    const addField = () => {
        setFields((current) => [...current, defaultField()]);
    };

    const removeField = (index) => {
        setFields((current) => current.filter((_, i) => i !== index));
    };

    const submit = async (event) => {
        event.preventDefault();
        if (saveInFlightRef.current) {
            return;
        }
        saveInFlightRef.current = true;
        setSaving(true);
        setMessage("");
        setError("");

        const schemaFields = buildSchemaFields(fields);
        const payload = {
            name,
            schema: {
                fields: schemaFields.map((row) => ({
                    key: row.key,
                    label: row.label,
                    required: row.required,
                    base_type: row.base_type,
                })),
            },
        };

        try {
            if (isEdit) {
                await updateTemplate(templateId, payload);
                const t = await fetchTemplate(templateId);
                const loaded = (t.schema?.fields ?? []).map((f) => ({
                    label: f.label ?? "",
                    required: Boolean(f.required),
                    base_type: f.base_type ?? "text",
                    persistedKey: f.key ?? null,
                }));
                setFields(loaded.length ? loaded : [defaultField()]);
                setName(t.name ?? "");
            } else {
                await createTemplate(payload);
                setName("");
                setFields([defaultField()]);
            }
            setMessage(isEdit ? "Template updated." : "Template saved.");
            onSaved?.();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            saveInFlightRef.current = false;
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title={isEdit ? "Edit template" : "Template builder"}
                    subtitle="Name this template, then add columns like a spreadsheet."
                />
                <Skeleton variant="table" rows={4} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={isEdit ? "Edit template" : "Template builder"}
                subtitle="Each column needs a header (like Excel) and an answer type: text, number, date, or yes/no. Check Required if staff must fill it in before saving a row."
                actions={
                    onCancel ? (
                        <Button variant="secondary" type="button" onClick={onCancel}>
                            Back to templates
                        </Button>
                    ) : null
                }
            />

            <form
                onSubmit={submit}
                className={`space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${saving ? "pointer-events-none opacity-70" : ""}`}
            >
                <div className="max-w-xl">
                    <InputField
                        label="Template name"
                        value={name}
                        onChange={setName}
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Columns on this template</h3>
                    <p className="text-xs text-gray-500">
                        Headers are what staff see in the grid. Internal column names are created automatically.
                    </p>
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={`${field.persistedKey ?? "new"}-${index}`}
                                className="grid gap-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] items-end transition-colors"
                            >
                                <InputField
                                    label="Column header"
                                    value={field.label}
                                    onChange={(value) => updateField(index, { label: value })}
                                />
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                                        <span className="text-sm font-medium text-gray-700">Answer type</span>
                                        {field.base_type === "text" && (
                                            <button
                                                type="button"
                                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                title={TEXT_LENGTH_HINT}
                                                aria-label={TEXT_LENGTH_HINT}
                                            >
                                                <Info className="h-3 w-3" strokeWidth={2.5} />
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={field.base_type}
                                        onChange={(event) =>
                                            updateField(index, { base_type: event.target.value })
                                        }
                                        className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm bg-white"
                                    >
                                        {BASE_TYPES.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 h-[42px] px-2 cursor-pointer select-none md:h-auto md:items-end md:pb-2.5">
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
                                <div className="flex h-[42px] items-end justify-end pb-px md:justify-start">
                                    <button
                                        type="button"
                                        onClick={() => removeField(index)}
                                        disabled={fields.length === 1}
                                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                        aria-label="Remove column"
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
                        icon={Plus}
                        disabled={saving}
                    >
                        Add column
                    </Button>
                    <Button
                        type="submit"
                        loading={saving}
                        disabled={!name.trim() || fields.length === 0 || saving}
                    >
                        {isEdit ? "Save changes" : "Save template"}
                    </Button>
                </div>

                <div className="flex flex-col gap-2">
                    {message && <p className="text-sm font-medium text-green-700">{message}</p>}
                    {error && <p className="text-sm font-medium text-red-700">{error}</p>}
                </div>
            </form>
        </div>
    );
}
