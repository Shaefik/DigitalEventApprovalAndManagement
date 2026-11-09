const STORAGE_KEY = "digitalEventApprovalRequests_v1";
const APPROVAL_STAGES = ["Class Tutor", "HOD", "Dean", "Principal"];
const $ = (id) => document.getElementById(id);

let currentRole = null;
let currentName = "";
let toastTimer = null;

function readRequests() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}
function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
}
function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(d.getTime()) ? dateString : d.toLocaleDateString(undefined, {day:"numeric", month:"short", year:"numeric"});
}
function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}
function newId() {
  return "EVT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
}
function latestComment(req) {
  const item = [...(req.history || [])].reverse().find(h => h.comment);
  return item ? `${item.role}: ${item.comment}` : "";
}
function login(role, name) {
  currentRole = role;
  currentName = name.trim() || role;
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");
  $("currentUserLabel").textContent = `${currentName} · ${currentRole}`;
  $("dashboardTitle").textContent = currentRole === "Student" ? "Student dashboard" : `${currentRole} dashboard`;
  $("dashboardSubtitle").textContent = currentRole === "Student"
    ? "Create requests and follow every approval stage."
    : "Review event requests assigned to your approval stage.";
  $("studentCreatePanel").classList.toggle("hidden", currentRole !== "Student");
  $("returnedPanel").classList.toggle("hidden", currentRole !== "Student");
  $("listTitle").textContent = currentRole === "Student" ? "Your applications" : "Requests for review";
  $("listEyebrow").textContent = currentRole === "Student" ? "APPLICATIONS" : "REVIEW QUEUE";
  renderDashboard();
}
function logout() {
  currentRole = null;
  currentName = "";
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
  $("logoutBtn").classList.add("hidden");
  $("loginForm").reset();
  $("userName").value = "Demo User";
}
function isAssignedToMe(req) {
  return req.status === "Pending" && req.currentStage === currentRole;
}
function visibleRequests() {
  const all = readRequests();
  if (currentRole === "Student") return all.filter(r => r.ownerName === currentName || r.ownerRoll.toLowerCase() === currentName.toLowerCase());
  return all.filter(isAssignedToMe);
}
function renderStats() {
  const all = readRequests();
  const mine = currentRole === "Student"
    ? all.filter(r => r.ownerName === currentName || r.ownerRoll.toLowerCase() === currentName.toLowerCase())
    : all;
  const pending = currentRole === "Student"
    ? mine.filter(r => r.status === "Pending").length
    : mine.filter(r => isAssignedToMe(r)).length;
  const returned = mine.filter(r => r.status === "Returned").length;
  const rejected = mine.filter(r => r.status === "Rejected").length;
  const approved = mine.filter(r => r.status === "Approved").length;
  const stats = [
    ["Total requests", mine.length, "Saved in this browser"],
    [currentRole === "Student" ? "Pending review" : "Awaiting my review", pending, currentRole === "Student" ? "Moving through the workflow" : "Assigned to your role"],
    ["Returned", returned, "Correction required"],
    ["Approved", approved, rejected ? `${rejected} rejected` : "Final approval complete"]
  ];
  $("statsGrid").innerHTML = stats.map(([label, number, foot]) => `
    <div class="stat-card"><div class="stat-label">${escapeHtml(label)}</div>
    <div class="stat-number">${number}</div><div class="stat-foot">${escapeHtml(foot)}</div></div>`).join("");
}
function renderDashboard() {
  renderStats();
  renderRequests();
  renderReturned();
}
function renderReturned() {
  const list = $("returnedList");
  if (currentRole !== "Student") return;
  const returned = readRequests().filter(r => r.ownerName === currentName && r.status === "Returned");
  if (!returned.length) {
    list.innerHTML = '<p class="muted">No requests need correction right now.</p>';
    return;
  }
  list.innerHTML = returned.map(r => `
    <div class="request-card"><div class="request-main">
      <h3>${escapeHtml(r.eventName)}</h3><div class="request-meta"><span>${escapeHtml(r.id)}</span><span>Comment: ${escapeHtml(latestComment(r) || "Please review the request details.")}</span></div>
    </div><div class="request-side"><span class="status status-returned">Returned</span><div class="request-actions"><button class="small-button primary" data-action="edit" data-id="${escapeHtml(r.id)}">Correct & resubmit</button></div></div></div>`).join("");
}
function renderRequests() {
  const filter = $("statusFilter").value;
  let requests = visibleRequests();
  if (currentRole !== "Student") {
    // Authority view: show pending requests for this stage by default; filter can expose history for the demo.
    if (filter === "All" || filter === "Pending") requests = readRequests().filter(r => isAssignedToMe(r));
    else requests = readRequests().filter(r => r.history?.some(h => h.role === currentRole) && r.status === filter);
  } else if (filter !== "All") {
    requests = requests.filter(r => r.status === filter);
  }
  requests.sort((a,b) => b.createdAt - a.createdAt);
  $("emptyState").classList.toggle("hidden", requests.length !== 0);
  $("requestList").classList.toggle("hidden", requests.length === 0);
  $("requestList").innerHTML = requests.map(r => {
    const comment = latestComment(r);
    const actionButtons = currentRole === "Student"
      ? `${r.status === "Approved" ? `<button class="small-button primary" data-action="letter" data-id="${escapeHtml(r.id)}">View letter</button>` : ""}
         <button class="small-button" data-action="details" data-id="${escapeHtml(r.id)}">Details / history</button>`
      : `${isAssignedToMe(r) ? `<button class="small-button primary" data-action="review" data-id="${escapeHtml(r.id)}">Review request</button>` : `<button class="small-button" data-action="details" data-id="${escapeHtml(r.id)}">Details / history</button>`}`;
    return `<article class="request-card"><div class="request-main">
      <h3>${escapeHtml(r.eventName)}</h3>
      <div class="request-meta"><span>${escapeHtml(r.id)}</span><span>${escapeHtml(formatDate(r.eventDate))} · ${escapeHtml(r.eventTime)}</span><span>${escapeHtml(r.venue)}</span><span>${escapeHtml(r.department)}</span></div>
      <div class="request-meta" style="margin-top:7px"><span>Organizer: ${escapeHtml(r.ownerName)} (${escapeHtml(r.ownerRoll)})</span><span>Stage: ${escapeHtml(r.status === "Pending" ? r.currentStage : r.status)}</span></div>
      ${comment ? `<div class="request-note">${escapeHtml(comment)}</div>` : ""}
    </div><div class="request-side"><span class="status status-${statusClass(r.status)}">${escapeHtml(r.status)}</span><div class="request-actions">${actionButtons}</div></div></article>`;
  }).join("");
}
function addHistory(req, role, action, comment = "") {
  req.history = req.history || [];
  req.history.push({ role, action, comment, at: new Date().toISOString() });
}
function createRequest(formData) {
  const requests = readRequests();
  const req = {
    id: newId(), eventName: formData.get("eventName").trim(),
    ownerName: formData.get("organizer").trim(), ownerRoll: formData.get("rollNo").trim(),
    department: formData.get("department").trim(), eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime"), venue: formData.get("venue").trim(),
    participants: Number(formData.get("participants")), purpose: formData.get("purpose").trim(),
    status: "Pending", currentStage: "Class Tutor", createdAt: Date.now(),
    history: [], decisions: {}
  };
  addHistory(req, "Student", "Submitted request");
  requests.push(req);
  saveRequests(requests);
}
function findRequest(id) {
  return readRequests().find(r => r.id === id);
}
function updateRequest(id, callback) {
  const requests = readRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return false;
  callback(requests[index]);
  saveRequests(requests);
  return true;
}
function openReview(id) {
  const req = findRequest(id);
  if (!req) return;
  $("decisionRequestId").value = id;
  $("reviewTitle").textContent = req.eventName;
  $("reviewComment").value = "";
  $("reviewDetails").innerHTML = detailsHtml(req);
  $("reviewDialog").showModal();
}
function detailsHtml(req) {
  const fields = [
    ["Request ID", req.id], ["Organizer", `${req.ownerName} (${req.ownerRoll})`],
    ["Event date", `${formatDate(req.eventDate)} · ${req.eventTime}`], ["Venue", req.venue],
    ["Department / club", req.department], ["Expected participants", req.participants],
    ["Purpose", req.purpose], ["Current stage", req.currentStage || req.status]
  ];
  return `<div class="detail-grid">${fields.map(([label,value]) => `<div><span class="detail-label">${escapeHtml(label)}</span><span class="detail-value">${escapeHtml(value)}</span></div>`).join("")}</div>`;
}
function decide(decision) {
  const id = $("decisionRequestId").value;
  const comment = $("reviewComment").value.trim();
  if ((decision === "Returned" || decision === "Rejected") && !comment) {
    showToast("Please add a comment before returning or rejecting.");
    $("reviewComment").focus();
    return;
  }
  const ok = updateRequest(id, req => {
    if (!isAssignedToMe(req)) return;
    req.decisions = req.decisions || {};
    req.decisions[currentRole] = decision;
    if (decision === "Approved") {
      addHistory(req, currentRole, "Approved", comment);
      const stageIndex = APPROVAL_STAGES.indexOf(currentRole);
      if (stageIndex < APPROVAL_STAGES.length - 1) {
        req.currentStage = APPROVAL_STAGES[stageIndex + 1];
        req.status = "Pending";
      } else {
        req.currentStage = "Completed";
        req.status = "Approved";
        req.approvedAt = new Date().toISOString();
      }
    } else if (decision === "Returned") {
      req.status = "Returned";
      req.returnedFrom = currentRole;
      addHistory(req, currentRole, "Returned for correction", comment);
    } else {
      req.status = "Rejected";
      req.currentStage = "Closed";
      addHistory(req, currentRole, "Rejected", comment);
    }
  });
  if (!ok) return;
  $("reviewDialog").close();
  renderDashboard();
  showToast(decision === "Approved" ? (currentRole === "Principal" ? "Final approval complete. Permission letter is ready." : "Approved and forwarded to the next authority.") : decision === "Returned" ? "Request returned to the student for correction." : "Request rejected.");
}
function editReturned(id) {
  const req = findRequest(id);
  if (!req) return;
  $("eventName").value = req.eventName;
  $("organizer").value = req.ownerName;
  $("rollNo").value = req.ownerRoll;
  $("department").value = req.department;
  $("eventDate").value = req.eventDate;
  $("eventTime").value = req.eventTime;
  $("venue").value = req.venue;
  $("participants").value = req.participants;
  $("purpose").value = req.purpose;
  $("eventForm").dataset.editId = id;
  $("eventForm").querySelector('button[type="submit"]').innerHTML = 'Save corrections & resubmit <span>→</span>';
  $("studentCreatePanel").scrollIntoView({behavior:"smooth",block:"start"});
  showToast("Edit the form fields and resubmit the request.");
}
function submitEventForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const editId = form.dataset.editId;
  if (editId) {
    const updated = updateRequest(editId, req => {
      req.eventName = data.get("eventName").trim();
      req.ownerName = data.get("organizer").trim();
      req.ownerRoll = data.get("rollNo").trim();
      req.department = data.get("department").trim();
      req.eventDate = data.get("eventDate");
      req.eventTime = data.get("eventTime");
      req.venue = data.get("venue").trim();
      req.participants = Number(data.get("participants"));
      req.purpose = data.get("purpose").trim();
      req.status = "Pending";
      req.currentStage = req.returnedFrom || "Class Tutor";
      addHistory(req, "Student", "Corrected and resubmitted");
      req.returnedFrom = null;
    });
    if (updated) showToast("Corrections saved and request resubmitted.");
    delete form.dataset.editId;
    form.querySelector('button[type="submit"]').innerHTML = 'Submit request <span>→</span>';
  } else {
    createRequest(data);
    showToast("Event request submitted to the Class Tutor.");
  }
  form.reset();
  renderDashboard();
}
function showDetails(id) {
  const req = findRequest(id);
  if (!req) return;
  const history = (req.history || []).map(h => {
    const when = new Date(h.at).toLocaleString();
    return `<p><strong>${escapeHtml(h.role)} · ${escapeHtml(h.action)}</strong><br><span style="color:#718096">${escapeHtml(when)}</span>${h.comment ? `<br>${escapeHtml(h.comment)}` : ""}</p>`;
  }).join("");
  $("reviewTitle").textContent = `${req.eventName} — history`;
  $("reviewDetails").innerHTML = detailsHtml(req) + `<hr style="border:0;border-top:1px solid #e1e7ef;margin:16px 0"><h3 style="font:700 13px Manrope;color:#142b4b">Approval history</h3>${history || "<p>No history yet.</p>"}`;
  $("decisionForm").classList.add("hidden");
  $("reviewDialog").showModal();
  $("reviewDialog").addEventListener("close", restoreDecisionForm, {once:true});
}
function restoreDecisionForm() {
  $("decisionForm").classList.remove("hidden");
}
function showLetter(id) {
  const req = findRequest(id);
  if (!req || req.status !== "Approved") {
    showToast("The permission letter is available after final approval.");
    return;
  }
  const date = new Date().toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"});
  $("letterContent").innerHTML = `
    <p class="letter-meta">Date: ${escapeHtml(date)}<br>Reference: ${escapeHtml(req.id)}</p>
    <h3>PSG COLLEGE OF TECHNOLOGY</h3><p style="text-align:center;margin-top:0">Department of Computer Applications</p>
    <h4>EVENT PERMISSION LETTER</h4>
    <p>To whom it may concern,</p>
    <p>This is to confirm that permission has been approved for the event described below, subject to the institution's applicable rules and guidelines.</p>
    <p><strong>Event name:</strong> ${escapeHtml(req.eventName)}<br>
    <strong>Organizing department / club:</strong> ${escapeHtml(req.department)}<br>
    <strong>Date and time:</strong> ${escapeHtml(formatDate(req.eventDate))}, ${escapeHtml(req.eventTime)}<br>
    <strong>Venue:</strong> ${escapeHtml(req.venue)}<br>
    <strong>Expected participants:</strong> ${escapeHtml(req.participants)}<br>
    <strong>Student organizer:</strong> ${escapeHtml(req.ownerName)} (${escapeHtml(req.ownerRoll)})</p>
    <p><strong>Purpose:</strong> ${escapeHtml(req.purpose)}</p>
    <p>The request has completed the configured approval sequence and is marked approved in this prototype.</p>
    <p style="margin-top:48px"><strong>Principal</strong><br>Approved electronically in the demonstration system</p>
    <p style="font-size:10px;color:#718096;margin-top:35px">Prototype-generated document. This is not an official college permission letter until reviewed and authorized by the institution.</p>`;
  $("letterDialog").showModal();
}
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  login($("roleSelect").value, $("userName").value);
});
$("logoutBtn").addEventListener("click", logout);
$("eventForm").addEventListener("submit", submitEventForm);
$("statusFilter").addEventListener("change", renderRequests);
$("requestList").addEventListener("click", e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const {action,id} = btn.dataset;
  if (action === "review") openReview(id);
  if (action === "details") showDetails(id);
  if (action === "letter") showLetter(id);
});
$("returnedList").addEventListener("click", e => {
  const btn = e.target.closest("button[data-action='edit']");
  if (btn) editReturned(btn.dataset.id);
});
$("approveBtn").addEventListener("click", () => decide("Approved"));
$("returnBtn").addEventListener("click", () => decide("Returned"));
$("rejectBtn").addEventListener("click", () => decide("Rejected"));
$("closeLetterBtn").addEventListener("click", () => $("letterDialog").close());
$("closeLetterBtn2").addEventListener("click", () => $("letterDialog").close());
$("printLetterBtn").addEventListener("click", () => window.print());

// Keep event date from being set in the past for new requests.
$("eventDate").min = new Date().toISOString().slice(0,10);
