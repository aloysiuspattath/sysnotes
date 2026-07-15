# About SysNotes

SysNotes is a centralized knowledge sharing and notes repository platform built specifically for IT and System Administration departments. It is designed to act as a "single source of truth" for infrastructure commands, troubleshooting steps, and standard operating procedures (SOPs).

---

## The Vision
In large IT organizations, different teams (e.g., SysAdmins, DBAs, Network Engineers) often maintain separate, siloed repositories of documentation. Important knowledge is scattered across wiki pages, text files, and chat histories. 

**SysNotes** solves this by providing a unified repository featuring:
- **Instant Search:** Powerful SQLite full-text search to find snippets when production goes down.
- **Secure Isolation:** Granular team scoping so sensitive notes (e.g., internal configurations) remain restricted to authorized team members, while generic help documents can be made globally accessible.
- **Audit Trails:** Transparency through automatic revision histories and system logs to track what was changed, when, and by whom.

---

## Architecture Design

### Backend (Python & Flask)
- **Waitress WSGI:** Production-grade hosting for Windows and Linux environments.
- **JWT Session Security:** Authentication utilizes short-lived JSON Web Tokens (JWT) for secure, stateless client-server communication.
- **Active Directory Integration:** Authenticates enterprise users via LDAP/Active Directory protocols while falling back to local SQLite accounts.

### Database (SQLite)
- **Zero-Configuration:** A single file database (`sysadmin_notes.db`) eliminates complex configuration overhead.
- **Dynamic Migrations:** Schema changes are automatically applied on startup, ensuring seamless upgrades.

### Frontend (SPA Architecture)
- **Modern Responsive Design:** An interactive Bento-grid layout that works on desktop, tablet, and mobile browsers.
- **Offline Packaged Utilities:** Built with pure vanilla HTML, CSS, and JS. All libraries (Quill, Marked, DOMPurify) are packaged locally for secure, offline environments.

---

## Author & Contributors
Created and maintained by [@aloysiuspattath](https://github.com/aloysiuspattath). 
For support, feedback, or custom feature requests, please reach out via the issue tracker.
