import { ItemView, TFile, WorkspaceLeaf, normalizePath, setIcon } from 'obsidian';
import { VIEW_TYPE } from './constants';
import { Platform } from 'obsidian';
import { addDays, daysBetween, dateRange, endOfMonth, formatDate, isIsoDate, monthRange, todayIso } from './date-utils';
import { Menu } from 'obsidian';
import { Notice } from 'obsidian';
import { ConfirmCardActionModal, EditProjectCardModal, GanttDateModal, NewCommunicationSourceModal, NewProjectCardModal, SmallActionMetadataModal, TimelineMemoModal } from './modals';
import type KanbanRPMPlugin from './main';
import type { ActionItem, CardIssue, Lane, ProjectCard, RecurringItem, ResearchLogEntry, SmallAction, Status, TimelineScope, ViewMode } from './types';
import { categoryLabel, compareCards, isDueSoon, isPastDate, toDateSortValue } from './utils';
import type {
  FlowConnectState,
  GanttPeriod,
  GanttRow,
  GanttRowMetric,
  GanttScale,
  GanttSegment,
  PointerDragState,
  TableSortKey,
  TimelineMarker,
  TimelineMemoItem,
} from './view-models';
import { TABLE_COLUMNS } from './view-models';

export class KanbanRPMView extends ItemView {
  private plugin: KanbanRPMPlugin;
  private cards: ProjectCard[] = [];
  private archivedCards: ProjectCard[] = [];
  private researchLogs: ResearchLogEntry[] = [];
  private actions: ActionItem[] = [];
  private issues: CardIssue[] = [];
  private searchQuery = '';
  private projectFilter = '';
  private subprojectFilter = '';
  private workstreamTypeFilter = '';
  private viewMode: ViewMode = 'board';
  private viewportMode: 'phone' | 'tablet' | 'desktop' = 'desktop';
  private viewportWidth = 0;
  private didApplyPhoneDefaultView = false;
  private phoneBoardStatus = '';
  private tableSortKey: TableSortKey = 'priority';
  private tableSortDirection: 'asc' | 'desc' = 'asc';
  private tableColumnWidths = new Map<TableSortKey, number>();
  private timelineBaseDate = todayIso();
  private timelineRangeStart = '';
  private timelineRangeEnd = '';
  private timelineSearchQuery = '';
  private timelineScope: TimelineScope = 'all';
  private timelineMemoVisible = true;
  private timelineSidebarCollapsed = false;
  private ganttRangeStart = '';
  private ganttRangeEnd = '';
  private boardStatusFilter = new Set<string>();
  private timelineStatusFilter = new Set<string>();
  private ganttScale: GanttScale = 'month-week';
  private showGanttConnectors = true;
  private collapsedGanttNodes = new Set<string>();
  private groupByProject = true;
  private toolbarExpanded = false;
  private showDataWarnings = false;
  private showCommandCenter = false;
  private showActionIndex = false;
  private showResearchIndex = false;
  private panelsExpanded = false;
  private showClosedProjects = false;
  private showBoardConnectors = true;
  private showBoardSubprojects = true;
  private showBoardBigActions = true;
  private showGanttSubprojects = true;
  private showGanttBigActions = true;
  private boardZoom = 1;
  private timelineZoom = 1;
  private ganttZoom = 1;
  private timelineScrollLeft: number | null = null;
  private timelineScrollTop: number | null = null;
  private timelineScrollSaveTimer?: number;
  private projectNotesCollapsed = false;
  private phoneFiltersExpanded = false;
  private phoneTimelineControlsExpanded = false;
  private expandedSmallActions = new Set<string>();
  private collapsedSmallActions = new Set<string>();
  private expandedSmallActionSections = new Set<string>();
  private collapsedSmallActionSections = new Set<string>();
  private pointerDrag?: PointerDragState;
  private flowConnect?: FlowConnectState;

  constructor(leaf: WorkspaceLeaf, plugin: KanbanRPMPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.loadViewFilters('board');
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

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'KanbanRPM';
  }

  getIcon(): string {
    return 'layout-dashboard';
  }

  async onOpen(): Promise<void> {
    this.registerDomEvent(window, 'resize', () => {
      this.render();
    });
    await this.refresh();
  }

