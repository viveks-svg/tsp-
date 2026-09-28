"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Mail, RefreshCw, ShieldAlert, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge } from "@/features/admin/components/records";
import { formatDateTime } from "@/features/admin/lib/format";

type StaffRole = "SUPER_ADMIN" | "MANAGER" | "SUPPORT" | "CONTENT";

interface Team {
  members: {
    id: string;
    name: string | null;
    email: string | null;
    staffRole: StaffRole | null;
    createdAt: string;
    lastActiveAt: string | null;
    twoStepEnabled: boolean;
  }[];
  invites: {
    id: string;
    email: string;
    name: string | null;
    staffRole: StaffRole;
    expiresAt: string;
    createdAt: string;
    expired: boolean;
    invitedBy: string | null;
  }[];
  roles: { role: StaffRole; label: string; permissions: string[] }[];
}

interface InviteResult {
  email: string;
  link: string;
  emailed: boolean;
  expiresAt: string;
}

/** Plain-language names for what each permission opens. */
const PERMISSION_LABEL: Record<string, string> = {
  "overview.view": "Overview",
  "clients.view": "Clients",
  "bookings.view": "Bookings",
  "consultations.view": "Consultations & reviews",
  "payments.view": "Payments",
  "payments.refund": "Refunds",
  "wallet.adjust": "Wallet adjustments",
  "orders.manage": "Shop orders",
  "leads.manage": "Booking leads",
  "campaigns.manage": "Campaigns",
  "content.manage": "Blog & promo popups",
  "notifications.send": "Announcements",
  "payouts.manage": "Payouts",
  "money.approve": "Approving money requests",
  "settings.manage": "Settings",
  "schedule.manage": "Consultation hours",
  "queue.manage": "Live queue",
  "astrologers.manage": "Astrologers",
  "team.manage": "Team & roles",
  "reports.view": "Reports",
  "audit.view": "Activity log",
};

const ROLE_SUMMARY: Record<StaffRole, string> = {
  SUPER_ADMIN: "Everything, including the team, settings, the activity log and approving large money requests.",
  MANAGER: "Runs the house day to day, with reports. Refunds, wallet changes and payouts up to the approval limit in total per client or order within 24 hours; not the team, settings or activity log.",
  SUPPORT: "Looks after clients: clients, bookings, consultations, leads, shop orders and the live queue.",
  CONTENT: "Campaigns, the blog, promo popups and announcements to clients.",
};

