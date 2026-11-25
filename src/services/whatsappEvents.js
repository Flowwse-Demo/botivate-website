// WhatsApp business-event dispatchers.
// Looks up the recipient's phone in `users.phone` (Settings > Add User / Add Company),
// builds the template variables and sends. EVERY exported function is fire-and-forget:
// it never throws and never blocks the DB flow that called it.
import supabase from "../supabaseClient";
import {
  notify,
  sendOrderReceivedNotification,
  sendChecklistReminderNotification,
  sendTaskDelegationNotification,
} from "./whatsappService";

const fmtDate = (d) => {
  if (!d) return "-";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString("en-GB");
};

const userById = async (id) => {
  if (!id) return null;
  const { data } = await supabase.from("users").select("id, name, username, phone").eq("id", Number(id)).maybeSingle();
  return data || null;
};

const userByName = async (name) => {
  const n = String(name || "").trim();
  if (!n) return null;
  const { data } = await supabase
    .from("users")
    .select("id, name, username, phone")
    .or(`name.ilike.${n.replace(/[,()]/g, " ")},username.ilike.${n.replace(/[,()]/g, " ")}`)
    .limit(1);
  return data?.[0] || null;
};

const companyByName = async (name) => {
  const n = String(name || "").trim();
  if (!n) return null;
  const safe = n.replace(/[,()]/g, " ");
  const { data } = await supabase
    .from("users")
    .select("id, name, username, password, phone, company_name, role")
    .eq("role", "company")
    .or(`company_name.ilike.${safe},name.ilike.${safe}`)
    .limit(1);
  return data?.[0] || null;
};

const run = (fn) =>
  notify(
    (async () => {
      try {
        await fn();
      } catch (e) {
        console.warn("[WhatsApp] event skipped:", e?.message || e);
      }
    })()
  );

const skipNoPhone = (user, what) => {
  if (!user?.phone) {
    console.warn(`[WhatsApp] ${what}: no phone saved for ${user?.name || user?.username || "recipient"} (Settings > edit user)`);
    return true;
  }
  return false;
};

/** Order received -> client (company whose name matches party_name). */
export const notifyOrderReceived = (order) =>
  run(async () => {
    const c = await companyByName(order?.party_name);
    if (skipNoPhone(c, "order received")) return;
    await sendOrderReceivedNotification({
      clientPhone: c.phone,
      clientName: c.name || c.company_name || order.party_name,
      typeOfWork: order?.type_of_work || "-",
      paymentType: order?.payment_type || "-",
      quotationNo: order?.quotation_number || "-",
      loginId: c.username || "-",
      password: c.password || "-",
    });
  });

/** Checklist task assigned -> doer (matched by name). */
export const notifyChecklistAssigned = (task) =>
  run(async () => {
    const [u, by] = await Promise.all([userByName(task?.name), userById(task?.assigned_by)]);
    if (skipNoPhone(u, "checklist")) return;
    await sendChecklistReminderNotification({
      employeePhone: u.phone,
      employeeName: u.name || u.username,
      assignedBy: task?.assigned_by_name || by?.name || "Admin",
      taskName: task?.task_name,
      details: task?.description || "-",
      days: Array.isArray(task?.days) ? task.days.join(", ") : "-",
      dueTime: task?.task_time || "-",
    });
  });

/** Delegation task assigned -> doer. */
export const notifyDelegation = (task) =>
  run(async () => {
    const [to, by] = await Promise.all([userById(task?.assigned_to), userById(task?.assigned_by)]);
    if (skipNoPhone(to, "delegation")) return;
    await sendTaskDelegationNotification({
      delegatedToPhone: to.phone,
      delegatedToName: to.name || to.username,
      delegatedByName: by?.name || by?.username || "Admin",
      taskDetails: task?.task_details,
      targetDate: fmtDate(task?.target_date),
      targetTime: task?.target_time || "-",
    });
  });
