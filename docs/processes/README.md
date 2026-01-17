# 🔄 Process & Workflow Documentation

**Last Updated:** 2025-11-14

[← Back to Root](../../README.md)

---

## 📋 DOCUMENTS IN THIS FOLDER

### **[DOCUMENTATION_AUDIT_CHECKLIST.md](DOCUMENTATION_AUDIT_CHECKLIST.md)**

Comprehensive documentation synchronization checklist and audit process.

**Use when:**

- Documentation becomes out of sync
- After major implementation changes
- Before releases
- Monthly documentation reviews

**Covers:**

- Daily sync tasks (end of work session)
- Weekly sync tasks (end of sprint)
- Monthly sync tasks (before releases)
- Cross-reference validation
- Consistency checks (MCP count, progress percentages, tech stack)
- Red flags to fix immediately

**Audit Schedule:**

- **Daily**: Update PROGRESS.md, CHANGELOG.md
- **Weekly**: Review implementation plan status, sync README.md
- **Monthly**: Full documentation audit using checklist

---

## 🔗 WORKFLOWS DOCUMENTED IN CLAUDE.MD

The following workflows are documented in [CLAUDE.md](../../CLAUDE.md):

### **Documentation Maintenance Workflow**

- When to update documentation (triggers)
- Update checklist template
- Documentation sync schedule
- Quality standards

### **Postponed Features Workflow**

- How to document postponed features
- Required information (dependencies, rationale, review trigger)
- 5-question framework for timing validation
- Pre-implementation checklist

### **Development Server Policy**

- Always run on localhost:3000
- Kill duplicate processes before starting
- Never use other ports

### **Git Commit Workflow**

- Safety protocols (never skip hooks, never force push to main)
- Commit message format
- Pre-commit hook handling

### **Pull Request Workflow**

- PR creation process
- Description format (summary + test plan)
- Review requirements

---

## 📊 PROCESS OVERVIEW

### Documentation Update Triggers

✅ **Database Schema Changes**

- Update: Implementation Plan (schema section)
- Update: CHANGELOG.md (migration log)
- Update: CLAUDE.md (if new patterns emerge)

✅ **Tech Stack Changes** (packages added/removed)

- Update: README.md (dependencies)
- Update: CLAUDE.md (tech stack summary)

✅ **Process Changes** (new workflows, MCPs)

- Update: CLAUDE.md (workflows section)
- Update: .cursorrules (if coding standards change)

✅ **Phase Completions** (Week 1, 2, 3 done)

- Update: Implementation Plan (mark week complete)
- Update: PROGRESS.md (update percentages)
- Update: README.md (current status)

✅ **Postponed Features** (new deferrals)

- Create: [FEATURE_NAME].md (detailed spec)
- Update: Implementation Plan (postponed section)

---

## 🎯 QUALITY STANDARDS

**Core Files Must Always Be:**

- ✅ **Consistent** - Same information across all files
- ✅ **Current** - "Last Updated" within 1 week
- ✅ **Complete** - No missing sections or TODOs
- ✅ **Cross-Referenced** - Valid links between docs
- ✅ **Tested** - Installation steps actually work

**Red Flags to Fix Immediately:**

- ❌ MCP count mismatch (e.g., README says 2, config has 3)
- ❌ Progress percentage differs by >10% across files
- ❌ Database schema documented but migration missing
- ❌ Tech stack mismatch between files
- ❌ Last Updated > 2 weeks ago on core files

---

## 🔗 RELATED DOCUMENTATION

- **[CLAUDE.md](../../CLAUDE.md)** - Main process documentation
- **[Planning Documents](../planning/README.md)** - Progress tracking
- **[Implementation Plan](../implementation/README.md)** - Development guide
- **[Reference Docs](../reference/README.md)** - Technical specifications

---

[← Back to Root](../../README.md)
