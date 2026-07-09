/* ═══════════════════════════════════════════════════════
   SysNotes — Application Logic v3 (Steps + Images)
   Author: aloysiuspattath
   GitHub: https://github.com/aloysiuspattath
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── DOMPurify Configuration ─────────────────────────
    if (typeof DOMPurify !== 'undefined') {
        DOMPurify.setConfig({ ADD_ATTR: ['target', 'rel'] });
        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
            if (node.tagName === 'A') {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

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
        file_pdf: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        file_word: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l1.5-4 1.5 4M15 15l-1.5-4-1.5 4"></path></svg>',
        file_excel: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13l3 4 3-4M11 13v4"></path></svg>',
        file_csv: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 15h8M8 11h8"></path></svg>',
        file_text: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    };

    function isDocumentUrl(url) {
        return /\.(pdf|doc|docx|txt|csv|xlsx)(\?.*)?$/i.test(url);
    }
    
    function getDocumentThumb(url, name) {
        let icon = ICONS.file_pdf;
        if (/\.(doc|docx)(\?.*)?$/i.test(url) || /\.(doc|docx)$/i.test(name)) icon = ICONS.file_word;
        if (/\.(xlsx)(\?.*)?$/i.test(url) || /\.(xlsx)$/i.test(name)) icon = ICONS.file_excel;
        if (/\.(csv)(\?.*)?$/i.test(url) || /\.(csv)$/i.test(name)) icon = ICONS.file_csv;
        if (/\.(txt)(\?.*)?$/i.test(url) || /\.(txt)$/i.test(name)) icon = ICONS.file_text;
        return `<div class="doc-thumb" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg-tertiary); color:var(--text); padding:10px; text-align:center; word-break:break-all;"><div style="margin-bottom:8px;">${icon}</div><span style="font-size:10px; line-height:1.2;">${escapeHTML(name||'Document')}</span></div>`;
    }

    // ─── STATE ──────────────────────────────────────────
    let currentToken = localStorage.getItem('sn_token') || null;
    let currentRole = localStorage.getItem('sn_role') || null;
    let currentUsername = localStorage.getItem('sn_username') || null;
    let quillAdd = null;
    let quillEdit = null;
    let currentView = localStorage.getItem('sn_view') || 'view-stack';
    let activeCategory = null;
    let activeCategoryName = null;
    let activePending = false;
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

    function autolink(text) {
        if (!text) return '';
        const escaped = escapeHTML(text);
        const urlPattern = /((?:https?|ftp):\/\/[^\s<]+)/g;
        let result = escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        const fileUrlPattern = /(file:\/\/[^\s<]+)/g;
        result = result.replace(fileUrlPattern, function(match) {
            return `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a> <button type="button" class="btn btn-secondary btn-xs copy-path-btn" data-path="${escapeHTML(match)}" style="display:inline-flex; padding:2px 6px; font-size:10px; margin-left:5px; height:auto; line-height:1; vertical-align:middle;">Copy Link</button>`;
        });

        const uncPattern = /(\\\\[a-zA-Z0-9_.-]+\\[^\s<]+)/g;
        result = result.replace(uncPattern, function(match) {
            const cleanPath = match.replace(/\\/g, '/');
            return `<a href="file:///${cleanPath}" target="_blank" rel="noopener noreferrer">${match}</a> <button type="button" class="btn btn-secondary btn-xs copy-path-btn" data-path="${escapeHTML(match)}" style="display:inline-flex; padding:2px 6px; font-size:10px; margin-left:5px; height:auto; line-height:1; vertical-align:middle;">Copy Path</button>`;
        });
        return result;
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
            if (adminBtn) adminBtn.style.display = (currentRole === 'admin' || currentRole === 'moderator') ? '' : 'none';
            updatePendingCount();
        } else {
            loggedOut.style.display = 'flex';
            loggedIn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
            const pendingNav = document.getElementById('sidebar-pending-notes');
            if (pendingNav) pendingNav.style.display = 'none';
        }
    }

    function doLogout() {
        currentToken = null; currentRole = null; currentUsername = null;
        localStorage.removeItem('sn_token');
        localStorage.removeItem('sn_role');
        localStorage.removeItem('sn_username');
        activePending = false;
        updateAuthUI();
        if (isAdminPageOpen) closeAdminPage();
        renderNotes(allNotes);
    }

    // ─── MODALS ──────────────────────────────────────────
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }
    function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); }
    window.openModal = openModal;
    window.closeModal = closeModal;

    // ─── ADMIN PAGE ──────────────────────────────────────
    function openAdminPage() {
        isAdminPageOpen = true;
        document.getElementById('notes-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('category-cards-grid').style.display = 'none';
        document.getElementById('admin-page').style.display = 'block';

        const optPending = document.getElementById('opt-pending-tab-btn');
        const optCategories = document.getElementById('opt-categories-tab-btn');
        const optUsers = document.getElementById('opt-users-tab-btn');
        const optSettings = document.getElementById('opt-settings-tab-btn');
        const optBackup = document.getElementById('opt-backup-tab-btn');
        const optAudit = document.getElementById('opt-audit-tab-btn');

        if (currentRole === 'moderator') {
            if (optCategories) optCategories.style.display = 'none';
            if (optUsers) optUsers.style.display = 'none';
            if (optSettings) optSettings.style.display = 'none';
            if (optBackup) optBackup.style.display = 'none';
            if (optAudit) optAudit.style.display = 'none';
            loadPendingNotes();
        } else {
            if (optCategories) optCategories.style.display = '';
            if (optUsers) optUsers.style.display = '';
            if (optSettings) optSettings.style.display = '';
            if (optBackup) optBackup.style.display = '';
            if (optAudit) optAudit.style.display = '';
            loadPendingNotes();
            loadAdminCategories();
            loadAdminUsers();
            loadAdminSettings();
            loadAdminAudit();
        }
        
        switchAdminTab('ap-pending-tab');
    }

    function closeAdminPage() {
        isAdminPageOpen = false;
        document.getElementById('admin-page').style.display = 'none';
        document.getElementById('category-cards-grid').style.display = '';
        document.getElementById('notes-container').style.display = '';
        renderNotes(allNotes);
    }

    function switchAdminTab(tabId) {
        document.querySelectorAll('.admin-page-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        document.querySelectorAll('.admin-page-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === tabId);
            c.style.display = (c.id === tabId) ? 'block' : 'none';
        });

        if (tabId === 'ap-pending-tab') loadAdminPending();
        if (tabId === 'ap-categories-tab') loadAdminCategories();
        if (tabId === 'ap-users-tab') loadAdminUsers();
        if (tabId === 'ap-settings-tab') loadAdminSettings();
        if (tabId === 'ap-audit-tab') loadAdminAudit();
    }

    // ─── NOTE TYPE TOGGLE ────────────────────────────────
    function initNoteTypeToggle(prefix) {
        const typeHidden = document.getElementById(`${prefix}-note-type`);
        const commandSection = document.getElementById(`${prefix}-command-section`);
        const stepsSection = document.getElementById(`${prefix}-steps-section`);

        document.querySelectorAll(`#${prefix}-type-command, #${prefix}-type-procedure, #${prefix}-type-plain, #${prefix}-type-document`).forEach(btn => {
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
        const documentSection = document.getElementById(`${prefix}-document-section`);
        typeHidden.value = type;
        document.querySelectorAll(`#${prefix}-type-command, #${prefix}-type-procedure, #${prefix}-type-plain, #${prefix}-type-document`).forEach(b => {
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
        if (documentSection) documentSection.style.display = type === 'document' ? '' : 'none';
        
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
                        ${ICONS.image} Add File
                    </button>
                    <div class="image-preview-row step-img-previews" data-sid="${sid}"></div>
                    <input type="file" class="step-file-input" data-sid="${sid}" accept="image/*,.pdf,.doc,.docx" multiple style="display:none;">
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
            const allowedExt = ['png','jpg','jpeg','gif','webp','bmp','pdf','doc','docx','txt','csv','xlsx'];
            const ext = file.name.split('.').pop().toLowerCase();
            if (!allowedExt.includes(ext)) { showToast('Invalid file format', true); return; }
                if (file.size > 10 * 1024 * 1024) { showToast('File exceeds 10MB limit', true); return; }
            const url = URL.createObjectURL(file);
            const thumb = document.createElement('div');
            thumb.className = 'image-preview-thumb';
            thumb._file = file;
            thumb._sid = sid;
            const isDoc = isDocumentUrl(file.name);
            const inner = isDoc ? getDocumentThumb(file.name, file.name) : `<img src="${url}" alt="">`;
            thumb.innerHTML = `${inner}<button type="button" class="img-remove-btn">${ICONS.close}</button>`;
            thumb.querySelector('.img-remove-btn').addEventListener('click', () => {
                URL.revokeObjectURL(url);
                thumb.remove();
            });
            previewRow.appendChild(thumb);
        });
    }

    // ─── IMAGE HANDLING (note-level for command type) ────
    function initNoteUploadArea(areaId, fileInputSelector, previewRowId) {
        const area = document.getElementById(areaId);
        if (!area) return;
        const fileInput = area.querySelector(fileInputSelector);
        const previewRow = document.getElementById(previewRowId);

        area.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            Array.from(fileInput.files).forEach(file => {
                const allowedExt = ['png','jpg','jpeg','gif','webp','bmp','pdf','doc','docx','txt','csv','xlsx'];
                const ext = file.name.split('.').pop().toLowerCase();
                if (!allowedExt.includes(ext)) { showToast('Invalid file format', true); return; }
                if (file.size > 10 * 1024 * 1024) { showToast('File exceeds 10MB limit', true); return; }
                const url = URL.createObjectURL(file);
                const thumb = document.createElement('div');
                thumb.className = 'image-preview-thumb';
                thumb._file = file;
                const isDoc = isDocumentUrl(file.name);
                const inner = isDoc ? getDocumentThumb(file.name, file.name) : `<img src="${url}" alt="">`;
                thumb.innerHTML = `${inner}<button type="button" class="img-remove-btn">${ICONS.close}</button>`;
                thumb.querySelector('.img-remove-btn').addEventListener('click', () => {
                    URL.revokeObjectURL(url);
                    thumb.remove();
                });
                previewRow.appendChild(thumb);
            });
            fileInput.value = '';
        });
    }
    function initNoteImageUpload(prefix) {
        initNoteUploadArea(`${prefix}-note-image-area`, '.note-image-file-input', `${prefix}-note-image-previews`);
        initNoteUploadArea(`${prefix}-note-document-area`, '.note-image-file-input', `${prefix}-note-document-previews`);
    }

    

    function addServerImagePreview(previewRow, img, sid, prefix) {
        const thumb = document.createElement('div');
        thumb.className = 'image-preview-thumb';
        thumb._serverId = img.id;
        const isDoc = isDocumentUrl(img.url);
        const inner = isDoc ? getDocumentThumb(img.url, img.name) : `<img src="${img.url}" alt="${escapeHTML(img.name || '')}">`;
        thumb.innerHTML = `${inner}<button type="button" class="img-remove-btn">${ICONS.close}</button>`;
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
        if (/\.(doc|docx|txt|csv|xlsx)(\?.*)?$/i.test(src)) {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = src;
            document.body.appendChild(iframe);
            setTimeout(() => iframe.remove(), 2000);
            return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'img-lightbox-overlay';
        if (/\.pdf(\?.*)?$/i.test(src)) {
            overlay.innerHTML = `<object data="${escapeHTML(src)}" type="application/pdf" style="width:80%; height:85vh; border:none; background:white; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.5);"><p>Your browser does not support PDFs. <a href="${escapeHTML(src)}">Download the PDF</a>.</p></object>`;
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = 'position:absolute; top:10px; right:10px; background:var(--bg); border:none; color:var(--text); font-size:24px; cursor:pointer; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:1001;';
            closeBtn.onclick = () => overlay.remove();
            overlay.appendChild(closeBtn);
        } else {
            overlay.innerHTML = `<img src="${escapeHTML(src)}" alt="Image preview">`;
            overlay.addEventListener('click', () => overlay.remove());
        }
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
        if (activePending) params.push('status=pending');
        url += params.join('&');
        const res = await apiFetch(url, { headers: authHeaders() });
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

    function refreshAll() { fetchNotes(); fetchCategories(); fetchTags(); fetchStats(); updatePendingCount(); }

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
                activePending = false;
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
                activeTag = null; activePending = false;
                if (isAdminPageOpen) closeAdminPage();
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
                activeCategory = null; activeCategoryName = null; activePending = false;
                if (isAdminPageOpen) closeAdminPage();
                updateFilterIndicator(); fetchNotes();
                renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
            });
        });
    }

    // ─── FILTER INDICATOR ────────────────────────────────
    function updateFilterIndicator() {
        const el = document.getElementById('filter-indicator');
        const textEl = document.getElementById('filter-indicator-text');
        if (activePending) {
            textEl.innerHTML = '<span style="color:#f59e0b; display:flex; align-items:center; gap:6px;">⏱️ My Pending Notes</span>';
            el.style.display = 'inline-flex';
        } else if (activeCategory) {
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
        activeCategory = null; activeCategoryName = null; activeTag = null; activePending = false;
        if (isAdminPageOpen) closeAdminPage();
        updateFilterIndicator(); fetchNotes();
        renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
    }

    window.showMyPendingNotes = function() {
        if (currentRole === 'admin' || currentRole === 'moderator') {
            openAdminPage();
            switchAdminTab('ap-pending-tab');
        } else {
            activePending = true;
            activeCategory = null; activeCategoryName = null; activeTag = null;
            document.getElementById('notes-container').style.display = '';
            document.getElementById('empty-state').style.display = 'none';
            document.getElementById('category-cards-grid').style.display = 'none';
            if (isAdminPageOpen) closeAdminPage();
            updateFilterIndicator();
            fetchNotes();
            if (window.innerWidth <= 768) closeSidebar();
        }
    };
    
    async function updatePendingCount() {
        if (!currentToken) {
            document.getElementById('sidebar-pending-notes').style.display = 'none';
            return;
        }
        try {
            const res = await apiFetch('api/notes?status=pending', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                const count = notes.length;
                document.getElementById('sidebar-pending-count').textContent = count;
                document.getElementById('sidebar-pending-notes').style.display = count > 0 ? 'block' : 'none';
            }
        } catch (err) {
            console.error('Error fetching pending notes count', err);
        }
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
    function buildNoteCardHtml(note, isReviewMode, delay) {
        const tagsHtml = (note.tags || []).map(t => `<span class="note-tag-pill">${escapeHTML(t)}</span>`).join('');
        const categoryBadge = note.category_name
            ? `<span class="note-category-badge">${ICONS.folder} ${escapeHTML(note.category_name)}</span>` : '';
        const metaHtml = `<span class="note-meta-user">${ICONS.user} ${escapeHTML(note.created_by_username || 'Unknown')}</span>`;
        const isCreator = (currentToken && note.created_by_username === currentUsername);
        const canModify = currentToken && (currentRole === 'admin' || currentRole === 'moderator' || isCreator);
        
        const actions = isReviewMode
            ? ''
            : (canModify
                ? `<div class="note-actions">
                    <button class="btn-icon note-edit-btn" data-id="${note.id}" title="Edit">${ICONS.edit}</button>
                    <button class="btn-icon btn-icon-danger note-delete-btn" data-id="${note.id}" title="Delete">${ICONS.trash}</button>
                   </div>` : '');

        const isProcedure = note.note_type === 'procedure';
        const typeBadge = `<span class="note-type-badge ${isProcedure ? 'type-procedure' : 'type-command'}">${isProcedure ? ICONS.steps + ' Procedure' : ICONS.copy + ' Command'}</span>`;
        
        const pendingBadge = !note.approved
            ? `<span class="note-pending-badge" style="background: rgba(245, 158, 11, 0.15); color: rgb(245, 158, 11); margin-left: 8px; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; border: 1px solid rgba(245, 158, 11, 0.3);">⏱️ Pending</span>`
            : '';

        if (isProcedure) {
            const steps = note.steps || [];
            let stepsContentHtml = '';
            if (isReviewMode) {
                stepsContentHtml = steps.map((step, si) => `
                    <div style="margin-top: 10px; background: var(--bg-tertiary); padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
                        <div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">
                            Step ${si + 1}: ${escapeHTML(step.title || '')}
                        </div>
                        ${step.description ? `<p style="margin-top: 4px; font-size: 0.88rem; color: var(--text-secondary);">${escapeHTML(step.description)}</p>` : ''}
                        ${step.command ? `<pre style="background: var(--bg-primary); padding: 8px 12px; border-radius: 4px; overflow-x: auto; font-family: monospace; font-size: 0.82rem; border: 1px solid var(--border); color: var(--text); margin-top: 6px;"><code>${escapeHTML(step.command)}</code></pre>` : ''}
                    </div>
                `).join('');
            } else {
                const previewSteps = steps.slice(0, 3);
                const remaining = steps.length - previewSteps.length;
                const previewHtml = previewSteps.map((step, si) => `
                    <div class="step-preview-item">
                        <span class="step-preview-num">${si + 1}</span>
                        <span class="step-preview-text">${escapeHTML(step.title || 'Step ' + (si + 1))}</span>
                    </div>`).join('');
                stepsContentHtml = `
                    <div class="procedure-card-summary">
                        <div class="step-preview-stack">${previewHtml}</div>
                        ${remaining > 0 ? `<div class="step-preview-more">+${remaining} more step${remaining > 1 ? 's' : ''} &rarr;</div>` : ''}
                    </div>
                `;
            }

            return `<div class="note-item note-type-procedure" style="animation-delay:${delay}s" data-note-id="${note.id}">
                <div style="width:100%;">
                    <div class="note-header">
                        <div>
                            ${typeBadge}
                            ${pendingBadge}
                            <a href="note/${note.id}" target="_blank" class="note-title-link"><h3 class="note-title">${escapeHTML(note.title)}</h3></a>
                        </div>
                        ${actions}
                    </div>
                    ${note.description ? `<p class="note-description">${autolink(note.description)}</p>` : ''}
                    
                    ${stepsContentHtml}

                    <div class="note-meta">
                        ${categoryBadge}
                        ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                        ${metaHtml}
                        <span class="note-meta-steps">${ICONS.steps} ${steps.length} steps</span>
                    </div>
                </div>
            </div>`;
        } else if (note.note_type === 'document') {
            const noteImgsHtml = (note.images || []).map(img => {
                if (isDocumentUrl(img.url)) {
                    return `<div class="note-inline-image doc-link" data-src="${escapeHTML(img.url)}" style="cursor:pointer; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; width:80px; height:80px;">${getDocumentThumb(img.url, img.name || 'Document')}</div>`;
                }
                return `<div class="note-inline-image" data-src="${escapeHTML(img.url)}"><img src="${escapeHTML(img.url)}" alt=""></div>`;
            }).join('');

            return `<div class="note-item note-type-plain" style="animation-delay:${delay}s" data-note-id="${note.id}">
                <div style="width:100%;">
                    <div class="note-header">
                        <div>
                            <span class="note-type-badge type-procedure" style="background-color: var(--secondary);">${ICONS.file_pdf} DOCS / SOP</span>
                            ${pendingBadge}
                            <a href="note/${note.id}" target="_blank" class="note-title-link"><h3 class="note-title">${escapeHTML(note.title)}</h3></a>
                        </div>
                        ${actions}
                    </div>
                    ${note.description ? `<p class="note-description" style="margin-top:10px;">${autolink(note.description)}</p>` : ''}
                    ${noteImgsHtml ? `<div class="note-inline-images" style="margin-top:10px;">${noteImgsHtml}</div>` : ''}
                    
                    <div class="note-meta">
                        ${categoryBadge}
                        ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                        ${metaHtml}
                    </div>
                </div>
            </div>`;
        } else if (note.note_type === 'plain') {
            let renderedHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.description || '') : escapeHTML(note.description || '');
            const typeBadgePlain = `<span class="note-type-badge type-procedure" style="background-color: var(--primary);">${ICONS.copy} Plain Note</span>`;
            return `<div class="note-item note-type-plain" style="animation-delay:${delay}s" data-note-id="${note.id}">
                <div style="width:100%;">
                    <div class="note-header">
                        <div>
                            ${typeBadgePlain}
                            ${pendingBadge}
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
            const noteImgsHtml = (note.images || []).map(img => {
                if (isDocumentUrl(img.url)) {
                    return `<div class="note-inline-image doc-link" data-src="${escapeHTML(img.url)}" style="cursor:pointer; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden;">${getDocumentThumb(img.url, img.name || 'Document')}</div>`;
                }
                return `<div class="note-inline-image" data-src="${escapeHTML(img.url)}"><img src="${escapeHTML(img.url)}" alt=""></div>`;
            }).join('');

            return `<div class="note-item" style="animation-delay:${delay}s" data-note-id="${note.id}">
                <div class="note-info">
                    <div class="note-header">
                        <div>
                            ${typeBadge}
                            ${pendingBadge}
                            <a href="note/${note.id}" target="_blank" class="note-title-link"><h3 class="note-title">${escapeHTML(note.title)}</h3></a>
                        </div>
                        ${actions}
                    </div>
                    ${note.description ? `<p class="note-description">${autolink(note.description)}</p>` : ''}
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
    }

    function attachNoteCardEventListeners(container, isReviewMode) {
        // Attach copy buttons
        container.querySelectorAll('.note-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.closest('.note-code-block').querySelector('code').textContent;
                copyToClipboard(code, btn);
            });
        });

        // Attach copy-path buttons for UNC links
        container.querySelectorAll('.copy-path-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(btn.dataset.path, btn);
            });
        });

        if (!isReviewMode) {
            // Attach edit/delete
            container.querySelectorAll('.note-edit-btn').forEach(btn => btn.addEventListener('click', () => openEditNoteModal(btn.dataset.id)));
            container.querySelectorAll('.note-delete-btn').forEach(btn => btn.addEventListener('click', () => deleteNote(btn.dataset.id)));
        }

        // Image and Document lightbox
        container.querySelectorAll('.procedure-step-image, .note-inline-image').forEach(el => {
            el.addEventListener('click', () => {
                openLightbox(el.dataset.src);
            });
        });
    }

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
            html += buildNoteCardHtml(note, false, delay);
        });

        container.innerHTML = html;
        attachNoteCardEventListeners(container, false);
    }

    // --- RENDER: MODAL EDIT ---
    
    function copyToClipboard(text, btnEl) {
        const origIcon = btnEl.innerHTML;
        
        const success = () => {
            btnEl.innerHTML = ICONS.check;
            btnEl.classList.add('copied');
            setTimeout(() => { btnEl.innerHTML = origIcon; btnEl.classList.remove('copied'); }, 2000);
        };

        const fallbackCopy = () => {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed'; 
                ta.style.opacity = '0';
                document.body.appendChild(ta); 
                ta.select(); 
                document.execCommand('copy');
                document.body.removeChild(ta);
                success();
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(success).catch(fallbackCopy);
        } else {
            fallbackCopy();
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const loginType = document.getElementById('login-type').value;
        const errorEl = document.getElementById('login-error');
        errorEl.style.display = 'none';

        const res = await apiFetch('api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, login_type: loginType })
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
        document.getElementById('add-note-document-previews').innerHTML = '';
        if (document.getElementById('add-note-document-desc')) document.getElementById('add-note-document-desc').value = '';
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
        if (noteType === 'document') {
            description = document.getElementById('add-note-document-desc').value.trim();
        }

        const body = {
            title, note_type: noteType,
            description: description || null,
            category_id: categoryId ? parseInt(categoryId) : null,
            tags
        };
        if (noteType === 'command') body.command = command;
        if (noteType === 'procedure') body.steps = steps;
        if (noteType === 'document') {
            const sourceLinkBtn = document.getElementById('add-doc-source-link');
            if (sourceLinkBtn && sourceLinkBtn.classList.contains('active')) {
                const linkVal = document.getElementById('add-note-document-link').value.trim();
                if (!linkVal) { showToast('External Link is required', true); return; }
                body.command = linkVal;
            } else {
                const thumbs = document.getElementById('add-note-document-previews').querySelectorAll('.image-preview-thumb');
                if (thumbs.length === 0) { showToast('Please upload a document', true); return; }
            }
        }

        let res = await apiFetch('api/notes', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });

        if (res && res.ok) {
            const data = await res.json();
            if (noteType === 'command') {
                await uploadPendingImages(data.id, document.getElementById('add-note-image-previews'));
            } else if (noteType === 'document') {
                await uploadPendingImages(data.id, document.getElementById('add-note-document-previews'));
            }
            closeModal('add-note-modal');
            showToast('Note added successfully');
            fetchNotes();
            fetchCategories();
        } else {
            showToast('Failed to add command', true);
        }
    }

    async function deleteNote(id) {
        if (!confirm('Are you sure you want to delete this command?')) return;
        const res = await apiFetch('api/notes/' + id, { method: 'DELETE', headers: authHeaders() });
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
        if (document.getElementById('edit-note-document-desc')) {
            document.getElementById('edit-note-document-desc').value = note.note_type === 'document' ? (note.description || '') : '';
        }
        
        if (quillEdit) {
            quillEdit.root.innerHTML = note.note_type === 'plain' ? (note.description || '') : '';
        }
        document.getElementById('edit-note-category').value = note.category_id || '';
        document.getElementById('edit-note-tags').value = (note.tags || []).join(', ');

        // Reset steps list
        document.getElementById('edit-steps-list').innerHTML = '';
        document.getElementById('edit-note-image-previews').innerHTML = '';
        document.getElementById('edit-note-document-previews').innerHTML = '';

        // Set note type and populate steps
        setNoteType('edit', note.note_type || 'command');
        if (note.note_type === 'procedure' && note.steps) {
            note.steps.forEach(step => addStep('edit', step));
        }

        // Show existing note-level images for edit
        if (note.images && note.images.length) {
            const previewRow = note.note_type === 'document' ? document.getElementById('edit-note-document-previews') : document.getElementById('edit-note-image-previews');
            note.images.forEach(img => addServerImagePreview(previewRow, img, null, 'edit'));
        }

        if (note.note_type === 'document') {
            if (note.command && (!note.images || note.images.length === 0)) {
                document.getElementById('edit-note-document-link').value = note.command;
                if (window.toggleDocSource) window.toggleDocSource('edit', 'link');
            } else {
                document.getElementById('edit-note-document-link').value = '';
                if (window.toggleDocSource) window.toggleDocSource('edit', 'file');
            }
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
        if (noteType === 'document') {
            description = document.getElementById('edit-note-document-desc').value.trim();
        }

        const body = {
            title, note_type: noteType,
            command: noteType === 'command' ? command : '',
            description, tags,
            steps: steps.map(s => ({ title: s.title, command: s.command, description: s.description }))
        };

        if (noteType === 'document') {
            const sourceLinkBtn = document.getElementById('edit-doc-source-link');
            if (sourceLinkBtn && sourceLinkBtn.classList.contains('active')) {
                const linkVal = document.getElementById('edit-note-document-link').value.trim();
                if (!linkVal) { showToast('External Link is required', true); return; }
                body.command = linkVal;
            }
            // we don't block saving if no file is uploaded for edit, because they might just be editing the description of an existing doc.
        }

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
            const noteRes2 = await apiFetch('api/notes', { headers: authHeaders() });
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
            const isAD = u.auth_type === 'ad';
            html += `<tr>
                <td>${escapeHTML(u.username)}${isSelf ? ' <span style="color:var(--accent);font-size:0.75rem;">(you)</span>' : ''}</td>
                <td>
                    <span class="status-badge ${u.role === 'admin' ? 'enabled' : (u.role === 'moderator' ? 'moderator' : 'disabled')}">${escapeHTML(u.role)}</span>
                    <span class="status-badge" style="background:var(--bg-hover); color:var(--text-secondary); margin-left:4px;">${isAD ? 'AD' : 'Local'}</span>
                </td>
                <td>
                    <div style="display:flex; gap:8px; align-items:center;">
                        ${(!isSelf && !isAD) ? `<button class="btn-icon user-reset-btn" data-user-id="${u.id}" data-username="${escapeHTML(u.username)}" title="Reset Password" style="color:var(--success);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>` : ''}
                        ${!isSelf ? `<button class="btn-icon btn-icon-danger user-delete-btn" data-user-id="${u.id}">${ICONS.trash}</button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
        
        tbody.querySelectorAll('.user-reset-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const username = btn.dataset.username;
                const userId = btn.dataset.userId;
                // Create a temporary password modal
                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.style.display = 'flex';
                overlay.innerHTML = `
                    <div class="modal" style="max-width:400px;">
                        <div class="modal-header">
                            <h2>Reset Password</h2>
                            <button class="modal-close-btn" id="reset-pw-close">&times;</button>
                        </div>
                        <div class="modal-body" style="padding:20px;">
                            <p style="margin-bottom:12px;">Enter new password for <strong>${escapeHTML(username)}</strong>:</p>
                            <input type="password" id="reset-pw-input" class="form-input" placeholder="New password (min 8 chars, 1 uppercase, 1 number)" style="width:100%;">
                            <p id="reset-pw-error" style="color:var(--danger); display:none; margin-top:8px; font-size:0.85rem;"></p>
                        </div>
                        <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:10px; padding:15px; border-top:1px solid var(--border-color);">
                            <button class="btn btn-ghost" id="reset-pw-cancel">Cancel</button>
                            <button class="btn btn-primary" id="reset-pw-submit">Reset</button>
                        </div>
                    </div>`;
                document.body.appendChild(overlay);

                overlay.querySelector('#reset-pw-close').onclick = () => overlay.remove();
                overlay.querySelector('#reset-pw-cancel').onclick = () => overlay.remove();
                overlay.querySelector('#reset-pw-submit').onclick = async () => {
                    const newPassword = overlay.querySelector('#reset-pw-input').value;
                    const errEl = overlay.querySelector('#reset-pw-error');
                    if (!newPassword.trim()) { errEl.textContent = 'Password cannot be empty'; errEl.style.display = 'block'; return; }
                    const res = await apiFetch(`api/users/${userId}/reset-password`, {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({ password: newPassword.trim() })
                    });
                    if (res && res.ok) {
                        showToast('Password reset successfully!');
                        overlay.remove();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        errEl.textContent = err.message || 'Failed to reset password';
                        errEl.style.display = 'block';
                    }
                };
                overlay.querySelector('#reset-pw-input').addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') overlay.querySelector('#reset-pw-submit').click();
                });
                overlay.querySelector('#reset-pw-input').focus();
            });
        });

        tbody.querySelectorAll('.user-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this user?')) return;
                const res = await apiFetch('api/users/' + btn.dataset.userId, { method: 'DELETE', headers: authHeaders() });
                if (res && res.ok) { showToast('User deleted.'); loadAdminUsers(); }
                else { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to delete user', true); }
            });
        });
    }

    async function loadPendingNotes() {
        const res = await apiFetch('api/notes?status=pending', { headers: authHeaders() });
        if (!res || !res.ok) return;
        renderPendingNotes(await res.json());
    }

    function renderPendingNotes(notes) {
        let tbody = document.getElementById('ap-pending-table-body');
        
        if (!tbody) {
            const container = document.getElementById('ap-pending-cards-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th style="width: 120px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ap-pending-table-body"></tbody>
                    </table>
                </div>`;
            container.style = "";
            container.className = "";
            tbody = document.getElementById('ap-pending-table-body');
        }
        
        if (!notes || notes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-secondary); padding:2rem 0;">No pending notes to review.</td></tr>';
            return;
        }
        
        let html = '';
        notes.forEach((note) => {
            const isProcedure = note.note_type === 'procedure';
            const typeBadge = `<span class="note-type-badge ${isProcedure ? 'type-procedure' : 'type-command'}">${isProcedure ? ICONS.steps + ' Procedure' : ICONS.copy + ' Command'}</span>`;
            const catBadge = `<span class="note-category-badge">${ICONS.folder} ${escapeHTML(note.category_name || 'Uncategorized')}</span>`;
            html += `<tr>
                <td>${typeBadge}</td>
                <td><strong>${escapeHTML(note.title)}</strong></td>
                <td>${catBadge}</td>
                <td>
                    <button class="btn btn-xs btn-primary pending-review-btn" data-note='${escapeHTML(JSON.stringify(note))}' style="padding: 4px 10px; font-weight: 600;">Review</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
        
        tbody.querySelectorAll('.pending-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const note = JSON.parse(btn.dataset.note);
                const modalBody = document.getElementById('pending-review-modal-body');
                modalBody.innerHTML = `<div class="notes-container view-stack review-full-note" style="gap:0; padding:10px;">${buildNoteCardHtml(note, true, 0)}</div>`;
                attachNoteCardEventListeners(modalBody, true);
                
                document.getElementById('pending-review-approve-btn').onclick = async () => {
                    const res = await apiFetch(`api/notes/${note.id}/approve`, { method: 'POST', headers: authHeaders() });
                    if (res && res.ok) {
                        showToast('Note approved!');
                        closeModal('pending-review-modal');
                        loadPendingNotes();
                    } else {
                        showToast('Failed to approve', true);
                    }
                };
                
                document.getElementById('pending-review-reject-btn').onclick = async () => {
                    if (!confirm('Are you sure you want to reject and delete this note?')) return;
                    const res = await apiFetch(`api/notes/${note.id}`, { method: 'DELETE', headers: authHeaders() });
                    if (res && res.ok) {
                        showToast('Note rejected and deleted!');
                        closeModal('pending-review-modal');
                        loadPendingNotes();
                    } else {
                        showToast('Failed to reject', true);
                    }
                };
                
                openModal('pending-review-modal');
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
        setTimeout(() => { refreshAll(); loadAdminCategories(); loadAdminUsers(); loadPendingNotes(); }, 500);
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

    window.toggleDocSource = function(prefix, type) {
        if (type === 'file') {
            const btnF = document.getElementById(prefix + '-doc-source-file');
            if(btnF) btnF.classList.add('active');
            const btnL = document.getElementById(prefix + '-doc-source-link');
            if(btnL) btnL.classList.remove('active');
            const cU = document.getElementById(prefix + '-doc-upload-container');
            if(cU) cU.style.display = 'block';
            const cL = document.getElementById(prefix + '-doc-link-container');
            if(cL) cL.style.display = 'none';
        } else {
            const btnL = document.getElementById(prefix + '-doc-source-link');
            if(btnL) btnL.classList.add('active');
            const btnF = document.getElementById(prefix + '-doc-source-file');
            if(btnF) btnF.classList.remove('active');
            const cU = document.getElementById(prefix + '-doc-upload-container');
            if(cU) cU.style.display = 'none';
            const cL = document.getElementById(prefix + '-doc-link-container');
            if(cL) cL.style.display = 'block';
        }
    };

    // ═══════════════════════════════════════════════════════
    //  INIT & EVENT LISTENERS
    // ═══════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        if (localStorage.getItem('sidebar-collapsed') === 'true' && window.innerWidth > 768) {
            document.body.classList.add('desktop-collapsed');
        }
        const quillOptions = {
            theme: 'snow',
            bounds: document.body,
            modules: {
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
        
        const authSelect = document.getElementById('ap-create-user-auth');
        if (authSelect) {
            authSelect.addEventListener('change', (e) => {
                const pwdInput = document.getElementById('ap-create-user-password');
                if (e.target.value === 'ad') {
                    pwdInput.required = false;
                    pwdInput.disabled = true;
                    pwdInput.value = '';
                    pwdInput.placeholder = 'AD Password handled externally';
                } else {
                    pwdInput.required = true;
                    pwdInput.disabled = false;
                    pwdInput.placeholder = 'Password';
                }
            });
            // Trigger change initially to set correct state
            authSelect.dispatchEvent(new Event('change'));
        }
        document.getElementById('ap-settings-form').addEventListener('submit', handleSaveSettings);
        document.getElementById('ap-backup-download-btn').addEventListener('click', handleBackupDownload);
        document.getElementById('ap-restore-form').addEventListener('submit', handleRestore);
        document.getElementById('ap-change-password-form').addEventListener('submit', handleChangePassword);

        // Modal close
        document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.modal)));


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

    // Auto-refresh polling
    let lastUpdateTimestamp = "";
    setInterval(async () => {
        try {
            const res = await fetch('api/last_updated');
            if (res.ok) {
                const data = await res.json();
                if (lastUpdateTimestamp && data.last_update && data.last_update !== lastUpdateTimestamp) {
                    // Only refresh if no modals are open to prevent input loss
                    const anyModalOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(m => m.style.display !== 'none');
                    if (!anyModalOpen) {
                        fetchNotes();
                        updatePendingCount();
                    }
                }
                lastUpdateTimestamp = data.last_update;
            }
        } catch (e) {}
    }, 10000);

    // Ensure pending review modal exists (in case index.html is cached)
    if (!document.getElementById('pending-review-modal')) {
        const modalHtml = `
        <div id="pending-review-modal" class="modal-overlay" style="display:none;">
            <div class="modal" style="max-width: 800px; width: 90%;">
                <div class="modal-header">
                    <h3>Review Note</h3>
                    <button class="modal-close-btn" onclick="closeModal('pending-review-modal')">×</button>
                </div>
                <div class="modal-body" id="pending-review-modal-body" style="padding: 20px; background: var(--bg-body); max-height: 70vh; overflow-y: auto;">
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px; border-top: 1px solid var(--border-color);">
                    <button class="btn btn-ghost" onclick="closeModal('pending-review-modal')">Cancel</button>
                    <button id="pending-review-reject-btn" class="btn btn-danger">Reject</button>
                    <button id="pending-review-approve-btn" class="btn btn-success">Approve</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // --- Audit Logs ---
    async function loadAdminAudit() {
        const res = await apiFetch('api/audit', { headers: authHeaders() });
        if (!res || !res.ok) return;
        renderAdminAudit(await res.json());
    }

    function renderAdminAudit(logs) {
        const tbody = document.getElementById('ap-audit-tbody');
        if (!tbody) return;
        let html = '';
        logs.forEach(l => {
            const dateStr = new Date(l.timestamp + 'Z').toLocaleString();
            let actionColor = 'var(--text)';
            if(l.action === 'CREATED') actionColor = 'var(--success)';
            if(l.action === 'DELETED') actionColor = 'var(--danger)';
            if(l.action === 'APPROVED') actionColor = 'var(--accent)';
            if(l.action === 'UPDATED') actionColor = '#f59e0b'; // warning/orange
            
            html += `<tr>
                <td style="font-size:0.85rem; color:var(--text-secondary);">${dateStr}</td>
                <td style="font-weight:600;">${escapeHTML(l.username || 'System')}</td>
                <td><span style="color:${actionColor};font-weight:bold;font-size:0.8rem;">${escapeHTML(l.action)}</span></td>
                <td>${l.note_id ? `<a href="/note/${l.note_id}" target="_blank" style="color:var(--accent); text-decoration:none; font-weight:600;">#${l.note_id}</a>` : '-'}</td>
                <td style="font-size:0.9rem; color:var(--text-secondary);">${escapeHTML(l.details || '')}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }

})();
