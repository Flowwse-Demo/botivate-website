// WhatsApp notification service (Meta Cloud API, template messages).
// Browser -> POST /api/whatsapp (server holds the token) -> graph.facebook.com
//
// Senders NEVER throw; they return { ok, data?, error?, code? } so a WhatsApp
// failure can't break UI/DB flows. Wrap calls in `notify(...)` to fire-and-forget.

const ENDPOINT = "/api/whatsapp";

/** Converts local formats to E.164 digits (no '+'). Defaults to India (91). */
export const sanitizePhone = (raw) => {
  let d = String(raw ?? "").replace(/\D/g, ""); // strip spaces, dashes, +, ()
  if (d.startsWith("00")) d = d.slice(2); // 0091... -> 91...
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1); // 098... -> 98...
  if (d.length === 10) d = "91" + d; // local 10-digit -> add country code
  return /^\d{11,15}$/.test(d) ? d : null;
};

// Meta error codes -> readable reasons
const ERROR_HINTS = {
  190: "Access token expired/invalid - generate a new token",
  132000: "Template parameter count mismatch",
  132001: "Template name does not exist or is not approved for this language",
  132005: "Translated text too long",
  132012: "Template parameter format mismatch",
  131030: "Recipient not in allowed list (test mode)",
  131047: "24h window closed - template required",
  131026: "Recipient cannot receive WhatsApp messages",
};

// Meta rejects newlines/tabs and empty params in template variables.
const txt = (v) => ({
  type: "text",
  text: String(v ?? "").replace(/[\n\t]+/g, " ").trim().slice(0, 1000) || "-",
});
const body = (...vals) => ({ type: "body", parameters: vals.map(txt) });

function fail(error, code, templateName) {
  console.warn(`[WhatsApp] ${templateName} failed (${code}): ${error}`);
  return { ok: false, error, code };
}

/** Core sender. */
export async function sendWhatsAppTemplateMessage(recipientPhone, templateName, components = [], languageCode = "en") {
  const to = sanitizePhone(recipientPhone);
  if (!to) return fail(`Invalid phone number: "${recipientPhone}"`, "INVALID_PHONE", templateName);
  if (!templateName) return fail("Template name missing", "NO_TEMPLATE", templateName);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, templateName, languageCode, components }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.ok) return { ok: true, data: json.data };

    const err = json.data?.error;
    const code = err?.code ?? res.status;
    return fail(ERROR_HINTS[code] || err?.message || json.error || `HTTP ${res.status}`, code, templateName);
  } catch (e) {
    return fail(`Network error: ${e.message}`, "NETWORK", templateName);
  }
}

/** Run a send in the background; never blocks and never throws. */
export const notify = (promise) => {
  Promise.resolve(promise).catch((e) => console.warn("[WhatsApp] unexpected:", e));
};

// ---------------------------------------------------------------------------
// Business events. Body variable order MUST match the approved template's
// {{1}}, {{2}}... order - the exact template texts live in
// scripts/submit-whatsapp-templates.mjs (single source of truth).
// No URL buttons: the portal link is part of each template's fixed text.
// ---------------------------------------------------------------------------

// Event 1: Order received -> client
// Template vars: {{1}}=party_name {{2}}=type_of_work {{3}}=payment_type {{4}}=quotation_no {{5}}=customer_id {{6}}=password
export const sendOrderReceivedNotification = ({ clientPhone, clientName, typeOfWork, paymentType, quotationNo, loginId, password }) =>
  sendWhatsAppTemplateMessage(clientPhone, "order_received_v1", [
    body(clientName, typeOfWork, paymentType, quotationNo, loginId, password),
  ]);

// Event 2: Task assigned -> employee
export const sendTaskAssignmentNotification = ({ employeePhone, employeeName, taskNo, companyName, systemName, typeOfWork, priority, dueDate, assignedBy, taskDetails }) =>
  sendWhatsAppTemplateMessage(employeePhone, "task_assigned_v1", [
    body(employeeName, taskNo, companyName, systemName, typeOfWork, priority, dueDate, assignedBy, taskDetails),
  ]);

// Event 3: Tester / QA assigned
export const sendTesterAssignmentNotification = ({ testerPhone, testerName, testerType, testingNo, companyName, systemName, developerName, systemLink, testDueDate, remarks }) =>
  sendWhatsAppTemplateMessage(testerPhone, "tester_assigned_v1", [
    body(testerName, testerType, testingNo, companyName, systemName, developerName, systemLink, testDueDate, remarks),
  ]);

// Event 4: Approval for delivery -> client
export const sendApprovalForDeliveryNotification = ({ clientPhone, clientName, systemName, taskNo, typeOfWork, deliveredBy, systemLink, loginId, deliveryDate }) =>
  sendWhatsAppTemplateMessage(clientPhone, "delivery_approval_v1", [
    body(clientName, systemName, taskNo, typeOfWork, deliveredBy, systemLink, loginId, deliveryDate),
  ]);

// Event 5A: New system request -> approver
export const sendNewSystemApprovalRequest = ({ approverPhone, clientName, systemName, department, priority, neededBy, purpose, requestedBy }) =>
  sendWhatsAppTemplateMessage(approverPhone, "new_system_request_v1", [
    body(clientName, systemName, department, priority, neededBy, purpose, requestedBy),
  ]);

// Event 5B: New system approved -> client
export const sendNewSystemConfirmedNotification = ({ clientPhone, clientName, systemName, department, priority, neededBy, approvedBy, remarks, approvedOn }) =>
  sendWhatsAppTemplateMessage(clientPhone, "new_system_confirmed_v1", [
    body(clientName, systemName, department, priority, neededBy, approvedBy, remarks, approvedOn),
  ]);

// Event 6: Checklist task assigned -> doer
// Template vars: {{1}}=name {{2}}=assigned_by {{3}}=task {{4}}=description {{5}}=scheduled_days {{6}}=time
export const sendChecklistReminderNotification = ({ employeePhone, employeeName, assignedBy, taskName, details, days, dueTime }) =>
  sendWhatsAppTemplateMessage(employeePhone, "checklist_assigned_v1", [
    body(employeeName, assignedBy, taskName, details, days, dueTime),
  ]);

// Event 7: Task delegation -> doer
// Template vars: {{1}}=name {{2}}=assigned_by {{3}}=task {{4}}=target_date {{5}}=target_time
export const sendTaskDelegationNotification = ({ delegatedToPhone, delegatedToName, delegatedByName, taskDetails, targetDate, targetTime }) =>
  sendWhatsAppTemplateMessage(delegatedToPhone, "task_delegated_v1", [
    body(delegatedToName, delegatedByName, taskDetails, targetDate, targetTime),
  ]);
