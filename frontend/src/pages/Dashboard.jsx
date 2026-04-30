import React, { useEffect, useMemo, useState } from "react";
import { Search, Download, Filter, Package, Container, BarChart3, FileSpreadsheet, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { fmt, fmtInt } from "@/lib/calc";
import { useAuth } from "@/context/AuthContext";
import { exportAllXlsx, exportBLXlsx, exportContainerXlsx } from "@/lib/excel";

const STATUS = {
  pending: { text: "Pending", cls: "badge-pending" },
  in_progress: { text: "In Progress", cls: "badge-progress" },
  completed: { text: "Complete", cls: "badge-complete" },
};
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border-2 ${s.cls}`}>
      {s.text}
    </span>
  );
}

function KpiChip({ label, value, color, testid, icon: Icon }) {
  return (
    <div className={`bg-white rounded-xl border ${color.border} p-4 sm:p-5 kpi-stripe`} data-testid={testid}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={`w-4 h-4 ${color.text}`} strokeWidth={2.5} />}
        <span className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold ${color.text}`}>{label}</span>
      </div>
      <div className={`font-mono text-2xl sm:text-3xl font-bold ${color.text}`}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ purchases: [], grand_totals: {}, countries: [] });
  const [filters, setFilters] = useState({ bl_search: "", country: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.bl_search) params.bl_search = filters.bl_search;
      if (filters.country && filters.country !== "ALL") params.country = filters.country;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const { data } = await api.get("/dashboard/summary", { params });
      setData(data);
    } catch (e) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const grand = data.grand_totals || {};

  const reset = () => {
    setFilters({ bl_search: "", country: "", date_from: "", date_to: "" });
    setTimeout(load, 50);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 mt-1">Reports & insights across your timber operations.</p>
        </div>
        <Button
          onClick={() => exportAllXlsx(data.purchases, user?.company_name)}
          disabled={!data.purchases?.length}
          data-testid="export-all-btn"
          className="h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
        >
          <FileSpreadsheet className="w-5 h-5 mr-2" /> Download All — Excel
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiChip label="Total BLs" value={fmtInt(grand.bls)} icon={Package}
          color={{ border: "border-slate-200", text: "text-slate-800" }} testid="kpi-bls" />
        <KpiChip label="Containers" value={fmtInt(grand.containers)} icon={Container}
          color={{ border: "border-slate-200", text: "text-slate-800" }} testid="kpi-containers" />
        <KpiChip label="Pieces" value={fmtInt(grand.pieces)} icon={BarChart3}
          color={{ border: "border-amber-200", text: "text-amber-700" }} testid="kpi-pieces" />
        <KpiChip label="CBM1" value={fmt(grand.cbm1)}
          color={{ border: "border-blue-200", text: "text-blue-700" }} testid="kpi-cbm1" />
        <KpiChip label="CFT1" value={fmt(grand.cft1)}
          color={{ border: "border-blue-200", text: "text-blue-700" }} testid="kpi-cft1" />
        <KpiChip label="CBM2" value={fmt(grand.cbm2)}
          color={{ border: "border-emerald-200", text: "text-emerald-700" }} testid="kpi-cbm2" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="text-sm uppercase tracking-wider font-bold text-slate-600">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              data-testid="filter-bl-search"
              value={filters.bl_search}
              onChange={(e) => setFilters({ ...filters, bl_search: e.target.value })}
              placeholder="Search BL..."
              className="h-12 border-2 pl-9"
            />
          </div>
          <Select value={filters.country || "ALL"} onValueChange={(v) => setFilters({ ...filters, country: v })}>
            <SelectTrigger data-testid="filter-country" className="h-12 border-2">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Countries</SelectItem>
              {data.countries?.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            data-testid="filter-date-from"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="h-12 border-2"
          />
          <Input
            type="date"
            data-testid="filter-date-to"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="h-12 border-2"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={load} className="h-11 bg-[#064E3B] hover:bg-[#047857] font-bold" data-testid="apply-filter-btn">
            Apply
          </Button>
          <Button onClick={reset} variant="outline" className="h-11 border-2" data-testid="reset-filter-btn">
            <X className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* BL grouped list */}
      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading...</div>
      ) : data.purchases.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
          <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-800">No data yet</h3>
          <p className="text-slate-500 mt-1">Add purchases and measurements to populate the dashboard.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.purchases.map((p) => {
            const isOpen = !!expanded[p.id];
            const t = p.totals || {};
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid={`bl-card-${p.bl_number}`}>
                <div className="p-4 sm:p-5 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-lg font-bold">{p.bl_number}</span>
                      <span className="text-slate-500 text-sm">·</span>
                      <span className="text-sm text-slate-700 truncate">{p.supplier_name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono">{p.country}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-mono text-slate-600">{p.bl_date}</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                      {[
                        { l: "Pcs", v: fmtInt(t.pieces), c: "text-amber-700" },
                        { l: "CBM1", v: fmt(t.cbm1), c: "text-blue-700" },
                        { l: "CFT1", v: fmt(t.cft1), c: "text-blue-700" },
                        { l: "CBM2", v: fmt(t.cbm2), c: "text-emerald-700" },
                        { l: "CFT2", v: fmt(t.cft2), c: "text-emerald-700" },
                      ].map((x) => (
                        <div key={x.l}>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{x.l}</div>
                          <div className={`font-mono font-bold ${x.c}`}>{x.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportBLXlsx(p, user?.company_name)}
                      className="h-10 border-2"
                      data-testid={`export-bl-${p.bl_number}`}
                    >
                      <Download className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Export BL</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded({ ...expanded, [p.id]: !isOpen })}
                      data-testid={`toggle-bl-${p.bl_number}`}
                      className="h-10"
                    >
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 space-y-2">
                    {(p.containers || []).map((c) => {
                      const ct = c.totals || {};
                      return (
                        <div key={c.id} className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap" data-testid={`container-row-${c.container_number}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center font-mono font-bold text-sm">
                              #{c.sr_no}
                            </div>
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-base truncate">{c.container_number}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <StatusBadge status={c.status} />
                                <span className="text-xs text-slate-500 font-mono">{c.pieces || 0} pcs</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs flex-1 min-w-0">
                            <div><div className="text-[10px] uppercase text-slate-500 font-bold">CBM1</div><div className="font-mono text-blue-700 font-bold">{fmt(ct.cbm1)}</div></div>
                            <div><div className="text-[10px] uppercase text-slate-500 font-bold">CFT1</div><div className="font-mono text-blue-700 font-bold">{fmt(ct.cft1)}</div></div>
                            <div><div className="text-[10px] uppercase text-slate-500 font-bold">CBM2</div><div className="font-mono text-emerald-700 font-bold">{fmt(ct.cbm2)}</div></div>
                            <div><div className="text-[10px] uppercase text-slate-500 font-bold">CFT2</div><div className="font-mono text-emerald-700 font-bold">{fmt(ct.cft2)}</div></div>
                            <div><div className="text-[10px] uppercase text-slate-500 font-bold">Avg G1/G2</div><div className="font-mono font-bold">{fmt(ct.avg_g1, 1)} / {fmt(ct.avg_g2, 1)}</div></div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportContainerXlsx(p, c, user?.company_name)}
                            className="h-9"
                            data-testid={`export-container-${c.container_number}`}
                          >
                            <Download className="w-4 h-4 mr-1" /> Excel
                          </Button>
                        </div>
                      );
                    })}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 grid grid-cols-3 sm:grid-cols-6 gap-3">
                      <div className="col-span-3 sm:col-span-1 text-amber-800 font-bold uppercase text-xs tracking-wider">BL Subtotal</div>
                      <div><div className="text-[10px] uppercase text-amber-800 font-bold">Pcs</div><div className="font-mono font-bold text-amber-900">{fmtInt(t.pieces)}</div></div>
                      <div><div className="text-[10px] uppercase text-amber-800 font-bold">CBM1</div><div className="font-mono font-bold text-amber-900">{fmt(t.cbm1)}</div></div>
                      <div><div className="text-[10px] uppercase text-amber-800 font-bold">CFT1</div><div className="font-mono font-bold text-amber-900">{fmt(t.cft1)}</div></div>
                      <div><div className="text-[10px] uppercase text-amber-800 font-bold">CBM2</div><div className="font-mono font-bold text-amber-900">{fmt(t.cbm2)}</div></div>
                      <div><div className="text-[10px] uppercase text-amber-800 font-bold">CFT2</div><div className="font-mono font-bold text-amber-900">{fmt(t.cft2)}</div></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand totals */}
          <div className="bg-emerald-900 text-white rounded-xl p-4 sm:p-5 grid grid-cols-3 sm:grid-cols-6 gap-3 shadow-md">
            <div className="col-span-3 sm:col-span-1 font-bold uppercase text-xs tracking-wider text-emerald-200">Grand Total</div>
            <div><div className="text-[10px] uppercase text-emerald-200 font-bold">Pcs</div><div className="font-mono font-bold">{fmtInt(grand.pieces)}</div></div>
            <div><div className="text-[10px] uppercase text-emerald-200 font-bold">CBM1</div><div className="font-mono font-bold">{fmt(grand.cbm1)}</div></div>
            <div><div className="text-[10px] uppercase text-emerald-200 font-bold">CFT1</div><div className="font-mono font-bold">{fmt(grand.cft1)}</div></div>
            <div><div className="text-[10px] uppercase text-emerald-200 font-bold">CBM2</div><div className="font-mono font-bold">{fmt(grand.cbm2)}</div></div>
            <div><div className="text-[10px] uppercase text-emerald-200 font-bold">CFT2</div><div className="font-mono font-bold">{fmt(grand.cft2)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
