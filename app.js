const STORAGE_KEY = 'bulletin-app-items-v1';

const PRIORITY_META = {
  critical: { label: 'Critical', weight: 4 },
  important: { label: 'Important', weight: 3 },
  normal: { label: 'Normal', weight: 2 },
  backBurner: { label: 'Back Burner', weight: 1 },
};

const state = {
  items: loadItems(),
  currentView: 'bulletin',
  completedCollapsed: true,
  filters: {
    query: '',
    priority: 'all',
    schedule: 'all',
    status: 'active',
  },
  capturePriority: 'critical',
};

const els = {
  heroStats: document.getElementById('heroStats'),
  bulletinView: document.getElementById('bulletinView'),
  allView: document.getElementById('allView'),
  scheduleView: document.getElementById('scheduleView'),
  captureForm: document.getElementById('captureForm'),
  titleInput: document.getElementById('titleInput'),
  notesInput: document.getElementById('notesInput'),
  dateInput: document.getElementById('dateInput'),
  timeInput: document.getElementById('timeInput'),
  reminderInput: document.getElementById('reminderInput'),
  priorityChips: document.getElementById('priorityChips'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  floatingAdd: document.getElementById('floatingAdd'),
  scrollBulletinBtn: document.getElementById('scrollBulletinBtn'),
  editModal: document.getElementById('editModal'),
  editForm: document.getElementById('editForm'),
  editId: document.getElementById('editId'),
  editTitle: document.getElementById('editTitle'),
  editNotes: document.getElementById('editNotes'),
  editPriority: document.getElementById('editPriority'),
  editDate: document.getElementById('editDate'),
  editTime: document.getElementById('editTime'),
  editReminder: document.getElementById('editReminder'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  deleteFromModalBtn: document.getElementById('deleteFromModalBtn'),
  quickCaptureSection: document.getElementById('quickCaptureSection'),
};

bindEvents();
renderApp();

function bindEvents() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.view;
      document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === btn));
      document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
      document.getElementById(btn.dataset.view + 'View').classList.add('active');
    });
  });

  els.priorityChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.capturePriority = chip.dataset.value;
    [...els.priorityChips.querySelectorAll('.chip')].forEach(c => c.classList.toggle('active', c === chip));
  });

  els.captureForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = els.titleInput.value.trim();
    if (!title) return;

    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title,
      notes: els.notesInput.value.trim(),
      priority: state.capturePriority,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: els.dateInput.value || null,
      dueTime: els.timeInput.value || null,
      reminderEnabled: els.reminderInput.checked,
      completedAt: null,
      isPinned: false,
    };

    state.items.unshift(item);
    persist();
    resetCaptureForm();
    state.currentView = 'bulletin';
    setActiveTab('bulletin');
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  els.clearFormBtn.addEventListener('click', resetCaptureForm);
  els.floatingAdd.addEventListener('click', () => {
    els.quickCaptureSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => els.titleInput.focus(), 250);
  });
  els.scrollBulletinBtn.addEventListener('click', () => {
    state.currentView = 'bulletin';
    setActiveTab('bulletin');
    renderApp();
    els.bulletinView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  els.closeModalBtn.addEventListener('click', closeModal);
  els.editModal.addEventListener('click', (e) => {
    if (e.target === els.editModal) closeModal();
  });

  els.editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = els.editId.value;
    const item = getItemById(id);
    if (!item) return closeModal();

    item.title = els.editTitle.value.trim();
    item.notes = els.editNotes.value.trim();
    item.priority = els.editPriority.value;
    item.dueDate = els.editDate.value || null;
    item.dueTime = els.editTime.value || null;
    item.reminderEnabled = els.editReminder.checked;
    item.updatedAt = new Date().toISOString();
    persist();
    closeModal();
    renderApp();
  });

  els.deleteFromModalBtn.addEventListener('click', () => {
    const id = els.editId.value;
    if (!id) return;
    deleteItem(id);
    closeModal();
    renderApp();
  });

  document.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const { action, id } = actionEl.dataset;
    if (!id) return;

    if (action === 'toggle-complete') {
      toggleComplete(id);
    } else if (action === 'edit') {
      openEditModal(id);
    } else if (action === 'delete') {
      deleteItem(id);
    } else if (action === 'toggle-completed-section') {
      state.completedCollapsed = !state.completedCollapsed;
    }

    renderApp();
  });

  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-filter="query"]')) {
      state.filters.query = e.target.value;
      renderAllItems();
    }
    if (e.target.matches('[data-filter="priority"]')) {
      state.filters.priority = e.target.value;
      renderAllItems();
    }
    if (e.target.matches('[data-filter="schedule"]')) {
      state.filters.schedule = e.target.value;
      renderAllItems();
    }
    if (e.target.matches('[data-filter="status"]')) {
      state.filters.status = e.target.value;
      renderAllItems();
    }
  });
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function resetCaptureForm() {
  els.captureForm.reset();
  state.capturePriority = 'critical';
  [...els.priorityChips.querySelectorAll('.chip')].forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === 'critical');
  });
  els.titleInput.focus();
}