  async refresh(): Promise<void> {
    await this.plugin.applyDueReviews();
    this.cards = await this.plugin.loadCards();
    this.archivedCards = await this.plugin.loadArchivedCards();
    this.researchLogs = await this.plugin.loadResearchLogs();
    this.actions = await this.plugin.collectActionIndex(this.cards);
    this.issues = this.plugin.validateCards(this.cards);
    if (this.ensureViewFilters()) await this.saveViewFilters();
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('kanban-rpm-view');
    this.updateViewportMode(container);
    this.applyPhoneDefaultView();

    const visibleCards = this.filterCards(this.cards);
    const visibleArchivedCards = this.filterCards(this.archivedCards, { ignoreHierarchyFilters: true });
    const visibleBoardCards = visibleCards.filter((card) => card.type !== 'project');

    const toolbar = container.createDiv({ cls: 'kanban-rpm-toolbar' });
    const title = toolbar.createDiv({ cls: 'kanban-rpm-title' });
    title.createEl('h2', { text: 'KanbanRPM' });
    title.createSpan({
      cls: 'kanban-rpm-count',
      text: this.searchQuery
        ? `${visibleBoardCards.length} of ${this.cards.length} cards - ${this.viewMode}`
        : `${this.viewMode === 'archive' ? visibleArchivedCards.length : visibleBoardCards.length} cards - ${this.viewMode}`,
    });

    const actions = toolbar.createDiv({ cls: 'kanban-rpm-actions' });
    const search = actions.createEl('input', {
      cls: 'kanban-rpm-search',
      attr: {
        type: 'search',
        placeholder: 'Search cards',
        value: this.searchQuery,
        'aria-label': 'Search KanbanRPM cards',
      },
    });
    search.addEventListener('input', () => {
      this.searchQuery = search.value;
      this.render();
    });

    if (this.searchQuery) {
      actions.createEl('button', { text: 'Clear' }).addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    this.renderViewSwitcher(actions);

    if (this.isPhoneViewport()) {
      const quick = actions.createDiv({ cls: 'kanban-rpm-phone-quick-actions' });
      this.createIconButton(quick, 'plus', 'New document', 'kanban-rpm-phone-action').addEventListener('click', () => {
        new NewProjectCardModal(this.app, this.plugin, this.newDocumentContext()).open();
      });
      if (this.viewMode === 'board') {
        quick
          .createEl('button', { cls: 'kanban-rpm-phone-action', text: this.groupByProject ? 'Flat' : 'Group' })
          .addEventListener('click', () => {
            this.groupByProject = !this.groupByProject;
            this.render();
          });
      }
      this.createIconButton(quick, 'refresh-cw', 'Refresh', 'kanban-rpm-phone-action').addEventListener('click', () => {
        void this.refresh();
      });
      quick
        .createEl('button', { cls: 'kanban-rpm-phone-action', text: this.toolbarExpanded ? 'Less' : 'More' })
        .addEventListener('click', () => {
          this.toolbarExpanded = !this.toolbarExpanded;
          this.render();
        });
    } else {
      actions.createEl('button', { text: this.isCompactViewport() ? 'New' : 'New document' }).addEventListener('click', () => {
        new NewProjectCardModal(this.app, this.plugin, this.newDocumentContext()).open();
      });
      if (this.viewMode === 'board') {
        actions
          .createEl('button', { text: this.groupByProject ? 'Flat board' : this.getGroupingLabel() })
          .addEventListener('click', () => {
            this.groupByProject = !this.groupByProject;
            this.render();
          });
      }
      actions.createEl('button', { text: this.isCompactViewport() ? 'Refr.' : 'Refresh' }).addEventListener('click', () => {
        void this.refresh();
      });
      actions
        .createEl('button', { text: this.toolbarExpanded ? 'Less' : 'More' })
        .addEventListener('click', () => {
          this.toolbarExpanded = !this.toolbarExpanded;
          this.render();
        });
    }

    if (this.toolbarExpanded) {
      const secondary = container.createDiv({ cls: 'kanban-rpm-toolbar-secondary' });
      secondary.createEl('button', { text: 'New communication note' }).addEventListener('click', () => {
        new NewCommunicationSourceModal(this.app, this.plugin).open();
      });
      secondary.createEl('button', { text: 'Management brief' }).addEventListener('click', () => {
        void this.plugin.writeManagementBrief(visibleCards);
      });
      secondary.createEl('button', { text: 'Generate LLM context' }).addEventListener('click', () => {
        void this.plugin.writeLLMContext(visibleCards);
      });
      secondary.createEl('button', { text: 'Normalize order' }).addEventListener('click', () => {
        void this.plugin.normalizeCardOrder();
      });
    }

    this.renderFilters(container, visibleCards, visibleBoardCards);

    if (this.showDataWarnings) this.renderDataWarnings(container, visibleCards);
    if (this.showCommandCenter) this.renderCommandCenter(container, visibleBoardCards);
    if (this.showActionIndex) this.renderActionIndexGrouped(container, visibleBoardCards);
    if (this.showResearchIndex) this.renderResearchIndex(container, this.researchLogs);
    this.renderProjectNotes(container);

    if (this.viewMode === 'archive') {
      this.renderArchiveView(container, visibleArchivedCards);
      return;
    }

    if (this.viewMode === 'gantt') {
      this.renderGanttView(container, visibleBoardCards);
      return;
    }

    if (this.viewMode === 'table') {
      this.renderTableView(container, visibleBoardCards);
      return;
    }

    if (this.viewMode === 'timeline') {
      this.renderTimelineView(container, visibleBoardCards);
      return;
    }

    this.renderBoardView(container, visibleBoardCards);
  }

  private renderViewSwitcher(container: HTMLElement): void {
    const switcher = container.createDiv({ cls: 'kanban-rpm-view-switcher' });
    for (const mode of ['board', 'table', 'timeline', 'gantt', 'archive'] as ViewMode[]) {
      const label = this.isCompactViewport() ? this.compactViewLabel(mode) : mode[0].toUpperCase() + mode.slice(1);
      const button = switcher.createDiv({
        cls: this.viewMode === mode ? 'kanban-rpm-view-button is-active' : 'kanban-rpm-view-button',
        text: label,
        attr: { 'aria-pressed': String(this.viewMode === mode) },
      });
      button.setAttr('role', 'button');
      button.setAttr('tabindex', '0');
      button.addEventListener('click', () => {
        void this.saveViewFilters();
        this.viewMode = mode;
        this.loadViewFilters(mode);
        this.render();
      });
      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        void this.saveViewFilters();
        this.viewMode = mode;
        this.loadViewFilters(mode);
        this.render();
      });
    }
  }

  private compactViewLabel(mode: ViewMode): string {
    if (mode === 'timeline') return 'Time';
    if (mode === 'archive') return 'Arch';
    return mode[0].toUpperCase() + mode.slice(1);
  }

  private updateViewportMode(container: HTMLElement): void {
    const width = container.clientWidth || this.containerEl.clientWidth || window.innerWidth;
    this.viewportWidth = width;
    const appMobile = Boolean((this.app as unknown as { isMobile?: boolean }).isMobile);
    const nextMode = width <= 640 ? 'phone' : width <= 1024 || (Platform.isMobile && appMobile) ? 'tablet' : 'desktop';
    this.viewportMode = nextMode;
    container.removeClass('is-phone', 'is-tablet', 'is-desktop');
    container.addClass(`is-${nextMode}`);
  }

  private isPhoneViewport(): boolean {
    return this.viewportMode === 'phone';
  }

  private isCompactViewport(): boolean {
    return this.viewportMode !== 'desktop' || this.viewportWidth <= 1450;
  }

  private applyPhoneDefaultView(): void {
    if (!this.isPhoneViewport() || this.didApplyPhoneDefaultView) return;
    this.didApplyPhoneDefaultView = true;
    this.projectNotesCollapsed = true;
    this.timelineSidebarCollapsed = true;
    if (this.viewMode === 'archive') return;
    this.viewMode = 'timeline';
    this.loadViewFilters('timeline');
  }

  private getGroupingLabel(): string {
    return this.projectFilter ? 'Group by Subproject' : 'Group by Project';
  }

  private filterCards(cards: ProjectCard[], options: { ignoreHierarchyFilters?: boolean } = {}): ProjectCard[] {
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

  private getSearchText(card: ProjectCard): string {
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
      ...card.sourceNotes,
    ]
      .join(' ')
      .toLowerCase();
  }

  private renderFilters(container: HTMLElement, visibleCards: ProjectCard[], visibleBoardCards: ProjectCard[]): void {
    if (this.isPhoneViewport()) {
      this.renderPhoneFilters(container, visibleCards, visibleBoardCards);
      return;
    }

    const filters = container.createDiv({ cls: 'kanban-rpm-filters' });
    this.renderSelectFilter(filters, 'Project', this.projectFilter, this.uniqueValues('projectTitle'), (value) => {
      this.projectFilter = value;
      this.subprojectFilter = '';
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(filters, 'Subproject', this.subprojectFilter, this.subprojectFilterValues(), (value) => {
      this.subprojectFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(filters, 'Category', this.workstreamTypeFilter, this.uniqueCategoryValues(), (value) => {
      this.workstreamTypeFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    filters
      .createEl('button', {
        cls: this.showClosedProjects ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: this.isCompactViewport() ? `Closed ${this.showClosedProjects ? 'on' : 'off'}` : this.showClosedProjects ? 'Showing closed' : 'Show closed projects',
        attr: { 'aria-pressed': String(this.showClosedProjects) },
      })
      .addEventListener('click', () => {
        this.showClosedProjects = !this.showClosedProjects;
        if (!this.showClosedProjects && this.projectFilter && this.isProjectTitleClosed(this.projectFilter)) {
          this.projectFilter = '';
          this.subprojectFilter = '';
          void this.saveViewFilters();
        }
        this.render();
      });

    if (this.projectFilter || this.subprojectFilter || this.workstreamTypeFilter) {
      filters.createEl('button', { text: 'Clear filters' }).addEventListener('click', () => {
        this.projectFilter = '';
        this.subprojectFilter = '';
        this.workstreamTypeFilter = '';
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
    const panelWrap = filters.createDiv({ cls: 'kanban-rpm-panel-menu' });
    panelWrap
      .createEl('button', {
        cls: this.panelsExpanded || activePanelCount ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: activePanelCount ? `Panels (${activePanelCount})` : 'Panels',
        attr: { 'aria-expanded': String(this.panelsExpanded) },
      })
      .addEventListener('click', () => {
        this.panelsExpanded = !this.panelsExpanded;
        this.render();
      });

    if (this.panelsExpanded) this.renderPanelToggles(container, warningCount, actionCount, researchCount);
  }

  private renderPanelToggles(container: HTMLElement, warningCount: number, actionCount: number, researchCount: number): void {
    const toggles = container.createDiv({ cls: 'kanban-rpm-panel-toggles kanban-rpm-panel-toggles-inline' });
    this.renderPanelToggle(toggles, 'Data warnings', this.showDataWarnings, warningCount, () => {
      this.showDataWarnings = !this.showDataWarnings;
      this.render();
    });
    this.renderPanelToggle(toggles, 'Command center', this.showCommandCenter, undefined, () => {
      this.showCommandCenter = !this.showCommandCenter;
      this.render();
    });
    this.renderPanelToggle(toggles, 'Action index', this.showActionIndex, actionCount, () => {
      this.showActionIndex = !this.showActionIndex;
      this.render();
    });
    this.renderPanelToggle(toggles, 'Research index', this.showResearchIndex, researchCount, () => {
      this.showResearchIndex = !this.showResearchIndex;
      this.render();
    });
  }

  private renderPanelToggle(
    container: HTMLElement,
    label: string,
    active: boolean,
    count: number | undefined,
    onClick: () => void
  ): void {
    const text = count === undefined ? label : `${label} (${count})`;
    const button = container.createEl('button', {
      cls: active ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
      text,
      attr: { 'aria-pressed': String(active) },
    });
    button.addEventListener('click', onClick);
  }

  private newDocumentContext(status: Status = 'inbox'): { status: Status; projectTitle?: string; subprojectTitle?: string } {
    return {
      status,
      projectTitle: this.projectFilter || undefined,
      subprojectTitle: this.subprojectFilter || undefined,
    };
  }

  private renderSelectFilter(
    container: HTMLElement,
    label: string,
    currentValue: string,
    values: Array<string | { id: string; label: string }>,
    onChange: (value: string) => void
  ): void {
    const wrap = container.createDiv({ cls: 'kanban-rpm-filter' });
    wrap.createSpan({ text: label });
    const select = wrap.createEl('select');
    select.createEl('option', { text: 'All', attr: { value: '' } });
    for (const value of values) {
      const id = typeof value === 'string' ? value : value.id;
      const optionLabel = typeof value === 'string' ? value : value.label;
      select.createEl('option', { text: optionLabel, attr: { value: id } });
    }
    select.value = currentValue;
    select.addEventListener('change', () => onChange(select.value));
  }

  private uniqueValues(field: 'projectTitle' | 'workstreamType'): string[] {
    if (field === 'projectTitle') {
      const cards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
      return Array.from(new Set(cards.flatMap((card) => card.projectTitles).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }
    const cards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
    return Array.from(new Set(cards.map((card) => card[field]).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private subprojectFilterValues(): string[] {
    const baseCards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
    const cards = this.projectFilter ? baseCards.filter((card) => card.projectTitles.includes(this.projectFilter)) : baseCards;
    return Array.from(new Set(cards.flatMap((card) => card.subprojectTitles).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private uniqueCategoryValues(): Array<{ id: string; label: string }> {
    const configured = this.plugin.settings.categories;
    const configuredIds = new Set(configured.map((category) => category.id));
    const cards = this.showClosedProjects ? this.cards : this.cards.filter((card) => !this.isHiddenByClosedProject(card));
    const unknown = Array.from(new Set(cards.map((card) => card.workstreamType).filter((category) => category && !configuredIds.has(category)))).sort((a, b) =>
      a.localeCompare(b)
    );
    return [...configured, ...unknown.map((id) => ({ id, label: id }))];
  }

  private isProjectTitleClosed(title: string): boolean {
    return this.cards.some((card) => card.type === 'project' && card.title === title && card.projectState === 'closed');
  }

  private closedProjectTitles(): Set<string> {
    return new Set(this.cards.filter((card) => card.type === 'project' && card.projectState === 'closed').map((card) => card.title));
  }

  private isHiddenByClosedProject(card: ProjectCard): boolean {
    const closedProjects = this.closedProjectTitles();
    if (card.type === 'project') return card.projectState === 'closed';
    if (!card.projectTitles.length) return false;
    return card.projectTitles.some((title) => closedProjects.has(title)) && card.projectTitles.every((title) => closedProjects.has(title));
  }

  private renderProjectNotes(container: HTMLElement): void {
    if (this.isPhoneViewport() && this.projectNotesCollapsed) return;

    const projects = this.cards
      .filter((card) => card.type === 'project')
      .filter((card) => this.showClosedProjects || card.projectState !== 'closed')
      .filter((card) => !this.projectFilter || card.title === this.projectFilter || card.projectTitles.includes(this.projectFilter))
      .sort((a, b) => a.title.localeCompare(b.title));

    const panel = container.createDiv({ cls: this.projectNotesCollapsed ? 'kanban-rpm-project-strip is-collapsed' : 'kanban-rpm-project-strip' });
    const header = panel.createDiv({ cls: 'kanban-rpm-project-strip-header' });
    header.createEl('h3', { text: this.projectFilter ? 'Project note' : 'Project notes' });
    const actions = header.createDiv({ cls: 'kanban-rpm-project-strip-actions' });
    actions.createSpan({ text: `${projects.length} project${projects.length === 1 ? '' : 's'}` });
    actions
      .createEl('button', { text: this.projectNotesCollapsed ? 'Expand' : 'Collapse' })
      .addEventListener('click', () => {
        this.projectNotesCollapsed = !this.projectNotesCollapsed;
        this.render();
      });

    if (this.projectNotesCollapsed) return;

    if (!projects.length) {
      panel.createDiv({ cls: 'kanban-rpm-empty', text: 'No project notes match the current Project filter.' });
      return;
    }

    const list = panel.createDiv({ cls: 'kanban-rpm-project-note-list' });
    for (const project of projects) {
      const note = list.createDiv({ cls: project.projectState === 'closed' ? 'kanban-rpm-project-note kanban-rpm-type-project is-closed' : 'kanban-rpm-project-note kanban-rpm-type-project' });
      note.style.setProperty('--rpm-project-color', this.projectColor(project.colorKey));
      const title = note.createEl('button', { cls: 'kanban-rpm-project-note-title', text: project.title });
      title.addEventListener('click', () => {
        void this.plugin.openCard(project);
      });
      const meta = note.createDiv({ cls: 'kanban-rpm-project-note-meta' });
      if (project.projectState === 'closed') this.renderStatusBadge(meta, 'closed', 'closed');
      if (project.status) this.renderStatusBadge(meta, project.status);
      if (project.workstreamType) meta.createSpan({ text: this.categoryLabel(project.workstreamType) });
      meta.createEl('button', { text: project.projectState === 'closed' ? 'Reopen project' : 'Close project' }).addEventListener('click', () => {
        if (project.projectState === 'closed') {
          void this.plugin.updateProjectState(project, 'active');
          return;
        }
        new ConfirmCardActionModal(this.app, {
          title: 'Close project',
          message: `Hide "${project.title}" and cards that only belong to this Project from default KanbanRPM views? Child card statuses will not be changed.`,
          confirmText: 'Close project',
          onConfirm: async () => {
            if (this.projectFilter === project.title) {
              this.projectFilter = '';
              this.subprojectFilter = '';
              void this.saveViewFilters();
            }
            await this.plugin.updateProjectState(project, 'closed');
          },
        }).open();
      });
      if (project.nextAction) note.createDiv({ cls: 'kanban-rpm-project-note-focus', text: project.nextAction });
    }
  }

  private renderDataWarnings(container: HTMLElement, visibleCards: ProjectCard[]): void {
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const issues = this.issues.filter((issue) => visiblePaths.has(issue.cardPath));
    const errors = issues.filter((issue) => issue.level === 'error').length;
    const warnings = issues.length - errors;
    const panel = container.createDiv({ cls: 'kanban-rpm-data-warnings' });
    const header = panel.createDiv({ cls: 'kanban-rpm-data-warnings-header' });
    header.createEl('h3', { text: 'Data warnings' });
    const headerActions = header.createDiv({ cls: 'kanban-rpm-panel-actions' });
    headerActions.createSpan({ text: `${errors} errors - ${warnings} warnings` });

    if (!issues.length) {
      panel.createDiv({ cls: 'kanban-rpm-empty', text: 'No data warnings in the current view.' });
      return;
    }

    for (const issue of issues.slice(0, 8)) {
      const row = panel.createDiv({ cls: `kanban-rpm-issue kanban-rpm-issue-${issue.level}` });
      row.createSpan({ cls: 'kanban-rpm-issue-card', text: issue.cardTitle });
      row.createSpan({ cls: 'kanban-rpm-issue-field', text: issue.field });
      row.createSpan({ cls: 'kanban-rpm-issue-message', text: issue.message });
      row.addEventListener('click', () => {
        const card = this.cards.find((item) => item.path === issue.cardPath);
        if (card) void this.plugin.openCard(card);
      });
    }

    if (issues.length > 8) {
      panel.createDiv({ cls: 'kanban-rpm-issue-more', text: `+${issues.length - 8} more warnings` });
    }
  }

  private renderCommandCenter(container: HTMLElement, visibleCards: ProjectCard[]): void {
    const panel = container.createDiv({ cls: 'kanban-rpm-command-center' });
    const header = panel.createDiv({ cls: 'kanban-rpm-command-center-header' });
    header.createEl('h3', { text: 'Command center' });
    const headerActions = header.createDiv({ cls: 'kanban-rpm-panel-actions' });

    const reviewCards = visibleCards
      .filter((card) => isPastDate(card.nextReview) || isDueSoon(card.nextReview) || isPastDate(card.scheduledDate) || isDueSoon(card.scheduledDate) || isPastDate(card.dueDate) || isDueSoon(card.dueDate))
      .sort((a, b) => toDateSortValue(a).localeCompare(toDateSortValue(b)))
      .slice(0, 6);
    headerActions.createSpan({ text: 'review, waiting, blockers, flow' });
    headerActions.createEl('button', { text: 'Timeline review' }).addEventListener('click', () => {
      this.viewMode = 'timeline';
      this.timelineScope = 'review';
      this.showCommandCenter = false;
      this.render();
    });

    const grid = panel.createDiv({ cls: 'kanban-rpm-command-grid' });
    const waitingStatus = this.getConfiguredStatusId('waiting');
    const blockedStatus = this.getConfiguredStatusId('blocked');
    const waitingCards = visibleCards
      .filter((card) => card.status === waitingStatus || Boolean(card.waitingFor))
      .sort(compareCards)
      .slice(0, 6);
    const blockedCards = visibleCards
      .filter((card) => card.status === blockedStatus || Boolean(card.blocker) || card.blockedBy.length)
      .sort(compareCards)
      .slice(0, 6);
    const dependencyCards = visibleCards
      .filter((card) => card.precededBy.length || card.followedBy.length)
      .sort((a, b) => b.precededBy.length + b.followedBy.length - (a.precededBy.length + a.followedBy.length))
      .slice(0, 6);

    this.renderCommandSection(grid, 'Review queue', reviewCards, (card) => {
      const date = card.scheduledDate || card.nextReview || card.dueDate || 'no date';
      return `${date} - ${card.nextAction || card.workstreamType || card.status}`;
    });
    this.renderCommandSection(grid, 'Waiting', waitingCards, (card) => card.waitingFor || card.nextAction || card.status);
    this.renderCommandSection(grid, 'Blocked', blockedCards, (card) => card.blocker || card.nextAction || card.status);
    this.renderCommandSection(grid, 'Flow', dependencyCards, (card) => {
      const counts = [];
      if (card.precededBy.length) counts.push(`${card.precededBy.length} preceded`);
      if (card.followedBy.length) counts.push(`${card.followedBy.length} followed`);
      return counts.join(' - ') || card.workstreamType || card.status;
    });
  }

  private renderCommandSection(
    container: HTMLElement,
    title: string,
    cards: ProjectCard[],
    subtitle: (card: ProjectCard) => string
  ): void {
    const section = container.createDiv({ cls: 'kanban-rpm-command-section' });
    const header = section.createDiv({ cls: 'kanban-rpm-command-section-header' });
    header.createSpan({ text: title });
    header.createSpan({ text: String(cards.length) });

    if (!cards.length) {
      section.createDiv({ cls: 'kanban-rpm-command-empty', text: 'Clear' });
      return;
    }

    for (const card of cards) {
      const row = section.createDiv({ cls: 'kanban-rpm-command-card' });
      row.createDiv({ cls: 'kanban-rpm-command-card-title', text: card.title });
      row.createDiv({ cls: 'kanban-rpm-command-card-subtitle', text: subtitle(card) });
      row.addEventListener('click', () => {
        void this.plugin.openCard(card);
      });
    }
  }

  private resolveDependencyTarget(sourceCard: ProjectCard, link: string): { file?: TFile; card?: ProjectCard } {
    const file = this.plugin.resolveLinkedFile(link, sourceCard.path);
    if (!file) return {};
    return { file, card: this.cards.find((card) => card.path === file.path) };
  }

  private cleanWikiLabel(link: string): string {
    return link.replace(/^\[\[/, '').replace(/\]\]$/, '').split('|')[0];
  }

  private svgEl<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  private renderActionIndexGrouped(container: HTMLElement, visibleCards: ProjectCard[]): void {
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const actions = this.actions.filter((action) => visiblePaths.has(action.cardPath));
    const grouped = this.groupActionsByCard(actions);
    const visibleGroups = grouped.slice(0, 12);
    const panel = container.createDiv({ cls: 'kanban-rpm-action-index' });
    const header = panel.createDiv({ cls: 'kanban-rpm-action-index-header' });
    header.createEl('h3', { text: 'Action index' });
    const headerActions = header.createDiv({ cls: 'kanban-rpm-panel-actions' });
    headerActions.createSpan({ text: `${actions.length} actions - ${grouped.length} cards` });

    if (!actions.length) {
      panel.createDiv({ cls: 'kanban-rpm-empty', text: 'No linked unchecked actions found.' });
      return;
    }

    for (const group of visibleGroups) {
      const groupEl = panel.createDiv({ cls: 'kanban-rpm-action-group' });
      const groupHeader = groupEl.createDiv({ cls: 'kanban-rpm-action-group-header' });
      groupHeader.createSpan({ text: group.cardTitle });
      groupHeader.createSpan({ text: `${group.actions.length} actions` });

      for (const action of group.actions.slice(0, 6)) {
        this.renderActionRow(groupEl, action);
      }

      if (group.actions.length > 6) {
        groupEl.createDiv({ cls: 'kanban-rpm-action-more', text: `+${group.actions.length - 6} more actions` });
      }
    }

    if (grouped.length > visibleGroups.length) {
      panel.createDiv({ cls: 'kanban-rpm-action-more', text: `+${grouped.length - visibleGroups.length} more cards` });
    }
  }

  private groupActionsByCard(actions: ActionItem[]): Array<{ cardPath: string; cardTitle: string; actions: ActionItem[] }> {
    const map = new Map<string, { cardPath: string; cardTitle: string; actions: ActionItem[] }>();
    for (const action of actions) {
      const existing = map.get(action.cardPath) ?? {
        cardPath: action.cardPath,
        cardTitle: action.cardTitle,
        actions: [],
      };
      existing.actions.push(action);
      map.set(action.cardPath, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.actions.length - a.actions.length || a.cardTitle.localeCompare(b.cardTitle));
  }

  private renderActionRow(container: HTMLElement, action: ActionItem): void {
    const row = container.createDiv({ cls: 'kanban-rpm-action-row is-clickable' });
    row.createDiv({ cls: 'kanban-rpm-action-text', text: action.text });
    row.createDiv({
      cls: 'kanban-rpm-action-source',
      text: action.recurring ? `${action.sourceLabel} - recurring` : `${action.sourceLabel}:${action.lineNumber}`,
    });
    const rowActions = row.createDiv({ cls: 'kanban-rpm-action-buttons' });
    rowActions.createEl('button', { text: action.recurring ? 'Open card' : 'Open source' }).addEventListener('click', (event) => {
      event.stopPropagation();
      void this.plugin.openFilePath(action.sourcePath);
    });
    rowActions.createEl('button', { text: 'Set next' }).addEventListener('click', (event) => {
      event.stopPropagation();
      void this.plugin.setNextAction(action.cardPath, action.text);
    });
    if (!action.recurring) {
      rowActions.createEl('button', { text: 'Promote' }).addEventListener('click', (event) => {
        event.stopPropagation();
        void this.plugin.promoteActionToBigAction(action);
      });
    }
    row.addEventListener('click', () => {
      void this.plugin.openFilePath(action.sourcePath);
    });
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') void this.plugin.openFilePath(action.sourcePath);
    });
    row.setAttr('role', 'button');
    row.setAttr('tabindex', '0');
  }

  private renderBoardView(container: HTMLElement, visibleBoardCards: ProjectCard[]): void {
    this.ensureBoardStatusFilter();
    this.ensureBoardStatusOrder();
    const boardCards = visibleBoardCards.filter(
      (card) =>
        this.boardStatusFilter.has(card.status) &&
        (this.showBoardSubprojects || card.type !== 'subproject') &&
        (this.showBoardBigActions || card.type !== 'big_action')
    );
    this.renderBoardStatusFilter(container);
    if (this.isPhoneViewport()) {
      this.renderPhoneBoardView(container, boardCards);
      return;
    }
    const wrap = container.createDiv({ cls: 'kanban-rpm-board-wrap' });
    const overlay = this.showBoardConnectors ? this.svgEl('svg') : undefined;
    if (overlay) {
      overlay.addClass('kanban-rpm-board-flow-overlay');
      wrap.appendChild(overlay);
    }
    const board = wrap.createDiv({ cls: 'kanban-rpm-board' });
    this.applySurfaceZoom(board, this.boardZoom);
    const visibleLanes = this.orderedBoardStatuses().filter((status) => this.boardStatusFilter.has(status.id));
    for (const lane of visibleLanes) {
      this.renderLane(board, lane, boardCards.filter((card) => card.status === lane.id).sort(compareCards), visibleLanes);
    }
    if (!this.boardStatusFilter.size) board.createDiv({ cls: 'kanban-rpm-empty', text: 'No Board statuses selected.' });
    if (overlay) this.queueBoardFlowOverlay(wrap, overlay, boardCards);
  }

  private renderPhoneBoardView(container: HTMLElement, boardCards: ProjectCard[]): void {
    const visibleLanes = this.orderedBoardStatuses().filter((status) => this.boardStatusFilter.has(status.id));
    if (!visibleLanes.length) {
      container.createDiv({ cls: 'kanban-rpm-empty', text: 'No Board statuses selected.' });
      return;
    }

    if (!visibleLanes.some((lane) => lane.id === this.phoneBoardStatus)) this.phoneBoardStatus = visibleLanes[0].id;
    const tabs = container.createDiv({ cls: 'kanban-rpm-phone-lane-tabs' });
    for (const lane of visibleLanes) {
      const count = boardCards.filter((card) => card.status === lane.id).length;
      const tab = tabs.createEl('button', {
        cls: this.phoneBoardStatus === lane.id ? 'is-active' : '',
        text: `${lane.label} ${count}`,
        attr: { 'aria-pressed': String(this.phoneBoardStatus === lane.id) },
      });
      tab.addEventListener('click', () => {
        this.phoneBoardStatus = lane.id;
        this.render();
      });
    }

    const activeLane = visibleLanes.find((lane) => lane.id === this.phoneBoardStatus) ?? visibleLanes[0];
    const wrap = container.createDiv({ cls: 'kanban-rpm-board-wrap kanban-rpm-phone-board-wrap' });
    const board = wrap.createDiv({ cls: 'kanban-rpm-board kanban-rpm-phone-board' });
    this.renderLane(board, activeLane, boardCards.filter((card) => card.status === activeLane.id).sort(compareCards), [activeLane]);
  }

  private renderBoardStatusFilter(container: HTMLElement): void {
    const controls = container.createDiv({ cls: 'kanban-rpm-board-status-row' });
    if (!this.isPhoneViewport()) {
      this.renderBoardToggleButton(controls, `Arrows: ${this.showBoardConnectors ? 'On' : 'Off'}`, this.showBoardConnectors, async () => {
        this.showBoardConnectors = !this.showBoardConnectors;
        this.plugin.settings.showBoardConnectors = this.showBoardConnectors;
        await this.plugin.saveSettings();
        this.render();
      });
    }
    this.renderBoardToggleButton(controls, this.isPhoneViewport() ? `Sub ${this.showBoardSubprojects ? 'On' : 'Off'}` : `Subprojects: ${this.showBoardSubprojects ? 'Shown' : 'Hidden'}`, this.showBoardSubprojects, async () => {
      this.showBoardSubprojects = !this.showBoardSubprojects;
      this.plugin.settings.showBoardSubprojects = this.showBoardSubprojects;
      await this.plugin.saveSettings();
      this.render();
    });
    this.renderBoardToggleButton(controls, this.isPhoneViewport() ? `Act ${this.showBoardBigActions ? 'On' : 'Off'}` : `Big actions: ${this.showBoardBigActions ? 'Shown' : 'Hidden'}`, this.showBoardBigActions, async () => {
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
    const statusWrap = controls.createEl('details', { cls: 'kanban-rpm-board-status-filter' });
    statusWrap.createEl('summary', { text: this.isPhoneViewport() ? `St ${this.boardStatusFilter.size}` : `Statuses: ${this.boardStatusFilter.size}` });
    const statusList = statusWrap.createDiv({ cls: 'kanban-rpm-board-status-list' });
    for (const status of this.orderedBoardStatuses()) {
      const label = statusList.createEl('label');
      const checkbox = label.createEl('input', { attr: { type: 'checkbox' } });
      checkbox.checked = this.boardStatusFilter.has(status.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) this.boardStatusFilter.add(status.id);
        else this.boardStatusFilter.delete(status.id);
        this.plugin.settings.boardStatusFilter = Array.from(this.boardStatusFilter);
        void this.plugin.saveSettings();
        this.render();
      });
      label.createSpan({ text: status.label });
    }
  }

  private renderBoardToggleButton(container: HTMLElement, text: string, active: boolean, onClick: () => Promise<void>): void {
    const button = container.createEl('button', {
      cls: active ? 'kanban-rpm-view-button is-active' : 'kanban-rpm-view-button',
      text,
      attr: { 'aria-pressed': String(active) },
    });
    button.addEventListener('click', () => {
      void onClick();
    });
  }

  private renderZoomControls(container: HTMLElement, currentZoom: number, onChange: (zoom: number) => Promise<void>): void {
    const group = container.createDiv({ cls: 'kanban-rpm-zoom-controls' });
    const out = this.createIconButton(group, 'zoom-out', 'Zoom out', 'kanban-rpm-zoom-button');
    const value = group.createSpan({ cls: 'kanban-rpm-zoom-value', text: `${Math.round(currentZoom * 100)}%` });
    const zoomIn = this.createIconButton(group, 'zoom-in', 'Zoom in', 'kanban-rpm-zoom-button');
    const commit = (nextPercent: number): void => {
      const next = Math.min(1.4, Math.max(0.7, Math.round(nextPercent / 5) * 5 / 100));
      if (Math.abs(next - currentZoom) < 0.001) return;
      value.setText(`${Math.round(next * 100)}%`);
      void onChange(next);
    };
    out.addEventListener('click', () => commit(currentZoom * 100 - 5));
    zoomIn.addEventListener('click', () => commit(currentZoom * 100 + 5));
  }

  private applySurfaceZoom(element: HTMLElement, zoom: number): void {
    element.style.setProperty('--rpm-view-zoom', String(zoom));
  }

  private queueBoardFlowOverlay(wrap: HTMLElement, overlay: SVGElement, visibleBoardCards: ProjectCard[]): void {
    window.setTimeout(() => this.renderBoardFlowOverlay(wrap, overlay, visibleBoardCards), 0);
  }

  private renderBoardFlowOverlay(wrap: HTMLElement, overlay: SVGElement, visibleBoardCards: ProjectCard[]): void {
    overlay.empty();
    const wrapRect = wrap.getBoundingClientRect();
    const width = Math.max(1, wrap.scrollWidth);
    const height = Math.max(1, wrap.scrollHeight);
    overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    overlay.setAttribute('width', String(width));
    overlay.setAttribute('height', String(height));

    const defs = this.svgEl('defs');
    for (const [id, color] of [
      ['ready', 'var(--text-muted)'],
      ['waiting', 'var(--text-warning)'],
    ]) {
      const marker = this.svgEl('marker');
      marker.setAttribute('id', `kanban-rpm-board-flow-arrow-${id}`);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto-start-reverse');
      const arrow = this.svgEl('path');
      arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
      arrow.setAttribute('fill', color);
      marker.appendChild(arrow);
      defs.appendChild(marker);
    }
    overlay.appendChild(defs);

    const visiblePaths = new Set(visibleBoardCards.map((card) => card.path));
    const seen = new Set<string>();
    for (const card of visibleBoardCards) {
      for (const predecessor of card.precededBy) {
        const resolved = this.resolveDependencyTarget(card, predecessor);
        const source = resolved.card;
        if (!source || !visiblePaths.has(source.path)) continue;
        const key = `${source.path}->${card.path}`;
        if (seen.has(key)) continue;
        seen.add(key);
        this.renderBoardFlowArrow(wrapRect, overlay, source, card, this.isCompletionStatus(source.status) ? 'ready' : 'waiting');
      }
    }
  }

  private renderBoardFlowArrow(
    wrapRect: DOMRect,
    overlay: SVGElement,
    source: ProjectCard,
    target: ProjectCard,
    state: 'ready' | 'waiting'
  ): void {
    const sourceDot = this.containerEl.querySelector<HTMLElement>(`.kanban-rpm-flow-dot-out[data-path="${CSS.escape(source.path)}"]`);
    const targetDot = this.containerEl.querySelector<HTMLElement>(`.kanban-rpm-flow-dot-in[data-path="${CSS.escape(target.path)}"]`);
    if (!sourceDot || !targetDot) return;
    const from = sourceDot.getBoundingClientRect();
    const to = targetDot.getBoundingClientRect();
    const wrap = overlay.parentElement as HTMLElement | null;
    const scrollLeft = wrap?.scrollLeft ?? 0;
    const scrollTop = wrap?.scrollTop ?? 0;
    const fromX = from.left + from.width / 2 - wrapRect.left + scrollLeft;
    const fromY = from.top + from.height / 2 - wrapRect.top + scrollTop;
    const toX = to.left + to.width / 2 - wrapRect.left + scrollLeft;
    const toY = to.top + to.height / 2 - wrapRect.top + scrollTop;
    const control = Math.max(60, Math.abs(toX - fromX) * 0.45);
    const path = this.svgEl('path');
    path.setAttribute('class', `kanban-rpm-board-flow-arrow is-${state}`);
    path.setAttribute('d', `M ${fromX} ${fromY} C ${fromX + control} ${fromY}, ${toX - control} ${toY}, ${toX} ${toY}`);
    path.setAttribute('marker-end', `url(#kanban-rpm-board-flow-arrow-${state})`);
    path.dataset.sourcePath = source.path;
    path.dataset.targetPath = target.path;
    path.addEventListener('click', (event) => {
      event.stopPropagation();
      new ConfirmCardActionModal(this.app, {
        title: 'Remove flow arrow',
        message: `Remove "${source.title} -> ${target.title}" from ${target.title}'s Preceded by list?`,
        confirmText: 'Remove',
        onConfirm: () => this.plugin.removePrecededBy(target.path, source),
      }).open();
    });
    overlay.appendChild(path);
  }

  private renderTableView(container: HTMLElement, visibleBoardCards: ProjectCard[]): void {
    const sortedCards = this.sortTableCards(visibleBoardCards);
    if (this.isPhoneViewport()) {
      this.renderPhoneTableView(container, sortedCards);
      return;
    }
    const wrap = container.createDiv({ cls: 'kanban-rpm-table-wrap' });
    const table = wrap.createEl('table', { cls: 'kanban-rpm-table' });
    const colgroup = table.createEl('colgroup');
    for (const column of TABLE_COLUMNS) {
      const col = colgroup.createEl('col');
      col.style.width = `${this.tableColumnWidths.get(column.key) ?? column.width}px`;
    }
    const thead = table.createEl('thead');
    const header = thead.createEl('tr');
    TABLE_COLUMNS.forEach((column, index) => this.renderTableHeader(header, column, index, table));

    const tbody = table.createEl('tbody');
    if (!sortedCards.length) {
      const row = tbody.createEl('tr');
      const cell = row.createEl('td', { cls: 'kanban-rpm-table-empty', text: 'No cards match the current filters.' });
      cell.colSpan = 8;
      return;
    }

    for (const card of sortedCards) this.renderTableRow(tbody, card);
  }

  private renderPhoneTableView(container: HTMLElement, cards: ProjectCard[]): void {
    const wrap = container.createDiv({ cls: 'kanban-rpm-phone-list kanban-rpm-phone-table-list' });
    this.renderPhoneSortBar(wrap);
    if (!cards.length) {
      wrap.createDiv({ cls: 'kanban-rpm-empty', text: 'No cards match the current filters.' });
      return;
    }
    for (const card of cards) this.renderPhonePlanningCard(wrap, card, 'table');
  }

  private renderArchiveView(container: HTMLElement, cards: ProjectCard[]): void {
    const wrap = container.createDiv({ cls: 'kanban-rpm-table-wrap kanban-rpm-archive-wrap' });
    wrap.createEl('h3', { text: 'Archive' });
    const table = wrap.createEl('table', { cls: 'kanban-rpm-table' });
    const thead = table.createEl('thead');
    const header = thead.createEl('tr');
    for (const label of ['Title', 'Project', 'Archived', 'Original path', 'Actions']) header.createEl('th', { text: label });
    const tbody = table.createEl('tbody');
    if (!cards.length) {
      const row = tbody.createEl('tr');
      const cell = row.createEl('td', { cls: 'kanban-rpm-table-empty', text: 'No archived cards match the current filters.' });
      cell.colSpan = 5;
      return;
    }
    for (const card of cards.sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || '') || a.title.localeCompare(b.title))) {
      const row = tbody.createEl('tr');
      const title = row.createEl('td');
      title.createEl('button', { cls: 'kanban-rpm-table-title', text: card.title }).addEventListener('click', () => {
        void this.plugin.openCard(card);
      });
      row.createEl('td', { text: card.projectTitle || card.archiveOwnerProject || 'Unassigned' });
      row.createEl('td', { text: card.archivedAt ? card.archivedAt.slice(0, 10) : '' });
      row.createEl('td', { text: card.archiveOriginalPath });
      const actions = row.createEl('td', { cls: 'kanban-rpm-table-actions' });
      actions.createEl('button', { text: 'Unarchive' }).addEventListener('click', () => {
        void this.plugin.unarchiveCard(card);
      });
      actions.createEl('button', { text: 'Delete' }).addEventListener('click', () => {
        new ConfirmCardActionModal(this.app, {
          title: 'Delete archived card',
          message: `Delete archived card "${card.title}"?`,
          confirmText: 'Delete',
          onConfirm: () => this.plugin.deleteCard(card),
        }).open();
      });
    }
  }

  private renderGanttView(container: HTMLElement, visibleBoardCards: ProjectCard[]): void {
    const ganttCards = visibleBoardCards.filter((card) => card.type === 'subproject' || card.type === 'big_action');
    if (this.isPhoneViewport()) {
      this.renderPhoneGanttPlanningList(container, ganttCards);
      return;
    }
    const rows = this.buildGanttRows(ganttCards, this.showGanttSubprojects, this.showGanttBigActions);
    const autoRange = this.ganttAutoRange(rows, ganttCards);
    const range = this.ganttRange(autoRange);
    const totalDays = Math.max(1, daysBetween(range.start, range.end) + 1);
    const minDayWidth = this.ganttScale === 'month-week' ? 6 : 2.8;
    const availableTimelineWidth = Math.max(520, (container.clientWidth || 0) - 300);
    const timelineWidth = Math.max(totalDays * minDayWidth, availableTimelineWidth);
    const dayWidth = timelineWidth / totalDays;
    const connectorCount = this.countVisibleGanttConnectors(rows, range);
    const topSegments = this.ganttScale === 'month-week' ? this.ganttMonthSegments(range.start, range.end) : this.ganttQuarterSegments(range.start, range.end);
    const bottomSegments = this.ganttScale === 'month-week' ? this.ganttWeekSegments(range.start, range.end) : this.ganttMonthSegments(range.start, range.end);

    const wrap = container.createDiv({ cls: 'kanban-rpm-gantt-wrap' });
    const controls = wrap.createDiv({ cls: 'kanban-rpm-gantt-controls' });
    controls.createEl('span', { cls: 'kanban-rpm-gantt-range', text: `${this.toDisplayDate(range.start)} - ${this.toDisplayDate(range.end)}` });
    const rangeStart = controls.createEl('input', {
      cls: 'kanban-rpm-gantt-date-input',
      attr: {
        type: 'date',
        value: this.ganttRangeStart || autoRange.start,
        'aria-label': 'Gantt range start',
      },
    });
    const rangeEnd = controls.createEl('input', {
      cls: 'kanban-rpm-gantt-date-input',
      attr: {
        type: 'date',
        value: this.ganttRangeEnd || autoRange.end,
        'aria-label': 'Gantt range end',
      },
    });
    controls.createEl('button', { text: 'Apply range' }).addEventListener('click', () => {
      if (isIsoDate(rangeStart.value) && isIsoDate(rangeEnd.value) && rangeStart.value <= rangeEnd.value) {
        this.ganttRangeStart = rangeStart.value;
        this.ganttRangeEnd = rangeEnd.value;
        this.render();
      }
    });
    controls.createEl('button', { text: 'Auto range' }).addEventListener('click', () => {
      this.ganttRangeStart = '';
      this.ganttRangeEnd = '';
      this.render();
    });
    for (const [scale, label] of [
      ['month-week', 'Month+Week'],
      ['quarter-month', 'Quarter+Month'],
    ] as Array<[GanttScale, string]>) {
      controls
        .createEl('button', {
          cls: this.ganttScale === scale ? 'kanban-rpm-view-button is-active' : 'kanban-rpm-view-button',
          text: label,
          attr: { 'aria-pressed': String(this.ganttScale === scale) },
        })
        .addEventListener('click', () => {
          this.ganttScale = scale;
          this.render();
        });
    }
    controls
      .createEl('button', {
        cls: this.showGanttConnectors ? 'kanban-rpm-view-button is-active' : 'kanban-rpm-view-button',
        text: `Connectors: ${this.showGanttConnectors ? 'On' : 'Off'} (${connectorCount})`,
        attr: { 'aria-pressed': String(this.showGanttConnectors) },
      })
      .addEventListener('click', () => {
        this.showGanttConnectors = !this.showGanttConnectors;
        this.render();
      });
    controls
      .createEl('button', {
        cls: this.showGanttSubprojects ? 'kanban-rpm-view-button is-active' : 'kanban-rpm-view-button',
        text: `Subprojects: ${this.showGanttSubprojects ? 'Shown' : 'Hidden'}`,
        attr: { 'aria-pressed': String(this.showGanttSubprojects) },
      })
      .addEventListener('click', () => {
        this.showGanttSubprojects = !this.showGanttSubprojects;
        this.plugin.settings.showGanttSubprojects = this.showGanttSubprojects;
        void this.plugin.saveSettings();
        this.render();
      });
    controls
      .createEl('button', {
        cls: this.showGanttBigActions ? 'kanban-rpm-view-button is-active' : 'kanban-rpm-view-button',
        text: `Big actions: ${this.showGanttBigActions ? 'Shown' : 'Hidden'}`,
        attr: { 'aria-pressed': String(this.showGanttBigActions) },
      })
      .addEventListener('click', () => {
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

    const surface = wrap.createDiv({ cls: 'kanban-rpm-gantt-surface' });
    this.applySurfaceZoom(surface, this.ganttZoom);
    const header = surface.createDiv({ cls: 'kanban-rpm-gantt-header' });
    header.createDiv({ cls: 'kanban-rpm-gantt-label-header', text: 'PROJECT / WORKSTREAM' });
    const headerGrid = header.createDiv({ cls: 'kanban-rpm-gantt-time-header' });
    headerGrid.style.width = `${timelineWidth}px`;
    this.renderGanttSegments(headerGrid, topSegments, range.start, dayWidth, 'top');
    this.renderGanttSegments(headerGrid, bottomSegments, range.start, dayWidth, 'bottom');

    const body = surface.createDiv({ cls: 'kanban-rpm-gantt-body' });
    if (!rows.length) {
      body.createDiv({ cls: 'kanban-rpm-empty', text: 'No visible Subproject or Big Action dates match the current filters.' });
      return;
    }

    for (const row of rows) this.renderGanttSurfaceRow(body, row, range, dayWidth, timelineWidth);
    if (this.showGanttConnectors) this.renderGanttConnectors(body, rows, range, dayWidth, timelineWidth);
  }

  private renderPhoneGanttPlanningList(container: HTMLElement, cards: ProjectCard[]): void {
    const planningCards = cards
      .filter((card) => (this.showGanttSubprojects || card.type !== 'subproject') && (this.showGanttBigActions || card.type !== 'big_action'))
      .filter((card) => card.startDate || card.scheduledDate || card.dueDate || card.nextReview)
      .sort((a, b) => this.compareGanttCards(a, b));

    const wrap = container.createDiv({ cls: 'kanban-rpm-phone-list kanban-rpm-phone-gantt-list' });
    const controls = wrap.createDiv({ cls: 'kanban-rpm-phone-gantt-controls' });
    this.renderBoardToggleButton(controls, `Sub ${this.showGanttSubprojects ? 'On' : 'Off'}`, this.showGanttSubprojects, async () => {
      this.showGanttSubprojects = !this.showGanttSubprojects;
      this.plugin.settings.showGanttSubprojects = this.showGanttSubprojects;
      await this.plugin.saveSettings();
      this.render();
    });
    this.renderBoardToggleButton(controls, `Act ${this.showGanttBigActions ? 'On' : 'Off'}`, this.showGanttBigActions, async () => {
      this.showGanttBigActions = !this.showGanttBigActions;
      this.plugin.settings.showGanttBigActions = this.showGanttBigActions;
      await this.plugin.saveSettings();
      this.render();
    });

    if (!planningCards.length) {
      wrap.createDiv({ cls: 'kanban-rpm-empty', text: 'No planning dates match the current filters.' });
      return;
    }

    for (const group of this.groupCardsForCurrentFilter(planningCards)) {
      const groupEl = wrap.createDiv({ cls: 'kanban-rpm-phone-planning-group' });
      const header = groupEl.createDiv({ cls: 'kanban-rpm-phone-planning-group-header' });
      this.addProjectToken(header, group.project);
      header.createSpan({ text: group.project });
      header.createSpan({ cls: 'kanban-rpm-project-group-count', text: String(group.cards.length) });
      for (const card of group.cards) this.renderPhonePlanningCard(groupEl, card, 'gantt');
    }
  }

  private renderPhoneFilters(container: HTMLElement, visibleCards: ProjectCard[], visibleBoardCards: ProjectCard[]): void {
    const filters = container.createDiv({ cls: 'kanban-rpm-filters kanban-rpm-phone-filters' });
    const activeFilters = [this.projectFilter, this.subprojectFilter, this.workstreamTypeFilter].filter(Boolean).length;
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const visibleBoardPaths = new Set(visibleBoardCards.map((card) => card.path));
    const warningCount = this.issues.filter((issue) => visiblePaths.has(issue.cardPath)).length;
    const actionCount = this.actions.filter((action) => visibleBoardPaths.has(action.cardPath)).length;
    const researchCount = this.researchLogs.length;
    const activePanelCount = [this.showDataWarnings, this.showCommandCenter, this.showActionIndex, this.showResearchIndex].filter(Boolean).length;
    const projectCount = this.cards
      .filter((card) => card.type === 'project')
      .filter((card) => this.showClosedProjects || card.projectState !== 'closed')
      .filter((card) => !this.projectFilter || card.title === this.projectFilter || card.projectTitles.includes(this.projectFilter)).length;

    const top = filters.createDiv({ cls: 'kanban-rpm-phone-filter-summary' });
    top
      .createEl('button', {
        cls: this.phoneFiltersExpanded || activeFilters ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: activeFilters ? `Filters (${activeFilters})` : 'Filters',
        attr: { 'aria-expanded': String(this.phoneFiltersExpanded) },
      })
      .addEventListener('click', () => {
        this.phoneFiltersExpanded = !this.phoneFiltersExpanded;
        this.render();
      });

    if (activeFilters) {
      const chips = top.createDiv({ cls: 'kanban-rpm-phone-filter-chips' });
      if (this.projectFilter) chips.createSpan({ text: this.projectFilter });
      if (this.subprojectFilter) chips.createSpan({ text: this.subprojectFilter });
      if (this.workstreamTypeFilter) chips.createSpan({ text: this.categoryLabel(this.workstreamTypeFilter) });
      top.createEl('button', { cls: 'kanban-rpm-panel-toggle', text: 'Clear' }).addEventListener('click', () => {
        this.projectFilter = '';
        this.subprojectFilter = '';
        this.workstreamTypeFilter = '';
        void this.saveViewFilters();
        this.render();
      });
    }

    top
      .createEl('button', {
        cls: !this.projectNotesCollapsed ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: !this.projectNotesCollapsed ? `Projects ${projectCount}` : 'Projects',
        attr: { 'aria-expanded': String(!this.projectNotesCollapsed) },
      })
      .addEventListener('click', () => {
        this.projectNotesCollapsed = !this.projectNotesCollapsed;
        this.render();
      });

    const panelWrap = top.createDiv({ cls: 'kanban-rpm-panel-menu' });
    panelWrap
      .createEl('button', {
        cls: this.panelsExpanded || activePanelCount ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: activePanelCount ? `Panels ${activePanelCount}` : 'Panels',
        attr: { 'aria-expanded': String(this.panelsExpanded) },
      })
      .addEventListener('click', () => {
        this.panelsExpanded = !this.panelsExpanded;
        this.render();
      });

    if (this.panelsExpanded) this.renderPanelToggles(filters, warningCount, actionCount, researchCount);

    if (!this.phoneFiltersExpanded) return;

    const body = filters.createDiv({ cls: 'kanban-rpm-phone-filter-body' });
    this.renderSelectFilter(body, 'Project', this.projectFilter, this.uniqueValues('projectTitle'), (value) => {
      this.projectFilter = value;
      this.subprojectFilter = '';
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(body, 'Subproject', this.subprojectFilter, this.subprojectFilterValues(), (value) => {
      this.subprojectFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    this.renderSelectFilter(body, 'Category', this.workstreamTypeFilter, this.uniqueCategoryValues(), (value) => {
      this.workstreamTypeFilter = value;
      void this.saveViewFilters();
      this.render();
    });
    body
      .createEl('button', {
        cls: this.showClosedProjects ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: this.showClosedProjects ? 'Closed on' : 'Closed off',
        attr: { 'aria-pressed': String(this.showClosedProjects) },
      })
      .addEventListener('click', () => {
        this.showClosedProjects = !this.showClosedProjects;
        if (!this.showClosedProjects && this.projectFilter && this.isProjectTitleClosed(this.projectFilter)) {
          this.projectFilter = '';
          this.subprojectFilter = '';
          void this.saveViewFilters();
        }
        this.render();
      });
  }

  private buildGanttRows(cards: ProjectCard[], includeSubprojects = true, includeBigActions = true): GanttRow[] {
    const rows: GanttRow[] = [];
    const projectTitles = Array.from(new Set(cards.map((card) => card.projectTitle || card.projectTitles[0] || 'No project')))
      .sort((a, b) => this.compareGanttProjectTitles(a, b, cards));

    for (const projectTitle of projectTitles) {
      const projectCards = cards.filter((card) => (card.projectTitle || card.projectTitles[0] || 'No project') === projectTitle);
      const projectCard = this.cards.find((card) => card.type === 'project' && card.title === projectTitle);
      const projectKey = `gantt:project:${projectTitle}`;
      const projectCollapsed = !this.projectFilter && this.collapsedGanttNodes.has(projectKey);
      if (!this.projectFilter) {
        rows.push({
          key: projectKey,
          kind: 'project',
          title: projectTitle,
          projectTitle,
          subprojectTitle: '',
          card: projectCard,
          period: this.ganttProjectPeriod(projectCard, projectCards),
          childCount: projectCards.length,
        });
      }
      if (projectCollapsed) continue;

      const subprojectTitles = new Set<string>();
      for (const card of projectCards) {
        if (card.type === 'subproject') subprojectTitles.add(card.title);
        for (const title of card.subprojectTitles) subprojectTitles.add(title);
      }
      if (!subprojectTitles.size) subprojectTitles.add('No subproject');

      for (const subprojectTitle of Array.from(subprojectTitles).sort((a, b) => this.compareGanttSubprojectTitles(a, b, projectCards))) {
        const subprojectCard = projectCards.find((card) => card.type === 'subproject' && card.title === subprojectTitle);
        const bigActions = projectCards
          .filter((card) => card.type === 'big_action')
          .filter((card) => (subprojectTitle === 'No subproject' ? !card.subprojectTitles.length : card.subprojectTitles.includes(subprojectTitle)))
          .sort((a, b) => this.compareGanttCards(a, b));
        if (!subprojectCard && !bigActions.length) continue;

        const subprojectKey = `gantt:subproject:${projectTitle}:${subprojectTitle}`;
        if (includeSubprojects) {
          rows.push({
            key: subprojectKey,
            kind: 'subproject',
            title: subprojectTitle,
            projectTitle,
            subprojectTitle,
            card: subprojectCard,
            period: this.ganttSubprojectPeriod(subprojectCard, bigActions),
            childCount: bigActions.length,
          });
        }

        if ((includeSubprojects && this.collapsedGanttNodes.has(subprojectKey)) || !includeBigActions) continue;
        for (const card of bigActions) {
          rows.push({
            key: `gantt:action:${card.path}`,
            kind: 'big_action',
            title: card.title,
            projectTitle,
            subprojectTitle,
            card,
            period: this.ganttCardPeriod(card),
            childCount: 0,
          });
        }
      }
    }

    return rows;
  }

  private renderGanttSurfaceRow(container: HTMLElement, row: GanttRow, range: GanttPeriod, dayWidth: number, timelineWidth: number): void {
    const rowEl = container.createDiv({ cls: `kanban-rpm-gantt-row is-${row.kind}` });
    if (row.period && this.isShortGanttPeriod(row.period)) rowEl.addClass('has-short-label');
    rowEl.style.setProperty('--rpm-project-color', this.projectColor(row.projectTitle || row.title));
    rowEl.style.setProperty('--rpm-gantt-bar-color', this.ganttBarColor(row.card));

    const label = rowEl.createDiv({ cls: 'kanban-rpm-gantt-row-label' });
    if (row.kind !== 'big_action') this.renderGanttToggle(label, row.key, this.collapsedGanttNodes.has(row.key), row.kind === 'project' && !!this.projectFilter);
    else label.createSpan({ cls: 'kanban-rpm-gantt-indent' });

    const titleWrap = label.createDiv({ cls: 'kanban-rpm-gantt-title-wrap' });
    if (row.kind !== 'big_action') titleWrap.createSpan({ cls: 'kanban-rpm-gantt-type-mark', text: row.kind === 'project' ? 'P' : 'S' });
    const titleButton = titleWrap.createEl('button', { cls: 'kanban-rpm-gantt-title', text: row.title });
    titleButton.addEventListener('click', () => {
      if (row.card) void this.plugin.openCard(row.card);
      else {
        const project = this.cards.find((card) => card.type === 'project' && card.title === row.projectTitle);
        if (project) void this.plugin.openCard(project);
      }
    });

    const meta = label.createDiv({ cls: 'kanban-rpm-gantt-row-meta' });
    if (row.card) {
      meta.createSpan({ cls: `kanban-rpm-status-badge kanban-rpm-status-${row.card.status}`, text: this.statusLabel(row.card.status) });
      if (row.card.precededBy.length) meta.createSpan({ cls: 'kanban-rpm-gantt-badge', text: `Preceded ${row.card.precededBy.length}` });
      if (row.card.followedBy.length) meta.createSpan({ cls: 'kanban-rpm-gantt-badge', text: `Followed ${row.card.followedBy.length}` });
      if (row.card.blockedBy.length) meta.createSpan({ cls: 'kanban-rpm-gantt-badge is-blocked', text: `Blocked ${row.card.blockedBy.length}` });
    }
    if (row.kind === 'project') meta.createSpan({ cls: 'kanban-rpm-gantt-count', text: `${row.childCount} items` });
    if (row.kind === 'subproject') meta.createSpan({ cls: 'kanban-rpm-gantt-count', text: `${row.childCount} actions` });

    const track = rowEl.createDiv({ cls: 'kanban-rpm-gantt-track' });
    track.style.width = `${timelineWidth}px`;
    if (row.card) track.dataset.path = row.card.path;
    this.renderGanttTrackGrid(track, range, dayWidth);
    if (row.period && this.ganttPeriodOverlaps(row.period, range)) this.renderGanttBar(track, row, row.period, range, dayWidth);
    if (row.card?.nextReview) this.renderGanttMarker(track, row.card.nextReview, range, dayWidth, 'review', 'review');
  }

  private renderGanttToggle(container: HTMLElement, key: string, collapsed: boolean, disabled: boolean): void {
    const toggle = container.createEl('button', {
      cls: disabled ? 'kanban-rpm-gantt-toggle is-disabled' : 'kanban-rpm-gantt-toggle',
      text: disabled ? '' : collapsed ? '?' : '?',
      attr: { 'aria-label': collapsed ? 'Expand Gantt row' : 'Collapse Gantt row' },
    });
    if (disabled) return;
    toggle.addEventListener('click', () => {
      if (this.collapsedGanttNodes.has(key)) this.collapsedGanttNodes.delete(key);
      else this.collapsedGanttNodes.add(key);
      this.render();
    });
  }

  private renderGanttSegments(container: HTMLElement, segments: GanttSegment[], rangeStart: string, dayWidth: number, level: 'top' | 'bottom'): void {
    for (const segment of segments) {
      const el = container.createDiv({ cls: `kanban-rpm-gantt-segment is-${level}` });
      const left = daysBetween(rangeStart, segment.start) * dayWidth;
      const width = (daysBetween(segment.start, segment.end) + 1) * dayWidth;
      el.style.left = `${left}px`;
      el.style.width = `${Math.max(width, 1)}px`;
      el.createSpan({ text: segment.label });
    }
  }

  private renderGanttTrackGrid(track: HTMLElement, range: GanttPeriod, dayWidth: number): void {
    const segments = this.ganttScale === 'month-week' ? this.ganttMonthSegments(range.start, range.end) : this.ganttQuarterSegments(range.start, range.end);
    for (const segment of segments) {
      const line = track.createDiv({ cls: 'kanban-rpm-gantt-grid-line' });
      line.style.left = `${daysBetween(range.start, segment.start) * dayWidth}px`;
    }
    const today = todayIso();
    if (today >= range.start && today <= range.end) {
      const line = track.createDiv({ cls: 'kanban-rpm-gantt-today-line' });
      line.style.left = `${daysBetween(range.start, today) * dayWidth}px`;
    }
  }

  private renderGanttBar(track: HTMLElement, row: GanttRow, period: GanttPeriod, range: GanttPeriod, dayWidth: number): void {
    const start = period.start < range.start ? range.start : period.start;
    const end = period.end > range.end ? range.end : period.end;
    if (start > end) return;
    const left = daysBetween(range.start, start) * dayWidth;
    const width = Math.max((daysBetween(start, end) + 1) * dayWidth, 14);
    const isShort = this.isShortGanttPeriod(period);
    const bar = track.createEl('button', {
      cls: [
        'kanban-rpm-gantt-bar',
        `is-${row.kind}`,
        row.card ? `is-status-${row.card.status}` : '',
        row.card?.blockedBy.length ? 'is-blocked' : '',
      ].filter(Boolean).join(' '),
      text: row.title,
      attr: { title: row.card ? `Edit Gantt dates: ${row.title}` : row.title },
    });
    bar.style.left = `${left}px`;
    bar.style.width = `${width}px`;
    if (row.card) bar.dataset.path = row.card.path;
    bar.addEventListener('click', () => {
      if (row.card) new GanttDateModal(this.app, row.card, (values) => this.plugin.updateGanttDates(row.card as ProjectCard, values)).open();
    });
    if (isShort) {
      const outsideLabel = track.createDiv({ cls: `kanban-rpm-gantt-short-label is-${row.kind}`, text: row.title });
      outsideLabel.style.left = `${left}px`;
      outsideLabel.style.maxWidth = `${Math.max(120, dayWidth * (this.ganttScale === 'month-week' ? 21 : 31))}px`;
    }
    if (!row.card) return;

    const incoming = track.createSpan({
      cls: 'kanban-rpm-gantt-flow-dot kanban-rpm-gantt-flow-dot-in',
      attr: { title: 'Preceded by connector target', 'aria-label': 'Preceded by connector target' },
    });
    incoming.dataset.path = row.card.path;
    incoming.style.left = `${this.ganttIncomingDotX(left, width)}px`;
    incoming.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    const outgoing = track.createSpan({
      cls: 'kanban-rpm-gantt-flow-dot kanban-rpm-gantt-flow-dot-out',
      attr: { title: 'Followed by connector source', 'aria-label': 'Followed by connector source' },
    });
    outgoing.dataset.path = row.card.path;
    outgoing.style.left = `${this.ganttOutgoingDotX(left, width)}px`;
    outgoing.addEventListener('pointerdown', (event) => this.startGanttFlowConnect(event, row.card as ProjectCard));
  }

  private renderGanttConnectors(body: HTMLElement, rows: GanttRow[], range: GanttPeriod, dayWidth: number, timelineWidth: number): void {
    const rowByPath = this.ganttVisibleRowMap(rows, range);
    const yByPath = this.ganttTrackCenterYMap(body);
    const totalHeight = Math.max(body.scrollHeight, body.getBoundingClientRect().height);
    const layer = body.createDiv({ cls: 'kanban-rpm-gantt-connectors' });
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
        const sourceY = yByPath.get(sourceInfo.row.card?.path ?? '') ?? 0;
        const targetY = yByPath.get(target.card.path) ?? 0;
        const state = this.isCompletionStatus(sourceInfo.row.card?.status || '') ? 'ready' : 'blocking';
        const midX = sourceX + (targetX - sourceX) / 2;
        if (Math.abs(sourceY - targetY) < 1) {
          this.renderGanttConnectorSegment(layer, sourceX, sourceY, targetX, targetY, state, sourceInfo.row.card, target.card);
        } else {
          this.renderGanttConnectorSegment(layer, sourceX, sourceY, midX, sourceY, state, sourceInfo.row.card, target.card);
          this.renderGanttConnectorSegment(layer, midX, sourceY, midX, targetY, state, sourceInfo.row.card, target.card);
          this.renderGanttConnectorSegment(layer, midX, targetY, targetX, targetY, state, sourceInfo.row.card, target.card);
        }
        const arrowDirection = targetX >= midX ? 'right' : 'left';
        const arrowX = this.ganttArrowheadX(targetX, arrowDirection);
        this.renderGanttConnectorEndpoint(layer, sourceX, sourceY, state, 'source', sourceInfo.row.card, target.card);
        this.renderGanttConnectorEndpoint(layer, targetX, targetY, state, 'target', sourceInfo.row.card, target.card);
        this.renderGanttConnectorArrowhead(layer, arrowX, targetY, arrowDirection, state, sourceInfo.row.card, target.card);
        edgeCount += 1;
      }
    }

    if (!edgeCount) layer.remove();
  }

  private renderGanttConnectorSegment(
    container: HTMLElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    state: 'ready' | 'blocking',
    source: ProjectCard,
    target: ProjectCard
  ): void {
    const horizontal = Math.abs(y1 - y2) < 1;
    const segment = container.createDiv({
      cls: state === 'ready' ? 'kanban-rpm-gantt-connector-segment' : 'kanban-rpm-gantt-connector-segment is-blocking',
      attr: { title: `Remove flow: ${source.title} -> ${target.title}` },
    });
    if (horizontal) {
      segment.addClass('is-horizontal');
      segment.style.left = `${Math.min(x1, x2)}px`;
      segment.style.top = `${y1}px`;
      segment.style.width = `${Math.max(Math.abs(x2 - x1), 2)}px`;
    } else {
      segment.addClass('is-vertical');
      segment.style.left = `${x1}px`;
      segment.style.top = `${Math.min(y1, y2)}px`;
      segment.style.height = `${Math.max(Math.abs(y2 - y1), 2)}px`;
    }
    this.bindGanttConnectorRemove(segment, source, target);
  }

  private renderGanttConnectorEndpoint(container: HTMLElement, x: number, y: number, state: 'ready' | 'blocking', kind: 'source' | 'target', source: ProjectCard, target: ProjectCard): void {
    const endpoint = container.createDiv({
      cls: [
        'kanban-rpm-gantt-connector-endpoint',
        kind === 'target' ? 'is-target' : '',
        state === 'blocking' ? 'is-blocking' : '',
      ].filter(Boolean).join(' '),
      attr: { title: `Remove flow: ${source.title} -> ${target.title}` },
    });
    endpoint.style.left = `${x}px`;
    endpoint.style.top = `${y}px`;
    this.bindGanttConnectorRemove(endpoint, source, target);
  }

  private renderGanttConnectorArrowhead(container: HTMLElement, x: number, y: number, direction: 'left' | 'right', state: 'ready' | 'blocking', source: ProjectCard, target: ProjectCard): void {
    const arrow = container.createDiv({
      cls: [
        'kanban-rpm-gantt-connector-arrowhead',
        direction === 'left' ? 'is-left' : 'is-right',
        state === 'blocking' ? 'is-blocking' : '',
      ].filter(Boolean).join(' '),
      attr: { title: `Remove flow: ${source.title} -> ${target.title}` },
    });
    arrow.style.left = `${x}px`;
    arrow.style.top = `${y}px`;
    this.bindGanttConnectorRemove(arrow, source, target);
  }

  private bindGanttConnectorRemove(element: HTMLElement, source: ProjectCard, target: ProjectCard): void {
    element.dataset.sourcePath = source.path;
    element.dataset.targetPath = target.path;
    element.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      new ConfirmCardActionModal(this.app, {
        title: 'Remove Gantt flow',
        message: `Remove "${source.title} -> ${target.title}" from ${target.title}'s Preceded by list?`,
        confirmText: 'Remove',
        onConfirm: () => this.plugin.removePrecededBy(target.path, source),
      }).open();
    });
  }

  private countVisibleGanttConnectors(rows: GanttRow[], range?: GanttPeriod): number {
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

  private ganttVisibleRowMap(rows: GanttRow[], range?: GanttPeriod): Map<string, { row: GanttRow; index: number; period: GanttPeriod }> {
    const rowByPath = new Map<string, { row: GanttRow; index: number; period: GanttPeriod }>();
    rows.forEach((row, index) => {
      if (row.card && row.period && (!range || this.ganttPeriodOverlaps(row.period, range))) rowByPath.set(row.card.path, { row, index, period: row.period });
    });
    return rowByPath;
  }

  private ganttTrackCenterYMap(body: HTMLElement): Map<string, number> {
    const bodyRect = body.getBoundingClientRect();
    const centers = new Map<string, number>();
    body.querySelectorAll<HTMLElement>('.kanban-rpm-gantt-track[data-path]').forEach((track) => {
      const path = track.dataset.path;
      if (!path) return;
      const rect = track.getBoundingClientRect();
      centers.set(path, rect.top - bodyRect.top + body.scrollTop + rect.height / 2);
    });
    return centers;
  }

  private ganttRowHeight(): number {
    return 42;
  }

  private ganttRowMetrics(rows: GanttRow[]): GanttRowMetric[] {
    let top = 0;
    return rows.map((row) => {
      const height = this.ganttRowHeight();
      const metric = { top, height };
      top += height;
      return metric;
    });
  }

  private ganttDateX(date: string, range: GanttPeriod, dayWidth: number): number {
    const clamped = date < range.start ? range.start : date > range.end ? range.end : date;
    return daysBetween(range.start, clamped) * dayWidth + dayWidth / 2;
  }

  private ganttPeriodStartX(period: GanttPeriod, range: GanttPeriod, dayWidth: number): number {
    const start = period.start < range.start ? range.start : period.start > range.end ? range.end : period.start;
    return daysBetween(range.start, start) * dayWidth;
  }

  private ganttPeriodEndX(period: GanttPeriod, range: GanttPeriod, dayWidth: number): number {
    const end = period.end > range.end ? range.end : period.end < range.start ? range.start : period.end;
    return (daysBetween(range.start, end) + 1) * dayWidth;
  }

  private ganttPeriodWidth(period: GanttPeriod, range: GanttPeriod, dayWidth: number): number {
    const start = period.start < range.start ? range.start : period.start > range.end ? range.end : period.start;
    const end = period.end > range.end ? range.end : period.end < range.start ? range.start : period.end;
    return Math.max((daysBetween(start, end) + 1) * dayWidth, 14);
  }

  private isShortGanttPeriod(period: GanttPeriod): boolean {
    const duration = daysBetween(period.start, period.end) + 1;
    return this.ganttScale === 'month-week' ? duration < 21 : duration < 31;
  }

  private ganttIncomingDotX(left: number, width: number): number {
    return left + Math.min(8, Math.max(5, width * 0.35));
  }

  private ganttOutgoingDotX(left: number, width: number): number {
    return left + width - Math.min(8, Math.max(5, width * 0.35));
  }

  private ganttConnectorSourceX(left: number, width: number, targetX: number): number {
    const incoming = this.ganttIncomingDotX(left, width);
    const outgoing = this.ganttOutgoingDotX(left, width);
    return Math.abs(outgoing - targetX) <= Math.abs(incoming - targetX) ? outgoing : incoming;
  }

  private ganttArrowheadX(targetX: number, direction: 'left' | 'right'): number {
    return direction === 'right' ? targetX - 9 : targetX + 9;
  }

  private renderGanttMarker(track: HTMLElement, date: string, range: GanttPeriod, dayWidth: number, kind: 'review' | 'due', label: string): void {
    if (!isIsoDate(date) || date < range.start || date > range.end) return;
    const marker = track.createDiv({ cls: `kanban-rpm-gantt-marker is-${kind}`, attr: { title: `${label} ${date}` } });
    marker.style.left = `${daysBetween(range.start, date) * dayWidth}px`;
    marker.createSpan({ text: label });
  }

  private ganttCardPeriod(card: ProjectCard): GanttPeriod | undefined {
    const start = isIsoDate(card.startDate) ? card.startDate : isIsoDate(card.dueDate) ? card.dueDate : '';
    const end = isIsoDate(card.dueDate) ? card.dueDate : start;
    return start && end ? { start, end } : undefined;
  }

  private ganttSubprojectPeriod(card: ProjectCard | undefined, children: ProjectCard[]): GanttPeriod | undefined {
    const direct = card ? this.ganttCardPeriod(card) : undefined;
    if (direct && card?.startDate && card?.dueDate) return direct;
    const childPeriods = children.map((child) => this.ganttCardPeriod(child)).filter((period): period is GanttPeriod => !!period);
    if (!childPeriods.length) return direct;
    const starts = childPeriods.map((period) => period.start).sort();
    const ends = childPeriods.map((period) => period.end).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }

  private ganttProjectPeriod(card: ProjectCard | undefined, children: ProjectCard[]): GanttPeriod | undefined {
    const direct = card ? this.ganttCardPeriod(card) : undefined;
    if (direct && card?.startDate && card?.dueDate) return direct;
    const childPeriods = children.map((child) => {
      if (child.type === 'subproject') {
        const childActions = children.filter((item) => item.type === 'big_action' && item.subprojectTitles.includes(child.title));
        return this.ganttSubprojectPeriod(child, childActions);
      }
      return this.ganttCardPeriod(child);
    }).filter((period): period is GanttPeriod => !!period);
    if (!childPeriods.length) return direct;
    const starts = childPeriods.map((period) => period.start).sort();
    const ends = childPeriods.map((period) => period.end).sort();
    return { start: starts[0], end: ends[ends.length - 1] };
  }

  private ganttAutoRange(rows: GanttRow[], cards: ProjectCard[]): GanttPeriod {
    const dates = [
      ...rows.flatMap((row) => [row.period?.start, row.period?.end]),
      ...cards.map((card) => card.nextReview),
    ].filter((date): date is string => !!date && isIsoDate(date)).sort();
    const first = dates[0] ?? todayIso();
    const last = dates[dates.length - 1] ?? addDays(todayIso(), 180);
    return {
      start: first,
      end: last,
    };
  }

  private ganttRange(autoRange: GanttPeriod): GanttPeriod {
    if (isIsoDate(this.ganttRangeStart) && isIsoDate(this.ganttRangeEnd) && this.ganttRangeStart <= this.ganttRangeEnd) {
      return { start: this.ganttRangeStart, end: this.ganttRangeEnd };
    }
    return autoRange;
  }

  private ganttPeriodOverlaps(period: GanttPeriod, range: GanttPeriod): boolean {
    return period.start <= range.end && period.end >= range.start;
  }

  private compareGanttProjectTitles(a: string, b: string, cards: ProjectCard[]): number {
    return this.compareGanttDates(this.ganttProjectSortDate(a, cards), this.ganttProjectSortDate(b, cards)) || a.localeCompare(b);
  }

  private compareGanttSubprojectTitles(a: string, b: string, cards: ProjectCard[]): number {
    return this.compareGanttDates(this.ganttSubprojectSortDate(a, cards), this.ganttSubprojectSortDate(b, cards)) || a.localeCompare(b);
  }

  private compareGanttCards(a: ProjectCard, b: ProjectCard): number {
    return this.compareGanttDates(this.ganttSortDate(a), this.ganttSortDate(b)) || compareCards(a, b);
  }

  private compareGanttDates(a: string, b: string): number {
    return a.localeCompare(b);
  }

  private ganttProjectSortDate(projectTitle: string, cards: ProjectCard[]): string {
    const dates = cards
      .filter((card) => (card.projectTitle || card.projectTitles[0] || 'No project') === projectTitle)
      .map((card) => this.ganttSortDate(card))
      .filter((date) => date !== '9999-99-99')
      .sort();
    return dates[0] ?? '9999-99-99';
  }

  private ganttSubprojectSortDate(subprojectTitle: string, cards: ProjectCard[]): string {
    const subprojectCard = cards.find((card) => card.type === 'subproject' && card.title === subprojectTitle);
    if (subprojectCard) return this.ganttSortDate(subprojectCard);
    const dates = cards
      .filter((card) => card.type === 'big_action')
      .filter((card) => (subprojectTitle === 'No subproject' ? !card.subprojectTitles.length : card.subprojectTitles.includes(subprojectTitle)))
      .map((card) => this.ganttSortDate(card))
      .filter((date) => date !== '9999-99-99')
      .sort();
    return dates[0] ?? '9999-99-99';
  }

  private ganttSortDate(card: ProjectCard): string {
    return isIsoDate(card.startDate) ? card.startDate : isIsoDate(card.dueDate) ? card.dueDate : isIsoDate(card.nextReview) ? card.nextReview : '9999-99-99';
  }

  private ganttBarColor(card?: ProjectCard): string {
    if (!card) return 'var(--rpm-project-color, var(--interactive-accent))';
    const status = `${card.status} ${this.statusLabel(card.status)}`.toLowerCase();
    if (/\b(blocked|block)\b/.test(status)) return '#e05252';
    if (/\b(waiting|wait)\b/.test(status)) return '#d9941f';
    if (/\b(done|complete|completed)\b/.test(status)) return '#3cb371';
    if (/\b(active|doing|progress)\b/.test(status)) return '#6278f0';
    if (/\b(inbox|someday)\b/.test(status)) return '#8a8f98';
    return 'var(--rpm-project-color, var(--interactive-accent))';
  }

  private renderResearchIndex(container: HTMLElement, logs: ResearchLogEntry[]): void {
    const panel = container.createDiv({ cls: 'kanban-rpm-panel kanban-rpm-research-index' });
    panel.createEl('h3', { text: `Research index (${logs.length})` });
    if (!logs.length) {
      panel.createDiv({ cls: 'kanban-rpm-empty', text: 'No Experiment/Analysis Log rows found.' });
      return;
    }
    const table = panel.createEl('table', { cls: 'kanban-rpm-table' });
    const thead = table.createEl('thead');
    const header = thead.createEl('tr');
    for (const label of ['Date', 'Kind', 'Module', 'Subject', 'Result', 'Source']) header.createEl('th', { text: label });
    const tbody = table.createEl('tbody');
    for (const log of logs.sort((a, b) => b.date.localeCompare(a.date) || a.module.localeCompare(b.module))) {
      const row = tbody.createEl('tr');
      row.createEl('td', { text: log.date });
      row.createEl('td', { text: log.kind });
      row.createEl('td', { text: log.module });
      row.createEl('td', { text: log.subject });
      row.createEl('td', { text: log.result });
      const source = row.createEl('td');
      source.createEl('button', { cls: 'kanban-rpm-table-title', text: log.link || log.cardTitle }).addEventListener('click', () => {
        const target = this.resolveLogLink(log);
        void this.plugin.openFilePath(target?.path ?? log.cardPath);
      });
    }
  }

  private resolveLogLink(log: ResearchLogEntry): TFile | null {
    const match = log.link.match(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/);
    if (!match?.[1]) return null;
    return this.app.metadataCache.getFirstLinkpathDest(match[1], log.cardPath);
  }

  private renderTableHeader(
    row: HTMLTableRowElement,
    column: { key: TableSortKey; label: string; width: number },
    index: number,
    table: HTMLTableElement,
  ): void {
    const { key, label } = column;
    const th = row.createEl('th', { cls: this.tableColumnClass(key) });
    th.style.width = `${this.tableColumnWidths.get(key) ?? column.width}px`;
    const active = this.tableSortKey === key;
    const button = th.createEl('button', {
      cls: active ? 'kanban-rpm-table-sort is-active' : 'kanban-rpm-table-sort',
    });
    button.createSpan({ cls: active ? 'kanban-rpm-table-sort-indicator is-active' : 'kanban-rpm-table-sort-indicator', text: active ? (this.tableSortDirection === 'asc' ? '▲' : '▼') : '' });
    button.createSpan({ text: label });
    button.addEventListener('click', () => {
      if (this.tableSortKey === key) {
        this.tableSortDirection = this.tableSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.tableSortKey = key;
        this.tableSortDirection = 'asc';
      }
      this.render();
    });
    this.renderColumnResizer(th, key, index, table);
  }

  private renderColumnResizer(th: HTMLTableCellElement, key: TableSortKey, index: number, table: HTMLTableElement): void {
    const handle = th.createDiv({ cls: 'kanban-rpm-table-resizer', attr: { role: 'separator', 'aria-label': `Resize ${key} column` } });
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = this.tableColumnWidths.get(key) ?? TABLE_COLUMNS[index].width;
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent: PointerEvent) => {
        const width = Math.max(72, startWidth + moveEvent.clientX - startX);
        this.tableColumnWidths.set(key, width);
        th.style.width = `${width}px`;
        const col = table.querySelectorAll('col').item(index) as HTMLTableColElement | null;
        if (col) col.style.width = `${width}px`;
      };
      const end = (endEvent: PointerEvent) => {
        handle.releasePointerCapture(endEvent.pointerId);
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    });
  }

  private renderTableRow(tbody: HTMLTableSectionElement, card: ProjectCard): void {
    const row = tbody.createEl('tr', { cls: card.blockedBy.length ? 'is-blocked' : '' });
    row.style.setProperty('--rpm-project-color', this.projectColor(card.colorKey));

    const titleCell = row.createEl('td', { cls: 'kanban-rpm-table-title-cell' });
    const titleButton = titleCell.createEl('button', { cls: 'kanban-rpm-table-title', text: card.title });
    titleButton.addEventListener('click', () => {
      void this.plugin.openCard(card);
    });
    if (card.nextAction) titleCell.createDiv({ cls: 'kanban-rpm-table-subtext', text: card.nextAction });

    const projectCell = row.createEl('td', { cls: 'kanban-rpm-table-project-cell' });
    const projectLine = projectCell.createDiv({ cls: 'kanban-rpm-table-context' });
    this.addProjectToken(projectLine, card.colorKey);
    projectLine.createSpan({ text: card.breadcrumb || card.projectTitle || 'No project' });

    row.createEl('td', { cls: 'kanban-rpm-table-type-cell', text: this.cardTypeLabel(card.type) });
    const statusCell = row.createEl('td', { cls: 'kanban-rpm-table-status-cell' });
    this.renderStatusBadge(statusCell, card.status, undefined, 'button').addEventListener('click', (event) => {
      this.openStatusMenu(event, card);
    });
    const priorityCell = row.createEl('td', { cls: 'kanban-rpm-table-priority-cell' });
    this.renderPriorityBadge(priorityCell, card);
    row.createEl('td', { cls: 'kanban-rpm-table-date-cell', text: this.cardDateLabel(card) });
    row.createEl('td', { cls: 'kanban-rpm-table-flow-cell', text: this.cardDependencyLabel(card) });

    const actionCell = row.createEl('td', { cls: 'kanban-rpm-table-actions' });
    const actionRow = actionCell.createDiv({ cls: 'kanban-rpm-table-action-row' });
    actionRow.createSpan({ text: `${card.actionCount} tasks` });
    actionRow.createSpan({ text: ' - ' });
    const edit = actionRow.createSpan({ cls: 'kanban-rpm-table-action-link', text: 'Edit', attr: { role: 'button', tabindex: '0' } });
    edit.addEventListener('click', () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    edit.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
  }

  private tableColumnClass(key: TableSortKey): string {
    return `kanban-rpm-table-column-${key}`;
  }

  private renderStatusSelect(container: HTMLElement, card: ProjectCard): void {
    const select = container.createEl('select', { cls: 'kanban-rpm-status-select' });
    for (const status of this.plugin.settings.statuses) {
      select.createEl('option', { text: status.label, attr: { value: status.id } });
    }
    select.value = card.status;
    select.addEventListener('change', () => {
      void this.plugin.setCardStatus(card, select.value);
    });
  }

  private openStatusMenu(event: MouseEvent, card: ProjectCard): void {
    const menu = new Menu();
    for (const status of this.plugin.settings.statuses) {
      menu.addItem((item) => {
        item
          .setTitle(status.label)
          .setChecked(status.id === card.status)
          .onClick(() => {
            void this.plugin.setCardStatus(card, status.id);
          });
      });
    }
    menu.showAtMouseEvent(event);
  }

  private openPriorityMenu(event: MouseEvent, card: ProjectCard): void {
    const menu = new Menu();
    for (const priority of [1, 2, 3, 4, 5]) {
      menu.addItem((item) => {
        item
          .setTitle(`P${priority}`)
          .setChecked(priority === card.priority)
          .onClick(() => {
            void this.plugin.setCardPriority(card, priority);
          });
      });
    }
    menu.showAtMouseEvent(event);
  }

  private renderTimelineView(container: HTMLElement, visibleBoardCards: ProjectCard[]): void {
    this.ensureTimelineStatusFilter();
    const days = this.timelineDays();
    const timelineCards = visibleBoardCards.filter((card) => this.timelineStatusFilter.has(card.status));
    const markers = this.filterTimelineMarkers(this.collectTimelineMarkers(timelineCards, new Set(days)));
    const grouped = this.groupTimelineMarkers(markers);
    const timeline = container.createDiv({ cls: this.timelineSidebarCollapsed ? 'kanban-rpm-timeline is-sidebar-collapsed' : 'kanban-rpm-timeline' });
    this.renderTimelineSidebar(timeline, visibleBoardCards);
    const main = timeline.createDiv({ cls: 'kanban-rpm-timeline-main' });
    this.renderTimelineControls(main);

    const viewport = main.createDiv({ cls: 'kanban-rpm-timeline-viewport' });
    viewport.addEventListener('scroll', () => {
      this.rememberTimelineScroll(viewport.scrollLeft, viewport.scrollTop);
    });
    const board = viewport.createDiv({ cls: 'kanban-rpm-timeline-board' });
    this.applySurfaceZoom(board, this.timelineZoom);
    for (const day of days) {
      const column = board.createDiv({
        cls: day === todayIso() ? 'kanban-rpm-timeline-day-column is-today' : 'kanban-rpm-timeline-day-column',
      });
      column.dataset.day = day;
      const header = column.createDiv({ cls: 'kanban-rpm-timeline-day-header' });
      header.addEventListener('click', () => {
        void this.openTimelineMemoFile(day);
      });
      header.createDiv({ cls: 'kanban-rpm-timeline-day-name', text: this.timelineDayLabel(day) });
      header.createDiv({ cls: 'kanban-rpm-timeline-day-date', text: day.slice(5) });

      if (this.timelineMemoVisible) this.renderTimelineMemoSection(column, day);

      const dayGroups = grouped
        .map((group) => ({ ...group, markers: group.markers.filter((marker) => marker.date === day) }))
        .filter((group) => group.markers.length)
        .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));

      if (!dayGroups.length && !this.timelineMemoVisible) {
        column.createDiv({ cls: 'kanban-rpm-timeline-empty-day', text: 'No items' });
      } else {
        for (const group of dayGroups) {
          const section = column.createDiv({ cls: 'kanban-rpm-timeline-section' });
          const label = section.createDiv({ cls: 'kanban-rpm-timeline-section-label' });
          label.style.setProperty('--rpm-project-color', this.projectColor(group.colorKey));
          this.addProjectToken(label, group.colorKey);
          label.createSpan({ text: group.label });
          for (const marker of group.markers) this.renderTimelineMarker(section, marker);
        }
      }
    }

    if (this.timelineScrollLeft !== null) {
      setTimeout(() => {
        viewport.scrollLeft = Math.min(this.timelineScrollLeft ?? 0, Math.max(0, viewport.scrollWidth - viewport.clientWidth));
        viewport.scrollTop = Math.min(this.timelineScrollTop ?? 0, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
      }, 0);
    } else if (days.includes(this.timelineBaseDate)) {
      setTimeout(() => {
        const todayColumn = board.querySelector<HTMLElement>(`[data-day="${this.timelineBaseDate}"]`);
        todayColumn?.scrollIntoView({ block: 'nearest', inline: 'start' });
        if (this.timelineScrollTop !== null) {
          viewport.scrollTop = Math.min(this.timelineScrollTop, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
        }
      }, 0);
    }
  }

  private renderTimelineSidebar(container: HTMLElement, cards: ProjectCard[]): void {
    const sidebar = container.createDiv({ cls: 'kanban-rpm-timeline-sidebar' });
    const header = sidebar.createDiv({ cls: 'kanban-rpm-timeline-sidebar-header' });
    header.createEl('h3', { text: 'Routine' });
    header.createEl('button', { text: this.timelineSidebarCollapsed ? '>' : '<' }).addEventListener('click', () => {
      this.timelineSidebarCollapsed = !this.timelineSidebarCollapsed;
      this.render();
    });
    if (this.timelineSidebarCollapsed) {
      sidebar.addClass('is-collapsed');
      return;
    }

    const days = this.timelineDays();
    const routines = cards.flatMap((card) =>
      card.routines.map((item) => ({
        item,
        card,
        nextDate: this.nextRecurringDateInRange(item, days),
      }))
    ).filter((routine) => routine.nextDate);
    const list = sidebar.createDiv({ cls: 'kanban-rpm-timeline-routines' });
    if (!routines.length) {
      list.createDiv({ cls: 'kanban-rpm-empty', text: 'No routines yet' });
    }
    const groups = this.groupTimelineRoutines(routines);
    for (const group of groups) {
      const groupEl = list.createEl('details', { cls: 'kanban-rpm-timeline-routine-group' });
      groupEl.open = true;
      groupEl.createEl('summary', { cls: 'kanban-rpm-timeline-routine-group-title', text: `${group.label} (${group.routines.length})` });
      for (const { item, card, nextDate } of group.routines.slice(0, 8)) {
        const row = groupEl.createDiv({ cls: 'kanban-rpm-timeline-routine' });
        const open = row.createEl('button', { cls: 'kanban-rpm-timeline-routine-open' });
        open.createSpan({ cls: 'kanban-rpm-timeline-routine-text', text: item.text });
        open.createSpan({ cls: 'kanban-rpm-timeline-routine-meta', text: `${card.title} - next ${nextDate.slice(5)}` });
        open.addEventListener('click', () => {
          this.openCardPreservingTimelineScroll(card);
        });
        row.createEl('button', { cls: 'kanban-rpm-timeline-routine-done', text: 'Done' }).addEventListener('click', () => {
          void this.plugin.completeRoutine(card.path, item.text, todayIso());
        });
      }
      if (group.routines.length > 8) groupEl.createDiv({ cls: 'kanban-rpm-timeline-routine-more', text: `+${group.routines.length - 8} more` });
    }
  }

  private groupTimelineRoutines(
    routines: Array<{ item: RecurringItem; card: ProjectCard; nextDate: string }>
  ): Array<{ key: string; label: string; frequency: number; routines: Array<{ item: RecurringItem; card: ProjectCard; nextDate: string }> }> {
    const map = new Map<string, { key: string; label: string; frequency: number; routines: Array<{ item: RecurringItem; card: ProjectCard; nextDate: string }> }>();
    for (const routine of routines) {
      const key = this.recurringGroupKey(routine.item);
      const existing = map.get(key) ?? {
        key,
        label: this.recurringGroupLabel(routine.item),
        frequency: this.recurringFrequencyDays(routine.item),
        routines: [],
      };
      existing.routines.push(routine);
      map.set(key, existing);
    }
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        routines: group.routines.sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.card.title.localeCompare(b.card.title) || a.item.text.localeCompare(b.item.text)),
      }))
      .sort((a, b) => a.frequency - b.frequency || a.label.localeCompare(b.label));
  }

  private nextRecurringDateInRange(item: RecurringItem | RecurringItem['cadence'], days: string[]): string {
    if (typeof item !== 'string' && item.startDate && todayIso() < item.startDate) return '';
    if (typeof item !== 'string' && item.cadence === 'daily') {
      const today = todayIso();
      return days.includes(today) && this.isRecurringItemVisibleOnDay(today, item) && !this.isRecurringItemCompletedForOccurrence(today, item) ? today : '';
    }
    if (typeof item !== 'string') {
      const currentOccurrence = this.currentOccurrenceOnOrBefore(todayIso(), item);
      if (currentOccurrence && this.isRecurringItemCompletedForOccurrence(currentOccurrence, item)) return '';
      if (currentOccurrence && days.includes(currentOccurrence)) return currentOccurrence;
    }
    return days.find((day) => (typeof item === 'string' ? this.isRecurringVisibleOnDay(day, item) : this.isRecurringItemVisibleOnDay(day, item) && !this.isRecurringItemCompletedForOccurrence(day, item))) ?? '';
  }

  private renderTimelineControls(container: HTMLElement): void {
    if (this.isPhoneViewport()) {
      this.renderPhoneTimelineControls(container);
      return;
    }

    const controls = container.createDiv({ cls: 'kanban-rpm-timeline-controls' });
    controls.createEl('button', { text: 'Today' }).addEventListener('click', () => {
      this.resetTimelineScroll();
      this.timelineBaseDate = todayIso();
      this.timelineRangeStart = '';
      this.timelineRangeEnd = '';
      this.render();
    });
    controls.createEl('button', { text: '-7' }).addEventListener('click', () => {
      this.shiftTimelineBase(-7);
      this.render();
    });
    controls.createEl('button', { text: '+7' }).addEventListener('click', () => {
      this.shiftTimelineBase(7);
      this.render();
    });
    const baseDate = controls.createEl('input', {
      cls: 'kanban-rpm-timeline-date-input',
      attr: {
        type: 'date',
        value: this.timelineBaseDate,
        'aria-label': 'Timeline base date',
      },
    });
    baseDate.addEventListener('change', () => {
      const normalized = this.normalizeTimelineDate(baseDate.value);
      if (normalized) {
        this.timelineBaseDate = normalized;
        this.timelineRangeStart = '';
        this.timelineRangeEnd = '';
        this.render();
      }
    });
    const rangeStart = controls.createEl('input', {
      cls: 'kanban-rpm-timeline-date-input',
      attr: {
        type: 'date',
        value: this.timelineRangeStart,
        'aria-label': 'Timeline range start',
      },
    });
    const rangeEnd = controls.createEl('input', {
      cls: 'kanban-rpm-timeline-date-input',
      attr: {
        type: 'date',
        value: this.timelineRangeEnd,
        'aria-label': 'Timeline range end',
      },
    });
    const applyRange = controls.createEl('button', { text: 'Apply range' });
    applyRange.addEventListener('click', () => {
      const start = this.normalizeTimelineDate(rangeStart.value);
      const end = this.normalizeTimelineDate(rangeEnd.value);
      if (start && end && start <= end) {
        this.timelineRangeStart = start;
        this.timelineRangeEnd = end;
        this.timelineBaseDate = start;
        this.render();
      }
    });
    controls
      .createEl('button', { text: this.timelineMemoVisible ? 'Hide Memo' : 'Show Memo' })
      .addEventListener('click', () => {
        this.timelineMemoVisible = !this.timelineMemoVisible;
        this.render();
      });

    const search = controls.createEl('input', {
      cls: 'kanban-rpm-timeline-search',
      attr: {
        type: 'search',
        placeholder: 'Timeline search',
        value: this.timelineSearchQuery,
      },
    });
    search.addEventListener('input', () => {
      this.timelineSearchQuery = search.value;
      this.render();
    });

    const scope = controls.createEl('select', { cls: 'kanban-rpm-timeline-scope' });
    for (const [value, label] of [
      ['all', 'Show: All markers'],
      ['review', 'Show: Review'],
      ['scheduled', 'Show: Scheduled'],
      ['tasks', 'Show: Tasks'],
      ['recurring', 'Show: Recurring'],
    ] as Array<[TimelineScope, string]>) {
      scope.createEl('option', { text: label, attr: { value } });
    }
    scope.value = this.timelineScope;
    scope.addEventListener('change', () => {
      this.timelineScope = scope.value as TimelineScope;
      this.render();
    });
    this.renderZoomControls(controls, this.timelineZoom, async (zoom) => {
      this.timelineZoom = zoom;
      this.plugin.settings.timelineZoom = zoom;
      await this.plugin.saveSettings();
      this.render();
    });

    const statusWrap = controls.createEl('details', { cls: 'kanban-rpm-timeline-status-filter' });
    statusWrap.createEl('summary', { text: `Statuses: ${this.timelineStatusFilter.size}` });
    const statusList = statusWrap.createDiv({ cls: 'kanban-rpm-timeline-status-list' });
    for (const status of this.plugin.settings.statuses) {
      const label = statusList.createEl('label');
      const checkbox = label.createEl('input', { attr: { type: 'checkbox' } });
      checkbox.checked = this.timelineStatusFilter.has(status.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) this.timelineStatusFilter.add(status.id);
        else this.timelineStatusFilter.delete(status.id);
        this.plugin.settings.timelineStatusFilter = Array.from(this.timelineStatusFilter);
        void this.plugin.saveSettings();
        this.render();
      });
      label.createSpan({ text: status.label });
    }
  }

  private renderPhoneTimelineControls(container: HTMLElement): void {
    const controls = container.createDiv({ cls: 'kanban-rpm-timeline-controls kanban-rpm-phone-timeline-controls' });
    const primary = controls.createDiv({ cls: 'kanban-rpm-phone-timeline-primary' });
    primary
      .createEl('button', {
        cls: 'kanban-rpm-phone-routine-toggle',
        text: this.timelineSidebarCollapsed ? 'Routine >' : 'Routine <',
        attr: { 'aria-expanded': String(!this.timelineSidebarCollapsed) },
      })
      .addEventListener('click', () => {
        this.timelineSidebarCollapsed = !this.timelineSidebarCollapsed;
        this.render();
    });
    primary.createEl('button', { text: 'Today' }).addEventListener('click', () => {
      this.resetTimelineScroll();
      this.timelineBaseDate = todayIso();
      this.timelineRangeStart = '';
      this.timelineRangeEnd = '';
      this.render();
    });
    primary.createEl('button', { text: '-7' }).addEventListener('click', () => {
      this.shiftTimelineBase(-7);
      this.render();
    });
    primary.createEl('button', { text: '+7' }).addEventListener('click', () => {
      this.shiftTimelineBase(7);
      this.render();
    });
    primary
      .createEl('button', { text: this.timelineMemoVisible ? 'Memo on' : 'Memo off' })
      .addEventListener('click', () => {
        this.timelineMemoVisible = !this.timelineMemoVisible;
        this.render();
      });
    primary
      .createEl('button', {
        cls: this.phoneTimelineControlsExpanded ? 'kanban-rpm-panel-toggle is-active' : 'kanban-rpm-panel-toggle',
        text: this.phoneTimelineControlsExpanded ? 'Less' : 'More',
        attr: { 'aria-expanded': String(this.phoneTimelineControlsExpanded) },
      })
      .addEventListener('click', () => {
        this.phoneTimelineControlsExpanded = !this.phoneTimelineControlsExpanded;
        this.render();
      });

    if (!this.phoneTimelineControlsExpanded) return;

    const secondary = controls.createDiv({ cls: 'kanban-rpm-phone-timeline-secondary' });
    const baseDate = secondary.createEl('input', {
      cls: 'kanban-rpm-timeline-date-input',
      attr: {
        type: 'date',
        value: this.timelineBaseDate,
        'aria-label': 'Timeline base date',
      },
    });
    baseDate.addEventListener('change', () => {
      const normalized = this.normalizeTimelineDate(baseDate.value);
      if (normalized) {
        this.resetTimelineScroll();
        this.timelineBaseDate = normalized;
        this.timelineRangeStart = '';
        this.timelineRangeEnd = '';
        this.render();
      }
    });
    const rangeStart = secondary.createEl('input', {
      cls: 'kanban-rpm-timeline-date-input',
      attr: {
        type: 'date',
        value: this.timelineRangeStart,
        'aria-label': 'Timeline range start',
      },
    });
    const rangeEnd = secondary.createEl('input', {
      cls: 'kanban-rpm-timeline-date-input',
      attr: {
        type: 'date',
        value: this.timelineRangeEnd,
        'aria-label': 'Timeline range end',
      },
    });
    secondary.createEl('button', { text: 'Apply' }).addEventListener('click', () => {
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

    const search = secondary.createEl('input', {
      cls: 'kanban-rpm-timeline-search',
      attr: {
        type: 'search',
        placeholder: 'Search',
        value: this.timelineSearchQuery,
      },
    });
    search.addEventListener('input', () => {
      this.timelineSearchQuery = search.value;
      this.render();
    });

    const scope = secondary.createEl('select', { cls: 'kanban-rpm-timeline-scope' });
    for (const [value, label] of [
      ['all', 'All'],
      ['review', 'Review'],
      ['scheduled', 'Scheduled'],
      ['tasks', 'Tasks'],
      ['recurring', 'Recurring'],
    ] as Array<[TimelineScope, string]>) {
      scope.createEl('option', { text: label, attr: { value } });
    }
    scope.value = this.timelineScope;
    scope.addEventListener('change', () => {
      this.timelineScope = scope.value as TimelineScope;
      this.render();
    });
    this.renderZoomControls(secondary, this.timelineZoom, async (zoom) => {
      this.timelineZoom = zoom;
      this.plugin.settings.timelineZoom = zoom;
      await this.plugin.saveSettings();
      this.render();
    });

    const statusWrap = secondary.createEl('details', { cls: 'kanban-rpm-timeline-status-filter' });
    statusWrap.createEl('summary', { text: `Statuses ${this.timelineStatusFilter.size}` });
    const statusList = statusWrap.createDiv({ cls: 'kanban-rpm-timeline-status-list' });
    for (const status of this.plugin.settings.statuses) {
      const label = statusList.createEl('label');
      const checkbox = label.createEl('input', { attr: { type: 'checkbox' } });
      checkbox.checked = this.timelineStatusFilter.has(status.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) this.timelineStatusFilter.add(status.id);
        else this.timelineStatusFilter.delete(status.id);
        this.plugin.settings.timelineStatusFilter = Array.from(this.timelineStatusFilter);
        void this.plugin.saveSettings();
        this.render();
      });
      label.createSpan({ text: status.label });
    }
  }

  private renderTimelineMemoSection(container: HTMLElement, day: string): void {
    const section = container.createDiv({ cls: 'kanban-rpm-timeline-section kanban-rpm-timeline-memo-section' });
    const header = section.createDiv({ cls: 'kanban-rpm-timeline-section-label' });
    header.createSpan({ text: 'Memo' });
    const controls = header.createDiv({ cls: 'kanban-rpm-timeline-memo-controls' });
    const list = section.createDiv({ cls: 'kanban-rpm-timeline-memo-list' });
    controls.createEl('button', { text: '+ todo' }).addEventListener('click', () => {
      void this.openTimelineMemoModal(day, 'todo');
    });
    controls.createEl('button', { text: '+ text' }).addEventListener('click', () => {
      void this.openTimelineMemoModal(day, 'text');
    });

    void this.readTimelineMemo(day).then((memo) => {
      list.empty();
      const items = this.parseTimelineMemoItems(memo);
      if (!items.length) {
        list.createDiv({ cls: 'kanban-rpm-timeline-memo-empty', text: 'No memo yet' });
        return;
      }
      this.renderTimelineMemoItem(list, day, memo, items[0]);
    });
  }

  private renderTimelineMemoItem(container: HTMLElement, day: string, memo: string, item: TimelineMemoItem): void {
    const row = container.createDiv({ cls: 'kanban-rpm-timeline-memo-card' });
    const body = row.createDiv({ cls: 'kanban-rpm-timeline-memo-preview' });
    this.renderMiniMarkdown(body, item.content, (lineIndex, done) => {
      void this.toggleTimelineMemoCheckbox(day, item.content, lineIndex, done);
    });
    const edit = this.createIconButton(row, 'pencil', 'Edit memo');
    edit.addEventListener('click', () => {
      void this.openTimelineMemoModal(day);
    });
  }

  private parseTimelineMemoItems(memo: string): TimelineMemoItem[] {
    const content = memo.trimEnd();
    return content ? [{ content }] : [];
  }

  private async toggleTimelineMemoCheckbox(day: string, memo: string, lineIndex: number, done: boolean): Promise<void> {
    const lines = memo.split(/\r?\n/);
    const match = lines[lineIndex]?.match(/^(\s*[-*]\s+\[)[ xX](\]\s+.*)$/);
    if (!match) return;
    lines[lineIndex] = `${match[1]}${done ? 'x' : ' '}${match[2]}`;
    await this.saveTimelineMemo(day, lines.join('\n'));
    this.render();
  }

  private async openTimelineMemoModal(day: string, seed?: 'todo' | 'text'): Promise<void> {
    const memo = await this.readTimelineMemo(day);
    const initial = this.seedTimelineMemo(memo, seed);
    new TimelineMemoModal(this.app, day, initial, async (value) => {
      await this.saveTimelineMemo(day, value);
      this.render();
    }).open();
  }

  private seedTimelineMemo(memo: string, seed?: 'todo' | 'text'): string {
    if (!seed) return memo;
    const trimmed = memo.trimEnd();
    const addition = seed === 'todo' ? '- [ ] ' : '';
    if (!trimmed) return addition;
    return `${trimmed}\n${addition}`;
  }

  private renderMiniMarkdown(container: HTMLElement, markdown: string, onCheckbox: (lineIndex: number, done: boolean) => void): void {
    const lines = markdown.split(/\r?\n/);
    let list: HTMLElement | null = null;
    for (const [lineIndex, line] of lines.entries()) {
      if (!line.trim()) {
        list = null;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        list = null;
        const level = Math.min(6, heading[1].length + 3);
        container.createEl(`h${level}` as keyof HTMLElementTagNameMap, { text: heading[2] });
        continue;
      }

      const checkbox = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (checkbox) {
        list = null;
        const done = checkbox[1].toLowerCase() === 'x';
        const row = container.createEl('label', { cls: done ? 'kanban-rpm-timeline-memo-checkbox is-done' : 'kanban-rpm-timeline-memo-checkbox' });
        const input = row.createEl('input', { attr: { type: 'checkbox' } });
        input.checked = done;
        input.addEventListener('change', () => onCheckbox(lineIndex, input.checked));
        row.createSpan({ text: checkbox[2] });
        continue;
      }

      const bullet = line.match(/^\s*[-*]\s+(.+)$/);
      if (bullet) {
        if (!list) list = container.createEl('ul');
        list.createEl('li', { text: bullet[1] });
        continue;
      }

      list = null;
      container.createEl('p', { text: line });
    }
  }

  private renderTimelineMarker(container: HTMLElement, marker: TimelineMarker): void {
    if (marker.kind === 'recurring') {
      this.renderRecurringTimelineChip(container, marker);
      return;
    }
    if (marker.kind === 'task') {
      this.renderTaskTimelineChip(container, marker);
      return;
    }

    const item = container.createDiv({
      cls: `kanban-rpm-timeline-marker kanban-rpm-timeline-marker-${marker.kind} kanban-rpm-type-${marker.card.type.replace('_', '-')}`,
      attr: { title: `${marker.card.title} - ${marker.label}` },
    });
    item.style.setProperty('--rpm-project-color', this.projectColor(marker.card.colorKey));
    const titleRow = item.createDiv({ cls: 'kanban-rpm-timeline-marker-title-row' });
    titleRow.createSpan({ cls: 'kanban-rpm-timeline-marker-icon', text: this.timelineMarkerIcon(marker.kind) });
    const label = titleRow.createEl('button', { cls: 'kanban-rpm-timeline-marker-title', text: marker.label });
    label.addEventListener('click', () => {
      this.openCardPreservingTimelineScroll(marker.card);
    });
    if (marker.card.nextAction) {
      item.createDiv({ cls: 'kanban-rpm-timeline-marker-focus', text: marker.card.nextAction });
    }
    const meta = item.createDiv({ cls: 'kanban-rpm-timeline-marker-meta' });
    const badges = meta.createDiv({ cls: 'kanban-rpm-timeline-marker-badges' });
    this.renderStatusBadge(badges, marker.card.status, undefined, 'button').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openStatusMenu(event, marker.card);
    });
    this.renderPriorityBadge(badges, marker.card, 'button').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openPriorityMenu(event, marker.card);
    });
    const actions = meta.createDiv({ cls: 'kanban-rpm-timeline-marker-actions-menu' });
    this.createIconButton(actions, 'pencil', `Edit ${marker.card.title}`, 'kanban-rpm-timeline-marker-edit').addEventListener('click', (event) => {
      event.stopPropagation();
      new EditProjectCardModal(this.app, this.plugin, marker.card).open();
    });
    this.renderCardMoreMenu(actions, marker.card, 'kanban-rpm-timeline-card-more');
    const smallActions = this.getTimelineCardSmallActions(marker.card);
    if (smallActions.length) {
      const list = item.createDiv({ cls: 'kanban-rpm-timeline-marker-actions' });
      const openActions = smallActions.filter((action) => !action.done);
      const doneActions = smallActions.filter((action) => action.done);
      this.renderSmallActionSection(list, marker.card, 'open', `Open: ${openActions.length}`, openActions, true);
      this.renderSmallActionSection(list, marker.card, 'done', `Done: ${doneActions.length}`, doneActions, false);
    }
  }

  private renderTaskTimelineChip(container: HTMLElement, marker: TimelineMarker): void {
    const action = marker.action;
    const chip = container.createDiv({
      cls: `kanban-rpm-timeline-task-chip kanban-rpm-type-${marker.card.type.replace('_', '-')}`,
      attr: { title: `${marker.card.title} - ${marker.label}` },
    });
    chip.style.setProperty('--rpm-project-color', this.projectColor(marker.card.colorKey));
    if (action) {
      const checkbox = chip.createEl('input', { attr: { type: 'checkbox', 'aria-label': `Complete ${action.text}` } });
      checkbox.checked = action.done;
      checkbox.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      checkbox.addEventListener('change', () => {
        void this.plugin.toggleSmallAction(action);
      });
    } else {
      chip.createSpan({ cls: 'kanban-rpm-timeline-task-icon', text: '?' });
    }
    const text = chip.createDiv({ cls: 'kanban-rpm-timeline-task-text' });
    text.createEl('button', { cls: 'kanban-rpm-timeline-task-title', text: marker.label }).addEventListener('click', () => {
      this.openCardPreservingTimelineScroll(marker.card);
    });
    const sourceRow = text.createDiv({ cls: 'kanban-rpm-timeline-task-source-row' });
    sourceRow.createSpan({ cls: 'kanban-rpm-timeline-task-source', text: marker.card.title });
    if (action) {
      this.createIconButton(sourceRow, 'pencil', `Edit small action metadata for ${action.text}`, 'kanban-rpm-timeline-task-edit').addEventListener('click', (event) => {
        event.stopPropagation();
        new SmallActionMetadataModal(this.app, action, (values) => this.plugin.updateSmallActionMetadata(action, values)).open();
      });
      if (action.dueDate) {
        text.createSpan({ cls: isPastDate(action.dueDate) ? 'kanban-rpm-timeline-task-due is-overdue' : 'kanban-rpm-timeline-task-due', text: `due ${this.shortDateLabel(action.dueDate)}` });
      }
    }
  }

  private renderRecurringTimelineChip(container: HTMLElement, marker: TimelineMarker): void {
    const chip = container.createEl('button', {
      cls: `kanban-rpm-timeline-recurring-chip kanban-rpm-type-${marker.card.type.replace('_', '-')}`,
      attr: { title: `${marker.card.title} - ${marker.label}` },
    });
    chip.style.setProperty('--rpm-project-color', this.projectColor(marker.card.colorKey));
    chip.createSpan({ cls: 'kanban-rpm-timeline-recurring-icon', text: '?' });
    chip.createSpan({ cls: 'kanban-rpm-timeline-recurring-text', text: marker.label.replace(/^(daily|weekly|monthly|custom):\s*/, '') });
    chip.addEventListener('click', () => {
      this.openCardPreservingTimelineScroll(marker.card);
    });
  }

  private collectTimelineMarkers(cards: ProjectCard[], daySet: Set<string>): TimelineMarker[] {
    const markers: TimelineMarker[] = [];
    for (const card of cards) {
      if (card.scheduledDate && daySet.has(card.scheduledDate)) {
        markers.push({ date: card.scheduledDate, label: card.title, kind: 'scheduled', card });
      }
      if (card.nextReview && daySet.has(card.nextReview)) {
        markers.push({ date: card.nextReview, label: card.title, kind: 'review', card });
      }
      for (const action of card.smallActions) {
        if (action.done) continue;
        const date = action.scheduledDate || action.dueDate;
        if (date && date === card.scheduledDate) continue;
        if (date && daySet.has(date)) {
          markers.push({ date, label: action.text, kind: 'task', card, action });
        }
      }
      if (card.routines.length) {
        for (const day of daySet) {
          for (const item of card.routines) {
            if (item.cadence === 'daily' && day !== todayIso()) continue;
            if (this.isRecurringItemVisibleOnDay(day, item)) {
              if (this.isRecurringItemCompletedForOccurrence(day, item)) continue;
              markers.push({ date: day, label: `${item.cadence}: ${item.text}`, kind: 'recurring', card });
            }
          }
        }
      }
    }
    return markers.sort((a, b) => this.compareTimelineMarkers(a, b));
  }

  private compareTimelineMarkers(a: TimelineMarker, b: TimelineMarker): number {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;

    const priorityDiff = this.timelineMarkerPriority(a) - this.timelineMarkerPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const cardPriorityDiff = (a.card.priority || 3) - (b.card.priority || 3);
    if (cardPriorityDiff !== 0) return cardPriorityDiff;

    const kindDiff = this.timelineMarkerKindRank(a.kind) - this.timelineMarkerKindRank(b.kind);
    if (kindDiff !== 0) return kindDiff;

    return `${a.card.title} ${a.label}`.localeCompare(`${b.card.title} ${b.label}`, undefined, { sensitivity: 'base' });
  }

  private timelineMarkerPriority(marker: TimelineMarker): number {
    if (marker.action) return this.smallActionPriorityRank(marker.action.priority);
    return marker.card.priority || 3;
  }

  private smallActionPriorityRank(priority: SmallAction['priority']): number {
    if (priority === 'highest') return 1;
    if (priority === 'high') return 2;
    if (priority === 'low') return 4;
    if (priority === 'lowest') return 5;
    return 3;
  }

  private timelineMarkerKindRank(kind: TimelineMarker['kind']): number {
    if (kind === 'scheduled') return 0;
    if (kind === 'task') return 1;
    if (kind === 'review') return 2;
    return 3;
  }

  private timelineMarkerIcon(kind: TimelineMarker['kind']): string {
    if (kind === 'scheduled') return 'S';
    if (kind === 'review') return 'R';
    if (kind === 'task') return 'T';
    return 'R';
  }

  private filterTimelineMarkers(markers: TimelineMarker[]): TimelineMarker[] {
    const query = this.timelineSearchQuery.trim().toLowerCase();
    return markers.filter((marker) => {
      if (this.timelineScope !== 'all' && marker.kind !== this.timelineScope && !(this.timelineScope === 'tasks' && marker.kind === 'task')) {
        return false;
      }
      if (!query) return true;
      return [marker.label, marker.card.title, marker.card.breadcrumb, marker.card.workstreamType]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  private groupTimelineMarkers(markers: TimelineMarker[]): Array<{ label: string; colorKey: string; priority: number; markers: TimelineMarker[] }> {
    const map = new Map<string, { label: string; colorKey: string; priority: number; markers: TimelineMarker[] }>();
    for (const marker of markers) {
      const project = this.projectFilter || marker.card.projectTitle || marker.card.projectTitles[0] || 'No project';
      const subproject = this.subprojectFilter || marker.card.subprojectTitle || marker.card.subprojectTitles[0] || '';
      const priority = this.timelineMarkerPriority(marker);
      const label = [project, subproject].filter(Boolean).join(' > ');
      const key = `${priority}>${project}>${subproject}`;
      const existing = map.get(key) ?? {
        label,
        colorKey: marker.card.colorKey || marker.card.projectTitle || label,
        priority,
        markers: [],
      };
      existing.markers.push(marker);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
  }

  private ensureTimelineStatusFilter(): void {
    const valid = new Set(this.plugin.settings.statuses.map((status) => status.id));
    this.timelineStatusFilter = new Set(Array.from(this.timelineStatusFilter).filter((status) => valid.has(status)));
    if (!this.timelineStatusFilter.size) {
      this.timelineStatusFilter = new Set(this.plugin.settings.timelineStatusFilter.filter((status) => valid.has(status)));
    }
    if (this.timelineStatusFilter.size) return;
    const activeStatus = this.plugin.settings.statuses.find((status) => status.id === 'active')?.id ?? this.plugin.settings.statuses[0]?.id;
    if (activeStatus) this.timelineStatusFilter.add(activeStatus);
  }

  private ensureBoardStatusFilter(): void {
    const valid = new Set(this.plugin.settings.statuses.map((status) => status.id));
    this.boardStatusFilter = new Set(Array.from(this.boardStatusFilter).filter((status) => valid.has(status)));
    if (!this.boardStatusFilter.size) {
      this.boardStatusFilter = new Set(this.plugin.settings.boardStatusFilter.filter((status) => valid.has(status)));
    }
    if (this.boardStatusFilter.size) return;
    this.boardStatusFilter = new Set(this.plugin.settings.statuses.map((status) => status.id));
  }

  private ensureBoardStatusOrder(): void {
    const statusIds = this.plugin.settings.statuses.map((status) => status.id);
    const valid = new Set(statusIds);
    const current = this.plugin.settings.boardStatusOrder.filter((status) => valid.has(status));
    const missing = statusIds.filter((status) => !current.includes(status));
    const next = [...current, ...missing];
    this.plugin.settings.boardStatusOrder = next;
  }

  private orderedBoardStatuses(): Lane[] {
    this.ensureBoardStatusOrder();
    const byId = new Map(this.plugin.settings.statuses.map((status) => [status.id, status]));
    return this.plugin.settings.boardStatusOrder.map((id) => byId.get(id)).filter((status): status is Lane => Boolean(status));
  }

  private async moveBoardStatus(statusId: string, direction: -1 | 1): Promise<void> {
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

  private ensureViewFilters(): boolean {
    let changed = false;
    const projectValues = new Set(this.uniqueValues('projectTitle'));
    if (this.projectFilter && !projectValues.has(this.projectFilter)) {
      this.projectFilter = '';
      this.subprojectFilter = '';
      changed = true;
    }

    const subprojectValues = new Set(this.subprojectFilterValues());
    if (this.subprojectFilter && !subprojectValues.has(this.subprojectFilter)) {
      this.subprojectFilter = '';
      changed = true;
    }

    const categoryValues = new Set(this.uniqueCategoryValues().map((category) => category.id));
    if (this.workstreamTypeFilter && !categoryValues.has(this.workstreamTypeFilter)) {
      this.workstreamTypeFilter = '';
      changed = true;
    }

    return changed;
  }

  private loadViewFilters(mode: ViewMode): void {
    const filters = this.plugin.settings.viewFilters[mode] ?? this.plugin.settings.viewFilters.board;
    this.projectFilter = filters.project;
    this.subprojectFilter = filters.subproject;
    this.workstreamTypeFilter = filters.category;
  }

  private async saveViewFilters(): Promise<void> {
    this.plugin.settings.viewFilters[this.viewMode] = {
      project: this.projectFilter,
      subproject: this.subprojectFilter,
      category: this.workstreamTypeFilter,
    };
    if (this.viewMode === 'board') {
      this.plugin.settings.boardProjectFilter = this.projectFilter;
      this.plugin.settings.boardSubprojectFilter = this.subprojectFilter;
      this.plugin.settings.boardCategoryFilter = this.workstreamTypeFilter;
    }
    await this.plugin.saveSettings();
  }

  private timelineDays(): string[] {
    const start = this.timelineRangeStart || addDays(this.timelineBaseDate, -7);
    const end = this.timelineRangeEnd || addDays(this.timelineBaseDate, 7);
    return dateRange(start, end);
  }

  private shiftTimelineBase(days: number): void {
    this.resetTimelineScroll();
    this.timelineBaseDate = addDays(this.timelineBaseDate, days);
    this.timelineRangeStart = '';
    this.timelineRangeEnd = '';
  }

  private resetTimelineScroll(): void {
    this.timelineScrollLeft = null;
    this.timelineScrollTop = null;
    this.plugin.settings.timelineScrollLeft = null;
    this.plugin.settings.timelineScrollTop = null;
    void this.plugin.saveSettings();
  }

  private rememberTimelineScroll(scrollLeft: number, scrollTop: number): void {
    const nextLeft = Math.max(0, Math.round(scrollLeft));
    const nextTop = Math.max(0, Math.round(scrollTop));
    this.timelineScrollLeft = nextLeft;
    this.timelineScrollTop = nextTop;
    this.plugin.settings.timelineScrollLeft = nextLeft;
    this.plugin.settings.timelineScrollTop = nextTop;
    this.scheduleTimelineScrollSave();
  }

  private preserveTimelineScrollFromDom(): void {
    const viewport = this.containerEl.querySelector<HTMLElement>('.kanban-rpm-timeline-viewport');
    if (!viewport) return;
    this.rememberTimelineScroll(viewport.scrollLeft, viewport.scrollTop);
    void this.plugin.saveSettings();
  }

  private openCardPreservingTimelineScroll(card: ProjectCard): void {
    if (this.viewMode === 'timeline') this.preserveTimelineScrollFromDom();
    void this.plugin.openCard(card);
  }

  private scheduleTimelineScrollSave(): void {
    if (this.timelineScrollSaveTimer !== undefined) window.clearTimeout(this.timelineScrollSaveTimer);
    this.timelineScrollSaveTimer = window.setTimeout(() => {
      this.timelineScrollSaveTimer = undefined;
      void this.plugin.saveSettings();
    }, 400);
  }

  private ganttMonthSegments(start: string, end: string): GanttSegment[] {
    return monthRange(start, end).map((month) => ({
      key: month,
      label: this.ganttMonthLabel(month),
      start: `${month}-01`,
      end: endOfMonth(`${month}-01`),
    })).map((segment) => ({
      ...segment,
      start: segment.start < start ? start : segment.start,
      end: segment.end > end ? end : segment.end,
    }));
  }

  private ganttWeekSegments(start: string, end: string): GanttSegment[] {
    const segments: GanttSegment[] = [];
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
            end: segmentEnd > end ? end : segmentEnd,
          });
        }
        cursor = addDays(segmentEnd, 1);
        index += 1;
      }
    }
    return segments;
  }

  private ganttQuarterSegments(start: string, end: string): GanttSegment[] {
    const segments: GanttSegment[] = [];
    const first = new Date(`${start.slice(0, 7)}-01T00:00:00`);
    first.setMonth(Math.floor(first.getMonth() / 3) * 3);
    const last = new Date(`${end.slice(0, 7)}-01T00:00:00`);
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
        end: quarterEnd > end ? end : quarterEnd,
      });
      if (segments.length > 24) break;
    }
    return segments;
  }

  private ganttMonthLabel(month: string): string {
    const date = new Date(`${month}-01T00:00:00`);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  private normalizeTimelineDate(value: string): string {
    const normalized = value.trim().replace(/[./]/g, '-');
    return isIsoDate(normalized) ? normalized : '';
  }

  private toDisplayDate(value: string): string {
    return value ? value.replace(/-/g, '.') : '';
  }

  private timelineDayLabel(day: string): string {
    const date = new Date(`${day}T00:00:00`);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isRecurringVisibleOnDay(day: string, cadence: 'daily' | 'weekly' | 'monthly' | 'custom'): boolean {
    if (cadence === 'daily') return true;
    const date = new Date(`${day}T00:00:00`);
    const base = new Date(`${this.timelineBaseDate}T00:00:00`);
    if (cadence === 'weekly') return date.getDay() === base.getDay();
    if (cadence === 'custom') return false;
    return date.getDate() === base.getDate();
  }

  private isRecurringItemVisibleOnDay(day: string, item: RecurringItem): boolean {
    const start = item.startDate;
    if (!start) return false;
    if (day < start) return false;
    if (item.cadence === 'daily') return true;
    const startDate = new Date(`${start}T00:00:00`);
    const current = new Date(`${day}T00:00:00`);
    if (item.cadence === 'weekly') return current.getDay() === startDate.getDay();
    if (item.cadence === 'monthly') return current.getDate() === startDate.getDate();
    if (item.unit === 'day') {
      const diff = Math.floor((current.getTime() - startDate.getTime()) / 86400000);
      return diff >= 0 && diff % Math.max(1, item.interval) === 0;
    }
    if (item.unit === 'week') {
      const diff = Math.floor((current.getTime() - startDate.getTime()) / 86400000);
      return diff >= 0 && diff % (Math.max(1, item.interval) * 7) === 0;
    }
    if (current.getDate() !== startDate.getDate()) return false;
    const monthDiff = (current.getFullYear() - startDate.getFullYear()) * 12 + current.getMonth() - startDate.getMonth();
    return monthDiff >= 0 && monthDiff % Math.max(1, item.interval) === 0;
  }

  private isRecurringItemCompletedForOccurrence(day: string, item: RecurringItem): boolean {
    const next = this.nextOccurrenceAfter(day, item);
    return item.completedDates.some((completed) => completed >= day && (!next || completed < next));
  }

  private currentOccurrenceOnOrBefore(day: string, item: RecurringItem): string {
    if (item.startDate && item.startDate > day) return '';
    for (let offset = 0; offset <= 370; offset += 1) {
      const candidate = addDays(day, -offset);
      if (item.startDate && candidate < item.startDate) return '';
      if (this.isRecurringItemVisibleOnDay(candidate, item)) return candidate;
    }
    return '';
  }

  private nextOccurrenceAfter(day: string, item: RecurringItem): string {
    for (let offset = 1; offset <= 370; offset += 1) {
      const candidate = addDays(day, offset);
      if (this.isRecurringItemVisibleOnDay(candidate, item)) return candidate;
    }
    return '';
  }

  private recurringGroupKey(item: RecurringItem): string {
    if (item.cadence !== 'custom') return item.cadence;
    return `${item.interval}${item.unit}`;
  }

  private recurringGroupLabel(item: RecurringItem): string {
    if (item.cadence === 'daily') return 'Daily';
    if (item.cadence === 'weekly') return 'Weekly';
    if (item.cadence === 'monthly') return 'Monthly';
    const unit = item.unit === 'day' ? 'D' : item.unit === 'week' ? 'W' : 'M';
    return `Every ${item.interval}${unit}`;
  }

  private recurringFrequencyDays(item: RecurringItem): number {
    if (item.cadence === 'daily') return 1;
    if (item.cadence === 'weekly') return 7;
    if (item.cadence === 'monthly') return 30;
    if (item.unit === 'day') return item.interval;
    if (item.unit === 'week') return item.interval * 7;
    return item.interval * 30;
  }

  private async readTimelineMemo(day: string): Promise<string> {
    const file = await this.ensureTimelineMemoFile(day);
    if (!file) return '';
    const content = await this.app.vault.read(file);
    return this.extractMemoBody(content);
  }

  private async saveTimelineMemo(day: string, memo: string): Promise<void> {
    const file = await this.ensureTimelineMemoFile(day, true);
    if (!file) return;
    const content = await this.app.vault.read(file);
    const next = this.replaceMemoBody(content, memo);
    if (next !== content) await this.app.vault.modify(file, next);
  }

  private async openTimelineMemoFile(day: string): Promise<void> {
    this.preserveTimelineScrollFromDom();
    const file = await this.ensureTimelineMemoFile(day, true);
    if (file) await this.app.workspace.getLeaf(false).openFile(file);
  }

  private async ensureTimelineMemoFile(day: string, create = false): Promise<TFile | null> {
    await this.plugin.ensureWorkspace();
    const folder = normalizePath(`${this.plugin.workspaceFolder}/timeline`);
    if (create && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    const path = normalizePath(`${folder}/${day}.md`);
    let file: TFile | null = null;
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) file = existing;
    if (!(file instanceof TFile) && create) {
      file = await this.app.vault.create(path, `# ${day} Timeline Memo\n\n## Memo\n\n## Notes\n`);
    }
    return file;
  }

  private extractMemoBody(content: string): string {
    const section = this.findMarkdownSection(content, 'Memo', 2);
    if (!section) return '';
    return section.bodyLines.join('\n').trimEnd();
  }

  private replaceMemoBody(content: string, memo: string): string {
    const normalized = memo.trimEnd();
    const lines = content.split(/\r?\n/);
    const section = this.findMarkdownSection(content, 'Memo', 2);
    const replacement = ['## Memo', '', ...normalized.split('\n').filter((_, index, array) => normalized || index < array.length - 1)];
    if (normalized) replacement.push('');

    if (!section) {
      const prefix = content.trimEnd();
      return `${prefix}${prefix ? '\n\n' : ''}${replacement.join('\n')}`;
    }

    const next = [...lines.slice(0, section.headingLine), ...replacement, ...lines.slice(section.endLine)];
    return next.join('\n').replace(/\n{4,}/g, '\n\n\n');
  }

  private findMarkdownSection(
    content: string,
    title: string,
    level: number
  ): { headingLine: number; endLine: number; bodyLines: string[] } | null {
    const lines = content.split(/\r?\n/);
    const headingPattern = new RegExp(`^#{${level}}\\s+${this.escapeRegex(title)}\\s*$`, 'i');
    const anyHeadingPattern = /^(#{1,6})\s+\S/;
    const headingLine = lines.findIndex((line) => headingPattern.test(line.trimEnd()));
    if (headingLine < 0) return null;

    let bodyStart = headingLine + 1;
    if (lines[bodyStart] === '') bodyStart += 1;

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
      bodyLines: lines.slice(bodyStart, endLine),
    };
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private sortTableCards(cards: ProjectCard[]): ProjectCard[] {
    const sorted = [...cards].sort((a, b) => {
      const aValue = this.tableSortValue(a, this.tableSortKey);
      const bValue = this.tableSortValue(b, this.tableSortKey);
      const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return result || compareCards(a, b);
    });
    if (this.tableSortDirection === 'desc') sorted.reverse();
    return sorted;
  }

  private renderPhoneSortBar(container: HTMLElement): void {
    const bar = container.createDiv({ cls: 'kanban-rpm-phone-sortbar' });
    const sort = bar.createEl('select', { attr: { 'aria-label': 'Sort cards' } });
    for (const column of TABLE_COLUMNS) {
      sort.createEl('option', { value: column.key, text: column.label });
    }
    sort.value = this.tableSortKey;
    sort.addEventListener('change', () => {
      this.tableSortKey = sort.value as TableSortKey;
      this.render();
    });
    const direction = bar.createEl('button', { text: this.tableSortDirection === 'asc' ? '▲' : '▼', attr: { 'aria-label': 'Toggle sort direction' } });
    direction.addEventListener('click', () => {
      this.tableSortDirection = this.tableSortDirection === 'asc' ? 'desc' : 'asc';
      this.render();
    });
  }

  private renderPhonePlanningCard(container: HTMLElement, card: ProjectCard, context: 'table' | 'gantt'): void {
    const item = container.createDiv({ cls: `kanban-rpm-phone-planning-card kanban-rpm-type-${card.type.replace('_', '-')}` });
    item.style.setProperty('--rpm-project-color', this.projectColor(card.colorKey));
    const head = item.createDiv({ cls: 'kanban-rpm-phone-planning-head' });
    const title = head.createEl('button', { cls: 'kanban-rpm-phone-planning-title', text: card.title });
    title.addEventListener('click', () => {
      void this.plugin.openCard(card);
    });
    const actions = head.createDiv({ cls: 'kanban-rpm-card-title-actions' });
    this.renderPriorityBadge(actions, card);
    this.createIconButton(actions, 'pencil', `Edit ${card.title}`).addEventListener('click', () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    this.renderCardMoreMenu(actions, card);

    const meta = item.createDiv({ cls: 'kanban-rpm-phone-planning-meta' });
    this.renderStatusBadge(meta, card.status, undefined, 'button').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.openStatusMenu(event, card);
    });
    meta.createSpan({ text: this.cardTypeLabel(card.type) });
    if (card.breadcrumb) meta.createSpan({ text: card.breadcrumb });
    if (card.workstreamType) meta.createSpan({ text: this.categoryLabel(card.workstreamType) });

    const dates = item.createDiv({ cls: 'kanban-rpm-phone-planning-dates' });
    if (context === 'gantt') {
      const range = [card.startDate || 'No start', card.dueDate || 'No due'].join(' -> ');
      dates.createSpan({ text: range });
    }
    if (card.scheduledDate) dates.createSpan({ text: `scheduled ${card.scheduledDate}` });
    if (card.nextReview) dates.createSpan({ text: `review ${card.nextReview}` });
    if (!dates.childElementCount) dates.remove();

    const flow = card.blockedBy.length + card.precededBy.length + card.followedBy.length;
    if (flow || card.actionCount) {
      const footer = item.createDiv({ cls: 'kanban-rpm-phone-planning-footer' });
      if (flow) footer.createSpan({ text: `Flow ${flow}` });
      footer.createSpan({ text: `${card.actionCount} tasks` });
    }
  }

  private tableSortValue(card: ProjectCard, key: TableSortKey): string {
    if (key === 'title') return card.title;
    if (key === 'project') return card.breadcrumb || card.projectTitle || '';
    if (key === 'type') return card.type;
    if (key === 'status') return card.status;
    if (key === 'priority') return String(card.priority).padStart(2, '0');
    if (key === 'date') return toDateSortValue(card);
    if (key === 'dependencies') return String(card.blockedBy.length + card.precededBy.length + card.followedBy.length).padStart(3, '0');
    return String(card.actionCount).padStart(4, '0');
  }

  private cardTypeLabel(type: ProjectCard['type']): string {
    if (type === 'big_action') return 'Big Action';
    if (type === 'subproject') return 'Subproject';
    return 'Project';
  }

  private cardDateLabel(card: ProjectCard): string {
    const parts = [];
    if (card.scheduledDate) parts.push(`scheduled ${card.scheduledDate}`);
    if (card.dueDate) parts.push(`due ${card.dueDate}`);
    if (card.nextReview) parts.push(`review ${card.nextReview}`);
    return parts.join(' - ') || 'No date';
  }

  private cardDependencyLabel(card: ProjectCard): string {
    const parts = [];
    if (card.blockedBy.length) parts.push(`waiting on ${card.blockedBy.length}`);
    if (card.precededBy.length) parts.push(`preceded ${card.precededBy.length}`);
    if (card.followedBy.length) parts.push(`followed ${card.followedBy.length}`);
    return parts.join(' - ') || 'None';
  }

  private renderLane(board: HTMLElement, lane: Lane, cards: ProjectCard[], visibleLanes: Lane[]): void {
    const laneEl = board.createDiv({ cls: 'kanban-rpm-lane' });
    laneEl.dataset.status = lane.id;

    const header = laneEl.createDiv({ cls: 'kanban-rpm-lane-header' });
    header.createSpan({ cls: 'kanban-rpm-lane-title', text: lane.label });
    const laneActions = header.createDiv({ cls: 'kanban-rpm-lane-actions' });
    const laneIndex = visibleLanes.findIndex((visibleLane) => visibleLane.id === lane.id);
    const moveLeft = laneActions.createEl('button', {
      cls: 'kanban-rpm-lane-order',
      text: '<',
      attr: { 'aria-label': `Move ${lane.label} left` },
    });
    moveLeft.disabled = laneIndex <= 0;
    moveLeft.addEventListener('click', () => {
      void this.moveBoardStatus(lane.id, -1);
    });
    const moveRight = laneActions.createEl('button', {
      cls: 'kanban-rpm-lane-order',
      text: '>',
      attr: { 'aria-label': `Move ${lane.label} right` },
    });
    moveRight.disabled = laneIndex < 0 || laneIndex >= visibleLanes.length - 1;
    moveRight.addEventListener('click', () => {
      void this.moveBoardStatus(lane.id, 1);
    });
    laneActions.createSpan({ cls: 'kanban-rpm-lane-count', text: String(cards.length) });
    laneActions
      .createEl('button', {
        cls: 'kanban-rpm-lane-add',
        text: '+',
        attr: { 'aria-label': `Add card to ${lane.label}` },
      })
      .addEventListener('click', () => {
        new NewProjectCardModal(this.app, this.plugin, this.newDocumentContext(lane.id)).open();
      });

    const list = laneEl.createDiv({ cls: 'kanban-rpm-card-list' });
    if (!cards.length) {
      list.createDiv({ cls: 'kanban-rpm-empty', text: 'No cards' });
      return;
    }

    if (!this.groupByProject) {
      for (const card of cards) this.renderCard(list, card);
      return;
    }

    for (const group of this.groupCardsForCurrentFilter(cards)) {
      const groupEl = list.createDiv({ cls: 'kanban-rpm-project-group' });
      const header = groupEl.createDiv({ cls: 'kanban-rpm-project-group-header' });
      this.addProjectToken(header, group.project);
      header.createSpan({ text: group.project });
      header.createSpan({ cls: 'kanban-rpm-project-group-count', text: String(group.cards.length) });
      for (const card of group.cards) this.renderCard(groupEl, card);
    }
  }

  private renderCard(list: HTMLElement, card: ProjectCard): void {
    const cardClasses = [
      'kanban-rpm-card',
      `kanban-rpm-type-${card.type.replace('_', '-')}`,
      `kanban-rpm-card-status-${card.status}`,
      isPastDate(card.scheduledDate) || isPastDate(card.dueDate) || isPastDate(card.nextReview) ? 'kanban-rpm-card-overdue' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const cardEl = list.createDiv({ cls: cardClasses });
    cardEl.dataset.path = card.path;
    cardEl.style.setProperty('--rpm-project-color', this.projectColor(card.colorKey));
    this.attachPointerDrag(cardEl, card);
    this.renderFlowDots(cardEl, card);

    const toolbar = cardEl.createDiv({ cls: 'kanban-rpm-card-toolbar' });
    if (this.plugin.settings.cardDisplayFields.breadcrumb) {
      const context = toolbar.createDiv({ cls: 'kanban-rpm-card-context' });
      this.addProjectToken(context, card.colorKey);
      this.renderCardBreadcrumb(context, card);
    }
    const titleActions = toolbar.createDiv({ cls: 'kanban-rpm-card-title-actions' });
    if (this.plugin.settings.cardDisplayFields.priority) {
      this.renderPriorityBadge(titleActions, card);
    }
    this.createIconButton(titleActions, 'pencil', `Edit ${card.title}`).addEventListener('click', () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    this.renderCardMoreMenu(titleActions, card);

    cardEl.createEl('button', { cls: 'kanban-rpm-card-title', text: card.title }).addEventListener('click', (event) => {
      event.stopPropagation();
      void this.plugin.openCard(card);
    });

    const fields = this.plugin.settings.cardDisplayFields;
    const primaryMeta = cardEl.createDiv({ cls: 'kanban-rpm-meta kanban-rpm-card-primary-meta' });
    if (card.blockedBy.length) this.addMeta(primaryMeta, String(card.blockedBy.length), 'waiting on', 'kanban-rpm-meta-dependency');
    if (fields.category) this.addMeta(primaryMeta, this.categoryLabel(card.workstreamType), 'category', 'kanban-rpm-meta-kind');
    if (!primaryMeta.childElementCount) primaryMeta.remove();

    if (fields.currentFocus && card.nextAction) cardEl.createDiv({ cls: 'kanban-rpm-next', text: card.nextAction });
    if (fields.waiting && card.status === this.getConfiguredStatusId('waiting') && card.waitingFor) {
      cardEl.createDiv({ cls: 'kanban-rpm-next kanban-rpm-waiting', text: `Waiting: ${card.waitingFor}` });
    }
    if (fields.blockers && card.status === this.getConfiguredStatusId('blocked') && card.blocker) {
      cardEl.createDiv({ cls: 'kanban-rpm-next kanban-rpm-blocker', text: `Blocked: ${card.blocker}` });
    }
    const dateMeta = cardEl.createDiv({ cls: 'kanban-rpm-meta kanban-rpm-card-date-meta' });
    if (fields.dates) {
      this.addMeta(dateMeta, this.shortDateLabel(card.scheduledDate), 'scheduled', isPastDate(card.scheduledDate) ? 'kanban-rpm-overdue' : 'kanban-rpm-meta-date');
      this.addMeta(dateMeta, this.shortDateLabel(card.dueDate), 'due', isPastDate(card.dueDate) ? 'kanban-rpm-overdue' : 'kanban-rpm-meta-date');
      this.addMeta(dateMeta, this.shortDateLabel(card.nextReview), 'review', isPastDate(card.nextReview) ? 'kanban-rpm-overdue' : 'kanban-rpm-meta-date');
    }
    if (!dateMeta.childElementCount) dateMeta.remove();

    if (fields.smallActionSummary) this.renderSmallActions(cardEl, card);
    if (fields.dependencies || fields.sources || fields.status || fields.type) this.renderCardDetails(cardEl, card);
  }

  private renderCardMoreMenu(container: HTMLElement, card: ProjectCard, extraClass = ''): void {
    const menu = container.createEl('details', { cls: ['kanban-rpm-card-more', extraClass].filter(Boolean).join(' ') });
    menu.addEventListener('toggle', () => {
      menu.closest('.kanban-rpm-card, .kanban-rpm-timeline-marker')?.toggleClass('is-menu-open', menu.open);
    });
    const summary = menu.createEl('summary', { attr: { 'aria-label': `More actions for ${card.title}` } });
    setIcon(summary, 'ellipsis-vertical');
    const actions = menu.createDiv({ cls: 'kanban-rpm-card-more-menu' });
    actions.createEl('button', { text: 'Duplicate' }).addEventListener('click', () => {
      void this.plugin.duplicateCard(card);
      menu.removeAttribute('open');
    });
    actions.createEl('button', { text: 'Archive' }).addEventListener('click', () => {
      new ConfirmCardActionModal(this.app, {
        title: 'Archive card',
        message: `Move "${card.title}" to KanbanRPM archive?`,
        confirmText: 'Archive',
        onConfirm: () => this.plugin.archiveCard(card),
      }).open();
      menu.removeAttribute('open');
    });
    actions.createEl('button', { cls: 'mod-warning', text: 'Delete' }).addEventListener('click', () => {
      new ConfirmCardActionModal(this.app, {
        title: 'Delete card',
        message: `Move "${card.title}" to the system trash?`,
        confirmText: 'Delete',
        onConfirm: () => this.plugin.deleteCard(card),
      }).open();
      menu.removeAttribute('open');
    });
  }

  private renderFlowDots(cardEl: HTMLElement, card: ProjectCard): void {
    const incoming = cardEl.createSpan({
      cls: 'kanban-rpm-flow-dot kanban-rpm-flow-dot-in',
      attr: { title: 'Preceded by connector', 'aria-label': 'Preceded by connector' },
    });
    incoming.dataset.path = card.path;
    incoming.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    const outgoing = cardEl.createSpan({
      cls: 'kanban-rpm-flow-dot kanban-rpm-flow-dot-out',
      attr: { title: 'Followed by connector', 'aria-label': 'Followed by connector' },
    });
    outgoing.dataset.path = card.path;
    outgoing.addEventListener('pointerdown', (event) => this.startFlowConnect(event, card));
  }

  private startFlowConnect(event: PointerEvent, source: ProjectCard): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const wrap = (event.currentTarget as HTMLElement).closest('.kanban-rpm-board-wrap') as HTMLElement | null;
    const overlay = wrap?.querySelector<SVGElement>('.kanban-rpm-board-flow-overlay');
    if (!wrap || !overlay) return;
    const rect = wrap.getBoundingClientRect();
    const startX = event.clientX - rect.left + wrap.scrollLeft;
    const startY = event.clientY - rect.top + wrap.scrollTop;
    const preview = this.svgEl('path');
    preview.setAttribute('class', 'kanban-rpm-board-flow-arrow is-preview');
    preview.setAttribute('d', `M ${startX} ${startY} C ${startX + 80} ${startY}, ${startX + 80} ${startY}, ${startX} ${startY}`);
    overlay.appendChild(preview);
    this.flowConnect = { pointerId: event.pointerId, sourcePath: source.path, preview, startX, startY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent): void => {
      if (!this.flowConnect || this.flowConnect.pointerId !== moveEvent.pointerId) return;
      const endX = moveEvent.clientX - rect.left + wrap.scrollLeft;
      const endY = moveEvent.clientY - rect.top + wrap.scrollTop;
      const control = Math.max(60, Math.abs(endX - this.flowConnect.startX) * 0.45);
      this.flowConnect.preview.setAttribute(
        'd',
        `M ${this.flowConnect.startX} ${this.flowConnect.startY} C ${this.flowConnect.startX + control} ${this.flowConnect.startY}, ${endX - control} ${endY}, ${endX} ${endY}`
      );
      this.setFlowDropHighlight(this.findFlowDropTarget(moveEvent.clientX, moveEvent.clientY, this.flowConnect.sourcePath));
    };

    const end = (endEvent: PointerEvent): void => {
      if (!this.flowConnect || this.flowConnect.pointerId !== endEvent.pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      const state = this.flowConnect;
      state.preview.remove();
      this.flowConnect = undefined;
      this.setFlowDropHighlight('');
      const targetPath = this.findFlowDropTarget(endEvent.clientX, endEvent.clientY, state.sourcePath);
      const sourceCard = this.cards.find((card) => card.path === state.sourcePath);
      if (sourceCard && targetPath && targetPath !== sourceCard.path) void this.plugin.addPrecededBy(targetPath, sourceCard);
    };

    const cancel = (cancelEvent: PointerEvent): void => {
      if (!this.flowConnect || this.flowConnect.pointerId !== cancelEvent.pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      this.flowConnect.preview.remove();
      this.flowConnect = undefined;
      this.setFlowDropHighlight('');
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
  }

  private findFlowDropTarget(clientX: number, clientY: number, sourcePath: string): string {
    const targets = Array.from(this.containerEl.querySelectorAll<HTMLElement>('.kanban-rpm-flow-dot-in'));
    let best: { path: string; distance: number } | undefined;
    for (const target of targets) {
      const path = target.dataset.path ?? '';
      if (!path || path === sourcePath) continue;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const cardRect = target.closest('.kanban-rpm-card')?.getBoundingClientRect();
      const isInCardConnectorZone = cardRect
        ? clientX >= cardRect.left - 20 && clientX <= cardRect.left + 58 && clientY >= cardRect.top - 10 && clientY <= cardRect.bottom + 10
        : false;
      if (distance > 38 && !isInCardConnectorZone) continue;
      if (!best || distance < best.distance) best = { path, distance };
    }
    return best?.path ?? '';
  }

  private setFlowDropHighlight(targetPath: string): void {
    this.containerEl
      .querySelectorAll<HTMLElement>('.kanban-rpm-flow-dot-in.is-flow-target, .kanban-rpm-card.is-flow-target')
      .forEach((element) => element.removeClass('is-flow-target'));
    if (!targetPath) return;
    const target = this.containerEl.querySelector<HTMLElement>(`.kanban-rpm-flow-dot-in[data-path="${CSS.escape(targetPath)}"]`);
    target?.addClass('is-flow-target');
    target?.closest('.kanban-rpm-card')?.addClass('is-flow-target');
  }

  private startGanttFlowConnect(event: PointerEvent, source: ProjectCard): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const overlay = this.svgEl('svg');
    overlay.addClass('kanban-rpm-gantt-flow-preview-overlay');
    overlay.setAttribute('width', String(window.innerWidth));
    overlay.setAttribute('height', String(window.innerHeight));
    overlay.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const preview = this.svgEl('path');
    preview.setAttribute('class', 'kanban-rpm-gantt-flow-preview');
    preview.setAttribute('d', `M ${event.clientX} ${event.clientY} C ${event.clientX + 80} ${event.clientY}, ${event.clientX + 80} ${event.clientY}, ${event.clientX} ${event.clientY}`);
    overlay.appendChild(preview);
    document.body.appendChild(overlay);
    this.flowConnect = { pointerId: event.pointerId, sourcePath: source.path, preview, previewOverlay: overlay, startX: event.clientX, startY: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent): void => {
      if (!this.flowConnect || this.flowConnect.pointerId !== moveEvent.pointerId) return;
      const control = Math.max(60, Math.abs(moveEvent.clientX - this.flowConnect.startX) * 0.45);
      this.flowConnect.preview.setAttribute(
        'd',
        `M ${this.flowConnect.startX} ${this.flowConnect.startY} C ${this.flowConnect.startX + control} ${this.flowConnect.startY}, ${moveEvent.clientX - control} ${moveEvent.clientY}, ${moveEvent.clientX} ${moveEvent.clientY}`
      );
      this.setGanttFlowDropHighlight(this.findGanttFlowDropTarget(moveEvent.clientX, moveEvent.clientY, this.flowConnect.sourcePath));
    };

    const end = (endEvent: PointerEvent): void => {
      if (!this.flowConnect || this.flowConnect.pointerId !== endEvent.pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      const state = this.flowConnect;
      state.previewOverlay?.remove();
      state.preview.remove();
      this.flowConnect = undefined;
      this.setGanttFlowDropHighlight('');
      const targetPath = this.findGanttFlowDropTarget(endEvent.clientX, endEvent.clientY, state.sourcePath);
      const sourceCard = this.cards.find((card) => card.path === state.sourcePath);
      if (!sourceCard || !targetPath) return;
      if (targetPath === sourceCard.path) {
        new Notice('KanbanRPM cannot create a flow arrow to the same card.');
        return;
      }
      void this.plugin.addPrecededBy(targetPath, sourceCard);
    };

    const cancel = (cancelEvent: PointerEvent): void => {
      if (!this.flowConnect || this.flowConnect.pointerId !== cancelEvent.pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancel);
      this.flowConnect.previewOverlay?.remove();
      this.flowConnect.preview.remove();
      this.flowConnect = undefined;
      this.setGanttFlowDropHighlight('');
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
  }

  private findGanttFlowDropTarget(clientX: number, clientY: number, sourcePath: string): string {
    const targets = Array.from(this.containerEl.querySelectorAll<HTMLElement>('.kanban-rpm-gantt-flow-dot-in'));
    let best: { path: string; distance: number } | undefined;
    for (const target of targets) {
      const path = target.dataset.path ?? '';
      if (!path || path === sourcePath) continue;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const barRect = this.containerEl.querySelector<HTMLElement>(`.kanban-rpm-gantt-bar[data-path="${CSS.escape(path)}"]`)?.getBoundingClientRect();
      const trackRect = target.closest('.kanban-rpm-gantt-track')?.getBoundingClientRect();
      const isInBarConnectorZone = barRect
        ? clientX >= barRect.left - 36 && clientX <= barRect.right + 36 && clientY >= barRect.top - 18 && clientY <= barRect.bottom + 18
        : false;
      const isInTrackConnectorZone = trackRect
        ? Math.abs(clientX - centerX) <= 72 && clientY >= trackRect.top - 8 && clientY <= trackRect.bottom + 8
        : false;
      if (distance > 56 && !isInBarConnectorZone && !isInTrackConnectorZone) continue;
      if (!best || distance < best.distance) best = { path, distance };
    }
    return best?.path ?? '';
  }

  private setGanttFlowDropHighlight(targetPath: string): void {
    this.containerEl
      .querySelectorAll<HTMLElement>('.kanban-rpm-gantt-flow-dot-in.is-flow-target, .kanban-rpm-gantt-bar.is-flow-target, .kanban-rpm-gantt-row.is-flow-target')
      .forEach((element) => element.removeClass('is-flow-target'));
    if (!targetPath) return;
    const target = this.containerEl.querySelector<HTMLElement>(`.kanban-rpm-gantt-flow-dot-in[data-path="${CSS.escape(targetPath)}"]`);
    target?.addClass('is-flow-target');
    this.containerEl.querySelector<HTMLElement>(`.kanban-rpm-gantt-bar[data-path="${CSS.escape(targetPath)}"]`)?.addClass('is-flow-target');
    target?.closest('.kanban-rpm-gantt-row')?.addClass('is-flow-target');
  }

  private renderCardBreadcrumb(container: HTMLElement, card: ProjectCard): void {
    const project = card.projectTitle || card.projectTitles[0] || 'No project';
    const subproject = card.subprojectTitle || card.subprojectTitles[0] || '';
    const text = container.createSpan({ cls: 'kanban-rpm-card-breadcrumb-text' });
    text.createSpan({ text: project });
    if (card.type === 'big_action' && subproject) text.createSpan({ text: `> ${subproject}` });
  }

  private cardDisplayBreadcrumb(card: ProjectCard): string {
    const project = card.projectTitle || card.projectTitles[0] || 'No project';
    const subproject = card.subprojectTitle || card.subprojectTitles[0] || '';
    if (card.type === 'big_action' && subproject) return `${project} > ${subproject}`;
    return project;
  }

  private createIconButton(container: HTMLElement, icon: string, label: string, cls = ''): HTMLButtonElement {
    const button = container.createEl('button', {
      cls: ['kanban-rpm-icon-button', cls].filter(Boolean).join(' '),
      attr: { 'aria-label': label, title: label },
    });
    setIcon(button, icon);
    return button;
  }

  private renderCardDetails(container: HTMLElement, card: ProjectCard): void {
    const details = container.createEl('details', { cls: 'kanban-rpm-card-details' });
    details.createEl('summary', { text: 'Details' });
    const body = details.createDiv({ cls: 'kanban-rpm-card-details-body' });
    const fields = this.plugin.settings.cardDisplayFields;
    if (fields.status) {
      const line = body.createDiv({ cls: 'kanban-rpm-card-detail-line' });
      line.createSpan({ cls: 'kanban-rpm-card-detail-label', text: 'status: ' });
      this.renderStatusBadge(line, card.status);
    }
    if (fields.type) this.addMeta(body, this.cardTypeLabel(card.type), 'type', 'kanban-rpm-meta-kind');
    if (fields.waiting && card.status !== this.getConfiguredStatusId('waiting')) this.addMeta(body, card.waitingFor, 'waiting', 'kanban-rpm-meta-kind');
    if (fields.blockers && card.status !== this.getConfiguredStatusId('blocked')) this.addMeta(body, card.blocker, 'blocker', 'kanban-rpm-meta-dependency');
    if (fields.dependencies || fields.sources) this.renderCardRelations(body, card);
  }

  private shortDateLabel(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(`${value}T00:00:00`);
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    return `${value.slice(5)} ${day}`;
  }

  private addMeta(container: HTMLElement, value: string, label: string, cls?: string): void {
    if (value) container.createSpan({ cls, text: `${label}: ${value}` });
  }

  private renderStatusBadge(
    container: HTMLElement,
    statusId: string,
    label = this.statusLabel(statusId),
    tag: 'span' | 'button' = 'span',
  ): HTMLElement {
    const cls = `kanban-rpm-status-badge kanban-rpm-status-${statusId}`;
    return tag === 'button'
      ? container.createEl('button', { cls, text: label, attr: { title: `Edit status: ${label}` } })
      : container.createSpan({ cls, text: label });
  }

  private renderPriorityBadge(container: HTMLElement, card: ProjectCard, tag: 'span' | 'button' = 'span'): HTMLElement {
    const options = {
      cls: `kanban-rpm-pill kanban-rpm-priority kanban-rpm-priority-${card.priority}`,
      text: `P${card.priority}`,
      attr: tag === 'button' ? { title: `Edit priority: P${card.priority}` } : undefined,
    };
    return tag === 'button' ? container.createEl('button', options) : container.createSpan(options);
  }

  private addCountMeta(container: HTMLElement, count: number, label: string, cls?: string): void {
    if (count > 0) container.createSpan({ cls, text: `${label}: ${count}` });
  }

  private renderSmallActions(cardEl: HTMLElement, card: ProjectCard): void {
    const visibleActions = this.getVisibleSmallActions(card);
    if (!card.smallActions.length && !visibleActions.length) return;

    const open = card.smallActions.filter((action) => !action.done).length;
    const expanded = this.isSmallActionsExpanded(card);

    const panel = cardEl.createDiv({ cls: 'kanban-rpm-small-actions' });
    const header = panel.createSpan({
      cls: 'kanban-rpm-small-actions-toggle',
      text: `${expanded ? 'v' : '>'} Small actions: ${open} remaining`,
      attr: { role: 'button', tabindex: '0', 'aria-expanded': String(expanded) },
    });
    this.bindTextToggle(header, (event) => {
      event.stopPropagation();
      this.toggleSmallActions(card);
      this.render();
    });

    if (!expanded) return;

    if (!visibleActions.length) {
      panel.createDiv({ cls: 'kanban-rpm-small-action-empty', text: 'No small actions match the display rule.' });
      return;
    }

    const openActions = visibleActions.filter((action) => !action.done);
    const doneActions = visibleActions.filter((action) => action.done);
    this.renderSmallActionSection(panel, card, 'open', `Open: ${openActions.length}`, openActions, true);
    this.renderSmallActionSection(panel, card, 'done', `Done: ${doneActions.length}`, doneActions, false);
  }

  private renderSmallActionSection(
    container: HTMLElement,
    card: ProjectCard,
    section: 'open' | 'done',
    label: string,
    actions: SmallAction[],
    defaultExpanded: boolean
  ): void {
    if (!actions.length) return;
    const expanded = this.isSmallActionSectionExpanded(card, section, defaultExpanded);
    const sectionEl = container.createDiv({ cls: `kanban-rpm-small-action-section is-${section}` });
    const toggle = sectionEl.createSpan({
      cls: 'kanban-rpm-small-action-section-toggle',
      text: `${expanded ? 'v' : '>'} ${label}`,
      attr: { role: 'button', tabindex: '0', 'aria-expanded': String(expanded) },
    });
    this.bindTextToggle(toggle, (event) => {
      event.stopPropagation();
      this.toggleSmallActionSection(card, section, defaultExpanded);
      this.render();
    });
    if (!expanded) return;

    const list = sectionEl.createDiv({ cls: 'kanban-rpm-small-action-list' });
    const shown = actions.slice(0, 8);
    for (const group of this.groupSmallActionsByHeading(shown)) {
      const groupEl = list.createDiv({ cls: 'kanban-rpm-small-action-group' });
      groupEl.createDiv({ cls: 'kanban-rpm-small-action-heading', text: group.heading });
      for (const action of group.actions) this.renderSmallActionRow(groupEl, action);
    }
    if (actions.length > shown.length) {
      sectionEl.createDiv({ cls: 'kanban-rpm-small-action-more', text: `+${actions.length - shown.length} more` });
    }
  }

  private bindTextToggle(element: HTMLElement, onActivate: (event: Event) => void): void {
    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      onActivate(event);
    });
    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onActivate(event);
    });
  }

  private renderSmallActionRow(container: HTMLElement, action: SmallAction): void {
    const row = container.createDiv({ cls: `kanban-rpm-small-action${action.done ? ' is-done' : ''}` });
    const checkbox = row.createEl('input', {
      attr: {
        type: 'checkbox',
        'aria-label': `Toggle ${action.text}`,
      },
    });
    checkbox.checked = action.done;
    checkbox.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    checkbox.addEventListener('change', () => {
      void this.plugin.toggleSmallAction(action);
    });

    const body = row.createDiv({ cls: 'kanban-rpm-small-action-body' });
    body.createDiv({ cls: 'kanban-rpm-small-action-text', text: action.text });
    const meta = body.createDiv({ cls: 'kanban-rpm-small-action-meta' });
    if (action.scheduledDate) meta.createSpan({ text: `scheduled ${action.scheduledDate}` });
    if (action.dueDate) meta.createSpan({ text: `due ${action.dueDate}` });
    if (action.doneDate) meta.createSpan({ text: `done ${action.doneDate}` });
    if (action.priority !== 'normal') meta.createSpan({ text: action.priority });
  }

  private groupSmallActionsByHeading(actions: SmallAction[]): Array<{ heading: string; actions: SmallAction[] }> {
    const map = new Map<string, SmallAction[]>();
    for (const action of actions) {
      const heading = action.heading || 'Small Actions';
      const existing = map.get(heading) ?? [];
      existing.push(action);
      map.set(heading, existing);
    }
    return Array.from(map.entries()).map(([heading, groupActions]) => ({ heading, actions: groupActions }));
  }

  private isSmallActionsExpanded(card: ProjectCard): boolean {
    if (this.plugin.settings.smallActionDisplay.collapsedByDefault) return this.expandedSmallActions.has(card.path);
    return !this.collapsedSmallActions.has(card.path);
  }

  private toggleSmallActions(card: ProjectCard): void {
    if (this.plugin.settings.smallActionDisplay.collapsedByDefault) {
      if (this.expandedSmallActions.has(card.path)) this.expandedSmallActions.delete(card.path);
      else this.expandedSmallActions.add(card.path);
      return;
    }

    if (this.collapsedSmallActions.has(card.path)) this.collapsedSmallActions.delete(card.path);
    else this.collapsedSmallActions.add(card.path);
  }

  private smallActionSectionKey(card: ProjectCard, section: 'open' | 'done'): string {
    return `${card.path}::${section}`;
  }

  private isSmallActionSectionExpanded(card: ProjectCard, section: 'open' | 'done', defaultExpanded: boolean): boolean {
    const key = this.smallActionSectionKey(card, section);
    return defaultExpanded ? !this.collapsedSmallActionSections.has(key) : this.expandedSmallActionSections.has(key);
  }

  private toggleSmallActionSection(card: ProjectCard, section: 'open' | 'done', defaultExpanded: boolean): void {
    const key = this.smallActionSectionKey(card, section);
    if (defaultExpanded) {
      if (this.collapsedSmallActionSections.has(key)) this.collapsedSmallActionSections.delete(key);
      else this.collapsedSmallActionSections.add(key);
      return;
    }
    if (this.expandedSmallActionSections.has(key)) this.expandedSmallActionSections.delete(key);
    else this.expandedSmallActionSections.add(key);
  }

  private getVisibleSmallActions(card: ProjectCard): SmallAction[] {
    const { sourceFilter, dateWindow } = this.plugin.settings.smallActionDisplay;
    return card.smallActions
      .filter((action) => {
        if (sourceFilter === 'dated' && !action.dueDate && !action.scheduledDate) return false;
        if (sourceFilter === 'done' && !action.done) return false;
        return this.isSmallActionInWindow(action, dateWindow);
      })
      .sort((a, b) => this.smallActionSortValue(a).localeCompare(this.smallActionSortValue(b)) || a.lineNumber - b.lineNumber);
  }

  private getTimelineCardSmallActions(card: ProjectCard): SmallAction[] {
    return card.smallActions
      .sort((a, b) => this.smallActionPriorityRank(a.priority) - this.smallActionPriorityRank(b.priority) || this.smallActionSortValue(a).localeCompare(this.smallActionSortValue(b)) || a.lineNumber - b.lineNumber);
  }

  private smallActionSortValue(action: SmallAction): string {
    return action.scheduledDate || action.dueDate || action.doneDate || '9999-99-99';
  }

  private isSmallActionOverdue(action: SmallAction): boolean {
    const date = action.scheduledDate || action.dueDate;
    return Boolean(date && isPastDate(date));
  }

  private isSmallActionInWindow(action: SmallAction, window: string): boolean {
    if (window === 'all') return true;
    const date = action.scheduledDate || action.dueDate || action.doneDate;
    if (!date) return false;
    if (window === 'overdue') return isPastDate(date);
    if (window === 'today') return date === todayIso();
    if (isPastDate(date) || date === todayIso()) return true;
    if (window === 'tomorrow') return isDueSoon(date, 1);
    if (window === 'week') return isDueSoon(date, 7);
    if (window === 'month') return isDueSoon(date, 31);
    return true;
  }

  private todayIso(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private attachPointerDrag(cardEl: HTMLElement, card: ProjectCard): void {
    cardEl.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || this.isInteractiveTarget(event.target)) return;
      this.pointerDrag = {
        cardPath: card.path,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
        cardEl,
      };
      cardEl.setPointerCapture(event.pointerId);
    });

    cardEl.addEventListener('pointermove', (event) => {
      if (!this.pointerDrag || this.pointerDrag.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - this.pointerDrag.startX, event.clientY - this.pointerDrag.startY);
      if (!this.pointerDrag.dragging && distance < 6) return;

      this.pointerDrag.dragging = true;
      this.pointerDrag.cardEl.addClass('is-dragging');
      this.setActiveDragLane(this.findLaneAtPoint(event.clientX, event.clientY));
    });

    cardEl.addEventListener('pointerup', (event) => {
      if (!this.pointerDrag || this.pointerDrag.pointerId !== event.pointerId) return;
      const drag = this.pointerDrag;
      const laneEl = this.findLaneAtPoint(event.clientX, event.clientY) ?? drag.activeLaneEl;
      this.clearPointerDrag();

      if (!drag.dragging || !laneEl) return;
      const status = laneEl.dataset.status;
      if (!status) return;
      const beforePath = this.findDropBeforePath(laneEl, event.clientY, drag.cardPath);
      void this.plugin.moveCard(drag.cardPath, status, beforePath);
    });

    cardEl.addEventListener('pointercancel', () => this.clearPointerDrag());
    cardEl.addEventListener('lostpointercapture', () => {
      if (this.pointerDrag?.cardEl === cardEl) this.clearPointerDrag();
    });
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('button, input, textarea, select, a, summary, details, .is-link'));
  }

  private findLaneAtPoint(clientX: number, clientY: number): HTMLElement | undefined {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      if (!(element instanceof HTMLElement)) continue;
      const laneEl = element.closest<HTMLElement>('.kanban-rpm-lane');
      if (laneEl) return laneEl;
    }
    return undefined;
  }

  private setActiveDragLane(laneEl?: HTMLElement): void {
    if (this.pointerDrag?.activeLaneEl === laneEl) return;
    this.pointerDrag?.activeLaneEl?.removeClass('is-drag-over');
    if (this.pointerDrag) this.pointerDrag.activeLaneEl = laneEl;
    laneEl?.addClass('is-drag-over');
  }

  private clearPointerDrag(): void {
    if (!this.pointerDrag) return;
    this.pointerDrag.cardEl.removeClass('is-dragging');
    this.pointerDrag.activeLaneEl?.removeClass('is-drag-over');
    this.pointerDrag = undefined;
  }

  private renderCardRelations(cardEl: HTMLElement, card: ProjectCard): void {
    const fields = this.plugin.settings.cardDisplayFields;
    const rows: Array<[string, string[], string]> = [];
    if (fields.dependencies) {
      rows.push(['Waiting on', card.blockedBy, 'kanban-rpm-relation-blocks']);
      rows.push(['Preceded by', card.precededBy, 'kanban-rpm-relation-depends']);
      rows.push(['Followed by', card.followedBy, 'kanban-rpm-relation-blocks']);
    }
    if (fields.sources) rows.push(['Sources', card.sourceNotes.slice(0, 3), 'kanban-rpm-relation-sources']);
    const visibleRows = rows.filter(([, values]) => values.length > 0);
    if (!visibleRows.length) return;

    const relations = cardEl.createDiv({ cls: 'kanban-rpm-card-relations' });
    for (const [label, values, cls] of visibleRows) {
      const row = relations.createDiv({ cls: `kanban-rpm-relation-row ${cls}` });
      row.createSpan({ cls: 'kanban-rpm-relation-label', text: `${label}:` });
      const list = row.createSpan({ cls: 'kanban-rpm-relation-values' });
      for (const value of values.slice(0, 4)) {
        const item = list.createSpan({ text: value });
        if (value.includes('[[')) {
          item.addClass('is-link');
          item.setAttr('role', 'button');
          item.setAttr('tabindex', '0');
          item.addEventListener('click', (event) => {
            event.stopPropagation();
            void this.plugin.openLinkedReference(value, card.path);
          });
          item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') void this.plugin.openLinkedReference(value, card.path);
          });
        }
      }
      if (values.length > 4) list.createSpan({ text: `+${values.length - 4}` });
    }
  }

  private findDropBeforePath(laneEl: HTMLElement, clientY: number, draggingPath: string): string | undefined {
    const cards = Array.from(laneEl.querySelectorAll<HTMLElement>('.kanban-rpm-card')).filter(
      (el) => el.dataset.path !== draggingPath
    );

    for (const cardEl of cards) {
      const rect = cardEl.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return cardEl.dataset.path;
    }

    return undefined;
  }

  private groupCardsForCurrentFilter(cards: ProjectCard[]): Array<{ project: string; cards: ProjectCard[] }> {
    const map = new Map<string, ProjectCard[]>();
    for (const card of cards) {
      const project = this.projectFilter ? card.subprojectTitle || card.subprojectTitles[0] || 'No subproject' : card.projectTitle || card.projectTitles[0] || 'No project';
      const existing = map.get(project) ?? [];
      existing.push(card);
      map.set(project, existing);
    }
    return Array.from(map.entries())
      .map(([project, groupCards]) => ({ project, cards: groupCards.sort(compareCards) }))
      .sort((a, b) => a.project.localeCompare(b.project));
  }

  private addProjectToken(container: HTMLElement, key: string): void {
    const token = container.createSpan({ cls: 'kanban-rpm-project-token' });
    token.style.setProperty('--rpm-project-color', this.projectColor(key));
  }

  private getConfiguredStatusId(preferredId: string): Status {
    return this.plugin.settings.statuses.find((status) => status.id === preferredId)?.id ?? preferredId;
  }

  private isCompletionStatus(statusId: string): boolean {
    const status = this.plugin.settings.statuses.find((item) => item.id === statusId);
    const value = `${status?.id ?? statusId} ${status?.label ?? ''}`.toLowerCase();
    return /\b(done|complete|completed)\b/.test(value) || value.includes('?袁⑥┷');
  }

  private statusLabel(statusId: string): string {
    return this.plugin.settings.statuses.find((status) => status.id === statusId)?.label ?? statusId;
  }

  private categoryLabel(categoryId: string): string {
    return categoryLabel(this.plugin.settings.categories, categoryId);
  }

  private projectColor(key: string): string {
    let hash = 0;
    for (const char of (key || 'project')) hash = (hash * 31 + char.charCodeAt(0)) % 360;
    return `hsl(${hash} 62% 48%)`;
  }
}


