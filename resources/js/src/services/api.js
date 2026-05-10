function csrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ?? ""
    );
}

function jsonHeaders() {
    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken(),
    };
}

function formatValidationErrors(errors) {
    if (!errors || typeof errors !== "object") return null;
    const parts = [];
    for (const [key, messages] of Object.entries(errors)) {
        const arr = Array.isArray(messages) ? messages : [messages];
        parts.push(`${key}: ${arr.join(", ")}`);
    }
    return parts.join("; ");
}

/** Thrown for 422 responses that include Laravel `errors` (used by bulk record save). */
export class HttpValidationError extends Error {
    /**
     * @param {string} message
     * @param {{ status?: number, errors?: Record<string, string[]> }} [detail]
     */
    constructor(message, detail = {}) {
        super(message);
        this.name = "HttpValidationError";
        this.status = detail.status ?? 422;
        this.errors = detail.errors && typeof detail.errors === "object" ? detail.errors : {};
    }
}

async function parseResponse(response) {
    const raw = await response.text();
    let data = {};
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = {};
        }
    }

    if (response.status === 401 || response.status === 419) {
        window.dispatchEvent(new Event("auth-expired"));
    }

    if (!response.ok) {
        if (
            response.status === 422 &&
            data?.errors &&
            typeof data.errors === "object"
        ) {
            const fromErrors = formatValidationErrors(data.errors);
            throw new HttpValidationError(
                fromErrors ?? data?.message ?? "Validation failed.",
                {
                    status: 422,
                    errors: data.errors,
                },
            );
        }
        const fromErrors = formatValidationErrors(data?.errors);
        const message =
            fromErrors ??
            data?.message ??
            `Request failed (${response.status}).`;
        throw new Error(message);
    }

    return data;
}

// ─── Auth ──────────────────────────────────────────────
export async function me() {
    const response = await fetch("/auth/me", {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function login(payload) {
    const response = await fetch("/auth/login", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function logout() {
    const response = await fetch("/auth/logout", {
        method: "POST",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

// ─── Templates ─────────────────────────────────────────
/** Full template summaries for entry modals / bootstrap (`for_dropdown=1` server-side). */
export async function fetchTemplates() {
    const response = await fetch("/templates?for_dropdown=1", {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

/**
 * Paginated template list for admin Templates screen (search + page).
 *
 * @param {{ search?: string, page?: number, per_page?: number }} [params]
 */
export async function fetchTemplatesPaginated(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page != null) qs.set("page", String(params.page));
    if (params.per_page != null) qs.set("per_page", String(params.per_page));
    const query = qs.toString() ? `?${qs.toString()}` : "";

    const response = await fetch(`/templates${query}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function fetchTemplate(id) {
    const response = await fetch(`/templates/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function createTemplate(payload) {
    const response = await fetch("/templates", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function updateTemplate(id, payload) {
    const response = await fetch(`/templates/${id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function deleteTemplate(id) {
    const response = await fetch(`/templates/${id}`, {
        method: "DELETE",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

// ─── Projects ──────────────────────────────────────────
/**
 * Paginated project list with optional search. Omit params for first page defaults.
 * Use fetchProjectsDropdown() for modal selects (full id/name list, capped server-side).
 *
 * @param {{ search?: string, page?: number, per_page?: number }} [params]
 */
export async function fetchProjects(params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page != null) qs.set("page", String(params.page));
    if (params.per_page != null) qs.set("per_page", String(params.per_page));
    const query = qs.toString() ? `?${qs.toString()}` : "";

    const response = await fetch(`/projects${query}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

/** @returns {Promise<Array<{ id: number, name: string }>>} */
export async function fetchProjectsDropdown() {
    const response = await fetch(`/projects?for_dropdown=1`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function createProject(payload) {
    const response = await fetch("/projects", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function updateProject(id, payload) {
    const response = await fetch(`/projects/${id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function deleteProject(id) {
    const response = await fetch(`/projects/${id}`, {
        method: "DELETE",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

// ─── Entries ───────────────────────────────────────────
/**
 * @param {{
 *   projectId?: number|string|null,
 *   status?: string|null,
 *   search?: string|null,
 *   page?: number,
 *   per_page?: number,
 * }} [opts]
 */
export async function fetchEntries(opts = {}) {
    const params = new URLSearchParams();
    if (opts.projectId) params.set("project_id", String(opts.projectId));
    if (opts.status) params.set("status", opts.status);
    if (opts.search) params.set("search", opts.search);
    params.set("page", String(opts.page ?? 1));
    params.set("per_page", String(opts.per_page ?? 15));

    const query = `?${params.toString()}`;

    const response = await fetch(`/entries${query}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function createEntry(payload) {
    const response = await fetch("/entries", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function fetchEntry(id) {
    const response = await fetch(`/entries/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function updateEntry(id, payload) {
    const response = await fetch(`/entries/${id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function deleteEntry(id) {
    const response = await fetch(`/entries/${id}`, {
        method: "DELETE",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

export async function closeEntry(id) {
    const response = await fetch(`/entries/${id}/close`, {
        method: "POST",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

export async function reopenEntry(id) {
    const response = await fetch(`/entries/${id}/reopen`, {
        method: "POST",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

export async function markEntryExported(id) {
    const response = await fetch(`/entries/${id}/mark-exported`, {
        method: "POST",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

// ─── Records ───────────────────────────────────────────
export async function createRecord(payload) {
    const response = await fetch("/records", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

async function parseBulkStoreResponse(response) {
    const raw = await response.text();
    let data = {};
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = {};
        }
    }

    if (response.status === 401 || response.status === 419) {
        window.dispatchEvent(new Event("auth-expired"));
    }

    if (!response.ok) {
        if (response.status === 422 && data?.errors && typeof data.errors === "object") {
            const message =
                formatValidationErrors(data.errors) ??
                data?.message ??
                "Validation failed.";
            throw new HttpValidationError(message, {
                status: 422,
                errors: data.errors,
            });
        }
        const fromErrors = formatValidationErrors(data?.errors);
        const message =
            fromErrors ??
            data?.message ??
            `Request failed (${response.status}).`;
        throw new Error(message);
    }

    return data;
}

/**
 * @param {{ template_id: number, entry_id: number, rows: Record<string, unknown>[] }} payload
 */
export async function bulkStoreRecords(payload) {
    const response = await fetch("/records/bulk-store", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseBulkStoreResponse(response);
}

/**
 * @param {number} id
 * @param {{ data: Record<string, unknown> }} payload
 */
export async function updateRecord(id, payload) {
    const response = await fetch(`/records/${id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}