function getItemById(id) {
  return state.items.find(item => item.id === id);
}

function deleteItem(id) {
  state.items = state.items.filter(item => item.id !== id);
  persist();
}

function toggleComplete(id) {
  const item = getItemById(id);
  if (!item) return;
  const completing = item.status !== 'completed';
  item.status = completing ? 'completed' : 'active';
  item.completedAt = completing ? new Date().toISOString() : null;
  item.updatedAt = new Date().toISOString();
  persist();
}

function openEditModal(id) {
  const item = getItemById(id);
  if (!item) return;
  els.editId.value = item.id;
  els.editTitle.value = item.title;
  els.editNotes.value = item.notes || '';
  els.editPriority.value = item.priority;
  els.editDate.value = item.dueDate || '';
  els.editTime.value = item.dueTime || '';
  els.editReminder.checked = !!item.reminderEnabled;
  els.editModal.classList.add('open');
  els.editModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  els.editModal.classList.remove('open');
  els.editModal.setAttribute('aria-hidden', 'true');
  els.editForm.reset();
  els.editId.value = '';
}

function setActiveTab(view) {
  state.currentView = view;
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(view + 'View').classList.add('active');
}

function renderApp() {
  renderHeroStats();
  renderBulletin();
  renderAllItems();
  renderSchedule();
  setActiveTab(state.currentView);
}

function renderHeroStats() {
  const active = state.items.filter(i => i.status === 'active');
  const overdue = active.filter(isOverdue);
  const dueToday = active.filter(isDueToday);
  const critical = active.filter(i => i.priority === 'critical');

  els.heroStats.innerHTML = [
    { label: 'Active', value: active.length },
    { label: 'Due Today', value: dueToday.length },
    { label: 'Overdue', value: overdue.length + (critical.length ? ' · ' + critical.length + ' critical' : '') },
  ].map(stat => `
    <div class="stat">
      <div class="label">${escapeHtml(stat.label)}</div>
      <div class="value">${escapeHtml(String(stat.value))}</div>
    </div>
  `).join('');
}

function renderBulletin() {
  const active = state.items.filter(item => item.status === 'active');
  const completed = state.items
    .filter(item => item.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));

  const sections = [
    { title: 'Top Priority', items: getTopPriority(active) },
    { title: 'Due Today', items: sortItems(active.filter(i => isDueToday(i) && ['critical', 'important'].includes(i.priority))) },
    { title: 'Upcoming', items: sortItems(active.filter(i => isUpcoming(i) && ['critical', 'important'].includes(i.priority))) },
    { title: 'Overdue', items: sortItems(active.filter(isOverdue)) },
    { title: 'Important but Unscheduled', items: sortItems(active.filter(i => !i.dueDate && ['critical', 'important'].includes(i.priority))) },
    { title: 'Everything Else', items: sortItems(active.filter(i => !belongsToPrimarySections(i))) },
  ];

  const html = sections.map(section => renderSection(section.title, section.items)).join('') + renderCompletedSection(completed);
  els.bulletinView.innerHTML = html || '<div class="empty">No items yet. Dump the first thought into Quick Capture and let the little system goblin sort it.</div>';
}

function renderSection(title, items) {
  return `
    <section class="section">
      <div class="section-header">
        <h3>${escapeHtml(title)}</h3>
        <span class="section-count">${items.length}</span>
      </div>
      <div class="section-body">
        ${items.length ? items.map(renderItemCard).join('') : `<div class="empty">Nothing here right now.</div>`}
      </div>
    </section>
  `;
}

