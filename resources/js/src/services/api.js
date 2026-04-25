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

async function parseResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data?.message ?? "Request failed.";
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

// ─── Field Types ───────────────────────────────────────
export async function fetchFieldTypes(includeInactive = false) {
    const query = includeInactive ? "?include_inactive=true" : "";
    const response = await fetch(`/field-types${query}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function createFieldType(payload) {
    const response = await fetch("/field-types", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

export async function deactivateFieldType(fieldTypeId) {
    const response = await fetch(`/field-types/${fieldTypeId}/deactivate`, {
        method: "POST",
        headers: jsonHeaders(),
    });
    return parseResponse(response);
}

// ─── Templates ─────────────────────────────────────────
export async function fetchTemplates() {
    const response = await fetch("/templates", {
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

// ─── Org Units ─────────────────────────────────────────
export async function fetchOrgUnits(flat = false) {
    const query = flat ? "?flat=1" : "";
    const response = await fetch(`/org-units${query}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function fetchOrgUnit(id) {
    const response = await fetch(`/org-units/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function fetchOrgUnitChildren(id) {
    const response = await fetch(`/org-units/${id}/children`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function createOrgUnit(payload) {
    const response = await fetch("/org-units", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}

// ─── Projects ──────────────────────────────────────────
export async function fetchProjects(orgUnitId = null) {
    const query = orgUnitId ? `?org_unit_id=${orgUnitId}` : "";
    const response = await fetch(`/projects${query}`, {
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

export async function fetchProject(id) {
    const response = await fetch(`/projects/${id}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

// ─── Entries ───────────────────────────────────────────
export async function fetchEntries(projectId = null, status = null) {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", projectId);
    if (status) params.set("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";

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

// ─── Records ───────────────────────────────────────────
export async function fetchRecordsByTemplate(templateId) {
    const response = await fetch(`/records?template_id=${templateId}`, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    return parseResponse(response);
}

export async function createRecord(payload) {
    const response = await fetch("/records", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return parseResponse(response);
}
