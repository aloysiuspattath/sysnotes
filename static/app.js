/* ═══════════════════════════════════════════════════════
   SysNotes — Application Logic v3 (Steps + Images)
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── SVG ICONS ──────────────────────────────────────
    const ICONS = {
        copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        edit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
        trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
        folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
        user: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        grid: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
        image: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        steps: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
        close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    };

    // ─── STATE ──────────────────────────────────────────
    let currentToken = localStorage.getItem('sn_token') || null;
    let currentRole = localStorage.getItem('sn_role') || null;
    let currentUsername = localStorage.getItem('sn_username') || null;
    let quillAdd = null;
    let quillEdit = null;
    let currentView = localStorage.getItem('sn_view') || 'view-stack';
    let activeCategory = null;
    let activeCategoryName = null;
    let activeTag = null;
    let allNotes = [];
    let allCategories = [];
    let allTags = [];
    let isAdminPageOpen = false;

    // Per-modal pending image uploads (before note id is known)
    // keyed by prefix: 'add' or 'edit'
    const pendingImages = { add: [], edit: [] }; // [{file, objectUrl}]
    // After note created/saved: {noteId, imageId, url} for already-uploaded
    let editNoteId = null;
    let editExistingImages = []; // images already on server for current edit

    // Step counters for unique IDs
    let stepCounter = 0;
    function nextStepId() { return ++stepCounter; }

    // ─── UTILITIES ──────────────────────────────────────
    function escapeHTML(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function showToast(msg, isError = false) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast' + (isError ? ' toast-error' : '');
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

    function authHeaders() {
        const h = { 'Content-Type': 'application/json' };
        if (currentToken) h['Authorization'] = 'Bearer ' + currentToken;
        return h;
    }

    async function apiFetch(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (res.status === 401) { doLogout(); showToast('Session expired. Please login again.', true); return null; }
            return res;
        } catch (err) {
            showToast('Network error: ' + err.message, true);
            return null;
        }
    }

    // ─── THEME ──────────────────────────────────────────
    function initTheme() {
        const saved = localStorage.getItem('sn_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeUI(saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('sn_theme', next);
        updateThemeUI(next);
    }

    function updateThemeUI(theme) {
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        const label = document.getElementById('theme-toggle-label');
        if (theme === 'dark') {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = '';
            if (label) label.textContent = 'Dark Mode';
        } else {
            if (sunIcon) sunIcon.style.display = '';
            if (moonIcon) moonIcon.style.display = 'none';
            if (label) label.textContent = 'Light Mode';
        }
    }

    // ─── VIEW ────────────────────────────────────────────
    function initView() {
        const container = document.getElementById('notes-container');
        container.className = 'notes-container ' + currentView;
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === currentView);
        });
    }

    function switchView(view) {
        currentView = view;
        localStorage.setItem('sn_view', view);
        initView();
        renderNotes(allNotes);
    }

    // ─── AUTH UI ─────────────────────────────────────────
    function updateAuthUI() {
        const loggedOut = document.getElementById('auth-logged-out');
        const loggedIn = document.getElementById('auth-logged-in');
        const usernameEl = document.getElementById('auth-username');
        const adminBtn = document.getElementById('admin-btn');
        if (currentToken) {
            loggedOut.style.display = 'none';
            loggedIn.style.display = 'flex';
            usernameEl.textContent = currentUsername || '';
            if (adminBtn) adminBtn.style.display = currentRole === 'admin' ? '' : 'none';
        } else {
            loggedOut.style.display = 'flex';
            loggedIn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }
    }

    function doLogout() {
        currentToken = null; currentRole = null; currentUsername = null;
        localStorage.removeItem('sn_token');
        localStorage.removeItem('sn_role');
        localStorage.removeItem('sn_username');
        updateAuthUI();
        if (isAdminPageOpen) closeAdminPage();
        renderNotes(allNotes);
    }

    // ─── MODALS ──────────────────────────────────────────
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }
    function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); }

    // ─── ADMIN PAGE ──────────────────────────────────────
    function openAdminPage() {
        isAdminPageOpen = true;
        document.getElementById('notes-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('category-cards-grid').style.display = 'none';
        document.querySelector('.top-bar').style.display = 'none';
        document.getElementById('admin-page').style.display = 'block';
        loadAdminCategories();
        loadAdminUsers();
        loadAdminSettings();
    }

    function closeAdminPage() {
        isAdminPageOpen = false;
        document.getElementById('admin-page').style.display = 'none';
        document.querySelector('.top-bar').style.display = '';
        document.getElementById('category-cards-grid').style.display = '';
        document.getElementById('notes-container').style.display = '';
        renderNotes(allNotes);
    }

    function switchAdminTab(tabId) {
        document.querySelectorAll('.admin-page-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        document.querySelectorAll('.admin-page-tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
    }

    // ─── NOTE TYPE TOGGLE ────────────────────────────────
    function initNoteTypeToggle(prefix) {
        const typeHidden = document.getElementById(`${prefix}-note-type`);
        const commandSection = document.getElementById(`${prefix}-command-section`);
        const stepsSection = document.getElementById(`${prefix}-steps-section`);

        document.querySelectorAll(`#${prefix}-type-command, #${prefix}-type-procedure, #${prefix}-type-plain`).forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                setNoteType(prefix, type);
            });
        });
    }

        function setNoteType(prefix, type) {
        const typeHidden = document.getElementById(`${prefix}-note-type`);
        const commandSection = document.getElementById(`${prefix}-command-section`);
        const stepsSection = document.getElementById(`${prefix}-steps-section`);
        const plainSection = document.getElementById(`${prefix}-plain-section`);
        typeHidden.value = type;
        document.querySelectorAll(`#${prefix}-type-command, #${prefix}-type-procedure, #${prefix}-type-plain`).forEach(b => {
            b.classList.toggle('active', b.dataset.type === type);
        });
        if (commandSection) commandSection.style.display = type === 'command' ? '' : 'none';
        if (stepsSection) {
            stepsSection.style.display = type === 'procedure' ? '' : 'none';
            if (type === 'procedure' && document.getElementById(`${prefix}-steps-list`).children.length === 0) {
                addStep(prefix);
            }
        }
        if (plainSection) plainSection.style.display = type === 'plain' ? '' : 'none';
        
        if (type === 'plain') {
            setTimeout(() => {
                // Quill doesn't need a manual refresh like CodeMirror does, but we can focus it or do nothing.
            }, 10);
        }
    }

    // ─── STEP BUILDER ────────────────────────────────────
    function addStep(prefix, stepData = null) {
        const list = document.getElementById(`${prefix}-steps-list`);
        const stepNum = list.children.length + 1;
        const sid = nextStepId();

        const card = document.createElement('div');
        card.className = 'step-card';
        card.dataset.sid = sid;

        card.innerHTML = `
            <div class="step-card-header">
                <div class="step-number">${stepNum}</div>
                <input type="text" class="step-title-input" placeholder="Step title (e.g. Stop the listener)"
                    value="${escapeHTML(stepData?.title || '')}">
                <button type="button" class="step-remove-btn" title="Remove step">${ICONS.close}</button>
            </div>
            <div class="step-card-body">
                <textarea class="step-command-input" placeholder="Command(s) for this step&#10;e.g. srvctl stop listener -n node1" rows="3">${escapeHTML(stepData?.command || '')}</textarea>
                <textarea class="step-desc-input" placeholder="Description / notes for this step (optional)" rows="2">${escapeHTML(stepData?.description || '')}</textarea>
                <div class="step-image-row">
                    <button type="button" class="step-upload-btn" data-sid="${sid}">
                        ${ICONS.image} Add Image
                    </button>
                    <div class="image-preview-row step-img-previews" data-sid="${sid}"></div>
                    <input type="file" class="step-file-input" data-sid="${sid}" accept="image/*" multiple style="display:none;">
                </div>
            </div>`;

        list.appendChild(card);

        // Pre-fill images if editing
        if (stepData?.images?.length) {
            const previewRow = card.querySelector('.step-img-previews');
            stepData.images.forEach(img => {
                addServerImagePreview(previewRow, img, sid, prefix);
            });
        }

        // Remove step
        card.querySelector('.step-remove-btn').addEventListener('click', () => {
            card.remove();
            renumberSteps(prefix);
        });

        // Image upload button → hidden input
        const uploadBtn = card.querySelector('.step-upload-btn');
        const fileInput = card.querySelector('.step-file-input');
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            handleStepImageSelect(fileInput, sid, prefix);
            fileInput.value = '';
        });

        renumberSteps(prefix);
    }

    function renumberSteps(prefix) {
        const list = document.getElementById(`${prefix}-steps-list`);
        Array.from(list.children).forEach((card, i) => {
            card.querySelector('.step-number').textContent = i + 1;
        });
    }

    function collectSteps(prefix) {
        const list = document.getElementById(`${prefix}-steps-list`);
        const steps = [];
        Array.from(list.children).forEach(card => {
            steps.push({
                title: card.querySelector('.step-title-input').value.trim(),
                command: card.querySelector('.step-command-input').value.trim(),
                description: card.querySelector('.step-desc-input').value.trim(),
                _sid: card.dataset.sid,
                _pendingFiles: Array.from(card.querySelectorAll('.step-img-previews .image-preview-thumb'))
                    .map(t => t._file).filter(Boolean),
            });
        });
        return steps;
    }

    // ─── IMAGE HANDLING (step) ───────────────────────────
    function handleStepImageSelect(fileInput, sid, prefix) {
        const previewRow = document.querySelector(`.step-img-previews[data-sid="${sid}"]`);
        Array.from(fileInput.files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const url = URL.createObjectURL(file);
            const thumb = document.createElement('div');
            thumb.className = 'image-preview-thumb';
            thumb._file = file;
            thumb._sid = sid;
            thumb.innerHTML = `<img src="${url}" alt=""><button type="button" class="img-remove-btn">${ICONS.close}</button>`;
            thumb.querySelector('.img-remove-btn').addEventListener('click', () => {
                URL.revokeObjectURL(url);
                thumb.remove();
            });
            previewRow.appendChild(thumb);
        });
    }

    // ─── IMAGE HANDLING (note-level for command type) ────
    function initNoteImageUpload(prefix) {
        const area = document.getElementById(`${prefix}-note-image-area`);
        const fileInput = area.querySelector('.note-image-file-input');
        const previewRow = document.getElementById(`${prefix}-note-image-previews`);

        area.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            Array.from(fileInput.files).forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const url = URL.createObjectURL(file);
                const thumb = document.createElement('div');
                thumb.className = 'image-preview-thumb';
                thumb._file = file;
                thumb.innerHTML = `<img src="${url}" alt=""><button type="button" class="img-remove-btn">${ICONS.close}</button>`;
                thumb.querySelector('.img-remove-btn').addEventListener('click', () => {
                    URL.revokeObjectURL(url);
                    thumb.remove();
                });
                previewRow.appendChild(thumb);
            });
            fileInput.value = '';
        });
    }

    function addServerImagePreview(previewRow, img, sid, prefix) {
        const thumb = document.createElement('div');
        thumb.className = 'image-preview-thumb';
        thumb._serverId = img.id;
        thumb.innerHTML = `<img src="${img.url}" alt="${escapeHTML(img.name || '')}"><button type="button" class="img-remove-btn">${ICONS.close}</button>`;
        thumb.querySelector('.img-remove-btn').addEventListener('click', async () => {
            // Delete from server immediately
            const res = await apiFetch(`api/images/${img.id}`, {
                method: 'DELETE',
                headers: authHeaders()
            });
            if (res && res.ok) {
                thumb.remove();
                showToast('Image removed');
            } else {
                showToast('Failed to remove image', true);
            }
        });
        previewRow.appendChild(thumb);
    }

    async function uploadPendingImages(noteId, previewRow, stepId = null) {
        const thumbs = previewRow.querySelectorAll('.image-preview-thumb');
        for (const thumb of thumbs) {
            if (thumb._file && !thumb._uploaded) {
                const fd = new FormData();
                fd.append('file', thumb._file);
                if (stepId) fd.append('step_id', stepId);
                const res = await apiFetch(`api/notes/${noteId}/images`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + currentToken },
                    body: fd
                });
                if (res && res.ok) {
                    thumb._uploaded = true;
                }
            }
        }
    }

    // ─── IMAGE LIGHTBOX ──────────────────────────────────
    function openLightbox(src) {
        const overlay = document.createElement('div');
        overlay.className = 'img-lightbox-overlay';
        overlay.innerHTML = `<img src="${escapeHTML(src)}" alt="Image preview">`;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }

    // ─── DATA FETCHING ───────────────────────────────────
    async function fetchNotes() {
        let url = 'api/notes?';
        const params = [];
        const q = document.getElementById('search-input').value.trim();
        if (q) params.push('q=' + encodeURIComponent(q));
        if (activeCategory) params.push('category=' + activeCategory);
        if (activeTag) params.push('tag=' + encodeURIComponent(activeTag));
        url += params.join('&');
        const res = await apiFetch(url);
        if (!res) return;
        allNotes = await res.json();
        renderNotes(allNotes);
    }

    async function fetchCategories() {
        const res = await apiFetch('api/categories');
        if (!res) return;
        allCategories = await res.json();
        renderSidebarCategories(allCategories);
        renderCategoryCards(allCategories);
        populateCategoryDropdowns(allCategories);
    }

    async function fetchTags() {
        const res = await apiFetch('api/tags');
        if (!res) return;
        allTags = await res.json();
        renderTags(allTags);
    }

    async function fetchStats() {
        const res = await apiFetch('api/stats');
        if (!res) return;
        const data = await res.json();
        const sn = document.getElementById('stat-notes');
        const sc = document.getElementById('stat-categories');
        const st = document.getElementById('stat-tags');
        if (sn) sn.textContent = data.total_notes || 0;
        if (sc) sc.textContent = data.total_categories || 0;
        if (st) st.textContent = data.total_tags || 0;
    }

    function refreshAll() { fetchNotes(); fetchCategories(); fetchTags(); fetchStats(); }

    // ─── RENDER: CATEGORY CARDS ──────────────────────────
    function renderCategoryCards(categories) {
        const grid = document.getElementById('category-cards-grid');
        const enabledCats = categories.filter(c => c.enabled);
        const totalNotes = enabledCats.reduce((sum, c) => sum + (c.note_count || 0), 0);

        let html = `<div class="category-card category-card-all${!activeCategory ? ' active' : ''}" data-cat-id="">
            <div class="category-card-icon">${ICONS.grid}</div>
            <div class="category-card-name">All</div>
            <div class="category-card-count">${totalNotes} notes</div>
        </div>`;

        enabledCats.forEach(cat => {
            const isActive = activeCategory == cat.id;
            html += `<div class="category-card${isActive ? ' active' : ''}" data-cat-id="${cat.id}">
                <div class="category-card-icon">${ICONS.folder}</div>
                <div class="category-card-name">${escapeHTML(cat.name)}</div>
                <div class="category-card-count">${cat.note_count || 0} notes</div>
            </div>`;
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const catId = card.dataset.catId;
                if (catId === '' || activeCategory == catId) {
                    activeCategory = null; activeCategoryName = null;
                } else {
                    activeCategory = catId;
                    const cat = allCategories.find(c => c.id == catId);
                    activeCategoryName = cat ? cat.name : '';
                }
                activeTag = null;
                updateFilterIndicator();
                fetchNotes();
                renderSidebarCategories(allCategories);
                renderCategoryCards(allCategories);
                renderTags(allTags);
            });
        });
    }

    // ─── RENDER: SIDEBAR CATEGORIES ─────────────────────
    function renderSidebarCategories(categories) {
        const list = document.getElementById('categories-list');
        const enabledCats = categories.filter(c => c.enabled);
        let html = '';
        enabledCats.forEach(cat => {
            const isActive = activeCategory == cat.id;
            html += `<li class="category-item${isActive ? ' active' : ''}" data-id="${cat.id}">
                <span class="category-item-name">${escapeHTML(cat.name)}</span>
                <span class="category-item-count">${cat.note_count || 0}</span>
            </li>`;
        });
        list.innerHTML = html;
        list.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                if (activeCategory == id) { activeCategory = null; activeCategoryName = null; }
                else { activeCategory = id; const cat = allCategories.find(c => c.id == id); activeCategoryName = cat ? cat.name : ''; }
                activeTag = null;
                updateFilterIndicator(); fetchNotes();
                renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
            });
        });
    }

    // ─── RENDER: TAGS ────────────────────────────────────
    function renderTags(tags) {
        const container = document.getElementById('tags-container');
        let html = '';
        tags.forEach(tag => {
            const isActive = activeTag === tag.name;
            html += `<span class="tag-pill-sidebar${isActive ? ' active' : ''}" data-tag="${escapeHTML(tag.name)}">
                ${escapeHTML(tag.name)}<span class="tag-pill-sidebar-count">${tag.usage_count || 0}</span>
            </span>`;
        });
        container.innerHTML = html;
        container.querySelectorAll('.tag-pill-sidebar').forEach(pill => {
            pill.addEventListener('click', () => {
                const tagName = pill.dataset.tag;
                if (activeTag === tagName) { activeTag = null; }
                else { activeTag = tagName; }
                activeCategory = null; activeCategoryName = null;
                updateFilterIndicator(); fetchNotes();
                renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
            });
        });
    }

    // ─── FILTER INDICATOR ────────────────────────────────
    function updateFilterIndicator() {
        const el = document.getElementById('filter-indicator');
        const textEl = document.getElementById('filter-indicator-text');
        if (activeCategory) {
            textEl.textContent = 'Category: ' + (activeCategoryName || activeCategory);
            el.style.display = 'inline-flex';
        } else if (activeTag) {
            textEl.textContent = 'Tag: ' + activeTag;
            el.style.display = 'inline-flex';
        } else {
            el.style.display = 'none';
        }
    }

    function clearFilter() {
        activeCategory = null; activeCategoryName = null; activeTag = null;
        updateFilterIndicator(); fetchNotes();
        renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
    }

    function populateCategoryDropdowns(categories) {
        const enabledCats = categories.filter(c => c.enabled);
        ['add-note-category', 'edit-note-category'].forEach(selectId => {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            const cur = sel.value;
            sel.innerHTML = '<option value="">None</option>';
            enabledCats.forEach(cat => { sel.innerHTML += `<option value="${cat.id}">${escapeHTML(cat.name)}</option>`; });
            sel.value = cur;
        });
    }

    // ─── RENDER: NOTES ───────────────────────────────────
    function renderNotes(notes) {
        const container = document.getElementById('notes-container');
        const emptyState = document.getElementById('empty-state');
        if (isAdminPageOpen) return;

        if (!notes || notes.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }
        emptyState.style.display = 'none';

        let html = '';
        notes.forEach((note, idx) => {
            const delay = Math.min(idx * 0.04, 0.4);
            const tagsHtml = (note.tags || []).map(t => `<span class="note-tag-pill">${escapeHTML(t)}</span>`).join('');
            const categoryBadge = note.category_name
                ? `<span class="note-category-badge">${ICONS.folder} ${escapeHTML(note.category_name)}</span>` : '';
            const metaHtml = `<span class="note-meta-user">${ICONS.user} ${escapeHTML(note.created_by_username || 'Unknown')}</span>`;
            const actions = currentToken
                ? `<div class="note-actions">
                    <button class="btn-icon note-edit-btn" data-id="${note.id}" title="Edit">${ICONS.edit}</button>
                    <button class="btn-icon btn-icon-danger note-delete-btn" data-id="${note.id}" title="Delete">${ICONS.trash}</button>
                   </div>` : '';

            const isProcedure = note.note_type === 'procedure';
            const typeBadge = `<span class="note-type-badge ${isProcedure ? 'type-procedure' : 'type-command'}">${isProcedure ? ICONS.steps + ' Procedure' : ICONS.copy + ' Command'}</span>`;

            if (isProcedure) {
                // Render procedure note summary (excerpt only)
                const steps = note.steps || [];
                const previewSteps = steps.slice(0, 3);
                const remaining = steps.length - previewSteps.length;
                const stepsPreviewHtml = previewSteps.map((step, si) => `
                    <div class="step-preview-item">
                        <span class="step-preview-num">${si + 1}</span>
                        <span class="step-preview-text">${escapeHTML(step.title || 'Step ' + (si + 1))}</span>
                    </div>`).join('');

                html += `<div class="note-item note-type-procedure" style="animation-delay:${delay}s" data-note-id="${note.id}">
                    <div style="width:100%;">
                        <div class="note-header">
                            <div>
                                ${typeBadge}
                                <a href="note/${note.id}" target="_blank" class="note-title-link"><h3 class="note-title">${escapeHTML(note.title)}</h3></a>
                            </div>
                            ${actions}
                        </div>
                        ${note.description ? `<p class="note-description">${escapeHTML(note.description)}</p>` : ''}
                        
                        <div class="procedure-card-summary">
                            <div class="step-preview-stack">${stepsPreviewHtml}</div>
                            ${remaining > 0 ? `<div class="step-preview-more">+${remaining} more step${remaining > 1 ? 's' : ''} &rarr;</div>` : ''}
                        </div>

                        <div class="note-meta">
                            ${categoryBadge}
                            ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                            ${metaHtml}
                            <span class="note-meta-steps">${ICONS.steps} ${steps.length} steps</span>
                        </div>
                    </div>
                </div>`;
            } else if (note.note_type === 'plain') {
                let renderedHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.description || '') : (note.description || '');
                const typeBadgePlain = `<span class="note-type-badge type-procedure" style="background-color: var(--primary);">${ICONS.copy} Plain Note</span>`;
                html += `<div class="note-item note-type-plain" style="animation-delay:${delay}s" data-note-id="${note.id}">
                    <div style="width:100%;">
                        <div class="note-header">
                            <div>
                                ${typeBadgePlain}
                                <a href="note/${note.id}" target="_blank" class="note-title-link"><h3 class="note-title">${escapeHTML(note.title)}</h3></a>
                            </div>
                            ${actions}
                        </div>
                        <div class="markdown-body" style="padding:1rem 0; font-size:14px; line-height:1.6;">${renderedHtml}</div>
                        
                        <div class="note-meta">
                            ${categoryBadge}
                            ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                            ${metaHtml}
                        </div>
                    </div>
                </div>`;
            } else {
                // Quick command note
                const noteImgsHtml = (note.images || []).map(img =>
                    `<div class="note-inline-image" data-src="${escapeHTML(img.url)}"><img src="${escapeHTML(img.url)}" alt=""></div>`
                ).join('');

                html += `<div class="note-item" style="animation-delay:${delay}s" data-note-id="${note.id}">
                    <div class="note-info">
                        <div class="note-header">
                            <div>
                                ${typeBadge}
                                <a href="note/${note.id}" target="_blank" class="note-title-link"><h3 class="note-title">${escapeHTML(note.title)}</h3></a>
                            </div>
                            ${actions}
                        </div>
                        ${note.description ? `<p class="note-description">${escapeHTML(note.description)}</p>` : ''}
                        <div class="note-meta">
                            ${categoryBadge}
                            ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                            ${metaHtml}
                        </div>
                        ${noteImgsHtml ? `<div class="note-inline-images">${noteImgsHtml}</div>` : ''}
                    </div>
                    <div class="note-command-wrapper">
                        <div class="note-code-block">
                            <pre class="note-code"><code>${escapeHTML(note.command)}</code></pre>
                            <button class="note-copy-btn" title="Copy">${ICONS.copy}</button>
                        </div>
                    </div>
                </div>`;
            }
        });

        container.innerHTML = html;

        // Attach copy buttons
        container.querySelectorAll('.note-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.closest('.note-code-block').querySelector('code').textContent;
                copyToClipboard(code, btn);
            });
        });

        // Attach edit/delete
        container.querySelectorAll('.note-edit-btn').forEach(btn => btn.addEventListener('click', () => openEditNoteModal(btn.dataset.id)));
        container.querySelectorAll('.note-delete-btn').forEach(btn => btn.addEventListener('click', () => deleteNote(btn.dataset.id)));

        // Image lightbox
        container.querySelectorAll('.procedure-step-image, .note-inline-image').forEach(el => {
            el.addEventListener('click', () => openLightbox(el.dataset.src));
        });
    }

    // --- RENDER: MODAL EDIT ---
    
    function copyToClipboard(text, btnEl) {
        const origIcon = btnEl.innerHTML;
        navigator.clipboard.writeText(text).then(() => {
            btnEl.innerHTML = ICONS.check;
            btnEl.classList.add('copied');
            setTimeout(() => { btnEl.innerHTML = origIcon; btnEl.classList.remove('copied'); }, 2000);
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy');
            document.body.removeChild(ta);
            btnEl.innerHTML = ICONS.check;
            btnEl.classList.add('copied');
            setTimeout(() => { btnEl.innerHTML = origIcon; btnEl.classList.remove('copied'); }, 2000);
        });
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        errorEl.style.display = 'none';

        const res = await apiFetch('api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res) { errorEl.textContent = 'Network error'; errorEl.style.display = 'block'; return; }
        const data = await res.json();
        if (res.ok) {
            currentToken = data.token;
            currentRole = data.role;
            currentUsername = data.username;
            localStorage.setItem('sn_token', currentToken);
            localStorage.setItem('sn_role', currentRole);
            localStorage.setItem('sn_username', currentUsername);
            closeModal('login-modal');
            updateAuthUI();
            renderNotes(allNotes);
            showToast('Logged in successfully');
        } else {
            errorEl.textContent = data.error || 'Login failed';
            errorEl.style.display = 'block';
        }
    }

    function resetAddForm() {
        document.getElementById('add-note-form').reset();
        document.getElementById('add-steps-list').innerHTML = '';
        document.getElementById('add-note-image-previews').innerHTML = '';
        setNoteType('add', 'command');
    }

    async function handleAddNote(e) {
        e.preventDefault();
        const title = document.getElementById('add-note-title').value.trim();
        const noteType = document.getElementById('add-note-type').value;
        const command = document.getElementById('add-note-command').value.trim();
        let description = document.getElementById('add-note-description').value.trim();
        const categoryId = document.getElementById('add-note-category').value;
        const tags = document.getElementById('add-note-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const steps = noteType === 'procedure' ? collectSteps('add') : [];

        if (noteType === 'command' && !command) { showToast('Command is required', true); return; }
        if (noteType === 'procedure' && steps.length === 0) { showToast('At least one step is required', true); return; }
        if (noteType === 'plain') {
            description = quillAdd ? quillAdd.root.innerHTML : '';
            if (!description.trim()) { showToast('Note content is required', true); return; }
        }

        const body = {
            title, note_type: noteType,
            description: description || null,
            category_id: categoryId ? parseInt(categoryId) : null,
            tags
        };
        if (noteType === 'command') body.command = command;
        if (noteType === 'procedure') body.steps = steps;

        const res = await apiFetch('api/notes', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });

        if (res && res.ok) {
            closeModal('add-note-modal');
            showToast('Command added successfully');
            fetchNotes();
            fetchCategories();
        } else {
            showToast('Failed to add command', true);
        }
    }

    async function deleteNote(id) {
        if (!confirm('Are you sure you want to delete this command?')) return;
        const res = await apiFetch('api/notes/' + id, { method: 'DELETE' });
        if (res && res.ok) {
            showToast('Command deleted');
            fetchNotes();
        } else {
            showToast('Failed to delete', true);
        }
    }

    // --- RENDER: MODAL EDIT ---
    function openEditNoteModal(noteId) {
        const note = allNotes.find(n => n.id == noteId);
        if (!note) return;
        editNoteId = note.id;

        document.getElementById('edit-note-id').value = note.id;
        document.getElementById('edit-note-title').value = note.title;
        document.getElementById('edit-note-command').value = note.command || '';
        document.getElementById('edit-note-description').value = note.description || '';
        
        if (quillEdit) {
            quillEdit.root.innerHTML = note.note_type === 'plain' ? (note.description || '') : '';
        }
        document.getElementById('edit-note-category').value = note.category_id || '';
        document.getElementById('edit-note-tags').value = (note.tags || []).join(', ');

        // Reset steps list
        document.getElementById('edit-steps-list').innerHTML = '';
        document.getElementById('edit-note-image-previews').innerHTML = '';

        // Set note type and populate steps
        setNoteType('edit', note.note_type || 'command');
        if (note.note_type === 'procedure' && note.steps) {
            note.steps.forEach(step => addStep('edit', step));
        }

        // Show existing note-level images for edit
        if (note.images && note.images.length) {
            const previewRow = document.getElementById('edit-note-image-previews');
            note.images.forEach(img => addServerImagePreview(previewRow, img, null, 'edit'));
        }

        openModal('edit-note-modal');
    }

    async function handleEditNote(e) {
        e.preventDefault();
        const noteId = document.getElementById('edit-note-id').value;
        const title = document.getElementById('edit-note-title').value.trim();
        const noteType = document.getElementById('edit-note-type').value;
        const command = document.getElementById('edit-note-command').value.trim();
        let description = document.getElementById('edit-note-description').value.trim();
        const categoryId = document.getElementById('edit-note-category').value;
        const tags = document.getElementById('edit-note-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const steps = noteType === 'procedure' ? collectSteps('edit') : [];

        if (noteType === 'command' && !command) { showToast('Command is required', true); return; }
        if (noteType === 'procedure' && steps.length === 0) { showToast('At least one step is required', true); return; }
        if (noteType === 'plain') {
            description = quillEdit ? quillEdit.root.innerHTML : '';
            if (!description.trim()) { showToast('Note content is required', true); return; }
        }

        const body = {
            title, note_type: noteType,
            command: noteType === 'command' ? command : '',
            description, tags,
            steps: steps.map(s => ({ title: s.title, command: s.command, description: s.description }))
        };
        if (categoryId) body.category_id = parseInt(categoryId);

        const res = await apiFetch('api/notes/' + noteId, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to update note', true); return; }

        // Upload any new note-level images
        if (noteType === 'command') {
            const previewRow = document.getElementById('edit-note-image-previews');
            await uploadPendingImages(noteId, previewRow);
        }

        // Upload new step images
        if (noteType === 'procedure' && steps.length > 0) {
            const noteRes2 = await apiFetch('api/notes');
            if (noteRes2 && noteRes2.ok) {
                const allN = await noteRes2.json();
                const updatedNote = allN.find(n => n.id == noteId);
                if (updatedNote && updatedNote.steps) {
                    const list = document.getElementById('edit-steps-list');
                    const cards = Array.from(list.children);
                    for (let i = 0; i < updatedNote.steps.length; i++) {
                        const serverStep = updatedNote.steps[i];
                        const card = cards[i];
                        if (!card) continue;
                        const previewRow = card.querySelector('.step-img-previews');
                        await uploadPendingImages(noteId, previewRow, serverStep.id);
                    }
                }
            }
        }

        closeModal('edit-note-modal');
        showToast('Note updated!');
        refreshAll();
    }

    // ─── DELETE NOTE ─────────────────────────────────────
    async function deleteNote(noteId) {
        if (!confirm('Delete this note? This cannot be undone.')) return;
        const res = await apiFetch('api/notes/' + noteId, { method: 'DELETE', headers: authHeaders() });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to delete note', true); return; }
        showToast('Note deleted.'); refreshAll();
    }

    // ═══════════════════════════════════════════════════════
    //  ADMIN PAGE HANDLERS
    // ═══════════════════════════════════════════════════════

    async function loadAdminCategories() {
        const res = await apiFetch('api/categories');
        if (!res) return;
        renderAdminCategories(await res.json());
    }

    function renderAdminCategories(categories) {
        const tbody = document.getElementById('ap-categories-tbody');
        if (!tbody) return;
        let html = '';
        categories.forEach(cat => {
            html += `<tr>
                <td><strong>${escapeHTML(cat.name)}</strong></td>
                <td>${cat.note_count || 0}</td>
                <td><label class="toggle-switch">
                    <input type="checkbox" ${cat.enabled ? 'checked' : ''} data-cat-id="${cat.id}" class="cat-toggle-input">
                    <span class="toggle-slider"></span>
                </label></td>
                <td><button class="btn-icon btn-icon-danger cat-delete-btn" data-cat-id="${cat.id}">${ICONS.trash}</button></td>
            </tr>`;
        });
        tbody.innerHTML = html;

        tbody.querySelectorAll('.cat-toggle-input').forEach(input => {
            input.addEventListener('change', async () => {
                const res = await apiFetch('api/categories/' + input.dataset.catId + '/toggle', { method: 'PUT', headers: authHeaders() });
                if (res && res.ok) { showToast('Category updated'); loadAdminCategories(); fetchCategories(); }
                else { showToast('Failed to toggle category', true); loadAdminCategories(); }
            });
        });

        tbody.querySelectorAll('.cat-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this category? Notes will become uncategorized.')) return;
                const res = await apiFetch('api/categories/' + btn.dataset.catId, { method: 'DELETE', headers: authHeaders() });
                if (res && res.ok) { showToast('Category deleted'); loadAdminCategories(); fetchCategories(); fetchStats(); }
                else { showToast('Failed to delete category', true); }
            });
        });
    }

    async function handleCreateCategory(e) {
        e.preventDefault();
        const name = document.getElementById('ap-category-name').value.trim();
        if (!name) return;
        const res = await apiFetch('api/categories', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name }) });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to create category', true); return; }
        document.getElementById('ap-category-name').value = '';
        showToast('Category created!'); loadAdminCategories(); fetchCategories(); fetchStats();
    }

    async function loadAdminUsers() {
        const res = await apiFetch('api/users', { headers: authHeaders() });
        if (!res || !res.ok) return;
        renderAdminUsers(await res.json());
    }

    function renderAdminUsers(users) {
        const tbody = document.getElementById('ap-users-tbody');
        if (!tbody) return;
        let html = '';
        users.forEach(u => {
            const isSelf = u.username === currentUsername;
            html += `<tr>
                <td>${escapeHTML(u.username)}${isSelf ? ' <span style="color:var(--accent);font-size:0.75rem;">(you)</span>' : ''}</td>
                <td><span class="status-badge ${u.role === 'admin' ? 'enabled' : 'disabled'}">${escapeHTML(u.role)}</span></td>
                <td>${!isSelf ? `<button class="btn-icon btn-icon-danger user-delete-btn" data-user-id="${u.id}">${ICONS.trash}</button>` : ''}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
        tbody.querySelectorAll('.user-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this user?')) return;
                const res = await apiFetch('api/users/' + btn.dataset.userId, { method: 'DELETE', headers: authHeaders() });
                if (res && res.ok) { showToast('User deleted.'); loadAdminUsers(); }
                else { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to delete user', true); }
            });
        });
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        const username = document.getElementById('ap-create-user-username').value.trim();
        const password = document.getElementById('ap-create-user-password').value;
        const role = document.getElementById('ap-create-user-role').value;
        const res = await apiFetch('api/users', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ username, password, role }) });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to create user', true); return; }
        document.getElementById('ap-create-user-form').reset();
        showToast('User created!'); loadAdminUsers();
    }

    async function loadAdminSettings() {
        const res = await apiFetch('api/settings', { headers: authHeaders() });
        if (!res) return;
        const data = await res.json();
        const proxyInput = document.getElementById('ap-settings-proxy-url');
        if (proxyInput && data.reverse_proxy_url != null) proxyInput.value = data.reverse_proxy_url;
        
        const backupEnabled = document.getElementById('ap-autobackup-enabled');
        if (backupEnabled && data.autobackup_enabled != null) backupEnabled.checked = (data.autobackup_enabled !== '0');
        
        const backupRetention = document.getElementById('ap-backup-retention');
        if (backupRetention && data.backup_retention_days != null) backupRetention.value = data.backup_retention_days;

        const backupLocation = document.getElementById('ap-backup-location');
        if (backupLocation && data.backup_location != null) backupLocation.value = data.backup_location;
    }

    async function handleSaveSettings(e) {
        e.preventDefault();
        const reverseProxyUrl = document.getElementById('ap-settings-proxy-url').value.trim();
        const res = await apiFetch('api/settings', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ reverse_proxy_url: reverseProxyUrl }) });
        if (res && res.ok) { showToast('Settings saved!'); }
        else { showToast('Failed to save settings', true); }
    }

    function handleBackupDownload() {
        if (!currentToken) return;
        const a = document.createElement('a');
        a.href = 'api/backup?token=' + encodeURIComponent(currentToken);
        a.download = 'sysadmin_notes_backup.db';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        showToast('Downloading backup...');
    }

    async function handleRestore(e) {
        e.preventDefault();
        const fileInput = document.getElementById('ap-restore-file');
        if (!fileInput.files[0]) return;
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const res = await apiFetch('api/restore', { method: 'POST', headers: { 'Authorization': 'Bearer ' + currentToken }, body: formData });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Restore failed', true); return; }
        showToast('Database restored! Refreshing...'); fileInput.value = '';
        setTimeout(() => { refreshAll(); loadAdminCategories(); loadAdminUsers(); }, 500);
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        const oldPassword = document.getElementById('ap-change-old-password').value;
        const newPassword = document.getElementById('ap-change-new-password').value;
        const confirmPassword = document.getElementById('ap-change-confirm-password').value;
        if (newPassword !== confirmPassword) { showToast('New passwords do not match!', true); return; }
        const res = await apiFetch('api/change-password', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to change password', true); return; }
        document.getElementById('ap-change-password-form').reset();
        showToast('Password changed successfully!');
    }

    // ─── SIDEBAR MOBILE ──────────────────────────────────
    function openSidebar() {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebar-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    function isInputFocused() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    }

    // ═══════════════════════════════════════════════════════
    //  INIT & EVENT LISTENERS
    // ═══════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('sidebar-collapsed') === 'true' && window.innerWidth > 768) {
            document.body.classList.add('desktop-collapsed');
        }
        const quillOptions = {
            theme: 'snow',
            modules: {
                imageResize: { displaySize: true },
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        };
        if (typeof Quill !== 'undefined') {
            quillAdd = new Quill('#add-note-plain', quillOptions);
            quillEdit = new Quill('#edit-note-plain', quillOptions);
        }

        initTheme();
        initView();
        updateAuthUI();
        fetchStats();
        fetchCategories();
        fetchTags();
        fetchNotes();

        // Note type toggles (form)
        initNoteTypeToggle('add');
        initNoteTypeToggle('edit');

        // Image uploads (note-level, command type)
        initNoteImageUpload('add');
        initNoteImageUpload('edit');

        // Theme
        document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

        // View toggle
        document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

        // Search
        document.getElementById('search-input').addEventListener('input', debounce(fetchNotes, 300));

        // Filter clear
        document.getElementById('filter-clear-btn').addEventListener('click', clearFilter);

        // Auth
        document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('logout-btn').addEventListener('click', doLogout);

        // Notes
        document.getElementById('add-note-btn').addEventListener('click', () => {
            resetAddForm();
            openModal('add-note-modal');
        });
        document.getElementById('add-note-form').addEventListener('submit', handleAddNote);
        document.getElementById('edit-note-form').addEventListener('submit', handleEditNote);

        // Step add buttons
        document.getElementById('add-step-btn').addEventListener('click', () => addStep('add'));
        document.getElementById('edit-step-btn').addEventListener('click', () => addStep('edit'));

        // Admin page
        document.getElementById('admin-btn').addEventListener('click', openAdminPage);
        document.getElementById('admin-back-btn').addEventListener('click', closeAdminPage);

        // Clear Cache Button
        document.getElementById('ap-clear-cache-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear frontend cache and reload?')) {
                location.reload(true);
            }
        });

        // Auto-Backup Settings
        document.getElementById('ap-backup-settings-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const enabled = document.getElementById('ap-autobackup-enabled').checked ? '1' : '0';
            const retention = document.getElementById('ap-backup-retention').value;
            const location = document.getElementById('ap-backup-location').value;
            const res = await apiFetch('api/settings', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ autobackup_enabled: enabled, backup_retention_days: retention, backup_location: location })
            });
            if (res && res.ok) {
                showToast('Auto-backup settings saved');
            } else {
                showToast('Failed to save settings', true);
            }
        });

        // Admin tabs
        document.querySelectorAll('.admin-page-tab').forEach(tab => tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab)));

        // Admin forms
        document.getElementById('ap-create-category-form').addEventListener('submit', handleCreateCategory);
        document.getElementById('ap-create-user-form').addEventListener('submit', handleCreateUser);
        document.getElementById('ap-settings-form').addEventListener('submit', handleSaveSettings);
        document.getElementById('ap-backup-download-btn').addEventListener('click', handleBackupDownload);
        document.getElementById('ap-restore-form').addEventListener('submit', handleRestore);
        document.getElementById('ap-change-password-form').addEventListener('submit', handleChangePassword);

        // Modal close
        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modal)));
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
        });

        // Sidebar mobile
        document.getElementById('hamburger-btn').addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                openSidebar();
            } else {
                document.body.classList.toggle('desktop-collapsed');
                localStorage.setItem('sidebar-collapsed', document.body.classList.contains('desktop-collapsed') ? 'true' : 'false');
            }
        });
        document.getElementById('sidebar-close-btn').addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            } else {
                document.body.classList.toggle('desktop-collapsed');
                localStorage.setItem('sidebar-collapsed', document.body.classList.contains('desktop-collapsed') ? 'true' : 'false');
            }
        });
        document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !isInputFocused())) {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }
            if (e.key === 'Escape') {
                closeAllModals();
                closeSidebar();
                if (isAdminPageOpen) closeAdminPage();
                document.querySelectorAll('.img-lightbox-overlay').forEach(el => el.remove());
            }
        });
    });

})();