export default function TeamPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [inviting, setInviting] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiClient
      .get<Team>("/admin/team")
      .then(setTeam)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load the team"));
  }, []);
  useEffect(load, [load]);

  const act = async (key: string, fn: () => Promise<Team | InviteResult>, done?: string) => {
    setBusy(key);
    try {
      const r = await fn();
      if ("members" in r) setTeam(r);
      else {
        setResult(r);
        load();
      }
      if (done) toast.success(done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const changeRole = (id: string, staffRole: StaffRole) =>
    act(`role-${id}`, () => apiClient.patch<Team>(`/admin/team/${id}`, { staffRole }), "Role updated.");
  const remove = (id: string, name: string) =>
    confirm(`Remove ${name} from the team? They lose admin access and are signed out.`) &&
    act(`remove-${id}`, () => apiClient.delete<Team>(`/admin/team/${id}`), "Removed from the team.");
  const resetTwoStep = (id: string, name: string) =>
    confirm(`Reset ${name}'s two-step verification? Use this when they've lost their phone — they set it up again at next sign-in.`) &&
    act(`2fa-${id}`, async () => {
      await apiClient.post(`/admin/team/${id}/reset-two-step`, {});
      return apiClient.get<Team>("/admin/team");
    }, "Two-step verification reset.");
  const resend = (id: string) => act(`resend-${id}`, () => apiClient.post<InviteResult>(`/admin/team/invites/${id}/resend`));
  const cancel = (id: string) => act(`cancel-${id}`, () => apiClient.delete<Team>(`/admin/team/invites/${id}`), "Invitation cancelled.");

  const roleLabel = (r: StaffRole | null) => team?.roles.find((x) => x.role === r)?.label ?? "No role";

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Who can use the admin panel, and what each person can do. Astrologers are managed separately and never have admin access."
        actions={
          <button
            onClick={() => setInviting(true)}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2"
          >
            <UserPlus className="h-4 w-4" /> Invite teammate
          </button>
        }
      />

      {!team ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Panel title="Members" subtitle={`${team.members.length} with admin access`} bodyClassName="px-0 pb-2 md:px-0">
              <ul className="divide-y divide-hairline">
                {team.members.map((m) => {
                  const self = m.id === user?.id;
                  return (
                    <li key={m.id} className="flex flex-wrap items-center gap-4 px-6 py-4 md:px-7">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">
                          {m.name || m.email} {self && <span className="text-[12px] font-normal text-ink-3">(you)</span>}
                        </p>
                        <p className="truncate text-[13px] text-ink-3">
                          {m.email}
                          {m.lastActiveAt ? ` · active ${formatDateTime(m.lastActiveAt)}` : ""}
                        </p>
                      </div>
                      {m.twoStepEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-emerald-deep" title="Two-step verification is on">
                          <ShieldCheck className="h-4 w-4" /> Two-step
                          {!self && (
                            <button
                              onClick={() => resetTwoStep(m.id, m.name || m.email || "this person")}
                              disabled={!!busy}
                              className="ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-3 underline-offset-2 hover:text-ink hover:underline"
                            >
                              reset
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="text-[12px] text-ink-3" title="Two-step verification is off">
                          No two-step
                        </span>
                      )}
                      {self ? (
                        <Badge tone="info">{roleLabel(m.staffRole)}</Badge>
                      ) : (
                        <>
                          <select
                            aria-label={`Role for ${m.name || m.email}`}
                            value={m.staffRole ?? ""}
                            disabled={!!busy}
                            onChange={(e) => changeRole(m.id, e.target.value as StaffRole)}
                            className="rounded-xl border border-hairline bg-ivory px-3 py-2 text-[13px] text-ink outline-none focus:border-champagne"
                          >
                            {team.roles.map((r) => (
                              <option key={r.role} value={r.role}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => remove(m.id, m.name || m.email || "this person")}
                            disabled={!!busy}
                            aria-label="Remove from team"
                            title="Remove from team"
                            className="rounded-lg p-2 text-ink-3 transition hover:bg-garnet/10 hover:text-garnet disabled:opacity-40"
                          >
                            {busy === `remove-${m.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="Invitations" subtitle="Waiting to be accepted" bodyClassName="px-0 pb-2 md:px-0">
              {team.invites.length === 0 ? (
                <p className="px-6 pb-4 text-[14px] text-ink-3 md:px-7">No pending invitations.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {team.invites.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center gap-4 px-6 py-4 md:px-7">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{i.name || i.email}</p>
                        <p className="truncate text-[13px] text-ink-3">
                          {i.name ? `${i.email} · ` : ""}
                          {roleLabel(i.staffRole)} · invited{i.invitedBy ? ` by ${i.invitedBy}` : ""} {formatDateTime(i.createdAt)}
                        </p>
                      </div>
                      {i.expired ? <Badge tone="bad">Expired</Badge> : <Badge tone="waiting">Until {formatDateTime(i.expiresAt)}</Badge>}
                      <button
                        onClick={() => resend(i.id)}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3 py-1.5 text-[12px] font-medium text-ink-2 transition hover:border-champagne disabled:opacity-40"
                      >
                        {busy === `resend-${i.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} New link
                      </button>
                      <button
                        onClick={() => cancel(i.id)}
                        disabled={!!busy}
                        aria-label="Cancel invitation"
                        title="Cancel invitation"
                        className="rounded-lg p-2 text-ink-3 transition hover:bg-garnet/10 hover:text-garnet disabled:opacity-40"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Roles" subtitle="What each role opens">
            <ul className="space-y-5">
              {team.roles.map((r) => (
                <li key={r.role} className="space-y-1.5">
                  <p className="font-playfair text-[17px] font-semibold text-ink">{r.label}</p>
                  <p className="text-[13px] text-ink-2">{ROLE_SUMMARY[r.role]}</p>
                  <p className="text-[12px] leading-relaxed text-ink-3">{r.permissions.map((p) => PERMISSION_LABEL[p] ?? p).join(" · ")}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      {inviting && team && (
        <InviteDialog
          roles={team.roles}
          onClose={() => setInviting(false)}
          onInvited={(r) => {
            setInviting(false);
            setResult(r);
            load();
          }}
        />
      )}
      {result && <InviteResultDialog r={result} onClose={() => setResult(null)} />}
    </div>
  );
}

// ── Dialogs ───────────────────────────────────────────────────────────────────

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/50 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-hairline bg-ivory shadow-[0_30px_80px_-20px_rgba(11,18,51,0.5)] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 className="font-playfair text-xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink-3 hover:bg-parchment hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-5 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

function InviteDialog({ roles, onClose, onInvited }: { roles: Team["roles"]; onClose: () => void; onInvited: (r: InviteResult) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("SUPPORT");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      onInvited(await apiClient.post<InviteResult>("/admin/team/invites", { email, ...(name && { name }), staffRole: role }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the invitation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog title="Invite a teammate" onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-[13px] font-medium text-ink-2">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className="block text-[13px] font-medium text-ink-2">Name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-[13px] font-medium text-ink-2">Role</legend>
        {roles.map((r) => (
          <label
            key={r.role}
            className={cn(
              "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition",
              role === r.role ? "border-champagne bg-champagne/10" : "border-hairline bg-ivory hover:border-champagne/60",
            )}
          >
            <input type="radio" name="role" checked={role === r.role} onChange={() => setRole(r.role)} className="mt-1 accent-[#0B1233]" />
            <span>
              <span className="block text-[14px] font-medium text-ink">{r.label}</span>
              <span className="block text-[12px] text-ink-3">{ROLE_SUMMARY[r.role]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne">
          Cancel
        </button>
        <button
          onClick={send}
          disabled={busy || !/\S+@\S+\.\S+/.test(email)}
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send invitation
        </button>
      </div>
    </Dialog>
  );
}

function InviteResultDialog({ r, onClose }: { r: InviteResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(r.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog title="Invitation ready" onClose={onClose}>
      <p className={cn("flex gap-2 text-[14px]", r.emailed ? "text-ink-2" : "text-garnet")}>
        {r.emailed ? <Mail className="mt-0.5 h-4 w-4 shrink-0 text-bronze" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
        {r.emailed
          ? `An invitation email is on its way to ${r.email}.`
          : `The email to ${r.email} could not be sent — share the link below with them directly.`}
      </p>
      <div className="space-y-2">
        <p className="text-[12px] text-ink-3">Invitation link · valid until {formatDateTime(r.expiresAt)}</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-hairline bg-parchment px-3 py-2 text-[12px] text-ink">{r.link}</code>
          <button onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-2 text-[12px] font-medium text-ink-2 hover:border-champagne">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[12px] text-ink-3">Anyone with this link can join with this role, so share it only with them.</p>
      </div>
      <div className="flex justify-end">
        <button onClick={onClose} className="rounded-full bg-midnight px-5 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2">
          Done
        </button>
      </div>
    </Dialog>
  );
}
