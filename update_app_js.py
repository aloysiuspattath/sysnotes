import re

filepath = 'd:/new projects/notes commands and queries/static/app.js'
with open(filepath, 'r', encoding='utf-8') as f:
    c = f.read()

# Fix apiFetch('/api/...') -> apiFetch('api/...')
c = re.sub(r"apiFetch\('(/api/.*?)'", lambda m: f"apiFetch('{m.group(1)[1:]}'", c)
c = re.sub(r"apiFetch\(`(/api/.*?)`", lambda m: f"apiFetch(`{m.group(1)[1:]}`", c)

# Fix literal url assignments
c = c.replace("let url = '/api/notes?';", "let url = 'api/notes?';")
c = c.replace("a.href = '/api/backup", "a.href = 'api/backup")

# Fix HTML generation links
c = c.replace('href="/note/', 'href="note/')
c = c.replace("href='/note/", "href='note/")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated app.js")
