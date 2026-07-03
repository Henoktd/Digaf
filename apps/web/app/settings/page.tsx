"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useRole } from "@/src/lib/useRole";
import { fetchEntities, updateEntityCapitals } from "@/src/lib/api";
import { PageContainer } from "@/src/components/PageContainer";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { fieldClass, labelClass } from "@/src/components/ui/field";

const ROLE_LABELS: Record<string, string> = {
  governance_admin: "Governance Admin",
  maker: "Maker",
  checker_1: "Checker 1",
  checker_2: "Checker 2",
  compliance_officer: "Compliance Officer",
  viewer: "Viewer",
};

export default function SettingsPage() {
  const { role, isLoading } = useRole();

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [entityId, setEntityId] = useState<string | null>(null);
  const [authCap, setAuthCap] = useState("");
  const [subCap, setSubCap] = useState("");
  const [paidCap, setPaidCap] = useState("");
  const [parVal, setParVal] = useState("");
  const [city, setCity] = useState("");
  const [wereda, setWereda] = useState("");
  const [kk, setKk] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [poBox, setPoBox] = useState("");
  const [capsLoading, setCapsLoading] = useState(false);
  const [capsSaving, setCapsSaving] = useState(false);

  useEffect(() => {
    if (role !== "governance_admin") return;
    async function loadEntity() {
      setCapsLoading(true);
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const result = await fetchEntities(token);
        const entity = result?.data?.[0];
        if (entity) {
          setEntityId(entity.entity_id);
          setAuthCap(entity.authorized_capital ?? "");
          setSubCap(entity.subscribed_capital ?? "");
          setPaidCap(entity.paid_up_capital ?? "");
          setParVal(entity.default_par_value ?? "");
          setCity(entity.head_office_city ?? "");
          setWereda(entity.head_office_wereda ?? "");
          setKk(entity.head_office_kk ?? "");
          setHouseNo(entity.head_office_house_no ?? "");
          setPoBox(entity.head_office_po_box ?? "");
        }
      } catch {
        // Non-fatal
      } finally {
        setCapsLoading(false);
      }
    }
    loadEntity();
  }, [role]);

  async function handleSaveCapitals(e: React.FormEvent) {
    e.preventDefault();
    if (!entityId) return;
    setCapsSaving(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await updateEntityCapitals(
        entityId,
        {
          authorized_capital: authCap ? Number(authCap) : null,
          subscribed_capital: subCap ? Number(subCap) : null,
          paid_up_capital: paidCap ? Number(paidCap) : null,
          default_par_value: parVal ? Number(parVal) : null,
          head_office_city: city || null,
          head_office_wereda: wereda || null,
          head_office_kk: kk || null,
          head_office_house_no: houseNo || null,
          head_office_po_box: poBox || null,
        },
        token
      );
      showToast("Entity settings saved. Certificates will use these values.", true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", false);
    } finally {
      setCapsSaving(false);
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== confirm) { showToast("Passwords do not match", false); return; }
    if (newPass.length < 8) { showToast("Password must be at least 8 characters", false); return; }

    setLoading(true);
    try {
      const supabase = createClient();

      // Re-authenticate with current password to verify identity before changing
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) throw new Error("No active session");

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInError) throw new Error("Current password is incorrect");

      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      showToast("Password changed successfully.", true);
      setCurrent("");
      setNewPass("");
      setConfirm("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to change password", false);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-sm text-slate-500">Loading…</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          variant="page"
          title="Account Settings"
          description="Manage your own account credentials and view your assigned role."
        />

        {toast && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {toast.msg}
          </div>
        )}

        {/* Role info */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Your Role</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {role?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {role ? (ROLE_LABELS[role] ?? role.replace(/_/g, " ")) : "No role assigned"}
              </p>
              <p className="text-xs text-slate-500">Contact a Governance Admin to change your role.</p>
            </div>
          </div>
        </section>

        {/* Entity capital settings — governance_admin only */}
        {role === "governance_admin" && (
          <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Entity Settings</h2>
            <p className="mb-5 text-xs text-slate-500">
              Capital figures and address appear on every new share certificate. Update them whenever the entity&apos;s details change.
            </p>
            {capsLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : (
              <form onSubmit={handleSaveCapitals} className="space-y-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Capital Structure</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label htmlFor="entity-auth-cap" className={labelClass}>Authorized Capital (Birr)</label>
                      <input
                        id="entity-auth-cap"
                        type="number" min="0" step="0.01"
                        value={authCap}
                        onChange={(e) => setAuthCap(e.target.value)}
                        placeholder="e.g. 12000000"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-sub-cap" className={labelClass}>Subscribed Capital (Birr)</label>
                      <input
                        id="entity-sub-cap"
                        type="number" min="0" step="0.01"
                        value={subCap}
                        onChange={(e) => setSubCap(e.target.value)}
                        placeholder="e.g. 23000000"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-paid-cap" className={labelClass}>Paid-up Capital (Birr)</label>
                      <input
                        id="entity-paid-cap"
                        type="number" min="0" step="0.01"
                        value={paidCap}
                        onChange={(e) => setPaidCap(e.target.value)}
                        placeholder="e.g. 33000000"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-par-val" className={labelClass}>Default Par Value (Birr)</label>
                      <input
                        id="entity-par-val"
                        type="number" min="0" step="0.01"
                        value={parVal}
                        onChange={(e) => setParVal(e.target.value)}
                        placeholder="e.g. 22"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Head Office Address</p>
                  <p className="mb-3 text-xs text-slate-500">Appears on share certificates under the company name.</p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label htmlFor="entity-city" className={labelClass}>ከተማ / City</label>
                      <input
                        id="entity-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Addis Ababa"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-subcity" className={labelClass}>ክፍለ ከተማ / Sub-City</label>
                      <input
                        id="entity-subcity"
                        type="text"
                        value={kk}
                        onChange={(e) => setKk(e.target.value)}
                        placeholder="e.g. Gulele"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-wereda" className={labelClass}>ወረዳ / Wereda</label>
                      <input
                        id="entity-wereda"
                        type="text"
                        value={wereda}
                        onChange={(e) => setWereda(e.target.value)}
                        placeholder="e.g. 09"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-house-no" className={labelClass}>የቤት ቁጥር / House No.</label>
                      <input
                        id="entity-house-no"
                        type="text"
                        value={houseNo}
                        onChange={(e) => setHouseNo(e.target.value)}
                        placeholder="e.g. 157"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="entity-po-box" className={labelClass}>ፖ.ሣ.ቁ / P.O.Box</label>
                      <input
                        id="entity-po-box"
                        type="text"
                        value={poBox}
                        onChange={(e) => setPoBox(e.target.value)}
                        placeholder="e.g. 5678"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Button type="submit" disabled={capsSaving}>
                    {capsSaving ? "Saving…" : "Save Entity Settings"}
                  </Button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Change password */}
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Change Password</h2>
          <p className="mb-5 text-xs text-slate-500">Your new password must be at least 8 characters.</p>

          <form onSubmit={handleChangePassword} className="max-w-sm space-y-4">
            <div>
              <label htmlFor="pw-current" className={labelClass}>Current password</label>
              <input
                id="pw-current"
                type="password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="pw-new" className={labelClass}>New password</label>
              <input
                id="pw-new"
                type="password"
                required
                minLength={8}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="pw-confirm" className={labelClass}>Confirm new password</label>
              <input
                id="pw-confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={fieldClass}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Change Password"}
            </Button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
