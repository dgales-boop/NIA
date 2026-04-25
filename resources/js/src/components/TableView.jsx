import { FileText } from "lucide-react";

export default function TableView({ fields, records }) {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm text-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80">
                            <th className="w-10 px-3 py-3.5 text-center font-medium text-gray-400">#</th>
                            {fields.map((field) => (
                                <th
                                    key={field.key}
                                    className="px-4 py-3.5 font-medium text-gray-500"
                                >
                                    {field.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {records.length === 0 && (
                            <tr>
                                <td
                                    className="px-4 py-12 text-center text-gray-500"
                                    colSpan={Math.max(fields.length + 1, 1)}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <FileText className="h-8 w-8 text-gray-300" />
                                        <p>No entries have been recorded yet.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {records.map((record, index) => (
                            <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-3 py-3 text-center text-xs font-medium text-gray-400">{index + 1}</td>
                                {fields.map((field) => (
                                    <td
                                        key={`${record.id}-${field.key}`}
                                        className="px-4 py-3 text-gray-900"
                                    >
                                        {record.data?.[field.key] ?? ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