function renderCompletedSection(items) {
  return `
    <section class="section ${state.completedCollapsed ? 'collapsed' : ''}">
      <div class="section-header">
        <h3>Completed</h3>
        <div class="item-actions">
          <span class="section-count">${items.length}</span>
          <button class="btn ghost" data-action="toggle-completed-section" data-id="noop" type="button">${state.completedCollapsed ? 'Show' : 'Hide'}</button>
        </div>
      </div>
      <div class="section-body">
        ${items.length ? items.map(renderItemCard).join('') : `<div class="empty">Completed items will live here.</div>`}
      </div>
    </section>
  `;
}

function renderAllItems() {
  const items = getFilteredItems();
  els.allView.innerHTML = `
    <div class="panel-title">
      <h3>All Items</h3>
      <span class="tiny">Search, filter, and tame the pile.</span>
    </div>
    <div class="filters">
      <input type="text" data-filter="query" value="${escapeAttribute(state.filters.query)}" placeholder="Search title or notes" />
      <select data-filter="priority">
        ${renderOptions([
          ['all', 'All priorities'],
          ['critical', 'Critical'],
          ['important', 'Important'],
          ['normal', 'Normal'],
          ['backBurner', 'Back Burner'],
        ], state.filters.priority)}
      </select>
      <select data-filter="schedule">
        ${renderOptions([
          ['all', 'All scheduling'],
          ['scheduled', 'Scheduled'],
          ['unscheduled', 'Unscheduled'],
        ], state.filters.schedule)}
      </select>
      <select data-filter="status">
        ${renderOptions([
          ['active', 'Active only'],
          ['completed', 'Completed only'],
          ['all', 'All statuses'],
        ], state.filters.status)}
      </select>
    </div>
    <div class="section-body">
      ${items.length ? items.map(renderItemCard).join('') : '<div class="empty">No items match these filters.</div>'}
    </div>
  `;
}

function renderSchedule() {
  const activeScheduled = state.items.filter(item => item.status === 'active' && item.dueDate).sort(sortItemsComparator);
  const today = activeScheduled.filter(isDueToday);
  const week = activeScheduled.filter(isThisWeekButNotToday);
  const later = activeScheduled.filter(item => !isDueToday(item) && !isThisWeekButNotToday(item));

  els.scheduleView.innerHTML = `
    <div class="panel-title">
      <h3>Schedule</h3>
      <span class="tiny">Agenda view, because a full calendar grid can become a tiny rectangle circus on phones.</span>
    </div>
    ${renderAgendaGroup('Today', today)}
    ${renderAgendaGroup('This Week', week)}
    ${renderAgendaGroup('Later', later)}
  `;
}

function renderAgendaGroup(title, items) {
  return `
    <div class="agenda-group">
      <div class="agenda-heading">${escapeHtml(title)}</div>
      <div class="section-body">
        ${items.length ? items.map(renderItemCard).join('') : '<div class="empty">Nothing scheduled here.</div>'}
      </div>
    </div>
  `;
}

