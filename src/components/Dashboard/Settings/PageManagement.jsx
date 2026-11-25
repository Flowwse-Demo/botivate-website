"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutGrid, Search, Save, RefreshCw, CheckCircle2,
  AlertCircle, Building2, ChevronRight,
  BarChart3, Plus, FileText, Clock, CheckCircle,
  Settings, Bot, Sparkles, UserPlus, ClipboardList,
  LayoutList, ClipboardCheck, FlaskConical, ShieldCheck,
  Package, CalendarCheck, CalendarDays, Send, FileCheck2,
  Lock, X,
} from "lucide-react";
import { fetchAccounts, updateAccount } from "../../../services/schemaApi";

// Pages available to company accounts (matches sidebar COMPANY_TAB_ORDER defaults)
const COMPANY_PAGE_KEYS = [
  "dashboard",
  "assign-task",
  "company-systems",
  "company-tasks",
  "troubleshoot",
  "ai-helper",
  "company-profile",
];

// Default ticked = what's currently shown when a company logs in
const COMPANY_LOGIN_DEFAULTS = new Set([
  "dashboard",
  "assign-task",
  "company-systems",
  "company-tasks",
  "troubleshoot",
  "ai-helper",
  "company-profile",
]);

const PAGE_META = {
  dashboard: {
    icon: BarChart3, label: "Dashboard",
    blurb: "Overview & key statistics",
    tint: "from-sky-500/15 to-blue-500/5",
    ring: "ring-sky-200", iconBg: "bg-sky-100 text-sky-600",
  },
  "assign-task": {
    icon: Plus, label: "Generate New Ticket",
    blurb: "Raise support or project tickets",
    tint: "from-violet-500/15 to-purple-500/5",
    ring: "ring-violet-200", iconBg: "bg-violet-100 text-violet-600",
  },
  "company-systems": {
    icon: Building2, label: "My Systems",
    blurb: "Client system modules and task tree",
    tint: "from-blue-500/15 to-sky-500/5",
    ring: "ring-blue-200", iconBg: "bg-blue-100 text-blue-600",
  },
  "company-tasks": {
    icon: CheckCircle, label: "Task Overview",
    blurb: "All company tasks with status filter",
    tint: "from-emerald-500/15 to-green-500/5",
    ring: "ring-emerald-200", iconBg: "bg-emerald-100 text-emerald-600",
  },
  troubleshoot: {
    icon: Settings, label: "Troubleshoot",
    blurb: "Issue tracker & bug reporting",
    tint: "from-slate-500/15 to-gray-500/5",
    ring: "ring-slate-200", iconBg: "bg-slate-100 text-slate-600",
  },
  "ai-helper": {
    icon: Bot, label: "AI System Consultant",
    blurb: "AI consultant & smart assistant",
    tint: "from-rose-500/15 to-red-500/5",
    ring: "ring-rose-200", iconBg: "bg-rose-100 text-rose-600",
  },
  "company-profile": {
    icon: Building2, label: "Company Profile",
    blurb: "Company profile, credentials & details",
    tint: "from-slate-500/15 to-gray-500/5",
    ring: "ring-slate-200", iconBg: "bg-slate-100 text-slate-600",
  },
};

const permKeys = (p) =>
  p && typeof p === "object" ? Object.keys(p).filter((k) => p[k] === true) : [];

const resolveKeys = (u) => {
  let perm = u.permission;
  if (typeof perm === "string") {
    try { perm = JSON.parse(perm); } catch { /* ignore */ }
  }
  if (perm && typeof perm === "object") {
    if (perm.all === true) return [...COMPANY_PAGE_KEYS];
    const keys = permKeys(perm).filter((k) => COMPANY_PAGE_KEYS.includes(k));
    if (keys.length > 0) return keys;
  }
  // No permission set → use login defaults
  return [...COMPANY_LOGIN_DEFAULTS];
};

const avatarColor = (name = "") => {
  const colors = [
    "bg-violet-100 text-violet-700", "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700", "bg-indigo-100 text-indigo-700",
  ];
  return colors[(name.charCodeAt(0) || 0) % colors.length];
};

