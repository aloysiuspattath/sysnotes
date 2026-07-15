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
        return /\.(pdf|doc|docx|txt|md|csv|xlsx)(\?.*)?$/i.test(url);
    }
    
    function getDocumentThumb(url, name) {
        let icon = ICONS.file_pdf;
        if (/\.(doc|docx)(\?.*)?$/i.test(url) || /\.(doc|docx)$/i.test(name)) icon = ICONS.file_word;
        if (/\.(xlsx)(\?.*)?$/i.test(url) || /\.(xlsx)$/i.test(name)) icon = ICONS.file_excel;
        if (/\.(csv)(\?.*)?$/i.test(url) || /\.(csv)$/i.test(name)) icon = ICONS.file_csv;
        if (/\.(txt|md)(\?.*)?$/i.test(url) || /\.(txt|md)$/i.test(name)) icon = ICONS.file_text;
        return `<div class="doc-thumb" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--bg-tertiary); color:var(--text); padding:10px; text-align:center; word-break:break-all;"><div style="margin-bottom:8px;">${icon}</div><span style="font-size:10px; line-height:1.2;">${escapeHTML(name||'Document')}</span></div>`;
    }

    // ─── STATE ──────────────────────────────────────────
    let currentToken = localStorage.getItem('sn_token') || null;
    let currentRole = localStorage.getItem('sn_role') || null;
    let currentUsername = localStorage.getItem('sn_username') || null;
    let currentUserTeams = [];
    try {
        currentUserTeams = JSON.parse(localStorage.getItem('sn_teams') || '[]');
    } catch(e) {}
    let allTeams = [];
    let quillAdd = null;
    let quillEdit = null;
    let quillEditor = null;
    let autosaveTimer = null;
    let currentView = localStorage.getItem('sn_view') || 'view-stack';
    let activeCategory = null;
    let activeCategoryName = null;
    let activePending = false;
    let activeDrafts = false;
    let activeTag = null;
    let activeTeamFilter = window.DEFAULT_TEAM_FILTER || null;
    let allNotes = [];
    let allCategories = [];
    let allTags = [];
    let isAdminPageOpen = false;

    // Pagination state
    let currentPage = 1;
    let hasMoreNotes = true;
    const notesPerPage = 50;
    let fetchingNotes = false;

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

    function detectLanguage(code) {
        if (!code) return 'terminal';
        const clean = code.trim().toLowerCase();
        if (clean.includes('select ') || clean.includes('insert ') || clean.includes('update ') || clean.includes('create table')) return 'sql';
        if (clean.includes('get-') || clean.includes('set-') || clean.includes('new-') || clean.includes('write-host') || clean.includes('$confirm') || clean.includes('$args')) return 'powershell';
        if (clean.startsWith('apt-get') || clean.startsWith('sudo') || clean.startsWith('docker') || clean.startsWith('git') || clean.startsWith('npm') || clean.startsWith('pip') || clean.startsWith('curl')) return 'bash';
        if (clean.startsWith('{') && clean.endsWith('}')) return 'json';
        if (clean.includes(':') && (clean.includes('version:') || clean.includes('services:'))) return 'yaml';
        return 'terminal';
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

        const uncPattern = /"(\\\\[^"\n]+)"|'(\\\\[^'\n]+)'|(\\\\[a-zA-Z0-9_.-]+\\[^\s<]+)/g;
        result = result.replace(uncPattern, function(match, g1, g2, g3) {
            const path = g1 || g2 || g3;
            const cleanPath = path.replace(/\\/g, '/');
            return `<a href="file:///${cleanPath}" target="_blank" rel="noopener noreferrer">${path}</a> <button type="button" class="btn btn-secondary btn-xs copy-path-btn" data-path="${escapeHTML(path)}" style="display:inline-flex; padding:2px 6px; font-size:10px; margin-left:5px; height:auto; line-height:1; vertical-align:middle;">Copy Path</button>`;
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
            updateDraftCount();
        } else {
            loggedOut.style.display = 'flex';
            loggedIn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
            const pendingNav = document.getElementById('sidebar-pending-notes');
            if (pendingNav) pendingNav.style.display = 'none';
            const draftNav = document.getElementById('sidebar-draft-notes');
            if (draftNav) draftNav.style.display = 'none';
        }
    }

    function doLogout() {
        currentToken = null; currentRole = null; currentUsername = null;
        currentUserTeams = [];
        localStorage.removeItem('sn_token');
        localStorage.removeItem('sn_role');
        localStorage.removeItem('sn_username');
        localStorage.removeItem('sn_teams');
        activePending = false;
        activeDrafts = false;
        updateAuthUI();
        if (isAdminPageOpen) closeAdminPage();
        renderNotes(allNotes);
    }

    // ─── MODALS ──────────────────────────────────────────
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { 
        document.getElementById(id).style.display = 'none'; 
        if (id === 'login-modal') {
            const step1 = document.getElementById('login-step-1');
            const step2 = document.getElementById('login-step-2');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
        }
    }
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
        if (tabId === 'ap-teams-tab') fetchTeams();
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
                <div class="step-blocks-container" id="blocks-container-${sid}"></div>
                <div class="step-add-block-buttons" style="margin-bottom: 10px; display: flex; gap: 10px;">
                    <button type="button" class="btn btn-sm btn-ghost add-desc-block-btn" data-sid="${sid}">+ Description</button>
                    <button type="button" class="btn btn-sm btn-ghost add-code-block-btn" data-sid="${sid}">+ Code Block</button>
                    <button type="button" class="btn btn-sm btn-ghost add-image-block-btn" data-sid="${sid}">+ Image Block</button>
                </div>
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

        const blocksContainer = card.querySelector('.step-blocks-container');
        
        function appendBlock(type, content = '') {
            const blockRow = document.createElement('div');
            blockRow.className = 'step-block-row';
            blockRow.dataset.type = type;
            blockRow.style.position = 'relative';
            blockRow.style.marginBottom = '10px';
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = ICONS.close;
            removeBtn.className = 'btn-icon btn-icon-danger';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '5px';
            removeBtn.style.right = '5px';
            removeBtn.style.zIndex = '10';
            removeBtn.onclick = () => {
                blockRow.remove();
                if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
            };
            
            if (type === 'image') {
                blockRow.style.border = '1px dashed var(--border)';
                blockRow.style.padding = '15px';
                blockRow.style.borderRadius = 'var(--r)';
                blockRow.style.textAlign = 'center';
                blockRow.style.background = 'var(--surface)';

                const hiddenInput = document.createElement('textarea');
                hiddenInput.className = 'step-block-input';
                hiddenInput.style.display = 'none';
                hiddenInput.value = content;

                const imgPreview = document.createElement('img');
                imgPreview.style.maxWidth = '100%';
                imgPreview.style.maxHeight = '300px';
                imgPreview.style.borderRadius = 'var(--r)';
                imgPreview.style.marginTop = '10px';
                imgPreview.style.display = content ? 'inline-block' : 'none';
                imgPreview.src = content || '';

                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';

                const uploadBtn = document.createElement('button');
                uploadBtn.type = 'button';
                uploadBtn.className = 'btn btn-outline';
                uploadBtn.innerHTML = ICONS.image + ' Select Image';
                uploadBtn.onclick = () => fileInput.click();

                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            let width = img.width;
                            let height = img.height;
                            if (width > 1200) {
                                height = Math.round(height * 1200 / width);
                                width = 1200;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                            hiddenInput.value = dataUrl;
                            imgPreview.src = dataUrl;
                            imgPreview.style.display = 'inline-block';
                            uploadBtn.innerHTML = ICONS.image + ' Change Image';
                            if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                };

                if (content) uploadBtn.innerHTML = ICONS.image + ' Change Image';

                blockRow.appendChild(hiddenInput);
                blockRow.appendChild(fileInput);
                blockRow.appendChild(uploadBtn);
                blockRow.appendChild(document.createElement('br'));
                blockRow.appendChild(imgPreview);
                blockRow.appendChild(removeBtn);
            } else {
                const textarea = document.createElement('textarea');
                textarea.className = type === 'code' ? 'form-input form-textarea form-mono step-block-input' : 'form-input form-textarea step-block-input';
                textarea.rows = type === 'code' ? 3 : 2;
                textarea.placeholder = type === 'code' ? 'Command(s) for this step' : 'Description / notes...';
                textarea.value = content;
                textarea.oninput = () => {
                    if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
                };
                
                blockRow.appendChild(textarea);
                blockRow.appendChild(removeBtn);
            }
            
            blocksContainer.appendChild(blockRow);
        }
        
        card.querySelector('.add-desc-block-btn').onclick = () => {
            appendBlock('desc');
            if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
        };
        card.querySelector('.add-code-block-btn').onclick = () => {
            appendBlock('code');
            if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
        };
        card.querySelector('.add-image-block-btn').onclick = () => {
            appendBlock('image');
            if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
        };
        
        // Prefill blocks
        if (stepData?.blocks && stepData.blocks.length > 0) {
            stepData.blocks.forEach(b => appendBlock(b.type, b.content));
        } else {
            // Legacy format fallback
            if (stepData?.description) appendBlock('desc', stepData.description);
            if (stepData?.command) appendBlock('code', stepData.command);
            // Default empty blocks if totally new step
            if (!stepData?.description && !stepData?.command && (!stepData?.blocks || stepData.blocks.length === 0)) {
                appendBlock('desc');
                appendBlock('code');
            }
        }

        // Remove step
        card.querySelector('.step-remove-btn').addEventListener('click', () => {
            card.remove();
            renumberSteps(prefix);
            if (typeof triggerAutosaveDebounce === 'function') triggerAutosaveDebounce();
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
            const blocks = [];
            Array.from(card.querySelectorAll('.step-block-row')).forEach(blockRow => {
                const content = blockRow.querySelector('.step-block-input').value.trim();
                if (content) {
                    blocks.push({
                        type: blockRow.dataset.type,
                        content: content
                    });
                }
            });

            steps.push({
                title: card.querySelector('.step-title-input').value.trim(),
                blocks: blocks,
                command: '', // legacy field, kept empty
                description: '', // legacy field, kept empty
                _sid: card.dataset.sid,
                _pendingFiles: Array.from(card.querySelectorAll('.step-img-previews .image-preview-thumb'))
                    .map(t => t._file).filter(Boolean),
            });
        });
        return steps;
    }

    function addReferenceLinkInput(prefix, val = '') {
        const container = document.getElementById(`${prefix}-note-reference-links-container`);
        if (!container) return;
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.innerHTML = `
            <input type="url" class="form-input ref-link-input" placeholder="https://..." value="${escapeHTML(val)}" style="flex:1;">
            <button type="button" class="btn-icon btn-icon-danger ref-link-remove" style="padding: 0 10px;">${ICONS.close}</button>
        `;
        row.querySelector('.ref-link-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    function collectReferenceLinks(prefix) {
        const container = document.getElementById(`${prefix}-note-reference-links-container`);
        if (!container) return [];
        const inputs = container.querySelectorAll('.ref-link-input');
        const links = [];
        inputs.forEach(input => {
            const v = input.value.trim();
            if (v) links.push(v);
        });
        return links;
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
    async function openLightbox(src) {
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
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'position:absolute; top:10px; right:10px; background:var(--bg); border:none; color:var(--text); font-size:24px; cursor:pointer; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:1001;';
        closeBtn.onclick = () => overlay.remove();

        if (/\.pdf(\?.*)?$/i.test(src)) {
            overlay.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text); font-size:1.2rem;">Loading PDF...</div>`;
            overlay.appendChild(closeBtn);
            
            fetch(src)
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.blob();
                })
                .then(blob => {
                    const objectUrl = URL.createObjectURL(blob);
                    overlay.innerHTML = `<object data="${objectUrl}" type="application/pdf" style="width:80%; height:85vh; border:none; background:white; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.5);"><p>Your browser does not support PDFs. <a href="${escapeHTML(src)}" target="_blank" download>Download the PDF</a>.</p></object>`;
                    overlay.appendChild(closeBtn);
                    
                    // Revoke object URL when overlay is removed to free memory
                    const observer = new MutationObserver(() => {
                        if (!document.body.contains(overlay)) {
                            URL.revokeObjectURL(objectUrl);
                            observer.disconnect();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                })
                .catch(err => {
                    overlay.innerHTML = `<div style="background:var(--bg); padding:20px; border-radius:8px; color:var(--text-danger); box-shadow:0 4px 12px rgba(0,0,0,0.5);">Failed to load PDF. <br><br><a href="${escapeHTML(src)}" target="_blank" download style="color:var(--primary); text-decoration:underline;">Click here to open or download it directly</a>.</div>`;
                    overlay.appendChild(closeBtn);
                });
        } else if (/\.md(\?.*)?$/i.test(src)) {
            try {
                const res = await fetch(src);
                const text = await res.text();
                const html = DOMPurify.sanitize(marked.parse(text));
                overlay.innerHTML = `<div style="width:80%; max-width:800px; max-height:85vh; overflow-y:auto; background:var(--bg); color:var(--text); border-radius:8px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.5); text-align:left;" class="md-preview-content">${html}</div>`;
                overlay.appendChild(closeBtn);
            } catch (err) {
                overlay.innerHTML = `<div style="background:var(--bg); padding:20px; border-radius:8px; color:var(--text-danger);">Failed to load markdown file.</div>`;
                overlay.appendChild(closeBtn);
            }
        } else {
            overlay.innerHTML = `<img src="${escapeHTML(src)}" alt="Image preview">`;
            overlay.addEventListener('click', () => overlay.remove());
        }
        document.body.appendChild(overlay);
    }

    // ─── DATA FETCHING ───────────────────────────────────
    async function fetchNotes(resetPage = true) {
        if (fetchingNotes) return;
        fetchingNotes = true;

        if (resetPage) {
            currentPage = 1;
            hasMoreNotes = true;
            document.getElementById('notes-container').innerHTML = '';
        }

        if (!hasMoreNotes) {
            fetchingNotes = false;
            return;
        }

        let url = `api/notes?page=${currentPage}&limit=${notesPerPage}&`;
        const params = [];
        const q = document.getElementById('search-input').value.trim();
        if (q) params.push('q=' + encodeURIComponent(q));
        if (activeCategory) params.push('category=' + activeCategory);
        if (activeTag) params.push('tag=' + encodeURIComponent(activeTag));
        if (activePending) params.push('status=pending');
        if (activeDrafts) params.push('status=draft');
        if (activeTeamFilter) params.push('team=' + encodeURIComponent(activeTeamFilter));
        url += params.join('&');
        
        try {
            const res = await apiFetch(url, { headers: authHeaders() });
            if (!res) return;
            const newNotes = await res.json();
            
            if (newNotes.length < notesPerPage) {
                hasMoreNotes = false;
            }
            
            if (resetPage) {
                allNotes = newNotes;
            } else {
                allNotes = allNotes.concat(newNotes);
            }
            
            renderNotes(newNotes, !resetPage);
            currentPage++;
        } finally {
            fetchingNotes = false;
        }
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

    async function fetchTeams() {
        if (!currentToken) return;
        const res = await apiFetch('api/admin/teams', { headers: authHeaders() });
        if (!res) return;
        if (res.ok) {
            allTeams = await res.json();
            populateTeamDropdowns(allTeams);
            populateUserTeamChecklists(allTeams);
            if (isAdminPageOpen) {
                renderAdminTeamsTable(allTeams);
            }
        }
    }

    function populateTeamDropdowns(teams) {
        const addTeamSelect = document.getElementById('add-note-team');
        const editTeamSelect = document.getElementById('edit-note-team');
        const editorTeamSelect = document.getElementById('editor-note-team');
        
        let optionsHtml = '';
        teams.forEach(t => {
            optionsHtml += `<option value="${t.id}">${escapeHTML(t.name)}</option>`;
        });
        
        if (addTeamSelect) addTeamSelect.innerHTML = optionsHtml;
        if (editTeamSelect) editTeamSelect.innerHTML = optionsHtml;
        if (editorTeamSelect) editorTeamSelect.innerHTML = optionsHtml;
        initCustomSelects();
    }

    function populateUserTeamChecklists(teams) {
        const createList = document.getElementById('ap-create-user-teams-list');
        const modalList = document.getElementById('user-teams-checkbox-list');
        
        let html = '';
        teams.forEach(t => {
            html += `
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem;">
                    <input type="checkbox" name="team_ids" value="${t.id}">
                    <span>${escapeHTML(t.name)}</span>
                </label>
            `;
        });
        
        if (createList) createList.innerHTML = html;
        if (modalList) modalList.innerHTML = html;
    }

    function refreshAll() { fetchNotes(); fetchCategories(); fetchTags(); fetchStats(); fetchTeams(); updatePendingCount(); updateDraftCount(); }

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
                activeDrafts = false;
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
                activeTag = null; activePending = false; activeDrafts = false;
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
                activeCategory = null; activeCategoryName = null; activePending = false; activeDrafts = false;
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
        } else if (activeDrafts) {
            textEl.innerHTML = '<span style="color:var(--accent); display:flex; align-items:center; gap:6px;">✍️ My Draft Notes</span>';
            el.style.display = 'inline-flex';
        } else if (activeCategory) {
            textEl.textContent = 'Category: ' + (activeCategoryName || activeCategory);
            el.style.display = 'inline-flex';
        } else if (activeTag) {
            textEl.textContent = 'Tag: ' + activeTag;
            el.style.display = 'inline-flex';
        } else if (activeTeamFilter) {
            textEl.textContent = 'Team: ' + activeTeamFilter;
            el.style.display = 'inline-flex';
        } else {
            el.style.display = 'none';
        }
    }

    function clearFilter() {
        activeCategory = null; activeCategoryName = null; activeTag = null; activePending = false; activeDrafts = false;
        activeTeamFilter = null;
        if (window.history && window.history.pushState) {
            window.history.pushState(null, null, '/');
        }
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
            activeDrafts = false;
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

    window.showMyDraftNotes = function() {
        activeDrafts = true;
        activePending = false;
        activeCategory = null; activeCategoryName = null; activeTag = null;
        document.getElementById('notes-container').style.display = '';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('category-cards-grid').style.display = 'none';
        if (isAdminPageOpen) closeAdminPage();
        updateFilterIndicator();
        fetchNotes();
        if (window.innerWidth <= 768) closeSidebar();
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

    async function updateDraftCount() {
        if (!currentToken) {
            document.getElementById('sidebar-draft-notes').style.display = 'none';
            return;
        }
        try {
            const res = await apiFetch('api/notes?status=draft', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                const count = notes.length;
                document.getElementById('sidebar-drafts-count').textContent = count;
                document.getElementById('sidebar-draft-notes').style.display = count > 0 ? 'block' : 'none';
            }
        } catch (err) {
            console.error('Error fetching draft count', err);
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
        initCustomSelects();
    }

    // ─── RENDER: NOTES ───────────────────────────────────
    function buildNoteCardHtml(note, isReviewMode, delay) {
        const tagsHtml = (note.tags || []).map(t => `<span class="note-tag-pill">${escapeHTML(t)}</span>`).join('');
        const categoryBadge = note.category_name
            ? `<span class="note-category-badge">${ICONS.folder} ${escapeHTML(note.category_name)}</span>` : '';
        const teamBadge = note.team_name 
            ? `<a href="/${escapeHTML(note.team_name)}" class="note-team-badge" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; background:rgba(var(--accent-rgb, 99, 102, 241), 0.12); color:var(--accent); border:1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.25); border-radius:4px; padding:2px 6px; font-weight:600; cursor:pointer; margin-right:8px;">👥 ${escapeHTML(note.team_name)}</a>`
            : '';
        const metaHtml = `
            ${teamBadge}
            <span class="note-meta-user">${ICONS.user} ${escapeHTML(note.created_by_username || 'Unknown')}</span>
        `;
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
        
        let pendingBadge = '';
        if (note.status === 'draft') {
            pendingBadge = `<span class="note-pending-badge" style="background: rgba(var(--accent-rgb, 99, 102, 241), 0.15); color: var(--accent); margin-left: 8px; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; border: 1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.3);">✍️ Draft</span>`;
        } else if (!note.approved) {
            pendingBadge = `<span class="note-pending-badge" style="background: rgba(245, 158, 11, 0.15); color: rgb(245, 158, 11); margin-left: 8px; font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; border: 1px solid rgba(245, 158, 11, 0.3);">⏱️ Pending</span>`;
        }
            
        let refLinksHtml = '';
        if (note.reference_links) {
            try {
                const links = typeof note.reference_links === 'string' ? JSON.parse(note.reference_links) : note.reference_links;
                if (links && links.length > 0) {
                    refLinksHtml = '<div class="note-reference-links" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px;">' +
                        links.map(l => `<a href="${escapeHTML(l)}" target="_blank" style="font-size: 0.8rem; background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; color: var(--accent); text-decoration: none; border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 4px;">🔗 ${escapeHTML(l)}</a>`).join('') +
                        '</div>';
                }
            } catch(e) {}
        }

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
                    ${refLinksHtml}

                    <div class="note-meta">
                        ${categoryBadge}
                        ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                        ${metaHtml}
                        <span class="note-meta-steps">${ICONS.steps} ${note.step_count !== undefined ? note.step_count : steps.length} steps</span>
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
                    ${refLinksHtml}
                    
                    <div class="note-meta">
                        ${categoryBadge}
                        ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                        ${metaHtml}
                    </div>
                </div>
            </div>`;
        } else if (note.note_type === 'plain') {
            let renderedHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.description || '') : escapeHTML(note.description || '');
            const typeBadgePlain = `<span class="note-type-badge type-procedure" style="background-color: var(--primary);">${ICONS.copy} Rich Note</span>`;
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
                    <div class="ql-editor markdown-body" style="padding:1rem 0 !important; min-height: auto; font-size:14px; line-height:1.6;">${renderedHtml}</div>
                    ${refLinksHtml}
                    
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
                    ${refLinksHtml}
                    <div class="note-meta">
                        ${categoryBadge}
                        ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                        ${metaHtml}
                    </div>
                    ${noteImgsHtml ? `<div class="note-inline-images">${noteImgsHtml}</div>` : ''}
                </div>
                <div class="note-command-wrapper">
                    <div class="note-code-block">
                        <div class="terminal-header">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="terminal-dots">
                                    <span class="dot red"></span>
                                    <span class="dot yellow"></span>
                                    <span class="dot green"></span>
                                </div>
                                <span class="terminal-title">${detectLanguage(note.command)}</span>
                            </div>
                        </div>
                        <pre class="note-code"><code>${escapeHTML(note.command)}</code></pre>
                        <button class="note-copy-btn" title="Copy">${ICONS.copy}</button>
                    </div>
                </div>
            </div>`;
        }
    }

    // Event delegation is now handled globally on #notes-container in DOMContentLoaded
    function attachNoteCardEventListeners(container, isReviewMode) {
        // Kept for backward compatibility if called from elsewhere, but empty
    }

    function renderNotes(notes, append = false) {
        const container = document.getElementById('notes-container');
        const emptyState = document.getElementById('empty-state');
        if (isAdminPageOpen) return;

        if (!append && (!notes || notes.length === 0)) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            
            // Hide loading trigger if it exists
            const trigger = document.getElementById('scroll-trigger');
            if (trigger) trigger.style.display = 'none';
            return;
        }
        emptyState.style.display = 'none';

        let html = '';
        notes.forEach((note, idx) => {
            // Only apply staggered animation to the first 10 items to prevent lag
            const delay = Math.min(idx * 0.04, 0.4);
            const useDelay = (!append && idx < 10) ? delay : 0;
            html += buildNoteCardHtml(note, false, useDelay);
        });

        if (append) {
            container.insertAdjacentHTML('beforeend', html);
        } else {
            container.innerHTML = html;
        }
        
        // Handle scroll trigger element
        let trigger = document.getElementById('scroll-trigger');
        if (!trigger) {
            trigger = document.createElement('div');
            trigger.id = 'scroll-trigger';
            trigger.style.height = '20px';
            trigger.style.width = '100%';
            container.parentNode.appendChild(trigger);
            
            // Setup intersection observer
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMoreNotes && !fetchingNotes) {
                    fetchNotes(false);
                }
            }, { rootMargin: '200px' });
            observer.observe(trigger);
        }
        trigger.style.display = hasMoreNotes ? 'block' : 'none';
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

    function finalizeLogin(data) {
        currentToken = data.token;
        currentRole = data.role;
        currentUsername = data.username;
        currentUserTeams = data.teams || [];
        localStorage.setItem('sn_token', currentToken);
        localStorage.setItem('sn_role', currentRole);
        localStorage.setItem('sn_username', currentUsername);
        localStorage.setItem('sn_teams', JSON.stringify(currentUserTeams));
        closeModal('login-modal');
        updateAuthUI();
        refreshAll();
        showToast('Logged in successfully');
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
            currentUserTeams = data.teams || [];
            
            // If user belongs to multiple teams, prompt selection
            if (currentUserTeams.length > 1) {
                const teamSelect = document.getElementById('login-active-team');
                teamSelect.innerHTML = `<option value="all" selected>All My Teams</option>` +
                    currentUserTeams.map(t => `<option value="${escapeHTML(t.name)}">${escapeHTML(t.name)}</option>`).join('');
                
                initCustomSelects();
                
                document.getElementById('login-step-1').style.display = 'none';
                document.getElementById('login-step-2').style.display = 'block';
                return;
            }
            
            finalizeLogin(data);
        } else {
            errorEl.textContent = data.message || 'Login failed';
            errorEl.style.display = 'block';
        }
    }

    function resetAddForm() {
        document.getElementById('add-note-form').reset();
        document.getElementById('add-steps-list').innerHTML = '';
        document.getElementById('add-note-image-previews').innerHTML = '';
        document.getElementById('add-note-document-previews').innerHTML = '';
        if (document.getElementById('add-note-reference-links-container')) {
            document.getElementById('add-note-reference-links-container').innerHTML = '';
        }
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
        const reference_links = collectReferenceLinks('add');

        const visibility = document.getElementById('add-note-visibility').value;
        const teamId = visibility === 'team' ? document.getElementById('add-note-team').value : null;

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
            tags,
            reference_links,
            visibility,
            team_id: teamId ? parseInt(teamId) : null
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

        if (res) {
            if (res.ok) {
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
                const err = await res.json().catch(() => ({}));
                showToast(err.message || 'Failed to add command', true);
            }
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
    // ─── WORDPRESS STYLE EDITOR ────────────────────────
    let isSavingNote = false;

    function setEditorNoteType(type) {
        document.getElementById('editor-note-type').value = type;
        
        // Update toggles
        document.querySelectorAll('#editor-page .note-type-btn').forEach(btn => {
            if (btn.dataset.type === type) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Toggle editor sections
        document.getElementById('editor-section-command').style.display = type === 'command' ? 'flex' : 'none';
        document.getElementById('editor-section-plain').style.display = type === 'plain' ? 'flex' : 'none';
        document.getElementById('editor-section-document').style.display = type === 'document' ? 'flex' : 'none';
        document.getElementById('editor-section-procedure').style.display = type === 'procedure' ? 'flex' : 'none';

        if (type === 'procedure') {
            const stepsList = document.getElementById('editor-steps-list');
            if (stepsList.children.length === 0) {
                addStep('editor');
            }
        }
    }

    function toggleEditorDocSource(source) {
        const fileBtn = document.getElementById('editor-doc-source-file-btn');
        const linkBtn = document.getElementById('editor-doc-source-link-btn');
        const fileContainer = document.getElementById('editor-doc-file-container');
        const linkContainer = document.getElementById('editor-doc-link-container');

        if (source === 'file') {
            fileBtn.classList.add('active');
            linkBtn.classList.remove('active');
            fileContainer.style.display = 'block';
            linkContainer.style.display = 'none';
        } else {
            fileBtn.classList.remove('active');
            linkBtn.classList.add('active');
            fileContainer.style.display = 'none';
            linkContainer.style.display = 'block';
        }
    }

    async function openWordPressEditor(mode, noteId = null) {
        document.body.classList.add('in-editor');
        document.getElementById('editor-page').style.display = 'flex';
        
        // Hide preview overlay by default
        document.getElementById('editor-preview-overlay').style.display = 'none';
        document.getElementById('editor-preview-btn').textContent = 'Preview';

        // Clear timer
        if (autosaveTimer) clearTimeout(autosaveTimer);

        // Populate categories
        const catSelect = document.getElementById('editor-note-category');
        catSelect.innerHTML = '<option value="">Select Category</option>';
        allCategories.filter(c => c.enabled).forEach(c => {
            catSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.name)}</option>`;
        });
        initCustomSelects();

        // Reset inputs
        document.getElementById('editor-note-id').value = '';
        document.getElementById('editor-note-title').value = '';
        document.getElementById('editor-note-command').value = '';
        document.getElementById('editor-note-description').value = '';
        document.getElementById('editor-note-document-desc').value = '';
        document.getElementById('editor-note-document-link').value = '';
        document.getElementById('editor-note-tags').value = '';
        document.getElementById('editor-note-status').value = 'draft';
        document.getElementById('editor-approval-status-row').style.display = 'none';
        document.getElementById('editor-note-reference-links-container').innerHTML = '';
        document.getElementById('editor-note-image-previews').innerHTML = '';
        document.getElementById('editor-note-document-previews').innerHTML = '';
        document.getElementById('editor-steps-list').innerHTML = '';
        document.getElementById('editor-revisions-list').innerHTML = '<span class="no-revisions-text">No revisions recorded yet.</span>';
        
        if (quillEditor) quillEditor.setText('');

        const statusText = document.getElementById('editor-autosave-status');
        statusText.innerHTML = '<span class="status-dot"></span> Draft ready';
        statusText.className = 'editor-autosave-status';

        if (mode === 'add') {
            setEditorNoteType('command');
            toggleEditorDocSource('file');
            document.getElementById('editor-revisions-panel').style.display = 'none';
            document.getElementById('editor-note-visibility').value = 'global';
            document.getElementById('editor-note-team-container').style.display = 'none';
            if (currentUserTeams && currentUserTeams.length > 0) {
                document.getElementById('editor-note-team').value = currentUserTeams[0];
            }
            syncCustomSelects();
        } else {
            document.getElementById('editor-revisions-panel').style.display = 'block';
            statusText.innerHTML = '<span class="status-dot"></span> Loading note...';

            try {
                const res = await apiFetch('api/notes/' + noteId, { headers: authHeaders() });
                if (res && res.ok) {
                    const note = await res.json();
                    document.getElementById('editor-note-id').value = note.id;
                    document.getElementById('editor-note-title').value = note.title;
                    document.getElementById('editor-note-tags').value = (note.tags || []).join(', ');
                    document.getElementById('editor-note-status').value = note.status || 'published';
                    document.getElementById('editor-note-category').value = note.category_id || '';
                    
                    const visibility = note.visibility || 'global';
                    document.getElementById('editor-note-visibility').value = visibility;
                    if (visibility === 'team') {
                        document.getElementById('editor-note-team-container').style.display = 'block';
                        document.getElementById('editor-note-team').value = note.team_id || '';
                    } else {
                        document.getElementById('editor-note-team-container').style.display = 'none';
                    }
                    
                    // Approval badge
                    const appRow = document.getElementById('editor-approval-status-row');
                    const appVal = document.getElementById('editor-approval-status-val');
                    appRow.style.display = 'flex';
                    if (note.approved) {
                        appVal.textContent = 'Approved';
                        appVal.className = 'badge badge-success';
                    } else {
                        appVal.textContent = 'Pending Review';
                        appVal.className = 'badge badge-warning';
                    }

                    // Populate links
                    if (note.reference_links) {
                        try {
                            const links = JSON.parse(note.reference_links);
                            links.forEach(l => addReferenceLinkInput('editor', l));
                        } catch(e){}
                    }

                    setEditorNoteType(note.note_type || 'command');

                    if (note.note_type === 'command') {
                        document.getElementById('editor-note-command').value = note.command || '';
                        document.getElementById('editor-note-description').value = note.description || '';
                        if (note.images) {
                            const previewRow = document.getElementById('editor-note-image-previews');
                            note.images.forEach(img => addServerImagePreview(previewRow, img, null, 'editor'));
                        }
                    } else if (note.note_type === 'plain') {
                        if (quillEditor) quillEditor.root.innerHTML = note.description || '';
                    } else if (note.note_type === 'document') {
                        document.getElementById('editor-note-document-desc').value = note.description || '';
                        if (note.command && (!note.images || note.images.length === 0)) {
                            document.getElementById('editor-note-document-link').value = note.command;
                            toggleEditorDocSource('link');
                        } else {
                            toggleEditorDocSource('file');
                            if (note.images) {
                                const previewRow = document.getElementById('editor-note-document-previews');
                                note.images.forEach(img => addServerImagePreview(previewRow, img, null, 'editor'));
                            }
                        }
                    } else if (note.note_type === 'procedure') {
                        document.getElementById('editor-steps-list').innerHTML = '';
                        if (note.steps) {
                            note.steps.forEach(step => addStep('editor', step));
                        }
                    }

                    fetchEditorRevisions(note.id);
                    initCustomSelects();
                    syncCustomSelects();
                    statusText.innerHTML = '<span class="status-dot"></span> Draft loaded';
                    statusText.className = 'editor-autosave-status saved';
                }
            } catch(e) {
                showToast('Failed to load note data', true);
                closeWordPressEditor();
            }
        }

        // Setup change listeners for autosave
        setupEditorAutosaveListeners();
    }

    function closeWordPressEditor() {
        document.body.classList.remove('in-editor');
        document.getElementById('editor-page').style.display = 'none';
        if (autosaveTimer) clearTimeout(autosaveTimer);
        refreshAll();
    }

    function setupEditorAutosaveListeners() {
        const autosaveSelectors = [
            '#editor-note-title',
            '#editor-note-command',
            '#editor-note-description',
            '#editor-note-document-desc',
            '#editor-note-document-link',
            '#editor-note-tags',
            '#editor-note-category',
            '#editor-note-status'
        ];

        autosaveSelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) {
                el.removeEventListener('input', triggerAutosaveDebounce);
                el.removeEventListener('change', triggerAutosaveDebounce);
                el.addEventListener('input', triggerAutosaveDebounce);
                el.addEventListener('change', triggerAutosaveDebounce);
            }
        });

        // Quill change listener
        if (quillEditor) {
            quillEditor.off('text-change', triggerAutosaveDebounce);
            quillEditor.on('text-change', triggerAutosaveDebounce);
        }

        // Delegate listener for step changes
        const stepsList = document.getElementById('editor-steps-list');
        stepsList.removeEventListener('input', triggerAutosaveDebounce);
        stepsList.addEventListener('input', triggerAutosaveDebounce);
    }

    function triggerAutosaveDebounce() {
        const statusText = document.getElementById('editor-autosave-status');
        statusText.innerHTML = '<span class="status-dot"></span> Saving draft...';
        statusText.className = 'editor-autosave-status saving';

        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(async () => {
            await saveWordPressNote(true);
        }, 2000);
    }

    async function saveWordPressNote(isAutosave = false, forcePublish = false) {
        if (isSavingNote) return;
        isSavingNote = true;

        const noteId = document.getElementById('editor-note-id').value;
        let title = document.getElementById('editor-note-title').value.trim();
        const noteType = document.getElementById('editor-note-type').value;
        const command = document.getElementById('editor-note-command').value.trim();
        let description = '';
        const categoryId = document.getElementById('editor-note-category').value;
        const tags = document.getElementById('editor-note-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const steps = noteType === 'procedure' ? collectSteps('editor') : [];
        const reference_links = collectReferenceLinks('editor');
        let status = forcePublish ? 'published' : document.getElementById('editor-note-status').value;

        if (noteType === 'plain') {
            description = quillEditor ? quillEditor.root.innerHTML : '';
        } else if (noteType === 'document') {
            description = document.getElementById('editor-note-document-desc').value.trim();
        } else if (noteType === 'command') {
            description = document.getElementById('editor-note-description').value.trim();
        }

        if (!isAutosave && status === 'published') {
            if (!title) { showToast('Title is required to publish', true); isSavingNote = false; return; }
            if (noteType === 'command' && !command) { showToast('Command is required to publish', true); isSavingNote = false; return; }
            if (noteType === 'procedure' && steps.length === 0) { showToast('At least one step is required to publish', true); isSavingNote = false; return; }
            if (noteType === 'plain' && !description.replace(/<[^>]*>/g, '').trim()) { showToast('Note content is required to publish', true); isSavingNote = false; return; }
        }

        if (!title) {
            title = "Untitled Note";
        }

        const visibility = document.getElementById('editor-note-visibility').value;
        const teamId = visibility === 'team' ? document.getElementById('editor-note-team').value : null;

        const body = {
            title, note_type: noteType,
            command: noteType === 'command' ? command : '',
            description, tags, status,
            steps: steps.map(s => ({ title: s.title, command: s.command, description: s.description, blocks: s.blocks })),
            reference_links,
            is_autosave: isAutosave,
            visibility,
            team_id: teamId ? parseInt(teamId) : null
        };

        if (noteType === 'document') {
            const isLink = document.getElementById('editor-doc-source-link-btn').classList.contains('active');
            if (isLink) {
                const linkVal = document.getElementById('editor-note-document-link').value.trim();
                if (!isAutosave && !linkVal) { showToast('External Link is required to publish', true); isSavingNote = false; return; }
                body.command = linkVal;
            }
        }

        if (categoryId) body.category_id = parseInt(categoryId);

        const url = noteId ? 'api/notes/' + noteId : 'api/notes';
        const method = noteId ? 'PUT' : 'POST';

        const res = await apiFetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        if (!res) { isSavingNote = false; return; }
        
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showToast(data.message || 'Failed to save note', true);
            isSavingNote = false;
            return;
        }

        const currentId = noteId || data.id;
        document.getElementById('editor-note-id').value = currentId;

        // Upload attachments
        if (noteType === 'command' || noteType === 'document') {
            const previewRow = noteType === 'document' ? document.getElementById('editor-note-document-previews') : document.getElementById('editor-note-image-previews');
            await uploadPendingImages(currentId, previewRow);
        }

        // Upload step attachments
        if (noteType === 'procedure' && steps.length > 0) {
            const noteRes2 = await apiFetch('api/notes/' + currentId, { headers: authHeaders() });
            if (noteRes2 && noteRes2.ok) {
                const updatedNote = await noteRes2.json();
                if (updatedNote && updatedNote.steps) {
                    const list = document.getElementById('editor-steps-list');
                    const cards = Array.from(list.children);
                    for (let i = 0; i < updatedNote.steps.length; i++) {
                        const serverStep = updatedNote.steps[i];
                        const card = cards[i];
                        if (!card) continue;
                        const previewRow = card.querySelector('.step-img-previews');
                        await uploadPendingImages(currentId, previewRow, serverStep.id);
                    }
                }
            }
        }

        isSavingNote = false;
        
        const statusText = document.getElementById('editor-autosave-status');
        const now = new Date().toLocaleTimeString();
        statusText.innerHTML = `<span class="status-dot"></span> Draft saved at ${now}`;
        statusText.className = 'editor-autosave-status saved';

        if (!isAutosave) {
            showToast(status === 'published' ? 'Note published successfully!' : 'Draft saved successfully!');
            closeWordPressEditor();
        } else {
            // Update revisions panel
            fetchEditorRevisions(currentId);
        }
    }

    async function fetchEditorRevisions(noteId) {
        const list = document.getElementById('editor-revisions-list');
        try {
            const res = await apiFetch(`api/notes/${noteId}/revisions`, { headers: authHeaders() });
            if (res && res.ok) {
                const revisions = await res.json();
                if (revisions.length === 0) {
                    list.innerHTML = '<span class="no-revisions-text">No revisions recorded yet.</span>';
                    return;
                }
                list.innerHTML = revisions.map(r => {
                    const dt = new Date(r.created_at).toLocaleString();
                    return `
                        <div class="revision-item" data-rev-id="${r.id}" data-note-id="${r.note_id}">
                            <span class="revision-meta">${escapeHTML(dt)}</span>
                            <span class="revision-meta">by <span class="revision-author">${escapeHTML(r.created_by_username || 'Unknown')}</span></span>
                        </div>
                    `;
                }).join('');

                // Bind click events manually to the items
                list.querySelectorAll('.revision-item').forEach(item => {
                    item.onclick = () => restoreEditorRevision(item.dataset.noteId, item.dataset.revId);
                });
            }
        } catch(e) {
            console.error("Failed to fetch revisions", e);
        }
    }

    async function restoreEditorRevision(noteId, revId) {
        if (!confirm('Are you sure you want to restore this version? Your current unsaved changes will be saved as a new revision.')) return;
        const statusText = document.getElementById('editor-autosave-status');
        statusText.innerHTML = '<span class="status-dot"></span> Restoring revision...';
        statusText.className = 'editor-autosave-status saving';

        const res = await apiFetch(`api/notes/${noteId}/revisions/${revId}/restore`, { method: 'POST', headers: authHeaders() });
        if (res && res.ok) {
            showToast('Revision restored!');
            // Reload note into editor
            openWordPressEditor('edit', noteId);
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to restore revision', true);
        }
    }

    function toggleEditorPreview() {
        const previewBtn = document.getElementById('editor-preview-btn');
        const previewOverlay = document.getElementById('editor-preview-overlay');
        const previewContent = document.getElementById('editor-preview-content');

        if (previewOverlay.style.display === 'none') {
            // Render preview
            const title = document.getElementById('editor-note-title').value.trim() || 'Untitled Note';
            const noteType = document.getElementById('editor-note-type').value;
            const command = document.getElementById('editor-note-command').value.trim();
            const tags = document.getElementById('editor-note-tags').value.split(',').map(t => t.trim()).filter(t => t);
            const refLinks = collectReferenceLinks('editor');
            
            let description = '';
            if (noteType === 'plain') description = quillEditor ? quillEditor.root.innerHTML : '';
            else if (noteType === 'document') description = document.getElementById('editor-note-document-desc').value.trim();
            else if (noteType === 'command') description = document.getElementById('editor-note-description').value.trim();

            let steps = [];
            if (noteType === 'procedure') {
                steps = collectSteps('editor');
            }

            const tagsHtml = tags.map(t => `<span class="note-tag-pill">${escapeHTML(t)}</span>`).join('');
            const typeBadge = `<span class="note-type-badge type-${noteType}">${escapeHTML(noteType.toUpperCase())}</span>`;
            
            let refLinksHtml = '';
            if (refLinks.length > 0) {
                refLinksHtml = '<div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">' +
                    refLinks.map(l => `<a href="${escapeHTML(l)}" target="_blank" style="font-size: 0.8rem; background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; color: var(--accent); text-decoration: none; border: 1px solid var(--border);">🔗 ${escapeHTML(l)}</a>`).join('') +
                    '</div>';
            }

            let bodyHtml = '';
            if (noteType === 'command') {
                bodyHtml = `
                    <pre class="mac-code-block" style="margin-bottom: 20px;">
                        <div class="mac-dot mac-red"></div><div class="mac-dot mac-yellow"></div><div class="mac-dot mac-green"></div>
                        <code class="language-bash">${escapeHTML(command)}</code>
                    </pre>
                    <p style="font-size:0.95rem; line-height:1.6; color:var(--text-secondary);">${escapeHTML(description)}</p>
                `;
            } else if (noteType === 'plain') {
                bodyHtml = `<div class="markdown-body" style="font-size:0.95rem; line-height:1.6;">${DOMPurify.sanitize(marked.parse(description))}</div>`;
            } else if (noteType === 'document') {
                const isLink = document.getElementById('editor-doc-source-link-btn').classList.contains('active');
                if (isLink) {
                    const link = document.getElementById('editor-note-document-link').value.trim();
                    bodyHtml = `
                        <p style="font-size:0.95rem; color:var(--text-secondary); margin-bottom: 15px;">${escapeHTML(description)}</p>
                        <a href="${escapeHTML(link)}" target="_blank" class="btn btn-primary btn-sm">Open External SOP Link</a>
                    `;
                } else {
                    bodyHtml = `
                        <p style="font-size:0.95rem; color:var(--text-secondary); margin-bottom: 15px;">${escapeHTML(description)}</p>
                        <div style="padding: 20px; border: 1px dashed var(--border); border-radius: 4px; text-align: center; color: var(--text-muted);">
                            [ Document File Attached ]
                        </div>
                    `;
                }
            } else if (noteType === 'procedure') {
                bodyHtml = steps.map((step, si) => `
                    <div style="margin-top: 15px; padding: 15px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-primary);">
                        <h4 style="margin: 0 0 10px 0;">Step ${si + 1}: ${escapeHTML(step.title)}</h4>
                        ${step.blocks.map(block => {
                            if (block.type === 'desc') return `<p style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 8px;">${escapeHTML(block.content)}</p>`;
                            if (block.type === 'code') return `<pre class="mac-code-block" style="margin-bottom: 8px;"><div class="mac-dot mac-red"></div><div class="mac-dot mac-yellow"></div><div class="mac-dot mac-green"></div><code>${escapeHTML(block.content)}</code></pre>`;
                            if (block.type === 'image') return `<div class="procedure-step-image" style="max-width: 100%; margin-bottom: 8px;"><img src="${escapeHTML(block.content)}" style="max-width: 100%; max-height: 300px; border-radius: 4px;"></div>`;
                            return '';
                        }).join('')}
                    </div>
                `).join('');
            }

            previewContent.innerHTML = `
                <div style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                    ${typeBadge}
                </div>
                <h2 style="font-size: 1.8rem; margin: 0 0 15px 0;">${escapeHTML(title)}</h2>
                <div style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 8px;">${tagsHtml}</div>
                <div style="margin-bottom: 25px;">${bodyHtml}</div>
                ${refLinksHtml}
            `;

            previewOverlay.style.display = 'block';
            previewBtn.textContent = 'Edit Mode';
        } else {
            previewOverlay.style.display = 'none';
            previewBtn.textContent = 'Preview';
        }
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
            const teamBadges = (u.teams || []).map(t => `<span class="badge" style="background: rgba(var(--accent-rgb, 99, 102, 241), 0.15); color: var(--accent); border: 1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.3); font-size:0.75rem; margin-right:4px;">${escapeHTML(t.name)}</span>`).join('');
            html += `<tr>
                <td>${escapeHTML(u.username)}${isSelf ? ' <span style="color:var(--accent);font-size:0.75rem;">(you)</span>' : ''}</td>
                <td>
                    <span class="status-badge ${u.role === 'admin' ? 'enabled' : (u.role === 'moderator' ? 'moderator' : 'disabled')}">${escapeHTML(u.role)}</span>
                    <span class="status-badge" style="background:var(--bg-hover); color:var(--text-secondary); margin-left:4px;">${isAD ? 'AD' : 'Local'}</span>
                </td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:4px;">
                        ${teamBadges || '<span style="color:var(--text-muted);font-size:0.75rem;">None</span>'}
                        <button class="btn btn-ghost edit-user-teams-btn" data-user-id="${u.id}" data-username="${escapeHTML(u.username)}" data-teams='${JSON.stringify((u.teams || []).map(t=>t.id))}' style="padding:2px 6px; font-size:0.72rem; min-height:0; height:auto; line-height:1; margin-left:4px;">Edit</button>
                    </div>
                </td>
                <td>
                    <div style="display:flex; gap:8px; align-items:center;">
                        ${!isSelf ? `
                        <select class="user-role-select" data-user-id="${u.id}" data-current-role="${u.role}" style="padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size: 0.75rem;">
                            <option value="author" ${u.role === 'author' ? 'selected' : ''}>Author</option>
                            <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        ` : ''}
                        ${(!isSelf && !isAD) ? `<button class="btn-icon user-reset-btn" data-user-id="${u.id}" data-username="${escapeHTML(u.username)}" title="Reset Password" style="color:var(--success);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>` : ''}
                        ${!isSelf ? `<button class="btn-icon btn-icon-danger user-delete-btn" data-user-id="${u.id}">${ICONS.trash}</button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;

        tbody.querySelectorAll('.edit-user-teams-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.userId;
                const username = btn.dataset.username;
                const userTeamIds = JSON.parse(btn.dataset.teams || '[]');
                
                document.getElementById('user-teams-uid').value = uid;
                document.getElementById('user-teams-username-label').textContent = `Assigned Teams for: ${username}`;
                
                // Check correct checkboxes in modal list
                const listContainer = document.getElementById('user-teams-checkbox-list');
                listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = userTeamIds.includes(parseInt(cb.value));
                });
                
                openModal('user-teams-modal');
            });
        });
        
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

        tbody.querySelectorAll('.user-role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const newRole = e.target.value;
                const oldRole = select.dataset.currentRole;
                if (!confirm(`Change user role to ${newRole}?`)) {
                    e.target.value = oldRole; // revert
                    return;
                }
                const res = await apiFetch('api/users/' + select.dataset.userId + '/role', { 
                    method: 'PUT', 
                    headers: authHeaders(),
                    body: JSON.stringify({ role: newRole })
                });
                if (res && res.ok) { 
                    showToast('User role updated.'); 
                    loadAdminUsers(); 
                } else { 
                    const err = await res.json().catch(() => ({})); 
                    showToast(err.message || 'Failed to update user role', true);
                    e.target.value = oldRole; // revert
                }
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
        const auth_type = document.getElementById('ap-create-user-auth').value;

        const listContainer = document.getElementById('ap-create-user-teams-list');
        const checkedBoxes = listContainer ? listContainer.querySelectorAll('input[type="checkbox"]:checked') : [];
        const teamIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

        const res = await apiFetch('api/users', { 
            method: 'POST', 
            headers: authHeaders(), 
            body: JSON.stringify({ username, password, role, auth_type, team_ids: teamIds }) 
        });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to create user', true); return; }
        document.getElementById('ap-create-user-form').reset();
        if (listContainer) {
            listContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        }
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
            quillEditor = new Quill('#editor-plain-quill-container', quillOptions);
        }

        initTheme();
        initView();
        updateAuthUI();
        fetchStats();
        fetchCategories();
        fetchTags();
        fetchNotes();
        fetchTeams();
        setupVisibilityListeners();
        bindTeamsEventListeners();
        updateFilterIndicator();

        // Note type toggles (form)
        initNoteTypeToggle('add');
        initNoteTypeToggle('edit');

        // Image uploads (note-level, command type)
        initNoteImageUpload('add');
        initNoteImageUpload('edit');
        initNoteImageUpload('editor');

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
        const notesContainer = document.getElementById('notes-container');
        if (notesContainer) {
            notesContainer.addEventListener('click', (e) => {
                // Copy Code
                const copyBtn = e.target.closest('.note-copy-btn');
                if (copyBtn) {
                    const code = copyBtn.closest('.note-code-block').querySelector('code').textContent;
                    copyToClipboard(code, copyBtn);
                    return;
                }
                
                // Copy Path (UNC)
                const copyPathBtn = e.target.closest('.copy-path-btn');
                if (copyPathBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(copyPathBtn.dataset.path, copyPathBtn);
                    return;
                }

                // Edit Note
                const editBtn = e.target.closest('.note-edit-btn');
                if (editBtn) {
                    openWordPressEditor('edit', editBtn.dataset.id);
                    return;
                }

                // Delete Note
                const delBtn = e.target.closest('.note-delete-btn');
                if (delBtn) {
                    deleteNote(delBtn.dataset.id);
                    return;
                }

                // Inline Image Lightbox
                const inlineImg = e.target.closest('.note-inline-image');
                if (inlineImg) {
                    openLightbox(inlineImg.dataset.src);
                    return;
                }
                
                const stepImg = e.target.closest('.procedure-step-image');
                if (stepImg) {
                    openLightbox(stepImg.dataset.src);
                    return;
                }
            });
        }
        
        document.getElementById('add-note-btn').addEventListener('click', () => {
            openWordPressEditor('add');
        });

        // WordPress Editor Button Click listeners
        document.getElementById('editor-back-btn').addEventListener('click', closeWordPressEditor);
        document.getElementById('editor-preview-btn').addEventListener('click', toggleEditorPreview);
        document.getElementById('editor-save-draft-btn').addEventListener('click', () => saveWordPressNote(false, false));
        document.getElementById('editor-publish-btn').addEventListener('click', () => saveWordPressNote(false, true));
        document.getElementById('editor-add-step-btn').addEventListener('click', () => addStep('editor'));
        document.getElementById('editor-add-ref-link-btn').addEventListener('click', () => addReferenceLinkInput('editor'));

        // Note format buttons
        document.getElementById('editor-type-command-btn').addEventListener('click', () => setEditorNoteType('command'));
        document.getElementById('editor-type-procedure-btn').addEventListener('click', () => setEditorNoteType('procedure'));
        document.getElementById('editor-type-plain-btn').addEventListener('click', () => setEditorNoteType('plain'));
        document.getElementById('editor-type-document-btn').addEventListener('click', () => setEditorNoteType('document'));

        // Doc source buttons
        document.getElementById('editor-doc-source-file-btn').addEventListener('click', () => toggleEditorDocSource('file'));
        document.getElementById('editor-doc-source-link-btn').addEventListener('click', () => toggleEditorDocSource('link'));

        // Step add buttons
        document.getElementById('add-step-btn').addEventListener('click', () => addStep('add'));
        document.getElementById('edit-step-btn').addEventListener('click', () => addStep('edit'));

        // Reference link add buttons
        const addRefBtn = document.getElementById('add-reference-link-btn');
        if (addRefBtn) addRefBtn.addEventListener('click', () => addReferenceLinkInput('add'));
        
        const editRefBtn = document.getElementById('edit-reference-link-btn');
        if (editRefBtn) editRefBtn.addEventListener('click', () => addReferenceLinkInput('edit'));

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

        // Initialize custom select styling
        initCustomSelects();

        // Close custom select dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-wrapper.open').forEach(wrapper => {
                wrapper.classList.remove('open');
            });
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
                        updateDraftCount();
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

    function setupVisibilityListeners() {
        ['add', 'edit', 'editor'].forEach(prefix => {
            const visSelect = document.getElementById(`${prefix}-note-visibility`);
            const teamContainer = document.getElementById(`${prefix}-note-team-container`);
            if (visSelect && teamContainer) {
                visSelect.addEventListener('change', () => {
                    if (visSelect.value === 'team') {
                        teamContainer.style.display = 'block';
                    } else {
                        teamContainer.style.display = 'none';
                    }
                });
            }
        });
    }

    function renderAdminTeamsTable(teams) {
        const tbody = document.getElementById('ap-teams-tbody');
        if (!tbody) return;
        let html = '';
        teams.forEach(t => {
            const dateStr = t.created_at ? new Date(t.created_at + 'Z').toLocaleString() : '-';
            const relativeLink = `/${t.name.toLowerCase()}`;
            const absoluteLink = `${window.location.origin}${relativeLink}`;
            html += `<tr>
                <td style="font-weight:600;">${escapeHTML(t.name)}</td>
                <td>${escapeHTML(t.description || '-')}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <a href="${relativeLink}" target="_blank" style="color:var(--accent); text-decoration:none; font-size:0.85rem; font-weight:600; display:inline-flex; align-items:center; gap:4px;">${ICONS.folder} Open</a>
                        <button class="btn btn-ghost copy-team-link-btn" data-link="${escapeHTML(absoluteLink)}" style="padding:2px 6px; font-size:0.75rem; min-height:0; height:auto; line-height:1; display:inline-flex; align-items:center; gap:4px;">${ICONS.copy} Copy</button>
                    </div>
                </td>
                <td style="font-size:0.85rem; color:var(--text-secondary);">${dateStr}</td>
                <td>
                    <button class="btn-icon btn-icon-danger delete-team-btn" data-team-id="${t.id}">${ICONS.trash}</button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;

        tbody.querySelectorAll('.copy-team-link-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                copyToClipboard(btn.dataset.link, btn);
                showToast('Team home page URL copied!');
            });
        });

        tbody.querySelectorAll('.delete-team-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this team? Users will be deallocated and notes in this team will become orphaned.')) return;
                const res = await apiFetch('api/admin/teams/' + btn.dataset.teamId, { method: 'DELETE', headers: authHeaders() });
                if (res && res.ok) {
                    showToast('Team deleted successfully');
                    fetchTeams();
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(err.message || 'Failed to delete team', true);
                }
            });
        });
    }

    async function handleCreateTeam(e) {
        e.preventDefault();
        const name = document.getElementById('ap-create-team-name').value.trim();
        const description = document.getElementById('ap-create-team-desc').value.trim();
        if (!name) return;

        const res = await apiFetch('api/admin/teams', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name, description })
        });
        if (res && res.ok) {
            showToast('Team created successfully!');
            document.getElementById('ap-create-team-form').reset();
            fetchTeams();
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to create team', true);
        }
    }

    async function handleUserTeamsSubmit(e) {
        e.preventDefault();
        const uid = document.getElementById('user-teams-uid').value;
        const listContainer = document.getElementById('user-teams-checkbox-list');
        const checkedBoxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');
        const teamIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

        const res = await apiFetch(`api/users/${uid}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ team_ids: teamIds })
        });
        if (res && res.ok) {
            showToast('User teams updated successfully!');
            closeModal('user-teams-modal');
            loadAdminUsers();
        } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || 'Failed to update user teams', true);
        }
    }

    function bindTeamsEventListeners() {
        const createTeamForm = document.getElementById('ap-create-team-form');
        if (createTeamForm) {
            createTeamForm.addEventListener('submit', handleCreateTeam);
        }
        
        const userTeamsForm = document.getElementById('user-teams-form');
        if (userTeamsForm) {
            userTeamsForm.addEventListener('submit', handleUserTeamsSubmit);
        }

        const confirmTeamBtn = document.getElementById('login-confirm-team-btn');
        if (confirmTeamBtn) {
            confirmTeamBtn.addEventListener('click', () => {
                const selectedTeam = document.getElementById('login-active-team').value;
                if (selectedTeam === 'all') {
                    activeTeamFilter = null;
                } else {
                    activeTeamFilter = selectedTeam;
                }
                updateFilterIndicator();
                
                finalizeLogin({
                    token: currentToken,
                    role: currentRole,
                    username: currentUsername,
                    teams: currentUserTeams
                });
            });
    }

    function initCustomSelects() {
        document.querySelectorAll('select.form-select, select.form-select-sm').forEach(select => {
            // Check if wrapper already exists
            let wrapper = select.closest('.custom-select-wrapper');
            let trigger, optionsContainer;
            
            if (!wrapper) {
                // Wrap standard select element
                wrapper = document.createElement('div');
                wrapper.className = 'custom-select-wrapper';
                if (select.classList.contains('form-select-sm')) {
                    wrapper.classList.add('custom-select-sm');
                }
                select.parentNode.insertBefore(wrapper, select);
                wrapper.appendChild(select);
                
                // Create trigger element
                trigger = document.createElement('div');
                trigger.className = 'custom-select-trigger';
                trigger.innerHTML = `<span>Select...</span>`;
                wrapper.appendChild(trigger);
                
                // Create custom options container
                optionsContainer = document.createElement('div');
                optionsContainer.className = 'custom-select-options';
                wrapper.appendChild(optionsContainer);
                
                // Toggle dropdown menu visibility on trigger click
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Close all other custom selects first
                    document.querySelectorAll('.custom-select-wrapper.open').forEach(openWrapper => {
                        if (openWrapper !== wrapper) {
                            openWrapper.classList.remove('open');
                        }
                    });
                    wrapper.classList.toggle('open');
                });
            } else {
                trigger = wrapper.querySelector('.custom-select-trigger');
                optionsContainer = wrapper.querySelector('.custom-select-options');
            }
            
            // Build options list dynamically
            const selectOptions = Array.from(select.options);
            optionsContainer.innerHTML = '';
            
            selectOptions.forEach(opt => {
                const optEl = document.createElement('div');
                optEl.className = 'custom-select-option';
                optEl.dataset.value = opt.value;
                optEl.textContent = opt.textContent;
                
                if (opt.selected) {
                    optEl.classList.add('selected');
                    trigger.querySelector('span').textContent = opt.textContent;
                }
                
                optEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Update native select and trigger change
                    select.value = opt.value;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Update custom UI state
                    optionsContainer.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
                    optEl.classList.add('selected');
                    trigger.querySelector('span').textContent = opt.textContent;
                    
                    // Close menu
                    wrapper.classList.remove('open');
                });
                optionsContainer.appendChild(optEl);
            });
            
            // Set default trigger if none is selected
            if (!selectOptions.some(o => o.selected) && selectOptions.length > 0) {
                selectOptions[0].selected = true;
                trigger.querySelector('span').textContent = selectOptions[0].textContent;
                const firstOptEl = optionsContainer.querySelector('.custom-select-option');
                if (firstOptEl) firstOptEl.classList.add('selected');
            }
        });
    }

    function syncCustomSelects() {
        document.querySelectorAll('select.form-select, select.form-select-sm').forEach(select => {
            const wrapper = select.closest('.custom-select-wrapper');
            if (!wrapper) return;
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const optionsContainer = wrapper.querySelector('.custom-select-options');
            if (!trigger || !optionsContainer) return;
            
            // Mark correct selected element in custom list
            optionsContainer.querySelectorAll('.custom-select-option').forEach(optEl => {
                if (optEl.dataset.value === select.value) {
                    optEl.classList.add('selected');
                    trigger.querySelector('span').textContent = optEl.textContent;
                } else {
                    optEl.classList.remove('selected');
                }
            });
        });
    }

    // Expose helpers globally for testing or dynamic rendering needs
    window.initCustomSelects = initCustomSelects;
    window.syncCustomSelects = syncCustomSelects;

})();
