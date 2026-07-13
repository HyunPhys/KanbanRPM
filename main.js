var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src-kanbanrpm/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => KanbanRPMPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian9 = require("obsidian");

// src-kanbanrpm/board-view.ts
var import_obsidian2 = require("obsidian");

// src-kanbanrpm/constants.ts
var VIEW_TYPE = "kanban-rpm-board";
var DEFAULT_STATUSES = [
  { id: "inbox", label: "Inbox" },
  { id: "active", label: "Active" },
  { id: "waiting", label: "Waiting" },
  { id: "blocked", label: "Blocked" },
  { id: "someday", label: "Someday" },
  { id: "done", label: "Done" }
];
var DEFAULT_CATEGORIES = [
  { id: "research", label: "Research" },
  { id: "experiment", label: "Experiment" },
  { id: "analysis", label: "Analysis" },
  { id: "writing", label: "Writing" },
  { id: "setup", label: "Setup" },
  { id: "purchase", label: "Purchase" },
  { id: "admin", label: "Admin" },
  { id: "communication", label: "Communication" }
];
var COMMUNICATION_TYPES = [
  { id: "meeting_internal", label: "Meeting (Internal)", folder: "Meeting (Internal)" },
  { id: "meeting_external", label: "Meeting (External)", folder: "Meeting (External)" },
  { id: "call", label: "Call", folder: "Call" },
  { id: "chat", label: "Chat", folder: "Chat" },
  { id: "email", label: "Email", folder: "Email" }
];
var DEFAULT_SETTINGS = {
  workspaceFolder: "KanbanRPM Workspace",
  statuses: DEFAULT_STATUSES,
  categories: DEFAULT_CATEGORIES,
  experimentLogCategories: ["experiment"],
  analysisLogCategories: ["analysis"],
  promptForLogOnDone: true,
  reviewReminderStatus: "active",
  boardStatusFilter: DEFAULT_STATUSES.map((status) => status.id),
  boardStatusOrder: DEFAULT_STATUSES.map((status) => status.id),
  boardProjectFilter: "",
  boardSubprojectFilter: "",
  boardCategoryFilter: "",
  viewFilters: {
    board: { project: "", subproject: "", category: "" },
    table: { project: "", subproject: "", category: "" },
    timeline: { project: "", subproject: "", category: "" },
    gantt: { project: "", subproject: "", category: "" },
    archive: { project: "", subproject: "", category: "" }
  },
  showBoardConnectors: true,
  showBoardSubprojects: true,
  showBoardBigActions: true,
  showGanttSubprojects: true,
  showGanttBigActions: true,
  boardZoom: 1,
  timelineZoom: 1,
  timelineScrollLeft: null,
  timelineScrollTop: null,
  ganttZoom: 1,
  newCardAdvancedOpen: false,
  timelineStatusFilter: ["active"],
  cardDisplayFields: {
    breadcrumb: true,
    type: true,
    status: true,
    priority: true,
    category: true,
    currentFocus: true,
    waiting: true,
    blockers: true,
    dates: true,
    dependencies: true,
    sources: true,
    smallActionSummary: true
  },
  smallActionDisplay: {
    collapsedByDefault: true,
    sourceFilter: "dated",
    dateWindow: "week"
  }
};
var LANES = DEFAULT_STATUSES;
var WORKSTREAM_TYPES = DEFAULT_CATEGORIES;

// src-kanbanrpm/board-view.ts
var import_obsidian3 = require("obsidian");

// src-kanbanrpm/date-utils.ts
function todayIso() {
  return formatDate(/* @__PURE__ */ new Date());
}
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(day, days) {
  const date = /* @__PURE__ */ new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
function endOfMonth(day) {
  const date = /* @__PURE__ */ new Date(`${day.slice(0, 7)}-01T00:00:00`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return formatDate(date);
}
function daysBetween(start, end) {
  const startDate = /* @__PURE__ */ new Date(`${start}T00:00:00`);
  const endDate = /* @__PURE__ */ new Date(`${end}T00:00:00`);
  return Math.round((endDate.getTime() - startDate.getTime()) / 864e5);
}
function dateRange(start, end, fallback = todayIso()) {
  const days = [];
  const startDate = /* @__PURE__ */ new Date(`${start}T00:00:00`);
  const endDate = /* @__PURE__ */ new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [fallback];
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    days.push(formatDate(date));
    if (days.length > 180) break;
  }
  return days;
}
function monthRange(start, end, fallback = todayIso().slice(0, 7)) {
  const months = [];
  const startDate = /* @__PURE__ */ new Date(`${start.slice(0, 7)}-01T00:00:00`);
  const endDate = /* @__PURE__ */ new Date(`${end.slice(0, 7)}-01T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [fallback];
  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    if (months.length > 60) break;
  }
  return months;
}
function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// src-kanbanrpm/board-view.ts
var import_obsidian4 = require("obsidian");
var import_obsidian5 = require("obsidian");

// src-kanbanrpm/modals.ts
var import_obsidian = require("obsidian");

// src-kanbanrpm/utils.ts
function text(value) {
  if (value === null || value === void 0) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
}
function yamlScalar(value) {
  if (value === null || value === void 0 || value === "") return "";
  const raw = String(value).replace(/\r?\n/g, " ").trim();
  if (/^[0-9]+$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^(true|false)$/i.test(raw)) return raw.toLowerCase();
  return JSON.stringify(raw);
}
function yamlArray(values) {
  if (!values.length) return "[]";
  return values.map((value) => `
  - ${JSON.stringify(value)}`).join("");
}
function toStringList(value) {
  if (Array.isArray(value)) return value.map(text).map((item) => item.trim()).filter(Boolean);
  const raw = text(value).trim();
  if (!raw) return [];
  return raw.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}
function textareaToList(value) {
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}
function sanitizeFileName(name) {
  const sanitized = String(name || "Untitled Project").replace(/[\\/:*?"<>|#^[\]]/g, " ").replace(/\s+/g, " ").trim();
  return sanitized || "Untitled Project";
}
function isStatus(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function normalizeStatus(value, statuses) {
  var _a, _b;
  const raw = text(value).trim().toLowerCase().replace(/\s+/g, "-");
  if (statuses.some((status) => status.id === raw)) return raw;
  return (_b = (_a = statuses[0]) == null ? void 0 : _a.id) != null ? _b : LANES[0].id;
}
function parseStatuses(value) {
  const statuses = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [idPart, labelPart] = line.split("|").map((part) => part.trim());
    const id = (idPart || labelPart || "status").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return {
      id,
      label: labelPart || idPart || id
    };
  }).filter((status) => status.id);
  const seen = /* @__PURE__ */ new Set();
  return statuses.filter((status) => {
    if (seen.has(status.id)) return false;
    seen.add(status.id);
    return true;
  });
}
function serializeStatuses(statuses) {
  return statuses.map((status) => `${status.id} | ${status.label}`).join("\n");
}
function parseCategories(value) {
  const seen = /* @__PURE__ */ new Set();
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [idPart, labelPart] = line.split("|").map((part) => part.trim());
    const id = (idPart || labelPart || "category").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return {
      id,
      label: labelPart || idPart || id
    };
  }).filter((category) => {
    if (!category.id || seen.has(category.id)) return false;
    seen.add(category.id);
    return true;
  });
}
function normalizeCategoryDefinitions(value) {
  if (!Array.isArray(value)) return [];
  const seen = /* @__PURE__ */ new Set();
  return value.map((item) => {
    if (typeof item === "string") {
      const id2 = item.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
      return { id: id2, label: item.trim() || id2 };
    }
    if (!item || typeof item !== "object") return null;
    const record = item;
    const id = text(record.id).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    const label = text(record.label).trim() || id;
    return id ? { id, label } : null;
  }).filter((category) => {
    if (!(category == null ? void 0 : category.id) || seen.has(category.id)) return false;
    seen.add(category.id);
    return true;
  });
}
function serializeCategories(categories) {
  return categories.map((category) => `${category.id} | ${category.label}`).join("\n");
}
function categoryIds(categories) {
  return categories.map((category) => category.id);
}
function categoryLabel(categories, id) {
  var _a, _b;
  return (_b = (_a = categories.find((category) => category.id === id)) == null ? void 0 : _a.label) != null ? _b : id;
}
function toDateSortValue(card) {
  const date = card.scheduledDate || card.dueDate || card.nextReview || "";
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "9999-99-99";
}
function compareCards(a, b) {
  var _a, _b;
  const aManual = Number.isFinite(a.order);
  const bManual = Number.isFinite(b.order);
  if (aManual && bManual && a.order !== b.order) {
    return ((_a = a.order) != null ? _a : 0) - ((_b = b.order) != null ? _b : 0);
  }
  if (aManual !== bManual) return aManual ? -1 : 1;
  const priorityDiff = (a.priority || 3) - (b.priority || 3);
  if (priorityDiff !== 0) return priorityDiff;
  const dateDiff = toDateSortValue(a).localeCompare(toDateSortValue(b));
  if (dateDiff !== 0) return dateDiff;
  return a.title.localeCompare(b.title, void 0, { sensitivity: "base" });
}
function parsePriority(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}
function parseOrder(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : void 0;
}
function isPastDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const today = /* @__PURE__ */ new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return value < `${yyyy}-${mm}-${dd}`;
}
function isDueSoon(value, days = 7) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const target = /* @__PURE__ */ new Date(`${value}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 864e5);
  return diffDays >= 0 && diffDays <= days;
}
function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: content };
  return {
    body: content.slice(match[0].length)
  };
}
function getWikiLinkTarget(value) {
  const match = value.match(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/);
  return (match ? match[1] : value).trim();
}

// src-kanbanrpm/modals.ts
var TimelineMemoModal = class extends import_obsidian.Modal {
  constructor(app, day, initialValue, onSave) {
    super(app);
    this.day = day;
    this.value = initialValue;
    this.onSave = onSave;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("kanban-rpm-memo-modal-shell");
    contentEl.empty();
    contentEl.addClass("kanban-rpm-memo-modal");
    contentEl.createEl("h2", { text: `${this.day} Memo` });
    contentEl.createDiv({
      cls: "kanban-rpm-modal-help",
      text: "Write Markdown for this Timeline date. Checkbox lines can be toggled from the Timeline preview."
    });
    const editor = contentEl.createEl("textarea", {
      cls: "kanban-rpm-timeline-memo-modal-input",
      attr: { "aria-label": `${this.day} Timeline memo` }
    });
    editor.value = this.value;
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.addEventListener("input", () => {
      this.value = editor.value;
    });
    new import_obsidian.Setting(contentEl).addButton((button) => {
      button.setButtonText("Save memo").setCta().onClick(() => {
        void this.save();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  async save() {
    await this.onSave(this.value);
    this.close();
  }
};
var GanttDateModal = class extends import_obsidian.Modal {
  constructor(app, card, onSave) {
    super(app);
    this.card = card;
    this.values = {
      startDate: card.startDate,
      scheduledDate: card.scheduledDate,
      dueDate: card.dueDate,
      nextReview: card.nextReview
    };
    this.onSave = onSave;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: `Edit Gantt dates` });
    contentEl.createDiv({ cls: "kanban-rpm-modal-help", text: this.card.title });
    const grid = contentEl.createDiv({ cls: "kanban-rpm-modal-grid" });
    for (const [key, label] of [
      ["startDate", "Start date"],
      ["scheduledDate", "Scheduled date"],
      ["dueDate", "Due date"],
      ["nextReview", "Next review"]
    ]) {
      new import_obsidian.Setting(grid).setName(label).addText((input) => {
        input.inputEl.type = "date";
        input.setPlaceholder("YYYY-MM-DD");
        input.setValue(this.values[key]);
        input.onChange((value) => {
          this.values[key] = value.trim();
        });
      });
    }
    new import_obsidian.Setting(contentEl.createDiv({ cls: "kanban-rpm-modal-footer" })).addButton((button) => {
      button.setButtonText("Save dates").setCta().onClick(() => {
        void this.save();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  async save() {
    const invalid = Object.values(this.values).find((value) => value && !/^\d{4}-\d{2}-\d{2}$/.test(value));
    if (invalid) {
      new import_obsidian.Notice("Dates must use YYYY-MM-DD.");
      return;
    }
    await this.onSave(this.values);
    this.close();
  }
};
var SmallActionMetadataModal = class extends import_obsidian.Modal {
  constructor(app, action, onSave) {
    super(app);
    this.action = action;
    this.values = {
      scheduledDate: action.scheduledDate,
      dueDate: action.dueDate,
      priority: action.priority === "medium" ? "normal" : action.priority
    };
    this.onSave = onSave;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Edit small action" });
    contentEl.createDiv({ cls: "kanban-rpm-modal-help", text: this.action.text });
    new import_obsidian.Setting(contentEl).setName("Scheduled date").setDesc("Leave empty to remove the scheduled date.").addText((input) => {
      input.inputEl.type = "date";
      input.setPlaceholder("YYYY-MM-DD");
      input.setValue(this.values.scheduledDate);
      input.onChange((value) => {
        this.values.scheduledDate = value.trim();
      });
    });
    new import_obsidian.Setting(contentEl).setName("Due date").setDesc("Leave empty to remove the due date.").addText((input) => {
      input.inputEl.type = "date";
      input.setPlaceholder("YYYY-MM-DD");
      input.setValue(this.values.dueDate);
      input.onChange((value) => {
        this.values.dueDate = value.trim();
      });
    });
    new import_obsidian.Setting(contentEl).setName("Priority").setDesc("Normal priority is stored by removing the @priority token.").addDropdown((dropdown) => {
      for (const [value, label] of [
        ["highest", "Highest"],
        ["high", "High"],
        ["normal", "Normal"],
        ["low", "Low"],
        ["lowest", "Lowest"]
      ]) {
        dropdown.addOption(value, label);
      }
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });
    new import_obsidian.Setting(contentEl.createDiv({ cls: "kanban-rpm-modal-footer" })).addButton((button) => {
      button.setButtonText("Save small action").setCta().onClick(() => {
        void this.save();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  async save() {
    const invalid = [this.values.scheduledDate, this.values.dueDate].find((value) => value && !/^\d{4}-\d{2}-\d{2}$/.test(value));
    if (invalid) {
      new import_obsidian.Notice("Dates must use YYYY-MM-DD.");
      return;
    }
    await this.onSave(this.values);
    this.close();
  }
};
var NewCommunicationSourceModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.values = {
      title: "",
      type: "meeting_internal",
      date: this.today(),
      participants: "",
      note: ""
    };
    this.suggestions = [];
  }
  async onOpen() {
    this.suggestions = await this.plugin.loadParticipantSuggestions();
    this.renderForm();
  }
  renderForm() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("kanban-rpm-card-modal");
    contentEl.createEl("h2", { text: "New communication source note" });
    contentEl.createDiv({
      cls: "kanban-rpm-modal-help",
      text: "Create a source note and add it to the yearly Communication Log. Project documents are not modified."
    });
    this.markRequired(new import_obsidian.Setting(contentEl).setName("Title")).addText((input) => {
      input.setPlaceholder("Weekly lab meeting");
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });
    const grid = contentEl.createDiv({ cls: "kanban-rpm-modal-grid" });
    this.markRequired(new import_obsidian.Setting(grid).setName("Type")).addDropdown((dropdown) => {
      for (const type of COMMUNICATION_TYPES) dropdown.addOption(type.id, type.label);
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (COMMUNICATION_TYPES.some((type) => type.id === value)) this.values.type = value;
      });
    });
    this.markRequired(new import_obsidian.Setting(grid).setName("Date")).addText((input) => {
      input.inputEl.type = "date";
      input.setValue(this.values.date);
      input.onChange((value) => {
        this.values.date = value.trim();
      });
    });
    new import_obsidian.Setting(contentEl).setName("Participants").setDesc("Comma or newline separated. You can also add frequent participants below.").addTextArea((input) => {
      input.setPlaceholder("Prof. Kim, vendor, collaborator");
      input.setValue(this.values.participants);
      this.participantsInput = input.inputEl;
      input.onChange((value) => {
        this.values.participants = value;
      });
    });
    this.renderParticipantSuggestions(contentEl);
    new import_obsidian.Setting(contentEl).setName("Note").addTextArea((input) => {
      input.setPlaceholder("Short note for the Communication Log");
      input.setValue(this.values.note);
      input.onChange((value) => {
        this.values.note = value;
      });
    });
    new import_obsidian.Setting(contentEl.createDiv({ cls: "kanban-rpm-modal-footer" })).addButton((button) => {
      button.setButtonText("Create source note").setCta().onClick(() => {
        void this.createSourceNote();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  renderParticipantSuggestions(container) {
    const box = container.createDiv({ cls: "kanban-rpm-participant-suggestions" });
    box.createDiv({ cls: "kanban-rpm-modal-help", text: this.suggestions.length ? "Frequent participants" : "No participant suggestions yet." });
    const list = box.createDiv({ cls: "kanban-rpm-participant-suggestion-list" });
    for (const suggestion of this.suggestions.slice(0, 24)) {
      const button = list.createEl("button", {
        cls: "kanban-rpm-participant-suggestion",
        text: `${suggestion.name} (${suggestion.count})`
      });
      button.addEventListener("click", () => this.addParticipant(suggestion.name));
    }
  }
  addParticipant(name) {
    const parts = this.parseParticipants(this.values.participants);
    if (!parts.some((part) => part === name)) parts.push(name);
    this.values.participants = parts.join(", ");
    if (this.participantsInput) this.participantsInput.value = this.values.participants;
  }
  parseParticipants(value) {
    return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  }
  async createSourceNote() {
    if (!this.values.title.trim()) {
      new import_obsidian.Notice("Title is required.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.values.date)) {
      new import_obsidian.Notice("Date must use YYYY-MM-DD.");
      return;
    }
    await this.plugin.createCommunicationSourceNote(this.values);
    this.close();
  }
  markRequired(setting, desc) {
    setting.nameEl.createSpan({ cls: "kanban-rpm-required", text: " *" });
    if (desc) setting.setDesc(desc);
    return setting;
  }
  today() {
    const now = /* @__PURE__ */ new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
};
var NewProjectCardModal = class extends import_obsidian.Modal {
  constructor(app, plugin, context = "inbox") {
    var _a;
    super(app);
    this.parentOptions = [];
    this.values = {
      title: "",
      type: "project",
      project: "",
      subproject: "",
      projects: "",
      subprojects: "",
      status: "inbox",
      priority: "3",
      workstreamType: "",
      nextAction: "",
      waitingFor: "",
      blocker: "",
      startDate: "",
      scheduledDate: "",
      nextReview: "",
      dueDate: "",
      dependsOn: "",
      blocks: "",
      sourceNotes: ""
    };
    this.plugin = plugin;
    this.context = typeof context === "string" ? { status: context } : context;
    this.values.status = (_a = this.context.status) != null ? _a : "inbox";
  }
  async onOpen() {
    this.parentOptions = await this.plugin.loadCards();
    this.applyContextDefaults();
    this.renderForm();
  }
  applyContextDefaults() {
    const project = this.context.projectTitle ? this.parentOptions.find((card) => card.type === "project" && card.title === this.context.projectTitle) : void 0;
    const subproject = this.context.subprojectTitle ? this.parentOptions.find((card) => card.type === "subproject" && card.title === this.context.subprojectTitle) : void 0;
    if (project) this.values.project = this.parentValue(project);
    if (subproject) {
      this.values.subproject = this.parentValue(subproject);
      if (!this.values.project && subproject.project) this.values.project = subproject.project;
    }
    if (project && subproject) this.values.type = "big_action";
    else if (project) this.values.type = "subproject";
    else this.values.type = "project";
  }
  renderForm() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("kanban-rpm-card-modal");
    contentEl.createEl("h2", { text: "New KanbanRPM living document" });
    this.markRequired(new import_obsidian.Setting(contentEl).setName("Title")).addText((input) => {
      input.setPlaceholder("TTT Manuscript");
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });
    const grid = contentEl.createDiv({ cls: "kanban-rpm-modal-grid" });
    this.addCoreFields(grid);
    new import_obsidian.Setting(contentEl).setName("Current focus").addTextArea((input) => {
      input.setPlaceholder("Write the current focus or first big action");
      input.setValue(this.values.nextAction);
      input.onChange((value) => {
        this.values.nextAction = value;
      });
    });
    this.addAdvancedFields(contentEl);
    new import_obsidian.Setting(contentEl.createDiv({ cls: "kanban-rpm-modal-footer" })).addButton((button) => {
      button.setButtonText("Create document").setCta().onClick(() => {
        void this.createCard();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  addCoreFields(grid) {
    this.markRequired(new import_obsidian.Setting(grid).setName("Status")).addDropdown((dropdown) => {
      for (const lane of this.plugin.settings.statuses) dropdown.addOption(lane.id, lane.label);
      dropdown.setValue(this.values.status);
      dropdown.onChange((value) => {
        if (isStatus(value)) this.values.status = value;
      });
    });
    this.markRequired(new import_obsidian.Setting(grid).setName("Type")).addDropdown((dropdown) => {
      dropdown.addOption("project", "Project");
      dropdown.addOption("subproject", "Subproject");
      dropdown.addOption("big_action", "Big Action");
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (value === "project" || value === "subproject" || value === "big_action") {
          this.values.type = value;
          this.values.project = "";
          this.values.subproject = "";
          this.renderForm();
        }
      });
    });
    this.addHierarchyDropdowns(grid);
    this.addPlanningFields(grid);
  }
  addPlanningFields(grid) {
    new import_obsidian.Setting(grid).setName("Priority").addDropdown((dropdown) => {
      for (const value of ["1", "2", "3", "4", "5"]) dropdown.addOption(value, `P${value}`);
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });
    for (const [key, label] of [
      ["startDate", "Start date"],
      ["scheduledDate", "Scheduled date"],
      ["nextReview", "Next review"],
      ["dueDate", "Due date"]
    ]) {
      new import_obsidian.Setting(grid).setName(label).addText((input) => {
        input.inputEl.type = "date";
        input.setPlaceholder("YYYY-MM-DD");
        input.setValue(this.values[key]);
        input.onChange((value) => {
          this.values[key] = value;
        });
      });
    }
  }
  addAdvancedFields(container) {
    const details = container.createEl("details", { cls: "kanban-rpm-modal-advanced" });
    details.open = this.plugin.settings.newCardAdvancedOpen;
    details.createEl("summary", { text: "Advanced metadata" });
    details.createDiv({
      cls: "kanban-rpm-modal-help",
      text: "Optional structured hints. Prefer writing rich context in the document body."
    });
    const grid = details.createDiv({ cls: "kanban-rpm-modal-grid" });
    this.addVocabularyDropdown(grid, "Category", "workstreamType", this.plugin.settings.categories);
    new import_obsidian.Setting(details).setName("Waiting for").addText((input) => {
      input.setValue(this.values.waitingFor);
      input.onChange((value) => {
        this.values.waitingFor = value;
      });
    });
    new import_obsidian.Setting(details).setName("Blocker").addText((input) => {
      input.setValue(this.values.blocker);
      input.onChange((value) => {
        this.values.blocker = value;
      });
    });
    this.addListField(details, "Source notes", "[[250506 Lab setup meeting]]", "sourceNotes");
    this.addListField(details, "Additional projects", "[[TTT]]\n[[Lab Setup]]", "projects");
    this.addListField(details, "Additional subprojects", "[[TTT Experiment]]\n[[Furnace Setup]]", "subprojects");
    this.addListField(details, "Preceded by", "[[Drawing]]\n[[Quotation]]", "dependsOn");
    this.addListField(details, "Followed by", "[[Purchase review]]", "blocks");
  }
  addVocabularyDropdown(grid, name, key, values, fallback = "") {
    new import_obsidian.Setting(grid).setName(name).addDropdown((dropdown) => {
      if (!fallback) dropdown.addOption("", "");
      for (const value of values) dropdown.addOption(value.id, value.label);
      dropdown.setValue(this.values[key] || fallback);
      dropdown.onChange((value) => {
        this.values[key] = value;
      });
    });
  }
  addHierarchyDropdowns(grid) {
    const hierarchy = grid.createDiv({ cls: "kanban-rpm-hierarchy-stack" });
    if (this.values.type === "project") {
      new import_obsidian.Setting(hierarchy).setName("Project scope").addDropdown((dropdown) => {
        dropdown.addOption("", "Top-level Project");
        dropdown.setDisabled(true);
      });
      return;
    }
    this.markRequired(new import_obsidian.Setting(hierarchy).setName("Project")).addDropdown((dropdown) => {
      dropdown.addOption("", "Choose project");
      for (const project of this.getProjectOptions()) dropdown.addOption(this.parentValue(project), project.title);
      dropdown.setValue(this.values.project);
      dropdown.onChange((value) => {
        this.values.project = value;
        this.values.subproject = "";
        this.renderForm();
      });
    });
    if (this.values.type === "big_action") {
      this.markRequired(new import_obsidian.Setting(hierarchy).setName("Subproject")).addDropdown((dropdown) => {
        dropdown.addOption("", this.values.project ? "Choose subproject" : "Choose project first");
        for (const subproject of this.getSubprojectOptions()) {
          dropdown.addOption(this.parentValue(subproject), subproject.title);
        }
        dropdown.setValue(this.values.subproject);
        dropdown.onChange((value) => {
          this.values.subproject = value;
        });
        dropdown.setDisabled(!this.values.project);
      });
    }
  }
  getProjectOptions() {
    return this.parentOptions.filter((card) => card.type === "project").sort((a, b) => a.title.localeCompare(b.title));
  }
  getSubprojectOptions() {
    if (!this.values.project) return [];
    const selectedProject = this.findCardByValue(this.values.project);
    if (!selectedProject) return [];
    return this.parentOptions.filter((card) => card.type === "subproject" && card.projectTitles.includes(selectedProject.title)).sort((a, b) => a.title.localeCompare(b.title));
  }
  findCardByValue(value) {
    return this.parentOptions.find((card) => this.parentValue(card) === value);
  }
  parentValue(card) {
    return `[[${card.file.basename}]]`;
  }
  async createCard() {
    var _a;
    if (!this.values.title.trim()) {
      new import_obsidian.Notice("KanbanRPM card needs a title.");
      return;
    }
    if (this.values.type !== "project" && !this.values.project.trim()) {
      new import_obsidian.Notice("Subproject and Big Action documents need a Project.");
      return;
    }
    if (this.values.type === "big_action" && ((_a = this.findCardByValue(this.values.subproject)) == null ? void 0 : _a.type) !== "subproject") {
      new import_obsidian.Notice("Big Action documents need a Subproject.");
      return;
    }
    await this.plugin.createCard(this.values);
    this.close();
  }
  markRequired(setting, desc) {
    setting.nameEl.createSpan({ cls: "kanban-rpm-required", text: " *" });
    if (desc) setting.setDesc(desc);
    return setting;
  }
  addListField(container, name, placeholder, key) {
    new import_obsidian.Setting(container).setName(name).setDesc("Comma or newline separated values").addTextArea((input) => {
      input.setPlaceholder(placeholder);
      input.setValue(this.values[key]);
      input.onChange((value) => {
        this.values[key] = value;
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var EditProjectCardModal = class extends import_obsidian.Modal {
  constructor(app, plugin, card) {
    super(app);
    this.parentOptions = [];
    this.plugin = plugin;
    this.card = card;
    this.values = {
      title: card.title,
      type: card.type,
      project: card.project,
      subproject: card.subproject,
      projects: card.projects.filter((link) => link !== card.project).join("\n"),
      subprojects: card.subprojects.filter((link) => link !== card.subproject).join("\n"),
      status: card.status,
      priority: String(card.priority),
      workstreamType: card.workstreamType,
      nextAction: card.nextAction,
      waitingFor: card.waitingFor,
      blocker: card.blocker,
      startDate: card.startDate,
      scheduledDate: card.scheduledDate,
      nextReview: card.nextReview,
      dueDate: card.dueDate,
      dependsOn: card.dependsOn.join("\n"),
      blocks: card.blocks.join("\n"),
      sourceNotes: card.sourceNotes.join("\n")
    };
  }
  async onOpen() {
    this.parentOptions = (await this.plugin.loadCards()).filter((card) => card.path !== this.card.path);
    this.inferMissingHierarchy();
    this.renderForm();
  }
  inferMissingHierarchy() {
    if (this.values.type !== "big_action" || this.values.project || !this.values.subproject) return;
    const subproject = this.parentOptions.find((card) => this.parentValue(card) === this.values.subproject);
    if (subproject == null ? void 0 : subproject.project) this.values.project = subproject.project;
  }
  renderForm() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("kanban-rpm-card-modal");
    contentEl.createEl("h2", { text: "Edit KanbanRPM living document" });
    this.markRequired(new import_obsidian.Setting(contentEl).setName("Title")).addText((input) => {
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });
    const grid = contentEl.createDiv({ cls: "kanban-rpm-modal-grid" });
    this.addCoreFields(grid);
    new import_obsidian.Setting(contentEl).setName("Current focus").addTextArea((input) => {
      input.setValue(this.values.nextAction);
      input.onChange((value) => {
        this.values.nextAction = value;
      });
    });
    this.addAdvancedFields(contentEl);
    new import_obsidian.Setting(contentEl.createDiv({ cls: "kanban-rpm-modal-footer" })).addButton((button) => {
      button.setButtonText("Save changes").setCta().onClick(() => {
        void this.saveChanges();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  addCoreFields(grid) {
    this.markRequired(new import_obsidian.Setting(grid).setName("Status")).addDropdown((dropdown) => {
      for (const lane of this.plugin.settings.statuses) dropdown.addOption(lane.id, lane.label);
      dropdown.setValue(this.values.status);
      dropdown.onChange((value) => {
        if (isStatus(value)) this.values.status = value;
      });
    });
    this.markRequired(new import_obsidian.Setting(grid).setName("Type")).addDropdown((dropdown) => {
      dropdown.addOption("project", "Project");
      dropdown.addOption("subproject", "Subproject");
      dropdown.addOption("big_action", "Big Action");
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (value === "project" || value === "subproject" || value === "big_action") {
          this.values.type = value;
          this.values.project = "";
          this.values.subproject = "";
          this.renderForm();
        }
      });
    });
    this.addHierarchyDropdowns(grid);
    this.addPlanningFields(grid);
  }
  addPlanningFields(grid) {
    new import_obsidian.Setting(grid).setName("Priority").addDropdown((dropdown) => {
      for (const value of ["1", "2", "3", "4", "5"]) dropdown.addOption(value, `P${value}`);
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });
    for (const [key, label] of [
      ["startDate", "Start date"],
      ["scheduledDate", "Scheduled date"],
      ["nextReview", "Next review"],
      ["dueDate", "Due date"]
    ]) {
      new import_obsidian.Setting(grid).setName(label).addText((input) => {
        input.inputEl.type = "date";
        input.setPlaceholder("YYYY-MM-DD");
        input.setValue(this.values[key]);
        input.onChange((value) => {
          this.values[key] = value;
        });
      });
    }
  }
  addAdvancedFields(container) {
    const details = container.createEl("details", { cls: "kanban-rpm-modal-advanced" });
    details.createEl("summary", { text: "Advanced metadata" });
    details.createDiv({
      cls: "kanban-rpm-modal-help",
      text: "Optional structured hints. Prefer writing rich context in the document body."
    });
    const grid = details.createDiv({ cls: "kanban-rpm-modal-grid" });
    this.addVocabularyDropdown(grid, "Category", "workstreamType", this.plugin.settings.categories);
    new import_obsidian.Setting(details).setName("Waiting for").addText((input) => {
      input.setValue(this.values.waitingFor);
      input.onChange((value) => {
        this.values.waitingFor = value;
      });
    });
    new import_obsidian.Setting(details).setName("Blocker").addText((input) => {
      input.setValue(this.values.blocker);
      input.onChange((value) => {
        this.values.blocker = value;
      });
    });
    this.addListField(details, "Source notes", "[[250506 Lab setup meeting]]", "sourceNotes");
    this.addListField(details, "Additional projects", "[[TTT]]\n[[Lab Setup]]", "projects");
    this.addListField(details, "Additional subprojects", "[[TTT Experiment]]\n[[Furnace Setup]]", "subprojects");
    this.addListField(details, "Preceded by", "[[Drawing]]\n[[Quotation]]", "dependsOn");
    this.addListField(details, "Followed by", "[[Purchase review]]", "blocks");
  }
  addVocabularyDropdown(grid, name, key, values, fallback = "") {
    new import_obsidian.Setting(grid).setName(name).addDropdown((dropdown) => {
      if (!fallback) dropdown.addOption("", "");
      for (const value of values) dropdown.addOption(value.id, value.label);
      dropdown.setValue(this.values[key] || fallback);
      dropdown.onChange((value) => {
        this.values[key] = value;
      });
    });
  }
  addHierarchyDropdowns(grid) {
    const hierarchy = grid.createDiv({ cls: "kanban-rpm-hierarchy-stack" });
    if (this.values.type === "project") {
      new import_obsidian.Setting(hierarchy).setName("Project scope").addDropdown((dropdown) => {
        dropdown.addOption("", "Top-level Project");
        dropdown.setDisabled(true);
      });
      return;
    }
    this.markRequired(new import_obsidian.Setting(hierarchy).setName("Project")).addDropdown((dropdown) => {
      dropdown.addOption("", "Choose project");
      for (const project of this.getProjectOptions()) dropdown.addOption(this.parentValue(project), project.title);
      if (this.values.project && !this.getProjectOptions().some((card) => this.parentValue(card) === this.values.project)) {
        dropdown.addOption(this.values.project, this.values.project);
      }
      dropdown.setValue(this.values.project);
      dropdown.onChange((value) => {
        this.values.project = value;
        this.values.subproject = "";
        this.renderForm();
      });
    });
    if (this.values.type === "big_action") {
      this.markRequired(new import_obsidian.Setting(hierarchy).setName("Subproject")).addDropdown((dropdown) => {
        dropdown.addOption("", this.values.project ? "Choose subproject" : "Choose project first");
        for (const subproject of this.getSubprojectOptions()) dropdown.addOption(this.parentValue(subproject), subproject.title);
        if (this.values.subproject && !this.getSubprojectOptions().some((card) => this.parentValue(card) === this.values.subproject)) {
          dropdown.addOption(this.values.subproject, this.values.subproject);
        }
        dropdown.setValue(this.values.subproject);
        dropdown.onChange((value) => {
          this.values.subproject = value;
        });
        dropdown.setDisabled(!this.values.project);
      });
    }
  }
  getProjectOptions() {
    return this.parentOptions.filter((card) => card.type === "project").sort((a, b) => a.title.localeCompare(b.title));
  }
  getSubprojectOptions() {
    if (!this.values.project) return [];
    const selectedProject = this.findCardByValue(this.values.project);
    if (!selectedProject) return [];
    return this.parentOptions.filter((card) => card.type === "subproject" && card.projectTitles.includes(selectedProject.title)).sort((a, b) => a.title.localeCompare(b.title));
  }
  findCardByValue(value) {
    return this.parentOptions.find((card) => this.parentValue(card) === value);
  }
  parentValue(card) {
    return `[[${card.file.basename}]]`;
  }
  async saveChanges() {
    var _a;
    if (!this.values.title.trim()) {
      new import_obsidian.Notice("KanbanRPM card needs a title.");
      return;
    }
    if (this.values.type !== "project" && !this.values.project.trim()) {
      new import_obsidian.Notice("Subproject and Big Action documents need a Project.");
      return;
    }
    if (this.values.type === "big_action" && ((_a = this.findCardByValue(this.values.subproject)) == null ? void 0 : _a.type) !== "subproject") {
      new import_obsidian.Notice("Big Action documents need a Subproject.");
      return;
    }
    await this.plugin.updateCard(this.card, this.values);
    this.close();
  }
  markRequired(setting, desc) {
    setting.nameEl.createSpan({ cls: "kanban-rpm-required", text: " *" });
    if (desc) setting.setDesc(desc);
    return setting;
  }
  addListField(container, name, placeholder, key) {
    new import_obsidian.Setting(container).setName(name).setDesc("Comma or newline separated values").addTextArea((input) => {
      input.setPlaceholder(placeholder);
      input.setValue(this.values[key]);
      input.onChange((value) => {
        this.values[key] = value;
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ResearchLogModal = class extends import_obsidian.Modal {
  constructor(app, kind, initial, moduleOptions, onSave) {
    super(app);
    this.values = { kind, ...initial };
    this.moduleOptions = moduleOptions;
    this.onSave = onSave;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.values.kind === "experiment" ? "Add Experiment Log" : "Add Analysis Log" });
    contentEl.createDiv({
      cls: "kanban-rpm-modal-help",
      text: "Add a compact log row to this Big Action. You can refine the living document afterwards."
    });
    this.addText("Date", "YYYY-MM-DD", "date");
    this.addModuleField();
    this.addText(this.values.kind === "experiment" ? "Sample" : "Dataset / Sample", "[[Sample]]", "subject");
    this.addText(this.values.kind === "experiment" ? "Conditions" : "Method", "", "conditionsOrMethod");
    this.addText("Result", "", "result");
    this.addText("Link", "[[Current card]]", "link");
    new import_obsidian.Setting(contentEl.createDiv({ cls: "kanban-rpm-modal-footer" })).addButton((button) => {
      button.setButtonText("Add log row").setCta().onClick(() => {
        void this.save();
      });
    }).addButton((button) => {
      button.setButtonText("Skip").onClick(() => this.close());
    });
  }
  addText(label, placeholder, key) {
    new import_obsidian.Setting(this.contentEl).setName(label).addText((input) => {
      var _a;
      input.setPlaceholder(placeholder);
      input.setValue(String((_a = this.values[key]) != null ? _a : ""));
      input.onChange((value) => {
        this.values[key] = value;
      });
    });
  }
  addModuleField() {
    if (this.moduleOptions.length) {
      new import_obsidian.Setting(this.contentEl).setName("Existing module").setDesc("Choose an existing experiment/analysis type, or type a new one below.").addDropdown((dropdown) => {
        dropdown.addOption("", "New / custom");
        for (const module2 of this.moduleOptions) dropdown.addOption(module2, module2);
        dropdown.setValue(this.moduleOptions.includes(this.values.module) ? this.values.module : "");
        dropdown.onChange((value) => {
          if (value) this.values.module = value;
          this.renderForm();
        });
      });
    }
    this.addText("Module heading", this.values.kind === "experiment" ? "Stacking" : "DF analysis", "module");
  }
  renderForm() {
    this.onOpen();
  }
  async save() {
    await this.onSave(this.values);
    this.close();
  }
};
var ConfirmCardActionModal = class extends import_obsidian.Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", { text: this.options.message });
    new import_obsidian.Setting(contentEl).addButton((button) => {
      button.setButtonText(this.options.confirmText).setWarning().onClick(async () => {
        await this.options.onConfirm();
        this.close();
      });
    }).addButton((button) => {
      button.setButtonText("Cancel").onClick(() => this.close());
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src-kanbanrpm/view-models.ts
var TABLE_COLUMNS = [
  { key: "title", label: "Title", width: 240 },
  { key: "project", label: "Project", width: 220 },
  { key: "type", label: "Type", width: 120 },
  { key: "status", label: "Status", width: 120 },
  { key: "priority", label: "Priority", width: 90 },
  { key: "date", label: "Due / Review", width: 150 },
  { key: "dependencies", label: "Flow", width: 120 },
  { key: "actions", label: "Actions", width: 130 }
];

// src-kanbanrpm/board-view.ts
var KanbanRPMView = class extends import_obsidian2.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.cards = [];
    this.archivedCards = [];
    this.researchLogs = [];
    this.actions = [];
    this.issues = [];
    this.searchQuery = "";
    this.projectFilter = "";
    this.subprojectFilter = "";
    this.workstreamTypeFilter = "";
    this.viewMode = "board";
    this.viewportMode = "desktop";
    this.viewportWidth = 0;
    this.didApplyPhoneDefaultView = false;
    this.phoneBoardStatus = "";
    this.tableSortKey = "priority";
    this.tableSortDirection = "asc";
    this.tableColumnWidths = /* @__PURE__ */ new Map();
    this.timelineBaseDate = todayIso();
    this.timelineRangeStart = "";
    this.timelineRangeEnd = "";
    this.timelineSearchQuery = "";
    this.timelineScope = "all";
    this.timelineMemoVisible = true;
    this.timelineSidebarCollapsed = false;
    this.ganttRangeStart = "";
    this.ganttRangeEnd = "";
    this.boardStatusFilter = /* @__PURE__ */ new Set();
    this.timelineStatusFilter = /* @__PURE__ */ new Set();
    this.ganttScale = "month-week";
    this.showGanttConnectors = true;
    this.collapsedGanttNodes = /* @__PURE__ */ new Set();
    this.groupByProject = true;
    this.toolbarExpanded = false;
    this.showDataWarnings = false;
    this.showCommandCenter = false;
    this.showActionIndex = false;
    this.showResearchIndex = false;
    this.panelsExpanded = false;
    this.showClosedProjects = false;
    this.showBoardConnectors = true;
    this.showBoardSubprojects = true;
    this.showBoardBigActions = true;
    this.showGanttSubprojects = true;
    this.showGanttBigActions = true;
    this.boardZoom = 1;
    this.timelineZoom = 1;
    this.ganttZoom = 1;
    this.timelineScrollLeft = null;
    this.timelineScrollTop = null;
    this.projectNotesCollapsed = false;
    this.phoneFiltersExpanded = false;
    this.phoneTimelineControlsExpanded = false;
    this.expandedSmallActions = /* @__PURE__ */ new Set();
    this.collapsedSmallActions = /* @__PURE__ */ new Set();
    this.expandedSmallActionSections = /* @__PURE__ */ new Set();
    this.collapsedSmallActionSections = /* @__PURE__ */ new Set();
    this.plugin = plugin;
    this.loadViewFilters("board");
    this.boardStatusFilter = new Set(plugin.settings.boardStatusFilter);
    this.showBoardConnectors = plugin.settings.showBoardConnectors;
    this.showBoardSubprojects = plugin.settings.showBoardSubprojects;
    this.showBoardBigActions = plugin.settings.showBoardBigActions;
    this.showGanttSubprojects = plugin.settings.showGanttSubprojects;
    this.showGanttBigActions = plugin.settings.showGanttBigActions;
    this.boardZoom = plugin.settings.boardZoom;
    this.timelineZoom = plugin.settings.timelineZoom;
    this.timelineScrollLeft = plugin.settings.timelineScrollLeft;
    this.timelineScrollTop = plugin.settings.timelineScrollTop;
    this.ganttZoom = plugin.settings.ganttZoom;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "KanbanRPM";
  }
  getIcon() {
    return "layout-dashboard";
  }
  async onOpen() {
    this.registerDomEvent(window, "resize", () => {
      this.render();
    });
    await this.refresh();
  }
  async refresh() {
    await this.plugin.applyDueReviews();
    this.cards = await this.plugin.loadCards();
    this.archivedCards = await this.plugin.loadArchivedCards();
    this.researchLogs = await this.plugin.loadResearchLogs();
    this.actions = await this.plugin.collectActionIndex(this.cards);
    this.issues = this.plugin.validateCards(this.cards);
    if (this.ensureViewFilters()) await this.saveViewFilters();
    this.render();
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("kanban-rpm-view");
    this.updateViewportMode(container);
    this.applyPhoneDefaultView();
    const visibleCards = this.filterCards(this.cards);
    const visibleArchivedCards = this.filterCards(this.archivedCards, { ignoreHierarchyFilters: true });
    const visibleBoardCards = visibleCards.filter((card) => card.type !== "project");
    const toolbar = container.createDiv({ cls: "kanban-rpm-toolbar" });
    const title = toolbar.createDiv({ cls: "kanban-rpm-title" });
    title.createEl("h2", { text: "KanbanRPM" });
    title.createSpan({
      cls: "kanban-rpm-count",
      text: this.searchQuery ? `${visibleBoardCards.length} of ${this.cards.length} cards - ${this.viewMode}` : `${this.viewMode === "archive" ? visibleArchivedCards.length : visibleBoardCards.length} cards - ${this.viewMode}`
    });
    const actions = toolbar.createDiv({ cls: "kanban-rpm-actions" });
    const search = actions.createEl("input", {
      cls: "kanban-rpm-search",
      attr: {
        type: "search",
        placeholder: "Search cards",
        value: this.searchQuery,
        "aria-label": "Search KanbanRPM cards"
      }
    });
    search.addEventListener("input", () => {
      this.searchQuery = search.value;
      this.render();
    });
    if (this.searchQuery) {
      actions.createEl("button", { text: "Clear" }).addEventListener("click", () => {
        this.searchQuery = "";
        this.render();
      });
    }
    this.renderViewSwitcher(actions);
    if (this.isPhoneViewport()) {
      const quick = actions.createDiv({ cls: "kanban-rpm-phone-quick-actions" });
      this.createIconButton(quick, "plus", "New document", "kanban-rpm-phone-action").addEventListener("click", () => {
        new NewProjectCardModal(this.app, this.plugin, this.newDocumentContext()).open();
      });
      if (this.viewMode === "board") {
        quick.createEl("button", { cls: "kanban-rpm-phone-action", text: this.groupByProject ? "Flat" : "Group" }).addEventListener("click", () => {
          this.groupByProject = !this.groupByProject;
          this.render();
        });
      }
      this.createIconButton(quick, "refresh-cw", "Refresh", "kanban-rpm-phone-action").addEventListener("click", () => {
        void this.refresh();
      });
      quick.createEl("button", { cls: "kanban-rpm-phone-action", text: this.toolbarExpanded ? "Less" : "More" }).addEventListener("click", () => {
        this.toolbarExpanded = !this.toolbarExpanded;
        this.render();
      });
    } else {
      actions.createEl("button", { text: this.isCompactViewport() ? "New" : "New document" }).addEventListener("click", () => {
        new NewProjectCardModal(this.app, this.plugin, this.newDocumentContext()).open();
      });
      if (this.viewMode === "board") {
        actions.createEl("button", { text: this.groupByProject ? "Flat board" : this.getGroupingLabel() }).addEventListener("click", () => {
          this.groupByProject = !this.groupByProject;
          this.render();
        });
      }
      actions.createEl("button", { text: this.isCompactViewport() ? "Refr." : "Refresh" }).addEventListener("click", () => {
        void this.refresh();
      });
      actions.createEl("button", { text: this.toolbarExpanded ? "Less" : "More" }).addEventListener("click", () => {
        this.toolbarExpanded = !this.toolbarExpanded;
        this.render();
      });
    }
    if (this.toolbarExpanded) {
      const secondary = container.createDiv({ cls: "kanban-rpm-toolbar-secondary" });
      secondary.createEl("button", { text: "New communication note" }).addEventListener("click", () => {
        new NewCommunicationSourceModal(this.app, this.plugin).open();
      });
      secondary.createEl("button", { text: "Management brief" }).addEventListener("click", () => {
        void this.plugin.writeManagementBrief(visibleCards);
      });
      secondary.createEl("button", { text: "Generate LLM context" }).addEventListener("click", () => {
        void this.plugin.writeLLMContext(visibleCards);
      });
      secondary.createEl("button", { text: "Normalize order" }).addEventListener("click", () => {
        void this.plugin.normalizeCardOrder();
      });
    }
    this.renderFilters(container, visibleCards, visibleBoardCards);
    if (this.showDataWarnings) this.renderDataWarnings(container, visibleCards);
    if (this.showCommandCenter) this.renderCommandCenter(container, visibleBoardCards);
    if (this.showActionIndex) this.renderActionIndexGrouped(container, visibleBoardCards);
    if (this.showResearchIndex) this.renderResearchIndex(container, this.researchLogs);
    this.renderProjectNotes(container);
    if (this.viewMode === "archive") {
      this.renderArchiveView(container, visibleArchivedCards);
      return;
    }
    if (this.viewMode === "gantt") {
      this.renderGanttView(container, visibleBoardCards);
      return;
    }
    if (this.viewMode === "table") {
      this.renderTableView(container, visibleBoardCards);
      return;
    }
    if (this.viewMode === "timeline") {
      this.renderTimelineView(container, visibleBoardCards);
      return;
    }
    this.renderBoardView(container, visibleBoardCards);
  }
  renderViewSwitcher(container) {
    const switcher = container.createDiv({ cls: "kanban-rpm-view-switcher" });
    for (const mode of ["board", "table", "timeline", "gantt", "archive"]) {
      const label = this.isCompactViewport() ? this.compactViewLabel(mode) : mode[0].toUpperCase() + mode.slice(1);
      const button = switcher.createDiv({
        cls: this.viewMode === mode ? "kanban-rpm-view-button is-active" : "kanban-rpm-view-button",
        text: label,
        attr: { "aria-pressed": String(this.viewMode === mode) }
      });
      button.setAttr("role", "button");
      button.setAttr("tabindex", "0");
      button.addEventListener("click", () => {
        void this.saveViewFilters();
        this.viewMode = mode;
        this.loadViewFilters(mode);
        this.render();
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        void this.saveViewFilters();
        this.viewMode = mode;
        this.loadViewFilters(mode);
        this.render();
      });
    }
  }
  compactViewLabel(mode) {
    if (mode === "timeline") return "Time";
    if (mode === "archive") return "Arch";
    return mode[0].toUpperCase() + mode.slice(1);
  }
  updateViewportMode(container) {
    const width = container.clientWidth || this.containerEl.clientWidth || window.innerWidth;
    this.viewportWidth = width;
    const appMobile = Boolean(this.app.isMobile);
    const nextMode = width <= 640 ? "phone" : width <= 1024 || import_obsidian3.Platform.isMobile && appMobile ? "tablet" : "desktop";
    this.viewportMode = nextMode;
    container.removeClass("is-phone", "is-tablet", "is-desktop");
    container.addClass(`is-${nextMode}`);
  }
  isPhoneViewport() {
    return this.viewportMode === "phone";
  }
  isCompactViewport() {
    return this.viewportMode !== "desktop" || this.viewportWidth <= 1450;
  }
  applyPhoneDefaultView() {
    if (!this.isPhoneViewport() || this.didApplyPhoneDefaultView) return;
    this.didApplyPhoneDefaultView = true;
    this.projectNotesCollapsed = true;
    this.timelineSidebarCollapsed = true;
    if (this.viewMode === "archive") return;
    this.viewMode = "timeline";
    this.loadViewFilters("timeline");
  }
  getGroupingLabel() {
    return this.projectFilter ? "Group by Subproject" : "Group by Project";
  }
  filterCards(cards, options = {}) {
    const query = this.searchQuery.trim().toLowerCase();
    return cards.filter((card) => {
      if (!this.showClosedProjects && !options.ignoreHierarchyFilters && this.isHiddenByClosedProject(card)) return false;
      if (!options.ignoreHierarchyFilters && this.projectFilter && !card.projectTitles.includes(this.projectFilter)) return false;
      if (!options.ignoreHierarchyFilters && this.subprojectFilter && !card.subprojectTitles.includes(this.subprojectFilter)) return false;
      if (this.workstreamTypeFilter && card.workstreamType !== this.workstreamTypeFilter) return false;
      if (!query) return true;
      return this.getSearchText(card).includes(query);
    });
  }
  getSearchText(card) {
    return [
      card.title,
      card.breadcrumb,
      card.projectTitle,
      card.subprojectTitle,
      ...card.projectTitles,
      ...card.subprojectTitles,
      card.projectState,
      card.status,
      `p${card.priority}`,
      String(card.priority),
      card.workstreamType,
      card.nextAction,
      card.waitingFor,
      card.blocker,
      card.startDate,
      card.scheduledDate,
      card.nextReview,
      card.dueDate,
      ...card.precededBy,
      ...card.followedBy,
      ...card.sourceNotes
    ].join(" ").toLowerCase();
  }
  renderFilters(container, visibleCards, visibleBoardCards) {
    if (this.isPhoneViewport()) {
      this.renderPhoneFilters(container, visibleCards, visibleBoardCards);
      return;
    }
    const filters = container.createDiv({ cls: "kanban-rpm-filters" });
    this.renderSelectFilter(filters, "Project", this.projectFilter, this.uniqueValues("projectTitle"), (value) => {
      this.projectFilter = value;
      this.subprojectFilter = "";
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(filters, "Subproject", this.subprojectFilter, this.subprojectFilterValues(), (value) => {
      this.subprojectFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(filters, "Category", this.workstreamTypeFilter, this.uniqueCategoryValues(), (value) => {
      this.workstreamTypeFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    filters.createEl("button", {
      cls: this.showClosedProjects ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: this.isCompactViewport() ? `Closed ${this.showClosedProjects ? "on" : "off"}` : this.showClosedProjects ? "Showing closed" : "Show closed projects",
      attr: { "aria-pressed": String(this.showClosedProjects) }
    }).addEventListener("click", () => {
      this.showClosedProjects = !this.showClosedProjects;
      if (!this.showClosedProjects && this.projectFilter && this.isProjectTitleClosed(this.projectFilter)) {
        this.projectFilter = "";
        this.subprojectFilter = "";
        void this.saveViewFilters();
      }
      this.render();
    });
    if (this.projectFilter || this.subprojectFilter || this.workstreamTypeFilter) {
      filters.createEl("button", { text: "Clear filters" }).addEventListener("click", () => {
        this.projectFilter = "";
        this.subprojectFilter = "";
        this.workstreamTypeFilter = "";
        void this.saveViewFilters();
        this.render();
      });
    }
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const visibleBoardPaths = new Set(visibleBoardCards.map((card) => card.path));
    const warningCount = this.issues.filter((issue) => visiblePaths.has(issue.cardPath)).length;
    const actionCount = this.actions.filter((action) => visibleBoardPaths.has(action.cardPath)).length;
    const researchCount = this.researchLogs.length;
    const activePanelCount = [this.showDataWarnings, this.showCommandCenter, this.showActionIndex, this.showResearchIndex].filter(Boolean).length;
    const panelWrap = filters.createDiv({ cls: "kanban-rpm-panel-menu" });
    panelWrap.createEl("button", {
      cls: this.panelsExpanded || activePanelCount ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: activePanelCount ? `Panels (${activePanelCount})` : "Panels",
      attr: { "aria-expanded": String(this.panelsExpanded) }
    }).addEventListener("click", () => {
      this.panelsExpanded = !this.panelsExpanded;
      this.render();
    });
    if (this.panelsExpanded) this.renderPanelToggles(container, warningCount, actionCount, researchCount);
  }
  renderPanelToggles(container, warningCount, actionCount, researchCount) {
    const toggles = container.createDiv({ cls: "kanban-rpm-panel-toggles kanban-rpm-panel-toggles-inline" });
    this.renderPanelToggle(toggles, "Data warnings", this.showDataWarnings, warningCount, () => {
      this.showDataWarnings = !this.showDataWarnings;
      this.render();
    });
    this.renderPanelToggle(toggles, "Command center", this.showCommandCenter, void 0, () => {
      this.showCommandCenter = !this.showCommandCenter;
      this.render();
    });
    this.renderPanelToggle(toggles, "Action index", this.showActionIndex, actionCount, () => {
      this.showActionIndex = !this.showActionIndex;
      this.render();
    });
    this.renderPanelToggle(toggles, "Research index", this.showResearchIndex, researchCount, () => {
      this.showResearchIndex = !this.showResearchIndex;
      this.render();
    });
  }
  renderPanelToggle(container, label, active, count, onClick) {
    const text2 = count === void 0 ? label : `${label} (${count})`;
    const button = container.createEl("button", {
      cls: active ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: text2,
      attr: { "aria-pressed": String(active) }
    });
    button.addEventListener("click", onClick);
  }
  newDocumentContext(status = "inbox") {
    return {
      status,
      projectTitle: this.projectFilter || void 0,
      subprojectTitle: this.subprojectFilter || void 0
    };
  }
  renderSelectFilter(container, label, currentValue, values, onChange) {
    const wrap = container.createDiv({ cls: "kanban-rpm-filter" });
    wrap.createSpan({ text: label });
    const select = wrap.createEl("select");
    select.createEl("option", { text: "All", attr: { value: "" } });
    for (const value of values) {
      const id = typeof value === "string" ? value : value.id;
      const optionLabel = typeof value === "string" ? value : value.label;
      select.createEl("option", { text: optionLabel, attr: { value: id } });
    }
    select.value = currentValue;
    select.addEventListener("change", () => onChange(select.value));
  }
  uniqueValues(field) {
    if (field === "projectTitle") {
      const cards2 = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
      return Array.from(new Set(cards2.flatMap((card) => card.projectTitles).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }
    const cards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
    return Array.from(new Set(cards.map((card) => card[field]).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }
  subprojectFilterValues() {
    const baseCards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
    const cards = this.projectFilter ? baseCards.filter((card) => card.projectTitles.includes(this.projectFilter)) : baseCards;
    return Array.from(new Set(cards.flatMap((card) => card.subprojectTitles).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }
  uniqueCategoryValues() {
    const configured = this.plugin.settings.categories;
    const configuredIds = new Set(configured.map((category) => category.id));
    const cards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
    const unknown = Array.from(new Set(cards.map((card) => card.workstreamType).filter((category) => category && !configuredIds.has(category)))).sort(
      (a, b) => a.localeCompare(b)
    );
    return [...configured, ...unknown.map((id) => ({ id, label: id }))];
  }
  isProjectTitleClosed(title) {
    return this.cards.some((card) => card.type === "project" && card.title === title && card.projectState === "closed");
  }
  closedProjectTitles() {
    return new Set(this.cards.filter((card) => card.type === "project" && card.projectState === "closed").map((card) => card.title));
  }
  isHiddenByClosedProject(card) {
    const closedProjects = this.closedProjectTitles();
    if (card.type === "project") return card.projectState === "closed";
    if (!card.projectTitles.length) return false;
    return card.projectTitles.some((title) => closedProjects.has(title)) && card.projectTitles.every((title) => closedProjects.has(title));
  }
  renderProjectNotes(container) {
    if (this.isPhoneViewport() && this.projectNotesCollapsed) return;
    const projects = this.cards.filter((card) => card.type === "project").filter((card) => this.showClosedProjects || card.projectState !== "closed").filter((card) => !this.projectFilter || card.title === this.projectFilter || card.projectTitles.includes(this.projectFilter)).sort((a, b) => a.title.localeCompare(b.title));
    const panel = container.createDiv({ cls: this.projectNotesCollapsed ? "kanban-rpm-project-strip is-collapsed" : "kanban-rpm-project-strip" });
    const header = panel.createDiv({ cls: "kanban-rpm-project-strip-header" });
    header.createEl("h3", { text: this.projectFilter ? "Project note" : "Project notes" });
    const actions = header.createDiv({ cls: "kanban-rpm-project-strip-actions" });
    actions.createSpan({ text: `${projects.length} project${projects.length === 1 ? "" : "s"}` });
    actions.createEl("button", { text: this.projectNotesCollapsed ? "Expand" : "Collapse" }).addEventListener("click", () => {
      this.projectNotesCollapsed = !this.projectNotesCollapsed;
      this.render();
    });
    if (this.projectNotesCollapsed) return;
    if (!projects.length) {
      panel.createDiv({ cls: "kanban-rpm-empty", text: "No project notes match the current Project filter." });
      return;
    }
    const list = panel.createDiv({ cls: "kanban-rpm-project-note-list" });
    for (const project of projects) {
      const note = list.createDiv({ cls: project.projectState === "closed" ? "kanban-rpm-project-note kanban-rpm-type-project is-closed" : "kanban-rpm-project-note kanban-rpm-type-project" });
      note.style.setProperty("--rpm-project-color", this.projectColor(project.colorKey));
      const title = note.createEl("button", { cls: "kanban-rpm-project-note-title", text: project.title });
      title.addEventListener("click", () => {
        void this.plugin.openCard(project);
      });
      const meta = note.createDiv({ cls: "kanban-rpm-project-note-meta" });
      if (project.projectState === "closed") this.renderStatusBadge(meta, "closed", "closed");
      if (project.status) this.renderStatusBadge(meta, project.status);
      if (project.workstreamType) meta.createSpan({ text: this.categoryLabel(project.workstreamType) });
      meta.createEl("button", { text: project.projectState === "closed" ? "Reopen project" : "Close project" }).addEventListener("click", () => {
        if (project.projectState === "closed") {
          void this.plugin.updateProjectState(project, "active");
          return;
        }
        new ConfirmCardActionModal(this.app, {
          title: "Close project",
          message: `Hide "${project.title}" and cards that only belong to this Project from default KanbanRPM views? Child card statuses will not be changed.`,
          confirmText: "Close project",
          onConfirm: async () => {
            if (this.projectFilter === project.title) {
              this.projectFilter = "";
              this.subprojectFilter = "";
              void this.saveViewFilters();
            }
            await this.plugin.updateProjectState(project, "closed");
          }
        }).open();
      });
      if (project.nextAction) note.createDiv({ cls: "kanban-rpm-project-note-focus", text: project.nextAction });
    }
  }
  renderDataWarnings(container, visibleCards) {
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const issues = this.issues.filter((issue) => visiblePaths.has(issue.cardPath));
    const errors = issues.filter((issue) => issue.level === "error").length;
    const warnings = issues.length - errors;
    const panel = container.createDiv({ cls: "kanban-rpm-data-warnings" });
    const header = panel.createDiv({ cls: "kanban-rpm-data-warnings-header" });
    header.createEl("h3", { text: "Data warnings" });
    const headerActions = header.createDiv({ cls: "kanban-rpm-panel-actions" });
    headerActions.createSpan({ text: `${errors} errors - ${warnings} warnings` });
    if (!issues.length) {
      panel.createDiv({ cls: "kanban-rpm-empty", text: "No data warnings in the current view." });
      return;
    }
    for (const issue of issues.slice(0, 8)) {
      const row = panel.createDiv({ cls: `kanban-rpm-issue kanban-rpm-issue-${issue.level}` });
      row.createSpan({ cls: "kanban-rpm-issue-card", text: issue.cardTitle });
      row.createSpan({ cls: "kanban-rpm-issue-field", text: issue.field });
      row.createSpan({ cls: "kanban-rpm-issue-message", text: issue.message });
      row.addEventListener("click", () => {
        const card = this.cards.find((item) => item.path === issue.cardPath);
        if (card) void this.plugin.openCard(card);
      });
    }
    if (issues.length > 8) {
      panel.createDiv({ cls: "kanban-rpm-issue-more", text: `+${issues.length - 8} more warnings` });
    }
  }
  renderCommandCenter(container, visibleCards) {
    const panel = container.createDiv({ cls: "kanban-rpm-command-center" });
    const header = panel.createDiv({ cls: "kanban-rpm-command-center-header" });
    header.createEl("h3", { text: "Command center" });
    const headerActions = header.createDiv({ cls: "kanban-rpm-panel-actions" });
    const reviewCards = visibleCards.filter((card) => isPastDate(card.nextReview) || isDueSoon(card.nextReview) || isPastDate(card.scheduledDate) || isDueSoon(card.scheduledDate) || isPastDate(card.dueDate) || isDueSoon(card.dueDate)).sort((a, b) => toDateSortValue(a).localeCompare(toDateSortValue(b))).slice(0, 6);
    headerActions.createSpan({ text: "review, waiting, blockers, flow" });
    headerActions.createEl("button", { text: "Timeline review" }).addEventListener("click", () => {
      this.viewMode = "timeline";
      this.timelineScope = "review";
      this.showCommandCenter = false;
      this.render();
    });
    const grid = panel.createDiv({ cls: "kanban-rpm-command-grid" });
    const waitingStatus = this.getConfiguredStatusId("waiting");
    const blockedStatus = this.getConfiguredStatusId("blocked");
    const waitingCards = visibleCards.filter((card) => card.status === waitingStatus || Boolean(card.waitingFor)).sort(compareCards).slice(0, 6);
    const blockedCards = visibleCards.filter((card) => card.status === blockedStatus || Boolean(card.blocker) || card.blockedBy.length).sort(compareCards).slice(0, 6);
    const dependencyCards = visibleCards.filter((card) => card.precededBy.length || card.followedBy.length).sort((a, b) => b.precededBy.length + b.followedBy.length - (a.precededBy.length + a.followedBy.length)).slice(0, 6);
    this.renderCommandSection(grid, "Review queue", reviewCards, (card) => {
      const date = card.scheduledDate || card.nextReview || card.dueDate || "no date";
      return `${date} - ${card.nextAction || card.workstreamType || card.status}`;
    });
    this.renderCommandSection(grid, "Waiting", waitingCards, (card) => card.waitingFor || card.nextAction || card.status);
    this.renderCommandSection(grid, "Blocked", blockedCards, (card) => card.blocker || card.nextAction || card.status);
    this.renderCommandSection(grid, "Flow", dependencyCards, (card) => {
      const counts = [];
      if (card.precededBy.length) counts.push(`${card.precededBy.length} preceded`);
      if (card.followedBy.length) counts.push(`${card.followedBy.length} followed`);
      return counts.join(" - ") || card.workstreamType || card.status;
    });
  }
  renderCommandSection(container, title, cards, subtitle) {
    const section = container.createDiv({ cls: "kanban-rpm-command-section" });
    const header = section.createDiv({ cls: "kanban-rpm-command-section-header" });
    header.createSpan({ text: title });
    header.createSpan({ text: String(cards.length) });
    if (!cards.length) {
      section.createDiv({ cls: "kanban-rpm-command-empty", text: "Clear" });
      return;
    }
    for (const card of cards) {
      const row = section.createDiv({ cls: "kanban-rpm-command-card" });
      row.createDiv({ cls: "kanban-rpm-command-card-title", text: card.title });
      row.createDiv({ cls: "kanban-rpm-command-card-subtitle", text: subtitle(card) });
      row.addEventListener("click", () => {
        void this.plugin.openCard(card);
      });
    }
  }
  resolveDependencyTarget(sourceCard, link) {
    const file = this.plugin.resolveLinkedFile(link, sourceCard.path);
    if (!file) return {};
    return { file, card: this.cards.find((card) => card.path === file.path) };
  }
  cleanWikiLabel(link) {
    return link.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0];
  }
  svgEl(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }
  renderActionIndexGrouped(container, visibleCards) {
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const actions = this.actions.filter((action) => visiblePaths.has(action.cardPath));
    const grouped = this.groupActionsByCard(actions);
    const visibleGroups = grouped.slice(0, 12);
    const panel = container.createDiv({ cls: "kanban-rpm-action-index" });
    const header = panel.createDiv({ cls: "kanban-rpm-action-index-header" });
    header.createEl("h3", { text: "Action index" });
    const headerActions = header.createDiv({ cls: "kanban-rpm-panel-actions" });
    headerActions.createSpan({ text: `${actions.length} actions - ${grouped.length} cards` });
    if (!actions.length) {
      panel.createDiv({ cls: "kanban-rpm-empty", text: "No linked unchecked actions found." });
      return;
    }
    for (const group of visibleGroups) {
      const groupEl = panel.createDiv({ cls: "kanban-rpm-action-group" });
      const groupHeader = groupEl.createDiv({ cls: "kanban-rpm-action-group-header" });
      groupHeader.createSpan({ text: group.cardTitle });
      groupHeader.createSpan({ text: `${group.actions.length} actions` });
      for (const action of group.actions.slice(0, 6)) {
        this.renderActionRow(groupEl, action);
      }
      if (group.actions.length > 6) {
        groupEl.createDiv({ cls: "kanban-rpm-action-more", text: `+${group.actions.length - 6} more actions` });
      }
    }
    if (grouped.length > visibleGroups.length) {
      panel.createDiv({ cls: "kanban-rpm-action-more", text: `+${grouped.length - visibleGroups.length} more cards` });
    }
  }
  groupActionsByCard(actions) {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const action of actions) {
      const existing = (_a = map.get(action.cardPath)) != null ? _a : {
        cardPath: action.cardPath,
        cardTitle: action.cardTitle,
        actions: []
      };
      existing.actions.push(action);
      map.set(action.cardPath, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.actions.length - a.actions.length || a.cardTitle.localeCompare(b.cardTitle));
  }
  renderActionRow(container, action) {
    const row = container.createDiv({ cls: "kanban-rpm-action-row is-clickable" });
    row.createDiv({ cls: "kanban-rpm-action-text", text: action.text });
    row.createDiv({
      cls: "kanban-rpm-action-source",
      text: action.recurring ? `${action.sourceLabel} - recurring` : `${action.sourceLabel}:${action.lineNumber}`
    });
    const rowActions = row.createDiv({ cls: "kanban-rpm-action-buttons" });
    rowActions.createEl("button", { text: action.recurring ? "Open card" : "Open source" }).addEventListener("click", (event) => {
      event.stopPropagation();
      void this.plugin.openFilePath(action.sourcePath);
    });
    rowActions.createEl("button", { text: "Set next" }).addEventListener("click", (event) => {
      event.stopPropagation();
      void this.plugin.setNextAction(action.cardPath, action.text);
    });
    if (!action.recurring) {
      rowActions.createEl("button", { text: "Promote" }).addEventListener("click", (event) => {
        event.stopPropagation();
        void this.plugin.promoteActionToBigAction(action);
      });
    }
    row.addEventListener("click", () => {
      void this.plugin.openFilePath(action.sourcePath);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") void this.plugin.openFilePath(action.sourcePath);
    });
    row.setAttr("role", "button");
    row.setAttr("tabindex", "0");
  }
  renderBoardView(container, visibleBoardCards) {
    this.ensureBoardStatusFilter();
    this.ensureBoardStatusOrder();
    const boardCards = visibleBoardCards.filter(
      (card) => this.boardStatusFilter.has(card.status) && (this.showBoardSubprojects || card.type !== "subproject") && (this.showBoardBigActions || card.type !== "big_action")
    );
    this.renderBoardStatusFilter(container);
    if (this.isPhoneViewport()) {
      this.renderPhoneBoardView(container, boardCards);
      return;
    }
    const wrap = container.createDiv({ cls: "kanban-rpm-board-wrap" });
    const overlay = this.showBoardConnectors ? this.svgEl("svg") : void 0;
    if (overlay) {
      overlay.addClass("kanban-rpm-board-flow-overlay");
      wrap.appendChild(overlay);
    }
    const board = wrap.createDiv({ cls: "kanban-rpm-board" });
    this.applySurfaceZoom(board, this.boardZoom);
    const visibleLanes = this.orderedBoardStatuses().filter((status) => this.boardStatusFilter.has(status.id));
    for (const lane of visibleLanes) {
      this.renderLane(board, lane, boardCards.filter((card) => card.status === lane.id).sort(compareCards), visibleLanes);
    }
    if (!this.boardStatusFilter.size) board.createDiv({ cls: "kanban-rpm-empty", text: "No Board statuses selected." });
    if (overlay) this.queueBoardFlowOverlay(wrap, overlay, boardCards);
  }
  renderPhoneBoardView(container, boardCards) {
    var _a;
    const visibleLanes = this.orderedBoardStatuses().filter((status) => this.boardStatusFilter.has(status.id));
    if (!visibleLanes.length) {
      container.createDiv({ cls: "kanban-rpm-empty", text: "No Board statuses selected." });
      return;
    }
    if (!visibleLanes.some((lane) => lane.id === this.phoneBoardStatus)) this.phoneBoardStatus = visibleLanes[0].id;
    const tabs = container.createDiv({ cls: "kanban-rpm-phone-lane-tabs" });
    for (const lane of visibleLanes) {
      const count = boardCards.filter((card) => card.status === lane.id).length;
      const tab = tabs.createEl("button", {
        cls: this.phoneBoardStatus === lane.id ? "is-active" : "",
        text: `${lane.label} ${count}`,
        attr: { "aria-pressed": String(this.phoneBoardStatus === lane.id) }
      });
      tab.addEventListener("click", () => {
        this.phoneBoardStatus = lane.id;
        this.render();
      });
    }
    const activeLane = (_a = visibleLanes.find((lane) => lane.id === this.phoneBoardStatus)) != null ? _a : visibleLanes[0];
    const wrap = container.createDiv({ cls: "kanban-rpm-board-wrap kanban-rpm-phone-board-wrap" });
    const board = wrap.createDiv({ cls: "kanban-rpm-board kanban-rpm-phone-board" });
    this.renderLane(board, activeLane, boardCards.filter((card) => card.status === activeLane.id).sort(compareCards), [activeLane]);
  }
  renderBoardStatusFilter(container) {
    const controls = container.createDiv({ cls: "kanban-rpm-board-status-row" });
    if (!this.isPhoneViewport()) {
      this.renderBoardToggleButton(controls, `Arrows: ${this.showBoardConnectors ? "On" : "Off"}`, this.showBoardConnectors, async () => {
        this.showBoardConnectors = !this.showBoardConnectors;
        this.plugin.settings.showBoardConnectors = this.showBoardConnectors;
        await this.plugin.saveSettings();
        this.render();
      });
    }
    this.renderBoardToggleButton(controls, this.isPhoneViewport() ? `Sub ${this.showBoardSubprojects ? "On" : "Off"}` : `Subprojects: ${this.showBoardSubprojects ? "Shown" : "Hidden"}`, this.showBoardSubprojects, async () => {
      this.showBoardSubprojects = !this.showBoardSubprojects;
      this.plugin.settings.showBoardSubprojects = this.showBoardSubprojects;
      await this.plugin.saveSettings();
      this.render();
    });
    this.renderBoardToggleButton(controls, this.isPhoneViewport() ? `Act ${this.showBoardBigActions ? "On" : "Off"}` : `Big actions: ${this.showBoardBigActions ? "Shown" : "Hidden"}`, this.showBoardBigActions, async () => {
      this.showBoardBigActions = !this.showBoardBigActions;
      this.plugin.settings.showBoardBigActions = this.showBoardBigActions;
      await this.plugin.saveSettings();
      this.render();
    });
    if (!this.isPhoneViewport()) {
      this.renderZoomControls(controls, this.boardZoom, async (zoom) => {
        this.boardZoom = zoom;
        this.plugin.settings.boardZoom = zoom;
        await this.plugin.saveSettings();
        this.render();
      });
    }
    const statusWrap = controls.createEl("details", { cls: "kanban-rpm-board-status-filter" });
    statusWrap.createEl("summary", { text: this.isPhoneViewport() ? `St ${this.boardStatusFilter.size}` : `Statuses: ${this.boardStatusFilter.size}` });
    const statusList = statusWrap.createDiv({ cls: "kanban-rpm-board-status-list" });
    for (const status of this.orderedBoardStatuses()) {
      const label = statusList.createEl("label");
      const checkbox = label.createEl("input", { attr: { type: "checkbox" } });
      checkbox.checked = this.boardStatusFilter.has(status.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.boardStatusFilter.add(status.id);
        else this.boardStatusFilter.delete(status.id);
        this.plugin.settings.boardStatusFilter = Array.from(this.boardStatusFilter);
        void this.plugin.saveSettings();
        this.render();
      });
      label.createSpan({ text: status.label });
    }
  }
  renderBoardToggleButton(container, text2, active, onClick) {
    const button = container.createEl("button", {
      cls: active ? "kanban-rpm-view-button is-active" : "kanban-rpm-view-button",
      text: text2,
      attr: { "aria-pressed": String(active) }
    });
    button.addEventListener("click", () => {
      void onClick();
    });
  }
  renderZoomControls(container, currentZoom, onChange) {
    const group = container.createDiv({ cls: "kanban-rpm-zoom-controls" });
    const out = this.createIconButton(group, "zoom-out", "Zoom out", "kanban-rpm-zoom-button");
    const value = group.createSpan({ cls: "kanban-rpm-zoom-value", text: `${Math.round(currentZoom * 100)}%` });
    const zoomIn = this.createIconButton(group, "zoom-in", "Zoom in", "kanban-rpm-zoom-button");
    const commit = (nextPercent) => {
      const next = Math.min(1.4, Math.max(0.7, Math.round(nextPercent / 5) * 5 / 100));
      if (Math.abs(next - currentZoom) < 1e-3) return;
      value.setText(`${Math.round(next * 100)}%`);
      void onChange(next);
    };
    out.addEventListener("click", () => commit(currentZoom * 100 - 5));
    zoomIn.addEventListener("click", () => commit(currentZoom * 100 + 5));
  }
  applySurfaceZoom(element, zoom) {
    element.style.setProperty("--rpm-view-zoom", String(zoom));
  }
  queueBoardFlowOverlay(wrap, overlay, visibleBoardCards) {
    window.setTimeout(() => this.renderBoardFlowOverlay(wrap, overlay, visibleBoardCards), 0);
  }
  renderBoardFlowOverlay(wrap, overlay, visibleBoardCards) {
    overlay.empty();
    const wrapRect = wrap.getBoundingClientRect();
    const width = Math.max(1, wrap.scrollWidth);
    const height = Math.max(1, wrap.scrollHeight);
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    overlay.setAttribute("width", String(width));
    overlay.setAttribute("height", String(height));
    const defs = this.svgEl("defs");
    for (const [id, color] of [
      ["ready", "var(--text-muted)"],
      ["waiting", "var(--text-warning)"]
    ]) {
      const marker = this.svgEl("marker");
      marker.setAttribute("id", `kanban-rpm-board-flow-arrow-${id}`);
      marker.setAttribute("viewBox", "0 0 10 10");
      marker.setAttribute("refX", "9");
      marker.setAttribute("refY", "5");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto-start-reverse");
      const arrow = this.svgEl("path");
      arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      arrow.setAttribute("fill", color);
      marker.appendChild(arrow);
      defs.appendChild(marker);
    }
    overlay.appendChild(defs);
    const visiblePaths = new Set(visibleBoardCards.map((card) => card.path));
    const seen = /* @__PURE__ */ new Set();
    for (const card of visibleBoardCards) {
      for (const predecessor of card.precededBy) {
        const resolved = this.resolveDependencyTarget(card, predecessor);
        const source = resolved.card;
        if (!source || !visiblePaths.has(source.path)) continue;
        const key = `${source.path}->${card.path}`;
        if (seen.has(key)) continue;
        seen.add(key);
        this.renderBoardFlowArrow(wrapRect, overlay, source, card, this.isCompletionStatus(source.status) ? "ready" : "waiting");
      }
    }
  }
  renderBoardFlowArrow(wrapRect, overlay, source, target, state) {
    var _a, _b;
    const sourceDot = this.containerEl.querySelector(`.kanban-rpm-flow-dot-out[data-path="${CSS.escape(source.path)}"]`);
    const targetDot = this.containerEl.querySelector(`.kanban-rpm-flow-dot-in[data-path="${CSS.escape(target.path)}"]`);
    if (!sourceDot || !targetDot) return;
    const from = sourceDot.getBoundingClientRect();
    const to = targetDot.getBoundingClientRect();
    const wrap = overlay.parentElement;
    const scrollLeft = (_a = wrap == null ? void 0 : wrap.scrollLeft) != null ? _a : 0;
    const scrollTop = (_b = wrap == null ? void 0 : wrap.scrollTop) != null ? _b : 0;
    const fromX = from.left + from.width / 2 - wrapRect.left + scrollLeft;
    const fromY = from.top + from.height / 2 - wrapRect.top + scrollTop;
    const toX = to.left + to.width / 2 - wrapRect.left + scrollLeft;
    const toY = to.top + to.height / 2 - wrapRect.top + scrollTop;
    const control = Math.max(60, Math.abs(toX - fromX) * 0.45);
    const path = this.svgEl("path");
    path.setAttribute("class", `kanban-rpm-board-flow-arrow is-${state}`);
    path.setAttribute("d", `M ${fromX} ${fromY} C ${fromX + control} ${fromY}, ${toX - control} ${toY}, ${toX} ${toY}`);
    path.setAttribute("marker-end", `url(#kanban-rpm-board-flow-arrow-${state})`);
    path.dataset.sourcePath = source.path;
    path.dataset.targetPath = target.path;
    path.addEventListener("click", (event) => {
      event.stopPropagation();
      new ConfirmCardActionModal(this.app, {
        title: "Remove flow arrow",
        message: `Remove "${source.title} -> ${target.title}" from ${target.title}'s Preceded by list?`,
        confirmText: "Remove",
        onConfirm: () => this.plugin.removePrecededBy(target.path, source)
      }).open();
    });
    overlay.appendChild(path);
  }
  renderTableView(container, visibleBoardCards) {
    var _a;
    const sortedCards = this.sortTableCards(visibleBoardCards);
    if (this.isPhoneViewport()) {
      this.renderPhoneTableView(container, sortedCards);
      return;
    }
    const wrap = container.createDiv({ cls: "kanban-rpm-table-wrap" });
    const table = wrap.createEl("table", { cls: "kanban-rpm-table" });
    const colgroup = table.createEl("colgroup");
    for (const column of TABLE_COLUMNS) {
      const col = colgroup.createEl("col");
      col.style.width = `${(_a = this.tableColumnWidths.get(column.key)) != null ? _a : column.width}px`;
    }
    const thead = table.createEl("thead");
    const header = thead.createEl("tr");
    TABLE_COLUMNS.forEach((column, index) => this.renderTableHeader(header, column, index, table));
    const tbody = table.createEl("tbody");
    if (!sortedCards.length) {
      const row = tbody.createEl("tr");
      const cell = row.createEl("td", { cls: "kanban-rpm-table-empty", text: "No cards match the current filters." });
      cell.colSpan = 8;
      return;
    }
    for (const card of sortedCards) this.renderTableRow(tbody, card);
  }
  renderPhoneTableView(container, cards) {
    const wrap = container.createDiv({ cls: "kanban-rpm-phone-list kanban-rpm-phone-table-list" });
    this.renderPhoneSortBar(wrap);
    if (!cards.length) {
      wrap.createDiv({ cls: "kanban-rpm-empty", text: "No cards match the current filters." });
      return;
    }
    for (const card of cards) this.renderPhonePlanningCard(wrap, card, "table");
  }
  renderArchiveView(container, cards) {
    const wrap = container.createDiv({ cls: "kanban-rpm-table-wrap kanban-rpm-archive-wrap" });
    wrap.createEl("h3", { text: "Archive" });
    const table = wrap.createEl("table", { cls: "kanban-rpm-table" });
    const thead = table.createEl("thead");
    const header = thead.createEl("tr");
    for (const label of ["Title", "Project", "Archived", "Original path", "Actions"]) header.createEl("th", { text: label });
    const tbody = table.createEl("tbody");
    if (!cards.length) {
      const row = tbody.createEl("tr");
      const cell = row.createEl("td", { cls: "kanban-rpm-table-empty", text: "No archived cards match the current filters." });
      cell.colSpan = 5;
      return;
    }
    for (const card of cards.sort((a, b) => (b.archivedAt || "").localeCompare(a.archivedAt || "") || a.title.localeCompare(b.title))) {
      const row = tbody.createEl("tr");
      const title = row.createEl("td");
      title.createEl("button", { cls: "kanban-rpm-table-title", text: card.title }).addEventListener("click", () => {
        void this.plugin.openCard(card);
      });
      row.createEl("td", { text: card.projectTitle || card.archiveOwnerProject || "Unassigned" });
      row.createEl("td", { text: card.archivedAt ? card.archivedAt.slice(0, 10) : "" });
      row.createEl("td", { text: card.archiveOriginalPath });
      const actions = row.createEl("td", { cls: "kanban-rpm-table-actions" });
      actions.createEl("button", { text: "Unarchive" }).addEventListener("click", () => {
        void this.plugin.unarchiveCard(card);
      });
      actions.createEl("button", { text: "Delete" }).addEventListener("click", () => {
        new ConfirmCardActionModal(this.app, {
          title: "Delete archived card",
          message: `Delete archived card "${card.title}"?`,
          confirmText: "Delete",
          onConfirm: () => this.plugin.deleteCard(card)
        }).open();
      });
    }
  }
  renderGanttView(container, visibleBoardCards) {
    const ganttCards = visibleBoardCards.filter((card) => card.type === "subproject" || card.type === "big_action");
    if (this.isPhoneViewport()) {
      this.renderPhoneGanttPlanningList(container, ganttCards);
      return;
    }
    const rows = this.buildGanttRows(ganttCards, this.showGanttSubprojects, this.showGanttBigActions);
    const autoRange = this.ganttAutoRange(rows, ganttCards);
    const range = this.ganttRange(autoRange);
    const totalDays = Math.max(1, daysBetween(range.start, range.end) + 1);
    const minDayWidth = this.ganttScale === "month-week" ? 6 : 2.8;
    const availableTimelineWidth = Math.max(520, (container.clientWidth || 0) - 300);
    const timelineWidth = Math.max(totalDays * minDayWidth, availableTimelineWidth);
    const dayWidth = timelineWidth / totalDays;
    const connectorCount = this.countVisibleGanttConnectors(rows, range);
    const topSegments = this.ganttScale === "month-week" ? this.ganttMonthSegments(range.start, range.end) : this.ganttQuarterSegments(range.start, range.end);
    const bottomSegments = this.ganttScale === "month-week" ? this.ganttWeekSegments(range.start, range.end) : this.ganttMonthSegments(range.start, range.end);
    const wrap = container.createDiv({ cls: "kanban-rpm-gantt-wrap" });
    const controls = wrap.createDiv({ cls: "kanban-rpm-gantt-controls" });
    controls.createEl("span", { cls: "kanban-rpm-gantt-range", text: `${this.toDisplayDate(range.start)} - ${this.toDisplayDate(range.end)}` });
    const rangeStart = controls.createEl("input", {
      cls: "kanban-rpm-gantt-date-input",
      attr: {
        type: "date",
        value: this.ganttRangeStart || autoRange.start,
        "aria-label": "Gantt range start"
      }
    });
    const rangeEnd = controls.createEl("input", {
      cls: "kanban-rpm-gantt-date-input",
      attr: {
        type: "date",
        value: this.ganttRangeEnd || autoRange.end,
        "aria-label": "Gantt range end"
      }
    });
    controls.createEl("button", { text: "Apply range" }).addEventListener("click", () => {
      if (isIsoDate(rangeStart.value) && isIsoDate(rangeEnd.value) && rangeStart.value <= rangeEnd.value) {
        this.ganttRangeStart = rangeStart.value;
        this.ganttRangeEnd = rangeEnd.value;
        this.render();
      }
    });
    controls.createEl("button", { text: "Auto range" }).addEventListener("click", () => {
      this.ganttRangeStart = "";
      this.ganttRangeEnd = "";
      this.render();
    });
    for (const [scale, label] of [
      ["month-week", "Month+Week"],
      ["quarter-month", "Quarter+Month"]
    ]) {
      controls.createEl("button", {
        cls: this.ganttScale === scale ? "kanban-rpm-view-button is-active" : "kanban-rpm-view-button",
        text: label,
        attr: { "aria-pressed": String(this.ganttScale === scale) }
      }).addEventListener("click", () => {
        this.ganttScale = scale;
        this.render();
      });
    }
    controls.createEl("button", {
      cls: this.showGanttConnectors ? "kanban-rpm-view-button is-active" : "kanban-rpm-view-button",
      text: `Connectors: ${this.showGanttConnectors ? "On" : "Off"} (${connectorCount})`,
      attr: { "aria-pressed": String(this.showGanttConnectors) }
    }).addEventListener("click", () => {
      this.showGanttConnectors = !this.showGanttConnectors;
      this.render();
    });
    controls.createEl("button", {
      cls: this.showGanttSubprojects ? "kanban-rpm-view-button is-active" : "kanban-rpm-view-button",
      text: `Subprojects: ${this.showGanttSubprojects ? "Shown" : "Hidden"}`,
      attr: { "aria-pressed": String(this.showGanttSubprojects) }
    }).addEventListener("click", () => {
      this.showGanttSubprojects = !this.showGanttSubprojects;
      this.plugin.settings.showGanttSubprojects = this.showGanttSubprojects;
      void this.plugin.saveSettings();
      this.render();
    });
    controls.createEl("button", {
      cls: this.showGanttBigActions ? "kanban-rpm-view-button is-active" : "kanban-rpm-view-button",
      text: `Big actions: ${this.showGanttBigActions ? "Shown" : "Hidden"}`,
      attr: { "aria-pressed": String(this.showGanttBigActions) }
    }).addEventListener("click", () => {
      this.showGanttBigActions = !this.showGanttBigActions;
      this.plugin.settings.showGanttBigActions = this.showGanttBigActions;
      void this.plugin.saveSettings();
      this.render();
    });
    this.renderZoomControls(controls, this.ganttZoom, async (zoom) => {
      this.ganttZoom = zoom;
      this.plugin.settings.ganttZoom = zoom;
      await this.plugin.saveSettings();
      this.render();
    });
    const surface = wrap.createDiv({ cls: "kanban-rpm-gantt-surface" });
    this.applySurfaceZoom(surface, this.ganttZoom);
    const header = surface.createDiv({ cls: "kanban-rpm-gantt-header" });
    header.createDiv({ cls: "kanban-rpm-gantt-label-header", text: "PROJECT / WORKSTREAM" });
    const headerGrid = header.createDiv({ cls: "kanban-rpm-gantt-time-header" });
    headerGrid.style.width = `${timelineWidth}px`;
    this.renderGanttSegments(headerGrid, topSegments, range.start, dayWidth, "top");
    this.renderGanttSegments(headerGrid, bottomSegments, range.start, dayWidth, "bottom");
    const body = surface.createDiv({ cls: "kanban-rpm-gantt-body" });
    if (!rows.length) {
      body.createDiv({ cls: "kanban-rpm-empty", text: "No visible Subproject or Big Action dates match the current filters." });
      return;
    }
    for (const row of rows) this.renderGanttSurfaceRow(body, row, range, dayWidth, timelineWidth);
    if (this.showGanttConnectors) this.renderGanttConnectors(body, rows, range, dayWidth, timelineWidth);
  }
  renderPhoneGanttPlanningList(container, cards) {
    const planningCards = cards.filter((card) => (this.showGanttSubprojects || card.type !== "subproject") && (this.showGanttBigActions || card.type !== "big_action")).filter((card) => card.startDate || card.scheduledDate || card.dueDate || card.nextReview).sort((a, b) => this.compareGanttCards(a, b));
    const wrap = container.createDiv({ cls: "kanban-rpm-phone-list kanban-rpm-phone-gantt-list" });
    const controls = wrap.createDiv({ cls: "kanban-rpm-phone-gantt-controls" });
    this.renderBoardToggleButton(controls, `Sub ${this.showGanttSubprojects ? "On" : "Off"}`, this.showGanttSubprojects, async () => {
      this.showGanttSubprojects = !this.showGanttSubprojects;
      this.plugin.settings.showGanttSubprojects = this.showGanttSubprojects;
      await this.plugin.saveSettings();
      this.render();
    });
    this.renderBoardToggleButton(controls, `Act ${this.showGanttBigActions ? "On" : "Off"}`, this.showGanttBigActions, async () => {
      this.showGanttBigActions = !this.showGanttBigActions;
      this.plugin.settings.showGanttBigActions = this.showGanttBigActions;
      await this.plugin.saveSettings();
      this.render();
    });
    if (!planningCards.length) {
      wrap.createDiv({ cls: "kanban-rpm-empty", text: "No planning dates match the current filters." });
      return;
    }
    for (const group of this.groupCardsForCurrentFilter(planningCards)) {
      const groupEl = wrap.createDiv({ cls: "kanban-rpm-phone-planning-group" });
      const header = groupEl.createDiv({ cls: "kanban-rpm-phone-planning-group-header" });
      this.addProjectToken(header, group.project);
      header.createSpan({ text: group.project });
      header.createSpan({ cls: "kanban-rpm-project-group-count", text: String(group.cards.length) });
      for (const card of group.cards) this.renderPhonePlanningCard(groupEl, card, "gantt");
    }
  }
  renderPhoneFilters(container, visibleCards, visibleBoardCards) {
    const filters = container.createDiv({ cls: "kanban-rpm-filters kanban-rpm-phone-filters" });
    const activeFilters = [this.projectFilter, this.subprojectFilter, this.workstreamTypeFilter].filter(Boolean).length;
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const visibleBoardPaths = new Set(visibleBoardCards.map((card) => card.path));
    const warningCount = this.issues.filter((issue) => visiblePaths.has(issue.cardPath)).length;
    const actionCount = this.actions.filter((action) => visibleBoardPaths.has(action.cardPath)).length;
    const researchCount = this.researchLogs.length;
    const activePanelCount = [this.showDataWarnings, this.showCommandCenter, this.showActionIndex, this.showResearchIndex].filter(Boolean).length;
    const projectCount = this.cards.filter((card) => card.type === "project").filter((card) => this.showClosedProjects || card.projectState !== "closed").filter((card) => !this.projectFilter || card.title === this.projectFilter || card.projectTitles.includes(this.projectFilter)).length;
    const top = filters.createDiv({ cls: "kanban-rpm-phone-filter-summary" });
    top.createEl("button", {
      cls: this.phoneFiltersExpanded || activeFilters ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: activeFilters ? `Filters (${activeFilters})` : "Filters",
      attr: { "aria-expanded": String(this.phoneFiltersExpanded) }
    }).addEventListener("click", () => {
      this.phoneFiltersExpanded = !this.phoneFiltersExpanded;
      this.render();
    });
    if (activeFilters) {
      const chips = top.createDiv({ cls: "kanban-rpm-phone-filter-chips" });
      if (this.projectFilter) chips.createSpan({ text: this.projectFilter });
      if (this.subprojectFilter) chips.createSpan({ text: this.subprojectFilter });
      if (this.workstreamTypeFilter) chips.createSpan({ text: this.categoryLabel(this.workstreamTypeFilter) });
      top.createEl("button", { cls: "kanban-rpm-panel-toggle", text: "Clear" }).addEventListener("click", () => {
        this.projectFilter = "";
        this.subprojectFilter = "";
        this.workstreamTypeFilter = "";
        void this.saveViewFilters();
        this.render();
      });
    }
    top.createEl("button", {
      cls: !this.projectNotesCollapsed ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: !this.projectNotesCollapsed ? `Projects ${projectCount}` : "Projects",
      attr: { "aria-expanded": String(!this.projectNotesCollapsed) }
    }).addEventListener("click", () => {
      this.projectNotesCollapsed = !this.projectNotesCollapsed;
      this.render();
    });
    const panelWrap = top.createDiv({ cls: "kanban-rpm-panel-menu" });
    panelWrap.createEl("button", {
      cls: this.panelsExpanded || activePanelCount ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: activePanelCount ? `Panels ${activePanelCount}` : "Panels",
      attr: { "aria-expanded": String(this.panelsExpanded) }
    }).addEventListener("click", () => {
      this.panelsExpanded = !this.panelsExpanded;
      this.render();
    });
    if (this.panelsExpanded) this.renderPanelToggles(filters, warningCount, actionCount, researchCount);
    if (!this.phoneFiltersExpanded) return;
    const body = filters.createDiv({ cls: "kanban-rpm-phone-filter-body" });
    this.renderSelectFilter(body, "Project", this.projectFilter, this.uniqueValues("projectTitle"), (value) => {
      this.projectFilter = value;
      this.subprojectFilter = "";
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(body, "Subproject", this.subprojectFilter, this.subprojectFilterValues(), (value) => {
      this.subprojectFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(body, "Category", this.workstreamTypeFilter, this.uniqueCategoryValues(), (value) => {
      this.workstreamTypeFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    body.createEl("button", {
      cls: this.showClosedProjects ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: this.showClosedProjects ? "Closed on" : "Closed off",
      attr: { "aria-pressed": String(this.showClosedProjects) }
    }).addEventListener("click", () => {
      this.showClosedProjects = !this.showClosedProjects;
      if (!this.showClosedProjects && this.projectFilter && this.isProjectTitleClosed(this.projectFilter)) {
        this.projectFilter = "";
        this.subprojectFilter = "";
        void this.saveViewFilters();
      }
      this.render();
    });
  }
  buildGanttRows(cards, includeSubprojects = true, includeBigActions = true) {
    const rows = [];
    const projectTitles = Array.from(new Set(cards.map((card) => card.projectTitle || card.projectTitles[0] || "No project"))).sort((a, b) => this.compareGanttProjectTitles(a, b, cards));
    for (const projectTitle of projectTitles) {
      const projectCards = cards.filter((card) => (card.projectTitle || card.projectTitles[0] || "No project") === projectTitle);
      const projectCard = this.cards.find((card) => card.type === "project" && card.title === projectTitle);
      const projectKey = `gantt:project:${projectTitle}`;
      const projectCollapsed = !this.projectFilter && this.collapsedGanttNodes.has(projectKey);
      if (!this.projectFilter) {
        rows.push({
          key: projectKey,
          kind: "project",
          title: projectTitle,
          projectTitle,
          subprojectTitle: "",
          card: projectCard,
          period: this.ganttProjectPeriod(projectCard, projectCards),
          childCount: projectCards.length
        });
      }
      if (projectCollapsed) continue;
      const subprojectTitles = /* @__PURE__ */ new Set();
      for (const card of projectCards) {
        if (card.type === "subproject") subprojectTitles.add(card.title);
        for (const title of card.subprojectTitles) subprojectTitles.add(title);
      }
      if (!subprojectTitles.size) subprojectTitles.add("No subproject");
      for (const subprojectTitle of Array.from(subprojectTitles).sort((a, b) => this.compareGanttSubprojectTitles(a, b, projectCards))) {
        const subprojectCard = projectCards.find((card) => card.type === "subproject" && card.title === subprojectTitle);
        const bigActions = projectCards.filter((card) => card.type === "big_action").filter((card) => subprojectTitle === "No subproject" ? !card.subprojectTitles.length : card.subprojectTitles.includes(subprojectTitle)).sort((a, b) => this.compareGanttCards(a, b));
        if (!subprojectCard && !bigActions.length) continue;
        const subprojectKey = `gantt:subproject:${projectTitle}:${subprojectTitle}`;
        if (includeSubprojects) {
          rows.push({
            key: subprojectKey,
            kind: "subproject",
            title: subprojectTitle,
            projectTitle,
            subprojectTitle,
            card: subprojectCard,
            period: this.ganttSubprojectPeriod(subprojectCard, bigActions),
            childCount: bigActions.length
          });
        }
        if (includeSubprojects && this.collapsedGanttNodes.has(subprojectKey) || !includeBigActions) continue;
        for (const card of bigActions) {
          rows.push({
            key: `gantt:action:${card.path}`,
            kind: "big_action",
            title: card.title,
            projectTitle,
            subprojectTitle,
            card,
            period: this.ganttCardPeriod(card),
            childCount: 0
          });
        }
      }
    }
    return rows;
  }
  renderGanttSurfaceRow(container, row, range, dayWidth, timelineWidth) {
    var _a;
    const rowEl = container.createDiv({ cls: `kanban-rpm-gantt-row is-${row.kind}` });
    if (row.period && this.isShortGanttPeriod(row.period)) rowEl.addClass("has-short-label");
    rowEl.style.setProperty("--rpm-project-color", this.projectColor(row.projectTitle || row.title));
    rowEl.style.setProperty("--rpm-gantt-bar-color", this.ganttBarColor(row.card));
    const label = rowEl.createDiv({ cls: "kanban-rpm-gantt-row-label" });
    if (row.kind !== "big_action") this.renderGanttToggle(label, row.key, this.collapsedGanttNodes.has(row.key), row.kind === "project" && !!this.projectFilter);
    else label.createSpan({ cls: "kanban-rpm-gantt-indent" });
    const titleWrap = label.createDiv({ cls: "kanban-rpm-gantt-title-wrap" });
    if (row.kind !== "big_action") titleWrap.createSpan({ cls: "kanban-rpm-gantt-type-mark", text: row.kind === "project" ? "P" : "S" });
    const titleButton = titleWrap.createEl("button", { cls: "kanban-rpm-gantt-title", text: row.title });
    titleButton.addEventListener("click", () => {
      if (row.card) void this.plugin.openCard(row.card);
      else {
        const project = this.cards.find((card) => card.type === "project" && card.title === row.projectTitle);
        if (project) void this.plugin.openCard(project);
      }
    });
    const meta = label.createDiv({ cls: "kanban-rpm-gantt-row-meta" });
    if (row.card) {
      meta.createSpan({ cls: `kanban-rpm-status-badge kanban-rpm-status-${row.card.status}`, text: this.statusLabel(row.card.status) });
      if (row.card.precededBy.length) meta.createSpan({ cls: "kanban-rpm-gantt-badge", text: `Preceded ${row.card.precededBy.length}` });
      if (row.card.followedBy.length) meta.createSpan({ cls: "kanban-rpm-gantt-badge", text: `Followed ${row.card.followedBy.length}` });
      if (row.card.blockedBy.length) meta.createSpan({ cls: "kanban-rpm-gantt-badge is-blocked", text: `Blocked ${row.card.blockedBy.length}` });
    }
    if (row.kind === "project") meta.createSpan({ cls: "kanban-rpm-gantt-count", text: `${row.childCount} items` });
    if (row.kind === "subproject") meta.createSpan({ cls: "kanban-rpm-gantt-count", text: `${row.childCount} actions` });
    const track = rowEl.createDiv({ cls: "kanban-rpm-gantt-track" });
    track.style.width = `${timelineWidth}px`;
    if (row.card) track.dataset.path = row.card.path;
    this.renderGanttTrackGrid(track, range, dayWidth);
    if (row.period && this.ganttPeriodOverlaps(row.period, range)) this.renderGanttBar(track, row, row.period, range, dayWidth);
    if ((_a = row.card) == null ? void 0 : _a.nextReview) this.renderGanttMarker(track, row.card.nextReview, range, dayWidth, "review", "review");
  }
  renderGanttToggle(container, key, collapsed, disabled) {
    const toggle = container.createEl("button", {
      cls: disabled ? "kanban-rpm-gantt-toggle is-disabled" : "kanban-rpm-gantt-toggle",
      text: disabled ? "" : collapsed ? "?" : "?",
      attr: { "aria-label": collapsed ? "Expand Gantt row" : "Collapse Gantt row" }
    });
    if (disabled) return;
    toggle.addEventListener("click", () => {
      if (this.collapsedGanttNodes.has(key)) this.collapsedGanttNodes.delete(key);
      else this.collapsedGanttNodes.add(key);
      this.render();
    });
  }
  renderGanttSegments(container, segments, rangeStart, dayWidth, level) {
    for (const segment of segments) {
      const el = container.createDiv({ cls: `kanban-rpm-gantt-segment is-${level}` });
      const left = daysBetween(rangeStart, segment.start) * dayWidth;
      const width = (daysBetween(segment.start, segment.end) + 1) * dayWidth;
      el.style.left = `${left}px`;
      el.style.width = `${Math.max(width, 1)}px`;
      el.createSpan({ text: segment.label });
    }
  }
  renderGanttTrackGrid(track, range, dayWidth) {
    const segments = this.ganttScale === "month-week" ? this.ganttMonthSegments(range.start, range.end) : this.ganttQuarterSegments(range.start, range.end);
    for (const segment of segments) {
      const line = track.createDiv({ cls: "kanban-rpm-gantt-grid-line" });
      line.style.left = `${daysBetween(range.start, segment.start) * dayWidth}px`;
    }
    const today = todayIso();
    if (today >= range.start && today <= range.end) {
      const line = track.createDiv({ cls: "kanban-rpm-gantt-today-line" });
      line.style.left = `${daysBetween(range.start, today) * dayWidth}px`;
    }
  }
  renderGanttBar(track, row, period, range, dayWidth) {
    var _a;
    const start = period.start < range.start ? range.start : period.start;
    const end = period.end > range.end ? range.end : period.end;
    if (start > end) return;
    const left = daysBetween(range.start, start) * dayWidth;
    const width = Math.max((daysBetween(start, end) + 1) * dayWidth, 14);
    const isShort = this.isShortGanttPeriod(period);
    const bar = track.createEl("button", {
      cls: [
        "kanban-rpm-gantt-bar",
        `is-${row.kind}`,
        row.card ? `is-status-${row.card.status}` : "",
        ((_a = row.card) == null ? void 0 : _a.blockedBy.length) ? "is-blocked" : ""
      ].filter(Boolean).join(" "),
      text: row.title,
      attr: { title: row.card ? `Edit Gantt dates: ${row.title}` : row.title }
    });
    bar.style.left = `${left}px`;
    bar.style.width = `${width}px`;
    if (row.card) bar.dataset.path = row.card.path;
    bar.addEventListener("click", () => {
      if (row.card) new GanttDateModal(this.app, row.card, (values) => this.plugin.updateGanttDates(row.card, values)).open();
    });
    if (isShort) {
      const outsideLabel = track.createDiv({ cls: `kanban-rpm-gantt-short-label is-${row.kind}`, text: row.title });
      outsideLabel.style.left = `${left}px`;
      outsideLabel.style.maxWidth = `${Math.max(120, dayWidth * (this.ganttScale === "month-week" ? 21 : 31))}px`;
    }
    if (!row.card) return;
    const incoming = track.createSpan({
      cls: "kanban-rpm-gantt-flow-dot kanban-rpm-gantt-flow-dot-in",
      attr: { title: "Preceded by connector target", "aria-label": "Preceded by connector target" }
    });
    incoming.dataset.path = row.card.path;
    incoming.style.left = `${this.ganttIncomingDotX(left, width)}px`;
    incoming.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    const outgoing = track.createSpan({
      cls: "kanban-rpm-gantt-flow-dot kanban-rpm-gantt-flow-dot-out",
      attr: { title: "Followed by connector source", "aria-label": "Followed by connector source" }
    });
    outgoing.dataset.path = row.card.path;
    outgoing.style.left = `${this.ganttOutgoingDotX(left, width)}px`;
    outgoing.addEventListener("pointerdown", (event) => this.startGanttFlowConnect(event, row.card));
  }
  renderGanttConnectors(body, rows, range, dayWidth, timelineWidth) {
    var _a, _b, _c, _d, _e;
    const rowByPath = this.ganttVisibleRowMap(rows, range);
    const yByPath = this.ganttTrackCenterYMap(body);
    const totalHeight = Math.max(body.scrollHeight, body.getBoundingClientRect().height);
    const layer = body.createDiv({ cls: "kanban-rpm-gantt-connectors" });
    layer.style.width = `${timelineWidth}px`;
    layer.style.height = `${totalHeight}px`;
    let edgeCount = 0;
    for (const target of rows) {
      if (!target.card || !target.period) continue;
      const targetInfo = rowByPath.get(target.card.path);
      if (!targetInfo) continue;
      for (const link of target.card.precededBy) {
        const sourceFile = this.plugin.resolveLinkedFile(link, target.card.path);
        if (!sourceFile) continue;
        const sourceInfo = rowByPath.get(sourceFile.path);
        if (!sourceInfo) continue;
        const sourceLeft = this.ganttPeriodStartX(sourceInfo.period, range, dayWidth);
        const sourceWidth = this.ganttPeriodWidth(sourceInfo.period, range, dayWidth);
        const targetLeft = this.ganttPeriodStartX(targetInfo.period, range, dayWidth);
        const targetWidth = this.ganttPeriodWidth(targetInfo.period, range, dayWidth);
        const targetX = this.ganttIncomingDotX(targetLeft, targetWidth);
        const sourceX = this.ganttConnectorSourceX(sourceLeft, sourceWidth, targetX);
        const sourceY = (_c = yByPath.get((_b = (_a = sourceInfo.row.card) == null ? void 0 : _a.path) != null ? _b : "")) != null ? _c : 0;
        const targetY = (_d = yByPath.get(target.card.path)) != null ? _d : 0;
        const state = this.isCompletionStatus(((_e = sourceInfo.row.card) == null ? void 0 : _e.status) || "") ? "ready" : "blocking";
        const midX = sourceX + (targetX - sourceX) / 2;
        if (Math.abs(sourceY - targetY) < 1) {
          this.renderGanttConnectorSegment(layer, sourceX, sourceY, targetX, targetY, state, sourceInfo.row.card, target.card);
        } else {
          this.renderGanttConnectorSegment(layer, sourceX, sourceY, midX, sourceY, state, sourceInfo.row.card, target.card);
          this.renderGanttConnectorSegment(layer, midX, sourceY, midX, targetY, state, sourceInfo.row.card, target.card);
          this.renderGanttConnectorSegment(layer, midX, targetY, targetX, targetY, state, sourceInfo.row.card, target.card);
        }
        const arrowDirection = targetX >= midX ? "right" : "left";
        const arrowX = this.ganttArrowheadX(targetX, arrowDirection);
        this.renderGanttConnectorEndpoint(layer, sourceX, sourceY, state, "source", sourceInfo.row.card, target.card);
        this.renderGanttConnectorEndpoint(layer, targetX, targetY, state, "target", sourceInfo.row.card, target.card);
        this.renderGanttConnectorArrowhead(layer, arrowX, targetY, arrowDirection, state, sourceInfo.row.card, target.card);
        edgeCount += 1;
      }
    }
    if (!edgeCount) layer.remove();
  }
  renderGanttConnectorSegment(container, x1, y1, x2, y2, state, source, target) {
    const horizontal = Math.abs(y1 - y2) < 1;
    const segment = container.createDiv({
      cls: state === "ready" ? "kanban-rpm-gantt-connector-segment" : "kanban-rpm-gantt-connector-segment is-blocking",
      attr: { title: `Remove flow: ${source.title} -> ${target.title}` }
    });
    if (horizontal) {
      segment.addClass("is-horizontal");
      segment.style.left = `${Math.min(x1, x2)}px`;
      segment.style.top = `${y1}px`;
      segment.style.width = `${Math.max(Math.abs(x2 - x1), 2)}px`;
    } else {
      segment.addClass("is-vertical");
      segment.style.left = `${x1}px`;
      segment.style.top = `${Math.min(y1, y2)}px`;
      segment.style.height = `${Math.max(Math.abs(y2 - y1), 2)}px`;
    }
    this.bindGanttConnectorRemove(segment, source, target);
  }
  renderGanttConnectorEndpoint(container, x, y, state, kind, source, target) {
    const endpoint = container.createDiv({
      cls: [
        "kanban-rpm-gantt-connector-endpoint",
        kind === "target" ? "is-target" : "",
        state === "blocking" ? "is-blocking" : ""
      ].filter(Boolean).join(" "),
      attr: { title: `Remove flow: ${source.title} -> ${target.title}` }
    });
    endpoint.style.left = `${x}px`;
    endpoint.style.top = `${y}px`;
    this.bindGanttConnectorRemove(endpoint, source, target);
  }
  renderGanttConnectorArrowhead(container, x, y, direction, state, source, target) {
    const arrow = container.createDiv({
      cls: [
        "kanban-rpm-gantt-connector-arrowhead",
        direction === "left" ? "is-left" : "is-right",
        state === "blocking" ? "is-blocking" : ""
      ].filter(Boolean).join(" "),
      attr: { title: `Remove flow: ${source.title} -> ${target.title}` }
    });
    arrow.style.left = `${x}px`;
    arrow.style.top = `${y}px`;
    this.bindGanttConnectorRemove(arrow, source, target);
  }
  bindGanttConnectorRemove(element, source, target) {
    element.dataset.sourcePath = source.path;
    element.dataset.targetPath = target.path;
    element.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      new ConfirmCardActionModal(this.app, {
        title: "Remove Gantt flow",
        message: `Remove "${source.title} -> ${target.title}" from ${target.title}'s Preceded by list?`,
        confirmText: "Remove",
        onConfirm: () => this.plugin.removePrecededBy(target.path, source)
      }).open();
    });
  }
  countVisibleGanttConnectors(rows, range) {
    const rowByPath = this.ganttVisibleRowMap(rows, range);
    let count = 0;
    for (const target of rows) {
      if (!target.card || !target.period || !rowByPath.has(target.card.path)) continue;
      for (const link of target.card.precededBy) {
        const sourceFile = this.plugin.resolveLinkedFile(link, target.card.path);
        if (sourceFile && rowByPath.has(sourceFile.path)) count += 1;
      }
    }
    return count;
  }
  ganttVisibleRowMap(rows, range) {
    const rowByPath = /* @__PURE__ */ new Map();
    rows.forEach((row, index) => {
      if (row.card && row.period && (!range || this.ganttPeriodOverlaps(row.period, range))) rowByPath.set(row.card.path, { row, index, period: row.period });
    });
    return rowByPath;
  }
  ganttTrackCenterYMap(body) {
    const bodyRect = body.getBoundingClientRect();
    const centers = /* @__PURE__ */ new Map();
    body.querySelectorAll(".kanban-rpm-gantt-track[data-path]").forEach((track) => {
      const path = track.dataset.path;
      if (!path) return;
      const rect = track.getBoundingClientRect();
      centers.set(path, rect.top - bodyRect.top + body.scrollTop + rect.height / 2);
    });
    return centers;
  }
  ganttRowHeight() {
    return 42;
  }
  ganttRowMetrics(rows) {
    let top = 0;
    return rows.map((row) => {
      const height = this.ganttRowHeight();
      const metric = { top, height };
      top += height;
      return metric;
    });
  }
  ganttDateX(date, range, dayWidth) {
    const clamped = date < range.start ? range.start : date > range.end ? range.end : date;
    return daysBetween(range.start, clamped) * dayWidth + dayWidth / 2;
  }
  ganttPeriodStartX(period, range, dayWidth) {
    const start = period.start < range.start ? range.start : period.start > range.end ? range.end : period.start;
    return daysBetween(range.start, start) * dayWidth;
  }
  ganttPeriodEndX(period, range, dayWidth) {
    const end = period.end > range.end ? range.end : period.end < range.start ? range.start : period.end;
    return (daysBetween(range.start, end) + 1) * dayWidth;
  }
  ganttPeriodWidth(period, range, dayWidth) {
    const start = period.start < range.start ? range.start : period.start > range.end ? range.end : period.start;
    const end = period.end > range.end ? range.end : period.end < range.start ? range.start : period.end;
    return Math.max((daysBetween(start, end) + 1) * dayWidth, 14);
  }
  isShortGanttPeriod(period) {
    const duration = daysBetween(period.start, period.end) + 1;
    return this.ganttScale === "month-week" ? duration < 21 : duration < 31;
  }
  ganttIncomingDotX(left, width) {
    return left + Math.min(8, Math.max(5, width * 0.35));
  }
  ganttOutgoingDotX(left, width) {
    return left + width - Math.min(8, Math.max(5, width * 0.35));
  }
  ganttConnectorSourceX(left, width, targetX) {
    const incoming = this.ganttIncomingDotX(left, width);
    const outgoing = this.ganttOutgoingDotX(left, width);
    return Math.abs(outgoing - targetX) <= Math.abs(incoming - targetX) ? outgoing : incoming;
  }
  ganttArrowheadX(targetX, direction) {
    return direction === "right" ? targetX - 9 : targetX + 9;
  }
  renderGanttMarker(track, date, range, dayWidth, kind, label) {
    if (!isIsoDate(date) || date < range.start || date > range.end) return;
    const marker = track.createDiv({ cls: `kanban-rpm-gantt-marker is-${kind}`, attr: { title: `${label} ${date}` } });
    marker.style.left = `${daysBetween(range.start, date) * dayWidth}px`;
    marker.createSpan({ text: label });
  }
  ganttCardPeriod(card) {
    const start = isIsoDate(card.startDate) ? card.startDate : isIsoDate(card.dueDate) ? card.dueDate : "";
    const end = isIsoDate(card.dueDate) ? card.dueDate : start;
    return start && end ? { start, end } : void 0;
  }
  ganttSubprojectPeriod(card, children) {
    const direct = card ? this.ganttCardPeriod(card) : void 0;
    if (direct && (card == null ? void 0 : card.startDate) && (card == null ? void 0 : card.dueDate)) return direct;
    const childPeriods = children.map((child) => this.ganttCardPeriod(child)).filter((period) => !!period);
    if (!childPeriods.length) return direct;
    const starts = childPeriods.map((period) => period.start).sort();
    const ends = childPeriods.map((period) => period.end).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }
  ganttProjectPeriod(card, children) {
    const direct = card ? this.ganttCardPeriod(card) : void 0;
    if (direct && (card == null ? void 0 : card.startDate) && (card == null ? void 0 : card.dueDate)) return direct;
    const childPeriods = children.map((child) => {
      if (child.type === "subproject") {
        const childActions = children.filter((item) => item.type === "big_action" && item.subprojectTitles.includes(child.title));
        return this.ganttSubprojectPeriod(child, childActions);
      }
      return this.ganttCardPeriod(child);
    }).filter((period) => !!period);
    if (!childPeriods.length) return direct;
    const starts = childPeriods.map((period) => period.start).sort();
    const ends = childPeriods.map((period) => period.end).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }
  ganttAutoRange(rows, cards) {
    var _a, _b;
    const dates = [
      ...rows.flatMap((row) => {
        var _a2, _b2;
        return [(_a2 = row.period) == null ? void 0 : _a2.start, (_b2 = row.period) == null ? void 0 : _b2.end];
      }),
      ...cards.map((card) => card.nextReview)
    ].filter((date) => !!date && isIsoDate(date)).sort();
    const first = (_a = dates[0]) != null ? _a : todayIso();
    const last = (_b = dates[dates.length - 1]) != null ? _b : addDays(todayIso(), 180);
    return {
      start: first,
      end: last
    };
  }
  ganttRange(autoRange) {
    if (isIsoDate(this.ganttRangeStart) && isIsoDate(this.ganttRangeEnd) && this.ganttRangeStart <= this.ganttRangeEnd) {
      return { start: this.ganttRangeStart, end: this.ganttRangeEnd };
    }
    return autoRange;
  }
  ganttPeriodOverlaps(period, range) {
    return period.start <= range.end && period.end >= range.start;
  }
  compareGanttProjectTitles(a, b, cards) {
    return this.compareGanttDates(this.ganttProjectSortDate(a, cards), this.ganttProjectSortDate(b, cards)) || a.localeCompare(b);
  }
  compareGanttSubprojectTitles(a, b, cards) {
    return this.compareGanttDates(this.ganttSubprojectSortDate(a, cards), this.ganttSubprojectSortDate(b, cards)) || a.localeCompare(b);
  }
  compareGanttCards(a, b) {
    return this.compareGanttDates(this.ganttSortDate(a), this.ganttSortDate(b)) || compareCards(a, b);
  }
  compareGanttDates(a, b) {
    return a.localeCompare(b);
  }
  ganttProjectSortDate(projectTitle, cards) {
    var _a;
    const dates = cards.filter((card) => (card.projectTitle || card.projectTitles[0] || "No project") === projectTitle).map((card) => this.ganttSortDate(card)).filter((date) => date !== "9999-99-99").sort();
    return (_a = dates[0]) != null ? _a : "9999-99-99";
  }
  ganttSubprojectSortDate(subprojectTitle, cards) {
    var _a;
    const subprojectCard = cards.find((card) => card.type === "subproject" && card.title === subprojectTitle);
    if (subprojectCard) return this.ganttSortDate(subprojectCard);
    const dates = cards.filter((card) => card.type === "big_action").filter((card) => subprojectTitle === "No subproject" ? !card.subprojectTitles.length : card.subprojectTitles.includes(subprojectTitle)).map((card) => this.ganttSortDate(card)).filter((date) => date !== "9999-99-99").sort();
    return (_a = dates[0]) != null ? _a : "9999-99-99";
  }
  ganttSortDate(card) {
    return isIsoDate(card.startDate) ? card.startDate : isIsoDate(card.dueDate) ? card.dueDate : isIsoDate(card.nextReview) ? card.nextReview : "9999-99-99";
  }
  ganttBarColor(card) {
    if (!card) return "var(--rpm-project-color, var(--interactive-accent))";
    const status = `${card.status} ${this.statusLabel(card.status)}`.toLowerCase();
    if (/\b(blocked|block)\b/.test(status)) return "#e05252";
    if (/\b(waiting|wait)\b/.test(status)) return "#d9941f";
    if (/\b(done|complete|completed)\b/.test(status)) return "#3cb371";
    if (/\b(active|doing|progress)\b/.test(status)) return "#6278f0";
    if (/\b(inbox|someday)\b/.test(status)) return "#8a8f98";
    return "var(--rpm-project-color, var(--interactive-accent))";
  }
  renderResearchIndex(container, logs) {
    const panel = container.createDiv({ cls: "kanban-rpm-panel kanban-rpm-research-index" });
    panel.createEl("h3", { text: `Research index (${logs.length})` });
    if (!logs.length) {
      panel.createDiv({ cls: "kanban-rpm-empty", text: "No Experiment/Analysis Log rows found." });
      return;
    }
    const table = panel.createEl("table", { cls: "kanban-rpm-table" });
    const thead = table.createEl("thead");
    const header = thead.createEl("tr");
    for (const label of ["Date", "Kind", "Module", "Subject", "Result", "Source"]) header.createEl("th", { text: label });
    const tbody = table.createEl("tbody");
    for (const log of logs.sort((a, b) => b.date.localeCompare(a.date) || a.module.localeCompare(b.module))) {
      const row = tbody.createEl("tr");
      row.createEl("td", { text: log.date });
      row.createEl("td", { text: log.kind });
      row.createEl("td", { text: log.module });
      row.createEl("td", { text: log.subject });
      row.createEl("td", { text: log.result });
      const source = row.createEl("td");
      source.createEl("button", { cls: "kanban-rpm-table-title", text: log.link || log.cardTitle }).addEventListener("click", () => {
        var _a;
        const target = this.resolveLogLink(log);
        void this.plugin.openFilePath((_a = target == null ? void 0 : target.path) != null ? _a : log.cardPath);
      });
    }
  }
  resolveLogLink(log) {
    const match = log.link.match(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/);
    if (!(match == null ? void 0 : match[1])) return null;
    return this.app.metadataCache.getFirstLinkpathDest(match[1], log.cardPath);
  }
  renderTableHeader(row, column, index, table) {
    var _a;
    const { key, label } = column;
    const th = row.createEl("th", { cls: this.tableColumnClass(key) });
    th.style.width = `${(_a = this.tableColumnWidths.get(key)) != null ? _a : column.width}px`;
    const active = this.tableSortKey === key;
    const button = th.createEl("button", {
      cls: active ? "kanban-rpm-table-sort is-active" : "kanban-rpm-table-sort"
    });
    button.createSpan({ cls: active ? "kanban-rpm-table-sort-indicator is-active" : "kanban-rpm-table-sort-indicator", text: active ? this.tableSortDirection === "asc" ? "\u25B2" : "\u25BC" : "" });
    button.createSpan({ text: label });
    button.addEventListener("click", () => {
      if (this.tableSortKey === key) {
        this.tableSortDirection = this.tableSortDirection === "asc" ? "desc" : "asc";
      } else {
        this.tableSortKey = key;
        this.tableSortDirection = "asc";
      }
      this.render();
    });
    this.renderColumnResizer(th, key, index, table);
  }
  renderColumnResizer(th, key, index, table) {
    const handle = th.createDiv({ cls: "kanban-rpm-table-resizer", attr: { role: "separator", "aria-label": `Resize ${key} column` } });
    handle.addEventListener("pointerdown", (event) => {
      var _a;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = (_a = this.tableColumnWidths.get(key)) != null ? _a : TABLE_COLUMNS[index].width;
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const width = Math.max(72, startWidth + moveEvent.clientX - startX);
        this.tableColumnWidths.set(key, width);
        th.style.width = `${width}px`;
        const col = table.querySelectorAll("col").item(index);
        if (col) col.style.width = `${width}px`;
      };
      const end = (endEvent) => {
        handle.releasePointerCapture(endEvent.pointerId);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });
  }
  renderTableRow(tbody, card) {
    const row = tbody.createEl("tr", { cls: card.blockedBy.length ? "is-blocked" : "" });
    row.style.setProperty("--rpm-project-color", this.projectColor(card.colorKey));
    const titleCell = row.createEl("td", { cls: "kanban-rpm-table-title-cell" });
    const titleButton = titleCell.createEl("button", { cls: "kanban-rpm-table-title", text: card.title });
    titleButton.addEventListener("click", () => {
      void this.plugin.openCard(card);
    });
    if (card.nextAction) titleCell.createDiv({ cls: "kanban-rpm-table-subtext", text: card.nextAction });
    const projectCell = row.createEl("td", { cls: "kanban-rpm-table-project-cell" });
    const projectLine = projectCell.createDiv({ cls: "kanban-rpm-table-context" });
    this.addProjectToken(projectLine, card.colorKey);
    projectLine.createSpan({ text: card.breadcrumb || card.projectTitle || "No project" });
    row.createEl("td", { cls: "kanban-rpm-table-type-cell", text: this.cardTypeLabel(card.type) });
    const statusCell = row.createEl("td", { cls: "kanban-rpm-table-status-cell" });
    this.renderStatusBadge(statusCell, card.status, void 0, "button").addEventListener("click", (event) => {
      this.openStatusMenu(event, card);
    });
    const priorityCell = row.createEl("td", { cls: "kanban-rpm-table-priority-cell" });
    this.renderPriorityBadge(priorityCell, card);
    row.createEl("td", { cls: "kanban-rpm-table-date-cell", text: this.cardDateLabel(card) });
    row.createEl("td", { cls: "kanban-rpm-table-flow-cell", text: this.cardDependencyLabel(card) });
    const actionCell = row.createEl("td", { cls: "kanban-rpm-table-actions" });
    const actionRow = actionCell.createDiv({ cls: "kanban-rpm-table-action-row" });
    actionRow.createSpan({ text: `${card.actionCount} tasks` });
    actionRow.createSpan({ text: " - " });
    const edit = actionRow.createSpan({ cls: "kanban-rpm-table-action-link", text: "Edit", attr: { role: "button", tabindex: "0" } });
    edit.addEventListener("click", () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    edit.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
  }
  tableColumnClass(key) {
    return `kanban-rpm-table-column-${key}`;
  }
  renderStatusSelect(container, card) {
    const select = container.createEl("select", { cls: "kanban-rpm-status-select" });
    for (const status of this.plugin.settings.statuses) {
      select.createEl("option", { text: status.label, attr: { value: status.id } });
    }
    select.value = card.status;
    select.addEventListener("change", () => {
      void this.plugin.setCardStatus(card, select.value);
    });
  }
  openStatusMenu(event, card) {
    const menu = new import_obsidian4.Menu();
    for (const status of this.plugin.settings.statuses) {
      menu.addItem((item) => {
        item.setTitle(status.label).setChecked(status.id === card.status).onClick(() => {
          void this.plugin.setCardStatus(card, status.id);
        });
      });
    }
    menu.showAtMouseEvent(event);
  }
  openPriorityMenu(event, card) {
    const menu = new import_obsidian4.Menu();
    for (const priority of [1, 2, 3, 4, 5]) {
      menu.addItem((item) => {
        item.setTitle(`P${priority}`).setChecked(priority === card.priority).onClick(() => {
          void this.plugin.setCardPriority(card, priority);
        });
      });
    }
    menu.showAtMouseEvent(event);
  }
  renderTimelineView(container, visibleBoardCards) {
    this.ensureTimelineStatusFilter();
    const days = this.timelineDays();
    const timelineCards = visibleBoardCards.filter((card) => this.timelineStatusFilter.has(card.status));
    const markers = this.filterTimelineMarkers(this.collectTimelineMarkers(timelineCards, new Set(days)));
    const grouped = this.groupTimelineMarkers(markers);
    const timeline = container.createDiv({ cls: this.timelineSidebarCollapsed ? "kanban-rpm-timeline is-sidebar-collapsed" : "kanban-rpm-timeline" });
    this.renderTimelineSidebar(timeline, visibleBoardCards);
    const main = timeline.createDiv({ cls: "kanban-rpm-timeline-main" });
    this.renderTimelineControls(main);
    const viewport = main.createDiv({ cls: "kanban-rpm-timeline-viewport" });
    viewport.addEventListener("scroll", () => {
      this.rememberTimelineScroll(viewport.scrollLeft, viewport.scrollTop);
    });
    const board = viewport.createDiv({ cls: "kanban-rpm-timeline-board" });
    this.applySurfaceZoom(board, this.timelineZoom);
    for (const day of days) {
      const column = board.createDiv({
        cls: day === todayIso() ? "kanban-rpm-timeline-day-column is-today" : "kanban-rpm-timeline-day-column"
      });
      column.dataset.day = day;
      const header = column.createDiv({ cls: "kanban-rpm-timeline-day-header" });
      header.addEventListener("click", () => {
        void this.openTimelineMemoFile(day);
      });
      header.createDiv({ cls: "kanban-rpm-timeline-day-name", text: this.timelineDayLabel(day) });
      header.createDiv({ cls: "kanban-rpm-timeline-day-date", text: day.slice(5) });
      if (this.timelineMemoVisible) this.renderTimelineMemoSection(column, day);
      const dayGroups = grouped.map((group) => ({ ...group, markers: group.markers.filter((marker) => marker.date === day) })).filter((group) => group.markers.length).sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
      if (!dayGroups.length && !this.timelineMemoVisible) {
        column.createDiv({ cls: "kanban-rpm-timeline-empty-day", text: "No items" });
      } else {
        for (const group of dayGroups) {
          const section = column.createDiv({ cls: "kanban-rpm-timeline-section" });
          const label = section.createDiv({ cls: "kanban-rpm-timeline-section-label" });
          label.style.setProperty("--rpm-project-color", this.projectColor(group.colorKey));
          this.addProjectToken(label, group.colorKey);
          label.createSpan({ text: group.label });
          for (const marker of group.markers) this.renderTimelineMarker(section, marker);
        }
      }
    }
    if (this.timelineScrollLeft !== null) {
      setTimeout(() => {
        var _a, _b;
        viewport.scrollLeft = Math.min((_a = this.timelineScrollLeft) != null ? _a : 0, Math.max(0, viewport.scrollWidth - viewport.clientWidth));
        viewport.scrollTop = Math.min((_b = this.timelineScrollTop) != null ? _b : 0, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
      }, 0);
    } else if (days.includes(this.timelineBaseDate)) {
      setTimeout(() => {
        const todayColumn = board.querySelector(`[data-day="${this.timelineBaseDate}"]`);
        todayColumn == null ? void 0 : todayColumn.scrollIntoView({ block: "nearest", inline: "start" });
        if (this.timelineScrollTop !== null) {
          viewport.scrollTop = Math.min(this.timelineScrollTop, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
        }
      }, 0);
    }
  }
  renderTimelineSidebar(container, cards) {
    const sidebar = container.createDiv({ cls: "kanban-rpm-timeline-sidebar" });
    const header = sidebar.createDiv({ cls: "kanban-rpm-timeline-sidebar-header" });
    header.createEl("h3", { text: "Routine" });
    header.createEl("button", { text: this.timelineSidebarCollapsed ? ">" : "<" }).addEventListener("click", () => {
      this.timelineSidebarCollapsed = !this.timelineSidebarCollapsed;
      this.render();
    });
    if (this.timelineSidebarCollapsed) {
      sidebar.addClass("is-collapsed");
      return;
    }
    const days = this.timelineDays();
    const routines = cards.flatMap(
      (card) => card.routines.map((item) => ({
        item,
        card,
        nextDate: this.nextRecurringDateInRange(item, days)
      }))
    ).filter((routine) => routine.nextDate);
    const list = sidebar.createDiv({ cls: "kanban-rpm-timeline-routines" });
    if (!routines.length) {
      list.createDiv({ cls: "kanban-rpm-empty", text: "No routines yet" });
    }
    const groups = this.groupTimelineRoutines(routines);
    for (const group of groups) {
      const groupEl = list.createEl("details", { cls: "kanban-rpm-timeline-routine-group" });
      groupEl.open = true;
      groupEl.createEl("summary", { cls: "kanban-rpm-timeline-routine-group-title", text: `${group.label} (${group.routines.length})` });
      for (const { item, card, nextDate } of group.routines.slice(0, 8)) {
        const row = groupEl.createDiv({ cls: "kanban-rpm-timeline-routine" });
        const open = row.createEl("button", { cls: "kanban-rpm-timeline-routine-open" });
        open.createSpan({ cls: "kanban-rpm-timeline-routine-text", text: item.text });
        open.createSpan({ cls: "kanban-rpm-timeline-routine-meta", text: `${card.title} - next ${nextDate.slice(5)}` });
        open.addEventListener("click", () => {
          this.openCardPreservingTimelineScroll(card);
        });
        row.createEl("button", { cls: "kanban-rpm-timeline-routine-done", text: "Done" }).addEventListener("click", () => {
          void this.plugin.completeRoutine(card.path, item.text, todayIso());
        });
      }
      if (group.routines.length > 8) groupEl.createDiv({ cls: "kanban-rpm-timeline-routine-more", text: `+${group.routines.length - 8} more` });
    }
  }
  groupTimelineRoutines(routines) {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const routine of routines) {
      const key = this.recurringGroupKey(routine.item);
      const existing = (_a = map.get(key)) != null ? _a : {
        key,
        label: this.recurringGroupLabel(routine.item),
        frequency: this.recurringFrequencyDays(routine.item),
        routines: []
      };
      existing.routines.push(routine);
      map.set(key, existing);
    }
    return Array.from(map.values()).map((group) => ({
      ...group,
      routines: group.routines.sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.card.title.localeCompare(b.card.title) || a.item.text.localeCompare(b.item.text))
    })).sort((a, b) => a.frequency - b.frequency || a.label.localeCompare(b.label));
  }
  nextRecurringDateInRange(item, days) {
    var _a;
    if (typeof item !== "string" && item.startDate && todayIso() < item.startDate) return "";
    if (typeof item !== "string" && item.cadence === "daily") {
      const today = todayIso();
      return days.includes(today) && this.isRecurringItemVisibleOnDay(today, item) && !this.isRecurringItemCompletedForOccurrence(today, item) ? today : "";
    }
    if (typeof item !== "string") {
      const currentOccurrence = this.currentOccurrenceOnOrBefore(todayIso(), item);
      if (currentOccurrence && this.isRecurringItemCompletedForOccurrence(currentOccurrence, item)) return "";
      if (currentOccurrence && days.includes(currentOccurrence)) return currentOccurrence;
    }
    return (_a = days.find((day) => typeof item === "string" ? this.isRecurringVisibleOnDay(day, item) : this.isRecurringItemVisibleOnDay(day, item) && !this.isRecurringItemCompletedForOccurrence(day, item))) != null ? _a : "";
  }
  renderTimelineControls(container) {
    if (this.isPhoneViewport()) {
      this.renderPhoneTimelineControls(container);
      return;
    }
    const controls = container.createDiv({ cls: "kanban-rpm-timeline-controls" });
    controls.createEl("button", { text: "Today" }).addEventListener("click", () => {
      this.resetTimelineScroll();
      this.timelineBaseDate = todayIso();
      this.timelineRangeStart = "";
      this.timelineRangeEnd = "";
      this.render();
    });
    controls.createEl("button", { text: "-7" }).addEventListener("click", () => {
      this.shiftTimelineBase(-7);
      this.render();
    });
    controls.createEl("button", { text: "+7" }).addEventListener("click", () => {
      this.shiftTimelineBase(7);
      this.render();
    });
    const baseDate = controls.createEl("input", {
      cls: "kanban-rpm-timeline-date-input",
      attr: {
        type: "date",
        value: this.timelineBaseDate,
        "aria-label": "Timeline base date"
      }
    });
    baseDate.addEventListener("change", () => {
      const normalized = this.normalizeTimelineDate(baseDate.value);
      if (normalized) {
        this.timelineBaseDate = normalized;
        this.timelineRangeStart = "";
        this.timelineRangeEnd = "";
        this.render();
      }
    });
    const rangeStart = controls.createEl("input", {
      cls: "kanban-rpm-timeline-date-input",
      attr: {
        type: "date",
        value: this.timelineRangeStart,
        "aria-label": "Timeline range start"
      }
    });
    const rangeEnd = controls.createEl("input", {
      cls: "kanban-rpm-timeline-date-input",
      attr: {
        type: "date",
        value: this.timelineRangeEnd,
        "aria-label": "Timeline range end"
      }
    });
    const applyRange = controls.createEl("button", { text: "Apply range" });
    applyRange.addEventListener("click", () => {
      const start = this.normalizeTimelineDate(rangeStart.value);
      const end = this.normalizeTimelineDate(rangeEnd.value);
      if (start && end && start <= end) {
        this.timelineRangeStart = start;
        this.timelineRangeEnd = end;
        this.timelineBaseDate = start;
        this.render();
      }
    });
    controls.createEl("button", { text: this.timelineMemoVisible ? "Hide Memo" : "Show Memo" }).addEventListener("click", () => {
      this.timelineMemoVisible = !this.timelineMemoVisible;
      this.render();
    });
    const search = controls.createEl("input", {
      cls: "kanban-rpm-timeline-search",
      attr: {
        type: "search",
        placeholder: "Timeline search",
        value: this.timelineSearchQuery
      }
    });
    search.addEventListener("input", () => {
      this.timelineSearchQuery = search.value;
      this.render();
    });
    const scope = controls.createEl("select", { cls: "kanban-rpm-timeline-scope" });
    for (const [value, label] of [
      ["all", "Show: All markers"],
      ["review", "Show: Review"],
      ["scheduled", "Show: Scheduled"],
      ["tasks", "Show: Tasks"],
      ["recurring", "Show: Recurring"]
    ]) {
      scope.createEl("option", { text: label, attr: { value } });
    }
    scope.value = this.timelineScope;
    scope.addEventListener("change", () => {
      this.timelineScope = scope.value;
      this.render();
    });
    this.renderZoomControls(controls, this.timelineZoom, async (zoom) => {
      this.timelineZoom = zoom;
      this.plugin.settings.timelineZoom = zoom;
      await this.plugin.saveSettings();
      this.render();
    });
    const statusWrap = controls.createEl("details", { cls: "kanban-rpm-timeline-status-filter" });
    statusWrap.createEl("summary", { text: `Statuses: ${this.timelineStatusFilter.size}` });
    const statusList = statusWrap.createDiv({ cls: "kanban-rpm-timeline-status-list" });
    for (const status of this.plugin.settings.statuses) {
      const label = statusList.createEl("label");
      const checkbox = label.createEl("input", { attr: { type: "checkbox" } });
      checkbox.checked = this.timelineStatusFilter.has(status.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.timelineStatusFilter.add(status.id);
        else this.timelineStatusFilter.delete(status.id);
        this.plugin.settings.timelineStatusFilter = Array.from(this.timelineStatusFilter);
        void this.plugin.saveSettings();
        this.render();
      });
      label.createSpan({ text: status.label });
    }
  }
  renderPhoneTimelineControls(container) {
    const controls = container.createDiv({ cls: "kanban-rpm-timeline-controls kanban-rpm-phone-timeline-controls" });
    const primary = controls.createDiv({ cls: "kanban-rpm-phone-timeline-primary" });
    primary.createEl("button", {
      cls: "kanban-rpm-phone-routine-toggle",
      text: this.timelineSidebarCollapsed ? "Routine >" : "Routine <",
      attr: { "aria-expanded": String(!this.timelineSidebarCollapsed) }
    }).addEventListener("click", () => {
      this.timelineSidebarCollapsed = !this.timelineSidebarCollapsed;
      this.render();
    });
    primary.createEl("button", { text: "Today" }).addEventListener("click", () => {
      this.resetTimelineScroll();
      this.timelineBaseDate = todayIso();
      this.timelineRangeStart = "";
      this.timelineRangeEnd = "";
      this.render();
    });
    primary.createEl("button", { text: "-7" }).addEventListener("click", () => {
      this.shiftTimelineBase(-7);
      this.render();
    });
    primary.createEl("button", { text: "+7" }).addEventListener("click", () => {
      this.shiftTimelineBase(7);
      this.render();
    });
    primary.createEl("button", { text: this.timelineMemoVisible ? "Memo on" : "Memo off" }).addEventListener("click", () => {
      this.timelineMemoVisible = !this.timelineMemoVisible;
      this.render();
    });
    primary.createEl("button", {
      cls: this.phoneTimelineControlsExpanded ? "kanban-rpm-panel-toggle is-active" : "kanban-rpm-panel-toggle",
      text: this.phoneTimelineControlsExpanded ? "Less" : "More",
      attr: { "aria-expanded": String(this.phoneTimelineControlsExpanded) }
    }).addEventListener("click", () => {
      this.phoneTimelineControlsExpanded = !this.phoneTimelineControlsExpanded;
      this.render();
    });
    if (!this.phoneTimelineControlsExpanded) return;
    const secondary = controls.createDiv({ cls: "kanban-rpm-phone-timeline-secondary" });
    const baseDate = secondary.createEl("input", {
      cls: "kanban-rpm-timeline-date-input",
      attr: {
        type: "date",
        value: this.timelineBaseDate,
        "aria-label": "Timeline base date"
      }
    });
    baseDate.addEventListener("change", () => {
      const normalized = this.normalizeTimelineDate(baseDate.value);
      if (normalized) {
        this.resetTimelineScroll();
        this.timelineBaseDate = normalized;
        this.timelineRangeStart = "";
        this.timelineRangeEnd = "";
        this.render();
      }
    });
    const rangeStart = secondary.createEl("input", {
      cls: "kanban-rpm-timeline-date-input",
      attr: {
        type: "date",
        value: this.timelineRangeStart,
        "aria-label": "Timeline range start"
      }
    });
    const rangeEnd = secondary.createEl("input", {
      cls: "kanban-rpm-timeline-date-input",
      attr: {
        type: "date",
        value: this.timelineRangeEnd,
        "aria-label": "Timeline range end"
      }
    });
    secondary.createEl("button", { text: "Apply" }).addEventListener("click", () => {
      const start = this.normalizeTimelineDate(rangeStart.value);
      const end = this.normalizeTimelineDate(rangeEnd.value);
      if (start && end && start <= end) {
        this.resetTimelineScroll();
        this.timelineRangeStart = start;
        this.timelineRangeEnd = end;
        this.timelineBaseDate = start;
        this.render();
      }
    });
    const search = secondary.createEl("input", {
      cls: "kanban-rpm-timeline-search",
      attr: {
        type: "search",
        placeholder: "Search",
        value: this.timelineSearchQuery
      }
    });
    search.addEventListener("input", () => {
      this.timelineSearchQuery = search.value;
      this.render();
    });
    const scope = secondary.createEl("select", { cls: "kanban-rpm-timeline-scope" });
    for (const [value, label] of [
      ["all", "All"],
      ["review", "Review"],
      ["scheduled", "Scheduled"],
      ["tasks", "Tasks"],
      ["recurring", "Recurring"]
    ]) {
      scope.createEl("option", { text: label, attr: { value } });
    }
    scope.value = this.timelineScope;
    scope.addEventListener("change", () => {
      this.timelineScope = scope.value;
      this.render();
    });
    this.renderZoomControls(secondary, this.timelineZoom, async (zoom) => {
      this.timelineZoom = zoom;
      this.plugin.settings.timelineZoom = zoom;
      await this.plugin.saveSettings();
      this.render();
    });
    const statusWrap = secondary.createEl("details", { cls: "kanban-rpm-timeline-status-filter" });
    statusWrap.createEl("summary", { text: `Statuses ${this.timelineStatusFilter.size}` });
    const statusList = statusWrap.createDiv({ cls: "kanban-rpm-timeline-status-list" });
    for (const status of this.plugin.settings.statuses) {
      const label = statusList.createEl("label");
      const checkbox = label.createEl("input", { attr: { type: "checkbox" } });
      checkbox.checked = this.timelineStatusFilter.has(status.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.timelineStatusFilter.add(status.id);
        else this.timelineStatusFilter.delete(status.id);
        this.plugin.settings.timelineStatusFilter = Array.from(this.timelineStatusFilter);
        void this.plugin.saveSettings();
        this.render();
      });
      label.createSpan({ text: status.label });
    }
  }
  renderTimelineMemoSection(container, day) {
    const section = container.createDiv({ cls: "kanban-rpm-timeline-section kanban-rpm-timeline-memo-section" });
    const header = section.createDiv({ cls: "kanban-rpm-timeline-section-label" });
    header.createSpan({ text: "Memo" });
    const controls = header.createDiv({ cls: "kanban-rpm-timeline-memo-controls" });
    const list = section.createDiv({ cls: "kanban-rpm-timeline-memo-list" });
    controls.createEl("button", { text: "+ todo" }).addEventListener("click", () => {
      void this.openTimelineMemoModal(day, "todo");
    });
    controls.createEl("button", { text: "+ text" }).addEventListener("click", () => {
      void this.openTimelineMemoModal(day, "text");
    });
    void this.readTimelineMemo(day).then((memo) => {
      list.empty();
      const items = this.parseTimelineMemoItems(memo);
      if (!items.length) {
        list.createDiv({ cls: "kanban-rpm-timeline-memo-empty", text: "No memo yet" });
        return;
      }
      this.renderTimelineMemoItem(list, day, memo, items[0]);
    });
  }
  renderTimelineMemoItem(container, day, memo, item) {
    const row = container.createDiv({ cls: "kanban-rpm-timeline-memo-card" });
    const body = row.createDiv({ cls: "kanban-rpm-timeline-memo-preview" });
    this.renderMiniMarkdown(body, item.content, (lineIndex, done) => {
      void this.toggleTimelineMemoCheckbox(day, item.content, lineIndex, done);
    });
    const edit = this.createIconButton(row, "pencil", "Edit memo");
    edit.addEventListener("click", () => {
      void this.openTimelineMemoModal(day);
    });
  }
  parseTimelineMemoItems(memo) {
    const content = memo.trimEnd();
    return content ? [{ content }] : [];
  }
  async toggleTimelineMemoCheckbox(day, memo, lineIndex, done) {
    var _a;
    const lines = memo.split(/\r?\n/);
    const match = (_a = lines[lineIndex]) == null ? void 0 : _a.match(/^(\s*[-*]\s+\[)[ xX](\]\s+.*)$/);
    if (!match) return;
    lines[lineIndex] = `${match[1]}${done ? "x" : " "}${match[2]}`;
    await this.saveTimelineMemo(day, lines.join("\n"));
    this.render();
  }
  async openTimelineMemoModal(day, seed) {
    const memo = await this.readTimelineMemo(day);
    const initial = this.seedTimelineMemo(memo, seed);
    new TimelineMemoModal(this.app, day, initial, async (value) => {
      await this.saveTimelineMemo(day, value);
      this.render();
    }).open();
  }
  seedTimelineMemo(memo, seed) {
    if (!seed) return memo;
    const trimmed = memo.trimEnd();
    const addition = seed === "todo" ? "- [ ] " : "";
    if (!trimmed) return addition;
    return `${trimmed}
${addition}`;
  }
  renderMiniMarkdown(container, markdown, onCheckbox) {
    const lines = markdown.split(/\r?\n/);
    let list = null;
    for (const [lineIndex, line] of lines.entries()) {
      if (!line.trim()) {
        list = null;
        continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        list = null;
        const level = Math.min(6, heading[1].length + 3);
        container.createEl(`h${level}`, { text: heading[2] });
        continue;
      }
      const checkbox = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (checkbox) {
        list = null;
        const done = checkbox[1].toLowerCase() === "x";
        const row = container.createEl("label", { cls: done ? "kanban-rpm-timeline-memo-checkbox is-done" : "kanban-rpm-timeline-memo-checkbox" });
        const input = row.createEl("input", { attr: { type: "checkbox" } });
        input.checked = done;
        input.addEventListener("change", () => onCheckbox(lineIndex, input.checked));
        row.createSpan({ text: checkbox[2] });
        continue;
      }
      const bullet = line.match(/^\s*[-*]\s+(.+)$/);
      if (bullet) {
        if (!list) list = container.createEl("ul");
        list.createEl("li", { text: bullet[1] });
        continue;
      }
      list = null;
      container.createEl("p", { text: line });
    }
  }
  renderTimelineMarker(container, marker) {
    if (marker.kind === "recurring") {
      this.renderRecurringTimelineChip(container, marker);
      return;
    }
    if (marker.kind === "task") {
      this.renderTaskTimelineChip(container, marker);
      return;
    }
    const item = container.createDiv({
      cls: `kanban-rpm-timeline-marker kanban-rpm-timeline-marker-${marker.kind} kanban-rpm-type-${marker.card.type.replace("_", "-")}`,
      attr: { title: `${marker.card.title} - ${marker.label}` }
    });
    item.style.setProperty("--rpm-project-color", this.projectColor(marker.card.colorKey));
    const titleRow = item.createDiv({ cls: "kanban-rpm-timeline-marker-title-row" });
    titleRow.createSpan({ cls: "kanban-rpm-timeline-marker-icon", text: this.timelineMarkerIcon(marker.kind) });
    const label = titleRow.createEl("button", { cls: "kanban-rpm-timeline-marker-title", text: marker.label });
    label.addEventListener("click", () => {
      this.openCardPreservingTimelineScroll(marker.card);
    });
    if (marker.card.nextAction) {
      item.createDiv({ cls: "kanban-rpm-timeline-marker-focus", text: marker.card.nextAction });
    }
    const meta = item.createDiv({ cls: "kanban-rpm-timeline-marker-meta" });
    const badges = meta.createDiv({ cls: "kanban-rpm-timeline-marker-badges" });
    this.renderStatusBadge(badges, marker.card.status, void 0, "button").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openStatusMenu(event, marker.card);
    });
    this.renderPriorityBadge(badges, marker.card, "button").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openPriorityMenu(event, marker.card);
    });
    const actions = meta.createDiv({ cls: "kanban-rpm-timeline-marker-actions-menu" });
    this.createIconButton(actions, "pencil", `Edit ${marker.card.title}`, "kanban-rpm-timeline-marker-edit").addEventListener("click", (event) => {
      event.stopPropagation();
      new EditProjectCardModal(this.app, this.plugin, marker.card).open();
    });
    this.renderCardMoreMenu(actions, marker.card, "kanban-rpm-timeline-card-more");
    const smallActions = this.getTimelineCardSmallActions(marker.card);
    if (smallActions.length) {
      const list = item.createDiv({ cls: "kanban-rpm-timeline-marker-actions" });
      const openActions = smallActions.filter((action) => !action.done);
      const doneActions = smallActions.filter((action) => action.done);
      this.renderSmallActionSection(list, marker.card, "open", `Open: ${openActions.length}`, openActions, true);
      this.renderSmallActionSection(list, marker.card, "done", `Done: ${doneActions.length}`, doneActions, false);
    }
  }
  renderTaskTimelineChip(container, marker) {
    const action = marker.action;
    const chip = container.createDiv({
      cls: `kanban-rpm-timeline-task-chip kanban-rpm-type-${marker.card.type.replace("_", "-")}`,
      attr: { title: `${marker.card.title} - ${marker.label}` }
    });
    chip.style.setProperty("--rpm-project-color", this.projectColor(marker.card.colorKey));
    if (action) {
      const checkbox = chip.createEl("input", { attr: { type: "checkbox", "aria-label": `Complete ${action.text}` } });
      checkbox.checked = action.done;
      checkbox.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      checkbox.addEventListener("change", () => {
        void this.plugin.toggleSmallAction(action);
      });
    } else {
      chip.createSpan({ cls: "kanban-rpm-timeline-task-icon", text: "?" });
    }
    const text2 = chip.createDiv({ cls: "kanban-rpm-timeline-task-text" });
    text2.createEl("button", { cls: "kanban-rpm-timeline-task-title", text: marker.label }).addEventListener("click", () => {
      this.openCardPreservingTimelineScroll(marker.card);
    });
    const sourceRow = text2.createDiv({ cls: "kanban-rpm-timeline-task-source-row" });
    sourceRow.createSpan({ cls: "kanban-rpm-timeline-task-source", text: marker.card.title });
    if (action) {
      this.createIconButton(sourceRow, "pencil", `Edit small action metadata for ${action.text}`, "kanban-rpm-timeline-task-edit").addEventListener("click", (event) => {
        event.stopPropagation();
        new SmallActionMetadataModal(this.app, action, (values) => this.plugin.updateSmallActionMetadata(action, values)).open();
      });
      if (action.dueDate) {
        text2.createSpan({ cls: isPastDate(action.dueDate) ? "kanban-rpm-timeline-task-due is-overdue" : "kanban-rpm-timeline-task-due", text: `due ${this.shortDateLabel(action.dueDate)}` });
      }
    }
  }
  renderRecurringTimelineChip(container, marker) {
    const chip = container.createEl("button", {
      cls: `kanban-rpm-timeline-recurring-chip kanban-rpm-type-${marker.card.type.replace("_", "-")}`,
      attr: { title: `${marker.card.title} - ${marker.label}` }
    });
    chip.style.setProperty("--rpm-project-color", this.projectColor(marker.card.colorKey));
    chip.createSpan({ cls: "kanban-rpm-timeline-recurring-icon", text: "?" });
    chip.createSpan({ cls: "kanban-rpm-timeline-recurring-text", text: marker.label.replace(/^(daily|weekly|monthly|custom):\s*/, "") });
    chip.addEventListener("click", () => {
      this.openCardPreservingTimelineScroll(marker.card);
    });
  }
  collectTimelineMarkers(cards, daySet) {
    const markers = [];
    for (const card of cards) {
      if (card.scheduledDate && daySet.has(card.scheduledDate)) {
        markers.push({ date: card.scheduledDate, label: card.title, kind: "scheduled", card });
      }
      if (card.nextReview && daySet.has(card.nextReview)) {
        markers.push({ date: card.nextReview, label: card.title, kind: "review", card });
      }
      for (const action of card.smallActions) {
        if (action.done) continue;
        const date = action.scheduledDate || action.dueDate;
        if (date && date === card.scheduledDate) continue;
        if (date && daySet.has(date)) {
          markers.push({ date, label: action.text, kind: "task", card, action });
        }
      }
      if (card.routines.length) {
        for (const day of daySet) {
          for (const item of card.routines) {
            if (item.cadence === "daily" && day !== todayIso()) continue;
            if (this.isRecurringItemVisibleOnDay(day, item)) {
              if (this.isRecurringItemCompletedForOccurrence(day, item)) continue;
              markers.push({ date: day, label: `${item.cadence}: ${item.text}`, kind: "recurring", card });
            }
          }
        }
      }
    }
    return markers.sort((a, b) => this.compareTimelineMarkers(a, b));
  }
  compareTimelineMarkers(a, b) {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    const priorityDiff = this.timelineMarkerPriority(a) - this.timelineMarkerPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    const cardPriorityDiff = (a.card.priority || 3) - (b.card.priority || 3);
    if (cardPriorityDiff !== 0) return cardPriorityDiff;
    const kindDiff = this.timelineMarkerKindRank(a.kind) - this.timelineMarkerKindRank(b.kind);
    if (kindDiff !== 0) return kindDiff;
    return `${a.card.title} ${a.label}`.localeCompare(`${b.card.title} ${b.label}`, void 0, { sensitivity: "base" });
  }
  timelineMarkerPriority(marker) {
    if (marker.action) return this.smallActionPriorityRank(marker.action.priority);
    return marker.card.priority || 3;
  }
  smallActionPriorityRank(priority) {
    if (priority === "highest") return 1;
    if (priority === "high") return 2;
    if (priority === "low") return 4;
    if (priority === "lowest") return 5;
    return 3;
  }
  timelineMarkerKindRank(kind) {
    if (kind === "scheduled") return 0;
    if (kind === "task") return 1;
    if (kind === "review") return 2;
    return 3;
  }
  timelineMarkerIcon(kind) {
    if (kind === "scheduled") return "S";
    if (kind === "review") return "R";
    if (kind === "task") return "T";
    return "R";
  }
  filterTimelineMarkers(markers) {
    const query = this.timelineSearchQuery.trim().toLowerCase();
    return markers.filter((marker) => {
      if (this.timelineScope !== "all" && marker.kind !== this.timelineScope && !(this.timelineScope === "tasks" && marker.kind === "task")) {
        return false;
      }
      if (!query) return true;
      return [marker.label, marker.card.title, marker.card.breadcrumb, marker.card.workstreamType].join(" ").toLowerCase().includes(query);
    });
  }
  groupTimelineMarkers(markers) {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const marker of markers) {
      const project = this.projectFilter || marker.card.projectTitle || marker.card.projectTitles[0] || "No project";
      const subproject = this.subprojectFilter || marker.card.subprojectTitle || marker.card.subprojectTitles[0] || "";
      const priority = this.timelineMarkerPriority(marker);
      const label = [project, subproject].filter(Boolean).join(" > ");
      const key = `${priority}>${project}>${subproject}`;
      const existing = (_a = map.get(key)) != null ? _a : {
        label,
        colorKey: marker.card.colorKey || marker.card.projectTitle || label,
        priority,
        markers: []
      };
      existing.markers.push(marker);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
  }
  ensureTimelineStatusFilter() {
    var _a, _b, _c;
    const valid = new Set(this.plugin.settings.statuses.map((status) => status.id));
    this.timelineStatusFilter = new Set(Array.from(this.timelineStatusFilter).filter((status) => valid.has(status)));
    if (!this.timelineStatusFilter.size) {
      this.timelineStatusFilter = new Set(this.plugin.settings.timelineStatusFilter.filter((status) => valid.has(status)));
    }
    if (this.timelineStatusFilter.size) return;
    const activeStatus = (_c = (_a = this.plugin.settings.statuses.find((status) => status.id === "active")) == null ? void 0 : _a.id) != null ? _c : (_b = this.plugin.settings.statuses[0]) == null ? void 0 : _b.id;
    if (activeStatus) this.timelineStatusFilter.add(activeStatus);
  }
  ensureBoardStatusFilter() {
    const valid = new Set(this.plugin.settings.statuses.map((status) => status.id));
    this.boardStatusFilter = new Set(Array.from(this.boardStatusFilter).filter((status) => valid.has(status)));
    if (!this.boardStatusFilter.size) {
      this.boardStatusFilter = new Set(this.plugin.settings.boardStatusFilter.filter((status) => valid.has(status)));
    }
    if (this.boardStatusFilter.size) return;
    this.boardStatusFilter = new Set(this.plugin.settings.statuses.map((status) => status.id));
  }
  ensureBoardStatusOrder() {
    const statusIds = this.plugin.settings.statuses.map((status) => status.id);
    const valid = new Set(statusIds);
    const current = this.plugin.settings.boardStatusOrder.filter((status) => valid.has(status));
    const missing = statusIds.filter((status) => !current.includes(status));
    const next = [...current, ...missing];
    this.plugin.settings.boardStatusOrder = next;
  }
  orderedBoardStatuses() {
    this.ensureBoardStatusOrder();
    const byId = new Map(this.plugin.settings.statuses.map((status) => [status.id, status]));
    return this.plugin.settings.boardStatusOrder.map((id) => byId.get(id)).filter((status) => Boolean(status));
  }
  async moveBoardStatus(statusId, direction) {
    this.ensureBoardStatusOrder();
    const order = [...this.plugin.settings.boardStatusOrder];
    const visible = order.filter((id) => this.boardStatusFilter.has(id));
    const visibleIndex = visible.indexOf(statusId);
    const targetStatus = visible[visibleIndex + direction];
    if (visibleIndex < 0 || !targetStatus) return;
    const fromIndex = order.indexOf(statusId);
    if (fromIndex < 0) return;
    order.splice(fromIndex, 1);
    const targetIndex = order.indexOf(targetStatus);
    if (targetIndex < 0) return;
    order.splice(direction < 0 ? targetIndex : targetIndex + 1, 0, statusId);
    this.plugin.settings.boardStatusOrder = order;
    await this.plugin.saveSettings();
    this.render();
  }
  ensureViewFilters() {
    let changed = false;
    const projectValues = new Set(this.uniqueValues("projectTitle"));
    if (this.projectFilter && !projectValues.has(this.projectFilter)) {
      this.projectFilter = "";
      this.subprojectFilter = "";
      changed = true;
    }
    const subprojectValues = new Set(this.subprojectFilterValues());
    if (this.subprojectFilter && !subprojectValues.has(this.subprojectFilter)) {
      this.subprojectFilter = "";
      changed = true;
    }
    const categoryValues = new Set(this.uniqueCategoryValues().map((category) => category.id));
    if (this.workstreamTypeFilter && !categoryValues.has(this.workstreamTypeFilter)) {
      this.workstreamTypeFilter = "";
      changed = true;
    }
    return changed;
  }
  loadViewFilters(mode) {
    var _a;
    const filters = (_a = this.plugin.settings.viewFilters[mode]) != null ? _a : this.plugin.settings.viewFilters.board;
    this.projectFilter = filters.project;
    this.subprojectFilter = filters.subproject;
    this.workstreamTypeFilter = filters.category;
  }
  async saveViewFilters() {
    this.plugin.settings.viewFilters[this.viewMode] = {
      project: this.projectFilter,
      subproject: this.subprojectFilter,
      category: this.workstreamTypeFilter
    };
    if (this.viewMode === "board") {
      this.plugin.settings.boardProjectFilter = this.projectFilter;
      this.plugin.settings.boardSubprojectFilter = this.subprojectFilter;
      this.plugin.settings.boardCategoryFilter = this.workstreamTypeFilter;
    }
    await this.plugin.saveSettings();
  }
  timelineDays() {
    const start = this.timelineRangeStart || addDays(this.timelineBaseDate, -7);
    const end = this.timelineRangeEnd || addDays(this.timelineBaseDate, 7);
    return dateRange(start, end);
  }
  shiftTimelineBase(days) {
    this.resetTimelineScroll();
    this.timelineBaseDate = addDays(this.timelineBaseDate, days);
    this.timelineRangeStart = "";
    this.timelineRangeEnd = "";
  }
  resetTimelineScroll() {
    this.timelineScrollLeft = null;
    this.timelineScrollTop = null;
    this.plugin.settings.timelineScrollLeft = null;
    this.plugin.settings.timelineScrollTop = null;
    void this.plugin.saveSettings();
  }
  rememberTimelineScroll(scrollLeft, scrollTop) {
    const nextLeft = Math.max(0, Math.round(scrollLeft));
    const nextTop = Math.max(0, Math.round(scrollTop));
    this.timelineScrollLeft = nextLeft;
    this.timelineScrollTop = nextTop;
    this.plugin.settings.timelineScrollLeft = nextLeft;
    this.plugin.settings.timelineScrollTop = nextTop;
    this.scheduleTimelineScrollSave();
  }
  preserveTimelineScrollFromDom() {
    const viewport = this.containerEl.querySelector(".kanban-rpm-timeline-viewport");
    if (!viewport) return;
    this.rememberTimelineScroll(viewport.scrollLeft, viewport.scrollTop);
    void this.plugin.saveSettings();
  }
  openCardPreservingTimelineScroll(card) {
    if (this.viewMode === "timeline") this.preserveTimelineScrollFromDom();
    void this.plugin.openCard(card);
  }
  scheduleTimelineScrollSave() {
    if (this.timelineScrollSaveTimer !== void 0) window.clearTimeout(this.timelineScrollSaveTimer);
    this.timelineScrollSaveTimer = window.setTimeout(() => {
      this.timelineScrollSaveTimer = void 0;
      void this.plugin.saveSettings();
    }, 400);
  }
  ganttMonthSegments(start, end) {
    return monthRange(start, end).map((month) => ({
      key: month,
      label: this.ganttMonthLabel(month),
      start: `${month}-01`,
      end: endOfMonth(`${month}-01`)
    })).map((segment) => ({
      ...segment,
      start: segment.start < start ? start : segment.start,
      end: segment.end > end ? end : segment.end
    }));
  }
  ganttWeekSegments(start, end) {
    const segments = [];
    for (const month of monthRange(start, end)) {
      const monthStart = `${month}-01`;
      const monthEnd = endOfMonth(monthStart);
      let cursor = monthStart;
      let index = 1;
      while (cursor <= monthEnd) {
        const segmentStart = cursor;
        const segmentEnd = addDays(segmentStart, 6) > monthEnd ? monthEnd : addDays(segmentStart, 6);
        if (segmentEnd >= start && segmentStart <= end) {
          segments.push({
            key: `${month}-W${index}`,
            label: `W${index}`,
            start: segmentStart < start ? start : segmentStart,
            end: segmentEnd > end ? end : segmentEnd
          });
        }
        cursor = addDays(segmentEnd, 1);
        index += 1;
      }
    }
    return segments;
  }
  ganttQuarterSegments(start, end) {
    const segments = [];
    const first = /* @__PURE__ */ new Date(`${start.slice(0, 7)}-01T00:00:00`);
    first.setMonth(Math.floor(first.getMonth() / 3) * 3);
    const last = /* @__PURE__ */ new Date(`${end.slice(0, 7)}-01T00:00:00`);
    for (const date = new Date(first); date <= last; date.setMonth(date.getMonth() + 3)) {
      const quarterStart = formatDate(date);
      const quarterEndDate = new Date(date);
      quarterEndDate.setMonth(quarterEndDate.getMonth() + 3);
      quarterEndDate.setDate(0);
      const quarterEnd = formatDate(quarterEndDate);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      segments.push({
        key: `${date.getFullYear()}-Q${quarter}`,
        label: `${date.getFullYear()} Q${quarter}`,
        start: quarterStart < start ? start : quarterStart,
        end: quarterEnd > end ? end : quarterEnd
      });
      if (segments.length > 24) break;
    }
    return segments;
  }
  ganttMonthLabel(month) {
    const date = /* @__PURE__ */ new Date(`${month}-01T00:00:00`);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
  }
  normalizeTimelineDate(value) {
    const normalized = value.trim().replace(/[./]/g, "-");
    return isIsoDate(normalized) ? normalized : "";
  }
  toDisplayDate(value) {
    return value ? value.replace(/-/g, ".") : "";
  }
  timelineDayLabel(day) {
    const date = /* @__PURE__ */ new Date(`${day}T00:00:00`);
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  }
  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  isRecurringVisibleOnDay(day, cadence) {
    if (cadence === "daily") return true;
    const date = /* @__PURE__ */ new Date(`${day}T00:00:00`);
    const base = /* @__PURE__ */ new Date(`${this.timelineBaseDate}T00:00:00`);
    if (cadence === "weekly") return date.getDay() === base.getDay();
    if (cadence === "custom") return false;
    return date.getDate() === base.getDate();
  }
  isRecurringItemVisibleOnDay(day, item) {
    const start = item.startDate;
    if (!start) return false;
    if (day < start) return false;
    if (item.cadence === "daily") return true;
    const startDate = /* @__PURE__ */ new Date(`${start}T00:00:00`);
    const current = /* @__PURE__ */ new Date(`${day}T00:00:00`);
    if (item.cadence === "weekly") return current.getDay() === startDate.getDay();
    if (item.cadence === "monthly") return current.getDate() === startDate.getDate();
    if (item.unit === "day") {
      const diff = Math.floor((current.getTime() - startDate.getTime()) / 864e5);
      return diff >= 0 && diff % Math.max(1, item.interval) === 0;
    }
    if (item.unit === "week") {
      const diff = Math.floor((current.getTime() - startDate.getTime()) / 864e5);
      return diff >= 0 && diff % (Math.max(1, item.interval) * 7) === 0;
    }
    if (current.getDate() !== startDate.getDate()) return false;
    const monthDiff = (current.getFullYear() - startDate.getFullYear()) * 12 + current.getMonth() - startDate.getMonth();
    return monthDiff >= 0 && monthDiff % Math.max(1, item.interval) === 0;
  }
  isRecurringItemCompletedForOccurrence(day, item) {
    const next = this.nextOccurrenceAfter(day, item);
    return item.completedDates.some((completed) => completed >= day && (!next || completed < next));
  }
  currentOccurrenceOnOrBefore(day, item) {
    if (item.startDate && item.startDate > day) return "";
    for (let offset = 0; offset <= 370; offset += 1) {
      const candidate = addDays(day, -offset);
      if (item.startDate && candidate < item.startDate) return "";
      if (this.isRecurringItemVisibleOnDay(candidate, item)) return candidate;
    }
    return "";
  }
  nextOccurrenceAfter(day, item) {
    for (let offset = 1; offset <= 370; offset += 1) {
      const candidate = addDays(day, offset);
      if (this.isRecurringItemVisibleOnDay(candidate, item)) return candidate;
    }
    return "";
  }
  recurringGroupKey(item) {
    if (item.cadence !== "custom") return item.cadence;
    return `${item.interval}${item.unit}`;
  }
  recurringGroupLabel(item) {
    if (item.cadence === "daily") return "Daily";
    if (item.cadence === "weekly") return "Weekly";
    if (item.cadence === "monthly") return "Monthly";
    const unit = item.unit === "day" ? "D" : item.unit === "week" ? "W" : "M";
    return `Every ${item.interval}${unit}`;
  }
  recurringFrequencyDays(item) {
    if (item.cadence === "daily") return 1;
    if (item.cadence === "weekly") return 7;
    if (item.cadence === "monthly") return 30;
    if (item.unit === "day") return item.interval;
    if (item.unit === "week") return item.interval * 7;
    return item.interval * 30;
  }
  async readTimelineMemo(day) {
    const file = await this.ensureTimelineMemoFile(day);
    if (!file) return "";
    const content = await this.app.vault.read(file);
    return this.extractMemoBody(content);
  }
  async saveTimelineMemo(day, memo) {
    const file = await this.ensureTimelineMemoFile(day, true);
    if (!file) return;
    const content = await this.app.vault.read(file);
    const next = this.replaceMemoBody(content, memo);
    if (next !== content) await this.app.vault.modify(file, next);
  }
  async openTimelineMemoFile(day) {
    this.preserveTimelineScrollFromDom();
    const file = await this.ensureTimelineMemoFile(day, true);
    if (file) await this.app.workspace.getLeaf(false).openFile(file);
  }
  async ensureTimelineMemoFile(day, create = false) {
    await this.plugin.ensureWorkspace();
    const folder = (0, import_obsidian2.normalizePath)(`${this.plugin.workspaceFolder}/timeline`);
    if (create && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    const path = (0, import_obsidian2.normalizePath)(`${folder}/${day}.md`);
    let file = null;
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian2.TFile) file = existing;
    if (!(file instanceof import_obsidian2.TFile) && create) {
      file = await this.app.vault.create(path, `# ${day} Timeline Memo

## Memo

## Notes
`);
    }
    return file;
  }
  extractMemoBody(content) {
    const section = this.findMarkdownSection(content, "Memo", 2);
    if (!section) return "";
    return section.bodyLines.join("\n").trimEnd();
  }
  replaceMemoBody(content, memo) {
    const normalized = memo.trimEnd();
    const lines = content.split(/\r?\n/);
    const section = this.findMarkdownSection(content, "Memo", 2);
    const replacement = ["## Memo", "", ...normalized.split("\n").filter((_, index, array) => normalized || index < array.length - 1)];
    if (normalized) replacement.push("");
    if (!section) {
      const prefix = content.trimEnd();
      return `${prefix}${prefix ? "\n\n" : ""}${replacement.join("\n")}`;
    }
    const next = [...lines.slice(0, section.headingLine), ...replacement, ...lines.slice(section.endLine)];
    return next.join("\n").replace(/\n{4,}/g, "\n\n\n");
  }
  findMarkdownSection(content, title, level) {
    const lines = content.split(/\r?\n/);
    const headingPattern = new RegExp(`^#{${level}}\\s+${this.escapeRegex(title)}\\s*$`, "i");
    const anyHeadingPattern = /^(#{1,6})\s+\S/;
    const headingLine = lines.findIndex((line) => headingPattern.test(line.trimEnd()));
    if (headingLine < 0) return null;
    let bodyStart = headingLine + 1;
    if (lines[bodyStart] === "") bodyStart += 1;
    let endLine = lines.length;
    for (let index = bodyStart; index < lines.length; index += 1) {
      const match = lines[index].match(anyHeadingPattern);
      if (match && match[1].length <= level) {
        endLine = index;
        break;
      }
    }
    return {
      headingLine,
      endLine,
      bodyLines: lines.slice(bodyStart, endLine)
    };
  }
  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  sortTableCards(cards) {
    const sorted = [...cards].sort((a, b) => {
      const aValue = this.tableSortValue(a, this.tableSortKey);
      const bValue = this.tableSortValue(b, this.tableSortKey);
      const result = aValue.localeCompare(bValue, void 0, { numeric: true, sensitivity: "base" });
      return result || compareCards(a, b);
    });
    if (this.tableSortDirection === "desc") sorted.reverse();
    return sorted;
  }
  renderPhoneSortBar(container) {
    const bar = container.createDiv({ cls: "kanban-rpm-phone-sortbar" });
    const sort = bar.createEl("select", { attr: { "aria-label": "Sort cards" } });
    for (const column of TABLE_COLUMNS) {
      sort.createEl("option", { value: column.key, text: column.label });
    }
    sort.value = this.tableSortKey;
    sort.addEventListener("change", () => {
      this.tableSortKey = sort.value;
      this.render();
    });
    const direction = bar.createEl("button", { text: this.tableSortDirection === "asc" ? "\u25B2" : "\u25BC", attr: { "aria-label": "Toggle sort direction" } });
    direction.addEventListener("click", () => {
      this.tableSortDirection = this.tableSortDirection === "asc" ? "desc" : "asc";
      this.render();
    });
  }
  renderPhonePlanningCard(container, card, context) {
    const item = container.createDiv({ cls: `kanban-rpm-phone-planning-card kanban-rpm-type-${card.type.replace("_", "-")}` });
    item.style.setProperty("--rpm-project-color", this.projectColor(card.colorKey));
    const head = item.createDiv({ cls: "kanban-rpm-phone-planning-head" });
    const title = head.createEl("button", { cls: "kanban-rpm-phone-planning-title", text: card.title });
    title.addEventListener("click", () => {
      void this.plugin.openCard(card);
    });
    const actions = head.createDiv({ cls: "kanban-rpm-card-title-actions" });
    this.renderPriorityBadge(actions, card);
    this.createIconButton(actions, "pencil", `Edit ${card.title}`).addEventListener("click", () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    this.renderCardMoreMenu(actions, card);
    const meta = item.createDiv({ cls: "kanban-rpm-phone-planning-meta" });
    this.renderStatusBadge(meta, card.status, void 0, "button").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openStatusMenu(event, card);
    });
    meta.createSpan({ text: this.cardTypeLabel(card.type) });
    if (card.breadcrumb) meta.createSpan({ text: card.breadcrumb });
    if (card.workstreamType) meta.createSpan({ text: this.categoryLabel(card.workstreamType) });
    const dates = item.createDiv({ cls: "kanban-rpm-phone-planning-dates" });
    if (context === "gantt") {
      const range = [card.startDate || "No start", card.dueDate || "No due"].join(" -> ");
      dates.createSpan({ text: range });
    }
    if (card.scheduledDate) dates.createSpan({ text: `scheduled ${card.scheduledDate}` });
    if (card.nextReview) dates.createSpan({ text: `review ${card.nextReview}` });
    if (!dates.childElementCount) dates.remove();
    const flow = card.blockedBy.length + card.precededBy.length + card.followedBy.length;
    if (flow || card.actionCount) {
      const footer = item.createDiv({ cls: "kanban-rpm-phone-planning-footer" });
      if (flow) footer.createSpan({ text: `Flow ${flow}` });
      footer.createSpan({ text: `${card.actionCount} tasks` });
    }
  }
  tableSortValue(card, key) {
    if (key === "title") return card.title;
    if (key === "project") return card.breadcrumb || card.projectTitle || "";
    if (key === "type") return card.type;
    if (key === "status") return card.status;
    if (key === "priority") return String(card.priority).padStart(2, "0");
    if (key === "date") return toDateSortValue(card);
    if (key === "dependencies") return String(card.blockedBy.length + card.precededBy.length + card.followedBy.length).padStart(3, "0");
    return String(card.actionCount).padStart(4, "0");
  }
  cardTypeLabel(type) {
    if (type === "big_action") return "Big Action";
    if (type === "subproject") return "Subproject";
    return "Project";
  }
  cardDateLabel(card) {
    const parts = [];
    if (card.scheduledDate) parts.push(`scheduled ${card.scheduledDate}`);
    if (card.dueDate) parts.push(`due ${card.dueDate}`);
    if (card.nextReview) parts.push(`review ${card.nextReview}`);
    return parts.join(" - ") || "No date";
  }
  cardDependencyLabel(card) {
    const parts = [];
    if (card.blockedBy.length) parts.push(`waiting on ${card.blockedBy.length}`);
    if (card.precededBy.length) parts.push(`preceded ${card.precededBy.length}`);
    if (card.followedBy.length) parts.push(`followed ${card.followedBy.length}`);
    return parts.join(" - ") || "None";
  }
  renderLane(board, lane, cards, visibleLanes) {
    const laneEl = board.createDiv({ cls: "kanban-rpm-lane" });
    laneEl.dataset.status = lane.id;
    const header = laneEl.createDiv({ cls: "kanban-rpm-lane-header" });
    header.createSpan({ cls: "kanban-rpm-lane-title", text: lane.label });
    const laneActions = header.createDiv({ cls: "kanban-rpm-lane-actions" });
    const laneIndex = visibleLanes.findIndex((visibleLane) => visibleLane.id === lane.id);
    const moveLeft = laneActions.createEl("button", {
      cls: "kanban-rpm-lane-order",
      text: "<",
      attr: { "aria-label": `Move ${lane.label} left` }
    });
    moveLeft.disabled = laneIndex <= 0;
    moveLeft.addEventListener("click", () => {
      void this.moveBoardStatus(lane.id, -1);
    });
    const moveRight = laneActions.createEl("button", {
      cls: "kanban-rpm-lane-order",
      text: ">",
      attr: { "aria-label": `Move ${lane.label} right` }
    });
    moveRight.disabled = laneIndex < 0 || laneIndex >= visibleLanes.length - 1;
    moveRight.addEventListener("click", () => {
      void this.moveBoardStatus(lane.id, 1);
    });
    laneActions.createSpan({ cls: "kanban-rpm-lane-count", text: String(cards.length) });
    laneActions.createEl("button", {
      cls: "kanban-rpm-lane-add",
      text: "+",
      attr: { "aria-label": `Add card to ${lane.label}` }
    }).addEventListener("click", () => {
      new NewProjectCardModal(this.app, this.plugin, this.newDocumentContext(lane.id)).open();
    });
    const list = laneEl.createDiv({ cls: "kanban-rpm-card-list" });
    if (!cards.length) {
      list.createDiv({ cls: "kanban-rpm-empty", text: "No cards" });
      return;
    }
    if (!this.groupByProject) {
      for (const card of cards) this.renderCard(list, card);
      return;
    }
    for (const group of this.groupCardsForCurrentFilter(cards)) {
      const groupEl = list.createDiv({ cls: "kanban-rpm-project-group" });
      const header2 = groupEl.createDiv({ cls: "kanban-rpm-project-group-header" });
      this.addProjectToken(header2, group.project);
      header2.createSpan({ text: group.project });
      header2.createSpan({ cls: "kanban-rpm-project-group-count", text: String(group.cards.length) });
      for (const card of group.cards) this.renderCard(groupEl, card);
    }
  }
  renderCard(list, card) {
    const cardClasses = [
      "kanban-rpm-card",
      `kanban-rpm-type-${card.type.replace("_", "-")}`,
      `kanban-rpm-card-status-${card.status}`,
      isPastDate(card.scheduledDate) || isPastDate(card.dueDate) || isPastDate(card.nextReview) ? "kanban-rpm-card-overdue" : ""
    ].filter(Boolean).join(" ");
    const cardEl = list.createDiv({ cls: cardClasses });
    cardEl.dataset.path = card.path;
    cardEl.style.setProperty("--rpm-project-color", this.projectColor(card.colorKey));
    this.attachPointerDrag(cardEl, card);
    this.renderFlowDots(cardEl, card);
    const toolbar = cardEl.createDiv({ cls: "kanban-rpm-card-toolbar" });
    if (this.plugin.settings.cardDisplayFields.breadcrumb) {
      const context = toolbar.createDiv({ cls: "kanban-rpm-card-context" });
      this.addProjectToken(context, card.colorKey);
      this.renderCardBreadcrumb(context, card);
    }
    const titleActions = toolbar.createDiv({ cls: "kanban-rpm-card-title-actions" });
    if (this.plugin.settings.cardDisplayFields.priority) {
      this.renderPriorityBadge(titleActions, card);
    }
    this.createIconButton(titleActions, "pencil", `Edit ${card.title}`).addEventListener("click", () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    this.renderCardMoreMenu(titleActions, card);
    cardEl.createEl("button", { cls: "kanban-rpm-card-title", text: card.title }).addEventListener("click", (event) => {
      event.stopPropagation();
      void this.plugin.openCard(card);
    });
    const fields = this.plugin.settings.cardDisplayFields;
    const primaryMeta = cardEl.createDiv({ cls: "kanban-rpm-meta kanban-rpm-card-primary-meta" });
    if (card.blockedBy.length) this.addMeta(primaryMeta, String(card.blockedBy.length), "waiting on", "kanban-rpm-meta-dependency");
    if (fields.category) this.addMeta(primaryMeta, this.categoryLabel(card.workstreamType), "category", "kanban-rpm-meta-kind");
    if (!primaryMeta.childElementCount) primaryMeta.remove();
    if (fields.currentFocus && card.nextAction) cardEl.createDiv({ cls: "kanban-rpm-next", text: card.nextAction });
    if (fields.waiting && card.status === this.getConfiguredStatusId("waiting") && card.waitingFor) {
      cardEl.createDiv({ cls: "kanban-rpm-next kanban-rpm-waiting", text: `Waiting: ${card.waitingFor}` });
    }
    if (fields.blockers && card.status === this.getConfiguredStatusId("blocked") && card.blocker) {
      cardEl.createDiv({ cls: "kanban-rpm-next kanban-rpm-blocker", text: `Blocked: ${card.blocker}` });
    }
    const dateMeta = cardEl.createDiv({ cls: "kanban-rpm-meta kanban-rpm-card-date-meta" });
    if (fields.dates) {
      this.addMeta(dateMeta, this.shortDateLabel(card.scheduledDate), "scheduled", isPastDate(card.scheduledDate) ? "kanban-rpm-overdue" : "kanban-rpm-meta-date");
      this.addMeta(dateMeta, this.shortDateLabel(card.dueDate), "due", isPastDate(card.dueDate) ? "kanban-rpm-overdue" : "kanban-rpm-meta-date");
      this.addMeta(dateMeta, this.shortDateLabel(card.nextReview), "review", isPastDate(card.nextReview) ? "kanban-rpm-overdue" : "kanban-rpm-meta-date");
    }
    if (!dateMeta.childElementCount) dateMeta.remove();
    if (fields.smallActionSummary) this.renderSmallActions(cardEl, card);
    if (fields.dependencies || fields.sources || fields.status || fields.type) this.renderCardDetails(cardEl, card);
  }
  renderCardMoreMenu(container, card, extraClass = "") {
    const menu = container.createEl("details", { cls: ["kanban-rpm-card-more", extraClass].filter(Boolean).join(" ") });
    menu.addEventListener("toggle", () => {
      var _a;
      (_a = menu.closest(".kanban-rpm-card, .kanban-rpm-timeline-marker")) == null ? void 0 : _a.toggleClass("is-menu-open", menu.open);
    });
    const summary = menu.createEl("summary", { attr: { "aria-label": `More actions for ${card.title}` } });
    (0, import_obsidian2.setIcon)(summary, "ellipsis-vertical");
    const actions = menu.createDiv({ cls: "kanban-rpm-card-more-menu" });
    actions.createEl("button", { text: "Duplicate" }).addEventListener("click", () => {
      void this.plugin.duplicateCard(card);
      menu.removeAttribute("open");
    });
    actions.createEl("button", { text: "Archive" }).addEventListener("click", () => {
      new ConfirmCardActionModal(this.app, {
        title: "Archive card",
        message: `Move "${card.title}" to KanbanRPM archive?`,
        confirmText: "Archive",
        onConfirm: () => this.plugin.archiveCard(card)
      }).open();
      menu.removeAttribute("open");
    });
    actions.createEl("button", { cls: "mod-warning", text: "Delete" }).addEventListener("click", () => {
      new ConfirmCardActionModal(this.app, {
        title: "Delete card",
        message: `Move "${card.title}" to the system trash?`,
        confirmText: "Delete",
        onConfirm: () => this.plugin.deleteCard(card)
      }).open();
      menu.removeAttribute("open");
    });
  }
  renderFlowDots(cardEl, card) {
    const incoming = cardEl.createSpan({
      cls: "kanban-rpm-flow-dot kanban-rpm-flow-dot-in",
      attr: { title: "Preceded by connector", "aria-label": "Preceded by connector" }
    });
    incoming.dataset.path = card.path;
    incoming.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    const outgoing = cardEl.createSpan({
      cls: "kanban-rpm-flow-dot kanban-rpm-flow-dot-out",
      attr: { title: "Followed by connector", "aria-label": "Followed by connector" }
    });
    outgoing.dataset.path = card.path;
    outgoing.addEventListener("pointerdown", (event) => this.startFlowConnect(event, card));
  }
  startFlowConnect(event, source) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const wrap = event.currentTarget.closest(".kanban-rpm-board-wrap");
    const overlay = wrap == null ? void 0 : wrap.querySelector(".kanban-rpm-board-flow-overlay");
    if (!wrap || !overlay) return;
    const rect = wrap.getBoundingClientRect();
    const startX = event.clientX - rect.left + wrap.scrollLeft;
    const startY = event.clientY - rect.top + wrap.scrollTop;
    const preview = this.svgEl("path");
    preview.setAttribute("class", "kanban-rpm-board-flow-arrow is-preview");
    preview.setAttribute("d", `M ${startX} ${startY} C ${startX + 80} ${startY}, ${startX + 80} ${startY}, ${startX} ${startY}`);
    overlay.appendChild(preview);
    this.flowConnect = { pointerId: event.pointerId, sourcePath: source.path, preview, startX, startY };
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      if (!this.flowConnect || this.flowConnect.pointerId !== moveEvent.pointerId) return;
      const endX = moveEvent.clientX - rect.left + wrap.scrollLeft;
      const endY = moveEvent.clientY - rect.top + wrap.scrollTop;
      const control = Math.max(60, Math.abs(endX - this.flowConnect.startX) * 0.45);
      this.flowConnect.preview.setAttribute(
        "d",
        `M ${this.flowConnect.startX} ${this.flowConnect.startY} C ${this.flowConnect.startX + control} ${this.flowConnect.startY}, ${endX - control} ${endY}, ${endX} ${endY}`
      );
      this.setFlowDropHighlight(this.findFlowDropTarget(moveEvent.clientX, moveEvent.clientY, this.flowConnect.sourcePath));
    };
    const end = (endEvent) => {
      if (!this.flowConnect || this.flowConnect.pointerId !== endEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      const state = this.flowConnect;
      state.preview.remove();
      this.flowConnect = void 0;
      this.setFlowDropHighlight("");
      const targetPath = this.findFlowDropTarget(endEvent.clientX, endEvent.clientY, state.sourcePath);
      const sourceCard = this.cards.find((card) => card.path === state.sourcePath);
      if (sourceCard && targetPath && targetPath !== sourceCard.path) void this.plugin.addPrecededBy(targetPath, sourceCard);
    };
    const cancel = (cancelEvent) => {
      if (!this.flowConnect || this.flowConnect.pointerId !== cancelEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      this.flowConnect.preview.remove();
      this.flowConnect = void 0;
      this.setFlowDropHighlight("");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
  }
  findFlowDropTarget(clientX, clientY, sourcePath) {
    var _a, _b, _c;
    const targets = Array.from(this.containerEl.querySelectorAll(".kanban-rpm-flow-dot-in"));
    let best;
    for (const target of targets) {
      const path = (_a = target.dataset.path) != null ? _a : "";
      if (!path || path === sourcePath) continue;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const cardRect = (_b = target.closest(".kanban-rpm-card")) == null ? void 0 : _b.getBoundingClientRect();
      const isInCardConnectorZone = cardRect ? clientX >= cardRect.left - 20 && clientX <= cardRect.left + 58 && clientY >= cardRect.top - 10 && clientY <= cardRect.bottom + 10 : false;
      if (distance > 38 && !isInCardConnectorZone) continue;
      if (!best || distance < best.distance) best = { path, distance };
    }
    return (_c = best == null ? void 0 : best.path) != null ? _c : "";
  }
  setFlowDropHighlight(targetPath) {
    var _a;
    this.containerEl.querySelectorAll(".kanban-rpm-flow-dot-in.is-flow-target, .kanban-rpm-card.is-flow-target").forEach((element) => element.removeClass("is-flow-target"));
    if (!targetPath) return;
    const target = this.containerEl.querySelector(`.kanban-rpm-flow-dot-in[data-path="${CSS.escape(targetPath)}"]`);
    target == null ? void 0 : target.addClass("is-flow-target");
    (_a = target == null ? void 0 : target.closest(".kanban-rpm-card")) == null ? void 0 : _a.addClass("is-flow-target");
  }
  startGanttFlowConnect(event, source) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const overlay = this.svgEl("svg");
    overlay.addClass("kanban-rpm-gantt-flow-preview-overlay");
    overlay.setAttribute("width", String(window.innerWidth));
    overlay.setAttribute("height", String(window.innerHeight));
    overlay.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const preview = this.svgEl("path");
    preview.setAttribute("class", "kanban-rpm-gantt-flow-preview");
    preview.setAttribute("d", `M ${event.clientX} ${event.clientY} C ${event.clientX + 80} ${event.clientY}, ${event.clientX + 80} ${event.clientY}, ${event.clientX} ${event.clientY}`);
    overlay.appendChild(preview);
    document.body.appendChild(overlay);
    this.flowConnect = { pointerId: event.pointerId, sourcePath: source.path, preview, previewOverlay: overlay, startX: event.clientX, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      if (!this.flowConnect || this.flowConnect.pointerId !== moveEvent.pointerId) return;
      const control = Math.max(60, Math.abs(moveEvent.clientX - this.flowConnect.startX) * 0.45);
      this.flowConnect.preview.setAttribute(
        "d",
        `M ${this.flowConnect.startX} ${this.flowConnect.startY} C ${this.flowConnect.startX + control} ${this.flowConnect.startY}, ${moveEvent.clientX - control} ${moveEvent.clientY}, ${moveEvent.clientX} ${moveEvent.clientY}`
      );
      this.setGanttFlowDropHighlight(this.findGanttFlowDropTarget(moveEvent.clientX, moveEvent.clientY, this.flowConnect.sourcePath));
    };
    const end = (endEvent) => {
      var _a;
      if (!this.flowConnect || this.flowConnect.pointerId !== endEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      const state = this.flowConnect;
      (_a = state.previewOverlay) == null ? void 0 : _a.remove();
      state.preview.remove();
      this.flowConnect = void 0;
      this.setGanttFlowDropHighlight("");
      const targetPath = this.findGanttFlowDropTarget(endEvent.clientX, endEvent.clientY, state.sourcePath);
      const sourceCard = this.cards.find((card) => card.path === state.sourcePath);
      if (!sourceCard || !targetPath) return;
      if (targetPath === sourceCard.path) {
        new import_obsidian5.Notice("KanbanRPM cannot create a flow arrow to the same card.");
        return;
      }
      void this.plugin.addPrecededBy(targetPath, sourceCard);
    };
    const cancel = (cancelEvent) => {
      var _a;
      if (!this.flowConnect || this.flowConnect.pointerId !== cancelEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      (_a = this.flowConnect.previewOverlay) == null ? void 0 : _a.remove();
      this.flowConnect.preview.remove();
      this.flowConnect = void 0;
      this.setGanttFlowDropHighlight("");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
  }
  findGanttFlowDropTarget(clientX, clientY, sourcePath) {
    var _a, _b, _c, _d;
    const targets = Array.from(this.containerEl.querySelectorAll(".kanban-rpm-gantt-flow-dot-in"));
    let best;
    for (const target of targets) {
      const path = (_a = target.dataset.path) != null ? _a : "";
      if (!path || path === sourcePath) continue;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const barRect = (_b = this.containerEl.querySelector(`.kanban-rpm-gantt-bar[data-path="${CSS.escape(path)}"]`)) == null ? void 0 : _b.getBoundingClientRect();
      const trackRect = (_c = target.closest(".kanban-rpm-gantt-track")) == null ? void 0 : _c.getBoundingClientRect();
      const isInBarConnectorZone = barRect ? clientX >= barRect.left - 36 && clientX <= barRect.right + 36 && clientY >= barRect.top - 18 && clientY <= barRect.bottom + 18 : false;
      const isInTrackConnectorZone = trackRect ? Math.abs(clientX - centerX) <= 72 && clientY >= trackRect.top - 8 && clientY <= trackRect.bottom + 8 : false;
      if (distance > 56 && !isInBarConnectorZone && !isInTrackConnectorZone) continue;
      if (!best || distance < best.distance) best = { path, distance };
    }
    return (_d = best == null ? void 0 : best.path) != null ? _d : "";
  }
  setGanttFlowDropHighlight(targetPath) {
    var _a, _b;
    this.containerEl.querySelectorAll(".kanban-rpm-gantt-flow-dot-in.is-flow-target, .kanban-rpm-gantt-bar.is-flow-target, .kanban-rpm-gantt-row.is-flow-target").forEach((element) => element.removeClass("is-flow-target"));
    if (!targetPath) return;
    const target = this.containerEl.querySelector(`.kanban-rpm-gantt-flow-dot-in[data-path="${CSS.escape(targetPath)}"]`);
    target == null ? void 0 : target.addClass("is-flow-target");
    (_a = this.containerEl.querySelector(`.kanban-rpm-gantt-bar[data-path="${CSS.escape(targetPath)}"]`)) == null ? void 0 : _a.addClass("is-flow-target");
    (_b = target == null ? void 0 : target.closest(".kanban-rpm-gantt-row")) == null ? void 0 : _b.addClass("is-flow-target");
  }
  renderCardBreadcrumb(container, card) {
    const project = card.projectTitle || card.projectTitles[0] || "No project";
    const subproject = card.subprojectTitle || card.subprojectTitles[0] || "";
    const text2 = container.createSpan({ cls: "kanban-rpm-card-breadcrumb-text" });
    text2.createSpan({ text: project });
    if (card.type === "big_action" && subproject) text2.createSpan({ text: `> ${subproject}` });
  }
  cardDisplayBreadcrumb(card) {
    const project = card.projectTitle || card.projectTitles[0] || "No project";
    const subproject = card.subprojectTitle || card.subprojectTitles[0] || "";
    if (card.type === "big_action" && subproject) return `${project} > ${subproject}`;
    return project;
  }
  createIconButton(container, icon, label, cls = "") {
    const button = container.createEl("button", {
      cls: ["kanban-rpm-icon-button", cls].filter(Boolean).join(" "),
      attr: { "aria-label": label, title: label }
    });
    (0, import_obsidian2.setIcon)(button, icon);
    return button;
  }
  renderCardDetails(container, card) {
    const details = container.createEl("details", { cls: "kanban-rpm-card-details" });
    details.createEl("summary", { text: "Details" });
    const body = details.createDiv({ cls: "kanban-rpm-card-details-body" });
    const fields = this.plugin.settings.cardDisplayFields;
    if (fields.status) {
      const line = body.createDiv({ cls: "kanban-rpm-card-detail-line" });
      line.createSpan({ cls: "kanban-rpm-card-detail-label", text: "status: " });
      this.renderStatusBadge(line, card.status);
    }
    if (fields.type) this.addMeta(body, this.cardTypeLabel(card.type), "type", "kanban-rpm-meta-kind");
    if (fields.waiting && card.status !== this.getConfiguredStatusId("waiting")) this.addMeta(body, card.waitingFor, "waiting", "kanban-rpm-meta-kind");
    if (fields.blockers && card.status !== this.getConfiguredStatusId("blocked")) this.addMeta(body, card.blocker, "blocker", "kanban-rpm-meta-dependency");
    if (fields.dependencies || fields.sources) this.renderCardRelations(body, card);
  }
  shortDateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = /* @__PURE__ */ new Date(`${value}T00:00:00`);
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    return `${value.slice(5)} ${day}`;
  }
  addMeta(container, value, label, cls) {
    if (value) container.createSpan({ cls, text: `${label}: ${value}` });
  }
  renderStatusBadge(container, statusId, label = this.statusLabel(statusId), tag = "span") {
    const cls = `kanban-rpm-status-badge kanban-rpm-status-${statusId}`;
    return tag === "button" ? container.createEl("button", { cls, text: label, attr: { title: `Edit status: ${label}` } }) : container.createSpan({ cls, text: label });
  }
  renderPriorityBadge(container, card, tag = "span") {
    const options = {
      cls: `kanban-rpm-pill kanban-rpm-priority kanban-rpm-priority-${card.priority}`,
      text: `P${card.priority}`,
      attr: tag === "button" ? { title: `Edit priority: P${card.priority}` } : void 0
    };
    return tag === "button" ? container.createEl("button", options) : container.createSpan(options);
  }
  addCountMeta(container, count, label, cls) {
    if (count > 0) container.createSpan({ cls, text: `${label}: ${count}` });
  }
  renderSmallActions(cardEl, card) {
    const visibleActions = this.getVisibleSmallActions(card);
    if (!card.smallActions.length && !visibleActions.length) return;
    const open = card.smallActions.filter((action) => !action.done).length;
    const expanded = this.isSmallActionsExpanded(card);
    const panel = cardEl.createDiv({ cls: "kanban-rpm-small-actions" });
    const header = panel.createSpan({
      cls: "kanban-rpm-small-actions-toggle",
      text: `${expanded ? "v" : ">"} Small actions: ${open} remaining`,
      attr: { role: "button", tabindex: "0", "aria-expanded": String(expanded) }
    });
    this.bindTextToggle(header, (event) => {
      event.stopPropagation();
      this.toggleSmallActions(card);
      this.render();
    });
    if (!expanded) return;
    if (!visibleActions.length) {
      panel.createDiv({ cls: "kanban-rpm-small-action-empty", text: "No small actions match the display rule." });
      return;
    }
    const openActions = visibleActions.filter((action) => !action.done);
    const doneActions = visibleActions.filter((action) => action.done);
    this.renderSmallActionSection(panel, card, "open", `Open: ${openActions.length}`, openActions, true);
    this.renderSmallActionSection(panel, card, "done", `Done: ${doneActions.length}`, doneActions, false);
  }
  renderSmallActionSection(container, card, section, label, actions, defaultExpanded) {
    if (!actions.length) return;
    const expanded = this.isSmallActionSectionExpanded(card, section, defaultExpanded);
    const sectionEl = container.createDiv({ cls: `kanban-rpm-small-action-section is-${section}` });
    const toggle = sectionEl.createSpan({
      cls: "kanban-rpm-small-action-section-toggle",
      text: `${expanded ? "v" : ">"} ${label}`,
      attr: { role: "button", tabindex: "0", "aria-expanded": String(expanded) }
    });
    this.bindTextToggle(toggle, (event) => {
      event.stopPropagation();
      this.toggleSmallActionSection(card, section, defaultExpanded);
      this.render();
    });
    if (!expanded) return;
    const list = sectionEl.createDiv({ cls: "kanban-rpm-small-action-list" });
    const shown = actions.slice(0, 8);
    for (const group of this.groupSmallActionsByHeading(shown)) {
      const groupEl = list.createDiv({ cls: "kanban-rpm-small-action-group" });
      groupEl.createDiv({ cls: "kanban-rpm-small-action-heading", text: group.heading });
      for (const action of group.actions) this.renderSmallActionRow(groupEl, action);
    }
    if (actions.length > shown.length) {
      sectionEl.createDiv({ cls: "kanban-rpm-small-action-more", text: `+${actions.length - shown.length} more` });
    }
  }
  bindTextToggle(element, onActivate) {
    element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      onActivate(event);
    });
    element.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onActivate(event);
    });
  }
  renderSmallActionRow(container, action) {
    const row = container.createDiv({ cls: `kanban-rpm-small-action${action.done ? " is-done" : ""}` });
    const checkbox = row.createEl("input", {
      attr: {
        type: "checkbox",
        "aria-label": `Toggle ${action.text}`
      }
    });
    checkbox.checked = action.done;
    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    checkbox.addEventListener("change", () => {
      void this.plugin.toggleSmallAction(action);
    });
    const body = row.createDiv({ cls: "kanban-rpm-small-action-body" });
    body.createDiv({ cls: "kanban-rpm-small-action-text", text: action.text });
    const meta = body.createDiv({ cls: "kanban-rpm-small-action-meta" });
    if (action.scheduledDate) meta.createSpan({ text: `scheduled ${action.scheduledDate}` });
    if (action.dueDate) meta.createSpan({ text: `due ${action.dueDate}` });
    if (action.doneDate) meta.createSpan({ text: `done ${action.doneDate}` });
    if (action.priority !== "normal") meta.createSpan({ text: action.priority });
  }
  groupSmallActionsByHeading(actions) {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const action of actions) {
      const heading = action.heading || "Small Actions";
      const existing = (_a = map.get(heading)) != null ? _a : [];
      existing.push(action);
      map.set(heading, existing);
    }
    return Array.from(map.entries()).map(([heading, groupActions]) => ({ heading, actions: groupActions }));
  }
  isSmallActionsExpanded(card) {
    if (this.plugin.settings.smallActionDisplay.collapsedByDefault) return this.expandedSmallActions.has(card.path);
    return !this.collapsedSmallActions.has(card.path);
  }
  toggleSmallActions(card) {
    if (this.plugin.settings.smallActionDisplay.collapsedByDefault) {
      if (this.expandedSmallActions.has(card.path)) this.expandedSmallActions.delete(card.path);
      else this.expandedSmallActions.add(card.path);
      return;
    }
    if (this.collapsedSmallActions.has(card.path)) this.collapsedSmallActions.delete(card.path);
    else this.collapsedSmallActions.add(card.path);
  }
  smallActionSectionKey(card, section) {
    return `${card.path}::${section}`;
  }
  isSmallActionSectionExpanded(card, section, defaultExpanded) {
    const key = this.smallActionSectionKey(card, section);
    return defaultExpanded ? !this.collapsedSmallActionSections.has(key) : this.expandedSmallActionSections.has(key);
  }
  toggleSmallActionSection(card, section, defaultExpanded) {
    const key = this.smallActionSectionKey(card, section);
    if (defaultExpanded) {
      if (this.collapsedSmallActionSections.has(key)) this.collapsedSmallActionSections.delete(key);
      else this.collapsedSmallActionSections.add(key);
      return;
    }
    if (this.expandedSmallActionSections.has(key)) this.expandedSmallActionSections.delete(key);
    else this.expandedSmallActionSections.add(key);
  }
  getVisibleSmallActions(card) {
    const { sourceFilter, dateWindow } = this.plugin.settings.smallActionDisplay;
    return card.smallActions.filter((action) => {
      if (sourceFilter === "dated" && !action.dueDate && !action.scheduledDate) return false;
      if (sourceFilter === "done" && !action.done) return false;
      return this.isSmallActionInWindow(action, dateWindow);
    }).sort((a, b) => this.smallActionSortValue(a).localeCompare(this.smallActionSortValue(b)) || a.lineNumber - b.lineNumber);
  }
  getTimelineCardSmallActions(card) {
    return card.smallActions.sort((a, b) => this.smallActionPriorityRank(a.priority) - this.smallActionPriorityRank(b.priority) || this.smallActionSortValue(a).localeCompare(this.smallActionSortValue(b)) || a.lineNumber - b.lineNumber);
  }
  smallActionSortValue(action) {
    return action.scheduledDate || action.dueDate || action.doneDate || "9999-99-99";
  }
  isSmallActionOverdue(action) {
    const date = action.scheduledDate || action.dueDate;
    return Boolean(date && isPastDate(date));
  }
  isSmallActionInWindow(action, window2) {
    if (window2 === "all") return true;
    const date = action.scheduledDate || action.dueDate || action.doneDate;
    if (!date) return false;
    if (window2 === "overdue") return isPastDate(date);
    if (window2 === "today") return date === todayIso();
    if (isPastDate(date) || date === todayIso()) return true;
    if (window2 === "tomorrow") return isDueSoon(date, 1);
    if (window2 === "week") return isDueSoon(date, 7);
    if (window2 === "month") return isDueSoon(date, 31);
    return true;
  }
  todayIso() {
    const today = /* @__PURE__ */ new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
  attachPointerDrag(cardEl, card) {
    cardEl.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.isInteractiveTarget(event.target)) return;
      this.pointerDrag = {
        cardPath: card.path,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
        cardEl
      };
      cardEl.setPointerCapture(event.pointerId);
    });
    cardEl.addEventListener("pointermove", (event) => {
      if (!this.pointerDrag || this.pointerDrag.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - this.pointerDrag.startX, event.clientY - this.pointerDrag.startY);
      if (!this.pointerDrag.dragging && distance < 6) return;
      this.pointerDrag.dragging = true;
      this.pointerDrag.cardEl.addClass("is-dragging");
      this.setActiveDragLane(this.findLaneAtPoint(event.clientX, event.clientY));
    });
    cardEl.addEventListener("pointerup", (event) => {
      var _a;
      if (!this.pointerDrag || this.pointerDrag.pointerId !== event.pointerId) return;
      const drag = this.pointerDrag;
      const laneEl = (_a = this.findLaneAtPoint(event.clientX, event.clientY)) != null ? _a : drag.activeLaneEl;
      this.clearPointerDrag();
      if (!drag.dragging || !laneEl) return;
      const status = laneEl.dataset.status;
      if (!status) return;
      const beforePath = this.findDropBeforePath(laneEl, event.clientY, drag.cardPath);
      void this.plugin.moveCard(drag.cardPath, status, beforePath);
    });
    cardEl.addEventListener("pointercancel", () => this.clearPointerDrag());
    cardEl.addEventListener("lostpointercapture", () => {
      var _a;
      if (((_a = this.pointerDrag) == null ? void 0 : _a.cardEl) === cardEl) this.clearPointerDrag();
    });
  }
  isInteractiveTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("button, input, textarea, select, a, summary, details, .is-link"));
  }
  findLaneAtPoint(clientX, clientY) {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      if (!(element instanceof HTMLElement)) continue;
      const laneEl = element.closest(".kanban-rpm-lane");
      if (laneEl) return laneEl;
    }
    return void 0;
  }
  setActiveDragLane(laneEl) {
    var _a, _b, _c;
    if (((_a = this.pointerDrag) == null ? void 0 : _a.activeLaneEl) === laneEl) return;
    (_c = (_b = this.pointerDrag) == null ? void 0 : _b.activeLaneEl) == null ? void 0 : _c.removeClass("is-drag-over");
    if (this.pointerDrag) this.pointerDrag.activeLaneEl = laneEl;
    laneEl == null ? void 0 : laneEl.addClass("is-drag-over");
  }
  clearPointerDrag() {
    var _a;
    if (!this.pointerDrag) return;
    this.pointerDrag.cardEl.removeClass("is-dragging");
    (_a = this.pointerDrag.activeLaneEl) == null ? void 0 : _a.removeClass("is-drag-over");
    this.pointerDrag = void 0;
  }
  renderCardRelations(cardEl, card) {
    const fields = this.plugin.settings.cardDisplayFields;
    const rows = [];
    if (fields.dependencies) {
      rows.push(["Waiting on", card.blockedBy, "kanban-rpm-relation-blocks"]);
      rows.push(["Preceded by", card.precededBy, "kanban-rpm-relation-depends"]);
      rows.push(["Followed by", card.followedBy, "kanban-rpm-relation-blocks"]);
    }
    if (fields.sources) rows.push(["Sources", card.sourceNotes.slice(0, 3), "kanban-rpm-relation-sources"]);
    const visibleRows = rows.filter(([, values]) => values.length > 0);
    if (!visibleRows.length) return;
    const relations = cardEl.createDiv({ cls: "kanban-rpm-card-relations" });
    for (const [label, values, cls] of visibleRows) {
      const row = relations.createDiv({ cls: `kanban-rpm-relation-row ${cls}` });
      row.createSpan({ cls: "kanban-rpm-relation-label", text: `${label}:` });
      const list = row.createSpan({ cls: "kanban-rpm-relation-values" });
      for (const value of values.slice(0, 4)) {
        const item = list.createSpan({ text: value });
        if (value.includes("[[")) {
          item.addClass("is-link");
          item.setAttr("role", "button");
          item.setAttr("tabindex", "0");
          item.addEventListener("click", (event) => {
            event.stopPropagation();
            void this.plugin.openLinkedReference(value, card.path);
          });
          item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") void this.plugin.openLinkedReference(value, card.path);
          });
        }
      }
      if (values.length > 4) list.createSpan({ text: `+${values.length - 4}` });
    }
  }
  findDropBeforePath(laneEl, clientY, draggingPath) {
    const cards = Array.from(laneEl.querySelectorAll(".kanban-rpm-card")).filter(
      (el) => el.dataset.path !== draggingPath
    );
    for (const cardEl of cards) {
      const rect = cardEl.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return cardEl.dataset.path;
    }
    return void 0;
  }
  groupCardsForCurrentFilter(cards) {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const card of cards) {
      const project = this.projectFilter ? card.subprojectTitle || card.subprojectTitles[0] || "No subproject" : card.projectTitle || card.projectTitles[0] || "No project";
      const existing = (_a = map.get(project)) != null ? _a : [];
      existing.push(card);
      map.set(project, existing);
    }
    return Array.from(map.entries()).map(([project, groupCards]) => ({ project, cards: groupCards.sort(compareCards) })).sort((a, b) => a.project.localeCompare(b.project));
  }
  addProjectToken(container, key) {
    const token = container.createSpan({ cls: "kanban-rpm-project-token" });
    token.style.setProperty("--rpm-project-color", this.projectColor(key));
  }
  getConfiguredStatusId(preferredId) {
    var _a, _b;
    return (_b = (_a = this.plugin.settings.statuses.find((status) => status.id === preferredId)) == null ? void 0 : _a.id) != null ? _b : preferredId;
  }
  isCompletionStatus(statusId) {
    var _a, _b;
    const status = this.plugin.settings.statuses.find((item) => item.id === statusId);
    const value = `${(_a = status == null ? void 0 : status.id) != null ? _a : statusId} ${(_b = status == null ? void 0 : status.label) != null ? _b : ""}`.toLowerCase();
    return /\b(done|complete|completed)\b/.test(value) || value.includes("?\u8881\u2465\u2537");
  }
  statusLabel(statusId) {
    var _a, _b;
    return (_b = (_a = this.plugin.settings.statuses.find((status) => status.id === statusId)) == null ? void 0 : _a.label) != null ? _b : statusId;
  }
  categoryLabel(categoryId) {
    return categoryLabel(this.plugin.settings.categories, categoryId);
  }
  projectColor(key) {
    let hash = 0;
    for (const char of key || "project") hash = (hash * 31 + char.charCodeAt(0)) % 360;
    return `hsl(${hash} 62% 48%)`;
  }
};

// src-kanbanrpm/card-repository.ts
var import_obsidian6 = require("obsidian");
var import_obsidian7 = require("obsidian");

// src-kanbanrpm/markdown-utils.ts
function getSection(content, title) {
  const section = findHeadingSection(content, title);
  return section ? content.slice(section.bodyStart, section.end) : "";
}
function findHeadingSection(content, title) {
  const escaped = escapeRegex(title);
  const pattern = new RegExp(`^(#{1,6})\\s+${escaped}\\s*$`, "gim");
  const match = pattern.exec(content);
  if (!match || match.index === void 0) return null;
  const level = match[1].length;
  const bodyStart = match.index + match[0].length;
  const rest = content.slice(bodyStart);
  const nextPattern = new RegExp(`^#{1,${level}}\\s+`, "m");
  const next = rest.match(nextPattern);
  return {
    start: match.index,
    bodyStart,
    end: (next == null ? void 0 : next.index) === void 0 ? content.length : bodyStart + next.index,
    level
  };
}
function findNestedHeadingSection(content, parentTitle, childTitle) {
  const parent = findHeadingSection(content, parentTitle);
  if (!parent) return null;
  const parentBody = content.slice(parent.bodyStart, parent.end);
  const child = findHeadingSection(parentBody, childTitle);
  if (!child) return null;
  return {
    start: parent.bodyStart + child.start,
    bodyStart: parent.bodyStart + child.bodyStart,
    end: parent.bodyStart + child.end,
    level: child.level
  };
}
function replaceSection(content, title, body) {
  var _a;
  const normalizedBody = body.trimEnd();
  const existing = findHeadingSection(content, title);
  const level = (_a = existing == null ? void 0 : existing.level) != null ? _a : 2;
  const replacement = `${"#".repeat(level)} ${title}

${normalizedBody}${normalizedBody ? "\n" : ""}`;
  if (existing) return `${content.slice(0, existing.start)}${replacement}${content.slice(existing.end)}`;
  return `${content.trimEnd()}

${replacement}`;
}
function parseDependencyList(section, label) {
  const lines = section.split(/\r?\n/);
  const values = [];
  let active = false;
  for (const line of lines) {
    if (new RegExp(`^\\s*${escapeRegex(label)}:\\s*$`, "i").test(line)) {
      active = true;
      continue;
    }
    if (/^\s*[A-Za-z].*:\s*$/.test(line)) active = false;
    if (!active) continue;
    const item = line.match(/^\s*[-*]\s+(.+)/);
    if (item == null ? void 0 : item[1]) values.push(item[1].trim());
  }
  return values;
}
function parsePlainList(section) {
  return section.split(/\r?\n/).map((line) => {
    var _a, _b, _c;
    return (_c = (_b = (_a = line.match(/^\s*[-*]\s+(.+)/)) == null ? void 0 : _a[1]) == null ? void 0 : _b.trim()) != null ? _c : "";
  }).filter(Boolean);
}
function parseMarkdownTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src-kanbanrpm/task-parser.ts
function parseSmallActions(content) {
  const actions = [];
  let heading = "";
  content.split(/\r?\n/).forEach((line, index) => {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch == null ? void 0 : headingMatch[1]) heading = headingMatch[1].trim();
    const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (!(task == null ? void 0 : task[2])) return;
    const rawText = task[2].trim();
    actions.push({
      cardPath: "",
      cardTitle: "",
      text: stripTaskMetadata(rawText),
      done: task[1].toLowerCase() === "x",
      dueDate: extractTaskDate(rawText, "\\u{1F4C5}", "due"),
      scheduledDate: extractTaskDate(rawText, "\\u{23F3}", "scheduled"),
      doneDate: extractTaskDate(rawText, "\\u{2705}", "done"),
      priority: extractTaskPriority(rawText),
      heading,
      lineNumber: index + 1,
      lineText: line,
      raw: line
    });
  });
  return actions;
}
function extractTaskDate(textValue, marker, asciiKey) {
  var _a;
  const emojiMatch = textValue.match(new RegExp(`${marker}\\s*(\\d{4}-\\d{2}-\\d{2})`, "u"));
  if (emojiMatch == null ? void 0 : emojiMatch[1]) return emojiMatch[1];
  const asciiMatch = textValue.match(new RegExp(`@${asciiKey}\\s+(\\d{4}-\\d{2}-\\d{2})`, "i"));
  return (_a = asciiMatch == null ? void 0 : asciiMatch[1]) != null ? _a : "";
}
function extractTaskPriority(textValue) {
  var _a, _b;
  const ascii = (_b = (_a = textValue.match(/@priority\s+(highest|high|medium|normal|low|lowest)\b/i)) == null ? void 0 : _a[1]) == null ? void 0 : _b.toLowerCase();
  if (ascii === "highest" || ascii === "high" || ascii === "low" || ascii === "lowest") return ascii;
  if (ascii === "medium") return "medium";
  if (/\u{23EB}/u.test(textValue)) return "highest";
  if (/\u{1F53C}/u.test(textValue)) return "high";
  if (/\u{1F53D}/u.test(textValue)) return "low";
  if (/\u{23EC}/u.test(textValue)) return "lowest";
  return "normal";
}
function stripTaskMetadata(textValue) {
  return textValue.replace(/[\u{1F4C5}\u{23F3}\u{2705}]\s*\d{4}-\d{2}-\d{2}/gu, "").replace(/@(scheduled|due|done)\s+\d{4}-\d{2}-\d{2}/gi, "").replace(/@priority\s+(highest|high|medium|normal|low|lowest)\b/gi, "").replace(/[\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}]/gu, "").replace(/\s+/g, " ").trim();
}

// src-kanbanrpm/routine-utils.ts
function parseRoutineLine(line, lineNumber) {
  var _a, _b, _c, _d, _e;
  const match = line.match(/^\s*[-*]\s+\[[ xX-]\]\s+(.+)$/);
  if (!match) return null;
  const raw = match[1].trim();
  const cadence = (_b = (_a = raw.match(/@(daily|weekly|monthly)\b/i)) == null ? void 0 : _a[1]) == null ? void 0 : _b.toLowerCase();
  const every = raw.match(/@every\s+(\d+)\s*([dDwWmM])\b/);
  if (!cadence && !every) return null;
  const startDate = (_d = (_c = raw.match(/@start\s+(\d{4}-\d{2}-\d{2})\b/i)) == null ? void 0 : _c[1]) != null ? _d : "";
  const text2 = raw.replace(/@(daily|weekly|monthly)\b/gi, "").replace(/@every\s+\d+\s*[dDwWmM]\b/gi, "").replace(/@start\s+\d{4}-\d{2}-\d{2}\b/gi, "").trim();
  const unitChar = (_e = every == null ? void 0 : every[2]) == null ? void 0 : _e.toLowerCase();
  return {
    cardPath: "",
    cardTitle: "",
    text: text2,
    cadence: every ? "custom" : cadence,
    startDate,
    interval: every ? Number(every[1]) : 1,
    unit: every ? unitChar === "w" ? "week" : unitChar === "m" ? "month" : "day" : cadence === "weekly" ? "week" : cadence === "monthly" ? "month" : "day",
    lineNumber,
    raw,
    completedDates: []
  };
}
function parseRoutineCompletedDates(section, routineText) {
  const dates = [];
  for (const line of section.split(/\r?\n/)) {
    const row = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|?$/);
    if (row && row[2].trim() === routineText) dates.push(row[1]);
    const legacy = line.match(/^-\s+(\d{4}-\d{2}-\d{2})\s+completed:\s+(.+)$/);
    if (legacy && legacy[2].trim() === routineText) dates.push(legacy[1]);
  }
  return Array.from(new Set(dates)).sort();
}
function routineScheduleLabel(item) {
  const interval = item.cadence === "custom" ? `@every ${item.interval}${item.unit[0]}` : `@${item.cadence}`;
  return item.startDate ? `${interval} @start ${item.startDate}` : interval;
}

// src-kanbanrpm/card-repository.ts
var CardRepository = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  async loadCards() {
    return this.loadCardsInternal(false);
  }
  async loadArchivedCards() {
    return this.loadCardsInternal(true);
  }
  async loadResearchLogs() {
    await this.plugin.ensureWorkspace();
    const file = await this.getResearchLogFile();
    const content = await this.plugin.app.vault.read(file);
    return [
      ...this.parseResearchLog(content, "experiment"),
      ...this.parseResearchLog(content, "analysis")
    ].map((entry) => ({
      ...entry,
      cardPath: file.path,
      cardTitle: file.basename
    }));
  }
  async loadResearchLogModules(kind) {
    await this.plugin.ensureWorkspace();
    const file = await this.getResearchLogFile();
    const content = await this.plugin.app.vault.read(file);
    return this.parseResearchLogModules(content, kind);
  }
  async loadCardsInternal(archived) {
    await this.plugin.ensureWorkspace();
    const cards = [];
    const prefix = `${this.plugin.cardsFolder}/`;
    const statuses = this.plugin.settings.statuses;
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(prefix)) continue;
      const content = await this.plugin.app.vault.read(file);
      const fm = this.getEffectiveFrontmatter(content);
      if (fm.kanban_rpm !== true && fm.kanban_rpm !== "true") continue;
      const isArchived = fm.archived === true || fm.archived === "true" || file.path.split("/").includes("archive");
      if (isArchived !== archived) continue;
      const sectionData = this.parseLivingDocSections(content);
      const type = this.normalizeCardType(text(fm.type));
      const projects = this.uniqueLinks([text(fm.primary_project), ...toStringList(fm.projects)]);
      const subprojects = this.uniqueLinks([text(fm.primary_subproject), ...toStringList(fm.subprojects)]);
      const project = text(fm.primary_project) || projects[0] || "";
      const subproject = text(fm.primary_subproject) || subprojects[0] || "";
      const order = parseOrder(fm.order);
      const title = file.basename;
      cards.push({
        file,
        path: file.path,
        id: text(fm.id) || file.basename,
        title,
        type,
        status: normalizeStatus(fm.status, statuses),
        projectState: this.normalizeProjectState(fm.project_state),
        projectTitles: [],
        subprojectTitles: [],
        projectTitle: "",
        subprojectTitle: "",
        breadcrumb: "",
        colorKey: "",
        priority: parsePriority(fm.priority),
        project,
        subproject,
        projects,
        subprojects,
        primaryProject: project,
        primarySubproject: subproject,
        workstreamType: text(fm.workstream_type),
        nextAction: sectionData.currentFocus,
        waitingFor: sectionData.waitingFor,
        blocker: sectionData.blocker,
        startDate: sectionData.startDate,
        scheduledDate: sectionData.scheduledDate,
        nextReview: sectionData.nextReview,
        dueDate: sectionData.dueDate,
        precededBy: sectionData.precededBy,
        followedBy: sectionData.followedBy,
        dependsOn: sectionData.precededBy,
        blocks: sectionData.followedBy,
        blockedBy: [],
        sourceNotes: sectionData.sourceNotes,
        routines: sectionData.routines.map((item) => ({
          ...item,
          cardPath: file.path,
          cardTitle: title
        })),
        researchLogs: sectionData.researchLogs.map((item) => ({ ...item, cardPath: file.path, cardTitle: title })),
        smallActions: sectionData.smallActions.map((item) => ({
          ...item,
          cardPath: file.path,
          cardTitle: title
        })),
        actionCount: sectionData.actionCount,
        archived: isArchived,
        archivedAt: text(fm.archived_at),
        archiveOriginalPath: text(fm.archive_original_path),
        archiveOwnerProject: text(fm.archive_owner_project),
        order
      });
    }
    if (archived) {
      const activeCards = await this.loadCardsInternal(false);
      const combinedCards = [...activeCards, ...cards];
      this.applyHierarchy(combinedCards);
      this.applyBlockedBy(combinedCards);
    } else {
      this.applyHierarchy(cards);
      this.applyBlockedBy(cards);
    }
    return cards.sort(compareCards);
  }
  async createCard(values) {
    await this.plugin.ensureWorkspace();
    const title = values.title.trim();
    const baseName = sanitizeFileName(title);
    const folder = await this.getCreationFolder(values);
    const path = this.getAvailablePath(folder, baseName, "md");
    const content = this.getLivingDocTemplate(values, title, baseName);
    const file = await this.plugin.app.vault.create(path, content);
    if (values.type === "project") {
      await this.ensureFolder((0, import_obsidian6.normalizePath)(`${this.plugin.cardsFolder}/${baseName}`));
    }
    new import_obsidian6.Notice(`KanbanRPM card created: ${title}`);
    await this.plugin.refreshViews();
    return file;
  }
  async createCommunicationSourceNote(values) {
    await this.plugin.ensureWorkspace();
    const title = values.title.trim();
    const baseName = sanitizeFileName(title);
    const year = this.communicationYear(values.date);
    const type = this.communicationTypeDefinition(values.type);
    const folder = (0, import_obsidian6.normalizePath)(`${this.plugin.communicationsFolder}/${year}/${type.folder}`);
    await this.ensureFolder(folder);
    const path = this.getAvailablePath(folder, baseName, "md");
    const participants = textareaToList(values.participants);
    const file = await this.plugin.app.vault.create(path, this.getCommunicationSourceTemplate(values, participants));
    await this.prependCommunicationLogRow(file, values, participants);
    new import_obsidian6.Notice(`KanbanRPM communication note created: ${title}`);
    await this.plugin.app.workspace.getLeaf(false).openFile(file);
    return file;
  }
  async loadParticipantSuggestions() {
    var _a;
    const root = `${this.plugin.communicationsFolder}/`;
    const counts = /* @__PURE__ */ new Map();
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!(0, import_obsidian6.normalizePath)(file.path).startsWith(root)) continue;
      const content = await this.plugin.app.vault.cachedRead(file);
      const frontmatter = this.parseFirstFrontmatter(content);
      if (text(frontmatter.type) !== "communication") continue;
      for (const participant of toStringList(frontmatter.participants)) {
        counts.set(participant, ((_a = counts.get(participant)) != null ? _a : 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
  async updateCardFrontmatter(file, updates, refresh = true) {
    await this.rewriteCardFrontmatter(file, (frontmatter) => {
      for (const [key, value] of Object.entries(updates)) {
        if (value === void 0) {
          delete frontmatter[key];
        } else {
          frontmatter[key] = value;
        }
      }
    });
    if (refresh) await this.plugin.refreshViews();
  }
  async updateCard(card, values) {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const statusChanged = card.status !== values.status;
    const originalPath = file.path;
    const originalBaseName = file.basename;
    const title = values.title.trim() || file.basename;
    const targetFolder = await this.getCreationFolder(values);
    const targetPath = this.getAvailablePathForExistingFile(file.path, targetFolder, sanitizeFileName(title), file.extension);
    const cardsBeforeUpdate = values.type === "subproject" ? await this.loadCards() : [];
    await this.updateCardFrontmatter(file, {
      type: values.type,
      primary_project: values.project.trim() || void 0,
      primary_subproject: values.subproject.trim() || void 0,
      projects: this.uniqueLinks([values.project, ...textareaToList(values.projects)]),
      subprojects: this.uniqueLinks([values.subproject, ...textareaToList(values.subprojects)]),
      status: values.status,
      priority: parsePriority(values.priority),
      workstream_type: values.workstreamType.trim()
    }, false);
    const content = await this.plugin.app.vault.read(file);
    let nextContent = this.updateLivingDocBody(content, title, values);
    if (statusChanged) nextContent = this.prependTimelineLog(nextContent, "Status", `${this.statusLabel(card.status)} -> ${this.statusLabel(values.status)}`);
    nextContent = this.applyCompletionDueDateUpdate(nextContent, card, values.status);
    await this.plugin.app.vault.modify(file, nextContent);
    if (statusChanged) await this.logCardCompletionSideEffects(card, values.status, title);
    if ((0, import_obsidian6.normalizePath)(file.path) !== (0, import_obsidian6.normalizePath)(targetPath)) {
      await this.plugin.app.fileManager.renameFile(file, targetPath);
    }
    await this.syncHierarchyAfterCardUpdate(card, values, cardsBeforeUpdate, originalPath, file.path, originalBaseName, file.basename);
    new import_obsidian6.Notice(`KanbanRPM card updated: ${title}`);
    await this.plugin.refreshViews();
  }
  async syncHierarchyFolderRename(file, oldPath) {
    if (!this.plugin.isCardPath(file.path) && !this.plugin.isCardPath(oldPath)) return;
    if (file.extension !== "md") return;
    if (this.pathParts(oldPath).includes("archive") || this.pathParts(file.path).includes("archive")) return;
    const oldBase = this.fileBaseNameFromPath(oldPath);
    const newBase = file.basename;
    if (!oldBase || !newBase || oldBase === newBase) return;
    const content = await this.plugin.app.vault.read(file);
    const frontmatter = this.parseFirstFrontmatter(content);
    const type = this.normalizeCardType(text(frontmatter.type));
    if (type !== "project" && type !== "subproject") return;
    const oldFolder = type === "project" ? (0, import_obsidian6.normalizePath)(`${this.plugin.cardsFolder}/${sanitizeFileName(oldBase)}`) : (0, import_obsidian6.normalizePath)(`${this.folderPathFromFilePath(oldPath)}/${sanitizeFileName(oldBase)}`);
    const newFolder = type === "project" ? (0, import_obsidian6.normalizePath)(`${this.plugin.cardsFolder}/${sanitizeFileName(newBase)}`) : (0, import_obsidian6.normalizePath)(`${this.folderPathFromFilePath(file.path)}/${sanitizeFileName(newBase)}`);
    if (oldFolder === newFolder) return;
    const folder = this.plugin.app.vault.getAbstractFileByPath(oldFolder);
    if (!(folder instanceof import_obsidian7.TFolder)) return;
    const existing = this.plugin.app.vault.getAbstractFileByPath(newFolder);
    if (existing) {
      new import_obsidian6.Notice(`KanbanRPM skipped folder rename because target already exists: ${newFolder}`);
      return;
    }
    await this.ensureFolder(this.folderPathFromFilePath(newFolder));
    await this.plugin.app.fileManager.renameFile(folder, newFolder);
    new import_obsidian6.Notice(`KanbanRPM folder renamed: ${oldFolder} -> ${newFolder}`);
  }
  async moveCard(cardPath, targetStatus, beforePath) {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const cards = await this.loadCards();
    const movedCard = cards.find((item) => item.path === cardPath);
    const laneCards = cards.filter((card) => card.status === targetStatus && card.path !== cardPath).sort(compareCards);
    const foundIndex = beforePath ? laneCards.findIndex((card) => card.path === beforePath) : -1;
    const insertIndex = beforePath && foundIndex >= 0 ? foundIndex : laneCards.length;
    const newOrder = this.computeOrder(laneCards, insertIndex);
    await this.updateCardFrontmatter(file, {
      status: targetStatus,
      order: newOrder
    }, false);
    if (movedCard && movedCard.status !== targetStatus) {
      const content = await this.plugin.app.vault.read(file);
      let next = this.prependTimelineLog(content, "Status", `${this.statusLabel(movedCard.status)} -> ${this.statusLabel(targetStatus)}`);
      next = this.applyCompletionDueDateUpdate(next, movedCard, targetStatus);
      await this.plugin.app.vault.modify(file, next);
      await this.logCardCompletionSideEffects(movedCard, targetStatus, file.basename, cards);
    }
    await this.plugin.refreshViews();
  }
  async setCardStatus(card, status) {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    await this.updateCardFrontmatter(file, { status }, false);
    if (card.status !== status) {
      const content = await this.plugin.app.vault.read(file);
      let next = this.prependTimelineLog(content, "Status", `${this.statusLabel(card.status)} -> ${this.statusLabel(status)}`);
      next = this.applyCompletionDueDateUpdate(next, card, status);
      await this.plugin.app.vault.modify(file, next);
      await this.logCardCompletionSideEffects(card, status, file.basename);
    }
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`KanbanRPM card moved to ${status}: ${card.title}`);
  }
  async setCardPriority(card, priority) {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const normalized = Math.min(5, Math.max(1, Math.round(priority)));
    await this.updateCardFrontmatter(file, { priority: normalized }, false);
    if (card.priority !== normalized) {
      const content = await this.plugin.app.vault.read(file);
      const next = this.prependTimelineLog(content, "Priority", `P${card.priority} -> P${normalized}`);
      await this.plugin.app.vault.modify(file, next);
    }
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`KanbanRPM priority updated to P${normalized}: ${card.title}`);
  }
  async updateProjectState(card, projectState) {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    if (card.type !== "project") {
      new import_obsidian6.Notice("KanbanRPM project lifecycle is only available for Project documents.");
      return;
    }
    await this.updateCardFrontmatter(file, { project_state: projectState });
    new import_obsidian6.Notice(`${projectState === "closed" ? "Closed" : "Reopened"} project: ${card.title}`);
  }
  async updateGanttDates(card, values) {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const next = replaceSection(
      content,
      "Timeline",
      [
        values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : "",
        values.scheduledDate.trim() ? `- Scheduled date: ${values.scheduledDate.trim()}` : "",
        values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : "",
        values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : ""
      ].filter(Boolean).join("\n")
    );
    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`KanbanRPM Gantt dates updated: ${card.title}`);
  }
  async addResearchLogRow(_card, values) {
    const file = await this.getResearchLogFile();
    const content = await this.plugin.app.vault.read(file);
    const next = this.prependResearchLog(content, values);
    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`Added ${values.kind} log row to Research Logs.`);
  }
  async applyDueReviews() {
    var _a, _b;
    await this.plugin.ensureWorkspace();
    const today = todayIso();
    const targetStatus = this.plugin.settings.statuses.some((status) => status.id === this.plugin.settings.reviewReminderStatus) ? this.plugin.settings.reviewReminderStatus : (_b = (_a = this.plugin.settings.statuses[0]) == null ? void 0 : _a.id) != null ? _b : "active";
    let applied = 0;
    for (const card of await this.loadCards()) {
      if (!card.nextReview || card.nextReview > today) continue;
      if (card.status === targetStatus || this.isCompletionStatus(card.status)) continue;
      const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
      if (!(file instanceof import_obsidian6.TFile)) continue;
      await this.updateCardFrontmatter(file, { status: targetStatus }, false);
      const content = await this.plugin.app.vault.read(file);
      const next = this.prependTimelineLog(content, "Review", `Next review reached; status changed ${this.statusLabel(card.status)} -> ${this.statusLabel(targetStatus)}`, today);
      await this.plugin.app.vault.modify(file, next);
      applied += 1;
    }
    return applied;
  }
  async normalizeCardOrder() {
    const cards = await this.loadCards();
    let updated = 0;
    let repaired = 0;
    for (const status of this.plugin.settings.statuses) {
      const laneCards = cards.filter((card) => card.status === status.id).sort(compareCards);
      for (const [index, card] of laneCards.entries()) {
        const nextOrder = (index + 1) * 1e3;
        const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
        if (!(file instanceof import_obsidian6.TFile)) continue;
        await this.updateCardFrontmatter(file, { order: nextOrder }, false);
        if (card.order !== nextOrder) updated += 1;
        repaired += 1;
      }
    }
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`KanbanRPM normalized order on ${updated} cards and repaired metadata on ${repaired} cards.`);
  }
  async setNextAction(cardPath, nextAction) {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    await this.plugin.app.vault.modify(file, replaceSection(content, "Current Focus", `- ${nextAction.trim()}
`));
    await this.plugin.refreshViews();
    new import_obsidian6.Notice("KanbanRPM Current Focus updated from Action index.");
  }
  async updateSmallActionMetadata(action, values) {
    const file = this.plugin.app.vault.getAbstractFileByPath(action.cardPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const index = action.lineNumber - 1;
    const line = lines[index];
    if (!line || line !== action.lineText) {
      new import_obsidian6.Notice("KanbanRPM could not safely update this small action. Refresh and try again.");
      return;
    }
    const scheduledDate = values.scheduledDate.trim();
    const dueDate = values.dueDate.trim();
    const priority = values.priority === "medium" ? "normal" : values.priority;
    const cleaned = line.replace(/\s*(?:\u{23F3}|@scheduled)\s*\d{4}-\d{2}-\d{2}/gu, "").replace(/\s*(?:\u{1F4C5}|@due)\s*\d{4}-\d{2}-\d{2}/gu, "").replace(/\s*@priority\s+(highest|high|medium|normal|low|lowest)\b/gi, "").replace(/\s*[\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}]/gu, "").trimEnd();
    const priorityToken = this.smallActionPriorityToken(priority);
    const tokens = [
      scheduledDate ? `\u23F3 ${scheduledDate}` : "",
      dueDate ? `\u{1F4C5} ${dueDate}` : "",
      priorityToken
    ].filter(Boolean);
    lines[index] = tokens.length ? `${cleaned} ${tokens.join(" ")}` : cleaned;
    await this.plugin.app.vault.modify(file, lines.join("\n"));
    await this.plugin.refreshViews();
    new import_obsidian6.Notice("Small action metadata updated.");
  }
  smallActionPriorityToken(priority) {
    if (priority === "highest") return "\u23EB";
    if (priority === "high") return "\u{1F53C}";
    if (priority === "low") return "\u{1F53D}";
    if (priority === "lowest") return "\u23EC";
    return "";
  }
  async toggleSmallAction(action) {
    const file = this.plugin.app.vault.getAbstractFileByPath(action.cardPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const index = action.lineNumber - 1;
    const line = lines[index];
    if (!line || line !== action.lineText) {
      new import_obsidian6.Notice("KanbanRPM could not safely update this small action. Refresh and try again.");
      return;
    }
    const today = /* @__PURE__ */ new Date();
    const todayIso2 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const nextLine = action.done ? line.replace(/^(\s*[-*]\s+)\[[xX]\]/, "$1[ ]").replace(/\s*(?:\u{2705}|\?\?|@done)\s*\d{4}-\d{2}-\d{2}/u, "") : line.replace(/^(\s*[-*]\s+)\[ \]/, "$1[x]") + (action.doneDate ? "" : ` \u2705 ${todayIso2}`);
    lines[index] = nextLine;
    const nextContent = action.done ? lines.join("\n") : this.prependTimelineLog(lines.join("\n"), "Small action", this.smallActionTimelineLog(action, file), todayIso2);
    await this.plugin.app.vault.modify(file, nextContent);
    if (!action.done) {
      await this.appendDailyCompletedLog("small action", action.text, `Completed<br>Source: [[${file.basename}]]`);
    }
    await this.plugin.refreshViews();
  }
  async completeRoutine(cardPath, routineText, date) {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const entry = `| ${date} | ${routineText} |`;
    const next = this.prependRoutineLog(content, entry);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
    await this.appendDailyCompletedLog("routine", routineText, `Completed<br>Source: [[${file.basename}]]`, date);
    new import_obsidian6.Notice(`Logged routine: ${routineText}`);
    await this.plugin.refreshViews();
  }
  async addPrecededBy(targetPath, sourceCard) {
    const file = this.plugin.app.vault.getAbstractFileByPath(targetPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    if (targetPath === sourceCard.path) {
      new import_obsidian6.Notice("KanbanRPM cannot create a flow arrow to the same card.");
      return;
    }
    const content = await this.plugin.app.vault.read(file);
    const link = `[[${sourceCard.file.basename}]]`;
    const next = this.updateFlowList(content, "Preceded by", link, "add");
    if (next === content) {
      new import_obsidian6.Notice("KanbanRPM flow link already exists.");
      return;
    }
    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`KanbanRPM flow added: ${sourceCard.title} -> ${file.basename}`);
  }
  async removePrecededBy(targetPath, sourceCard) {
    const file = this.plugin.app.vault.getAbstractFileByPath(targetPath);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const next = this.updateFlowList(content, "Preceded by", `[[${sourceCard.file.basename}]]`, "remove", sourceCard);
    if (next === content) {
      new import_obsidian6.Notice("KanbanRPM could not find that flow link.");
      return;
    }
    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new import_obsidian6.Notice(`KanbanRPM flow removed: ${sourceCard.title} -> ${file.basename}`);
  }
  async promoteActionToBigAction(action) {
    var _a, _b, _c, _d, _e;
    const parentCard = (await this.loadCards()).find((card) => card.path === action.cardPath);
    const title = action.text.replace(/#todo\b/g, "").trim() || "Promoted Big Action";
    const file = await this.createCard({
      title,
      type: "big_action",
      project: (parentCard == null ? void 0 : parentCard.primaryProject) || ((parentCard == null ? void 0 : parentCard.type) === "project" ? `[[${parentCard.file.basename}]]` : ""),
      subproject: (parentCard == null ? void 0 : parentCard.primarySubproject) || ((parentCard == null ? void 0 : parentCard.type) === "subproject" ? `[[${parentCard.file.basename}]]` : ""),
      projects: (_a = parentCard == null ? void 0 : parentCard.projects.join("\n")) != null ? _a : "",
      subprojects: (_b = parentCard == null ? void 0 : parentCard.subprojects.join("\n")) != null ? _b : "",
      status: (_d = (_c = this.plugin.settings.statuses[0]) == null ? void 0 : _c.id) != null ? _d : "inbox",
      priority: parentCard ? String(parentCard.priority) : "3",
      workstreamType: (_e = parentCard == null ? void 0 : parentCard.workstreamType) != null ? _e : "",
      nextAction: title,
      waitingFor: "",
      blocker: "",
      startDate: "",
      scheduledDate: "",
      nextReview: "",
      dueDate: "",
      dependsOn: "",
      blocks: "",
      sourceNotes: `[[${action.sourceLabel}]]`
    });
    new import_obsidian6.Notice(`Promoted action to Big Action: ${title}`);
    return file;
  }
  async archiveCard(card) {
    await this.plugin.ensureWorkspace();
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const archiveFolder = await this.getProjectArchiveFolder(card);
    await this.rewriteCardFrontmatter(file, (frontmatter) => {
      frontmatter.archived = true;
      frontmatter.archived_at = (/* @__PURE__ */ new Date()).toISOString();
      frontmatter.archive_original_path = file.path;
      frontmatter.archive_owner_project = card.projectTitle || card.archiveOwnerProject || "Unassigned";
    });
    const archivePath = this.getAvailablePath(archiveFolder, file.basename, file.extension);
    await this.plugin.app.fileManager.renameFile(file, archivePath);
    new import_obsidian6.Notice(`Archived KanbanRPM card: ${card.title}`);
    await this.plugin.refreshViews();
  }
  async unarchiveCard(card) {
    await this.plugin.ensureWorkspace();
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const targetPath = await this.getUnarchiveTargetPath(card, file);
    await this.ensureFolder(targetPath.split("/").slice(0, -1).join("/"));
    await this.rewriteCardFrontmatter(file, (frontmatter) => {
      delete frontmatter.archived;
      delete frontmatter.archived_at;
      delete frontmatter.archive_original_path;
      delete frontmatter.archive_owner_project;
    });
    await this.plugin.app.fileManager.renameFile(file, targetPath);
    new import_obsidian6.Notice(`Unarchived KanbanRPM card: ${card.title}`);
    await this.plugin.refreshViews();
  }
  async deleteCard(card) {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    await this.plugin.app.vault.trash(file, true);
    new import_obsidian6.Notice(`Deleted KanbanRPM card: ${card.title}`);
    await this.plugin.refreshViews();
  }
  async duplicateCard(card) {
    var _a, _b;
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof import_obsidian6.TFile)) return void 0;
    const content = await this.plugin.app.vault.read(file);
    const { body } = splitFrontmatter(content);
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    const frontmatter = { ...(_a = cache == null ? void 0 : cache.frontmatter) != null ? _a : {} };
    const copyTitle = `${card.title} Copy`;
    delete frontmatter.position;
    delete frontmatter.order;
    delete frontmatter.archived;
    delete frontmatter.archived_at;
    delete frontmatter.archive_original_path;
    delete frontmatter.archive_owner_project;
    frontmatter.kanban_rpm = true;
    frontmatter.type = card.type;
    frontmatter.status = card.status;
    frontmatter.priority = card.priority;
    if (card.primaryProject) frontmatter.primary_project = card.primaryProject;
    else delete frontmatter.primary_project;
    if (card.primarySubproject) frontmatter.primary_subproject = card.primarySubproject;
    else delete frontmatter.primary_subproject;
    const copyFolder = ((_b = file.parent) == null ? void 0 : _b.path) && file.parent.path.startsWith(this.plugin.cardsFolder) ? file.parent.path : this.plugin.cardsFolder;
    const copyPath = this.getAvailablePath(copyFolder, sanitizeFileName(copyTitle), file.extension);
    const copyContent = `---
${(0, import_obsidian6.stringifyYaml)(frontmatter)}---
${body.replace(/^#\s+.+$/m, `# ${copyTitle}`)}`;
    const newFile = await this.plugin.app.vault.create(copyPath, copyContent);
    new import_obsidian6.Notice(`Duplicated KanbanRPM card: ${copyTitle}`);
    await this.plugin.refreshViews();
    return newFile;
  }
  async collectActionIndex(cards) {
    const items = [];
    const seen = /* @__PURE__ */ new Set();
    for (const card of cards) {
      const refs = [...card.sourceNotes];
      for (const ref of refs) {
        const source = this.resolveLinkedFile(ref, card.path);
        if (!(source instanceof import_obsidian6.TFile)) continue;
        const content = await this.plugin.app.vault.read(source);
        const lines = content.split(/\r?\n/);
        lines.forEach((line, index) => {
          var _a;
          if (/\[[xX-]\]/.test(line)) return;
          const checkbox = line.match(/^\s*[-*]\s+\[ \]\s+(.+)/);
          const todo = line.includes("#todo") ? line.trim().replace(/^\s*[-*]\s*/, "") : "";
          const raw = (_a = checkbox == null ? void 0 : checkbox[1]) != null ? _a : todo;
          if (!raw) return;
          const key = `${card.path}|${source.path}|${index}|${raw}`;
          if (seen.has(key)) return;
          seen.add(key);
          items.push({
            cardPath: card.path,
            cardTitle: card.title,
            sourcePath: source.path,
            sourceLabel: source.basename,
            lineNumber: index + 1,
            text: raw
          });
        });
      }
      for (const item of card.routines) {
        const key = `${card.path}|routine|${item.cadence}|${item.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          cardPath: card.path,
          cardTitle: card.title,
          sourcePath: card.path,
          sourceLabel: card.file.basename,
          lineNumber: 0,
          text: `${item.text} ${routineScheduleLabel(item)}`,
          recurring: true
        });
      }
    }
    return items;
  }
  validateCards(cards) {
    var _a, _b, _c;
    const issues = [];
    for (const card of cards) {
      const cache = this.plugin.app.metadataCache.getFileCache(card.file);
      const fm = (_a = cache == null ? void 0 : cache.frontmatter) != null ? _a : {};
      const add = (level, field, message) => {
        issues.push({
          cardPath: card.path,
          cardTitle: card.title,
          level,
          field,
          message
        });
      };
      const cardType = text(fm.type);
      if (cardType && !["project", "subproject", "big_action"].includes(cardType)) {
        add("warning", "type", `Expected project, subproject, or big_action; current value is "${cardType}".`);
      }
      const rawProjectState = text(fm.project_state).trim();
      if (rawProjectState && !["active", "closed"].includes(rawProjectState.toLowerCase())) {
        add("warning", "project_state", `project_state should be active or closed; current value is "${rawProjectState}".`);
      }
      if (card.type === "subproject" && !card.projects.length) {
        add("warning", "projects", "Subproject documents should declare at least one project link.");
      }
      if (card.type === "big_action") {
        if (!card.projects.length) add("warning", "projects", "Big Action documents should declare at least one project link.");
        if (!card.subprojects.length) add("warning", "subprojects", "Big Action documents should declare at least one subproject link.");
        if (card.primaryProject && card.primarySubproject) {
          const projectFile = this.resolveLinkedFile(card.primaryProject, card.path);
          const subprojectFile = this.resolveLinkedFile(card.primarySubproject, card.path);
          const projectCard = projectFile ? cards.find((item) => item.path === projectFile.path) : void 0;
          const subprojectCard = subprojectFile ? cards.find((item) => item.path === subprojectFile.path) : void 0;
          if (projectCard && subprojectCard && !subprojectCard.projectTitles.includes(projectCard.title)) {
            add("warning", "hierarchy", `Subproject "${subprojectCard.title}" does not belong to Project "${projectCard.title}".`);
          }
        }
      }
      if (!this.plugin.settings.statuses.some((status) => status.id === text(fm.status))) {
        add("error", "status", `Unknown status "${text(fm.status) || "(empty)"}"; card is shown in ${(_c = (_b = this.plugin.settings.statuses[0]) == null ? void 0 : _b.label) != null ? _c : "Inbox"}.`);
      }
      const rawPriority = Number(fm.priority);
      if (!Number.isFinite(rawPriority) || rawPriority < 1 || rawPriority > 5 || Math.round(rawPriority) !== rawPriority) {
        add("warning", "priority", `Priority should be an integer from 1 to 5; current value is "${text(fm.priority) || "(empty)"}".`);
      }
      const category = text(fm.workstream_type).trim();
      const configuredCategories = categoryIds(this.plugin.settings.categories);
      if (category && !configuredCategories.includes(category)) {
        add("warning", "workstream_type", `category is not in the configured vocabulary: ${configuredCategories.join(", ")}.`);
      }
      const order = text(fm.order).trim();
      if (order && !Number.isFinite(Number(order))) add("warning", "order", `order should be numeric; current value is "${order}".`);
      for (const [label, value] of [
        ["Start date", card.startDate],
        ["Scheduled date", card.scheduledDate],
        ["Next review", card.nextReview],
        ["Due date", card.dueDate]
      ]) {
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) add("warning", "timeline", `${label} should use YYYY-MM-DD; current value is "${value}".`);
      }
      for (const routine of card.routines) {
        if (!routine.startDate) add("warning", "routine", `Routine "${routine.text}" must include @start YYYY-MM-DD to appear on the Timeline.`);
        if (routine.cadence === "custom" && (!Number.isFinite(routine.interval) || routine.interval < 1)) {
          add("warning", "routine", `Routine "${routine.text}" has an invalid @every interval.`);
        }
      }
      const refs = [card.primaryProject, card.primarySubproject, ...card.projects, ...card.subprojects, ...card.sourceNotes].filter(Boolean);
      for (const ref of refs) {
        if (ref.includes("[[") && !this.resolveLinkedFile(ref, card.path)) {
          add("warning", "links", `Could not resolve linked note ${ref}.`);
        }
      }
      for (const dependency of card.precededBy) {
        if (dependency.includes("[[") && !this.resolveLinkedFile(dependency, card.path)) {
          add("warning", "dependencies", `Preceded by unresolved note ${dependency}.`);
        }
      }
      for (const blocked of card.followedBy) {
        if (blocked.includes("[[") && !this.resolveLinkedFile(blocked, card.path)) {
          add("warning", "dependencies", `Followed by unresolved note ${blocked}.`);
        }
      }
      if (this.hasCircularDependency(card, cards)) add("warning", "dependencies", "Circular dependency detected.");
    }
    return issues.sort((a, b) => {
      if (a.level !== b.level) return a.level === "error" ? -1 : 1;
      return a.cardTitle.localeCompare(b.cardTitle) || a.field.localeCompare(b.field);
    });
  }
  async writeManagementBrief(cards) {
    await this.plugin.ensureWorkspace();
    const sourceCards = cards != null ? cards : this.excludeClosedProjectCards(await this.loadCards());
    const content = this.renderManagementBrief(sourceCards);
    const existing = this.plugin.app.vault.getAbstractFileByPath(this.plugin.managementBriefPath);
    let file;
    if (existing instanceof import_obsidian6.TFile) {
      await this.plugin.app.vault.modify(existing, content);
      file = existing;
    } else {
      file = await this.plugin.app.vault.create(this.plugin.managementBriefPath, content);
    }
    new import_obsidian6.Notice("KanbanRPM management brief updated.");
    await this.plugin.app.workspace.getLeaf(false).openFile(file);
  }
  async writeLLMContext(cards) {
    await this.plugin.ensureWorkspace();
    await this.ensureFolder(this.plugin.llmFolder);
    await this.ensureFolder(this.plugin.llmProjectBriefsFolder);
    const sourceCards = cards != null ? cards : this.excludeClosedProjectCards(await this.loadCards());
    const sorted = [...sourceCards].sort(compareCards);
    const recentChanges = await this.collectRecentChanges(sorted, 14);
    const files = [
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/00 LLM Entry.md`, this.renderLLMEntry()),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/01 Next Work Candidates.md`, this.renderLLMNextWorkCandidates(sorted)),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/02 Project Map.md`, this.renderLLMProjectMap(sorted)),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/03 Recent Changes.md`, this.renderLLMRecentChanges(recentChanges)),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/04 Open Loops.md`, this.renderLLMOpenLoops(sorted))
    ];
    for (const project of sorted.filter((card) => card.type === "project")) {
      const path = `${this.plugin.llmProjectBriefsFolder}/${sanitizeFileName(project.title)} Brief.md`;
      files.push(await this.writeGeneratedFile(path, this.renderLLMProjectBrief(project, sorted, recentChanges)));
    }
    new import_obsidian6.Notice(`KanbanRPM LLM context updated (${files.length} files).`);
    await this.plugin.app.workspace.getLeaf(false).openFile(files[0]);
  }
  async writeGeneratedFile(path, content) {
    const normalized = (0, import_obsidian6.normalizePath)(path);
    await this.ensureFolder(normalized.split("/").slice(0, -1).join("/"));
    const existing = this.plugin.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof import_obsidian6.TFile) {
      await this.plugin.app.vault.modify(existing, content);
      return existing;
    }
    return this.plugin.app.vault.create(normalized, content);
  }
  renderLLMEntry() {
    const today = todayIso();
    return `# KanbanRPM LLM Entry

Generated: ${today}

> [!kanban-rpm]
> Generated read model. Do not edit manually. KanbanRPM living documents remain the source of truth.

## Read Order

### Next work recommendation

1. [[01 Next Work Candidates]]
2. [[03 Recent Changes]]
3. Relevant files under [[Project Briefs]]
4. Open original living documents only when a recommendation needs more detail.

### Project/Subproject/Big Action briefing

1. Relevant Project Brief.
2. [[02 Project Map]]
3. [[03 Recent Changes]]
4. Original living document only if the brief is insufficient.

### Research or content planning

Do not rely on generated briefs alone. Read the user-specified living document and relevant references/wiki pages. Use generated files only for orientation.

## Output Rules For LLMs

- Separate PM state from research interpretation.
- Do not invent missing facts.
- When recommending next work, discuss urgency, dependency, cognitive load, and research value.
- When planning research content, cite which original note or wiki page supports the reasoning.
`;
  }
  renderLLMNextWorkCandidates(cards) {
    const today = todayIso();
    const soon = addDays(today, 14);
    const candidates = cards.filter((card) => card.type !== "project").filter((card) => !card.archived && !this.isCompletionStatus(card.status) && card.status !== this.statusId("active")).map((card) => ({ card, score: this.llmCandidateScore(card, cards, today, soon), reasons: this.llmCandidateReasons(card, cards, today, soon) })).sort((a, b) => b.score - a.score || compareCards(a.card, b.card));
    const rows = candidates.map(
      ({ card, score, reasons }) => `| [[${card.file.basename}]] | ${this.cardTypeLogLabel(card.type)} | ${this.escapeTableCell(card.projectTitle || "No project")} | ${this.escapeTableCell(card.subprojectTitle)} | ${this.statusLabel(card.status)} | P${card.priority} | ${score} | ${this.escapeTableCell(reasons.join("; ") || "candidate for review")} | ${this.escapeTableCell(card.nextAction || "")} | ${this.escapeTableCell(this.cardDateSummary(card))} |`
    ).join("\n");
    return `# Next Work Candidates

Generated: ${today}

Use this file to discuss which non-active card should become active next. Excludes completed, closed, archived, and currently active cards.

Suggested prompt:

\`\`\`text
Read this candidate list and recommend 3 cards to activate next. Explain tradeoffs: urgency, importance, dependency state, cognitive load, and research value. Ask questions if the best choice depends on missing context.
\`\`\`

| Candidate | Type | Project | Subproject | Status | Priority | Score | Why candidate | Current focus | Dates |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
${rows || "| No candidates |  |  |  |  |  |  |  |  |  |"}
`;
  }
  renderLLMProjectMap(cards) {
    const today = todayIso();
    const projects = cards.filter((card) => card.type === "project").sort(compareCards);
    const sections = projects.map((project) => {
      const children = cards.filter((card) => card.type !== "project" && card.projectTitles.includes(project.title)).sort(compareCards);
      const subprojects = children.filter((card) => card.type === "subproject");
      const actions = children.filter((card) => card.type === "big_action");
      return `## [[${project.file.basename}]]

- Status: ${this.statusLabel(project.status)}
- State: ${project.projectState}
- Active subprojects: ${subprojects.filter((card) => card.status === this.statusId("active")).length}/${subprojects.length}
- Active big actions: ${actions.filter((card) => card.status === this.statusId("active")).length}/${actions.length}
- Waiting/blocking: ${children.filter((card) => card.waitingFor || card.blocker || card.blockedBy.length).length}

${children.length ? children.map((card) => `- [[${card.file.basename}]] (${this.cardTypeLogLabel(card.type)}, ${this.statusLabel(card.status)}, P${card.priority})${card.nextAction ? ` - ${card.nextAction}` : ""}`).join("\n") : "- No child cards."}`;
    });
    return `# Project Map

Generated: ${today}

Compact hierarchy map for orientation. Use Project Briefs for richer PM context.

${sections.join("\n\n") || "- No projects."}
`;
  }
  renderLLMRecentChanges(changes) {
    const rows = changes.map((item) => `| ${item.date} | ${this.escapeTableCell(item.type)} | ${this.escapeTableCell(item.item)} | ${this.escapeTableCell(item.context)} | ${this.escapeTableCell(item.change)} | ${item.source} |`).join("\n");
    return `# Recent Changes

Generated: ${todayIso()}

Recent completion/status/change log extracted from card Timeline Logs and daily timeline Completed Logs. Use this to avoid rereading every note.

| Date | Type | Item | Context | Change | Source |
| --- | --- | --- | --- | --- | --- |
${rows || "| No recent changes found |  |  |  |  |  |"}
`;
  }
  renderLLMOpenLoops(cards) {
    const today = todayIso();
    const rows = cards.filter((card) => !this.isCompletionStatus(card.status)).filter((card) => card.waitingFor || card.blocker || card.blockedBy.length || !card.nextAction).sort((a, b) => this.llmOpenLoopRank(b) - this.llmOpenLoopRank(a) || compareCards(a, b)).map((card) => `| [[${card.file.basename}]] | ${this.cardTypeLogLabel(card.type)} | ${this.statusLabel(card.status)} | P${card.priority} | ${this.escapeTableCell(card.waitingFor || "")} | ${this.escapeTableCell(card.blocker || card.blockedBy.join(", "))} | ${this.escapeTableCell(card.nextAction || "(missing)")} |`).join("\n");
    return `# Open Loops

Generated: ${today}

Waiting, blocker, blocked-by, and missing-current-focus items for PM review.

| Card | Type | Status | Priority | Waiting | Blocker / blocked by | Current focus |
| --- | --- | --- | ---: | --- | --- | --- |
${rows || "| No open loops found |  |  |  |  |  |  |"}
`;
  }
  renderLLMProjectBrief(project, cards, changes) {
    const today = todayIso();
    const children = cards.filter((card) => card.type !== "project" && card.projectTitles.includes(project.title)).sort(compareCards);
    const active = children.filter((card) => card.status === this.statusId("active"));
    const waiting = children.filter((card) => card.waitingFor || card.status === this.statusId("waiting"));
    const blocked = children.filter((card) => card.blocker || card.blockedBy.length || card.status === this.statusId("blocked"));
    const recent = changes.filter((item) => item.card && (item.card.path === project.path || item.card.projectTitles.includes(project.title))).slice(0, 20);
    const recentCompleted = recent.filter((item) => /complete|done|small action|routine|big action|subproject/i.test(`${item.type} ${item.change}`)).slice(0, 10);
    const staleWaiting = waiting.filter((card) => this.cardDormantDays(card, today) >= 14);
    const unresolvedBlockers = blocked.map((card) => ({ card, age: this.cardDormantDays(card, today) })).sort((a, b) => b.age - a.age || compareCards(a.card, b.card));
    const attention = this.briefAttentionCards(children, today, addDays(today, 14)).slice(0, 8);
    const highPriorityActions = children.flatMap(
      (card) => card.smallActions.filter((action) => !action.done && ["highest", "high"].includes(action.priority)).map((action) => `- [[${card.file.basename}]]: ${action.text}${action.dueDate || action.scheduledDate ? ` (${action.dueDate || action.scheduledDate})` : ""}`)
    );
    return `# ${project.title} Brief

Generated: ${todayIso()}

> [!kanban-rpm]
> Generated PM brief. Use for briefing and PM discussion. For research/content planning, open [[${project.file.basename}]] and relevant source/wiki notes.

## Identity

- Project: [[${project.file.basename}]]
- Status: ${this.statusLabel(project.status)}
- Project state: ${project.projectState}
- Current focus: ${project.nextAction || "(none)"}
- Dates: ${this.cardDateSummary(project) || "(none)"}

## Current Surface

| Metric | Count |
| --- | ---: |
| Child cards | ${children.length} |
| Active | ${active.length} |
| Waiting | ${waiting.length} |
| Blocked | ${blocked.length} |
| Open small actions | ${children.reduce((sum, card) => sum + card.smallActions.filter((action) => !action.done).length, 0)} |
| Active workload | ${active.length} |
| Stale waiting | ${staleWaiting.length} |
| Unresolved blockers | ${unresolvedBlockers.length} |

## Active Work

${active.length ? active.map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No active child cards."}

## Recommended Attention

${attention.length ? attention.map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No immediate attention items."}

## Waiting / Blocked

${[...waiting, ...blocked].length ? Array.from(new Map([...waiting, ...blocked].map((card) => [card.path, card])).values()).map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No waiting or blocked child cards."}

## Stale Waiting

${staleWaiting.length ? staleWaiting.map((card) => `- [[${card.file.basename}]]: ${card.waitingFor || this.statusLabel(card.status)} (${this.cardDormantDays(card, today)}d since last modified)`).join("\n") : "- No stale waiting items."}

## Unresolved Blockers

${unresolvedBlockers.length ? unresolvedBlockers.map(({ card, age }) => `- [[${card.file.basename}]]: ${card.blocker || card.blockedBy.join(", ")} (${age}d since last modified)`).join("\n") : "- No unresolved blockers."}

## High-Priority Small Actions

${highPriorityActions.slice(0, 20).join("\n") || "- No high-priority small actions."}

## Recently Completed

${recentCompleted.length ? recentCompleted.map((item) => `- ${item.date} ${item.item}: ${item.change}`).join("\n") : "- No recent completions found."}

## Recent Changes

${recent.length ? recent.map((item) => `- ${item.date} ${item.item} (${item.type}): ${item.change}`).join("\n") : "- No recent changes found."}

## Original Notes For Deep Planning

- Project living document: [[${project.file.basename}]]
- For research/content planning, read the relevant Subproject/Big Action living document directly instead of relying only on this generated brief.
`;
  }
  llmCandidateScore(card, cards, today, soon) {
    let score = 0;
    score += Math.max(0, 6 - card.priority) * 10;
    if (card.status === this.statusId("inbox")) score += 8;
    if (card.status === this.statusId("waiting")) score += card.waitingFor ? 6 : 2;
    if (card.status === this.statusId("blocked") || card.blocker || card.blockedBy.length) score -= 20;
    if (card.scheduledDate && card.scheduledDate < today) score += 35;
    else if (card.scheduledDate && card.scheduledDate <= soon) score += 22;
    if (card.dueDate && card.dueDate < today) score += 30;
    else if (card.dueDate && card.dueDate <= soon) score += 18;
    if (card.nextReview && card.nextReview <= today) score += 16;
    if (card.nextAction) score += 12;
    if (!card.nextAction) score -= 8;
    if (card.projectTitle) score += 4;
    if (this.hasActiveParent(card, cards)) score += 10;
    const activeSiblings = this.activeSiblingCount(card, cards);
    if (activeSiblings === 0 && card.projectTitle) score += 8;
    if (activeSiblings >= 3) score -= (activeSiblings - 2) * 8;
    const dormantDays = this.cardDormantDays(card, today);
    if (dormantDays >= 30) score += 12;
    else if (dormantDays >= 14) score += 6;
    if (["research", "experiment", "analysis", "writing"].includes(card.workstreamType)) score += 4;
    return score;
  }
  llmCandidateReasons(card, cards, today, soon) {
    const reasons = [];
    if (card.priority <= 2) reasons.push("high priority");
    if (card.scheduledDate && card.scheduledDate < today) reasons.push("scheduled overdue");
    else if (card.scheduledDate && card.scheduledDate <= soon) reasons.push("scheduled soon");
    if (card.dueDate && card.dueDate < today) reasons.push("due overdue");
    else if (card.dueDate && card.dueDate <= soon) reasons.push("due soon");
    if (card.nextReview && card.nextReview <= today) reasons.push("review due");
    if (card.nextAction) reasons.push("clear current focus");
    else reasons.push("needs current focus clarification");
    if (card.waitingFor) reasons.push(`waiting: ${card.waitingFor}`);
    if (card.blocker || card.blockedBy.length) reasons.push("blocked; discuss before activation");
    if (this.hasActiveParent(card, cards)) reasons.push("parent is active");
    const activeSiblings = this.activeSiblingCount(card, cards);
    if (activeSiblings === 0 && card.projectTitle) reasons.push("no active sibling in project");
    if (activeSiblings >= 3) reasons.push(`project already has ${activeSiblings} active siblings`);
    const dormantDays = this.cardDormantDays(card, today);
    if (dormantDays >= 14) reasons.push(`dormant ${dormantDays}d`);
    if (["research", "experiment", "analysis", "writing"].includes(card.workstreamType)) reasons.push(`research category: ${card.workstreamType}`);
    return reasons;
  }
  hasActiveParent(card, cards) {
    if (card.type === "subproject") {
      return this.parentActive(card.projectTitle, "project", cards);
    }
    if (card.type === "big_action") {
      return this.parentActive(card.subprojectTitle, "subproject", cards) || this.parentActive(card.projectTitle, "project", cards);
    }
    return false;
  }
  parentActive(title, type, cards) {
    if (!title) return false;
    const card = cards.find((item) => item.type === type && item.title === title);
    return Boolean(card && card.status === this.statusId("active"));
  }
  activeSiblingCount(card, cards) {
    return cards.filter((item) => {
      if (item.path === card.path || item.type === "project" || item.status !== this.statusId("active")) return false;
      if (card.type === "big_action" && card.subprojectTitle) return item.subprojectTitles.includes(card.subprojectTitle);
      if (card.projectTitle) return item.projectTitles.includes(card.projectTitle);
      return false;
    }).length;
  }
  cardDormantDays(card, today) {
    const modified = formatDate(new Date(card.file.stat.mtime));
    return Math.max(0, daysBetween(modified, today));
  }
  llmOpenLoopRank(card) {
    let rank = 0;
    if (card.blocker || card.blockedBy.length) rank += 30;
    if (card.waitingFor) rank += 20;
    if (!card.nextAction) rank += 10;
    rank += Math.max(0, 6 - card.priority);
    return rank;
  }
  cardDateSummary(card) {
    return [
      card.startDate ? `start ${card.startDate}` : "",
      card.scheduledDate ? `scheduled ${card.scheduledDate}` : "",
      card.dueDate ? `due ${card.dueDate}` : "",
      card.nextReview ? `review ${card.nextReview}` : ""
    ].filter(Boolean).join(", ");
  }
  async collectRecentChanges(cards, days) {
    var _a, _b;
    const minDate = addDays(todayIso(), -days);
    const changes = [];
    for (const card of cards) {
      const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
      if (!(file instanceof import_obsidian6.TFile)) continue;
      const content = await this.plugin.app.vault.read(file);
      const section = findHeadingSection(content, "Timeline Log");
      if (!section) continue;
      const body = content.slice(section.bodyStart, section.end);
      for (const line of body.split(/\r?\n/)) {
        const cells = parseMarkdownTableRow(line);
        if (!cells || cells.length < 3 || cells[0].toLowerCase() === "date" || cells[0].startsWith("---")) continue;
        if (cells[0] < minDate) continue;
        changes.push({
          date: cells[0],
          type: (_a = cells[1]) != null ? _a : "",
          card,
          item: `[[${card.file.basename}]]`,
          context: card.breadcrumb || card.title,
          change: (_b = cells[2]) != null ? _b : "",
          source: "card"
        });
      }
    }
    changes.push(...await this.collectDailyCompletedLogs(cards, minDate));
    return changes.sort((a, b) => b.date.localeCompare(a.date) || a.item.localeCompare(b.item)).slice(0, 120);
  }
  async collectDailyCompletedLogs(cards, minDate) {
    var _a, _b, _c;
    const folder = (0, import_obsidian6.normalizePath)(`${this.plugin.workspaceFolder}/timeline`);
    const byTitle = new Map(cards.map((card) => [card.file.basename, card]));
    const changes = [];
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(`${folder}/`)) continue;
      const date = file.basename;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < minDate) continue;
      const content = await this.plugin.app.vault.read(file);
      const section = findHeadingSection(content, "Completed Log");
      if (!section) continue;
      const body = content.slice(section.bodyStart, section.end);
      for (const line of body.split(/\r?\n/)) {
        const cells = parseMarkdownTableRow(line);
        if (!cells || cells.length < 4 || cells[0].toLowerCase() === "time" || cells[0].startsWith("---")) continue;
        const item = (_a = cells[2]) != null ? _a : "";
        const linkedTitle = getWikiLinkTarget(item);
        const card = linkedTitle ? byTitle.get(linkedTitle) : void 0;
        changes.push({
          date: `${date} ${cells[0]}`,
          type: (_b = cells[1]) != null ? _b : "",
          card,
          item,
          context: (card == null ? void 0 : card.breadcrumb) || (card == null ? void 0 : card.title) || "",
          change: (_c = cells[3]) != null ? _c : "",
          source: "daily"
        });
      }
    }
    return changes;
  }
  resolveLinkedFile(link, sourcePath) {
    const target = getWikiLinkTarget(link);
    if (!target) return null;
    const linked = this.plugin.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    if (linked instanceof import_obsidian6.TFile) return linked;
    const normalized = (0, import_obsidian6.normalizePath)(target.endsWith(".md") ? target : `${target}.md`);
    const direct = this.plugin.app.vault.getAbstractFileByPath(normalized);
    return direct instanceof import_obsidian6.TFile ? direct : null;
  }
  renderManagementBrief(cards) {
    const sorted = [...cards].sort(compareCards);
    const today = todayIso();
    const soon = addDays(today, 14);
    const boardCards = sorted.filter((card) => card.type !== "project");
    const projectCards = sorted.filter((card) => card.type === "project");
    const statusCounts = this.plugin.settings.statuses.map((status) => `| ${status.label} | ${cards.filter((card) => card.status === status.id).length} |`).join("\n");
    const warningRows = this.validateCards(cards).slice(0, 30).map((issue) => `- ${issue.level.toUpperCase()} [[${issue.cardTitle}]]: ${issue.message}`).join("\n");
    const dueSoon = boardCards.filter((card) => card.scheduledDate && card.scheduledDate <= soon || card.dueDate && card.dueDate <= soon || card.nextReview && card.nextReview <= soon).sort((a, b) => (a.scheduledDate || a.dueDate || a.nextReview || "").localeCompare(b.scheduledDate || b.dueDate || b.nextReview || "") || a.title.localeCompare(b.title));
    const waiting = boardCards.filter((card) => card.waitingFor || card.status === this.statusId("waiting")).sort(compareCards);
    const blocked = boardCards.filter((card) => card.blocker || card.blockedBy.length || card.status === this.statusId("blocked")).sort(compareCards);
    const routines = boardCards.flatMap((card) => card.routines.map((routine) => ({ card, routine })));
    const smallActionCount = boardCards.reduce((sum, card) => sum + card.smallActions.filter((action) => !action.done).length, 0);
    const attentionCards = this.briefAttentionCards(boardCards, today, soon);
    const projectHealthRows = this.renderBriefProjectHealthRows(projectCards, boardCards);
    const nextActionRows = this.renderBriefNextActionRows(boardCards);
    const openSmallActions = this.renderBriefSmallActionRows(boardCards, today, soon);
    const recentResearchLogs = this.renderBriefResearchLogRows(boardCards);
    return `# KanbanRPM Management Brief

Generated: ${today}

> [!kanban-rpm]
> This file is generated by KanbanRPM. It is designed as a compact project-management brief for human review and LLM-assisted planning.

## How To Use With An LLM

Ask for advice against this brief first. If more detail is needed, open the linked living documents.

Suggested prompt:

\`\`\`text
Read this KanbanRPM Management Brief as my research project-management context.
Identify the highest-risk blockers, stale waiting items, upcoming deadlines/reviews, and the next 3-5 actions I should focus on.
Do not invent missing facts; point to the linked cards that need more information.
\`\`\`

## Snapshot

| Metric | Count |
| --- | ---: |
| Projects | ${projectCards.length} |
| Subprojects | ${cards.filter((card) => card.type === "subproject").length} |
| Big Actions | ${cards.filter((card) => card.type === "big_action").length} |
| Attention cards | ${attentionCards.length} |
| Open small actions | ${smallActionCount} |
| Routines | ${routines.length} |
| Data warnings | ${this.validateCards(cards).length} |

## Executive Attention

${attentionCards.length ? attentionCards.slice(0, 12).map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No urgent attention cards."}

## Project Health

| Project | Active | Waiting | Blocked | Done | Open actions | Next date |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${projectHealthRows || "| No project | 0 | 0 | 0 | 0 | 0 | |"}

## Status Counts

| Status | Count |
| --- | ---: |
${statusCounts}

## Projects

${this.renderBriefProjectSections(sorted)}

## Upcoming Dates

${dueSoon.length ? dueSoon.map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No due/review dates in the next 14 days."}

## Current Focus

${nextActionRows || "- No explicit current focus items."}

## Open Small Actions

${openSmallActions || "- No dated or high-priority small actions."}

## Waiting

${waiting.length ? waiting.map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No waiting cards."}

## Blocked

${blocked.length ? blocked.map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No blocked cards."}

## Flow Risks

${this.renderBriefFlowRisks(boardCards)}

## Routines

${routines.length ? routines.map(({ card, routine }) => `- [[${card.file.basename}]]: ${routine.text} (${routineScheduleLabel(routine)})`).join("\n") : "- No routines."}

## Recent Research Logs

${recentResearchLogs || "- No research log rows found."}

## Data Warnings

${warningRows || "- No data warnings."}
`;
  }
  renderBriefProjectSections(cards) {
    const projects = cards.filter((card) => card.type === "project").sort(compareCards);
    const loose = cards.filter((card) => card.type !== "project" && !card.projectTitle);
    const sections = projects.map((project) => {
      const children = cards.filter((card) => card.type !== "project" && card.projectTitles.includes(project.title)).sort(compareCards);
      return `### ${project.title}

- Document: [[${project.file.basename}]]
- Status: ${this.statusLabel(project.status)}
- Current focus: ${project.nextAction || "(none)"}

${children.length ? children.map((card) => this.renderBriefCardLine(card, true)).join("\n") : "- No active child cards."}`;
    });
    if (loose.length) {
      sections.push(`### No Project

${loose.map((card) => this.renderBriefCardLine(card, true)).join("\n")}`);
    }
    return sections.join("\n\n") || "- No projects.";
  }
  renderBriefCardLine(card, includeContext) {
    const context = includeContext ? ` ${card.breadcrumb ? `(${card.breadcrumb})` : ""}` : "";
    const bits = [
      this.statusLabel(card.status),
      `P${card.priority}`,
      card.workstreamType ? `category: ${categoryLabel(this.plugin.settings.categories, card.workstreamType)}` : "",
      card.scheduledDate ? `scheduled: ${card.scheduledDate}` : "",
      card.dueDate ? `due: ${card.dueDate}` : "",
      card.nextReview ? `review: ${card.nextReview}` : "",
      card.blockedBy.length ? `blocked by: ${card.blockedBy.join(", ")}` : ""
    ].filter(Boolean);
    const focus = card.nextAction ? ` - ${card.nextAction}` : "";
    return `- [[${card.file.basename}]]${context}: ${bits.join(", ")}${focus}`;
  }
  renderBriefFlowRisks(cards) {
    const risks = cards.filter((card) => card.blockedBy.length || card.precededBy.length).sort((a, b) => b.blockedBy.length - a.blockedBy.length || a.title.localeCompare(b.title)).slice(0, 30);
    if (!risks.length) return "- No flow risks.";
    return risks.map((card) => this.renderBriefCardLine(card, true)).join("\n");
  }
  briefAttentionCards(cards, today, soon) {
    return cards.filter((card) => {
      if (this.isCompletionStatus(card.status)) return false;
      if (card.status === this.statusId("blocked") || card.blocker || card.blockedBy.length) return true;
      if (card.status === this.statusId("waiting") || card.waitingFor) return true;
      if (card.scheduledDate && card.scheduledDate <= soon) return true;
      if (card.dueDate && card.dueDate <= soon) return true;
      if (card.nextReview && card.nextReview <= today) return true;
      if (card.priority <= 2 && card.nextAction) return true;
      return false;
    }).sort((a, b) => this.briefAttentionScore(b, today, soon) - this.briefAttentionScore(a, today, soon) || compareCards(a, b));
  }
  briefAttentionScore(card, today, soon) {
    let score = 0;
    if (card.status === this.statusId("blocked") || card.blocker) score += 50;
    score += card.blockedBy.length * 12;
    if (card.status === this.statusId("waiting") || card.waitingFor) score += 24;
    if (card.scheduledDate && card.scheduledDate < today) score += 42;
    else if (card.scheduledDate && card.scheduledDate <= soon) score += 24;
    if (card.dueDate && card.dueDate < today) score += 40;
    else if (card.dueDate && card.dueDate <= soon) score += 22;
    if (card.nextReview && card.nextReview <= today) score += 18;
    score += Math.max(0, 6 - card.priority) * 4;
    if (!card.nextAction && !this.isCompletionStatus(card.status)) score += 8;
    return score;
  }
  renderBriefProjectHealthRows(projects, boardCards) {
    const projectTitles = new Set(projects.map((project) => project.title));
    for (const card of boardCards) {
      if (!card.projectTitles.length) projectTitles.add("No Project");
      for (const title of card.projectTitles) projectTitles.add(title);
    }
    return Array.from(projectTitles).sort((a, b) => a.localeCompare(b)).map((title) => {
      var _a;
      const children = title === "No Project" ? boardCards.filter((card) => !card.projectTitles.length) : boardCards.filter((card) => card.projectTitles.includes(title));
      const active = children.filter((card) => card.status === this.statusId("active")).length;
      const waiting = children.filter((card) => card.status === this.statusId("waiting") || card.waitingFor).length;
      const blocked = children.filter((card) => card.status === this.statusId("blocked") || card.blocker || card.blockedBy.length).length;
      const done = children.filter((card) => this.isCompletionStatus(card.status)).length;
      const openActions = children.reduce((sum, card) => sum + card.smallActions.filter((action) => !action.done).length, 0);
      const nextDate = (_a = children.flatMap((card) => [card.scheduledDate, card.dueDate, card.nextReview].filter(Boolean)).sort()[0]) != null ? _a : "";
      const project = projects.find((card) => card.title === title);
      const label = project ? `[[${project.file.basename}]]` : title;
      return `| ${label} | ${active} | ${waiting} | ${blocked} | ${done} | ${openActions} | ${nextDate} |`;
    }).join("\n");
  }
  renderBriefNextActionRows(cards) {
    const rows = cards.filter((card) => !this.isCompletionStatus(card.status) && card.nextAction).sort((a, b) => a.priority - b.priority || compareCards(a, b)).slice(0, 20).map((card) => this.renderBriefCardLine(card, true));
    return rows.join("\n");
  }
  renderBriefSmallActionRows(cards, today, soon) {
    const actions = cards.flatMap(
      (card) => card.smallActions.filter((action) => !action.done).filter((action) => action.dueDate || action.scheduledDate || ["highest", "high"].includes(action.priority)).map((action) => ({ card, action }))
    ).sort((a, b) => this.briefActionDate(a.action).localeCompare(this.briefActionDate(b.action)) || a.card.title.localeCompare(b.card.title)).slice(0, 25);
    if (!actions.length) return "";
    return actions.map(({ card, action }) => {
      const date = this.briefActionDate(action);
      const timing = date && date < today ? "overdue" : date && date <= soon ? "soon" : date || "undated";
      return `- [[${card.file.basename}]] (${card.breadcrumb || card.title}): ${action.text}${date ? ` - ${date}` : ""} ${timing !== "undated" ? `(${timing})` : ""}`;
    }).join("\n");
  }
  briefActionDate(action) {
    return action.dueDate || action.scheduledDate || "9999-99-99";
  }
  renderBriefResearchLogRows(cards) {
    const logs = cards.flatMap((card) => card.researchLogs.map((log) => ({ card, log }))).sort((a, b) => b.log.date.localeCompare(a.log.date) || a.log.module.localeCompare(b.log.module)).slice(0, 12);
    if (!logs.length) return "";
    return logs.map(({ card, log }) => `- ${log.date} [[${card.file.basename}]]: ${log.kind}, ${log.module || "(module)"}, ${log.subject || "(subject)"} - ${log.result || "(no result)"}`).join("\n");
  }
  statusId(preferredId) {
    var _a, _b;
    return (_b = (_a = this.plugin.settings.statuses.find((status) => status.id === preferredId)) == null ? void 0 : _a.id) != null ? _b : preferredId;
  }
  normalizeProjectState(value) {
    return text(value).trim().toLowerCase() === "closed" ? "closed" : "active";
  }
  excludeClosedProjectCards(cards) {
    const closedProjects = new Set(cards.filter((card) => card.type === "project" && card.projectState === "closed").map((card) => card.title));
    return cards.filter((card) => {
      if (card.type === "project") return card.projectState !== "closed";
      if (!card.projectTitles.length) return true;
      return !card.projectTitles.some((title) => closedProjects.has(title)) || !card.projectTitles.every((title) => closedProjects.has(title));
    });
  }
  statusLabel(statusId) {
    var _a, _b;
    return (_b = (_a = this.plugin.settings.statuses.find((status) => status.id === statusId)) == null ? void 0 : _a.label) != null ? _b : statusId;
  }
  computeOrder(laneCards, insertIndex) {
    var _a, _b;
    const previous = laneCards[insertIndex - 1];
    const next = laneCards[insertIndex];
    const prevOrder = (_a = previous == null ? void 0 : previous.order) != null ? _a : insertIndex * 1e3;
    const nextOrder = (_b = next == null ? void 0 : next.order) != null ? _b : (insertIndex + 2) * 1e3;
    if (previous && next && prevOrder < nextOrder) return Math.round((prevOrder + nextOrder) / 2);
    if (!previous && next && nextOrder > 1) return Math.round(nextOrder / 2);
    return prevOrder + 1e3;
  }
  getAvailablePath(folder, baseName, extension) {
    let index = 1;
    let path = (0, import_obsidian6.normalizePath)(`${folder}/${baseName}.${extension}`);
    while (this.plugin.app.vault.getAbstractFileByPath(path)) {
      index += 1;
      path = (0, import_obsidian6.normalizePath)(`${folder}/${baseName} ${index}.${extension}`);
    }
    return path;
  }
  getAvailablePathForExistingFile(currentPath, folder, baseName, extension) {
    let index = 1;
    let path = (0, import_obsidian6.normalizePath)(`${folder}/${baseName}.${extension}`);
    const normalizedCurrent = (0, import_obsidian6.normalizePath)(currentPath);
    while (true) {
      const existing = this.plugin.app.vault.getAbstractFileByPath(path);
      if (!existing || (0, import_obsidian6.normalizePath)(existing.path) === normalizedCurrent) return path;
      index += 1;
      path = (0, import_obsidian6.normalizePath)(`${folder}/${baseName} ${index}.${extension}`);
    }
  }
  async syncHierarchyAfterCardUpdate(card, values, cardsBeforeUpdate, oldPath, newPath, oldBaseName, newBaseName) {
    if (this.pathParts(oldPath).includes("archive") || this.pathParts(newPath).includes("archive")) return;
    if (values.type !== "project" && values.type !== "subproject") return;
    const oldFolder = card.type === "project" ? (0, import_obsidian6.normalizePath)(`${this.plugin.cardsFolder}/${sanitizeFileName(oldBaseName)}`) : (0, import_obsidian6.normalizePath)(`${this.folderPathFromFilePath(oldPath)}/${sanitizeFileName(oldBaseName)}`);
    const newFolder = values.type === "project" ? (0, import_obsidian6.normalizePath)(`${this.plugin.cardsFolder}/${sanitizeFileName(newBaseName)}`) : (0, import_obsidian6.normalizePath)(`${this.folderPathFromFilePath(newPath)}/${sanitizeFileName(newBaseName)}`);
    await this.moveHierarchyFolderIfNeeded(oldFolder, newFolder);
    if (values.type === "subproject") {
      await this.updateSubprojectChildrenHierarchy(card, values, cardsBeforeUpdate, oldPath, oldFolder, newFolder, newBaseName);
    }
  }
  async moveHierarchyFolderIfNeeded(oldFolder, newFolder) {
    if (oldFolder === newFolder) {
      await this.ensureFolder(newFolder);
      return;
    }
    const folder = this.plugin.app.vault.getAbstractFileByPath(oldFolder);
    if (!(folder instanceof import_obsidian7.TFolder)) {
      await this.ensureFolder(newFolder);
      return;
    }
    const existing = this.plugin.app.vault.getAbstractFileByPath(newFolder);
    if (existing) {
      new import_obsidian6.Notice(`KanbanRPM skipped folder move because target already exists: ${newFolder}`);
      return;
    }
    await this.ensureFolder(this.folderPathFromFilePath(newFolder));
    await this.plugin.app.fileManager.renameFile(folder, newFolder);
  }
  async updateSubprojectChildrenHierarchy(card, values, cardsBeforeUpdate, oldPath, oldFolder, newFolder, newBaseName) {
    var _a;
    const newProject = values.project.trim();
    if (!newProject) return;
    const oldProjectCandidates = this.linkMatchCandidates([card.primaryProject, card.project, ...card.projects]);
    const oldSubprojectCandidates = this.linkMatchCandidates([
      `[[${this.fileBaseNameFromPath(oldPath)}]]`,
      `[[${card.title}]]`,
      oldPath,
      card.title
    ]);
    const newSubproject = `[[${newBaseName}]]`;
    const oldFolderPrefix = `${(0, import_obsidian6.normalizePath)(oldFolder)}/`;
    const newFolderPrefix = `${(0, import_obsidian6.normalizePath)(newFolder)}/`;
    const children = cardsBeforeUpdate.filter((item) => {
      if (item.type !== "big_action") return false;
      if ((0, import_obsidian6.normalizePath)(item.path).startsWith(oldFolderPrefix)) return true;
      return [item.primarySubproject, item.subproject, ...item.subprojects].some((link) => this.linkMatchesAny(link, oldSubprojectCandidates));
    });
    for (const child of children) {
      const normalizedPath = (0, import_obsidian6.normalizePath)(child.path);
      const expectedPath = normalizedPath.startsWith(oldFolderPrefix) ? (0, import_obsidian6.normalizePath)(`${newFolderPrefix}${normalizedPath.slice(oldFolderPrefix.length)}`) : normalizedPath;
      const target = (_a = this.plugin.app.vault.getAbstractFileByPath(expectedPath)) != null ? _a : this.plugin.app.vault.getAbstractFileByPath(normalizedPath);
      if (!(target instanceof import_obsidian6.TFile)) continue;
      await this.updateCardFrontmatter(target, {
        primary_project: newProject,
        primary_subproject: newSubproject,
        projects: this.replaceHierarchyLink(child.projects, oldProjectCandidates, newProject),
        subprojects: this.replaceHierarchyLink(child.subprojects, oldSubprojectCandidates, newSubproject)
      }, false);
    }
  }
  replaceHierarchyLink(links, oldCandidates, replacement) {
    return this.uniqueLinks([replacement, ...links.filter((link) => !this.linkMatchesAny(link, oldCandidates))]);
  }
  linkMatchesAny(link, candidates) {
    if (!link) return false;
    return Array.from(this.linkMatchCandidates([link])).some((candidate) => candidates.has(candidate));
  }
  linkMatchCandidates(links) {
    const candidates = /* @__PURE__ */ new Set();
    for (const link of links.map((item) => item.trim()).filter(Boolean)) {
      const target = getWikiLinkTarget(link) || link;
      const normalizedTarget = (0, import_obsidian6.normalizePath)(target).replace(/\.md$/i, "");
      const base = normalizedTarget.split("/").pop() || normalizedTarget;
      candidates.add(link);
      candidates.add(target);
      candidates.add(normalizedTarget);
      candidates.add(base);
      candidates.add(sanitizeFileName(base));
    }
    return candidates;
  }
  getEffectiveFrontmatter(content) {
    const parsed = this.collectLeadingFrontmatter(content);
    return parsed.frontmatters.reduce((merged, frontmatter) => ({ ...merged, ...frontmatter }), {});
  }
  async rewriteCardFrontmatter(file, update) {
    const content = await this.plugin.app.vault.read(file);
    const parsed = this.collectLeadingFrontmatter(content);
    const frontmatter = parsed.frontmatters.reduce((merged, item) => ({ ...merged, ...item }), {});
    update(frontmatter);
    const body = content.slice(parsed.bodyStart).replace(/^\uFEFF?/, "");
    await this.plugin.app.vault.modify(file, `---
${(0, import_obsidian6.stringifyYaml)(frontmatter)}---
${body}`);
  }
  collectLeadingFrontmatter(content) {
    var _a;
    const frontmatters = [];
    let cursor = 0;
    while (cursor < content.length) {
      const remaining = content.slice(cursor).replace(/^\s+/, "");
      const skipped = content.slice(cursor).length - remaining.length;
      const match = remaining.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
      if (!match) break;
      try {
        const parsed = (_a = (0, import_obsidian6.parseYaml)(match[1])) != null ? _a : {};
        if (parsed && typeof parsed === "object") frontmatters.push(parsed);
      } catch (e) {
        break;
      }
      cursor += skipped + match[0].length;
    }
    return { frontmatters, bodyStart: cursor };
  }
  getCommunicationSourceTemplate(values, participants) {
    return `---
kanban_rpm: true
type: communication
communication_type: ${yamlScalar(values.type)}
date: ${yamlScalar(values.date)}
participants: ${yamlArray(participants)}
note: ${yamlScalar(values.note.trim())}
---

# Summary
%% What was discussed in 3-5 bullets. %%

# Decisions
%% Record concrete decisions and why they were made. %%

# Follow-up Actions
%% Keep action items as checkboxes. Link or copy important ones into KanbanRPM cards manually. %%

- [ ] 

# Context
%% Add background, links, email/thread references, or meeting context. %%

# Raw Notes
%% Paste or write raw notes here. %%
`;
  }
  async prependCommunicationLogRow(file, values, participants) {
    const logFile = await this.getCommunicationLogFile(this.communicationYear(values.date));
    const content = await this.plugin.app.vault.read(logFile);
    const type = this.communicationTypeDefinition(values.type);
    const row = `| ${this.escapeTableCell(values.date)} | [[${this.escapeTableCell(file.basename)}]] | ${this.escapeTableCell(participants.join(", "))} | ${this.escapeTableCell(values.note)} |`;
    const next = this.prependCommunicationRow(content, type.label, row);
    await this.plugin.app.vault.modify(logFile, next);
  }
  async getCommunicationLogFile(year) {
    const path = (0, import_obsidian6.normalizePath)(`${this.plugin.communicationsFolder}/Communication Log (${year}).md`);
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian6.TFile) return existing;
    await this.ensureFolder(this.plugin.communicationsFolder);
    return this.plugin.app.vault.create(path, this.getCommunicationLogTemplate(year));
  }
  getCommunicationLogTemplate(year) {
    const sections = COMMUNICATION_TYPES.map((type) => `## ${type.label}

| Date | Source Note | Participants | Note |
| --- | --- | --- | --- |`).join("\n\n");
    return `# Communication Log (${year})

${sections}
`;
  }
  prependCommunicationRow(content, sectionTitle, row) {
    const tableHeader = "| Date | Source Note | Participants | Note |\n| --- | --- | --- | --- |";
    const existing = findHeadingSection(content, sectionTitle);
    if (!existing) return replaceSection(content, sectionTitle, `${tableHeader}
${row}`);
    const body = content.slice(existing.bodyStart, existing.end).trim();
    const normalized = body.includes("| Date | Source Note | Participants | Note |") ? body : `${tableHeader}
${body}`;
    const lines = normalized.split(/\r?\n/);
    const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
    if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
    else lines.unshift(row);
    return `${content.slice(0, existing.bodyStart)}

${lines.join("\n")}
${content.slice(existing.end)}`;
  }
  communicationYear(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 4) : todayIso().slice(0, 4);
  }
  communicationTypeDefinition(id) {
    var _a;
    return (_a = COMMUNICATION_TYPES.find((type) => type.id === id)) != null ? _a : COMMUNICATION_TYPES[0];
  }
  async getCreationFolder(values) {
    const parts = [this.plugin.cardsFolder];
    if (values.type === "subproject" || values.type === "big_action") {
      parts.push(this.folderNameFromLink(values.project));
    }
    if (values.type === "big_action") {
      parts.push(this.folderNameFromLink(values.subproject));
    }
    const folder = (0, import_obsidian6.normalizePath)(parts.filter(Boolean).join("/"));
    await this.ensureFolder(folder);
    return folder;
  }
  async getProjectArchiveFolder(card) {
    const owner = sanitizeFileName(card.projectTitle || getWikiLinkTarget(card.primaryProject) || card.archiveOwnerProject || "Unassigned");
    const folder = (0, import_obsidian6.normalizePath)(`${this.plugin.cardsFolder}/${owner}/archive`);
    await this.ensureFolder(folder);
    return folder;
  }
  async getUnarchiveTargetPath(card, file) {
    var _a;
    if (card.archiveOriginalPath) {
      const originalPath = (0, import_obsidian6.normalizePath)(card.archiveOriginalPath);
      const folder2 = originalPath.split("/").slice(0, -1).join("/");
      const basename = ((_a = originalPath.split("/").pop()) == null ? void 0 : _a.replace(/\.md$/i, "")) || file.basename;
      if (!this.plugin.app.vault.getAbstractFileByPath(originalPath)) return originalPath;
      return this.getAvailablePath(folder2, basename, file.extension);
    }
    const owner = sanitizeFileName(card.archiveOwnerProject || card.projectTitle || getWikiLinkTarget(card.primaryProject) || "Unassigned");
    const folderParts = [this.plugin.cardsFolder, owner];
    if (card.type === "big_action" && card.primarySubproject) {
      folderParts.push(this.folderNameFromLink(card.primarySubproject));
    }
    const folder = (0, import_obsidian6.normalizePath)(folderParts.join("/"));
    await this.ensureFolder(folder);
    return this.getAvailablePath(folder, file.basename, file.extension);
  }
  async getResearchLogFile() {
    const path = this.plugin.researchLogsPath;
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian6.TFile) return existing;
    await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
    return this.plugin.app.vault.create(path, "# Research Logs\n\n### Experiment Log\n\n### Analysis Log\n");
  }
  folderNameFromLink(link) {
    const target = getWikiLinkTarget(link);
    return sanitizeFileName(target.split("/").pop() || target || "Unassigned");
  }
  parseFirstFrontmatter(content) {
    var _a;
    const match = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return {};
    try {
      const parsed = (_a = (0, import_obsidian6.parseYaml)(match[1])) != null ? _a : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }
  fileBaseNameFromPath(path) {
    var _a;
    const fileName = (_a = (0, import_obsidian6.normalizePath)(path).split("/").pop()) != null ? _a : "";
    return fileName.replace(/\.[^/.]+$/, "");
  }
  folderPathFromFilePath(path) {
    return (0, import_obsidian6.normalizePath)(path).split("/").slice(0, -1).join("/");
  }
  pathParts(path) {
    return (0, import_obsidian6.normalizePath)(path).split("/").filter(Boolean);
  }
  async ensureFolder(folder) {
    const normalized = (0, import_obsidian6.normalizePath)(folder);
    if (this.plugin.app.vault.getAbstractFileByPath(normalized)) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.plugin.app.vault.getAbstractFileByPath(current)) {
        await this.plugin.app.vault.createFolder(current);
      }
    }
  }
  uniqueLinks(values) {
    const seen = /* @__PURE__ */ new Set();
    const links = [];
    for (const value of values.map((item) => item.trim()).filter(Boolean)) {
      const key = getWikiLinkTarget(value) || value;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(value);
    }
    return links;
  }
  renderNonEmptyMetadata(values) {
    const rows = [];
    for (const [label, value] of [
      ["priority", values.priority === "3" ? "" : values.priority],
      ["workstream_type", values.workstreamType]
    ]) {
      if (String(value || "").trim()) rows.push(`- ${label}: ${String(value).trim()}`);
    }
    for (const [label, raw] of [
      ["source_notes", values.sourceNotes]
    ]) {
      const list = textareaToList(raw);
      if (list.length) rows.push(`- ${label}: ${list.join(", ")}`);
    }
    return rows.length ? `${rows.join("\n")}

` : "";
  }
  getLivingDocTemplate(values, _title, baseName) {
    const currentFocus = values.nextAction.trim() ? `- ${values.nextAction.trim()}
` : "";
    const seededSmallAction = values.nextAction.trim() ? `- [ ] ${values.nextAction.trim()}
` : "";
    const waiting = values.waitingFor.trim() ? `- ${values.waitingFor.trim()}
` : "";
    const blocker = values.blocker.trim() ? `- ${values.blocker.trim()}
` : "";
    const timelineRows = [
      values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : "",
      values.scheduledDate.trim() ? `- Scheduled date: ${values.scheduledDate.trim()}` : "",
      values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : "",
      values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : ""
    ].filter(Boolean).join("\n");
    const precededBy = textareaToList(values.dependsOn).map((item) => `- ${item}`).join("\n");
    const followedBy = textareaToList(values.blocks).map((item) => `- ${item}`).join("\n");
    const references = textareaToList(values.sourceNotes).map((item) => `- ${item}`).join("\n");
    const typeLabel = values.type === "big_action" ? "Big Action" : values.type === "subproject" ? "Subproject" : "Project";
    const projects = this.uniqueLinks([values.project, ...textareaToList(values.projects)]);
    const subprojects = this.uniqueLinks([values.subproject, ...textareaToList(values.subprojects)]);
    const projectLine = values.project.trim() ? `
primary_project: ${yamlScalar(values.project.trim())}` : "";
    const subprojectLine = values.subproject.trim() ? `
primary_subproject: ${yamlScalar(values.subproject.trim())}` : "";
    const projectsLine = projects.length ? `
projects:${yamlArray(projects)}` : "";
    const subprojectsLine = subprojects.length ? `
subprojects:${yamlArray(subprojects)}` : "";
    const priorityLine = values.priority.trim() && values.priority.trim() !== "3" ? `
priority: ${yamlScalar(values.priority.trim())}` : "";
    const categoryLine = values.workstreamType.trim() ? `
workstream_type: ${yamlScalar(values.workstreamType.trim())}` : "";
    const hierarchyRows = [
      values.project.trim() ? `> project: ${values.project.trim()}` : "",
      values.subproject.trim() ? `> subproject: ${values.subproject.trim()}` : ""
    ].filter(Boolean).join("\n");
    const workingSections = this.getWorkingSections(values.type, seededSmallAction);
    return `---
kanban_rpm: true
type: ${yamlScalar(values.type)}
id: ${yamlScalar(baseName)}
status: ${yamlScalar(values.status)}${projectLine}${subprojectLine}${projectsLine}${subprojectsLine}${priorityLine}${categoryLine}
order: 
---

> [!kanban-rpm]
> type: ${typeLabel}
> status: ${values.status}${hierarchyRows ? `
${hierarchyRows}` : ""}

# PM Control

## Current Focus

${currentFocus}## Waiting

${waiting}## Blockers

${blocker}## Flow

Preceded by:
${precededBy}

Followed by:
${followedBy}

## Timeline

${timelineRows}

## Timeline Log

## Routine

## References

${references}

## PM Metadata

${this.renderNonEmptyMetadata(values)}---

# Working Notes

${workingSections}`;
  }
  getWorkingSections(type, seededSmallAction) {
    const smallActions = type === "big_action" ? `## Small Actions
%% Keep concrete checkbox tasks here; dated tasks can appear in Timeline. %%

${seededSmallAction}` : "";
    return `## Overview
%% Write what this note is responsible for and what success roughly means. %%

## Current Thinking
%% Capture the current interpretation, open questions, assumptions, or strategy. %%

${smallActions}## Work Log
%% Add dated progress notes, meeting outcomes, attempts, observations, and follow-up context. %%

## Decisions
%% Record decisions with enough context to understand why they were made. %%

## Notes
%% Put miscellaneous context, links, rough ideas, and material that does not yet fit elsewhere. %%
`;
  }
  parseLivingDocSections(content) {
    const flow = getSection(content, "Flow");
    const currentFocus = this.firstListItem(getSection(content, "Current Focus"));
    const waitingFor = this.firstListItem(getSection(content, "Waiting"));
    const blocker = this.firstListItem(getSection(content, "Blockers"));
    const timeline = getSection(content, "Timeline");
    const routine = getSection(content, "Routine");
    const routineLog = getSection(content, "Routine Log");
    const references = getSection(content, "References");
    const startDate = this.parseTimelineDate(timeline, "Start date");
    const scheduledDate = this.parseTimelineDate(timeline, "Scheduled date");
    const nextReview = this.parseTimelineDate(timeline, "Next review");
    const dueDate = this.parseTimelineDate(timeline, "Due date");
    const precededBy = this.uniqueLinks(parseDependencyList(flow, "Preceded by"));
    const followedBy = this.uniqueLinks(parseDependencyList(flow, "Followed by"));
    const routines = routine.split(/\r?\n/).map((line, index) => parseRoutineLine(line, index + 1)).filter((item) => Boolean(item)).map((item) => ({ ...item, completedDates: parseRoutineCompletedDates(routineLog, item.text) }));
    const smallActions = parseSmallActions(content);
    const actionCount = smallActions.filter((action) => !action.done).length;
    const sourceNotes = parsePlainList(references).filter((item) => item.includes("[["));
    const researchLogs = [
      ...this.parseResearchLog(content, "experiment"),
      ...this.parseResearchLog(content, "analysis")
    ];
    return { currentFocus, waitingFor, blocker, startDate, scheduledDate, nextReview, dueDate, precededBy, followedBy, sourceNotes, researchLogs, routines, smallActions, actionCount };
  }
  firstListItem(section) {
    var _a, _b;
    const match = section.match(/^\s*[-*]\s+(?:\[[ xX-]\]\s*)?(.+)$/m);
    return (_b = (_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim()) != null ? _b : "";
  }
  updateLivingDocBody(content, title, values) {
    let next = this.removeLegacyTitleHeading(content, title);
    next = replaceSection(next, "Current Focus", values.nextAction.trim() ? `- ${values.nextAction.trim()}
` : "");
    next = replaceSection(next, "Waiting", values.waitingFor.trim() ? `- ${values.waitingFor.trim()}
` : "");
    next = replaceSection(next, "Blockers", values.blocker.trim() ? `- ${values.blocker.trim()}
` : "");
    next = replaceSection(next, "Flow", `Preceded by:
${textareaToList(values.dependsOn).map((item) => `- ${item}`).join("\n")}

Followed by:
${textareaToList(values.blocks).map((item) => `- ${item}`).join("\n")}
`);
    next = replaceSection(
      next,
      "Timeline",
      [
        values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : "",
        values.scheduledDate.trim() ? `- Scheduled date: ${values.scheduledDate.trim()}` : "",
        values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : "",
        values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : ""
      ].filter(Boolean).join("\n")
    );
    next = replaceSection(next, "References", textareaToList(values.sourceNotes).map((item) => `- ${item}`).join("\n"));
    next = replaceSection(next, "PM Metadata", this.renderNonEmptyMetadata(values).trimEnd());
    return next;
  }
  applyCompletionDueDateUpdate(content, card, targetStatus) {
    if (this.isCompletionStatus(card.status) || !this.isCompletionStatus(targetStatus)) return content;
    const doneDate = todayIso();
    const currentDueDate = this.parseTimelineDate(getSection(content, "Timeline"), "Due date");
    if (currentDueDate === doneDate) return content;
    let next = this.upsertTimelineDate(content, "Due date", doneDate);
    next = this.prependTimelineLog(next, "Due date", `${currentDueDate || "(none)"} -> ${doneDate}`, doneDate);
    return next;
  }
  upsertTimelineDate(content, label, value) {
    const timeline = getSection(content, "Timeline");
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^\\s*[-*]\\s+${escaped}:\\s*\\d{4}-\\d{2}-\\d{2}\\s*$`, "im");
    if (pattern.test(timeline)) {
      return replaceSection(content, "Timeline", timeline.replace(pattern, `- ${label}: ${value}`));
    }
    const body = [timeline.trimEnd(), `- ${label}: ${value}`].filter(Boolean).join("\n");
    return replaceSection(content, "Timeline", body);
  }
  removeLegacyTitleHeading(content, title) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return content.replace(new RegExp(`^#\\s+${escaped}\\s*\\r?\\n{1,2}`, "m"), "");
  }
  updateFlowList(content, label, link, action, sourceCard) {
    const flow = getSection(content, "Flow");
    const precededBy = parseDependencyList(flow, "Preceded by");
    const followedBy = parseDependencyList(flow, "Followed by");
    const list = label === "Preceded by" ? precededBy : followedBy;
    const matchesSource = (value) => {
      if (!sourceCard) return value === link;
      const target = getWikiLinkTarget(value) || value.replace(/^\[\[/, "").replace(/\]\]$/, "");
      return value === link || target === sourceCard.file.basename || target === sourceCard.path || target === sourceCard.title;
    };
    let nextList = [...list];
    if (action === "add") {
      if (nextList.some((value) => matchesSource(value))) return content;
      nextList.push(link);
    } else {
      nextList = nextList.filter((value) => !matchesSource(value));
      if (nextList.length === list.length) return content;
    }
    const nextPrecededBy = label === "Preceded by" ? nextList : precededBy;
    const nextFollowedBy = label === "Followed by" ? nextList : followedBy;
    return replaceSection(content, "Flow", `Preceded by:
${nextPrecededBy.map((item) => `- ${item}`).join("\n")}

Followed by:
${nextFollowedBy.map((item) => `- ${item}`).join("\n")}
`);
  }
  prependTimelineLog(content, type, change, date = todayIso()) {
    const tableHeader = "| Date | Type | Change |\n| --- | --- | --- |";
    const row = `| ${this.escapeTableCell(date)} | ${this.escapeTableCell(type)} | ${this.escapeTableCell(change)} |`;
    if (content.includes(row)) return content;
    const existing = findHeadingSection(content, "Timeline Log");
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes("| Date | Type | Change |") ? body : body ? `${tableHeader}

${body}` : tableHeader;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---\s*\|\s*---\s*\|\s*---\s*\|/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return replaceSection(content, "Timeline Log", lines.join("\n"));
    }
    const timeline = findHeadingSection(content, "Timeline");
    const section = `### Timeline Log

${tableHeader}
${row}
`;
    if (timeline) return `${content.slice(0, timeline.end).trimEnd()}

${section}${content.slice(timeline.end)}`;
    return `${content.trimEnd()}

${section}`;
  }
  async logCardCompletionSideEffects(card, targetStatus, completedTitle, cards) {
    if (this.isCompletionStatus(card.status) || !this.isCompletionStatus(targetStatus)) return;
    const type = this.cardTypeLogLabel(card.type);
    const change = `${this.statusLabel(card.status)} -> ${this.statusLabel(targetStatus)}`;
    await this.appendDailyCompletedLog(type, `[[${completedTitle}]]`, change);
    await this.appendParentCompletionLog(card, completedTitle, cards);
  }
  async appendParentCompletionLog(card, completedTitle, cards) {
    const allCards = cards != null ? cards : await this.loadCards();
    const parent = this.findImmediateParentCard(card, allCards);
    if (!parent) return;
    const file = this.plugin.app.vault.getAbstractFileByPath(parent.path);
    if (!(file instanceof import_obsidian6.TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const type = this.cardTypeLogLabel(card.type);
    const next = this.prependTimelineLog(content, type, `Completed [[${completedTitle}]]`);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
  }
  findImmediateParentCard(card, cards) {
    var _a;
    if (card.type === "subproject") {
      const projectTitle = card.projectTitle || card.primaryProject || card.project || card.projects[0] || "";
      return cards.find((candidate) => candidate.type === "project" && candidate.title === projectTitle);
    }
    if (card.type === "big_action") {
      const subprojectTitle = card.subprojectTitle || card.primarySubproject || card.subproject || card.subprojects[0] || "";
      const projectTitle = card.projectTitle || card.primaryProject || card.project || card.projects[0] || "";
      return (_a = cards.find((candidate) => {
        if (candidate.type !== "subproject" || candidate.title !== subprojectTitle) return false;
        if (!projectTitle) return true;
        return candidate.projectTitles.includes(projectTitle) || candidate.primaryProject === projectTitle || candidate.project === projectTitle;
      })) != null ? _a : cards.find((candidate) => candidate.type === "subproject" && candidate.title === subprojectTitle);
    }
    return void 0;
  }
  cardTypeLogLabel(type) {
    if (type === "big_action") return "big action";
    return type;
  }
  async appendDailyCompletedLog(type, item, change, date = todayIso()) {
    const file = await this.ensureDailyTimelineFile(date);
    if (!file) return;
    const content = await this.plugin.app.vault.read(file);
    const next = this.prependDailyCompletedLog(content, type, item, change);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
  }
  async ensureDailyTimelineFile(date) {
    await this.plugin.ensureWorkspace();
    const folder = (0, import_obsidian6.normalizePath)(`${this.plugin.workspaceFolder}/timeline`);
    if (!this.plugin.app.vault.getAbstractFileByPath(folder)) await this.plugin.app.vault.createFolder(folder);
    const path = (0, import_obsidian6.normalizePath)(`${folder}/${date}.md`);
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian6.TFile) return existing;
    return this.plugin.app.vault.create(path, `# ${date} Timeline Memo

## Memo

## Completed Log

## Notes
`);
  }
  prependDailyCompletedLog(content, type, item, change) {
    const tableHeader = "| Time | Type | Item | Change |\n| --- | --- | --- | --- |";
    const row = `| ${this.currentClockTime()} | ${this.escapeTableCell(type)} | ${this.escapeTableCell(item)} | ${this.escapeTableCell(change)} |`;
    if (content.includes(row)) return content;
    const existing = findHeadingSection(content, "Completed Log");
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes("| Time | Type | Item | Change |") ? body : body ? `${tableHeader}
${body}` : tableHeader;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---\s*\|\s*---\s*\|\s*---\s*\|\s*---\s*\|/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return replaceSection(content, "Completed Log", lines.join("\n"));
    }
    const memo = findHeadingSection(content, "Memo");
    const section = `## Completed Log

${tableHeader}
${row}
`;
    if (memo) return `${content.slice(0, memo.end).trimEnd()}

${section}${content.slice(memo.end)}`;
    return `${content.trimEnd()}

${section}`;
  }
  currentClockTime() {
    const now = /* @__PURE__ */ new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  prependRoutineLog(content, entry) {
    const tableHeader = "| Date | Routine |\n| --- | --- |";
    const row = entry;
    if (content.includes(row)) return content;
    const routineLog = findHeadingSection(content, "Routine Log");
    const existing = routineLog;
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes("| Date | Routine |") ? body : `${tableHeader}
${body}`;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return replaceSection(content, "Routine Log", lines.join("\n"));
    }
    const routine = findHeadingSection(content, "Routine");
    const section = `### Routine Log

${tableHeader}
${row}
`;
    if (routine) return `${content.slice(0, routine.end).trimEnd()}

${section}${content.slice(routine.end)}`;
    return `${content.trimEnd()}

${section}`;
  }
  prependResearchLog(content, values) {
    const sectionTitle = values.kind === "experiment" ? "Experiment Log" : "Analysis Log";
    const tableHeader = values.kind === "experiment" ? "| Date | Sample | Conditions | Result | Link |\n| --- | --- | --- | --- | --- |" : "| Date | Dataset / Sample | Method | Result | Link |\n| --- | --- | --- | --- | --- |";
    const row = `| ${this.escapeTableCell(values.date)} | ${this.escapeTableCell(values.subject)} | ${this.escapeTableCell(values.conditionsOrMethod)} | ${this.escapeTableCell(values.result)} | ${this.escapeTableCell(values.link)} |`;
    if (content.includes(row)) return content;
    const module2 = values.module.trim() || (values.kind === "experiment" ? "General Experiment" : "General Analysis");
    let next = content;
    if (!findHeadingSection(next, sectionTitle)) {
      next = `${next.trimEnd()}

### ${sectionTitle}

#### ${module2}

${tableHeader}
${row}
`;
      return next;
    }
    const moduleSection = findNestedHeadingSection(next, sectionTitle, module2);
    if (!moduleSection) {
      const parent = findHeadingSection(next, sectionTitle);
      if (!parent) return next;
      const addition = `

#### ${module2}

${tableHeader}
${row}
`;
      return `${next.slice(0, parent.end).trimEnd()}${addition}${next.slice(parent.end)}`;
    }
    const body = next.slice(moduleSection.bodyStart, moduleSection.end).trim();
    const normalized = body.includes("| Date |") ? body : `${tableHeader}
${body}`;
    const lines = normalized.split(/\r?\n/);
    const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
    if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
    else lines.unshift(row);
    return `${next.slice(0, moduleSection.bodyStart)}${lines.join("\n")}
${next.slice(moduleSection.end)}`;
  }
  escapeTableCell(value) {
    return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
  }
  smallActionTimelineLog(action, file) {
    const heading = action.heading && action.heading !== "Timeline Log" ? ` (${action.heading})` : "";
    return `Completed [[${file.basename}]] - ${action.text}${heading}`;
  }
  parseTimelineDate(section, label) {
    var _a;
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = section.match(new RegExp(`${escaped}:\\s*(\\d{4}-\\d{2}-\\d{2})`, "i"));
    return (_a = match == null ? void 0 : match[1]) != null ? _a : "";
  }
  parseResearchLog(content, kind) {
    const sectionTitle = kind === "experiment" ? "Experiment Log" : "Analysis Log";
    const section = findHeadingSection(content, sectionTitle);
    if (!section) return [];
    const body = content.slice(section.bodyStart, section.end);
    const entries = [];
    let module2 = "";
    body.split(/\r?\n/).forEach((line, index) => {
      var _a, _b, _c, _d, _e;
      const heading = line.match(/^#{4,6}\s+(.+)$/);
      if (heading == null ? void 0 : heading[1]) {
        module2 = heading[1].trim();
        return;
      }
      const cells = parseMarkdownTableRow(line);
      if (!cells || cells[0].toLowerCase() === "date" || cells.every((cell) => /^-+$/.test(cell))) return;
      entries.push({
        cardPath: "",
        cardTitle: "",
        kind,
        module: module2,
        date: (_a = cells[0]) != null ? _a : "",
        subject: (_b = cells[1]) != null ? _b : "",
        conditionsOrMethod: (_c = cells[2]) != null ? _c : "",
        result: (_d = cells[3]) != null ? _d : "",
        link: (_e = cells[4]) != null ? _e : "",
        lineNumber: index + 1
      });
    });
    return entries;
  }
  parseResearchLogModules(content, kind) {
    const sectionTitle = kind === "experiment" ? "Experiment Log" : "Analysis Log";
    const section = findHeadingSection(content, sectionTitle);
    if (!section) return [];
    const body = content.slice(section.bodyStart, section.end);
    const modules = [];
    for (const line of body.split(/\r?\n/)) {
      const heading = line.match(/^#{4,6}\s+(.+)$/);
      if (heading == null ? void 0 : heading[1]) modules.push(heading[1].trim());
    }
    return this.uniqueLinks(modules).sort((a, b) => a.localeCompare(b));
  }
  normalizeCardType(value) {
    if (value === "subproject" || value === "big_action" || value === "project") return value;
    return "project";
  }
  applyHierarchy(cards) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    for (const card of cards) {
      const projectFile = card.primaryProject ? this.resolveLinkedFile(card.primaryProject, card.path) : null;
      const subprojectFile = card.primarySubproject ? this.resolveLinkedFile(card.primarySubproject, card.path) : null;
      const projectCard = projectFile ? cards.find((item) => item.path === projectFile.path || item.file.basename === projectFile.basename) : void 0;
      const subprojectCard = subprojectFile ? cards.find((item) => item.path === subprojectFile.path || item.file.basename === subprojectFile.basename) : void 0;
      const projectTitles = this.resolveHierarchyTitles(card.projects, card.path, cards);
      const subprojectTitles = this.resolveHierarchyTitles(card.subprojects, card.path, cards);
      if (card.type === "project") {
        card.projectTitle = card.title;
        card.projectTitles = [card.title];
        card.subprojectTitle = "";
        card.subprojectTitles = [];
      } else if (card.type === "subproject") {
        card.projectTitle = ((_b = (_a = projectCard == null ? void 0 : projectCard.title) != null ? _a : projectFile == null ? void 0 : projectFile.basename) != null ? _b : text(card.project)) || "No project";
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle];
        card.subprojectTitle = card.title;
        card.subprojectTitles = [card.title];
      } else if (card.type === "big_action") {
        card.projectTitle = ((_e = (_d = (_c = projectCard == null ? void 0 : projectCard.title) != null ? _c : projectFile == null ? void 0 : projectFile.basename) != null ? _d : subprojectCard == null ? void 0 : subprojectCard.projectTitle) != null ? _e : text(card.project)) || "No project";
        card.subprojectTitle = (_g = (_f = subprojectCard == null ? void 0 : subprojectCard.title) != null ? _f : subprojectFile == null ? void 0 : subprojectFile.basename) != null ? _g : text(card.subproject);
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle].filter(Boolean);
        card.subprojectTitles = subprojectTitles.length ? subprojectTitles : [card.subprojectTitle].filter(Boolean);
      } else {
        card.projectTitle = ((_h = projectCard == null ? void 0 : projectCard.title) != null ? _h : text(card.project)) || card.title;
        card.subprojectTitle = (_i = subprojectCard == null ? void 0 : subprojectCard.title) != null ? _i : text(card.subproject);
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle].filter(Boolean);
        card.subprojectTitles = subprojectTitles.length ? subprojectTitles : [card.subprojectTitle].filter(Boolean);
      }
      card.breadcrumb = [card.projectTitle, card.subprojectTitle && card.subprojectTitle !== card.title ? card.subprojectTitle : ""].filter(Boolean).join(" > ");
      card.colorKey = card.projectTitle || card.title;
    }
  }
  resolveHierarchyTitles(links, sourcePath, cards) {
    var _a, _b, _c;
    const titles = [];
    for (const link of links) {
      const file = this.resolveLinkedFile(link, sourcePath);
      const card = file ? cards.find((item) => item.path === file.path || item.file.basename === file.basename) : void 0;
      titles.push((_c = (_b = (_a = card == null ? void 0 : card.title) != null ? _a : file == null ? void 0 : file.basename) != null ? _b : getWikiLinkTarget(link)) != null ? _c : link);
    }
    return this.uniqueLinks(titles);
  }
  applyBlockedBy(cards) {
    for (const card of cards) card.blockedBy = [];
    for (const card of cards) {
      for (const dependency of card.precededBy) {
        const dependencyFile = this.resolveLinkedFile(dependency, card.path);
        const dependencyCard = dependencyFile ? cards.find((item) => item.path === dependencyFile.path) : void 0;
        if (dependencyCard && !this.isCompletionStatus(dependencyCard.status)) card.blockedBy.push(dependencyCard.title);
      }
      for (const blocked of card.followedBy) {
        const blockedFile = this.resolveLinkedFile(blocked, card.path);
        const blockedCard = blockedFile ? cards.find((item) => item.path === blockedFile.path) : void 0;
        if (blockedCard && !this.isCompletionStatus(card.status)) blockedCard.blockedBy.push(card.title);
      }
    }
  }
  isCompletionStatus(statusId) {
    var _a, _b;
    const status = this.plugin.settings.statuses.find((item) => item.id === statusId);
    const value = `${(_a = status == null ? void 0 : status.id) != null ? _a : statusId} ${(_b = status == null ? void 0 : status.label) != null ? _b : ""}`.toLowerCase();
    return /\b(done|complete|completed)\b/.test(value) || value.includes("?\u8881\u2465\u2537");
  }
  hasCircularDependency(card, cards) {
    const visited = /* @__PURE__ */ new Set();
    const visit = (current) => {
      if (visited.has(current.path)) return false;
      visited.add(current.path);
      for (const dependency of current.precededBy) {
        const dependencyFile = this.resolveLinkedFile(dependency, current.path);
        const dependencyCard = dependencyFile ? cards.find((item) => item.path === dependencyFile.path) : void 0;
        if (!dependencyCard) continue;
        if (dependencyCard.path === card.path || visit(dependencyCard)) return true;
      }
      return false;
    };
    return visit(card);
  }
};

// src-kanbanrpm/schema.ts
function getSchemaReferenceContent() {
  return `# KanbanRPM Card Schema

This note is a local reference for KanbanRPM card frontmatter. It is created by the plugin and can be regenerated manually from the plugin source/docs if needed.

## Required Identity

\`\`\`yaml
kanban_rpm: true
type: big_action
id: example-workstream
status: active
project_state: active
primary_project: "[[TTT]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT]]"
subprojects:
  - "[[TTT Experiment]]"
\`\`\`

New living documents keep frontmatter intentionally short. The plugin treats \`Title\`, \`Type\`, and \`Status\` as required in the create/edit modal. \`Project\` is required for Subproject and Big Action documents. \`Subproject\` is also required for Big Action documents.

## Execution Fields

\`\`\`yaml
status: inbox
project_state: active
primary_project:
primary_subproject:
projects: []
subprojects: []
order:
\`\`\`

Default \`status\` values:

\`\`\`text
${DEFAULT_STATUSES.map((status) => status.id).join(" | ")}
\`\`\`

The active status set is global and editable in KanbanRPM settings. Every Board/Table/Timeline/Gantt surface should read the same status set.

\`project_state\` is mainly used on Project documents. \`active\` is the default. \`closed\` hides the Project and cards that only belong to that closed Project from default KanbanRPM views. Use \`Show closed projects\` to inspect or reopen them. Closing a Project does not change child card statuses.

\`order\` is managed by drag/reorder and \`Normalize order\`. It should be numeric.

\`projects\` and \`subprojects\` are multi-link hierarchy arrays. \`primary_project\` and \`primary_subproject\` define the default breadcrumb and future hierarchy folder placement. Legacy \`project\` and \`subproject\` fields are read as fallback only.

Optional planning fields stay in the document body under \`# PM Control\` subsections such as \`## Current Focus\`, \`## Flow\`, \`## Timeline\`, and \`## PM Metadata\`.

## Body-Backed Planning Fields

\`\`\`yaml
workstream_type:
\`\`\`

KanbanRPM shows \`workstream_type\` as \`Category\` in the UI. Use it as the single broad project/workstream classification field. The stored value is the Category id; the displayed text is the Category label. The active Category set is editable in plugin settings with one \`id | Label\` definition per line.

Rich planning data belongs in the document body:

- \`## Current Focus\` for the next visible action.
- \`## Waiting\` for people or responses you are waiting on.
- \`## Blockers\` for concrete blockers.
- \`## Flow\` for \`Preceded by\` and \`Followed by\` wikilinks.
- \`## Timeline\` for \`Start date\`, \`Scheduled date\`, \`Next review\`, and \`Due date\`.
- \`## Routine\` for recurring review/checkup routines.
- \`## References\` for source notes that feed the Action index.

\`# PM Control\` is the plugin-readable area. \`# Working Notes\` is the human writing area. The Obsidian note title/file name is the card title, so new documents do not include a duplicate H1 title in the body.

New Working Notes use a common Research PM spine: \`Overview\`, \`Current Thinking\`, \`Work Log\`, \`Decisions\`, and \`Notes\`. \`Big Action\` documents additionally include \`Small Actions\`. Template guidance is written as Obsidian comments using \`%% ... %%\`.

## Small Actions

Small actions are checkbox tasks inside the living document. KanbanRPM reads ASCII metadata and also tolerates the common Tasks emoji date subset:

\`\`\`markdown
- [ ] Email vendor @scheduled 2026-05-10 @due 2026-05-15 @priority high
- [x] Submit quote request \u2705 2026-05-07
\`\`\`

Supported metadata:

- scheduled date: \`@scheduled YYYY-MM-DD\`
- due date: \`@due YYYY-MM-DD\`
- done date: \`\u2705 YYYY-MM-DD\` or \`@done YYYY-MM-DD\`
- priority: \`@priority highest|high|normal|low|lowest\`

Small-action card display is controlled from plugin settings. The default is due/scheduled actions through one week, including overdue actions. Expanded card rows group small actions by their source heading.

Checking a small action from a card updates the original Markdown line to \`[x]\` and appends today''s \`\u2705 YYYY-MM-DD\`. Unchecking returns it to \`[ ]\` and removes the done date.

Default \`Category\` values:

\`\`\`text
${WORKSTREAM_TYPES.map((category) => `${category.id} | ${category.label}`).join("\n")}
\`\`\`

## Lane Customization Decision

KanbanRPM uses a global customizable status set. The default is:

\`\`\`text
${DEFAULT_STATUSES.map((status) => status.label).join(" -> ")}
\`\`\`

Edit statuses from plugin settings using one line per status:

\`\`\`text
id | Label
\`\`\`

Edit categories from plugin settings using the same format:

\`\`\`text
id | Label
\`\`\`

Changing the status set does not rewrite existing cards. Unknown status values are shown as data warnings and fall back to the first configured status for display.

## Validation

The board shows \`Data warnings\` for:

- invalid or missing \`status\`
- invalid \`priority\`
- unknown \`workstream_type\` / \`Category\`
- non-numeric \`order\`
- broken wikilinks in \`## References\` or \`## Flow\`

KanbanRPM tries to display imperfect cards rather than hiding them. Invalid \`status\` falls back to \`Inbox\` for display.
`;
}

// src-kanbanrpm/settings-tab.ts
var import_obsidian8 = require("obsidian");
var serializeCategoryIds = (categories) => categories.join("\n");
var KanbanRPMSettingTab = class extends import_obsidian8.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("kanban-rpm-settings");
    containerEl.createEl("h2", { text: "KanbanRPM settings" });
    containerEl.createDiv({
      cls: "kanban-rpm-settings-intro",
      text: "Configure the workspace, project taxonomy, research capture, card display, and small-action filters used by KanbanRPM."
    });
    const workspace = this.createSection(containerEl, "Workspace", "Where KanbanRPM stores living documents and generated support files.");
    new import_obsidian8.Setting(workspace).setName("Workspace folder").setDesc("Folder that stores KanbanRPM cards, timeline memo files, routines, attachments, archive folders, and generated reports.").addText((input) => {
      input.setPlaceholder(DEFAULT_SETTINGS.workspaceFolder).setValue(this.plugin.settings.workspaceFolder).onChange(async (value) => {
        this.plugin.settings.workspaceFolder = value.trim() || DEFAULT_SETTINGS.workspaceFolder;
        await this.plugin.saveSettings();
      });
    });
    const taxonomy = this.createSection(containerEl, "Taxonomy", "Edit the controlled vocabularies used across Board, Table, Timeline, Gantt, filters, and validation.");
    taxonomy.createDiv({
      cls: "kanban-rpm-setting-note",
      text: 'Status and Category format is "id | Label". Existing category ids remain stored in card frontmatter.'
    });
    new import_obsidian8.Setting(taxonomy).setName("Global status set").setDesc("One status per line. Format: id | Label. Used by Board, Table, Timeline, and Gantt.").addTextArea((input) => {
      input.setPlaceholder(serializeStatuses(DEFAULT_SETTINGS.statuses)).setValue(serializeStatuses(this.plugin.settings.statuses)).onChange(async (value) => {
        const statuses = parseStatuses(value);
        this.plugin.settings.statuses = statuses.length ? statuses : DEFAULT_SETTINGS.statuses;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      });
      input.inputEl.rows = 8;
    });
    new import_obsidian8.Setting(taxonomy).setName("Category set").setDesc("One category per line. Format: id | Label. Used by card create/edit, filters, board display, and validation.").addTextArea((input) => {
      input.setPlaceholder(serializeCategories(DEFAULT_SETTINGS.categories)).setValue(serializeCategories(this.plugin.settings.categories)).onChange(async (value) => {
        const categories = parseCategories(value);
        this.plugin.settings.categories = categories.length ? categories : DEFAULT_SETTINGS.categories;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      });
      input.inputEl.rows = 8;
    });
    const research = this.createSection(containerEl, "Research Logs And Reminders", "Control assisted Experiment/Analysis Log capture and Next review reminders.");
    new import_obsidian8.Setting(research).setName("Experiment log categories").setDesc("Categories that trigger an Experiment Log prompt when a Big Action moves to a completion status.").addTextArea((input) => {
      input.setPlaceholder(serializeCategoryIds(DEFAULT_SETTINGS.experimentLogCategories)).setValue(serializeCategoryIds(this.plugin.settings.experimentLogCategories)).onChange(async (value) => {
        const categories = parseCategories(value);
        this.plugin.settings.experimentLogCategories = categories.length ? categoryIds(categories) : DEFAULT_SETTINGS.experimentLogCategories;
        await this.plugin.saveSettings();
      });
      input.inputEl.rows = 3;
    });
    new import_obsidian8.Setting(research).setName("Analysis log categories").setDesc("Categories that trigger an Analysis Log prompt when a Big Action moves to a completion status.").addTextArea((input) => {
      input.setPlaceholder(serializeCategoryIds(DEFAULT_SETTINGS.analysisLogCategories)).setValue(serializeCategoryIds(this.plugin.settings.analysisLogCategories)).onChange(async (value) => {
        const categories = parseCategories(value);
        this.plugin.settings.analysisLogCategories = categories.length ? categoryIds(categories) : DEFAULT_SETTINGS.analysisLogCategories;
        await this.plugin.saveSettings();
      });
      input.inputEl.rows = 3;
    });
    new import_obsidian8.Setting(research).setName("Prompt for log when moving matching Big Action to Done").setDesc("When enabled, KanbanRPM asks for an Experiment/Analysis Log row after a matching Big Action moves to a completion status.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.promptForLogOnDone).onChange(async (value) => {
        this.plugin.settings.promptForLogOnDone = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian8.Setting(research).setName("Next review reminder status").setDesc("When Next review is today or overdue, Refresh moves non-complete cards to this status.").addDropdown((dropdown) => {
      for (const status of this.plugin.settings.statuses) dropdown.addOption(status.id, status.label);
      dropdown.setValue(this.plugin.settings.reviewReminderStatus).onChange(async (value) => {
        this.plugin.settings.reviewReminderStatus = value || DEFAULT_SETTINGS.reviewReminderStatus;
        await this.plugin.saveSettings();
      });
    });
    const display = this.createSection(containerEl, "Card Display", "Choose which fields appear on compact cards in the Board and Timeline surfaces.");
    display.createDiv({
      cls: "kanban-rpm-setting-note",
      text: "Choose which frontmatter and body-section fields appear on board cards."
    });
    new import_obsidian8.Setting(display).setName("Open Advanced metadata by default in new card modal").setDesc("When enabled, the Advanced metadata section starts expanded while creating a new living document.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.newCardAdvancedOpen).onChange(async (value) => {
        this.plugin.settings.newCardAdvancedOpen = value;
        await this.plugin.saveSettings();
      });
    });
    const displayGrid = display.createDiv({ cls: "kanban-rpm-settings-toggle-grid" });
    for (const [key, label] of [
      ["breadcrumb", "Project breadcrumb"],
      ["type", "Type"],
      ["status", "Status"],
      ["priority", "Priority"],
      ["category", "Category"],
      ["currentFocus", "Current Focus"],
      ["waiting", "Waiting"],
      ["blockers", "Blockers"],
      ["dates", "Due / review dates"],
      ["dependencies", "Flow"],
      ["sources", "Source note count"],
      ["smallActionSummary", "Small action summary"]
    ]) {
      new import_obsidian8.Setting(displayGrid).setName(label).addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.cardDisplayFields[key]).onChange(async (value) => {
          this.plugin.settings.cardDisplayFields[key] = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshViews();
        });
      });
    }
    const smallActions = this.createSection(containerEl, "Small Actions", "Decide which checkbox tasks are summarized inside cards.");
    new import_obsidian8.Setting(smallActions).setName("Small actions collapsed by default").setDesc("When enabled, cards show a collapsed small-action row that can be expanded with the arrow.").addToggle((toggle) => {
      toggle.setValue(this.plugin.settings.smallActionDisplay.collapsedByDefault).onChange(async (value) => {
        this.plugin.settings.smallActionDisplay.collapsedByDefault = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      });
    });
    new import_obsidian8.Setting(smallActions).setName("Small action source").setDesc("Choose which checkbox actions can appear inside board cards.").addDropdown((dropdown) => {
      dropdown.addOption("dated", "Due or scheduled only").addOption("done", "Done only").addOption("all", "All small actions").setValue(this.plugin.settings.smallActionDisplay.sourceFilter).onChange(async (value) => {
        this.plugin.settings.smallActionDisplay.sourceFilter = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      });
    });
    new import_obsidian8.Setting(smallActions).setName("Small action date window").setDesc("Relative windows include today and overdue actions. Default is one week.").addDropdown((dropdown) => {
      dropdown.addOption("all", "Any date").addOption("overdue", "Overdue only").addOption("today", "Today only").addOption("tomorrow", "Through tomorrow").addOption("week", "Through one week").addOption("month", "Through one month").setValue(this.plugin.settings.smallActionDisplay.dateWindow).onChange(async (value) => {
        this.plugin.settings.smallActionDisplay.dateWindow = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      });
    });
  }
  createSection(container, title, description) {
    const section = container.createEl("details", { cls: "kanban-rpm-settings-section" });
    section.open = true;
    const summary = section.createEl("summary", { cls: "kanban-rpm-settings-section-summary" });
    summary.createSpan({ cls: "kanban-rpm-settings-section-title", text: title });
    summary.createSpan({ cls: "kanban-rpm-settings-section-desc", text: description });
    return section.createDiv({ cls: "kanban-rpm-settings-section-body" });
  }
};

// src-kanbanrpm/main.ts
var KanbanRPMPlugin = class extends import_obsidian9.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    this.settings = this.normalizeSettings(await this.loadData());
    this.repository = new CardRepository(this);
    this.registerView(VIEW_TYPE, (leaf) => new KanbanRPMView(leaf, this));
    this.registerCardRefreshEvents();
    this.addRibbonIcon("layout-dashboard", "Open KanbanRPM board", () => {
      void this.openBoard();
    });
    this.addCommand({
      id: "open-board",
      name: "Open board",
      callback: () => void this.openBoard()
    });
    this.addCommand({
      id: "new-project-card",
      name: "New document",
      callback: () => new NewProjectCardModal(this.app, this).open()
    });
    this.addCommand({
      id: "new-communication-source-note",
      name: "New communication source note",
      callback: () => new NewCommunicationSourceModal(this.app, this).open()
    });
    this.addCommand({
      id: "normalize-rpm-order",
      name: "Normalize card order",
      callback: () => void this.normalizeCardOrder()
    });
    this.addCommand({
      id: "open-schema-reference",
      name: "Open schema reference",
      callback: () => void this.openSchemaReference()
    });
    this.addCommand({
      id: "write-management-brief",
      name: "Write management brief",
      callback: () => void this.writeManagementBrief()
    });
    this.addCommand({
      id: "generate-llm-context",
      name: "Generate LLM context",
      callback: () => void this.writeLLMContext()
    });
    this.addSettingTab(new KanbanRPMSettingTab(this.app, this));
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  normalizeSettings(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
    const saved = data != null ? data : {};
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      statuses: ((_a = saved.statuses) == null ? void 0 : _a.length) ? saved.statuses : DEFAULT_SETTINGS.statuses,
      categories: normalizeCategoryDefinitions(saved.categories).length ? normalizeCategoryDefinitions(saved.categories) : DEFAULT_SETTINGS.categories,
      experimentLogCategories: ((_b = saved.experimentLogCategories) == null ? void 0 : _b.length) ? saved.experimentLogCategories : DEFAULT_SETTINGS.experimentLogCategories,
      analysisLogCategories: ((_c = saved.analysisLogCategories) == null ? void 0 : _c.length) ? saved.analysisLogCategories : DEFAULT_SETTINGS.analysisLogCategories,
      promptForLogOnDone: (_d = saved.promptForLogOnDone) != null ? _d : DEFAULT_SETTINGS.promptForLogOnDone,
      reviewReminderStatus: saved.reviewReminderStatus || DEFAULT_SETTINGS.reviewReminderStatus,
      boardStatusFilter: ((_e = saved.boardStatusFilter) == null ? void 0 : _e.length) ? saved.boardStatusFilter : DEFAULT_SETTINGS.boardStatusFilter,
      boardStatusOrder: ((_f = saved.boardStatusOrder) == null ? void 0 : _f.length) ? saved.boardStatusOrder : DEFAULT_SETTINGS.boardStatusOrder,
      boardProjectFilter: (_g = saved.boardProjectFilter) != null ? _g : DEFAULT_SETTINGS.boardProjectFilter,
      boardSubprojectFilter: (_h = saved.boardSubprojectFilter) != null ? _h : DEFAULT_SETTINGS.boardSubprojectFilter,
      boardCategoryFilter: (_i = saved.boardCategoryFilter) != null ? _i : DEFAULT_SETTINGS.boardCategoryFilter,
      viewFilters: this.normalizeViewFilters(saved),
      showBoardConnectors: (_j = saved.showBoardConnectors) != null ? _j : DEFAULT_SETTINGS.showBoardConnectors,
      showBoardSubprojects: (_k = saved.showBoardSubprojects) != null ? _k : DEFAULT_SETTINGS.showBoardSubprojects,
      showBoardBigActions: (_l = saved.showBoardBigActions) != null ? _l : DEFAULT_SETTINGS.showBoardBigActions,
      showGanttSubprojects: (_m = saved.showGanttSubprojects) != null ? _m : DEFAULT_SETTINGS.showGanttSubprojects,
      showGanttBigActions: (_n = saved.showGanttBigActions) != null ? _n : DEFAULT_SETTINGS.showGanttBigActions,
      boardZoom: this.normalizeZoom(saved.boardZoom, DEFAULT_SETTINGS.boardZoom),
      timelineZoom: this.normalizeZoom(saved.timelineZoom, DEFAULT_SETTINGS.timelineZoom),
      timelineScrollLeft: this.normalizeScrollPosition(saved.timelineScrollLeft),
      timelineScrollTop: this.normalizeScrollPosition(saved.timelineScrollTop),
      ganttZoom: this.normalizeZoom(saved.ganttZoom, DEFAULT_SETTINGS.ganttZoom),
      newCardAdvancedOpen: (_o = saved.newCardAdvancedOpen) != null ? _o : DEFAULT_SETTINGS.newCardAdvancedOpen,
      timelineStatusFilter: ((_p = saved.timelineStatusFilter) == null ? void 0 : _p.length) ? saved.timelineStatusFilter : DEFAULT_SETTINGS.timelineStatusFilter,
      cardDisplayFields: {
        ...DEFAULT_SETTINGS.cardDisplayFields,
        ...(_q = saved.cardDisplayFields) != null ? _q : {}
      },
      smallActionDisplay: {
        ...DEFAULT_SETTINGS.smallActionDisplay,
        ...(_r = saved.smallActionDisplay) != null ? _r : {}
      }
    };
  }
  normalizeZoom(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? Math.min(1.4, Math.max(0.7, value)) : fallback;
  }
  normalizeScrollPosition(value) {
    return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
  }
  normalizeViewFilters(saved) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const next = {
      board: { ...DEFAULT_SETTINGS.viewFilters.board },
      table: { ...DEFAULT_SETTINGS.viewFilters.table },
      timeline: { ...DEFAULT_SETTINGS.viewFilters.timeline },
      gantt: { ...DEFAULT_SETTINGS.viewFilters.gantt },
      archive: { ...DEFAULT_SETTINGS.viewFilters.archive }
    };
    const savedFilters = (_a = saved.viewFilters) != null ? _a : {};
    for (const mode of Object.keys(next)) {
      next[mode] = {
        project: (_c = (_b = savedFilters[mode]) == null ? void 0 : _b.project) != null ? _c : "",
        subproject: (_e = (_d = savedFilters[mode]) == null ? void 0 : _d.subproject) != null ? _e : "",
        category: (_g = (_f = savedFilters[mode]) == null ? void 0 : _f.category) != null ? _g : ""
      };
    }
    if (!saved.viewFilters) {
      next.board = {
        project: (_h = saved.boardProjectFilter) != null ? _h : "",
        subproject: (_i = saved.boardSubprojectFilter) != null ? _i : "",
        category: (_j = saved.boardCategoryFilter) != null ? _j : ""
      };
    }
    return next;
  }
  registerCardRefreshEvents() {
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (this.isCardFile(file)) void this.refreshViews();
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (this.isCardFile(file)) void this.refreshViews();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (this.isCardPath(file.path)) void this.refreshViews();
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof import_obsidian9.TFile && file.extension === "md" && (this.isCardPath(file.path) || this.isCardPath(oldPath))) {
          void (async () => {
            await this.repository.syncHierarchyFolderRename(file, oldPath);
            await this.refreshViews();
          })();
          return;
        }
        if (this.isCardPath(file.path) || this.isCardPath(oldPath)) void this.refreshViews();
      })
    );
  }
  get workspaceFolder() {
    return (0, import_obsidian9.normalizePath)(this.settings.workspaceFolder || DEFAULT_SETTINGS.workspaceFolder);
  }
  get cardsFolder() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/cards`);
  }
  get archiveFolder() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/archive`);
  }
  get routinesFolder() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/routines`);
  }
  get schemaReferencePath() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/KanbanRPM Card Schema.md`);
  }
  get managementBriefPath() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/KanbanRPM Management Brief.md`);
  }
  get llmFolder() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/LLM`);
  }
  get llmProjectBriefsFolder() {
    return (0, import_obsidian9.normalizePath)(`${this.llmFolder}/Project Briefs`);
  }
  get researchLogsPath() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/Research Logs.md`);
  }
  get communicationsFolder() {
    return (0, import_obsidian9.normalizePath)(`${this.workspaceFolder}/communications`);
  }
  isCardPath(path) {
    return (0, import_obsidian9.normalizePath)(path).startsWith(`${this.cardsFolder}/`);
  }
  isCardFile(file) {
    return file instanceof import_obsidian9.TFile && this.isCardPath(file.path) && file.extension === "md";
  }
  async ensureWorkspace() {
    const folders = [
      this.workspaceFolder,
      this.cardsFolder,
      this.routinesFolder,
      `${this.workspaceFolder}/timeline`,
      `${this.workspaceFolder}/attachments`
    ].map(import_obsidian9.normalizePath);
    for (const folder of folders) {
      if (!this.app.vault.getAbstractFileByPath(folder)) {
        await this.app.vault.createFolder(folder);
      }
    }
  }
  async openBoard() {
    await this.ensureWorkspace();
    await this.repository.applyDueReviews();
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  async loadCards() {
    return this.repository.loadCards();
  }
  async loadArchivedCards() {
    return this.repository.loadArchivedCards();
  }
  async loadResearchLogs() {
    return this.repository.loadResearchLogs();
  }
  async loadResearchLogModules(kind) {
    return this.repository.loadResearchLogModules(kind);
  }
  async createCard(values) {
    return this.repository.createCard(values);
  }
  async createCommunicationSourceNote(values) {
    return this.repository.createCommunicationSourceNote(values);
  }
  async loadParticipantSuggestions() {
    return this.repository.loadParticipantSuggestions();
  }
  async updateCardFrontmatter(file, updates) {
    await this.repository.updateCardFrontmatter(file, updates);
  }
  async updateCard(card, values) {
    await this.repository.updateCard(card, values);
  }
  async moveCard(cardPath, targetStatus, beforePath) {
    const card = (await this.repository.loadCards()).find((item) => item.path === cardPath);
    await this.repository.moveCard(cardPath, targetStatus, beforePath);
    if (card) this.maybePromptForResearchLog(card, targetStatus);
  }
  async setCardStatus(card, status) {
    await this.repository.setCardStatus(card, status);
    this.maybePromptForResearchLog(card, status);
  }
  async setCardPriority(card, priority) {
    await this.repository.setCardPriority(card, priority);
  }
  async updateProjectState(card, projectState) {
    await this.repository.updateProjectState(card, projectState);
  }
  async updateGanttDates(card, values) {
    await this.repository.updateGanttDates(card, values);
  }
  async normalizeCardOrder() {
    await this.repository.normalizeCardOrder();
  }
  async openSchemaReference() {
    await this.ensureWorkspace();
    let file = this.app.vault.getAbstractFileByPath(this.schemaReferencePath);
    if (!(file instanceof import_obsidian9.TFile)) {
      file = await this.app.vault.create(this.schemaReferencePath, getSchemaReferenceContent());
      new import_obsidian9.Notice("KanbanRPM schema reference created.");
    }
    if (file instanceof import_obsidian9.TFile) await this.app.workspace.getLeaf(false).openFile(file);
  }
  async setNextAction(cardPath, nextAction) {
    await this.repository.setNextAction(cardPath, nextAction);
  }
  activeSourceNoteLink() {
    const file = this.app.workspace.getActiveFile();
    return file instanceof import_obsidian9.TFile ? `[[${file.basename}]]` : "";
  }
  async promoteActionToBigAction(action) {
    return this.repository.promoteActionToBigAction(action);
  }
  async toggleSmallAction(action) {
    await this.repository.toggleSmallAction(action);
  }
  async updateSmallActionMetadata(action, values) {
    await this.repository.updateSmallActionMetadata(action, values);
  }
  async completeRoutine(cardPath, routineText, date) {
    await this.repository.completeRoutine(cardPath, routineText, date);
  }
  async addPrecededBy(targetPath, sourceCard) {
    await this.repository.addPrecededBy(targetPath, sourceCard);
  }
  async removePrecededBy(targetPath, sourceCard) {
    await this.repository.removePrecededBy(targetPath, sourceCard);
  }
  async archiveCard(card) {
    await this.repository.archiveCard(card);
  }
  async unarchiveCard(card) {
    await this.repository.unarchiveCard(card);
  }
  async deleteCard(card) {
    await this.repository.deleteCard(card);
  }
  async duplicateCard(card) {
    return this.repository.duplicateCard(card);
  }
  async collectActionIndex(cards) {
    return this.repository.collectActionIndex(cards);
  }
  validateCards(cards) {
    return this.repository.validateCards(cards);
  }
  async writeManagementBrief(cards) {
    await this.repository.writeManagementBrief(cards);
  }
  async writeLLMContext(cards) {
    await this.repository.writeLLMContext(cards);
  }
  async addResearchLogRow(card, values) {
    await this.repository.addResearchLogRow(card, values);
  }
  resolveLinkedFile(link, sourcePath) {
    return this.repository.resolveLinkedFile(link, sourcePath);
  }
  computeOrder(laneCards, insertIndex) {
    return this.repository.computeOrder(laneCards, insertIndex);
  }
  async openCard(card) {
    const file = this.app.vault.getAbstractFileByPath(card.path);
    if (file instanceof import_obsidian9.TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }
  async openFilePath(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian9.TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }
  async openLinkedReference(link, sourcePath) {
    const file = this.resolveLinkedFile(link, sourcePath);
    if (file instanceof import_obsidian9.TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    } else {
      new import_obsidian9.Notice(`KanbanRPM could not resolve link: ${link}`);
    }
  }
  async refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof KanbanRPMView) await view.refresh();
    }
  }
  async applyDueReviews() {
    return this.repository.applyDueReviews();
  }
  maybePromptForResearchLog(card, targetStatus) {
    if (!this.settings.promptForLogOnDone) return;
    if (card.type !== "big_action") return;
    if (this.isCompletionStatus(card.status) || !this.isCompletionStatus(targetStatus)) return;
    const kind = this.researchLogKindForCategory(card.workstreamType);
    if (!kind) return;
    void this.openResearchLogPrompt(card, kind);
  }
  async openResearchLogPrompt(card, kind) {
    const today = this.todayIso();
    const initial = {
      module: "",
      date: today,
      subject: "",
      conditionsOrMethod: "",
      result: card.nextAction || "",
      link: `[[${card.file.basename}]]`
    };
    const moduleOptions = await this.loadResearchLogModules(kind);
    new ResearchLogModal(this.app, kind, initial, moduleOptions, async (values) => {
      await this.addResearchLogRow(card, values);
    }).open();
  }
  researchLogKindForCategory(category) {
    const normalized = category.trim().toLowerCase();
    if (!normalized) return null;
    if (this.settings.experimentLogCategories.includes(normalized)) return "experiment";
    if (this.settings.analysisLogCategories.includes(normalized)) return "analysis";
    return null;
  }
  isCompletionStatus(statusId) {
    var _a, _b;
    const status = this.settings.statuses.find((item) => item.id === statusId);
    const value = `${(_a = status == null ? void 0 : status.id) != null ? _a : statusId} ${(_b = status == null ? void 0 : status.label) != null ? _b : ""}`.toLowerCase();
    return /\b(done|complete|completed)\b/.test(value);
  }
  todayIso() {
    const now = /* @__PURE__ */ new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
};
