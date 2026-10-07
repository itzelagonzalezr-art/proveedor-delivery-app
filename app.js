const STORAGE_KEY = "proveedores-registro-v1";

const state = {
  records: loadRecords(),
  editingId: null,
};

const elements = {
  form: document.getElementById("providerForm"),
  formTitle: document.getElementById("formTitle"),
  submitButton: document.getElementById("submitButton"),
  resetFormBtn: document.getElementById("resetFormBtn"),
  providerName: document.getElementById("providerName"),
  providerDate: document.getElementById("providerDate"),
  providerTime: document.getElementById("providerTime"),
  providerStatus: document.getElementById("providerStatus"),
  pendingTasks: document.getElementById("pendingTasks"),
  fridgeNotes: document.getElementById("fridgeNotes"),
  generalNotes: document.getElementById("generalNotes"),
  dayClosure: document.getElementById("dayClosure"),
  deliveries: document.getElementById("deliveries"),
  list: document.getElementById("providerList"),
  emptyState: document.getElementById("emptyState"),
  totalCount: document.getElementById("totalCount"),
  pendingCount: document.getElementById("pendingCount"),
  deliveredCount: document.getElementById("deliveredCount"),
  todayCount: document.getElementById("todayCount"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  dateFilter: document.getElementById("dateFilter"),
  sortSelect: document.getElementById("sortSelect"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  clockReadout: document.getElementById("clockReadout"),
  setCurrentTimeBtn: document.getElementById("setCurrentTimeBtn"),
};

const timeState = {
  hour: 8,
  minute: 30,
};

initialize();

function initialize() {
  setDefaultDate();
  setCurrentTime();
  bindEvents();
  render();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.resetFormBtn.addEventListener("click", resetForm);

  document.querySelectorAll("[data-adjust]").forEach((button) => {
    button.addEventListener("click", () => adjustClock(button.dataset.adjust, button.dataset.direction));
  });

  elements.setCurrentTimeBtn.addEventListener("click", setCurrentTime);

  elements.searchInput.addEventListener("input", () => render());
  elements.statusFilter.addEventListener("change", () => render());
  elements.dateFilter.addEventListener("change", () => render());
  elements.sortSelect.addEventListener("change", () => render());
  elements.clearFiltersBtn.addEventListener("click", clearFilters);

  elements.list.addEventListener("click", (event) => {
    const actionButton = event.target.closest("button");
    if (!actionButton) return;

    const { action, id } = actionButton.dataset;

    if (action === "edit") {
      const record = state.records.find((entry) => entry.id === id);
      if (record) populateForm(record);
      return;
    }

    if (action === "delete") {
      deleteRecord(id);
    }
  });
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  elements.providerDate.value = today;
  elements.dateFilter.value = "";
}

function setCurrentTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  timeState.hour = hour;
  timeState.minute = minute;
  syncClockDisplay();
}

function syncClockDisplay() {
  const hour = String(timeState.hour).padStart(2, "0");
  const minute = String(timeState.minute).padStart(2, "0");
  const value = `${hour}:${minute}`;
  elements.clockReadout.textContent = value;
  elements.providerTime.value = value;
}

function adjustClock(type, direction) {
  const step = direction === "+" ? 1 : -1;

  if (type === "hour") {
    timeState.hour = (timeState.hour + step + 24) % 24;
  }

  if (type === "minute") {
    timeState.minute = (timeState.minute + step + 60) % 60;
  }

  syncClockDisplay();
}

function handleSubmit(event) {
  event.preventDefault();

  const record = {
    id: state.editingId || createId(),
    name: elements.providerName.value.trim(),
    date: elements.providerDate.value,
    time: elements.providerTime.value || formatTimeFromState(),
    status: elements.providerStatus.value,
    pendingTasks: elements.pendingTasks.value.trim(),
    fridgeNotes: elements.fridgeNotes.value.trim(),
    generalNotes: elements.generalNotes.value.trim(),
    dayClosure: elements.dayClosure.value.trim(),
    deliveries: elements.deliveries.value.trim(),
    createdAt: state.editingId
      ? state.records.find((entry) => entry.id === state.editingId)?.createdAt ?? new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!record.name || !record.date) {
    return;
  }

  if (state.editingId) {
    state.records = state.records.map((entry) => (entry.id === state.editingId ? record : entry));
  } else {
    state.records.unshift(record);
  }

  persistRecords();
  render();
  resetForm();
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTimeFromState() {
  return `${String(timeState.hour).padStart(2, "0")}:${String(timeState.minute).padStart(2, "0")}`;
}

function render() {
  renderSummary();
  renderList();
}

function renderSummary() {
  const total = state.records.length;
  const pending = state.records.filter((record) => record.status === "pending").length;
  const delivered = state.records.filter((record) => record.status === "delivered").length;
  const today = new Date().toISOString().split("T")[0];
  const todayTotal = state.records.filter((record) => record.date === today).length;

  elements.totalCount.textContent = String(total);
  elements.pendingCount.textContent = String(pending);
  elements.deliveredCount.textContent = String(delivered);
  elements.todayCount.textContent = String(todayTotal);
}

function renderList() {
  const filteredRecords = getFilteredRecords();

  if (!filteredRecords.length) {
    elements.emptyState.classList.remove("hidden");
    elements.list.innerHTML = "";
    return;
  }

  elements.emptyState.classList.add("hidden");

  const html = filteredRecords
    .map(
      (record) => `
        <article class="provider-card ${record.status}">
          <div class="card-top">
            <div>
              <h3>${escapeHtml(record.name)}</h3>
              <p>${formatDate(record.date)} • ${formatTime(record.time)}</p>
            </div>
            <span class="badge ${record.status}">${record.status === "pending" ? "Pendiente" : "Entregado"}</span>
          </div>

          <div class="info-grid">
            <div class="field-value">
              <span>Tareas pendientes</span>
              <p>${formatText(record.pendingTasks)}</p>
            </div>
            <div class="field-value">
              <span>Refrigerador</span>
              <p>${formatText(record.fridgeNotes)}</p>
            </div>
            <div class="field-value">
              <span>Observaciones</span>
              <p>${formatText(record.generalNotes)}</p>
            </div>
            <div class="field-value">
              <span>Cierre</span>
              <p>${formatText(record.dayClosure)}</p>
            </div>
            <div class="field-value" style="grid-column: 1 / -1;">
              <span>Entregas</span>
              <p>${formatText(record.deliveries)}</p>
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="card-action" data-action="edit" data-id="${record.id}">Editar</button>
            <button type="button" class="delete-action" data-action="delete" data-id="${record.id}">Eliminar</button>
          </div>
        </article>
      `,
    )
    .join("");

  elements.list.innerHTML = html;
}

function getFilteredRecords() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  const selectedDate = elements.dateFilter.value;
  const sort = elements.sortSelect.value;

  let list = [...state.records];

  if (search) {
    list = list.filter((record) => record.name.toLowerCase().includes(search));
  }

  if (status !== "all") {
    list = list.filter((record) => record.status === status);
  }

  if (selectedDate) {
    list = list.filter((record) => record.date === selectedDate);
  }

  list.sort((a, b) => {
    if (sort === "time-asc") return compareDateTime(a, b, false);
    if (sort === "date-desc") return compareDateTime(a, b, true, true);
    if (sort === "date-asc") return compareDateTime(a, b, true, false);
    return compareDateTime(a, b, false, true);
  });

  return list;
}

function compareDateTime(a, b, byDate, descending = false) {
  const aValue = byDate ? `${a.date}T${a.time || "00:00"}` : `${a.date}T${a.time || "00:00"}`;
  const bValue = byDate ? `${b.date}T${b.time || "00:00"}` : `${b.date}T${b.time || "00:00"}`;

  if (aValue < bValue) return descending ? 1 : -1;
  if (aValue > bValue) return descending ? -1 : 1;
  return 0;
}

function clearFilters() {
  elements.searchInput.value = "";
  elements.statusFilter.value = "all";
  elements.dateFilter.value = "";
  elements.sortSelect.value = "time-desc";
  render();
}

function populateForm(record) {
  state.editingId = record.id;
  elements.formTitle.textContent = "Editar registro";
  elements.submitButton.textContent = "Actualizar registro";

  elements.providerName.value = record.name;
  elements.providerDate.value = record.date;
  elements.providerTime.value = record.time;
  const [hour, minute] = record.time.split(":");
  timeState.hour = Number(hour);
  timeState.minute = Number(minute);
  syncClockDisplay();

  elements.providerStatus.value = record.status;
  elements.pendingTasks.value = record.pendingTasks;
  elements.fridgeNotes.value = record.fridgeNotes;
  elements.generalNotes.value = record.generalNotes;
  elements.dayClosure.value = record.dayClosure;
  elements.deliveries.value = record.deliveries;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  state.editingId = null;
  elements.form.reset();
  elements.formTitle.textContent = "Nuevo registro";
  elements.submitButton.textContent = "Guardar registro";
  setDefaultDate();
  setCurrentTime();
}

function deleteRecord(id) {
  state.records = state.records.filter((record) => record.id !== id);
  persistRecords();
  render();

  if (state.editingId === id) {
    resetForm();
  }
}

function escapeHtml(value) {
  return String(value || "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatText(value) {
  const text = (value || "—").trim();
  if (!text) return "—";
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function formatDate(dateString) {
  if (!dateString) return "Sin fecha";
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(timeString) {
  if (!timeString) return "Sin hora";
  const [hour, minute] = timeString.split(":");
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);

  const date = new Date();
  date.setHours(parsedHour, parsedMinute, 0, 0);

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