export default function PageManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [keys, setKeys] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchAccounts(["company"]);
      setCompanies(rows);
      if (rows.length > 0 && !selectedId) {
        const first = rows[0];
        setSelectedId(first.id);
        setKeys(resolveKeys(first));
      }
    } catch (e) {
      setError(e.message || "Failed to load companies.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedId) || null,
    [companies, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      [c.company_name, c.name, c.username, c.contact_person, c.city]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [companies, search]);

  const selectCompany = (c) => {
    setSelectedId(c.id);
    setKeys(resolveKeys(c));
  };

  const toggleKey = (k) => {
    if (k === "dashboard") return;
    setKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  const handleSave = async () => {
    if (!selectedCompany) return;
    setSaving(true);
    try {
      const permission = {};
      [...new Set(["dashboard", ...keys])].forEach((k) => (permission[k] = true));
      const saved = await updateAccount(selectedCompany.id, {
        name: selectedCompany.company_name || selectedCompany.name,
        username: selectedCompany.username,
        password: "",
        role: "company",
        is_active: selectedCompany.is_active !== false,
        permission,
      });
      setCompanies((prev) =>
        prev.map((c) => (c.id === saved.id ? { ...c, permission: saved.permission } : c))
      );
      setToast(`Page access saved for ${selectedCompany.company_name || selectedCompany.name}.`);
    } catch (e) {
      setToast(`Error: ${e.message || "Save failed."}`);
    } finally {
      setSaving(false);
    }
  };

  const displayName = (c) => c.company_name || c.name || "—";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Company Page Management</h1>
            <p className="text-sm text-gray-500">
              Control which pages each company can access in their dashboard sidebar.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          title="Refresh"
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {toast && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl text-sm px-3.5 py-2.5 ${toast.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {toast}
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left: Company List */}
        <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies…"
                className="w-full pl-9 pr-7 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && companies.length === 0 ? (
              <p className="p-4 text-xs text-gray-400 text-center">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-xs text-gray-400 text-center">No companies found.</p>
            ) : (
              filtered.map((c) => {
                const name = displayName(c);
                const isSelected = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCompany(c)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition border-b border-gray-50 last:border-0 ${
                      isSelected
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${avatarColor(name)}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>
                        {name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {c.city || c.industry || c.username || "—"}
                      </p>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50/60">
            <p className="text-[11px] text-gray-400 text-center">
              {filtered.length} of {companies.length} companies
            </p>
          </div>
        </div>

        {/* Right: Page Grid */}
        <div className="flex-1 flex flex-col rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden">
          {!selectedCompany ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a company to manage its page access.
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${avatarColor(displayName(selectedCompany))}`}>
                    {displayName(selectedCompany).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 truncate">
                      {displayName(selectedCompany)}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {keys.length} / {COMPANY_PAGE_KEYS.length} pages enabled
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setKeys([...COMPANY_PAGE_KEYS])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeys(["dashboard"])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                  >
                    Deselect all
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeys([...COMPANY_LOGIN_DEFAULTS])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                  >
                    Reset default
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm shadow-indigo-200"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Info banner: defaults */}
              <div className="mx-5 mt-4 mb-1 flex items-start gap-2 rounded-xl bg-sky-50/70 border border-sky-100 px-3.5 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                <p className="text-xs text-sky-700">
                  Pages highlighted in blue are shown by default when a company logs in. Deselecting a page removes it from their sidebar.
                </p>
              </div>

              {/* Page cards */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {COMPANY_PAGE_KEYS.map((key) => {
                    const meta = PAGE_META[key];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const isDash = key === "dashboard";
                    const on = isDash || keys.includes(key);
                    const isDefault = COMPANY_LOGIN_DEFAULTS.has(key);

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isDash}
                        onClick={() => toggleKey(key)}
                        className={`group relative text-left rounded-2xl border p-3.5 transition-all duration-200 ${
                          on
                            ? `bg-gradient-to-br ${meta.tint} border-transparent ring-1 ${meta.ring} shadow-sm`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        } ${isDash ? "cursor-default opacity-90" : "cursor-pointer active:scale-[0.98]"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                              on ? meta.iconBg : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold truncate ${on ? "text-gray-900" : "text-gray-500"}`}>
                                {meta.label}
                              </p>
                              <span
                                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition ${
                                  on
                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                                    : "bg-gray-100 text-transparent ring-1 ring-gray-200"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {meta.blurb}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {isDash && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600/90">
                                  Always on
                                </span>
                              )}
                              {isDefault && !isDash && (
                                <span className="text-[10px] font-semibold text-indigo-500/80">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                <p className="text-[11px] text-gray-400">
                  Changes are saved to the company&apos;s <code>permission</code> column in the database and take effect on their next login.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