function renderItemCard(item) {
  const completed = item.status === 'completed';
  const overdue = isOverdue(item);
  const dueToday = isDueToday(item);
  const scheduleLabel = getScheduleLabel(item);
  return `
    <article class="item-card ${completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}">
      <div class="item-top">
        <button class="check ${completed ? 'done' : ''}" data-action="toggle-complete" data-id="${item.id}" type="button" aria-label="${completed ? 'Mark active' : 'Mark complete'}">${completed ? '✓' : ''}</button>
        <div class="item-main">
          <h4>${escapeHtml(item.title)}</h4>
          ${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}
        </div>
      </div>
      <div class="item-meta">
        <span class="badge priority-${item.priority}">${escapeHtml(PRIORITY_META[item.priority].label)}</span>
        ${scheduleLabel ? `<span class="badge ${overdue ? 'overdue' : dueToday ? 'today' : ''}">${escapeHtml(scheduleLabel)}</span>` : ''}
        ${completed ? `<span class="badge completed">Completed ${escapeHtml(formatDateShort(item.completedAt))}</span>` : ''}
        ${item.reminderEnabled ? `<span class="badge">Reminder on</span>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn secondary" data-action="edit" data-id="${item.id}" type="button">Edit</button>
        <button class="btn danger" data-action="delete" data-id="${item.id}" type="button">Delete</button>
      </div>
    </article>
  `;
}

function getFilteredItems() {
  let items = [...state.items];
  const q = state.filters.query.trim().toLowerCase();
  if (q) {
    items = items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.notes || '').toLowerCase().includes(q)
    );
  }
  if (state.filters.priority !== 'all') items = items.filter(item => item.priority === state.filters.priority);
  if (state.filters.schedule === 'scheduled') items = items.filter(item => !!item.dueDate);
  if (state.filters.schedule === 'unscheduled') items = items.filter(item => !item.dueDate);
  if (state.filters.status !== 'all') items = items.filter(item => item.status === state.filters.status);
  return items.sort(sortItemsComparator);
}

function getTopPriority(activeItems) {
  const overdueCritical = activeItems.filter(item => isOverdue(item) && item.priority === 'critical');
  if (overdueCritical.length) return sortItems(overdueCritical);
  const todayCriticalImportant = activeItems.filter(item => isDueToday(item) && ['critical', 'important'].includes(item.priority));
  if (todayCriticalImportant.length) return sortItems(todayCriticalImportant);
  const upcomingCriticalImportant = activeItems.filter(item => isUpcoming(item) && ['critical', 'important'].includes(item.priority));
  if (upcomingCriticalImportant.length) return sortItems(upcomingCriticalImportant).slice(0, 5);
  const unscheduledImportant = activeItems.filter(item => !item.dueDate && ['critical', 'important'].includes(item.priority));
  return sortItems(unscheduledImportant).slice(0, 5);
}

function belongsToPrimarySections(item) {
  return (
    isOverdue(item) ||
    (isDueToday(item) && ['critical', 'important'].includes(item.priority)) ||
    (isUpcoming(item) && ['critical', 'important'].includes(item.priority)) ||
    (!item.dueDate && ['critical', 'important'].includes(item.priority))
  );
}

function sortItems(items) { return [...items].sort(sortItemsComparator); }

function sortItemsComparator(a, b) {
  const bucketDiff = getBulletinBucketScore(a) - getBulletinBucketScore(b);
  if (bucketDiff !== 0) return bucketDiff;
  const priorityDiff = PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
  if (priorityDiff !== 0) return priorityDiff;
  const timeA = getDueTimestamp(a);
  const timeB = getDueTimestamp(b);
  if (timeA !== timeB) return timeA - timeB;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function getBulletinBucketScore(item) {
  if (item.status === 'completed') return 99;
  if (isOverdue(item) && item.priority === 'critical') return 1;
  if (isDueToday(item) && ['critical', 'important'].includes(item.priority)) return 2;
  if (isUpcoming(item) && ['critical', 'important'].includes(item.priority)) return 3;
  if (!item.dueDate && ['critical', 'important'].includes(item.priority)) return 4;
  if (item.priority === 'normal') return 5;
  if (item.priority === 'backBurner') return 6;
  return 7;
}

function getDueTimestamp(item) {
  if (!item.dueDate) return Number.MAX_SAFE_INTEGER;
  const timePart = item.dueTime || '23:59';
  return new Date(`${item.dueDate}T${timePart}`).getTime();
}

function isOverdue(item) {
  if (!item.dueDate || item.status !== 'active') return false;
  return getDueTimestamp(item) < Date.now() && !isDueToday(item);
}

function isDueToday(item) {
  if (!item.dueDate || item.status !== 'active') return false;
  const due = parseLocalDate(item.dueDate);
  const now = new Date();
  return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth() && due.getDate() === now.getDate();
}

function isUpcoming(item) {
  if (!item.dueDate || item.status !== 'active') return false;
  const due = parseLocalDate(item.dueDate);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  return due > startToday && !isDueToday(item);
}

function isThisWeekButNotToday(item) {
  if (!item.dueDate || item.status !== 'active' || isDueToday(item)) return false;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const due = parseLocalDate(item.dueDate);
  return due >= start && due < end;
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getScheduleLabel(item) {
  if (!item.dueDate) return '';
  const date = parseLocalDate(item.dueDate);
  const formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const time = item.dueTime ? formatTime(item.dueTime) : null;
  if (isOverdue(item)) return `Overdue · ${formattedDate}${time ? ' · ' + time : ''}`;
  if (isDueToday(item)) return `Today${time ? ' · ' + time : ''}`;
  return `${formattedDate}${time ? ' · ' + time : ''}`;
}

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateShort(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function renderOptions(options, current) {
  return options.map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(() => console.log('Service worker registered'))
      .catch((error) => console.error('Service worker registration failed:', error));
  });
}
