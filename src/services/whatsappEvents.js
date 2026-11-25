// WhatsApp business-event dispatchers.
// Looks up the recipient's phone in `users.phone` (Settings > Add User / Add Company),
// builds the template variables and sends. EVERY exported function is fire-and-forget:
// it never throws and never blocks the DB flow that called it.
import supabase from "../supabaseClient";
import {
  notify,
  sendOrderReceivedNotification,
  sendTaskAssignmentNotification,
  sendTesterAssignmentNotification,
  sendApprovalForDeliveryNotification,
  sendNewSystemApprovalRequest,
  sendNewSystemConfirmedNotification,
  sendTaskDelegationNotification,
  sendChecklistReminderNotification,
} from "./whatsappService";

const origin = () => (typeof window !== "undefined" ? window.location.origin : "https://botivate.in");
const fmtDate = (d) => {
  if (!d) return "-";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleDateString("en-GB");
};

const userById = async (id) => {
  if (!id) return null;
  const { data } = await supabase.from("users").select("id, name, username, phone, company_name, role").eq("id", Number(id)).maybeSingle();
  return data || null;
};

const userByName = async (name) => {
  const n = String(name || "").trim();
  if (!n) return null;
  const { data } = await supabase
    .from("users")
    .select("id, name, username, phone, company_name, role")
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

/** Event 2: a task (user_tasks / task_subtasks row) was assigned to `memberId`. */
export const notifyTaskAssigned = (task, memberId) =>
  run(async () => {
    const u = await userById(memberId);
    if (skipNoPhone(u, "task assigned")) return;
    const by = task?.assigned_by_user?.name || task?.posted_by_user?.name || "-";
    await sendTaskAssignmentNotification({
      employeePhone: u.phone,
      employeeName: u.name || u.username,
      taskNo: task?.task_no || `#${task?.id}`,
      companyName: task?.company?.company_name || task?.company?.name || "-",
      systemName: task?.systems?.name || "-",
      typeOfWork: task?.type_of_work || "-",
      priority: task?.priority || "Medium",
      dueDate: fmtDate(task?.expected_date_to_close),
      assignedBy: by,
      taskDetails: task?.description_of_work || task?.task_name || "-",
    });
  });

/** Event 1: order received -> the client (company whose name matches party_name). */
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

/** Event 3: testers assigned (Frontend / Backend). */
export const notifyTestersAssigned = (row, testers, expectedDate, remarks) =>
  run(async () => {
    for (const [type, id] of Object.entries(testers || {})) {
      if (!id) continue;
      const u = await userById(id);
      if (skipNoPhone(u, `tester (${type})`)) continue;
      const taskNo = row?.task?.task_no || "-";
      await sendTesterAssignmentNotification({
        testerPhone: u.phone,
        testerName: u.name || u.username,
        testerType: type,
        testingNo: `${taskNo}-${type === "Backend" ? "B" : "F"}`,
        companyName: row?.company?.company_name || row?.company?.name || "-",
        systemName: row?.system?.name || "-",
        developerName: row?.made_by_user?.name || row?.made_by_user?.username || "-",
        systemLink: row?.system_link || "-",
        testDueDate: fmtDate(expectedDate),
        remarks: remarks || "-",
      });
    }
  });

/** Event 4: testing finished -> client must approve the delivery. `row` = task_testing row. */
export const notifyDeliveryApproval = (row) =>
  run(async () => {
    const c = await userById(row?.company_id);
    if (skipNoPhone(c, "delivery approval")) return;
    await sendApprovalForDeliveryNotification({
      clientPhone: c.phone,
      clientName: c.name || c.company_name,
      systemName: row?.system?.name || "-",
      taskNo: row?.task?.task_no || row?.testing_no || "-",
      typeOfWork: row?.type_of_product || "-",
      deliveredBy: row?.made_by_user?.name || row?.made_by_user?.username || "-",
      systemLink: row?.system_link || "-",
      loginId: row?.login_id || "-",
      deliveryDate: fmtDate(new Date()),
    });
  });

/** Event 5A: company asked for a new system -> superadmin(s) with a phone. */
export const notifyNewSystemRequest = ({ companyId, requestedBy, name, department, description, priority, neededBy }) =>
  run(async () => {
    const [c, rb] = await Promise.all([userById(companyId), userById(requestedBy)]);
    const { data: approvers } = await supabase
      .from("users")
      .select("id, name, username, phone, role")
      .eq("role", "superadmin")
      .not("phone", "is", null);
    if (!approvers?.length) console.warn("[WhatsApp] new system request: no superadmin with a phone saved");
    for (const a of approvers || []) {
      await sendNewSystemApprovalRequest({
        approverPhone: a.phone,
        clientName: c?.company_name || c?.name || "A client",
        systemName: name,
        department: department || "-",
        priority: priority || "Medium",
        neededBy: fmtDate(neededBy),
        purpose: description || "-",
        requestedBy: rb?.name || c?.name || "-",
      });
    }
  });

/** Event 5B: new system approved -> client. */
export const notifyNewSystemApproved = (req, { approverId, remarks } = {}) =>
  run(async () => {
    const [c, ap] = await Promise.all([userById(req?.company_id), userById(approverId)]);
    if (skipNoPhone(c, "new system approved")) return;
    await sendNewSystemConfirmedNotification({
      clientPhone: c.phone,
      clientName: c.company_name || c.name,
      systemName: req?.system_name,
      department: req?.department || "-",
      priority: req?.priority || "Medium",
      neededBy: fmtDate(req?.needed_by),
      approvedBy: ap?.name || ap?.username || "Botivate team",
      remarks: remarks || "-",
      approvedOn: fmtDate(new Date()),
    });
  });

/** Event 7: delegation task assigned -> doer. */
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

/** Event 6: checklist task assigned -> doer (matched by name). */
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
