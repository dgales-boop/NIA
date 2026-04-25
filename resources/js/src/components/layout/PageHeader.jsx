export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
        </div>
    );
}
