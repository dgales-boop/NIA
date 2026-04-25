export default function Badge({ status }) {
    const styles = {
        open: "bg-green-100 text-green-700 border-green-200",
        closed: "bg-gray-100 text-gray-600 border-gray-200",
    };

    const labels = {
        open: "Open",
        closed: "Closed",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                styles[status] || styles.open
            }`}
        >
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                status === "open" ? "bg-green-500" : "bg-gray-400"
            }`}></span>
            {labels[status] || status}
        </span>
    );
}
