import React, { useEffect, useState } from "react";
import { Plus, Package, Pencil, Trash2, X, ChevronRight, Calendar, Building2, Globe2, FileText, Container } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";

const COUNTRIES = [
  "Cameroon", "Gabon", "Congo", "Ghana", "Nigeria", "Liberia",
  "Equatorial Guinea", "Ivory Coast", "Mozambique", "Tanzania",
  "Myanmar", "Malaysia", "Indonesia", "Brazil", "Other",
];

const STATUS_LABEL = {
  pending: { text: "Pending", cls: "badge-pending", dot: "bg-slate-400" },
  in_progress: { text: "In Progress", cls: "badge-progress", dot: "bg-blue-500" },
  completed: { text: "Complete", cls: "badge-complete", dot: "bg-emerald-600" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || STATUS_LABEL.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border-2 ${s.cls}`}
      data-testid={`status-${status}`}
    >
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  );
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function PurchaseDialog({ open, onOpenChange, editing, onSaved }) {
  const [form, setForm] = useState({
    bl_number: "", bl_date: todayISO(), supplier_name: "",
    country: "Cameroon", remarks: "",
  });
  const [containers, setContainers] = useState([{ container_number: "" }]);
  const [newContainers, setNewContainers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [customCountry, setCustomCountry] = useState("");
  const isEdit = !!editing;

  useEffect(() => {
    if (editing) {
      setForm({
        bl_number: editing.bl_number || "",
        bl_date: editing.bl_date || todayISO(),
        supplier_name: editing.supplier_name || "",
        country: editing.country || "Cameroon",
        remarks: editing.remarks || "",
      });
      setContainers(editing.containers || []);
      setNewContainers([]);
    } else if (open) {
      setForm({ bl_number: "", bl_date: todayISO(), supplier_name: "", country: "Cameroon", remarks: "" });
      setContainers([{ container_number: "" }]);
      setNewContainers([]);
    }
  }, [editing, open]);

  const updateContainer = (idx, val, isNew = false) => {
    if (isNew) {
      setNewContainers((arr) => arr.map((c, i) => (i === idx ? { ...c, container_number: val } : c)));
    } else {
      setContainers((arr) => arr.map((c, i) => (i === idx ? { ...c, container_number: val } : c)));
    }
  };

  const submit = async () => {
    const country = form.country === "Other" ? customCountry.trim() : form.country;
    if (!form.bl_number.trim()) return toast.error("BL Number required");
    if (!form.bl_date) return toast.error("BL Date required");
    if (!form.supplier_name.trim()) return toast.error("Supplier required");
    if (!country) return toast.error("Country required");
    setSaving(true);
    try {
      if (isEdit) {
        const cleanNew = newContainers.filter((c) => c.container_number.trim()).map((c) => ({ container_number: c.container_number.trim() }));
        await api.patch(`/purchases/${editing.id}`, { ...form, country, new_containers: cleanNew });
      } else {
        const cleanContainers = containers.filter((c) => c.container_number.trim()).map((c) => ({ container_number: c.container_number.trim() }));
        if (cleanContainers.length === 0) return toast.error("At least one container required");
        await api.post("/purchases", { ...form, country, containers: cleanContainers });
      }
      toast.success(isEdit ? "Purchase updated" : "Purchase saved");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(formatErr(e?.response?.data?.detail) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="purchase-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEdit ? "Edit Purchase" : "New Purchase (BL)"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm uppercase tracking-wider font-semibold">BL Number</Label>
              <Input
                data-testid="bl-number-input"
                value={form.bl_number}
                onChange={(e) => setForm({ ...form, bl_number: e.target.value })}
                placeholder="MSCU-2025-001"
                className="h-12 border-2 text-base font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm uppercase tracking-wider font-semibold">BL Date</Label>
              <Input
                type="date"
                data-testid="bl-date-input"
                value={form.bl_date}
                onChange={(e) => setForm({ ...form, bl_date: e.target.value })}
                className="h-12 border-2 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm uppercase tracking-wider font-semibold">Supplier</Label>
              <Input
                data-testid="supplier-input"
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                placeholder="e.g. Africa Forestry Co"
                className="h-12 border-2 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm uppercase tracking-wider font-semibold">Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger data-testid="country-select" className="h-12 border-2 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c} data-testid={`country-${c}`}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.country === "Other" && (
                <Input
                  placeholder="Custom country"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  className="h-12 border-2 mt-2"
                  data-testid="custom-country-input"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm uppercase tracking-wider font-semibold">Remarks (optional)</Label>
            <Textarea
              data-testid="remarks-input"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Notes..."
              className="border-2"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Container className="w-5 h-5 text-emerald-800" />
                Containers
              </h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => (isEdit ? setNewContainers([...newContainers, { container_number: "" }]) : setContainers([...containers, { container_number: "" }]))}
                data-testid="add-container-row"
                className="h-10 border-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add row
              </Button>
            </div>

            {/* Existing containers (edit mode read-only with measurement check) */}
            {isEdit && (containers || []).map((c, idx) => (
              <div key={c.id || idx} className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center font-mono font-bold text-sm">
                  {c.sr_no ?? idx + 1}
                </div>
                <Input
                  value={c.container_number}
                  disabled
                  className="h-12 border-2 font-mono text-base bg-slate-50"
                  data-testid={`existing-container-${idx}`}
                />
                <span className="text-xs text-slate-500 px-2 whitespace-nowrap">
                  {c.log_count ?? 0} logs
                </span>
              </div>
            ))}

            {/* New rows */}
            {(isEdit ? newContainers : containers).map((c, idx) => (
              <div key={`new-${idx}`} className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center font-mono font-bold text-sm">
                  {isEdit ? (containers.length + idx + 1) : idx + 1}
                </div>
                <Input
                  value={c.container_number}
                  onChange={(e) => updateContainer(idx, e.target.value, isEdit)}
                  placeholder="MSCU1234567"
                  className="h-12 border-2 font-mono text-base"
                  data-testid={`container-input-${idx}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    if (isEdit) setNewContainers(newContainers.filter((_, i) => i !== idx));
                    else if (containers.length > 1) setContainers(containers.filter((_, i) => i !== idx));
                  }}
                  data-testid={`remove-container-${idx}`}
                >
                  <X className="w-5 h-5 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 border-2" data-testid="cancel-purchase">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="h-12 bg-[#064E3B] hover:bg-[#047857] font-bold"
            data-testid="save-purchase"
          >
            {saving ? "Saving..." : isEdit ? "Update Purchase" : "Save Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Purchases() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/purchases");
      setItems(data);
    } catch (e) {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (p) => {
    try {
      await api.delete(`/purchases/${p.id}`);
      toast.success("Purchase deleted");
      load();
    } catch (e) {
      toast.error(formatErr(e?.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Purchases</h1>
          <p className="text-slate-600 mt-1">Bills of Lading & containers</p>
        </div>
      </div>

      <Button
        onClick={() => { setEditing(null); setOpen(true); }}
        data-testid="add-purchase-btn"
        className="w-full h-16 text-lg rounded-xl bg-[#064E3B] hover:bg-[#047857] text-white font-bold shadow-sm"
      >
        <Plus className="w-6 h-6 mr-2" strokeWidth={3} /> Add New Purchase
      </Button>

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-800">No purchases yet</h3>
          <p className="text-slate-500 mt-1">Tap "Add New Purchase" to record your first BL.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              data-testid={`purchase-card-${p.bl_number}`}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-lg sm:text-xl font-bold text-slate-900">{p.bl_number}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-xs uppercase text-slate-500 tracking-wider">Date</div>
                          <div className="font-mono font-semibold">{p.bl_date}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-xs uppercase text-slate-500 tracking-wider">Supplier</div>
                          <div className="font-semibold truncate">{p.supplier_name}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Globe2 className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-xs uppercase text-slate-500 tracking-wider">Country</div>
                          <div className="font-semibold">{p.country}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Container className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <div className="text-xs uppercase text-slate-500 tracking-wider">Containers</div>
                          <div className="font-mono font-bold text-emerald-800">
                            {p.completed_containers}/{p.total_containers} done
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 border-2"
                      onClick={() => { setEditing(p); setOpen(true); }}
                      data-testid={`edit-purchase-${p.bl_number}`}
                    >
                      <Pencil className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 border-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                          data-testid={`delete-purchase-${p.bl_number}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove BL {p.bl_number}, all its containers and measurements.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => onDelete(p)}
                            data-testid={`confirm-delete-${p.bl_number}`}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {p.containers?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {p.containers.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
                          data-testid={`container-chip-${c.container_number}`}
                        >
                          <span className="font-mono text-xs font-bold text-slate-500">#{c.sr_no}</span>
                          <span className="font-mono text-sm font-semibold">{c.container_number}</span>
                          <StatusBadge status={c.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {p.remarks && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 mt-0.5" />
                    <p>{p.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PurchaseDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSaved={load}
      />
    </div>
  );
}
