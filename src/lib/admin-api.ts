import { API_BASE_URL, ApiError, apiRequest } from "./api";

// --- Types (mirror backend schemas) ---
export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "user";
  is_active: boolean;
};

export type Step = { id: string; label: string; done?: boolean; detail?: string };

export type TemplateChecklist = { title: string; description?: string; steps: Step[] };
export type TemplateCase = {
  summary: string;
  root_cause?: string;
  resolution?: string;
  tags?: string[];
  priority?: "Critical" | "High" | "Medium" | "Low";
};
export type TemplateContact = {
  name: string;
  team?: string;
  role?: string;
  email?: string;
  initials?: string;
};

export type ModuleTemplate = {
  id: string;
  name: string;
  description: string;
  short: string;
  color: string;
  overview: Record<string, unknown>;
  chatGreeting?: string;
  chatSuggestions?: string[];
  checklists: TemplateChecklist[];
  cases: TemplateCase[];
  contacts: TemplateContact[];
};

export type AdminCase = {
  id: string;
  module_id: string;
  summary: string;
  root_cause?: string;
  resolution?: string;
  tags: string[];
  priority: "Critical" | "High" | "Medium" | "Low";
  case_date?: string;
  team?: string;
  client_id?: string;
  created_at?: string;
};

export type AdminChecklist = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  steps: Step[];
};

export type AIInsight = {
  id: number;
  user_id: number | null;
  user_email: string;
  module_id: string | null;
  module_name: string;
  query: string;
  response: Record<string, unknown>;
  feedback: "up" | "down" | null;
  feedback_note: string;
  created_at: string;
};

export type AuditEntry = {
  id: number;
  actor_id: number | null;
  actor_email: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type AnalyticsOverview = {
  total_modules: number;
  total_cases: number;
  total_checklists: number;
  total_contacts: number;
  total_tracking: number;
  total_attachments: number;
  total_users: number;
  total_admins: number;
  ai_queries_total: number;
  ai_queries_last_7d: number;
  ai_feedback_up: number;
  ai_feedback_down: number;
  cases_per_module: {
    module_id: string;
    module_name: string;
    case_count: number;
    checklist_count: number;
  }[];
  top_tags: { tag: string; count: number }[];
  recent_activity: {
    id: number;
    actor_email: string;
    action: string;
    entity: string;
    entity_id: string;
    summary: string;
    created_at: string;
  }[];
};

export type CSVImportResult = { created: number; skipped: number; errors: string[] };

// --- API helpers (all require admin token) ---
type TokenArg = { token: string | null };

export const adminApi = {
  listUsers(t: TokenArg) {
    return apiRequest<AdminUser[]>("/api/admin/users", { token: t.token });
  },
  updateUser(
    t: TokenArg,
    id: number,
    patch: Partial<Pick<AdminUser, "role" | "is_active" | "name">>,
  ) {
    return apiRequest<AdminUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: patch,
      token: t.token,
    });
  },

  listTemplates(t: TokenArg) {
    return apiRequest<ModuleTemplate[]>("/api/admin/templates", { token: t.token });
  },
  createTemplate(t: TokenArg, body: Partial<ModuleTemplate> & { name: string }) {
    return apiRequest<ModuleTemplate>("/api/admin/templates", {
      method: "POST",
      body,
      token: t.token,
    });
  },
  deleteTemplate(t: TokenArg, id: string) {
    return apiRequest<void>(`/api/admin/templates/${id}`, { method: "DELETE", token: t.token });
  },
  instantiateModule(t: TokenArg, body: { name: string; template_id: string; id?: string }) {
    return apiRequest<{ id: string; name: string }>("/api/admin/modules/instantiate", {
      method: "POST",
      body,
      token: t.token,
    });
  },

  listCases(t: TokenArg, params: Record<string, string | undefined> = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    const s = qs.toString();
    return apiRequest<AdminCase[]>(`/api/admin/cases${s ? `?${s}` : ""}`, { token: t.token });
  },
  deleteCase(t: TokenArg, id: string) {
    return apiRequest<void>(`/api/admin/cases/${id}`, { method: "DELETE", token: t.token });
  },
  async importCasesCSV(t: TokenArg, moduleId: string, file: File): Promise<CSVImportResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${API_BASE_URL}/api/admin/cases/bulk-import?module_id=${encodeURIComponent(moduleId)}`,
      {
        method: "POST",
        body: form,
        headers: t.token ? { Authorization: `Bearer ${t.token}` } : undefined,
      },
    );
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const detail =
        data && typeof data === "object" && "detail" in data
          ? String((data as { detail: unknown }).detail)
          : `${res.status} ${res.statusText}`;
      throw new ApiError(res.status, detail, data);
    }
    return data as CSVImportResult;
  },

  listChecklists(t: TokenArg, moduleId?: string) {
    const s = moduleId ? `?module_id=${encodeURIComponent(moduleId)}` : "";
    return apiRequest<AdminChecklist[]>(`/api/admin/checklists${s}`, { token: t.token });
  },
  deleteChecklist(t: TokenArg, id: string) {
    return apiRequest<void>(`/api/admin/checklists/${id}`, { method: "DELETE", token: t.token });
  },

  listInsights(
    t: TokenArg,
    params: { feedback?: "up" | "down"; module_id?: string; limit?: number } = {},
  ) {
    const qs = new URLSearchParams();
    if (params.feedback) qs.set("feedback", params.feedback);
    if (params.module_id) qs.set("module_id", params.module_id);
    if (params.limit) qs.set("limit", String(params.limit));
    const s = qs.toString();
    return apiRequest<AIInsight[]>(`/api/admin/ai/insights${s ? `?${s}` : ""}`, {
      token: t.token,
    });
  },

  listAudit(t: TokenArg, params: { entity?: string; action?: string; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.entity) qs.set("entity", params.entity);
    if (params.action) qs.set("action", params.action);
    if (params.limit) qs.set("limit", String(params.limit));
    const s = qs.toString();
    return apiRequest<AuditEntry[]>(`/api/admin/audit${s ? `?${s}` : ""}`, { token: t.token });
  },

  analytics(t: TokenArg) {
    return apiRequest<AnalyticsOverview>("/api/admin/analytics/overview", { token: t.token });
  },
};

export function chatFeedback(
  token: string | null,
  logId: number,
  feedback: "up" | "down",
  note = "",
) {
  return apiRequest<{ ok: boolean }>(`/api/chat/${logId}/feedback`, {
    method: "POST",
    body: { feedback, note },
    token,
  });
}
