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
    let currentView = localStorage.getItem('sn_view') || 'view-cards';
    if (currentView === 'view-notebook') currentView = 'view-cards';
    let activeCategory = null;
    let activeCategoryName = null;
    let activePending = false;
    let activeDrafts = false;
    let activeMyNotes = false;
    let activeRejected = false;
    let activeFavorites = false;
    let activeTag = null;
    let activeTeamFilter = window.DEFAULT_TEAM_FILTER || null;
    let allNotes = [];
    let allCategories = [];
    let allTags = [];
    let isAdminPageOpen = false;

    // Pagination state
    let currentPage = 1;
    let hasMoreNotes = true;
    const notesPerPage = 15;
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

    function sanitizeUrl(url) {
        if (!url) return '#';
        const clean = String(url).trim();
        if (/^(?:(?:https?|mailto|tel):|\/|\.\/)/i.test(clean)) {
            return escapeHTML(clean);
        }
        return '#';
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
            const cleanPath = match.replace(/^file:\/\/\/?/i, '');
            return `<span class="local-path-chip" style="display:inline-flex; align-items:center; gap:4px; background:var(--bg-tertiary); padding:2px 8px; border-radius:4px; font-family:var(--font-mono); font-size:0.82rem; border:1px solid var(--border);">📄 ${cleanPath} <button type="button" class="btn btn-secondary btn-xs copy-path-btn" data-path="${escapeHTML(cleanPath)}" title="Copy Path to Clipboard" style="padding:1px 6px; font-size:10px; margin-left:4px; height:auto; line-height:1.2;">Copy Path</button></span>`;
        });

        const uncPattern = /"(\\\\[^"\n]+)"|'(\\\\[^'\n]+)'|(\\\\[a-zA-Z0-9_.-]+\\[^\s<]+)/g;
        result = result.replace(uncPattern, function(match, g1, g2, g3) {
            const path = g1 || g2 || g3;
            return `<span class="local-path-chip" style="display:inline-flex; align-items:center; gap:4px; background:var(--bg-tertiary); padding:2px 8px; border-radius:4px; font-family:var(--font-mono); font-size:0.82rem; border:1px solid var(--border);">📁 ${escapeHTML(path)} <button type="button" class="btn btn-secondary btn-xs copy-path-btn" data-path="${escapeHTML(path)}" title="Copy UNC Path to Clipboard" style="padding:1px 6px; font-size:10px; margin-left:4px; height:auto; line-height:1.2;">Copy Path</button></span>`;
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
        if (!container) return;
        const toast = document.createElement('div');
        let className = 'toast';
        if (isError === true || isError === 'error' || isError === 'danger') {
            className += ' toast-error';
        } else if (isError === 'success') {
            className += ' toast-success';
        }
        toast.className = className;
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
            if (res.status === 401) { 
                try {
                    const data = await res.clone().json();
                    if (data.message && (data.message.includes('expired') || data.message.includes('Invalid') || data.message.includes('missing') || data.message.includes('Authentication'))) {
                        doLogout(); 
                        showToast('Session expired. Please login again.', true); 
                        return null; 
                    }
                } catch(e) {}
                // If it's a 401 but not from our API (e.g., a corporate proxy), don't log out aggressively
                return res; 
            }
            return res;
        } catch (err) {
            showToast('Network error: ' + err.message, true);
            return null;
        }
    }

    let isRefreshingToken = false;
    async function checkSilentTokenRefresh() {
        if (!currentToken || isRefreshingToken) return;
        try {
            const parts = currentToken.split('.');
            if (parts.length !== 3) return;
            const payload = JSON.parse(atob(parts[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && (payload.exp - now < 86400)) {
                isRefreshingToken = true;
                const res = await fetch('api/auth/refresh', { method: 'POST', headers: authHeaders() });
                if (res && res.ok) {
                    const data = await res.json();
                    if (data.token) {
                        currentToken = data.token;
                        localStorage.setItem('sn_token', data.token);
                    }
                }
                isRefreshingToken = false;
            }
        } catch (e) {
            isRefreshingToken = false;
        }
    }

    // ─── THEME ──────────────────────────────────────────
    function initTheme() {
        const saved = localStorage.getItem('sn_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeUI(saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
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
        if (container) {
            container.className = 'notes-container ' + currentView;
        }
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            const isMatch = (btn.dataset.view === currentView) || 
                            (btn.dataset.view === 'view-card' && currentView === 'view-cards') ||
                            (btn.dataset.view === 'view-cards' && currentView === 'view-card');
            btn.classList.toggle('active', isMatch);
        });
    }

    function switchView(view) {
        if (isNppWorkspaceOpen) {
            toggleNppWorkspace(false);
        }
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
        const favNav = document.getElementById('sidebar-favorites-notes');
        const qaNav = document.getElementById('sidebar-quick-access');
        if (currentToken) {
            loggedOut.style.display = 'none';
            loggedIn.style.display = 'flex';
            const roleBadgeClass = (currentRole === 'admin') ? 'background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);' : (currentRole === 'moderator' ? 'background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);' : 'background:rgba(99,102,241,0.15);color:var(--accent);border:1px solid rgba(99,102,241,0.3);');
            const roleLabel = (currentRole || 'user').toUpperCase();
            usernameEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;"><span class="user-avatar" style="width:22px; height:22px; border-radius:50%; background:var(--accent-subtle); color:var(--accent); display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; border:1px solid var(--accent-border);">${(currentUsername || 'U').charAt(0).toUpperCase()}</span><span>${escapeHTML(currentUsername || '')}</span><span style="font-size:0.62rem; font-weight:700; padding:1px 5px; border-radius:4px; ${roleBadgeClass}">${roleLabel}</span></span>`;
            
            const dropAvatar = document.getElementById('dropdown-user-avatar');
            const dropName = document.getElementById('dropdown-user-name');
            const dropRole = document.getElementById('dropdown-user-role');
            const dropAdmin = document.getElementById('dropdown-admin-btn');
            if (dropAvatar) dropAvatar.textContent = (currentUsername || 'U').charAt(0).toUpperCase();
            if (dropName) dropName.textContent = currentUsername || '';
            if (dropRole) dropRole.textContent = (currentRole || 'User').toUpperCase();
            if (dropAdmin) dropAdmin.style.display = (currentRole === 'admin' || currentRole === 'moderator') ? '' : 'none';

            if (adminBtn) adminBtn.style.display = (currentRole === 'admin' || currentRole === 'moderator') ? '' : 'none';
            if (favNav) favNav.style.display = 'block';
            updatePendingCount();
            updateDraftCount();
            updateMyNotesCount();
            updateRejectedCount();
            updateFavoritesCount();
            fetchQuickAccessNotes();
        } else {
            loggedOut.style.display = 'flex';
            loggedIn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
            const pendingNav = document.getElementById('sidebar-pending-notes');
            if (pendingNav) pendingNav.style.display = 'none';
            const draftNav = document.getElementById('sidebar-draft-notes');
            if (draftNav) draftNav.style.display = 'none';
            const myNotesNav = document.getElementById('sidebar-mynotes-notes');
            if (myNotesNav) myNotesNav.style.display = 'none';
            const rejectedNav = document.getElementById('sidebar-rejected-notes');
            if (rejectedNav) rejectedNav.style.display = 'none';
            if (favNav) favNav.style.display = 'none';
            if (qaNav) qaNav.style.display = 'none';
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
        activeMyNotes = false;
        activeRejected = false;
        activeFavorites = false;
        closeUserMenu();
        updateAuthUI();
        if (isAdminPageOpen) closeAdminPage();
        renderNotes(allNotes);
        updateSidebarFavoritesUI();
    }

    function toggleUserMenu(e) {
        if (e) e.stopPropagation();
        const dropdown = document.getElementById('user-menu-dropdown');
        const btn = document.getElementById('user-menu-btn');
        if (!dropdown) return;
        const isOpen = dropdown.style.display !== 'none';
        if (isOpen) {
            closeUserMenu();
        } else {
            dropdown.style.display = 'block';
            if (btn) {
                btn.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        }
    }
    function closeUserMenu() {
        const dropdown = document.getElementById('user-menu-dropdown');
        const btn = document.getElementById('user-menu-btn');
        if (dropdown) dropdown.style.display = 'none';
        if (btn) {
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        }
    }
    window.toggleUserMenu = toggleUserMenu;
    window.closeUserMenu = closeUserMenu;

    // ─── MODALS ──────────────────────────────────────────
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { 
        window.closeAllCustomSelects(null, true);
        document.getElementById(id).style.display = 'none'; 
        if (id === 'login-modal') {
            const step1 = document.getElementById('login-step-1');
            const step2 = document.getElementById('login-step-2');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
        }
    }
    function closeAllModals() { 
        window.closeAllCustomSelects(null, true);
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); 
    }
    window.openModal = openModal;
    window.closeModal = closeModal;

    // ─── ADMIN PAGE ──────────────────────────────────────
    function openAdminPage() {
        window.closeAllCustomSelects(null, true);
        isAdminPageOpen = true;

        isNppWorkspaceOpen = false;
        const ws = document.getElementById('npp-workspace');
        if (ws) {
            ws.style.display = 'none';
            ws.classList.add('is-hidden');
        }

        const notesCont = document.getElementById('notes-container');
        if (notesCont) {
            notesCont.style.display = 'none';
            notesCont.classList.add('is-hidden');
        }
        const emptySt = document.getElementById('empty-state');
        if (emptySt) emptySt.style.display = 'none';
        const catGrid = document.getElementById('category-cards-grid');
        if (catGrid) catGrid.style.display = 'none';
        const carouselSec = document.getElementById('category-carousel-section');
        if (carouselSec) carouselSec.style.display = 'none';

        const adminP = document.getElementById('admin-page');
        if (adminP) {
            adminP.style.display = 'block';
            adminP.classList.remove('is-hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const optPending = document.getElementById('opt-pending-tab-btn');
        const optCategories = document.getElementById('opt-categories-tab-btn');
        const optUsers = document.getElementById('opt-users-tab-btn');
        const optSettings = document.getElementById('opt-settings-tab-btn');
        const optBackup = document.getElementById('opt-backup-tab-btn');
        const optAudit = document.getElementById('opt-audit-tab-btn');
        const optAnalytics = document.getElementById('opt-analytics-tab-btn');
        const createTeamCard = document.getElementById('ap-create-team-card');

        if (currentRole === 'moderator') {
            if (optCategories) optCategories.style.display = '';
            if (optUsers) optUsers.style.display = 'none';
            if (optSettings) optSettings.style.display = 'none';
            if (optBackup) optBackup.style.display = 'none';
            if (optAudit) optAudit.style.display = 'none';
            if (optAnalytics) optAnalytics.style.display = 'none';
            if (createTeamCard) createTeamCard.style.display = 'none';
            loadPendingNotes();
            loadAdminCategories();
        } else {
            if (optCategories) optCategories.style.display = '';
            if (optUsers) optUsers.style.display = '';
            if (optSettings) optSettings.style.display = '';
            if (optBackup) optBackup.style.display = '';
            if (optAudit) optAudit.style.display = '';
            if (optAnalytics) optAnalytics.style.display = '';
            if (createTeamCard) createTeamCard.style.display = '';
            loadPendingNotes();
            loadAdminCategories();
            loadAdminUsers();
            loadAdminSettings();
            loadAdminAudit();
        }
        
        switchAdminTab('ap-pending-tab');
    }

    function closeAdminPage() {
        window.closeAllCustomSelects(null, true);
        isAdminPageOpen = false;
        if (window.stopSystemStatusPolling) window.stopSystemStatusPolling();
        const adminP = document.getElementById('admin-page');
        if (adminP) {
            adminP.style.display = 'none';
            adminP.classList.add('is-hidden');
        }
        const catGrid = document.getElementById('category-cards-grid');
        if (catGrid) catGrid.style.display = '';
        const carouselSec = document.getElementById('category-carousel-section');
        if (carouselSec) carouselSec.style.display = '';
        const notesCont = document.getElementById('notes-container');
        if (notesCont) {
            notesCont.style.display = '';
            notesCont.classList.remove('is-hidden');
        }
        if (window.setupCategoryCarouselDots) setupCategoryCarouselDots();
        renderNotes(allNotes);
    }
    window.openAdminPage = openAdminPage;
    window.closeAdminPage = closeAdminPage;

    function switchAdminTab(tabId) {
        window.closeAllCustomSelects(null, true);
        document.querySelectorAll('.admin-page-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        document.querySelectorAll('.admin-page-tab-content').forEach(c => {
            c.classList.toggle('active', c.id === tabId);
            c.style.display = (c.id === tabId) ? 'block' : 'none';
        });

        if (tabId !== 'ap-settings-tab' && window.stopSystemStatusPolling) {
            window.stopSystemStatusPolling();
        }

        if (tabId === 'ap-pending-tab') loadPendingNotes();
        if (tabId === 'ap-categories-tab') loadAdminCategories();
        if (tabId === 'ap-users-tab') loadAdminUsers();
        if (tabId === 'ap-teams-tab') fetchTeams();
        if (tabId === 'ap-settings-tab') loadAdminSettings();
        if (tabId === 'ap-audit-tab') loadAdminAudit();
        if (tabId === 'ap-analytics-tab' && currentRole === 'admin') loadAdminAnalytics();
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
        if (!src || typeof src !== 'string') return;
        const cleanSrc = src.trim();
        if (!/^(?:https?:\/\/|\/|\.\/|data:image\/|blob:)/i.test(cleanSrc)) return;

        if (/\.(doc|docx|txt|csv|xlsx)(\?.*)?$/i.test(cleanSrc)) {
            const a = document.createElement('a');
            a.href = cleanSrc;
            a.download = '';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'img-lightbox-overlay';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'position:absolute; top:10px; right:10px; background:var(--bg); border:none; color:var(--text); font-size:24px; cursor:pointer; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:1001;';
        closeBtn.onclick = () => overlay.remove();

        if (/\.pdf(\?.*)?$/i.test(cleanSrc)) {
            overlay.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:var(--text); font-size:1.2rem;">Loading PDF...</div>`;
            overlay.appendChild(closeBtn);
            
            fetch(cleanSrc)
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.blob();
                })
                .then(blob => {
                    const objectUrl = URL.createObjectURL(blob);
                    overlay.innerHTML = `<object data="${objectUrl}" type="application/pdf" style="width:80%; height:85vh; border:none; background:white; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.5);"><p>Your browser does not support PDFs. <a href="${sanitizeUrl(cleanSrc)}" target="_blank" rel="noopener noreferrer" download>Download the PDF</a>.</p></object>`;
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
                    overlay.innerHTML = `<div style="background:var(--bg); padding:20px; border-radius:8px; color:var(--text-danger); box-shadow:0 4px 12px rgba(0,0,0,0.5);">Failed to load PDF. <br><br><a href="${sanitizeUrl(cleanSrc)}" target="_blank" rel="noopener noreferrer" download style="color:var(--primary); text-decoration:underline;">Click here to open or download it directly</a>.</div>`;
                    overlay.appendChild(closeBtn);
                });
        } else if (/\.md(\?.*)?$/i.test(cleanSrc)) {
            try {
                const res = await fetch(cleanSrc);
                const text = await res.text();
                const html = DOMPurify.sanitize(marked.parse(text));
                overlay.innerHTML = `<div style="width:80%; max-width:800px; max-height:85vh; overflow-y:auto; background:var(--bg); color:var(--text); border-radius:8px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,0.5); text-align:left;" class="md-preview-content">${html}</div>`;
                overlay.appendChild(closeBtn);
            } catch (err) {
                overlay.innerHTML = `<div style="background:var(--bg); padding:20px; border-radius:8px; color:var(--text-danger);">Failed to load markdown file.</div>`;
                overlay.appendChild(closeBtn);
            }
        } else {
            overlay.innerHTML = `<img src="${sanitizeUrl(cleanSrc)}" alt="Image preview">`;
            overlay.addEventListener('click', () => overlay.remove());
        }
        document.body.appendChild(overlay);
    }

    // ─── DATA FETCHING ───────────────────────────────────
    let fetchNotesAbortController = null;

    async function fetchNotes(resetPage = true) {
        if (resetPage) {
            if (fetchNotesAbortController) {
                try { fetchNotesAbortController.abort(); } catch(e) {}
            }
            fetchNotesAbortController = new AbortController();
        } else {
            if (fetchingNotes) return;
        }
        fetchingNotes = true;
        const currentSignal = fetchNotesAbortController ? fetchNotesAbortController.signal : null;

        const qInput = document.getElementById('search-input');
        const q = qInput ? qInput.value.trim() : '';

        const clearSearchBtn = document.getElementById('search-clear-btn');
        if (clearSearchBtn) {
            clearSearchBtn.style.display = q ? 'block' : 'none';
        }

        const searchCatSelect = document.getElementById('search-category-select');
        const searchCatVal = searchCatSelect ? searchCatSelect.value : '';
        const catToUse = activeCategory || searchCatVal || null;

        if (resetPage) {
            currentPage = 1;
            hasMoreNotes = true;
            const cont = document.getElementById('notes-container');
            if (cont) cont.innerHTML = '';
            renderSearchSuggestions(q);
        }

        if (!hasMoreNotes) {
            fetchingNotes = false;
            return;
        }

        let url = `api/notes?page=${currentPage}&limit=${notesPerPage}&`;
        const params = [];
        if (q) params.push('q=' + encodeURIComponent(q));
        if (catToUse) params.push('category=' + catToUse);
        if (activeTag) params.push('tag=' + encodeURIComponent(activeTag));
        if (activePending) params.push('status=pending');
        if (activeDrafts) params.push('status=draft');
        if (activeMyNotes) params.push('status=my_notes');
        if (activeRejected) params.push('status=rejected');
        if (activeFavorites) params.push('favorite=true');
        if (activeTeamFilter) params.push('team=' + encodeURIComponent(activeTeamFilter));
        url += params.join('&');
        
        try {
            const res = await apiFetch(url, { headers: authHeaders(), signal: currentSignal });
            if (!res || !res.ok) {
                renderNotes([]);
                return;
            }
            const data = await res.json();
            const newNotes = Array.isArray(data) ? data : [];
            
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
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Error fetching notes:', err);
            renderNotes([]);
        } finally {
            fetchingNotes = false;
        }
    }

    function renderSearchSuggestions(q) {
        const container = document.getElementById('search-suggestions');
        if (!container) return;
        
        if (!q || q.length < 2) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        const query = q.toLowerCase();
        
        const matchedCategories = (allCategories || []).filter(cat => 
            cat.enabled && cat.name.toLowerCase().includes(query)
        );
        const matchedTags = (allTags || []).filter(tag => 
            tag.name.toLowerCase().includes(query)
        );

        if (matchedCategories.length === 0 && matchedTags.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        let html = '<span style="font-weight: 500; color: var(--text-secondary); margin-right: 8px;">Quick Filters:</span>';
        
        matchedCategories.forEach(cat => {
            html += `<span class="suggestion-chip category-chip" data-cat-id="${cat.id}">📁 ${escapeHTML(cat.name)}</span>`;
        });
        matchedTags.forEach(tag => {
            html += `<span class="suggestion-chip tag-chip" data-tag-name="${tag.name}">🏷️ ${escapeHTML(tag.name)}</span>`;
        });

        container.innerHTML = html;
        container.style.display = 'flex';

        container.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.getElementById('search-input').value = '';
                container.innerHTML = '';
                container.style.display = 'none';
                
                if (chip.dataset.catId) {
                    const catId = chip.dataset.catId;
                    activeCategory = catId;
                    const cat = allCategories.find(c => c.id == catId);
                    activeCategoryName = cat ? cat.name : '';
                    activeTag = null;
                } else if (chip.dataset.tagName) {
                    activeTag = chip.dataset.tagName;
                    activeCategory = null;
                    activeCategoryName = null;
                }
                
                activePending = false;
                activeDrafts = false;
                activeFavorites = false;
                updateFilterIndicator();
                fetchNotes();
                renderSidebarCategories(allCategories);
                renderCategoryCards(allCategories);
                renderTags(allTags);
                updateSidebarFavoritesUI();
            });
        });
    }

    async function fetchCategories() {
        try {
            categoryNotesCache.clear();
            const res = await apiFetch('api/categories');
            if (!res || !res.ok) return;
            const data = await res.json();
            allCategories = Array.isArray(data) ? data : [];
            renderSidebarCategories(allCategories);
            renderCategoryCards(allCategories);
            populateCategoryDropdowns(allCategories);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }

    async function fetchTags() {
        try {
            const res = await apiFetch('api/tags');
            if (!res || !res.ok) return;
            const data = await res.json();
            allTags = Array.isArray(data) ? data : [];
            renderTags(allTags);
        } catch (err) {
            console.error('Error fetching tags:', err);
        }
    }

    async function fetchStats() {
        const res = await apiFetch('api/stats');
        if (!res) return;
        const data = await res.json();
        const sn = document.getElementById('stat-notes');
        const sc = document.getElementById('stat-categories');
        const st = document.getElementById('stat-tags');
        const sa = document.getElementById('sidebar-all-notes-count');
        if (sn) sn.textContent = data.total_notes || 0;
        if (sc) sc.textContent = data.total_categories || 0;
        if (st) st.textContent = data.total_tags || 0;
        if (sa) sa.textContent = data.total_notes || 0;
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

        const apCatTeamSelect = document.getElementById('ap-category-team');
        if (apCatTeamSelect) {
            let catTeamOpts = '<option value="">🌐 Global (All Teams)</option>';
            teams.forEach(t => {
                catTeamOpts += `<option value="${t.id}">👥 ${escapeHTML(t.name)}</option>`;
            });
            apCatTeamSelect.innerHTML = catTeamOpts;
        }

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

    function refreshAll() { fetchNotes(); fetchCategories(); fetchTags(); fetchStats(); fetchTeams(); updatePendingCount(); updateDraftCount(); updateMyNotesCount(); updateRejectedCount(); updateFavoritesCount(); fetchQuickAccessNotes(); }

    function isCategoryAccessible(c) {
        if (!c.enabled) return false;
        if (currentRole === 'admin' || currentRole === 'moderator') return true;
        if (!c.team_id) return true; // Global category
        if (currentUserTeams && Array.isArray(currentUserTeams)) {
            return currentUserTeams.some(t => (typeof t === 'object' ? t.id === c.team_id : t === c.team_id));
        }
        return false;
    }

    // ─── RENDER: CATEGORY CARDS ──────────────────────────
    function renderCategoryCards(categories) {
        const grid = document.getElementById('category-cards-grid');
        if (!grid) return;
        const safeCategories = Array.isArray(categories) ? categories : [];
        const enabledCats = safeCategories.filter(isCategoryAccessible);
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
                activeFavorites = false;
                updateFilterIndicator();
                fetchNotes();
                renderSidebarCategories(allCategories);
                renderCategoryCards(allCategories);
                renderTags(allTags);
                updateSidebarFavoritesUI();
            });
        });
        setTimeout(setupCategoryCarouselDots, 50);
    }

    function setupCategoryCarouselDots() {
        const grid = document.getElementById('category-cards-grid');
        const dotsContainer = document.getElementById('category-carousel-dots');
        if (!grid || !dotsContainer) return;
        
        dotsContainer.innerHTML = '';
        
        // If grid is hidden (in editor or admin panels), hide dots
        if (grid.style.display === 'none' || document.body.classList.contains('in-editor')) {
            dotsContainer.style.display = 'none';
            return;
        }

        const totalWidth = grid.scrollWidth;
        const viewWidth = grid.clientWidth;
        const scrollable = totalWidth - viewWidth;

        if (scrollable <= 0) {
            dotsContainer.style.display = 'none';
            return;
        }
        
        dotsContainer.style.display = 'flex';
        
        // Define step distance for pagination matching button step
        const step = 300;
        const pageCount = Math.ceil(totalWidth / step);
        
        let dotsHtml = '';
        for (let i = 0; i < pageCount; i++) {
            dotsHtml += `<div class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></div>`;
        }
        dotsContainer.innerHTML = dotsHtml;

        dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const idx = parseInt(dot.dataset.index);
                grid.scrollTo({
                    left: idx * step,
                    behavior: 'smooth'
                });
            });
        });

        if (grid._carouselScrollHandler) {
            grid.removeEventListener('scroll', grid._carouselScrollHandler);
        }
        grid._carouselScrollHandler = () => {
            const scrollLeft = grid.scrollLeft;
            const activeIdx = Math.round(scrollLeft / step);
            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
                if (idx === activeIdx) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        };
        grid.addEventListener('scroll', grid._carouselScrollHandler);
    }

    // Expose globally so resize event or page state changes can trigger it
    window.setupCategoryCarouselDots = setupCategoryCarouselDots;

    // ─── RENDER: SIDEBAR CATEGORIES (NOTION HIERARCHICAL TREE) ──
    const expandedCategoryIds = new Set();
    const categoryNotesCache = new Map();

    function renderSidebarCategories(categories) {
        const list = document.getElementById('categories-list');
        if (!list) return;
        const enabledCats = (Array.isArray(categories) ? categories : []).filter(isCategoryAccessible);

        const rootCats = enabledCats.filter(c => !c.parent_id);
        const subCatsByParent = new Map();
        enabledCats.filter(c => c.parent_id).forEach(sc => {
            const pid = sc.parent_id;
            if (!subCatsByParent.has(pid)) subCatsByParent.set(pid, []);
            subCatsByParent.get(pid).push(sc);
        });

        let html = '';
        rootCats.forEach(cat => {
            const subcats = subCatsByParent.get(cat.id) || [];
            const hasSubcats = subcats.length > 0;
            const isCatActive = activeCategory == cat.id;
            const isExpanded = expandedCategoryIds.has(cat.id);
            
            let totalCount = cat.note_count || 0;
            subcats.forEach(sc => { totalCount += (sc.note_count || 0); });

            let subcatsHtml = '';
            if (hasSubcats) {
                subcatsHtml = `<ul class="category-subcategories-tree" id="cat-subcats-${cat.id}" style="${isExpanded ? 'display:flex;' : 'display:none;'}">`;
                subcats.forEach(sc => {
                    const isSubActive = activeCategory == sc.id;
                    const isSubExpanded = expandedCategoryIds.has(sc.id);
                    const subCount = sc.note_count || 0;

                    subcatsHtml += `
                        <li class="subcategory-tree-node ${isSubExpanded ? 'expanded' : ''}" data-cat-id="${sc.id}">
                            <div class="subcategory-item${isSubActive ? ' active' : ''}" data-id="${sc.id}">
                                ${subCount > 0 ? `
                                    <button class="cat-expand-toggle" title="Expand notes" data-cat-id="${sc.id}">
                                        <svg class="cat-caret-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                ` : `<span style="width:14px; margin-right:4px;"></span>`}
                                <span class="category-item-name" title="${escapeHTML(sc.name)}">${escapeHTML(sc.name)}</span>
                                <span class="category-item-count">${subCount}</span>
                            </div>
                            <ul class="category-subnotes-tree" id="cat-subnotes-${sc.id}" style="${isSubExpanded ? 'display:flex;' : 'display:none;'}">
                            </ul>
                        </li>
                    `;
                });
                subcatsHtml += `</ul>`;
            }

            html += `
                <li class="category-tree-node ${isExpanded ? 'expanded' : ''}" data-cat-id="${cat.id}">
                    <div class="category-item${isCatActive ? ' active' : ''}" data-id="${cat.id}">
                        ${(hasSubcats || totalCount > 0) ? `
                            <button class="cat-expand-toggle" title="Expand" data-cat-id="${cat.id}">
                                <svg class="cat-caret-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        ` : `<span style="width:16px; margin-right:4px;"></span>`}
                        <span class="category-item-name" title="${escapeHTML(cat.name)}">${escapeHTML(cat.name)}</span>
                        <span class="category-item-count">${totalCount}</span>
                    </div>
                    ${subcatsHtml}
                    ${!hasSubcats ? `
                        <ul class="category-subnotes-tree" id="cat-subnotes-${cat.id}" style="${isExpanded ? 'display:flex;' : 'display:none;'}">
                        </ul>
                    ` : ''}
                </li>
            `;
        });
        list.innerHTML = html;

        // Restore notes in expanded nodes
        enabledCats.forEach(cat => {
            if (expandedCategoryIds.has(cat.id)) {
                loadAndRenderCategorySubnotes(cat.id);
            }
        });

        // Caret toggle listeners
        list.querySelectorAll('.cat-expand-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const catId = parseInt(btn.dataset.catId);
                const treeNode = btn.closest('.category-tree-node, .subcategory-tree-node');
                const subcatsList = document.getElementById(`cat-subcats-${catId}`);
                const subnotesList = document.getElementById(`cat-subnotes-${catId}`);
                if (!treeNode) return;

                if (expandedCategoryIds.has(catId)) {
                    expandedCategoryIds.delete(catId);
                    treeNode.classList.remove('expanded');
                    if (subcatsList) subcatsList.style.display = 'none';
                    if (subnotesList) subnotesList.style.display = 'none';
                } else {
                    expandedCategoryIds.add(catId);
                    treeNode.classList.add('expanded');
                    if (subcatsList) subcatsList.style.display = 'flex';
                    if (subnotesList) {
                        subnotesList.style.display = 'flex';
                        loadAndRenderCategorySubnotes(catId);
                    }
                }
            });
        });

        // Category/Subcategory item click (Filter feed)
        list.querySelectorAll('.category-item, .subcategory-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.cat-expand-toggle')) return;
                const id = item.dataset.id;
                const catId = parseInt(id);
                if (activeCategory == id) { 
                    activeCategory = null; 
                    activeCategoryName = null; 
                } else { 
                    activeCategory = id; 
                    const cat = allCategories.find(c => c.id == id); 
                    activeCategoryName = cat ? cat.name : ''; 
                    
                    const treeNode = item.closest('.category-tree-node, .subcategory-tree-node');
                    const subcatsList = document.getElementById(`cat-subcats-${catId}`);
                    const subnotesList = document.getElementById(`cat-subnotes-${catId}`);
                    if (treeNode) {
                        expandedCategoryIds.add(catId);
                        treeNode.classList.add('expanded');
                        if (subcatsList) subcatsList.style.display = 'flex';
                        if (subnotesList) {
                            subnotesList.style.display = 'flex';
                            loadAndRenderCategorySubnotes(catId);
                        }
                    }
                }

                const searchCatSelect = document.getElementById('search-category-select');
                if (searchCatSelect) searchCatSelect.value = activeCategory || '';

                activeTag = null; 
                activePending = false; 
                activeDrafts = false;
                activeFavorites = false;
                if (isAdminPageOpen) closeAdminPage();
                
                // Show collection in Cards view
                switchView('view-cards');
                updateFilterIndicator(); 
                fetchNotes();
                renderSidebarCategories(allCategories); 
                renderTags(allTags);
                updateSidebarFavoritesUI();
            });
        });
    }

    async function loadAndRenderCategorySubnotes(catId) {
        const subnotesList = document.getElementById(`cat-subnotes-${catId}`);
        if (!subnotesList) return;

        if (categoryNotesCache.has(catId)) {
            renderSubnotesListHtml(subnotesList, categoryNotesCache.get(catId));
            return;
        }

        subnotesList.innerHTML = '<li style="padding:4px 8px; font-size:0.75rem; color:var(--text-tertiary);">Loading...</li>';

        try {
            const res = await apiFetch(`api/notes?category=${catId}&limit=50`, { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                categoryNotesCache.set(catId, notes);
                renderSubnotesListHtml(subnotesList, notes);
            } else {
                subnotesList.innerHTML = '<li style="padding:4px 8px; font-size:0.75rem; color:var(--text-tertiary);">No notes</li>';
            }
        } catch(err) {
            console.error('Error loading subnotes', err);
            subnotesList.innerHTML = '<li style="padding:4px 8px; font-size:0.75rem; color:var(--text-tertiary);">Failed to load</li>';
        }
    }

    function renderSubnotesListHtml(container, notes) {
        if (!notes || notes.length === 0) {
            container.innerHTML = '<li style="padding:4px 8px; font-size:0.75rem; color:var(--text-tertiary);">No notes</li>';
            return;
        }

        let html = '';
        notes.forEach(n => {
            const icon = n.note_type === 'procedure' ? '📋' : (n.note_type === 'document' ? '📄' : '💻');
            const isPinned = n.is_pinned ? '📌 ' : '';
            html += `
                <li class="subnote-tree-item" data-note-id="${n.id}" title="${escapeHTML(n.title)}">
                    <span class="subnote-icon">${icon}</span>
                    <span class="subnote-title">${isPinned}${escapeHTML(n.title)}</span>
                </li>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.subnote-tree-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteId = parseInt(item.dataset.noteId);
                
                document.querySelectorAll('.subnote-tree-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');

                if (currentView === 'view-notebook') {
                    loadNotebookNote(noteId);
                } else {
                    openNoteInNppTab(noteId);
                }

                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
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
                activeFavorites = false;
                if (isAdminPageOpen) closeAdminPage();
                updateFilterIndicator(); fetchNotes();
                renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
                updateSidebarFavoritesUI();
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
        } else if (activeMyNotes) {
            textEl.innerHTML = '<span style="color:#10b981; display:flex; align-items:center; gap:6px;">📝 My Published Notes</span>';
            el.style.display = 'inline-flex';
        } else if (activeRejected) {
            textEl.innerHTML = '<span style="color:#ef4444; display:flex; align-items:center; gap:6px;">❌ Rejected Notes</span>';
            el.style.display = 'inline-flex';
        } else if (activeFavorites) {
            textEl.innerHTML = '<span style="color:#f59e0b; display:flex; align-items:center; gap:6px;">⭐ Favorites</span>';
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
        activeCategory = null; activeCategoryName = null; activeTag = null; activePending = false; activeDrafts = false; activeMyNotes = false; activeRejected = false;
        activeFavorites = false;
        activeTeamFilter = null;
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        if (window.history && window.history.pushState) {
            window.history.pushState(null, null, '/');
        }
        if (isAdminPageOpen) closeAdminPage();
        if (document.body.classList.contains('in-editor')) closeWordPressEditor();
        const suggestions = document.getElementById('search-suggestions');
        if (suggestions) {
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
        }
        updateFilterIndicator(); fetchNotes();
        renderSidebarCategories(allCategories); renderCategoryCards(allCategories); renderTags(allTags);
        updateSidebarFavoritesUI();
    }
    window.clearFilter = clearFilter;
    window.goHome = clearFilter;



    async function updatePendingCount() {
        if (!currentToken) {
            document.getElementById('sidebar-pending-notes').style.display = 'none';
            const adminBadge = document.getElementById('admin-btn-badge');
            if (adminBadge) adminBadge.style.display = 'none';
            const dropAdminBadge = document.getElementById('dropdown-admin-badge');
            if (dropAdminBadge) dropAdminBadge.style.display = 'none';
            return;
        }
        try {
            const res = await apiFetch('api/notes?status=pending', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                const count = notes.length;
                document.getElementById('sidebar-pending-count').textContent = count;
                document.getElementById('sidebar-pending-notes').style.display = count > 0 ? 'block' : 'none';
                const adminBadge = document.getElementById('admin-btn-badge');
                if (adminBadge) {
                    adminBadge.textContent = count;
                    adminBadge.style.display = (count > 0 && (currentRole === 'admin' || currentRole === 'moderator')) ? 'inline-block' : 'none';
                }
                const dropAdminBadge = document.getElementById('dropdown-admin-badge');
                if (dropAdminBadge) {
                    dropAdminBadge.textContent = count;
                    dropAdminBadge.style.display = (count > 0 && (currentRole === 'admin' || currentRole === 'moderator')) ? 'inline-block' : 'none';
                }
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

    async function updateMyNotesCount() {
        if (!currentToken) {
            const el = document.getElementById('sidebar-mynotes-notes');
            if (el) el.style.display = 'none';
            return;
        }
        try {
            const res = await apiFetch('api/notes?status=my_notes', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                const count = notes.length;
                const badge = document.getElementById('sidebar-mynotes-count');
                if (badge) badge.textContent = count;
                const container = document.getElementById('sidebar-mynotes-notes');
                if (container) container.style.display = count > 0 ? 'block' : 'none';
            }
        } catch (err) {
            console.error('Error fetching my notes count', err);
        }
    }

    async function updateRejectedCount() {
        const el = document.getElementById('sidebar-rejected-notes');
        if (!currentToken || !el) {
            if (el) el.style.display = 'none';
            return;
        }
        try {
            const res = await apiFetch('api/notes?status=rejected', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                const count = notes.length;
                document.getElementById('sidebar-rejected-count').textContent = count;
                el.style.display = count > 0 ? 'block' : 'none';
            }
        } catch (err) {
            console.error('Error fetching rejected notes count', err);
        }
    }

    async function updateFavoritesCount() {
        if (!currentToken) {
            document.getElementById('sidebar-favorites-notes').style.display = 'none';
            return;
        }
        try {
            const res = await apiFetch('api/notes?favorite=true', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                const count = notes.length;
                const badge = document.getElementById('sidebar-favorites-count');
                if (badge) badge.textContent = count;
                document.getElementById('sidebar-favorites-notes').style.display = 'block';
            }
        } catch (err) {
            console.error('Error fetching favorites count', err);
        }
    }

    function populateCategoryDropdowns(categories) {
        const enabledCats = (Array.isArray(categories) ? categories : []).filter(isCategoryAccessible);
        const rootCats = enabledCats.filter(c => !c.parent_id);
        const subCatsByParent = new Map();
        enabledCats.filter(c => c.parent_id).forEach(sc => {
            if (!subCatsByParent.has(sc.parent_id)) subCatsByParent.set(sc.parent_id, []);
            subCatsByParent.get(sc.parent_id).push(sc);
        });

        let optionsHtml = '<option value="">None</option>';
        rootCats.forEach(rc => {
            const teamTag = rc.team_name ? ` [${escapeHTML(rc.team_name)}]` : '';
            const children = subCatsByParent.get(rc.id) || [];
            if (children.length > 0) {
                optionsHtml += `<option value="${rc.id}" style="font-weight:700;">📁 ${escapeHTML(rc.name)}${teamTag}</option>`;
                children.forEach(cc => {
                    const subTeamTag = cc.team_name ? ` [${escapeHTML(cc.team_name)}]` : '';
                    optionsHtml += `<option value="${cc.id}">&nbsp;&nbsp;&nbsp;&nbsp;└─ ${escapeHTML(cc.name)}${subTeamTag}</option>`;
                });
            } else {
                optionsHtml += `<option value="${rc.id}">📁 ${escapeHTML(rc.name)}${teamTag}</option>`;
            }
        });

        ['add-note-category', 'edit-note-category'].forEach(selectId => {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            const cur = sel.value;
            sel.innerHTML = optionsHtml;
            sel.value = cur;
        });

        const searchCatSelect = document.getElementById('search-category-select');
        if (searchCatSelect) {
            let searchOpts = '<option value="">All Categories</option>';
            rootCats.forEach(rc => {
                const children = subCatsByParent.get(rc.id) || [];
                if (children.length > 0) {
                    searchOpts += `<option value="${rc.id}" style="font-weight:700;">📁 ${escapeHTML(rc.name)}</option>`;
                    children.forEach(cc => {
                        searchOpts += `<option value="${cc.id}">&nbsp;&nbsp;&nbsp;&nbsp;└─ ${escapeHTML(cc.name)}</option>`;
                    });
                } else {
                    searchOpts += `<option value="${rc.id}">📁 ${escapeHTML(rc.name)}</option>`;
                }
            });
            const curVal = searchCatSelect.value;
            searchCatSelect.innerHTML = searchOpts;
            searchCatSelect.value = activeCategory || curVal || '';
        }

        initCustomSelects();
    }

    // ─── RENDER: NOTES ───────────────────────────────────
    // ─── NOTEPAD++ MULTI-TAB WORKSPACE ───────────────────
    let nppOpenTabs = [];
    let nppActiveTabId = null;
    let isNppWorkspaceOpen = false;

    // Load persisted tabs on start
    try {
        const savedTabs = localStorage.getItem('sn_npp_tabs');
        if (savedTabs) {
            nppOpenTabs = JSON.parse(savedTabs) || [];
        }
        const savedActive = localStorage.getItem('sn_npp_active');
        if (savedActive) {
            nppActiveTabId = parseInt(savedActive) || null;
        }
    } catch(e) {}

    function saveNppState() {
        try {
            localStorage.setItem('sn_npp_tabs', JSON.stringify(nppOpenTabs));
            if (nppActiveTabId) {
                localStorage.setItem('sn_npp_active', nppActiveTabId.toString());
            } else {
                localStorage.removeItem('sn_npp_active');
            }
        } catch(e) {}
    }

    function toggleNppWorkspace(show) {
        const workspace = document.getElementById('npp-workspace');
        const container = document.getElementById('notes-container');
        if (!workspace || !container) return;

        if (show) {
            if (nppOpenTabs.length === 0) {
                if (allNotes && allNotes.length > 0) {
                    openNoteInNppTab(allNotes[0].id);
                    return;
                } else {
                    showToast('No notes available to open', 'info');
                    return;
                }
            }
            isNppWorkspaceOpen = true;
            workspace.style.display = 'flex';
            container.style.display = 'none';
            container.classList.add('is-hidden');
            document.querySelectorAll('.view-toggle-group .view-toggle-btn').forEach(b => b.classList.remove('active'));
            renderNppTabs();
            if (nppActiveTabId) {
                loadNppActiveDocument(nppActiveTabId);
            } else if (nppOpenTabs.length > 0) {
                switchNppTab(nppOpenTabs[0].id);
            }
        } else {
            isNppWorkspaceOpen = false;
            workspace.style.display = 'none';
            container.style.display = '';
            container.classList.remove('is-hidden');
            document.querySelectorAll('.view-toggle-group .view-toggle-btn').forEach(b => {
                const isMatch = (b.dataset.view === currentView) || 
                                (b.dataset.view === 'view-card' && currentView === 'view-cards') ||
                                (b.dataset.view === 'view-cards' && currentView === 'view-card');
                b.classList.toggle('active', isMatch);
            });
        }
    }
    window.toggleNppWorkspace = toggleNppWorkspace;

    async function openNoteInNppTab(noteId) {
        const id = parseInt(noteId);
        if (!id) return;

        // If in notebook view, keep notebook canvas behavior
        if (currentView === 'view-notebook') {
            loadNotebookNote(id);
            return;
        }

        // Find note from local cache or fetch
        let note = allNotes.find(n => n.id === id);
        if (!note) {
            try {
                const res = await apiFetch(`api/notes/${id}`, { headers: authHeaders() });
                if (res && res.ok) {
                    note = await res.json();
                }
            } catch(e) {}
        }

        const title = note ? note.title : `Note #${id}`;
        const noteType = note ? note.note_type : 'command';

        // Add to open tabs if not already present
        const existingIdx = nppOpenTabs.findIndex(t => t.id === id);
        if (existingIdx === -1) {
            nppOpenTabs.push({ id, title, note_type: noteType });
        } else {
            nppOpenTabs[existingIdx].title = title;
            nppOpenTabs[existingIdx].note_type = noteType;
        }

        nppActiveTabId = id;
        saveNppState();
        toggleNppWorkspace(true);
    }
    window.openNoteInNppTab = openNoteInNppTab;

    function switchNppTab(noteId) {
        const id = parseInt(noteId);
        if (!id) return;
        nppActiveTabId = id;
        saveNppState();
        renderNppTabs();
        loadNppActiveDocument(id);
    }
    window.switchNppTab = switchNppTab;

    function closeNppTab(noteId, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const id = parseInt(noteId);
        const idx = nppOpenTabs.findIndex(t => t.id === id);
        if (idx === -1) return;

        nppOpenTabs.splice(idx, 1);

        if (nppActiveTabId === id) {
            if (nppOpenTabs.length > 0) {
                const nextIdx = Math.min(idx, nppOpenTabs.length - 1);
                nppActiveTabId = nppOpenTabs[nextIdx].id;
                saveNppState();
                renderNppTabs();
                loadNppActiveDocument(nppActiveTabId);
            } else {
                nppActiveTabId = null;
                saveNppState();
                toggleNppWorkspace(false);
            }
        } else {
            saveNppState();
            renderNppTabs();
        }
    }
    window.closeNppTab = closeNppTab;

    function closeAllNppTabs() {
        nppOpenTabs = [];
        nppActiveTabId = null;
        saveNppState();
        toggleNppWorkspace(false);
    }
    window.closeAllNppTabs = closeAllNppTabs;

    function renderNppTabs() {
        const tabsList = document.getElementById('npp-tabs-list');
        if (!tabsList) return;

        let html = '';
        nppOpenTabs.forEach(tab => {
            const isActive = tab.id === nppActiveTabId;
            let icon = '💻';
            if (tab.note_type === 'procedure') icon = '📋';
            else if (tab.note_type === 'document') icon = '📄';
            else if (tab.note_type === 'plain') icon = '📝';

            html += `
                <div class="npp-tab ${isActive ? 'active' : ''}" 
                    role="tab" 
                    id="npp-tab-${tab.id}"
                    aria-selected="${isActive}" 
                    aria-controls="npp-document-body"
                    data-id="${tab.id}" 
                    title="${escapeHTML(tab.title)}" 
                    onclick="switchNppTab(${tab.id})">
                    <span class="npp-tab-icon">${icon}</span>
                    <span class="npp-tab-title">${escapeHTML(tab.title)}</span>
                    <button type="button" 
                        class="npp-tab-close" 
                        title="Close Tab (Ctrl+W / Alt+W)" 
                        aria-label="Close tab ${escapeHTML(tab.title)}" 
                        onclick="closeNppTab(${tab.id}, event)">✕</button>
                </div>
            `;
        });
        tabsList.innerHTML = html;

        // Scroll active tab into view
        const activeTabEl = tabsList.querySelector('.npp-tab.active');
        if (activeTabEl) {
            activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

    async function loadNppActiveDocument(noteId) {
        const bodyEl = document.getElementById('npp-document-body');
        if (!bodyEl) return;

        bodyEl.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; min-height:280px; color:var(--text-secondary); gap:10px;">
                <div class="spinner" style="width:22px; height:22px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                <span>Loading note document...</span>
            </div>
        `;

        try {
            const res = await apiFetch(`api/notes/${noteId}`, { headers: authHeaders() });
            if (!res || !res.ok) {
                bodyEl.innerHTML = `
                    <div style="padding:40px 20px; text-align:center; color:var(--text-secondary);">
                        <div style="font-size:32px; margin-bottom:10px;">⚠️</div>
                        <p style="color:var(--danger); font-weight:600; font-size:1rem; margin-bottom:8px;">Note not found or deleted</p>
                        <p style="font-size:0.85rem; color:var(--text-tertiary); margin-bottom:16px;">This note does not exist or has been removed.</p>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="closeNppTab(${noteId})">Close Tab</button>
                    </div>
                `;
                return;
            }
            const note = await res.json();
            bodyEl.innerHTML = buildNppDocumentHtml(note);

            // Update status bar
            const stCat = document.getElementById('npp-status-cat');
            const stAuthor = document.getElementById('npp-status-author');
            const stTeam = document.getElementById('npp-status-team');
            const stDate = document.getElementById('npp-status-date');

            if (stCat) stCat.textContent = `📁 ${note.category_name || 'General'}`;
            if (stAuthor) stAuthor.textContent = `👤 ${note.created_by_username || 'Unknown'}`;
            if (stTeam) {
                if (note.team_name) {
                    stTeam.style.display = 'inline-flex';
                    stTeam.textContent = `👥 ${note.team_name}`;
                } else {
                    stTeam.style.display = 'none';
                }
            }
            if (stDate) stDate.textContent = `📅 ${note.created_at ? new Date(note.created_at).toLocaleDateString() : 'N/A'}`;

        } catch(err) {
            console.error('Error loading Notepad++ active document:', err);
            bodyEl.innerHTML = `<div style="color:var(--danger); padding:20px;">Error loading document.</div>`;
        }
    }

    function buildNppDocumentHtml(note) {
        const isProcedure = note.note_type === 'procedure';
        const isDocument = note.note_type === 'document';
        const isPlain = note.note_type === 'plain';
        const isCreator = (currentToken && note.created_by_username === currentUsername);
        const canModify = currentToken && (currentRole === 'admin' || currentRole === 'moderator' || isCreator);
        const dt = note.created_at ? new Date(note.created_at).toLocaleString() : 'N/A';

        let typeBadgeClass = 'type-command';
        let typeBadgeIcon = ICONS.copy;
        let typeBadgeText = 'Command';
        if (isProcedure) { typeBadgeClass = 'type-procedure'; typeBadgeIcon = ICONS.steps; typeBadgeText = 'Procedure'; }
        else if (isDocument) { typeBadgeClass = 'type-document'; typeBadgeIcon = ICONS.file_pdf; typeBadgeText = 'DOCS / SOP'; }
        else if (isPlain) { typeBadgeClass = 'type-plain'; typeBadgeIcon = ICONS.copy; typeBadgeText = 'Rich Note'; }

        const typeBadge = `<span class="note-type-badge ${typeBadgeClass}">${typeBadgeIcon} ${typeBadgeText}</span>`;

        let pendingBadge = '';
        if (note.is_pinned) {
            pendingBadge += `<span class="note-pending-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; margin-left: 6px; font-size: 0.72rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid rgba(245, 158, 11, 0.3);">📌 Pinned</span>`;
        }
        if (note.status === 'draft') {
            pendingBadge += `<span class="note-pending-badge" style="background: rgba(var(--accent-rgb, 99, 102, 241), 0.15); color: var(--accent); margin-left: 6px; font-size: 0.72rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.3);">✍️ Draft</span>`;
        } else if (note.approved === -1) {
            pendingBadge += `<span class="note-pending-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; margin-left: 6px; font-size: 0.72rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.3);">❌ Rejected</span>`;
        } else if (note.approved === 0) {
            pendingBadge += `<span class="note-pending-badge" style="background: rgba(245, 158, 11, 0.15); color: rgb(245, 158, 11); margin-left: 6px; font-size: 0.72rem; font-weight: 600; padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid rgba(245, 158, 11, 0.3);">⏱️ Pending</span>`;
        }

        const tags = Array.isArray(note.tags) ? note.tags : [];
        const tagsHtml = tags.map(t => `<span class="note-tag-pill">#${escapeHTML(t)}</span>`).join(' ');

        // Code Gutter Generator
        function renderCodeWithGutter(code) {
            if (!code) return '';
            const lines = code.split('\n');
            const gutterLines = lines.map((_, i) => i + 1).join('\n');
            const lang = detectLanguage(code);
            return `
                <div class="npp-code-container">
                    <div class="npp-code-header">
                        <span>${lang}</span>
                        <button type="button" class="btn btn-ghost btn-xs note-copy-btn" title="Copy code" style="color:#c9d1d9;">${ICONS.copy} Copy</button>
                    </div>
                    <div class="npp-code-editor-view">
                        <pre class="npp-code-gutter">${gutterLines}</pre>
                        <pre class="npp-code-content"><code>${escapeHTML(code)}</code></pre>
                    </div>
                </div>
            `;
        }

        // Description / Content
        let descHtml = '';
        if (note.description) {
            if (isPlain) {
                let sanitized = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.description) : escapeHTML(note.description);
                descHtml = `<div class="note-description ql-editor markdown-body" style="color:var(--text-primary); margin-bottom:20px; font-size:14.5px; line-height:1.7;">${sanitized}</div>`;
            } else {
                let parsedDesc = (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') ? DOMPurify.sanitize(marked.parse(note.description)) : autolink(note.description);
                descHtml = `<div class="note-description markdown-body" style="color:var(--text-secondary); margin-bottom:20px; font-size:14.5px; line-height:1.7;">${parsedDesc}</div>`;
            }
        }

        // Single Command
        let commandHtml = '';
        if (!isProcedure && !isDocument && note.command) {
            commandHtml = renderCodeWithGutter(note.command);
        }

        // Document / SOP
        let docHtml = '';
        if (isDocument && note.command) {
            const isWebUrl = note.command.startsWith('http://') || note.command.startsWith('https://');
            const cleanPath = note.command.replace(/^file:\/\/\/?/i, '');
            docHtml = `
                <div class="note-doc-preview" style="background-color:var(--bg-tertiary); padding:16px; border:1px solid var(--border); border-radius:var(--radius-md); display:flex; align-items:center; gap:14px; margin-bottom:20px;">
                    <div style="font-size:28px; flex-shrink:0;">${isWebUrl ? '🌐' : '📄'}</div>
                    <div style="flex:1; min-width:0; word-break:break-all;">
                        <p style="margin:0 0 4px; font-weight:600; font-size:14px; font-family:var(--font-mono); color:var(--text-primary);">${escapeHTML(note.command)}</p>
                        <p style="margin:0; font-size:0.8rem; color:var(--text-tertiary);">${isWebUrl ? 'External Web URL' : 'Local / Network UNC Path'}</p>
                    </div>
                    <div>
                        ${isWebUrl ? `
                            <a href="${escapeHTML(note.command)}" target="_blank" class="btn btn-secondary btn-sm" style="text-decoration:none;">Open Link ↗</a>
                        ` : `
                            <button type="button" class="btn btn-secondary btn-sm copy-path-btn" data-path="${escapeHTML(cleanPath)}">Copy Path</button>
                        `}
                    </div>
                </div>
            `;
        }

        // Procedure Steps (Clean, no checkboxes)
        let stepsHtml = '';
        if (isProcedure && note.steps && note.steps.length > 0) {
            stepsHtml = `
                <div class="procedure-steps-container" style="margin-bottom:20px;">
                    <div class="steps-title" style="font-size:1rem; font-weight:700; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
                        ${ICONS.steps} Procedure Steps (${note.steps.length})
                    </div>
                    ${note.steps.map((step, idx) => {
                        const stepImgs = step.images || [];
                        let stepBlocksHtml = '';
                        if (step.blocks && Array.isArray(step.blocks) && step.blocks.length > 0) {
                            stepBlocksHtml = step.blocks.map(b => {
                                if (b.type === 'command' || b.type === 'code') {
                                    return `<div style="margin-left:30px; margin-bottom:10px;">${renderCodeWithGutter(b.content || b.command || '')}</div>`;
                                } else if (b.type === 'text' || b.type === 'description') {
                                    return `<p style="margin:0 0 10px 30px; font-size:0.88rem; color:var(--text-secondary); line-height:1.55;">${autolink(b.content || b.description || '')}</p>`;
                                } else if (b.type === 'image' && (b.src || b.url)) {
                                    return `<div class="step-image-thumb" data-src="${escapeHTML(b.src || b.url)}" style="margin-left:30px; margin-bottom:10px; max-width:100%; border-radius:6px; overflow:hidden; border:1px solid var(--border);"><img src="${escapeHTML(b.src || b.url)}" style="max-width:100%; max-height:420px; display:block;" /></div>`;
                                }
                                return '';
                            }).join('');
                        }
                        return `
                            <div class="procedure-step-item" style="background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; margin-bottom:12px;">
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                                    <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:var(--accent); color:#fff; border-radius:50%; font-size:0.75rem; font-weight:700; flex-shrink:0;">${idx + 1}</span>
                                    <span style="font-weight:700; font-size:0.95rem; color:var(--text-primary);">
                                        ${escapeHTML(step.title || 'Step ' + (idx + 1))}
                                    </span>
                                </div>
                                ${step.description ? `<p style="margin:0 0 10px 30px; font-size:0.88rem; color:var(--text-secondary); line-height:1.55;">${autolink(step.description)}</p>` : ''}
                                ${step.command ? `
                                    <div style="margin-left:30px; margin-bottom:10px;">
                                        ${renderCodeWithGutter(step.command)}
                                    </div>
                                ` : ''}
                                ${stepBlocksHtml}
                                ${stepImgs.length ? `
                                    <div class="step-images" style="margin-left:30px; margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                                        ${stepImgs.map(img => `
                                            <div class="step-image-thumb" data-src="${escapeHTML(img.url)}" style="width:70px; height:70px; border-radius:4px; overflow:hidden; cursor:pointer; border:1px solid var(--border);">
                                                <img src="${escapeHTML(img.url)}" alt="${escapeHTML(img.name || '')}" style="width:100%; height:100%; object-fit:cover;">
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Attachments
        let imagesHtml = '';
        if (note.images && note.images.length > 0) {
            imagesHtml = `
                <div class="note-inline-images" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
                    ${note.images.map(img => {
                        if (isDocumentUrl(img.url)) {
                            return `<div class="note-image-thumb doc-link" data-src="${escapeHTML(img.url)}" style="width:80px; height:80px; cursor:pointer; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden;">${getDocumentThumb(img.url, img.name || 'Document')}</div>`;
                        }
                        return `
                            <div class="note-inline-image" data-src="${escapeHTML(img.url)}" style="width:80px; height:80px; border-radius:6px; overflow:hidden; cursor:pointer; border:1px solid var(--border);">
                                <img src="${escapeHTML(img.url)}" alt="${escapeHTML(img.name || '')}" style="width:100%; height:100%; object-fit:cover;">
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Reference links
        let refLinksHtml = '';
        if (note.reference_links) {
            try {
                const links = typeof note.reference_links === 'string' ? JSON.parse(note.reference_links) : note.reference_links;
                if (links && links.length > 0) {
                    refLinksHtml = `
                        <div class="note-reference-links" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">
                            ${links.map(l => `<a href="${sanitizeUrl(l)}" target="_blank" rel="noopener noreferrer" style="font-size:0.82rem; background:var(--bg-tertiary); padding:5px 10px; border-radius:4px; color:var(--accent); text-decoration:none; border:1px solid var(--border); display:inline-flex; align-items:center; gap:4px;">🔗 ${escapeHTML(l)}</a>`).join('')}
                        </div>
                    `;
                }
            } catch(e) {}
        }

        return `
            <div class="npp-doc-header">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        ${typeBadge}
                        ${pendingBadge}
                    </div>
                    <h1 class="npp-doc-title">${escapeHTML(note.title)}</h1>
                </div>
                <div class="npp-doc-toolbar">
                    ${canModify ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openWordPressEditor('edit', ${note.id})">${ICONS.edit} Edit</button>` : ''}
                    <a href="api/notes/${note.id}/export" target="_blank" class="btn btn-secondary btn-sm" title="Export as Markdown">${ICONS.copy} Export</a>
                    <a href="/note/${note.id}" target="_blank" class="btn btn-secondary btn-sm" title="Open Full Standalone Page">🔗 Full Page ↗</a>
                </div>
            </div>

            <!-- Minimal Metadata Row -->
            <div class="npp-doc-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px dashed var(--border); font-size: 0.85rem; color: var(--text-secondary);">
                <span>📁 <strong style="color:var(--text-primary);">${escapeHTML(note.category_name || 'General')}</strong></span>
                <span>👤 <strong style="color:var(--text-primary);">${escapeHTML(note.created_by_username || 'Unknown')}</strong></span>
                ${note.team_name ? `<span>👥 <strong style="color:var(--text-primary);">${escapeHTML(note.team_name)}</strong></span>` : ''}
                <span>📅 ${dt}</span>
                ${tags.length ? `<span style="margin-left:auto;">${tagsHtml}</span>` : ''}
            </div>

            ${descHtml}
            ${commandHtml}
            ${docHtml}
            ${stepsHtml}
            ${imagesHtml}
            ${refLinksHtml}
        `;
    }

    // ─── RENDER: NOTE CARDS (GRID/LIST/STACK) ─────────────
    function buildNoteCardHtml(note, isReviewMode, delay) {
        const isProcedure = note.note_type === 'procedure';
        const isDocument = note.note_type === 'document';
        const isPlain = note.note_type === 'plain';
        const isCreator = (currentToken && note.created_by_username === currentUsername);
        const canModify = currentToken && (currentRole === 'admin' || currentRole === 'moderator' || isCreator);

        let typeBadgeClass = 'type-command';
        let typeBadgeIcon = ICONS.copy;
        let typeBadgeText = 'Command';
        if (isProcedure) { typeBadgeClass = 'type-procedure'; typeBadgeIcon = ICONS.steps; typeBadgeText = 'Procedure'; }
        else if (isDocument) { typeBadgeClass = 'type-document'; typeBadgeIcon = ICONS.file_pdf; typeBadgeText = 'DOCS / SOP'; }
        else if (isPlain) { typeBadgeClass = 'type-plain'; typeBadgeIcon = ICONS.copy; typeBadgeText = 'RICH NOTE'; }

        const typeBadge = `<span class="note-type-badge ${typeBadgeClass}">${typeBadgeIcon} ${typeBadgeText}</span>`;

        let pendingBadge = '';
        if (note.is_pinned) {
            pendingBadge += `<span class="note-pending-badge badge-pinned">📌 Pinned</span>`;
        }
        if (note.status === 'draft') {
            pendingBadge += `<span class="note-pending-badge badge-draft">✍️ Draft</span>`;
        } else if (note.approved === -1) {
            pendingBadge += `<span class="note-pending-badge badge-rejected">❌ Rejected</span>`;
        } else if (note.approved === 0) {
            pendingBadge += `<span class="note-pending-badge badge-pending">⏱️ Pending</span>`;
        }

        let favoriteBtn = '';
        let pinBtn = '';
        if (currentToken) {
            const isFav = !!note.is_favorite;
            favoriteBtn = `
                <button type="button" class="btn-icon note-favorite-btn ${isFav ? 'active' : ''}" data-id="${note.id}" title="${isFav ? 'Unfavorite' : 'Favorite'}">
                    <svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </button>
            `;
            if (canModify) {
                const isPinned = !!note.is_pinned;
                pinBtn = `
                    <button type="button" class="btn-icon note-pin-btn ${isPinned ? 'active' : ''}" data-id="${note.id}" title="${isPinned ? 'Unpin Note' : 'Pin to Top'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="17" x2="12" y2="22"></line>
                            <path d="M5 17h14l-1.5-6h-11z"></path>
                            <path d="M9 11V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7"></path>
                        </svg>
                    </button>
                `;
            }
        }

        const exportBtn = `<a href="api/notes/${note.id}/export" target="_blank" class="btn-icon note-export-btn" title="Export as Markdown (.md)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></a>`;
        const fullPageBtn = `<a href="/note/${note.id}" target="_blank" class="btn-icon note-fullpage-btn" title="Open Full Page in New Tab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`;

        const actions = isReviewMode
            ? ''
            : `<div class="note-actions">
                ${pinBtn}
                ${favoriteBtn}
                ${exportBtn}
                ${fullPageBtn}
                ${canModify
                    ? `<button type="button" class="btn-icon note-edit-btn" data-id="${note.id}" title="Edit">${ICONS.edit}</button>
                       <button type="button" class="btn-icon btn-icon-danger note-delete-btn" data-id="${note.id}" title="Delete">${ICONS.trash}</button>`
                    : ''}
               </div>`;

        const tagsHtml = (note.tags || []).map(t => `<span class="note-tag-pill">${escapeHTML(t)}</span>`).join('');
        const categoryBadge = note.category_name
            ? `<span class="note-category-badge">${ICONS.folder} ${escapeHTML(note.category_name)}</span>` : '';
        const teamBadge = note.team_name 
            ? `<span class="note-team-badge" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; background:rgba(var(--accent-rgb, 99, 102, 241), 0.12); color:var(--accent); border:1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.25); border-radius:4px; padding:2px 6px; font-weight:600; margin-right:8px;">👥 ${escapeHTML(note.team_name)}</span>`
            : '';
        const dateStr = note.created_at ? note.created_at.split(' ')[0] : '';
        const dateBadge = dateStr ? `<span class="note-meta-date" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:var(--text-tertiary);">📅 ${escapeHTML(dateStr)}</span>` : '';
        const metaHtml = `
            ${teamBadge}
            <span class="note-meta-user" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; color:var(--text-tertiary);">${ICONS.user} ${escapeHTML(note.created_by_username || 'admin')}</span>
            ${dateBadge}
        `;

        // Card Preview
        let summaryPreviewHtml = '';
        if (isProcedure) {
            const stepCount = (note.step_count !== undefined && note.step_count !== null) ? Number(note.step_count) : (note.steps ? note.steps.length : 1);
            summaryPreviewHtml = `
                ${note.description ? `<p class="note-description" style="color:var(--text-secondary); font-size:0.88rem; line-height:1.5; margin-bottom:8px;">${autolink(note.description)}</p>` : ''}
                <div class="procedure-card-preview" style="background:var(--bg-tertiary); border:1px solid var(--border); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:4px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="background:rgba(16, 185, 129, 0.15); color:#10b981; font-weight:700; font-size:0.75rem; padding:3px 8px; border-radius:6px; border:1px solid rgba(16, 185, 129, 0.3); display:inline-flex; align-items:center; gap:4px;">${ICONS.steps} ${stepCount} Step${stepCount === 1 ? '' : 's'}</span>
                        <span style="font-size:0.84rem; color:var(--text-secondary); font-weight:500;">Runbook Procedure</span>
                    </div>
                    <span style="color:var(--accent); font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:4px;">Open &rarr;</span>
                </div>
            `;
        } else if (isDocument) {
            summaryPreviewHtml = `
                ${note.description ? `<p class="note-description" style="color:var(--text-secondary); font-size:0.88rem; line-height:1.5; margin-bottom:8px;">${autolink(note.description)}</p>` : ''}
                ${note.command ? `<div style="margin-top:6px; font-family:var(--font-mono); font-size:0.82rem; color:var(--text-secondary); background:var(--bg-tertiary); padding:6px 10px; border-radius:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(note.command)}</div>` : ''}
            `;
        } else if (isPlain) {
            let renderedHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.description || '') : escapeHTML(note.description || '');
            summaryPreviewHtml = `<div class="ql-editor markdown-body" style="padding:0.5rem 0 !important; max-height:120px; overflow:hidden; font-size:14px; line-height:1.6;">${renderedHtml || '<p style="color:var(--text-muted); font-style:italic;">Rich documentation note</p>'}</div>`;
        } else {
            // Quick command
            summaryPreviewHtml = `
                ${note.description ? `<p class="note-description" style="color:var(--text-secondary); font-size:0.88rem; line-height:1.5; margin-bottom:8px;">${autolink(note.description)}</p>` : ''}
                ${note.command ? `
                    <div class="note-command-wrapper" style="margin-top:8px;">
                        <div class="note-code-block">
                            <pre class="note-code" style="max-height:85px; overflow:hidden;"><code>${escapeHTML(note.command)}</code></pre>
                            <button type="button" class="note-copy-btn" title="Copy">${ICONS.copy}</button>
                        </div>
                    </div>
                ` : ''}
            `;
        }

        return `
            <div class="note-item note-type-${note.note_type || 'command'}" style="animation-delay:${delay}s;" data-note-id="${note.id}">
                ${actions}
                <div class="note-header">
                    <div class="note-header-badges">
                        ${typeBadge}
                        ${pendingBadge}
                    </div>
                </div>
                <h3 class="note-title" data-note-id="${note.id}">${escapeHTML(note.title)}</h3>

                <div class="note-collapsed-summary">
                    ${summaryPreviewHtml}
                    <div class="note-meta" style="margin-top:10px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        ${categoryBadge}
                        ${tagsHtml ? `<div class="note-tags-row">${tagsHtml}</div>` : ''}
                        ${metaHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // Event delegation is now handled globally on #notes-container in DOMContentLoaded
    function attachNoteCardEventListeners(container, isReviewMode) {
        // Kept for backward compatibility if called from elsewhere, but empty
    }

    let activeNotebookNoteId = null;

    function renderNotebookView(notes) {
        const container = document.getElementById('notes-container');
        if (!container) return;

        if (notes.length === 0 && !activeNotebookNoteId) {
            container.innerHTML = `
                <div class="notebook-canvas-pane">
                    <div class="notion-empty-canvas">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <h3>No notes found</h3>
                    </div>
                </div>
            `;
            return;
        }

        const targetId = activeNotebookNoteId || (notes.length > 0 ? notes[0].id : null);
        if (targetId) {
            loadNotebookNote(targetId);
        }
    }

    async function loadNotebookNote(noteId) {
        activeNotebookNoteId = parseInt(noteId);
        if (currentView !== 'view-notebook') {
            document.querySelectorAll('.view-toggle-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === 'view-notebook');
            });
            const container = document.getElementById('notes-container');
            if (container) {
                container.classList.remove('view-cards', 'view-list', 'view-stack', 'view-notebook');
                container.classList.add('view-notebook');
            }
            currentView = 'view-notebook';
            localStorage.setItem('sn_view_mode', 'view-notebook');
        }

        try {
            const res = await apiFetch(`api/notes/${noteId}`, { headers: authHeaders() });
            if (res && res.ok) {
                const fullNote = await res.json();
                const canvas = document.getElementById('notebook-canvas-pane');
                if (canvas) {
                    canvas.innerHTML = buildNotebookCanvasHtml(fullNote);
                } else {
                    const container = document.getElementById('notes-container');
                    if (container) {
                        container.innerHTML = `
                            <div class="notebook-canvas-pane" id="notebook-canvas-pane">
                                ${buildNotebookCanvasHtml(fullNote)}
                            </div>
                        `;
                    }
                }

                document.querySelectorAll('.quick-access-item').forEach(el => {
                    el.classList.toggle('active', parseInt(el.dataset.id) === parseInt(noteId));
                });
                document.querySelectorAll('.subnote-tree-item').forEach(el => {
                    el.classList.toggle('active', parseInt(el.dataset.noteId) === parseInt(noteId));
                });
            }
        } catch(e) {
            console.error('Error loading note into notebook canvas:', e);
        }
    }
    window.loadNotebookNote = loadNotebookNote;

    async function openNoteDetailModal(noteId) {
        const id = parseInt(noteId);
        if (!id) return;
        
        openModal('note-detail-modal');
        const modalBody = document.getElementById('note-detail-modal-body');
        const titleEl = document.getElementById('note-modal-title');
        const tabLink = document.getElementById('note-modal-tab-link');
        const editBtn = document.getElementById('note-modal-edit-btn');
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="display:flex; justify-content:center; align-items:center; min-height:220px; color:var(--text-secondary); gap:10px;">
                    <div class="spinner" style="width:24px; height:24px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                    <span>Loading note details...</span>
                </div>
            `;
        }
        if (tabLink) {
            tabLink.href = `/note/${id}`;
        }
        if (editBtn) {
            editBtn.style.display = 'none';
            editBtn.onclick = null;
        }

        try {
            const res = await apiFetch(`api/notes/${id}`, { headers: authHeaders() });
            if (!res || !res.ok) {
                if (modalBody) modalBody.innerHTML = `<div style="color:var(--danger); padding:20px;">Failed to load note details.</div>`;
                return;
            }
            const note = await res.json();
            
            if (titleEl) {
                titleEl.textContent = note.title || 'Note Details';
            }
            
            const isCreator = (currentToken && note.created_by_username === currentUsername);
            const canModify = currentToken && (currentRole === 'admin' || currentRole === 'moderator' || isCreator);
            
            if (editBtn && canModify) {
                editBtn.style.display = 'inline-flex';
                editBtn.onclick = () => {
                    closeModal('note-detail-modal');
                    openWordPressEditor('edit', note.id);
                };
            }
            
            let canvasHtml = buildNotebookCanvasHtml(note);
            // Append history container
            canvasHtml += `
                <div id="note-modal-audit-container" style="margin-top:24px;">
                    <div style="font-size:0.85rem; color:var(--text-tertiary);">Loading note history...</div>
                </div>
            `;
            
            if (modalBody) {
                modalBody.innerHTML = canvasHtml;
            }
            
            loadModalNoteAudit(note.id);
            
        } catch(err) {
            console.error('Error opening note modal:', err);
            if (modalBody) modalBody.innerHTML = `<div style="color:var(--danger); padding:20px;">An error occurred while loading note.</div>`;
        }
    }
    window.openNoteDetailModal = openNoteDetailModal;

    async function loadModalNoteAudit(noteId) {
        const container = document.getElementById('note-modal-audit-container');
        if (!container) return;
        
        try {
            const res = await apiFetch(`api/notes/${noteId}/audit`, { headers: authHeaders() });
            if (!res || !res.ok) {
                container.innerHTML = '';
                return;
            }
            const logs = await res.json();
            if (!logs || logs.length === 0) {
                container.innerHTML = `
                    <div class="steps-title" style="margin-bottom:12px; border-top:1px solid var(--border); padding-top:18px; font-weight:600; font-size:0.95rem;">History</div>
                    <div style="font-size:0.82rem; color:var(--text-secondary);">No history recorded for this note.</div>
                `;
                return;
            }
            
            function formatAuditDetails(details, action) {
                if (!details) {
                    if (action === 'APPROVED') return 'Note approved ✅';
                    return '';
                }
                let formatted = details;
                formatted = formatted.replace(/\(?approved=True\)?/gi, '(Approved ✅)');
                formatted = formatted.replace(/\(?approved=False\)?/gi, '(Pending Approval ⏳)');
                formatted = formatted.replace(/\(?Draft\)?/gi, '(Draft 📝)');
                if (action === 'APPROVED' && !formatted.includes('✅')) formatted += ' ✅';
                if (action === 'CREATED' && !formatted.includes('✅') && !formatted.includes('⏳') && !formatted.includes('📝')) formatted += ' 📝';
                if (action === 'DELETED') formatted += ' ❌';
                if (action === 'RESTORED') formatted += ' ↩️';
                return formatted;
            }

            let logHtml = `
                <div class="steps-title" style="margin-bottom:12px; border-top:1px solid var(--border); padding-top:18px; font-weight:600; font-size:0.95rem;">History</div>
                <div style="background:var(--bg-secondary); border-radius:var(--radius-md); border:1px solid var(--border); padding:12px 16px;">
                    <ul style="list-style:none; padding:0; margin:0; font-size:0.82rem; color:var(--text-secondary);">
            `;
            
            logs.forEach(l => {
                const dateStr = new Date(l.timestamp + 'Z').toLocaleString();
                let actionColor = 'var(--text-primary)';
                let actionLabel = l.action;
                if(l.action === 'CREATED') { actionColor = 'var(--success)'; actionLabel = 'CREATED 📝'; }
                if(l.action === 'DELETED') { actionColor = 'var(--danger)'; actionLabel = 'DELETED ❌'; }
                if(l.action === 'APPROVED') { actionColor = 'var(--accent)'; actionLabel = 'APPROVED ✅'; }
                if(l.action === 'RESTORED') { actionColor = 'var(--accent)'; actionLabel = 'RESTORED ↩️'; }
                if(l.action === 'UPDATED') { actionColor = '#f59e0b'; actionLabel = 'UPDATED ✏️'; }
                
                logHtml += `
                    <li style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                        <div>
                            <strong style="color:${actionColor}">${escapeHTML(actionLabel)}</strong> by <strong>${escapeHTML(l.username || 'System')}</strong>
                            <div style="margin-top:2px; font-size:0.78rem; color:var(--text-secondary);">${escapeHTML(formatAuditDetails(l.details || '', l.action))}</div>
                        </div>
                        <div style="font-size:0.75rem; white-space:nowrap; color:var(--text-tertiary);">${dateStr}</div>
                    </li>
                `;
            });
            
            logHtml += `</ul></div>`;
            container.innerHTML = logHtml;
        } catch(e) {
            console.error('Error fetching modal audit log:', e);
        }
    }

    function buildNotebookCanvasHtml(note) {
        if (!note) {
            return `
                <div class="notion-empty-canvas">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <h3>Select a page to view</h3>
                </div>
            `;
        }

        const isProcedure = note.note_type === 'procedure';
        const isPlain = note.note_type === 'plain';
        const isDocument = note.note_type === 'document';
        const isCreator = (currentToken && note.created_by_username === currentUsername);
        const canModify = currentToken && (currentRole === 'admin' || currentRole === 'moderator' || isCreator);
        const isPinned = !!note.is_pinned;
        const isFav = !!note.is_favorite;
        const dt = note.created_at ? new Date(note.created_at).toLocaleString() : 'N/A';
        const steps = Array.isArray(note.steps) ? note.steps : [];
        const tags = Array.isArray(note.tags) ? note.tags : [];
        const images = Array.isArray(note.images) ? note.images : [];

        let badgeType = 'type-command';
        let badgeText = 'Command';
        if (isProcedure) { badgeType = 'type-procedure'; badgeText = 'Procedure'; }
        if (isPlain) { badgeType = 'type-plain'; badgeText = 'Rich Note'; }
        if (isDocument) { badgeType = 'type-document'; badgeText = 'DOCS / SOP'; }

        let pendingBadge = '';
        if (!note.approved) {
            pendingBadge = `<div class="note-type-badge" style="background: rgba(245, 158, 11, 0.15); color: rgb(245, 158, 11); border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 600;">
                ⏱️ Pending Approval
            </div>`;
        }

        const tagsHtml = tags.map(t => `<span class="note-tag-pill">#${escapeHTML(t)}</span>`).join(' ') || '<span style="color:var(--text-tertiary);">None</span>';

        const actionsHtml = `
            <div class="notion-page-actions">
                ${currentToken ? `
                    <button class="btn-icon note-pin-btn ${isPinned ? 'active' : ''}" data-id="${note.id}" title="${isPinned ? 'Unpin Note' : 'Pin to Top'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14l-1.5-6h-11z"></path><path d="M9 11V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7"></path></svg>
                    </button>
                    <button class="btn-icon note-favorite-btn ${isFav ? 'active' : ''}" data-id="${note.id}" title="${isFav ? 'Unfavorite' : 'Favorite'}">
                        <svg class="star-icon" width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                ` : ''}
                <a href="api/notes/${note.id}/export" target="_blank" class="btn btn-secondary btn-sm" title="Export as Markdown (.md)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export .md
                </a>
                <a href="note/${note.id}" target="_blank" class="btn btn-secondary btn-sm" title="Open Full Page in New Tab">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    Full Page
                </a>
                ${canModify ? `
                    <button class="btn btn-primary btn-sm note-edit-btn" data-id="${note.id}" title="Edit Note">
                        ${ICONS.edit} Edit
                    </button>
                ` : ''}
            </div>
        `;

        let descHtml = '';
        if (note.description) {
            if (isPlain) {
                let sanitized = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(note.description) : escapeHTML(note.description);
                descHtml = `<div class="note-description ql-editor markdown-body" style="color:var(--text-primary); white-space:normal; padding:0 !important; min-height:auto; font-size:15px; line-height:1.65;">${sanitized}</div>`;
            } else {
                let parsedDesc = (typeof DOMPurify !== 'undefined' && typeof marked !== 'undefined') ? DOMPurify.sanitize(marked.parse(note.description)) : autolink(note.description);
                descHtml = `<div class="note-description markdown-body" style="white-space:normal; color:var(--text-secondary); font-size:15px; line-height:1.65;">${parsedDesc}</div>`;
            }
        }

        let refLinksHtml = '';
        if (note.reference_links) {
            try {
                const links = typeof note.reference_links === 'string' ? JSON.parse(note.reference_links) : note.reference_links;
                if (links && links.length > 0) {
                    refLinksHtml = '<div class="note-reference-links" style="margin-top:18px; display:flex; flex-wrap:wrap; gap:8px;">' +
                        links.map(l => `<a href="${sanitizeUrl(l)}" target="_blank" rel="noopener noreferrer" style="font-size:0.85rem; background:var(--bg-tertiary); padding:6px 12px; border-radius:6px; color:var(--accent); text-decoration:none; border:1px solid var(--border); display:inline-flex; align-items:center; gap:6px;">🔗 ${escapeHTML(l)}</a>`).join('') +
                        '</div>';
                }
            } catch(e) {}
        }

        // Header Card matching Note Detail Page
        let headerCardHtml = `
            <div class="note-header-card ${isProcedure ? 'is-procedure' : ''}">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div class="note-type-badge ${badgeType}">
                            <span class="dot"></span>
                            ${badgeText}
                        </div>
                        ${pendingBadge}
                    </div>
                    ${actionsHtml}
                </div>
                <h1 class="note-title">${escapeHTML(note.title)}</h1>
                ${descHtml}
                ${refLinksHtml}
            </div>
        `;

        // Bento Note Details Properties Grid
        let bentoHtml = `
            <div class="notion-properties-table" style="margin-bottom: 24px;">
                <div class="notion-prop-item">
                    <span class="notion-prop-label">📁 Category:</span>
                    <span class="notion-prop-value">${escapeHTML(note.category_name || 'Uncategorized')}</span>
                </div>
                <div class="notion-prop-item">
                    <span class="notion-prop-label">👤 Author:</span>
                    <span class="notion-prop-value">${escapeHTML(note.created_by_username || 'Unknown')}</span>
                </div>
                <div class="notion-prop-item">
                    <span class="notion-prop-label">👥 Team:</span>
                    <span class="notion-prop-value">${escapeHTML(note.team_name || 'Global')}</span>
                </div>
                <div class="notion-prop-item">
                    <span class="notion-prop-label">📅 Date:</span>
                    <span class="notion-prop-value">${dt}</span>
                </div>
                <div class="notion-prop-item" style="grid-column: 1 / -1;">
                    <span class="notion-prop-label">🏷️ Tags:</span>
                    <span class="notion-prop-value">${tagsHtml}</span>
                </div>
            </div>
        `;

        // Command Block (Single Command)
        let commandHtml = '';
        if (!isProcedure && !isDocument && note.command) {
            const lang = detectLanguage(note.command);
            commandHtml = `
                <div class="note-command-wrapper" style="margin-bottom:24px;">
                    <div class="note-code-block">
                        <div class="terminal-header">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div class="terminal-dots">
                                    <span class="dot red"></span>
                                    <span class="dot yellow"></span>
                                    <span class="dot green"></span>
                                </div>
                                <span class="terminal-title">${lang}</span>
                            </div>
                        </div>
                        <pre class="note-code"><code>${escapeHTML(note.command)}</code></pre>
                        <button class="note-copy-btn" title="Copy to clipboard">${ICONS.copy}</button>
                    </div>
                </div>
            `;
        }

        // Document Preview (DOCS / SOP)
        let docHtml = '';
        if (isDocument && note.command) {
            const isWebUrl = note.command.startsWith('http://') || note.command.startsWith('https://');
            const cleanPath = note.command.replace(/^file:\/\/\/?/i, '');
            docHtml = `
                <div class="note-images-section" style="margin-bottom:24px;">
                    <div class="steps-title" style="margin-bottom:10px;">${isWebUrl ? 'External Web Link' : 'Local File / Network Share Path'}</div>
                    <div class="note-doc-preview" style="background-color:var(--bg-tertiary); padding:16px; border:1px solid var(--border); border-radius:var(--radius-md); display:flex; align-items:center; gap:14px;">
                        <div class="note-doc-icon" style="flex-shrink:0;">
                            ${isWebUrl ? `
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            ` : `
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            `}
                        </div>
                        <div class="note-doc-details" style="flex:1; word-break:break-all;">
                            <p class="note-doc-name" style="margin:0 0 4px; font-weight:600; font-size:14px; font-family:var(--font-mono); color:var(--text-primary);">${escapeHTML(note.command)}</p>
                            <p style="margin:0; font-size:0.75rem; color:var(--text-tertiary);">${isWebUrl ? 'Click below to open in a new tab' : '💡 Local / UNC file path. Click "Copy Path" below and paste into Windows Explorer or Run (Win+R) to open.'}</p>
                        </div>
                    </div>
                    <div class="note-actions" style="margin-top:12px; display:flex; gap:10px; align-items:center; opacity:1;">
                        ${isWebUrl ? `
                            <a href="${escapeHTML(note.command)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                                🌐 Open Link ↗
                            </a>
                            <button type="button" class="btn btn-secondary btn-sm copy-path-btn" data-path="${escapeHTML(note.command)}">
                                📋 Copy Link
                            </button>
                        ` : `
                            <button type="button" class="btn btn-primary btn-sm copy-path-btn" data-path="${escapeHTML(cleanPath)}">
                                📋 Copy File Path
                            </button>
                        `}
                    </div>
                </div>
            `;
        }

        // Note Attachments & Images
        let imagesHtml = '';
        if (images.length > 0) {
            imagesHtml = `
                <div class="note-images-section" style="margin-bottom:24px;">
                    <div class="steps-title">Attachments</div>
                    <div class="note-images-grid">
                        ${images.map(img => {
                            if (isDocumentUrl(img.url)) {
                                return `<div class="note-image-thumb doc-link" data-src="${escapeHTML(img.url)}" style="cursor:pointer; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden;">${getDocumentThumb(img.url, img.name || 'Document')}</div>`;
                            }
                            return `<div class="note-image-thumb" data-src="${escapeHTML(img.url)}">
                                <img src="${escapeHTML(img.url)}" alt="${escapeHTML(img.name || '')}">
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Procedure Steps Section
        let stepsHtml = '';
        if (isProcedure && steps.length > 0) {
            stepsHtml = `
                <div class="steps-section" style="margin-bottom:24px;">
                    <div class="steps-title">${steps.length} Step${steps.length !== 1 ? 's' : ''}</div>
                    ${steps.map((step, i) => {
                        const stepImgs = step.images || [];
                        return `<div class="step-card" id="step-${i + 1}" style="animation-delay:${i * 0.07}s">
                            <div class="step-header">
                                <span class="step-badge-pill">Step ${i + 1}</span>
                                <div class="step-title" style="margin-left: 10px;">${escapeHTML(step.title || 'Instructions')}</div>
                            </div>
                            <div class="step-body">
                                ${step.blocks && step.blocks.length > 0 ? step.blocks.map(block => {
                                    if (block.type === 'desc') {
                                        return `<p class="step-desc">${autolink(block.content)}</p>`;
                                    } else if (block.type === 'code') {
                                        const lang = detectLanguage(block.content);
                                        return `
                                            <div class="note-command-wrapper" style="margin-bottom: 12px;">
                                                <div class="note-code-block">
                                                    <div class="terminal-header">
                                                        <div style="display: flex; align-items: center; gap: 10px;">
                                                            <div class="terminal-dots">
                                                                <span class="dot red"></span>
                                                                <span class="dot yellow"></span>
                                                                <span class="dot green"></span>
                                                            </div>
                                                            <span class="terminal-title">${lang}</span>
                                                        </div>
                                                    </div>
                                                    <pre class="note-code"><code>${escapeHTML(block.content)}</code></pre>
                                                    <button class="note-copy-btn step-copy-btn" title="Copy to clipboard">${ICONS.copy}</button>
                                                </div>
                                            </div>`;
                                    } else if (block.type === 'image') {
                                        return `
                                            <div class="step-image-block" style="margin-bottom: 12px; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); text-align: center; background: var(--surface);">
                                                <img src="${escapeHTML(block.content)}" alt="Step Image" style="max-width: 100%; max-height: 400px; display: inline-block; cursor: zoom-in;" onclick="openLightbox(this.src)">
                                            </div>`;
                                    }
                                    return '';
                                }).join('') : `
                                    ${step.description ? `<p class="step-desc">${autolink(step.description)}</p>` : ''}
                                    ${step.command ? `
                                        <div class="note-command-wrapper" style="margin-bottom: 12px;">
                                            <div class="note-code-block">
                                                <div class="terminal-header">
                                                    <div style="display: flex; align-items: center; gap: 10px;">
                                                        <div class="terminal-dots">
                                                            <span class="dot red"></span>
                                                            <span class="dot yellow"></span>
                                                            <span class="dot green"></span>
                                                        </div>
                                                        <span class="terminal-title">${detectLanguage(step.command)}</span>
                                                    </div>
                                                </div>
                                                <pre class="note-code"><code>${escapeHTML(step.command)}</code></pre>
                                                <button class="note-copy-btn step-copy-btn" title="Copy to clipboard">${ICONS.copy}</button>
                                            </div>
                                        </div>` : ''}
                                `}
                                ${stepImgs.length ? `
                                    <div class="step-images">
                                        ${stepImgs.map(img => {
                                            if (isDocumentUrl(img.url)) {
                                                return `<div class="step-image-thumb doc-link" data-src="${escapeHTML(img.url)}" style="cursor:pointer; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden;">${getDocumentThumb(img.url, img.name || 'Document')}</div>`;
                                            }
                                            return `<div class="step-image-thumb" data-src="${escapeHTML(img.url)}">
                                                <img src="${escapeHTML(img.url)}" alt="${escapeHTML(img.name || '')}">
                                            </div>`;
                                        }).join('')}
                                    </div>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }

        return `
            ${headerCardHtml}
            ${bentoHtml}
            ${commandHtml}
            ${docHtml}
            ${imagesHtml}
            ${stepsHtml}
        `;
    }

    function renderNotes(notes, append = false) {
        const container = document.getElementById('notes-container');
        const emptyState = document.getElementById('empty-state');
        if (isAdminPageOpen) return;
        if (isNppWorkspaceOpen) {
            container.style.display = 'none';
            container.classList.add('is-hidden');
            return;
        }

        const safeNotes = Array.isArray(notes) ? notes : [];

        if (!append && safeNotes.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            const trigger = document.getElementById('scroll-trigger');
            if (trigger) trigger.style.display = 'none';
            return;
        }
        emptyState.style.display = 'none';

        if (currentView === 'view-notebook') {
            renderNotebookView(safeNotes);
            return;
        }

        let html = '';
        safeNotes.forEach((note, idx) => {
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
    
    function extractCodeFromBlock(container) {
        if (!container) return '';
        const nppCode = container.querySelector('.npp-code-content code, .npp-code-content');
        if (nppCode) return nppCode.textContent || '';

        const noteCode = container.querySelector('.note-code code, .note-code, .procedure-step-code-content code, .procedure-step-code-content');
        if (noteCode) return noteCode.textContent || '';

        const codeEl = container.querySelector('code:not(.npp-code-gutter *):not(.procedure-step-gutter *)');
        if (codeEl) return codeEl.textContent || '';

        const preEl = container.querySelector('pre:not(.npp-code-gutter):not(.procedure-step-gutter)');
        if (preEl) return preEl.textContent || '';

        const fallback = container.querySelector('code');
        return fallback ? fallback.textContent || '' : '';
    }

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
        window.closeAllCustomSelects(null, true);
        document.body.classList.add('in-editor');
        if (window.setupCategoryCarouselDots) window.setupCategoryCarouselDots();
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
        window.closeAllCustomSelects(null, true);
        document.body.classList.remove('in-editor');
        document.getElementById('editor-page').style.display = 'none';
        if (autosaveTimer) clearTimeout(autosaveTimer);
        refreshAll();
    }
    window.openWordPressEditor = openWordPressEditor;
    window.closeWordPressEditor = closeWordPressEditor;

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
                        <div class="revision-item" data-rev-id="${r.id}" data-note-id="${r.note_id}" style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid var(--border);">
                            <div>
                                <div class="revision-meta">${escapeHTML(dt)}</div>
                                <div class="revision-meta" style="font-size:0.75rem;">by <span class="revision-author">${escapeHTML(r.created_by_username || 'Unknown')}</span></div>
                            </div>
                            <div style="display:flex; gap:4px;">
                                <button type="button" class="btn btn-secondary btn-sm rev-diff-btn" data-rev-id="${r.id}" data-note-id="${r.note_id}" style="padding:2px 6px; font-size:0.7rem;">Diff</button>
                                <button type="button" class="btn btn-primary btn-sm rev-restore-btn" data-rev-id="${r.id}" data-note-id="${r.note_id}" style="padding:2px 6px; font-size:0.7rem;">Restore</button>
                            </div>
                        </div>
                    `;
                }).join('');

                list.querySelectorAll('.rev-restore-btn').forEach(btn => {
                    btn.onclick = (e) => { e.stopPropagation(); restoreEditorRevision(btn.dataset.noteId, btn.dataset.revId); };
                });
                list.querySelectorAll('.rev-diff-btn').forEach(btn => {
                    btn.onclick = (e) => { e.stopPropagation(); showRevisionDiff(btn.dataset.noteId, btn.dataset.revId); };
                });
            }
        } catch(e) {
            console.error("Failed to fetch revisions", e);
        }
    }

    async function showRevisionDiff(noteId, revId) {
        try {
            const [noteRes, revRes] = await Promise.all([
                apiFetch(`api/notes/${noteId}`, { headers: authHeaders() }),
                apiFetch(`api/notes/${noteId}/revisions`, { headers: authHeaders() })
            ]);
            if (!noteRes || !noteRes.ok || !revRes || !revRes.ok) return;
            
            const currentNote = await noteRes.json();
            const revisions = await revRes.json();
            const targetRev = revisions.find(r => r.id === parseInt(revId));
            if (!targetRev) return;

            const dt = new Date(targetRev.created_at).toLocaleString();
            document.getElementById('diff-meta-header').innerHTML = `Comparing current version of <strong>${escapeHTML(currentNote.title)}</strong> against revision from <strong>${escapeHTML(dt)}</strong> by <strong>${escapeHTML(targetRev.created_by_username || 'Unknown')}</strong>:`;
            
            const currentLines = (currentNote.command || currentNote.description || '').split('\n');
            const revLines = (targetRev.command || targetRev.description || '').split('\n');
            
            let diffHtml = '';
            const maxLen = Math.max(currentLines.length, revLines.length);
            for (let i = 0; i < maxLen; i++) {
                const cur = currentLines[i];
                const rev = revLines[i];
                if (cur === rev) {
                    if (cur !== undefined) diffHtml += `<div style="padding:2px 8px; color:var(--text-secondary);">  ${escapeHTML(cur)}</div>`;
                } else {
                    if (rev !== undefined) diffHtml += `<div style="padding:2px 8px; background:rgba(239, 68, 68, 0.15); color:#f87171; border-left:3px solid #f87171;">- ${escapeHTML(rev)}</div>`;
                    if (cur !== undefined) diffHtml += `<div style="padding:2px 8px; background:rgba(16, 185, 129, 0.15); color:#10b981; border-left:3px solid #10b981;">+ ${escapeHTML(cur)}</div>`;
                }
            }
            if (!diffHtml) diffHtml = '<div style="padding:10px; color:var(--text-tertiary);">No text differences found.</div>';

            document.getElementById('diff-content-container').innerHTML = diffHtml;
            document.getElementById('diff-restore-btn').onclick = () => {
                closeModal('revision-diff-modal');
                restoreEditorRevision(noteId, revId);
            };
            openModal('revision-diff-modal');
        } catch(e) {
            console.error('Error computing diff', e);
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
                        <a href="${sanitizeUrl(link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Open External SOP Link</a>
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
        showToast('Note deleted.');
        closeNppTab(noteId);
        refreshAll();
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

        const parentSelect = document.getElementById('ap-category-parent');
        if (parentSelect) {
            let opts = '<option value="">None (Root Category)</option>';
            const rootCats = categories.filter(c => !c.parent_id);
            rootCats.forEach(rc => {
                opts += `<option value="${rc.id}">📁 ${escapeHTML(rc.name)}</option>`;
            });
            parentSelect.innerHTML = opts;
        }

        const teamSelect = document.getElementById('ap-category-team');
        if (teamSelect && allTeams.length > 0 && teamSelect.options.length <= 1) {
            let catTeamOpts = '<option value="">🌐 Global (All Teams)</option>';
            allTeams.forEach(t => {
                catTeamOpts += `<option value="${t.id}">👥 ${escapeHTML(t.name)}</option>`;
            });
            teamSelect.innerHTML = catTeamOpts;
        }

        const catMap = new Map();
        categories.forEach(c => catMap.set(c.id, c.name));

        let html = '';
        categories.forEach((cat, index) => {
            let displayName = `<strong>${escapeHTML(cat.name)}</strong>`;
            if (cat.parent_id && catMap.has(cat.parent_id)) {
                displayName = `<span style="color:var(--text-tertiary); font-size:0.8rem; padding-left:14px;">└─ ${escapeHTML(catMap.get(cat.parent_id))} &gt; </span> <strong>${escapeHTML(cat.name)}</strong> <span class="badge badge-info" style="font-size:0.7rem; padding:1px 5px; margin-left:4px;">Subcategory</span>`;
            } else if (!cat.parent_id && categories.some(c => c.parent_id === cat.id)) {
                displayName = `<strong>${escapeHTML(cat.name)}</strong> <span class="badge badge-primary" style="font-size:0.7rem; padding:1px 5px; margin-left:4px;">Parent</span>`;
            }

            const teamBadge = cat.team_id 
                ? `<span class="badge" style="background:rgba(99,102,241,0.15); color:var(--accent); font-size:0.72rem; border:1px solid rgba(99,102,241,0.3); padding:2px 7px; border-radius:4px; font-weight:600;">👥 ${escapeHTML(cat.team_name || 'Team #' + cat.team_id)}</span>`
                : `<span class="badge" style="background:rgba(100,116,139,0.15); color:var(--text-tertiary); font-size:0.72rem; padding:2px 7px; border-radius:4px;">🌐 Global</span>`;

            html += `
                <tr class="cat-drag-row" draggable="true" data-cat-id="${cat.id}" data-parent-id="${cat.parent_id || ''}" data-index="${index}">
                    <td style="width: 36px; text-align: center; cursor: grab;">
                        <span class="cat-drag-handle" title="Drag to reorder or nest">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="5" r="1"></circle>
                                <circle cx="9" cy="12" r="1"></circle>
                                <circle cx="9" cy="19" r="1"></circle>
                                <circle cx="15" cy="5" r="1"></circle>
                                <circle cx="15" cy="12" r="1"></circle>
                                <circle cx="15" cy="19" r="1"></circle>
                            </svg>
                        </span>
                    </td>
                    <td>${displayName}</td>
                    <td>${teamBadge}</td>
                    <td>${cat.note_count || 0}</td>
                    <td><label class="toggle-switch">
                        <input type="checkbox" ${cat.enabled ? 'checked' : ''} data-cat-id="${cat.id}" class="cat-toggle-input">
                        <span class="toggle-slider"></span>
                    </label></td>
                    <td><button class="btn-icon btn-icon-danger cat-delete-btn" data-cat-id="${cat.id}">${ICONS.trash}</button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

        setupCategoryDragAndDrop(tbody, categories);

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

    let draggedCatRow = null;

    function setupCategoryDragAndDrop(tbody, categories) {
        const rows = tbody.querySelectorAll('.cat-drag-row');
        
        rows.forEach(row => {
            row.addEventListener('dragstart', (e) => {
                draggedCatRow = row;
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', row.dataset.catId);
            });

            row.addEventListener('dragend', () => {
                row.classList.remove('dragging');
                rows.forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest'));
                draggedCatRow = null;
            });

            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!draggedCatRow || draggedCatRow === row) return;

                const rect = row.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const height = rect.height;

                rows.forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest'));

                if (offsetY < height * 0.3) {
                    row.classList.add('drag-over-top');
                } else if (offsetY > height * 0.7) {
                    row.classList.add('drag-over-bottom');
                } else {
                    row.classList.add('drag-over-nest');
                }
            });

            row.addEventListener('dragleave', () => {
                row.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest');
            });

            row.addEventListener('drop', async (e) => {
                e.preventDefault();
                if (!draggedCatRow || draggedCatRow === row) return;

                const draggedId = parseInt(draggedCatRow.dataset.catId);
                const targetId = parseInt(row.dataset.catId);

                const isNest = row.classList.contains('drag-over-nest');
                const isTop = row.classList.contains('drag-over-top');

                row.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-nest');

                // Compute updated category order & parents
                const updatedList = Array.from(categories);
                const draggedItemIndex = updatedList.findIndex(c => c.id === draggedId);
                if (draggedItemIndex === -1) return;
                const [draggedItem] = updatedList.splice(draggedItemIndex, 1);

                if (isNest) {
                    // Nest draggedItem under targetId
                    draggedItem.parent_id = targetId;
                    const targetIndex = updatedList.findIndex(c => c.id === targetId);
                    updatedList.splice(targetIndex + 1, 0, draggedItem);
                } else {
                    const targetIndex = updatedList.findIndex(c => c.id === targetId);
                    const targetItem = updatedList[targetIndex];
                    draggedItem.parent_id = targetItem ? targetItem.parent_id : null;
                    const insertPos = isTop ? targetIndex : targetIndex + 1;
                    updatedList.splice(insertPos, 0, draggedItem);
                }

                // Prepare payload for /api/categories/reorder
                const payload = updatedList.map((cat, idx) => ({
                    id: cat.id,
                    sort_order: idx,
                    parent_id: cat.parent_id || null
                }));

                try {
                    const res = await apiFetch('api/categories/reorder', {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify(payload)
                    });
                    if (res && res.ok) {
                        showToast('Categories reordered!');
                        loadAdminCategories();
                        fetchCategories();
                    } else {
                        showToast('Failed to save category order', true);
                        loadAdminCategories();
                    }
                } catch(err) {
                    console.error('Error reordering categories', err);
                    showToast('Failed to save category order', true);
                    loadAdminCategories();
                }
            });
        });
    }

    async function handleCreateCategory(e) {
        e.preventDefault();
        const nameInput = document.getElementById('ap-category-name');
        const parentSelect = document.getElementById('ap-category-parent');
        const teamSelect = document.getElementById('ap-category-team');
        const name = nameInput ? nameInput.value.trim() : '';
        const parent_id = parentSelect && parentSelect.value ? parseInt(parentSelect.value) : null;
        const team_id = teamSelect && teamSelect.value ? parseInt(teamSelect.value) : null;
        if (!name) return;

        const res = await apiFetch('api/categories', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name, parent_id, team_id })
        });
        if (!res) return;
        if (!res.ok) { const err = await res.json().catch(() => ({})); showToast(err.message || 'Failed to create category', true); return; }
        if (nameInput) nameInput.value = '';
        if (parentSelect) parentSelect.value = '';
        if (teamSelect) teamSelect.value = '';
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
            const teamPills = (u.teams || []).map(t => `
                <span style="display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 6px; background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); font-size: 0.75rem; font-weight: 500; white-space: nowrap;">
                    ${escapeHTML(t.name)}
                </span>
            `).join('');

            html += `<tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">${escapeHTML(u.username)}</span>
                        ${isSelf ? '<span style="color: var(--accent); font-weight: 600; font-size: 0.72rem; padding: 1px 6px; border-radius: 10px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25);">(you)</span>' : ''}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;">
                        <span class="status-badge ${u.role === 'admin' ? 'enabled' : (u.role === 'moderator' ? 'moderator' : 'disabled')}">${escapeHTML(u.role)}</span>
                        <span class="status-badge" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); font-size: 0.7rem;">${isAD ? 'AD' : 'Local'}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.78rem; font-weight: 600;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            ${u.published_note_count || 0} published
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: 500;">
                            (${u.total_note_count || 0} total)
                        </span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px;">
                        ${teamPills || '<span style="color:var(--text-tertiary); font-size:0.78rem;">No Team</span>'}
                        <button class="edit-user-teams-btn" data-user-id="${u.id}" data-username="${escapeHTML(u.username)}" data-teams='${JSON.stringify((u.teams || []).map(t=>t.id))}' title="Edit Teams" style="padding: 3px 8px; font-size: 0.72rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                        </button>
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${!isSelf ? `
                        <select class="user-role-select" data-user-id="${u.id}" data-current-role="${u.role}" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size: 0.78rem; font-weight: 500;">
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
                        refreshAll();
                    } else {
                        showToast('Failed to approve', true);
                    }
                };
                
                document.getElementById('pending-review-reject-btn').onclick = async () => {
                    const reason = prompt('Please enter a reason for rejecting this note (optional):', 'Note does not meet guidelines');
                    if (reason === null) return;
                    const res = await apiFetch(`api/notes/${note.id}/reject`, {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify({ reason: reason })
                    });
                    if (res && res.ok) {
                        showToast('Note marked as Rejected!');
                        closeModal('pending-review-modal');
                        loadPendingNotes();
                        refreshAll();
                    } else {
                        showToast('Failed to reject note', true);
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

    let systemStatusTimer = null;

    function getGaugeColor(percent) {
        if (percent < 60) return '#10b981'; // Green
        if (percent < 85) return '#f59e0b'; // Orange/Yellow
        return '#ef4444'; // Red
    }

    async function fetchSystemStatus(force = false) {
        if (currentRole !== 'admin') return;
        try {
            const url = force ? 'api/admin/system-status?force=true' : 'api/admin/system-status';
            const res = await apiFetch(url, { headers: authHeaders() });
            if (!res || !res.ok) return;
            const data = await res.json();
            
            // Server Metrics
            const s = data.server || {};
            const cpuVal = s.cpu_percent || 0.0;
            const cpuEl = document.getElementById('gauge-cpu');
            document.getElementById('gauge-cpu-text').textContent = cpuVal.toFixed(1) + '%';
            cpuEl.style.strokeDashoffset = 182.2 - (cpuVal / 100) * 182.2;
            cpuEl.setAttribute('stroke', getGaugeColor(cpuVal));
            
            const memVal = s.memory_percent || 0.0;
            const memEl = document.getElementById('gauge-mem');
            document.getElementById('gauge-mem-text').textContent = memVal.toFixed(0) + '%';
            memEl.style.strokeDashoffset = 182.2 - (memVal / 100) * 182.2;
            memEl.setAttribute('stroke', getGaugeColor(memVal));
            document.getElementById('text-metric-mem').textContent = `${s.memory_used_mb || 0} MB / ${s.memory_total_mb || 0} MB`;
            
            const diskVal = s.disk_percent || 0.0;
            const diskEl = document.getElementById('gauge-disk');
            document.getElementById('gauge-disk-text').textContent = diskVal.toFixed(0) + '%';
            diskEl.style.strokeDashoffset = 182.2 - (diskVal / 100) * 182.2;
            diskEl.setAttribute('stroke', getGaugeColor(diskVal));
            document.getElementById('text-metric-disk').textContent = `${s.disk_used_gb || 0.0} GB / ${s.disk_total_gb || 0.0} GB`;
            
            // Format uptime
            document.getElementById('metric-uptime').textContent = formatDuration(s.uptime_seconds || 0);
            
            // Database spec
            const db = data.database || {};
            const sizeMB = (db.size_bytes / (1024 * 1024)).toFixed(2);
            document.getElementById('db-metric-size').textContent = `${sizeMB} MB`;
            document.getElementById('db-metric-version').textContent = db.sqlite_version || '--';
            document.getElementById('db-metric-journal').textContent = (db.journal_mode || '--').toUpperCase();
            
            const integrityEl = document.getElementById('db-metric-integrity');
            integrityEl.textContent = (db.integrity || '--').toUpperCase();
            if (db.integrity === 'ok') {
                integrityEl.style.color = '#10b981';
            } else {
                integrityEl.style.color = '#ef4444';
            }
            
            // Cache specs
            const cache = data.cache || {};
            document.getElementById('cache-metric-keys').textContent = cache.size || '0';
            document.getElementById('cache-metric-hits').textContent = cache.hits || '0';
            document.getElementById('cache-metric-misses').textContent = cache.misses || '0';
            
            // Live Sessions list
            const sessions = data.active_sessions || [];
            const sessionsBody = document.getElementById('live-sessions-table-body');
            if (sessions.length === 0) {
                sessionsBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-tertiary); padding: 15px;">No active sessions found.</td></tr>`;
            } else {
                let html = '';
                sessions.forEach(sess => {
                    const localTime = formatUTCTimeString(sess.last_active);
                    html += `<tr>
                        <td style="font-weight: 500;">${escapeHTML(sess.username)}</td>
                        <td><span class="badge badge-info">${escapeHTML(sess.role)}</span></td>
                        <td>${localTime}</td>
                    </tr>`;
                });
                sessionsBody.innerHTML = html;
            }
        } catch (e) {
            console.error('Failed to fetch system status:', e);
        }
    }

    function startSystemStatusPolling() {
        if (systemStatusTimer) clearInterval(systemStatusTimer);
        if (currentRole !== 'admin' || !isAdminPageOpen) return;
        
        fetchSystemStatus(); // Run once immediately
        
        const btnCheckNow = document.getElementById('btn-check-integrity-now');
        if (btnCheckNow && !btnCheckNow.dataset.bound) {
            btnCheckNow.dataset.bound = 'true';
            btnCheckNow.addEventListener('click', async () => {
                btnCheckNow.disabled = true;
                btnCheckNow.textContent = 'Checking...';
                await fetchSystemStatus(true);
                btnCheckNow.disabled = false;
                btnCheckNow.textContent = 'Check Now';
                showToast('Live database integrity check complete!');
            });
        }

        systemStatusTimer = setInterval(() => {
            const activeTab = document.querySelector('.admin-page-tab.active');
            if (isAdminPageOpen && activeTab && activeTab.dataset.tab === 'ap-settings-tab') {
                fetchSystemStatus();
            } else {
                stopSystemStatusPolling();
            }
        }, 10000);
    }

    function stopSystemStatusPolling() {
        if (systemStatusTimer) {
            clearInterval(systemStatusTimer);
            systemStatusTimer = null;
        }
    }
    window.stopSystemStatusPolling = stopSystemStatusPolling;

    function formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ${minutes % 60}m`;
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }

    function formatUTCTimeString(utcStr) {
        if (!utcStr) return '--';
        try {
            const dateStr = utcStr.replace(' ', 'T') + 'Z';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return utcStr;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString();
        } catch {
            return utcStr;
        }
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

        if (currentRole === 'admin') {
            document.getElementById('admin-status-dashboard').style.display = 'block';
            startSystemStatusPolling();
        } else {
            document.getElementById('admin-status-dashboard').style.display = 'none';
        }
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
        try {
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
                try {
                    const elAdd = document.getElementById('add-note-plain');
                    if (elAdd) quillAdd = new Quill(elAdd, quillOptions);
                    const elEdit = document.getElementById('edit-note-plain');
                    if (elEdit) quillEdit = new Quill(elEdit, quillOptions);
                    const elEditor = document.getElementById('editor-plain-quill-container');
                    if (elEditor) quillEditor = new Quill(elEditor, quillOptions);
                } catch (qErr) {
                    console.warn('Quill initialization warning:', qErr);
                }
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
        } catch (initErr) {
            console.error('DOMContentLoaded init error:', initErr);
        }

        // Category Carousel Scroll Buttons
        const catGrid = document.getElementById('category-cards-grid');
        const btnLeft = document.getElementById('category-scroll-left');
        const btnRight = document.getElementById('category-scroll-right');
        if (catGrid && btnLeft && btnRight) {
            btnLeft.addEventListener('click', () => {
                catGrid.scrollBy({ left: -300, behavior: 'smooth' });
            });
            btnRight.addEventListener('click', () => {
                catGrid.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }

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
        
        const clearSearchBtn = document.getElementById('search-clear-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                const sInput = document.getElementById('search-input');
                if (sInput) sInput.value = '';
                clearSearchBtn.style.display = 'none';
                fetchNotes();
            });
        }

        const searchCatSelect = document.getElementById('search-category-select');
        if (searchCatSelect) {
            searchCatSelect.addEventListener('change', () => {
                const val = searchCatSelect.value;
                activeCategory = val || null;
                const cat = allCategories.find(c => c.id == val);
                activeCategoryName = cat ? cat.name : '';
                updateFilterIndicator();
                fetchNotes();
                renderSidebarCategories(allCategories);
                updateSidebarFavoritesUI();
            });
        }

        // Filter clear
        document.getElementById('filter-clear-btn').addEventListener('click', clearFilter);

        // Auth
        document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
        
        // Combined User Menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleUserMenu();
            });
        }
        const dropAdminBtn = document.getElementById('dropdown-admin-btn');
        if (dropAdminBtn) {
            dropAdminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeUserMenu();
                openAdminPage();
            });
        }
        const dropMyNotesBtn = document.getElementById('dropdown-mynotes-btn');
        if (dropMyNotesBtn) {
            dropMyNotesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeUserMenu();
                showMyNotes();
            });
        }
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu-container')) {
                closeUserMenu();
            }
        });

        // Notes
        const notesContainer = document.getElementById('notes-container');
        if (notesContainer) {
            notesContainer.addEventListener('click', (e) => {
                // Copy Code (Command or Step)
                const copyBtn = e.target.closest('.note-copy-btn, .step-copy-btn');
                if (copyBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const block = copyBtn.closest('.npp-code-container, .note-code-block, .procedure-step-code-block, .procedure-step-body');
                    const code = extractCodeFromBlock(block);
                    if (code) copyToClipboard(code, copyBtn);
                    return;
                }
                
                // Copy Path (UNC / Local)
                const copyPathBtn = e.target.closest('.copy-path-btn');
                if (copyPathBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(copyPathBtn.dataset.path, copyPathBtn);
                    return;
                }

                // Toggle Favorite
                const favBtn = e.target.closest('.note-favorite-btn');
                if (favBtn) {
                    e.stopPropagation();
                    toggleNoteFavorite(favBtn.dataset.id, favBtn);
                    return;
                }

                // Toggle Pin Note
                const pinBtn = e.target.closest('.note-pin-btn');
                if (pinBtn) {
                    e.stopPropagation();
                    toggleNotePin(pinBtn.dataset.id, pinBtn);
                    return;
                }

                // Edit Note
                const editBtn = e.target.closest('.note-edit-btn');
                if (editBtn) {
                    e.stopPropagation();
                    openWordPressEditor('edit', editBtn.dataset.id);
                    return;
                }

                // Delete Note
                const delBtn = e.target.closest('.note-delete-btn');
                if (delBtn) {
                    e.stopPropagation();
                    deleteNote(delBtn.dataset.id);
                    return;
                }

                // Inline Image Lightbox
                const inlineImg = e.target.closest('.note-inline-image, .step-image-thumb');
                if (inlineImg) {
                    e.stopPropagation();
                    openLightbox(inlineImg.dataset.src);
                    return;
                }
                
                const stepImg = e.target.closest('.procedure-step-image');
                if (stepImg) {
                    e.stopPropagation();
                    openLightbox(stepImg.dataset.src);
                    return;
                }

                // Full page / external links
                if (e.target.closest('.note-fullpage-btn, .note-export-btn, .note-reference-links a, a[target="_blank"]')) {
                    e.stopPropagation();
                    return;
                }

                // Note Title or Card click -> Open in Notepad++ Tabbed Workspace
                const titleLink = e.target.closest('.note-title, .note-title-link');
                if (titleLink) {
                    e.preventDefault();
                    e.stopPropagation();
                    const noteCard = titleLink.closest('.note-item');
                    const noteId = parseInt(titleLink.dataset.noteId || (noteCard ? noteCard.dataset.noteId : 0));
                    if (noteId) {
                        if (currentView === 'view-notebook') {
                            loadNotebookNote(noteId);
                        } else {
                            openNoteInNppTab(noteId);
                        }
                    }
                    return;
                }

                // Card body click
                const noteCard = e.target.closest('.note-item');
                if (noteCard && noteCard.dataset.noteId) {
                    if (e.target.closest('button, a, input, select, textarea, .note-inline-image, .doc-link, .step-image-thumb')) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    const noteId = parseInt(noteCard.dataset.noteId);
                    if (currentView === 'view-notebook') {
                        loadNotebookNote(noteId);
                    } else {
                        openNoteInNppTab(noteId);
                    }
                    return;
                }
            });
        }

        // Notepad++ Document Body Click Delegation
        const nppDocBody = document.getElementById('npp-document-body');
        if (nppDocBody) {
            nppDocBody.addEventListener('click', (e) => {
                // Copy Code (Command or Step)
                const copyBtn = e.target.closest('.note-copy-btn, .step-copy-btn');
                if (copyBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const container = copyBtn.closest('.npp-code-container, .note-code-block, .procedure-step-code-block, .procedure-step-body');
                    const code = extractCodeFromBlock(container);
                    if (code) copyToClipboard(code, copyBtn);
                    return;
                }

                // Copy UNC Path
                const copyPathBtn = e.target.closest('.copy-path-btn');
                if (copyPathBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(copyPathBtn.dataset.path, copyPathBtn);
                    return;
                }

                // Image Lightbox
                const imgThumb = e.target.closest('.note-inline-image, .step-image-thumb');
                if (imgThumb && imgThumb.dataset.src) {
                    e.stopPropagation();
                    openLightbox(imgThumb.dataset.src);
                    return;
                }
            });
        }

        // Note Detail Reader Modal Body Click Delegation
        const modalNoteBody = document.getElementById('note-detail-modal-body');
        if (modalNoteBody) {
            modalNoteBody.addEventListener('click', (e) => {
                // Copy Code (Command or Step)
                const copyBtn = e.target.closest('.note-copy-btn, .step-copy-btn');
                if (copyBtn) {
                    const block = copyBtn.closest('.npp-code-container, .note-code-block, .procedure-step-code-block, .procedure-step-body');
                    const code = extractCodeFromBlock(block);
                    if (code) copyToClipboard(code, copyBtn);
                    return;
                }
                
                // Copy UNC / Local Path
                const copyPathBtn = e.target.closest('.copy-path-btn');
                if (copyPathBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(copyPathBtn.dataset.path, copyPathBtn);
                    return;
                }

                // Toggle Favorite
                const favBtn = e.target.closest('.note-favorite-btn');
                if (favBtn) {
                    e.stopPropagation();
                    toggleNoteFavorite(favBtn.dataset.id, favBtn);
                    return;
                }

                // Toggle Pin Note
                const pinBtn = e.target.closest('.note-pin-btn');
                if (pinBtn) {
                    e.stopPropagation();
                    toggleNotePin(pinBtn.dataset.id, pinBtn);
                    return;
                }

                // Edit Note
                const editBtn = e.target.closest('.note-edit-btn');
                if (editBtn) {
                    closeModal('note-detail-modal');
                    openWordPressEditor('edit', editBtn.dataset.id);
                    return;
                }

                // Inline Image Lightbox
                const inlineImg = e.target.closest('.note-inline-image, .step-image-thumb');
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
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) adminBtn.addEventListener('click', openAdminPage);
        const adminBackBtn = document.getElementById('admin-back-btn');
        if (adminBackBtn) adminBackBtn.addEventListener('click', closeAdminPage);

        // Clear Cache Button
        const clearCacheBtn = document.getElementById('ap-clear-cache-btn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear frontend cache and reload?')) {
                    location.reload(true);
                }
            });
        }

        // Flush Server Cache Button
        const flushCacheBtn = document.getElementById('ap-flush-cache-btn');
        if (flushCacheBtn) {
            flushCacheBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to flush the backend system cache?')) {
                    const res = await apiFetch('api/admin/flush-cache', {
                        method: 'POST',
                        headers: authHeaders()
                    });
                    if (res && res.ok) {
                        showToast('Server cache flushed!');
                        fetchSystemStatus();
                    } else {
                        showToast('Failed to flush cache', true);
                    }
                }
            });
        }

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
            if (currentView === 'view-notebook' && !isInputFocused()) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const items = Array.from(document.querySelectorAll('.notebook-list-item'));
                    if (items.length > 0) {
                        const activeIdx = items.findIndex(it => it.classList.contains('active'));
                        let nextIdx = 0;
                        if (e.key === 'ArrowDown') {
                            nextIdx = (activeIdx + 1) % items.length;
                        } else {
                            nextIdx = (activeIdx - 1 + items.length) % items.length;
                        }
                        items[nextIdx].click();
                        items[nextIdx].scrollIntoView({ block: 'nearest' });
                    }
                }
            }
            if (e.key === 'Escape') {
                const lightboxes = document.querySelectorAll('.img-lightbox-overlay');
                if (lightboxes.length > 0) {
                    lightboxes.forEach(el => el.remove());
                    return;
                }
                const openModals = Array.from(document.querySelectorAll('.modal-overlay')).filter(m => m.style.display && m.style.display !== 'none');
                if (openModals.length > 0) {
                    const topModal = openModals[openModals.length - 1];
                    closeModal(topModal.id);
                    return;
                }
                if (isAdminPageOpen) {
                    closeAdminPage();
                    return;
                }
                const sidebar = document.getElementById('sidebar');
                if (sidebar && sidebar.classList.contains('open')) {
                    closeSidebar();
                    return;
                }
                if (isNppWorkspaceOpen && !isInputFocused()) {
                    toggleNppWorkspace(false);
                }
            }
            // Notepad++ shortcuts: Ctrl+W, Alt+W, Ctrl+F4 to close active tab; Ctrl+Tab to cycle tabs
            if (isNppWorkspaceOpen && (
                ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') ||
                (e.altKey && e.key.toLowerCase() === 'w') ||
                (e.ctrlKey && e.key === 'F4')
            )) {
                if (!isInputFocused() && nppActiveTabId) {
                    e.preventDefault();
                    closeNppTab(nppActiveTabId);
                }
            }
            if (isNppWorkspaceOpen && e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                if (nppOpenTabs.length > 1) {
                    const currentIdx = nppOpenTabs.findIndex(t => t.id === nppActiveTabId);
                    const nextIdx = (currentIdx + (e.shiftKey ? -1 : 1) + nppOpenTabs.length) % nppOpenTabs.length;
                    switchNppTab(nppOpenTabs[nextIdx].id);
                }
            }
        });

        // Notepad++ Tab Strip Mouse Wheel Horizontal Scrolling
        const nppTabsScrollEl = document.getElementById('npp-tabs-list');
        if (nppTabsScrollEl) {
            nppTabsScrollEl.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    nppTabsScrollEl.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }

        // Initialize custom select styling
        initCustomSelects();

        // Close custom select dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select-wrapper') && !e.target.closest('.custom-select-options')) {
                window.closeAllCustomSelects(e, true);
            }
        });
    });

    // Auto-refresh polling with Page Visibility optimization
    let lastUpdateTimestamp = "";
    let pollingInterval = null;

    async function checkLastUpdate() {
        if (document.hidden) return;
        try {
            const res = await fetch('api/last_updated');
            if (res.ok) {
                const data = await res.json();
                if (lastUpdateTimestamp && data.last_update && data.last_update !== lastUpdateTimestamp) {
                    const anyModalOpen = Array.from(document.querySelectorAll('.modal-overlay')).some(m => m.style.display !== 'none');
                    if (!anyModalOpen) {
                        fetchNotes();
                        fetchCategories();
                        fetchStats();
                        updatePendingCount();
                        updateDraftCount();
                        updateMyNotesCount();
                        checkSilentTokenRefresh();
                    }
                }
                lastUpdateTimestamp = data.last_update;
            }
        } catch (e) {}
    }

    pollingInterval = setInterval(checkLastUpdate, 10000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkLastUpdate();
        }
    });

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

    async function loadAdminAnalytics() {
        const res = await apiFetch('api/admin/analytics', { headers: authHeaders() });
        if (!res || !res.ok) return;
        const data = await res.json();
        
        // 1. Metrics Cards
        document.getElementById('analytics-total-users').textContent = data.total_users || 0;
        document.getElementById('analytics-total-views').textContent = data.total_views || 0;
        document.getElementById('analytics-active-users').textContent = data.active_users_24h || 0;
        
        // 2. Most Visited Notes Table
        const visitedTbody = document.getElementById('analytics-visited-table-body');
        if (visitedTbody) {
            let html = '';
            if (!data.most_visited || data.most_visited.length === 0) {
                html = '<tr><td colspan="2" style="text-align: center; color: var(--text-tertiary); padding: 20px;">No note visits recorded yet.</td></tr>';
            } else {
                data.most_visited.forEach(n => {
                    html += `<tr>
                        <td><a href="/note/${n.id}" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 600;">${escapeHTML(n.title)}</a></td>
                        <td style="text-align: right; font-weight: 600; color: #10b981;">${n.views}</td>
                    </tr>`;
                });
            }
            visitedTbody.innerHTML = html;
        }

        // 3. Recent Note Views Table
        const recentTbody = document.getElementById('analytics-recent-table-body');
        if (recentTbody) {
            let html = '';
            if (!data.recent_views || data.recent_views.length === 0) {
                html = '<tr><td colspan="3" style="text-align: center; color: var(--text-tertiary); padding: 20px;">No recent activity.</td></tr>';
            } else {
                data.recent_views.forEach(v => {
                    const localTime = new Date(v.last_accessed + 'Z').toLocaleString();
                    html += `<tr>
                        <td style="font-weight: 600;">${escapeHTML(v.username)}</td>
                        <td><a href="/note/${v.note_id}" target="_blank" style="color: var(--accent); text-decoration: none; font-weight: 600;">${escapeHTML(v.title)}</a></td>
                        <td style="text-align: right; font-size: 0.8rem; color: var(--text-secondary);">${localTime}</td>
                    </tr>`;
                });
            }
            recentTbody.innerHTML = html;
        }

        // 4. User Contributions Table
        const contribTbody = document.getElementById('analytics-contributions-table-body');
        if (contribTbody) {
            let html = '';
            if (!data.user_contributions || data.user_contributions.length === 0) {
                html = '<tr><td colspan="3" style="text-align: center; color: var(--text-tertiary); padding: 20px;">No user contributions recorded yet.</td></tr>';
            } else {
                data.user_contributions.forEach(c => {
                    html += `<tr>
                        <td style="font-weight: 600;">${escapeHTML(c.username)}</td>
                        <td><span class="badge badge-info">${escapeHTML(c.role)}</span></td>
                        <td style="text-align: right; font-weight: 600; color: #10b981;">${c.published_notes || 0} <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:400;">(${c.total_notes || 0} total)</span></td>
                    </tr>`;
                });
            }
            contribTbody.innerHTML = html;
        }
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
        const createTeamCard = document.getElementById('ap-create-team-card');
        if (createTeamCard) {
            createTeamCard.style.display = currentRole === 'admin' ? '' : 'none';
        }

        teams.forEach(t => {
            const dateStr = t.created_at ? new Date(t.created_at + 'Z').toLocaleString() : '-';
            const relativeLink = `/${t.name.toLowerCase()}`;
            const absoluteLink = `${window.location.origin}${relativeLink}`;
            const actionTd = currentRole === 'admin' 
                ? `<td><button class="btn-icon btn-icon-danger delete-team-btn" data-team-id="${t.id}">${ICONS.trash}</button></td>`
                : `<td style="color:var(--text-tertiary); font-size:0.8rem;">-</td>`;

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
                ${actionTd}
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
    }

    function closeDropdown(wrapper, immediate = false) {
        if (!wrapper) return;
        const selectId = wrapper.dataset.selectId;
        const optionsContainer = wrapper.querySelector('.custom-select-options') || 
            document.body.querySelector(`.custom-select-options[data-select-id="${selectId}"]`);
            
        if (!optionsContainer) return;
        
        wrapper.classList.remove('open');
        wrapper.classList.remove('open-up');

        const finishClose = () => {
            optionsContainer.style.opacity = '0';
            optionsContainer.style.visibility = 'hidden';
            optionsContainer.style.display = 'none';
            optionsContainer.style.position = '';
            optionsContainer.style.width = '';
            optionsContainer.style.top = '';
            optionsContainer.style.left = '';
            optionsContainer.style.right = '';
            optionsContainer.style.zIndex = '';
            optionsContainer.style.transform = '';
            if (optionsContainer.parentNode === document.body) {
                try { document.body.removeChild(optionsContainer); } catch(e) {}
                if (document.body.contains(wrapper)) {
                    wrapper.appendChild(optionsContainer);
                }
            } else if (optionsContainer.parentNode !== wrapper) {
                if (document.body.contains(wrapper)) {
                    wrapper.appendChild(optionsContainer);
                } else {
                    try { optionsContainer.parentNode.removeChild(optionsContainer); } catch(e) {}
                }
            }
        };

        if (immediate) {
            finishClose();
        } else {
            optionsContainer.style.opacity = '0';
            optionsContainer.style.transform = '';
            setTimeout(finishClose, 150);
        }
    }

    function initCustomSelects() {
        document.querySelectorAll('select.form-select, select.form-select-sm').forEach((select, selectIdx) => {
            // Check if wrapper already exists
            let wrapper = select.closest('.custom-select-wrapper');
            let trigger, optionsContainer;
            
            const selectId = select.id || `cs-uniq-${selectIdx}`;
            
            if (!wrapper) {
                // Wrap standard select element
                wrapper = document.createElement('div');
                wrapper.className = 'custom-select-wrapper';
                wrapper.dataset.selectId = selectId;
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
                optionsContainer.dataset.selectId = selectId;
                wrapper.appendChild(optionsContainer);
                
                // Toggle dropdown menu visibility on trigger click
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = wrapper.classList.contains('open');
                    const isInFlow = wrapper.closest('.modal') || wrapper.classList.contains('in-flow');
                    
                    // Close all other custom selects first
                    document.querySelectorAll('.custom-select-wrapper.open').forEach(openWrapper => {
                        if (openWrapper !== wrapper) {
                            if (openWrapper.closest('.modal') || openWrapper.classList.contains('in-flow')) {
                                const sId = openWrapper.dataset.selectId;
                                const oCont = openWrapper.querySelector('.custom-select-options') || 
                                    document.body.querySelector(`.custom-select-options[data-select-id="${sId}"]`);
                                if (oCont) {
                                    oCont.style.opacity = '0';
                                    setTimeout(() => {
                                        oCont.style.visibility = 'hidden';
                                        oCont.style.display = 'none';
                                        openWrapper.classList.remove('open');
                                    }, 150);
                                }
                            } else {
                                closeDropdown(openWrapper);
                            }
                        }
                    });
                    
                    if (!isOpen) {
                        wrapper.classList.add('open');
                        
                        if (!isInFlow) {
                            // Portal options container directly to document.body
                            document.body.appendChild(optionsContainer);
                            
                            // Calculate coordinates
                            const triggerRect = trigger.getBoundingClientRect();
                            
                            optionsContainer.style.position = 'fixed';
                            optionsContainer.style.width = `${triggerRect.width}px`;
                            optionsContainer.style.left = `${triggerRect.left}px`;
                            optionsContainer.style.right = 'auto';
                            optionsContainer.style.zIndex = '999999';
                            optionsContainer.style.display = 'block';
                            
                            // Get actual height
                            const optionsHeight = optionsContainer.offsetHeight || 160;
                            
                            // Decide open direction (up or down)
                            const spaceBelow = window.innerHeight - triggerRect.bottom;
                            const spaceNeeded = optionsHeight + 10;
                            const openUp = (spaceBelow < spaceNeeded && triggerRect.top > spaceNeeded);
                            
                            if (openUp) {
                                wrapper.classList.add('open-up');
                                optionsContainer.style.top = `${triggerRect.top - optionsHeight - 6}px`;
                                optionsContainer.style.transform = 'translateY(8px)';
                            } else {
                                wrapper.classList.remove('open-up');
                                optionsContainer.style.top = `${triggerRect.bottom + 6}px`;
                                optionsContainer.style.transform = 'translateY(-8px)';
                            }
                            
                            // Force layout reflow
                            optionsContainer.offsetHeight;
                            
                            optionsContainer.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
                            optionsContainer.style.visibility = 'visible';
                            optionsContainer.style.opacity = '1';
                            optionsContainer.style.transform = 'translateY(0)';
                        } else {
                            // In-flow rendering: keep in-place and show as block
                            optionsContainer.style.display = 'block';
                            optionsContainer.offsetHeight; // reflow
                            optionsContainer.style.visibility = 'visible';
                            optionsContainer.style.opacity = '1';
                        }
                    } else {
                        if (!isInFlow) {
                            closeDropdown(wrapper);
                        } else {
                            optionsContainer.style.opacity = '0';
                            setTimeout(() => {
                                optionsContainer.style.visibility = 'hidden';
                                optionsContainer.style.display = 'none';
                                wrapper.classList.remove('open');
                            }, 150);
                        }
                    }
                });
            } else {
                trigger = wrapper.querySelector('.custom-select-trigger');
                optionsContainer = wrapper.querySelector('.custom-select-options') || 
                    document.body.querySelector(`.custom-select-options[data-select-id="${selectId}"]`);
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
                    
                    // Close menu immediately so it never lingers
                    closeDropdown(wrapper, true);
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
            const selectId = wrapper.dataset.selectId;
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const optionsContainer = wrapper.querySelector('.custom-select-options') || 
                document.body.querySelector(`.custom-select-options[data-select-id="${selectId}"]`);
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

    async function toggleNotePin(noteId, btnEl) {
        if (!currentToken) { showToast('Please login to pin notes.', true); return; }
        try {
            const res = await apiFetch(`api/notes/${noteId}/pin`, { method: 'POST', headers: authHeaders() });
            if (res && res.ok) {
                const data = await res.json();
                const isPinned = data.is_pinned;
                showToast(isPinned ? 'Note pinned to top!' : 'Note unpinned.');
                fetchNotes();
            } else {
                showToast('Failed to toggle pin status', true);
            }
        } catch(e) {
            console.error('Error toggling pin status:', e);
        }
    }

    // Expose helpers globally
    window.initCustomSelects = initCustomSelects;
    window.syncCustomSelects = syncCustomSelects;
    window.closeAllCustomSelects = (e, immediate = false) => {
        // If scrolling inside the custom select options container itself, do NOT close the dropdown
        if (e && e.target && typeof e.target.closest === 'function' && e.target.closest('.custom-select-options')) {
            return;
        }
        document.querySelectorAll('.custom-select-wrapper.open').forEach(w => closeDropdown(w, immediate));

        // Safety fallback: Clean up any portaled optionsContainers attached directly to document.body
        Array.from(document.body.children).forEach(oCont => {
            if (oCont.classList && oCont.classList.contains('custom-select-options')) {
                const sId = oCont.dataset.selectId;
                const wrapper = document.querySelector(`.custom-select-wrapper[data-select-id="${sId}"]`);
                if (wrapper) {
                    wrapper.classList.remove('open', 'open-up');
                    wrapper.appendChild(oCont);
                } else {
                    oCont.remove();
                    return;
                }
                oCont.style.opacity = '0';
                oCont.style.visibility = 'hidden';
                oCont.style.display = 'none';
                oCont.style.position = '';
                oCont.style.width = '';
                oCont.style.top = '';
                oCont.style.left = '';
                oCont.style.right = '';
                oCont.style.zIndex = '';
                oCont.style.transform = '';
            }
        });
    };

    async function toggleNoteFavorite(noteId, btn) {
        if (!currentToken) {
            showToast('Authentication required!', 'danger');
            return;
        }
        try {
            const res = await apiFetch(`api/notes/${noteId}/favorite`, {
                method: 'POST',
                headers: authHeaders()
            });
            if (res && res.ok) {
                const data = await res.json();
                const isFav = data.is_favorite;
                
                // Update button UI
                btn.classList.toggle('active', isFav);
                const svg = btn.querySelector('svg');
                if (svg) {
                    svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
                }
                btn.title = isFav ? 'Unfavorite' : 'Favorite';
                
                // Update local cache
                const cachedNote = allNotes.find(n => n.id == noteId);
                if (cachedNote) {
                    cachedNote.is_favorite = isFav;
                }
                
                showToast(isFav ? 'Added to favorites ⭐' : 'Removed from favorites', 'success');
                updateFavoritesCount();
                
                // If favorites filter is active, re-render
                if (activeFavorites) {
                    renderNotes(allNotes.filter(n => n.is_favorite));
                }
            } else {
                showToast('Failed to toggle favorite', 'danger');
            }
        } catch (e) {
            showToast('Error connecting to server', 'danger');
        }
    }

    function clearFilter() {
        activeCategory = null;
        activeCategoryName = null;
        activeTag = null;
        activeFavorites = false;
        const searchCatSelect = document.getElementById('search-category-select');
        if (searchCatSelect) searchCatSelect.value = '';
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories);
        renderTags(allTags);
        updateSidebarFavoritesUI();
    }

    window.showMyPendingNotes = function() {
        if (!currentToken) { showToast('Authentication required!', 'danger'); return; }
        activePending = true;
        activeDrafts = false;
        activeMyNotes = false;
        activeRejected = false;
        activeCategory = null; activeCategoryName = null; activeTag = null;
        activeFavorites = false;
        document.getElementById('notes-container').style.display = '';
        document.getElementById('empty-state').style.display = 'none';
        if (isAdminPageOpen) closeAdminPage();
        switchView('view-cards');
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories); renderTags(allTags);
        updateSidebarFavoritesUI();
        if (window.innerWidth <= 768) closeSidebar();
    };

    window.showMyDraftNotes = function() {
        activeDrafts = true;
        activePending = false;
        activeMyNotes = false;
        activeRejected = false;
        activeCategory = null; activeCategoryName = null; activeTag = null;
        activeFavorites = false;
        document.getElementById('notes-container').style.display = '';
        document.getElementById('empty-state').style.display = 'none';
        if (isAdminPageOpen) closeAdminPage();
        switchView('view-cards');
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories); renderTags(allTags);
        updateSidebarFavoritesUI();
        if (window.innerWidth <= 768) closeSidebar();
    };

    window.showMyNotes = function() {
        activeMyNotes = true;
        activeDrafts = false;
        activePending = false;
        activeRejected = false;
        activeCategory = null; activeCategoryName = null; activeTag = null;
        activeFavorites = false;
        document.getElementById('notes-container').style.display = '';
        document.getElementById('empty-state').style.display = 'none';
        if (isAdminPageOpen) closeAdminPage();
        switchView('view-cards');
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories); renderTags(allTags);
        updateSidebarFavoritesUI();
        if (window.innerWidth <= 768) closeSidebar();
    };
    
    window.showRejectedNotes = function() {
        activeRejected = true;
        activePending = false;
        activeDrafts = false;
        activeMyNotes = false;
        activeCategory = null; activeCategoryName = null; activeTag = null;
        activeFavorites = false;
        document.getElementById('notes-container').style.display = '';
        document.getElementById('empty-state').style.display = 'none';
        if (isAdminPageOpen) closeAdminPage();
        switchView('view-cards');
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories); renderTags(allTags);
        updateSidebarFavoritesUI();
        if (window.innerWidth <= 768) closeSidebar();
    };

    async function fetchQuickAccessNotes() {
        const el = document.getElementById('sidebar-quick-access');
        const list = document.getElementById('quick-access-list');
        if (!el || !list) return;

        if (!currentToken) {
            el.style.display = 'none';
            return;
        }

        try {
            const res = await apiFetch('api/notes/frequent', { headers: authHeaders() });
            if (res && res.ok) {
                const notes = await res.json();
                if (notes && notes.length > 0) {
                    let html = '';
                    notes.forEach(note => {
                        const icon = note.note_type === 'procedure' ? ICONS.steps : ICONS.copy;
                        html += `<li class="quick-access-item" data-id="${note.id}">
                            <span class="quick-access-icon">${icon}</span>
                            <span class="quick-access-title" title="${escapeHTML(note.title)}">${escapeHTML(note.title)}</span>
                        </li>`;
                    });
                    list.innerHTML = html;
                    el.style.display = 'block';

                    list.querySelectorAll('.quick-access-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const noteId = parseInt(item.dataset.id);
                            if (currentView === 'view-notebook') {
                                loadNotebookNote(noteId);
                            } else {
                                openNoteInNppTab(noteId);
                            }
                            if (window.innerWidth <= 768 && typeof closeSidebar === 'function') closeSidebar();
                        });
                    });
                } else {
                    el.style.display = 'none';
                }
            } else {
                el.style.display = 'none';
            }
        } catch (e) {
            el.style.display = 'none';
        }
    }

    window.toggleFavoriteFilter = function() {
        if (!currentToken) {
            showToast('Authentication required!', 'danger');
            return;
        }
        activeFavorites = !activeFavorites;
        if (activeFavorites) {
            activeCategory = null;
            activeCategoryName = null;
            activeTag = null;
            activePending = false;
            activeDrafts = false;
            activeMyNotes = false;
            activeRejected = false;
            switchView('view-cards');
        }
        if (isAdminPageOpen) closeAdminPage();
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories);
        renderTags(allTags);
        updateSidebarFavoritesUI();
    };

    function showAllNotes() {
        activeCategory = null;
        activeCategoryName = null;
        activeTag = null;
        activePending = false;
        activeDrafts = false;
        activeMyNotes = false;
        activeRejected = false;
        activeFavorites = false;

        const searchCatSelect = document.getElementById('search-category-select');
        if (searchCatSelect) searchCatSelect.value = '';

        if (isAdminPageOpen) closeAdminPage();
        switchView('view-cards');
        updateFilterIndicator();
        fetchNotes();
        renderSidebarCategories(allCategories);
        renderTags(allTags);
        updateSidebarFavoritesUI();
    }
    window.showAllNotes = showAllNotes;

    function updateSidebarFavoritesUI() {
        const favEl = document.getElementById('sidebar-favorites-notes');
        const allEl = document.getElementById('sidebar-all-notes');
        const isFav = activeFavorites;
        const isAll = (!activeCategory && !activeTag && !activePending && !activeDrafts && !activeMyNotes && !activeRejected && !activeFavorites);

        if (favEl) {
            favEl.classList.toggle('active', isFav);
            const label = favEl.querySelector('.sidebar-section-label');
            if (label) {
                label.style.color = isFav ? '#f59e0b' : 'var(--text-secondary)';
            }
        }
        if (allEl) {
            allEl.classList.toggle('active', isAll);
            const label = allEl.querySelector('.sidebar-section-label');
            if (label) {
                label.style.color = isAll ? 'var(--accent)' : 'var(--text-secondary)';
            }
        }
    }

    // Close open dropdowns on page or modal scroll to keep fixed alignment accurate
    window.addEventListener('scroll', window.closeAllCustomSelects, { passive: true });
    document.addEventListener('scroll', window.closeAllCustomSelects, { capture: true, passive: true });

})();
