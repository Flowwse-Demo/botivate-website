"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Layers, Plus, Pencil, Trash2, Save, X,
  RefreshCw, Search, AlertCircle, CheckCircle2,
} from "lucide-react";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../services/schemaApi";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition placeholder:text-gray-400";

// ── Modal ──────────────────────────────────────────────────────────────────
function DeptModal({ editing, onClose, onSaved }) {
  const [name, setName] = useState(editing?.name || "");
  const [desc, setDesc] = useState(editing?.description || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Department name is required."); return; }
    setErr("");
    setSaving(true);
    try {
      let saved;
      if (editing) {
        saved = await updateDepartment(editing.id, { name, description: desc });
      } else {
        saved = await createDepartment({ name, description: desc });
      }
      onSaved(saved);
    } catch (ex) {
      setErr(ex.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {editing ? "Edit Department" : "Add Department"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {err && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1.5">
              Name <span className="text-red-500">*</span>
            </span>
            <input
              className={inputCls}
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1.5">Description</span>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Optional short description…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Department"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteModal({ dept, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await deleteDepartment(dept.id);
      onDeleted(dept.id);
    } catch (ex) {
      alert(ex.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-red-100 text-red-600">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Delete Department</h3>
            <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700">
          Are you sure you want to delete <span className="font-semibold">"{dept.name}"</span>?
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchDepartments({ includeInactive: true });
      setDepartments(rows);
    } catch (e) {
      showToast(e.message || "Failed to load departments.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (saved) => {
    setDepartments((prev) => {
      const exists = prev.find((d) => d.id === saved.id);
      const updated = exists
        ? prev.map((d) => (d.id === saved.id ? saved : d))
        : [...prev, saved];
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
    showToast(editing ? "Department updated." : "Department added.");
    setModalOpen(false);
    setEditing(null);
  };

  const handleDeleted = (id) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setDeleteTarget(null);
    showToast("Department deleted.");
  };

  const handleToggleActive = async (dept) => {
    try {
      const updated = await updateDepartment(dept.id, { is_active: !dept.is_active });
      setDepartments((prev) => prev.map((d) => (d.id === dept.id ? updated : d)));
      showToast(`Department ${updated.is_active ? "activated" : "deactivated"}.`);
    } catch (e) {
      showToast(e.message || "Failed to update.", "error");
    }
  };

  const visible = departments.filter((d) => {
    if (!showInactive && !d.is_active) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const active = departments.filter((d) => d.is_active).length;
  const inactive = departments.length - active;

  return (
    <div className="h-full flex flex-col min-h-0 space-y-5 pb-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all
          ${toast.type === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {toast.type === "error"
            ? <AlertCircle className="w-4 h-4 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Total", value: departments.length },
          { label: "Active", value: active },
          { label: "Inactive", value: inactive },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Departments
          </h2>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 w-40 sm:w-48 transition"
              />
            </div>

            {/* Show inactive toggle */}
            <button
              type="button"
              onClick={() => setShowInactive((v) => !v)}
              className={`px-3 py-2 text-sm font-medium rounded-xl border transition ${
                showInactive
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {showInactive ? "Hide inactive" : "Show inactive"}
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={load}
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add button */}
            <button
              type="button"
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
            Loading departments…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Layers className="w-10 h-10 mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No departments found.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Department" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visible.map((dept, idx) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{dept.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">
                      {dept.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ${
                          dept.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-50 text-slate-500 ring-slate-200"
                        }`}
                      >
                        {dept.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* Toggle active */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(dept)}
                          title={dept.is_active ? "Deactivate" : "Activate"}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                            dept.is_active
                              ? "text-slate-600 bg-slate-50 hover:bg-slate-100"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                        >
                          {dept.is_active ? "Deactivate" : "Activate"}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => { setEditing(dept); setModalOpen(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(dept)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <DeptModal
          editing={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          dept={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
