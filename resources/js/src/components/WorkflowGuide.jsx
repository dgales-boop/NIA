export default function WorkflowGuide({ isAdmin, templateCount }) {
    const encoderSteps = [
        "Select a Budget Form from the dropdown to start entering data.",
        "Fill in each row in the spreadsheet — click into cells to type values.",
        "Click the save icon on each row when done. Saved rows turn green.",
        "Switch to Budget Entries to review, search, or export your data.",
    ];

    const adminSteps = [
        "Use the Field Library to create and manage approved data columns.",
        "Use the Form Builder to design form layouts that encoders will use.",
        "Encoders can then enter budget data using the forms you create.",
        "Review all Budget Entries to monitor data and export reports.",
    ];

    const steps = isAdmin ? adminSteps : encoderSteps;

    return (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 text-sm text-blue-900 shadow-sm">
            <h2 className="text-sm font-semibold text-blue-950">
                {isAdmin ? "Admin Quick Guide" : "How to Enter Budget Data"}
            </h2>
            <ol className="mt-2.5 list-decimal space-y-1 pl-5 marker:text-blue-400">
                {steps.map((step) => (
                    <li key={step}>{step}</li>
                ))}
            </ol>
            {templateCount === 0 && (
                <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2.5">
                    <p className="text-amber-900 text-xs font-medium">
                        {isAdmin
                            ? "No forms exist yet. Create a form layout in the Form Builder first."
                            : "No forms are available yet. Please ask an Admin to set one up."}
                    </p>
                </div>
            )}
        </div>
    );
}
