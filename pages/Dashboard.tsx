import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../src/lib/firebase";
import {
  Loader2,
  ExternalLink,
  Calendar,
  Mail,
  MessageSquare,
  Target,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Filter,
  Trash2,
  X,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "../components/ui-primitives";

// ── Types ────────────────────────────────────────────────────────────────────

export type LeadStatus = "leads" | "contacted" | "won" | "lost";

interface LeadData {
  id: string;
  name: string;
  formType: string;
  createdAt: string;
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | string;
  status?: LeadStatus;
  collection?: string;
  phoneNumber?: string;
  category?: string;
  revenueRange?: string;
  workEmail?: string;
  email?: string;
  website?: string;
  budget?: string;
  goals?: string;
  message?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const COLLECTION_NAMES = [
  "consultation_leads",
  "leads",
  "forms",
  "submissions",
  "contacts",
  "formSubmissions",
];

const toDate = (value: any): Date => {
  if (!value) return new Date(0);
  if (typeof value === "string") {
    // Handle "DD Month YYYY at HH:MM:SS" format often seen in some exports/displays
    const cleanValue = value.replace(/\s+at\s+/i, " ");
    const d = new Date(cleanValue);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  if (typeof value === "number") return new Date(value);
  if ((value as any).seconds) return new Date((value as any).seconds * 1000);
  return new Date(value);
};

const fmtDate = (value: any) =>
  toDate(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDateLong = (value: any) =>
  toDate(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

async function firestoreUpdate(lead: LeadData, data: Record<string, any>) {
  const order = lead.collection
    ? [lead.collection, ...COLLECTION_NAMES]
    : COLLECTION_NAMES;
  for (const col of order) {
    try {
      await updateDoc(doc(db, col, lead.id), data);
      return;
    } catch {
      continue;
    }
  }
}

async function firestoreDelete(lead: LeadData) {
  const order = lead.collection
    ? [lead.collection, ...COLLECTION_NAMES]
    : COLLECTION_NAMES;
  for (const col of order) {
    try {
      await deleteDoc(doc(db, col, lead.id));
      return;
    } catch {
      continue;
    }
  }
}

function exportCSV(leads: LeadData[]) {
  const headers = [
    "Name",
    "Email/Phone",
    "Form Type",
    "Status",
    "Budget/Revenue",
    "Category",
    "Website",
    "Submitted",
  ];
  const rows = leads.map((l) => [
    l.name,
    l.workEmail || l.email || l.phoneNumber || "",
    l.formType,
    l.status || "leads",
    l.budget || l.revenueRange || "",
    l.category || "",
    l.website || "",
    fmtDateLong(l.createdAt || l.timestamp),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; cls: string }> = {
  leads: {
    label: "New Lead",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  },
  contacted: {
    label: "Contacted",
    cls: "bg-blue-50 text-blue-600 border-blue-200",
  },
  won: { label: "Won", cls: "bg-green-50 text-green-600 border-green-200" },
  lost: { label: "Lost", cls: "bg-red-50 text-red-500 border-red-200" },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.leads;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

// ── Lead Detail Modal ─────────────────────────────────────────────────────────

function LeadDetailModal({
  lead,
  onClose,
  onStatusChange,
  onDelete,
}: {
  lead: LeadData;
  onClose: () => void;
  onStatusChange: (lead: LeadData, newStatus: LeadStatus) => void;
  onDelete: (lead: LeadData) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const statusOptions = Object.entries(STATUS_CONFIG) as [
    LeadStatus,
    { label: string; cls: string },
  ][];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
              <div className="flex flex-col gap-1 mt-1">
                {(lead.workEmail || lead.email) && (
                  <a
                    href={`mailto:${lead.workEmail || lead.email}`}
                    className="text-sm text-orange-500 hover:underline flex items-center gap-1.5"
                  >
                    <Mail size={13} />
                    {lead.workEmail || lead.email}
                  </a>
                )}
                {lead.phoneNumber && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-400">+91</span>
                    {lead.phoneNumber}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Delete lead"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confirm delete?</span>
                  <button
                    onClick={() => {
                      onDelete(lead);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Status Change */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Update Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(([value, cfg]) => (
                  <button
                    key={value}
                    onClick={() => {
                      onStatusChange(lead, value);
                      onClose();
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                      (lead.status || "leads") === value
                        ? cfg.cls
                        : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-700",
                    )}
                  >
                    {cfg.label}
                    {(lead.status || "leads") === value && " ✓"}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Form Type
                </label>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border",
                    lead.formType === "book-demo"
                      ? "bg-orange-50 text-orange-600 border-orange-200"
                      : "bg-blue-50 text-blue-600 border-blue-200",
                  )}
                >
                  {lead.formType === "book-demo" ? "Book Demo" : "Contact Us"}
                </span>
              </div>

              {(lead.budget || lead.revenueRange) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Budget / Revenue
                  </label>
                  <p className="text-sm font-semibold text-gray-800">
                    {lead.budget || lead.revenueRange}
                  </p>
                </div>
              )}
            </div>

            {lead.category && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Category
                </label>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                  {lead.category}
                </span>
              </div>
            )}

            {lead.website && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Website
                </label>
                <a
                  href={
                    lead.website.startsWith("http")
                      ? lead.website
                      : `https://${lead.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-orange-500 hover:underline"
                >
                  <ExternalLink size={13} />
                  {lead.website}
                </a>
              </div>
            )}

            {lead.goals && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  <Target size={11} className="inline mr-1" />
                  Goals
                </label>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {lead.goals}
                </p>
              </div>
            )}

            {lead.message && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  <MessageSquare size={11} className="inline mr-1" />
                  Message
                </label>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {lead.message}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Submitted
              </label>
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <Calendar size={13} />
                {fmtDateLong(lead.createdAt || lead.timestamp)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [formTypeFilter, setFormTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // UI state
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLeads = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      let leadsData: LeadData[] = [];

      for (const colName of COLLECTION_NAMES) {
        try {
          let snapshot;
          try {
            // Try common date fields for ordering
            const dateField = colName === "consultation_leads" ? "submittedAt" : "createdAt";
            snapshot = await getDocs(
              query(collection(db, colName), orderBy(dateField, "desc")),
            );
          } catch {
            snapshot = await getDocs(collection(db, colName));
          }

          snapshot.forEach((d) => {
            const data = d.data();
            leadsData.push({
              id: d.id,
              ...data,
              phoneNumber: data.phoneNumber || data.phone || "",
              createdAt: data.createdAt || data.submittedAt || data.timestamp || "",
              category: data.category || data.service || "",
              website: data.website || data.websiteLink || "",
              formType: data.formType || data.source || "contact",
              collection: colName,
            } as LeadData);
          });

          if (leadsData.length > 0) break;
        } catch {
          continue;
        }
      }

      if (leadsData.length === 0) {
        setError(
          "No leads found. Make sure your Firestore collection is set up correctly.",
        );
      } else {
        // Sort by date descending by default
        leadsData.sort(
          (a, b) =>
            toDate(b.createdAt || b.timestamp).getTime() -
            toDate(a.createdAt || a.timestamp).getTime(),
        );
        setLeads(leadsData);
      }
    } catch (err: any) {
      setError(`Failed to load leads: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ── Filter + Sort ──────────────────────────────────────────────────────────

  const filteredLeads = React.useMemo(() => {
    let out = leads;

    if (formTypeFilter !== "all")
      out = out.filter((l) => l.formType === formTypeFilter);

    if (statusFilter !== "all")
      out = out.filter((l) => (l.status || "leads") === statusFilter);

    if (dateStart && dateEnd) {
      const s = new Date(dateStart).getTime();
      const e = new Date(dateEnd).getTime() + 86_400_000;
      out = out.filter((l) => {
        const t = toDate(l.createdAt || l.timestamp).getTime();
        return t >= s && t <= e;
      });
    }

    // Apply sort direction
    out = [...out].sort((a, b) => {
      const tA = toDate(a.createdAt || a.timestamp).getTime();
      const tB = toDate(b.createdAt || b.timestamp).getTime();
      return sortDir === "desc" ? tB - tA : tA - tB;
    });

    return out;
  }, [leads, formTypeFilter, statusFilter, dateStart, dateEnd, sortDir]);

  // Reset page on filter change
  useEffect(
    () => setCurrentPage(1),
    [formTypeFilter, statusFilter, dateStart, dateEnd, sortDir],
  );

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = React.useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((l) => !l.status || l.status === "leads").length,
      contacted: leads.filter((l) => l.status === "contacted").length,
      won: leads.filter((l) => l.status === "won").length,
      lost: leads.filter((l) => l.status === "lost").length,
    }),
    [leads],
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStatusChange = async (lead: LeadData, newStatus: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)),
    );
    await firestoreUpdate(lead, { status: newStatus });
  };

  const handleDelete = async (lead: LeadData) => {
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    await firestoreDelete(lead);
  };

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const pageLeads = filteredLeads.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const goToPage = (p: number) =>
    setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          <p className="text-sm text-gray-500">Loading leads…</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Leads
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage form submissions from your website
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => exportCSV(filteredLeads)}
              disabled={filteredLeads.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-6 py-5">
          {[
            {
              label: "Total Leads",
              value: stats.total,
              icon: Users,
              color: "text-gray-600",
              bg: "bg-gray-100",
            },
            {
              label: "New",
              value: stats.new,
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Contacted",
              value: stats.contacted,
              icon: Mail,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Won",
              value: stats.won,
              icon: CheckCircle,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Lost",
              value: stats.lost,
              icon: XCircle,
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <div className={cn("p-2 rounded-lg", bg)}>
                  <Icon size={15} className={color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
          {/* Form type */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Filter size={13} className="text-gray-400 shrink-0" />
            <select
              value={formTypeFilter}
              onChange={(e) => setFormTypeFilter(e.target.value)}
              className="bg-transparent text-sm text-gray-700 border-none outline-none cursor-pointer pr-4"
            >
              <option value="all">All Types</option>
              <option value="book-demo">Book Demo</option>
              <option value="contact">Contact Us</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Filter size={13} className="text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-gray-700 border-none outline-none cursor-pointer pr-4"
            >
              <option value="all">All Statuses</option>
              <option value="leads">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Calendar size={13} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-transparent text-sm text-gray-700 border-none outline-none [color-scheme:light] cursor-pointer"
            />
            <span className="text-gray-300">–</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-transparent text-sm text-gray-700 border-none outline-none [color-scheme:light] cursor-pointer"
            />
            {(dateStart || dateEnd) && (
              <button
                onClick={() => {
                  setDateStart("");
                  setDateEnd("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown size={13} />
            Date {sortDir === "desc" ? "↓" : "↑"}
          </button>

          {/* Clear all */}
          {(formTypeFilter !== "all" ||
            statusFilter !== "all" ||
            dateStart ||
            dateEnd) && (
            <button
              onClick={() => {
                setFormTypeFilter("all");
                setStatusFilter("all");
                setDateStart("");
                setDateEnd("");
              }}
              className="text-xs text-orange-500 hover:text-orange-600 underline-offset-2 hover:underline transition-colors"
            >
              Clear all filters
            </button>
          )}

          <div className="flex-1" />
          <p className="text-xs text-gray-400">
            {filteredLeads.length} of {leads.length} leads
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Budget / Revenue
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <Users size={36} className="text-gray-200" />
                          <p className="text-sm font-medium">No leads found</p>
                          <p className="text-xs">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                        onClick={() => setSelectedLead(lead)}
                      >
                        {/* Name + category */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">
                            {lead.name}
                          </p>
                          {lead.category && (
                            <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-50 text-orange-600">
                              {lead.category}
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          {(lead.workEmail || lead.email) && (
                            <p className="text-gray-500 text-xs truncate max-w-[200px]">
                              {lead.workEmail || lead.email}
                            </p>
                          )}
                          {lead.phoneNumber && (
                            <p className="text-gray-400 text-xs">
                              +91 {lead.phoneNumber}
                            </p>
                          )}
                          {lead.website && (
                            <a
                              href={
                                lead.website.startsWith("http")
                                  ? lead.website
                                  : `https://${lead.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-500 hover:text-orange-600 text-xs flex items-center gap-0.5 mt-0.5 w-fit"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={11} />
                              {lead.website
                                .replace(/^https?:\/\//, "")
                                .substring(0, 28)}
                            </a>
                          )}
                        </td>

                        {/* Form type */}
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border",
                              lead.formType === "book-demo"
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-blue-50 text-blue-600 border-blue-200",
                            )}
                          >
                            {lead.formType === "book-demo"
                              ? "Book Demo"
                              : "Contact"}
                          </span>
                        </td>

                        {/* Budget */}
                        <td className="px-5 py-4">
                          {lead.budget || lead.revenueRange ? (
                            <div className="flex items-center gap-1 text-gray-800 font-medium text-sm">
                              <DollarSign size={13} className="text-gray-400" />
                              {lead.budget || lead.revenueRange}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={lead.status || "leads"} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {fmtDate(lead.createdAt || lead.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Page {currentPage} of {totalPages} &nbsp;·&nbsp;{" "}
                  {filteredLeads.length} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronsLeft size={15} />
                  </button>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5 && currentPage > 3)
                      page = currentPage - 2 + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                          currentPage === page
                            ? "bg-orange-500 text-white"
                            : "text-gray-500 hover:bg-gray-100",
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronsRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};
