# Azure App Service — Build & Deployments UX Exploration

## Mission

Reimagine the **Build & Deployments** experience for Azure App Service in the Azure Portal. The current UX is functional but dated — it's cluttered, inconsistent, and doesn't reflect how modern developers think about CI/CD. We're building a proof-of-concept that demonstrates what a truly modern deployment management experience could look like.

## Goals

### 1. Deep Understanding of the Current Experience

Before we redesign anything, we need to understand _everything_ about how the current deployment UX works:

- **Deployment Center** — the main blade, its tabs (Settings, Logs, FTPS Credentials)
- **Source configuration** — GitHub, Azure DevOps, Bitbucket, Local Git, External Git, FTP
- **Build providers** — GitHub Actions, Azure Pipelines, App Service Build Service (Kudu/Oryx)
- **Deployment slots** — creation, swapping, traffic routing, slot settings
- **Monitoring** — deployment logs, log streaming, Kudu console
- **Edge cases** — container deployments, static content, Windows vs Linux differences
- **Manual methods** — ZIP deploy, Web Deploy, Run From Package, CLI workflows

We'll capture screenshots of every screen, flow, and state in the current portal and document them in `docs/screenshots/`.

### 2. Identify Pain Points & Opportunities

What's broken, confusing, or just _meh_ about the current UX:

- Where do users get lost?
- What workflows take too many clicks?
- What information is buried or missing?
- Where is the UX inconsistent with itself or with other Azure services?
- What modern CI/CD patterns (GitHub-first, preview environments, deploy previews) are completely absent?

### 3. Design a Modernized Experience

Build a POC that demonstrates:

- **Clean, opinionated defaults** — GitHub Actions as the primary CI/CD path, with others as alternatives
- **Real-time deployment status** — live build/deploy progress, not "check logs"
- **Slot management that makes sense** — visual slot comparison, one-click swap with diff preview
- **Deployment history that's actually useful** — who deployed what, when, from which commit, with rollback
- **Modern patterns** — preview environments per PR, deploy protection rules, deployment approvals
- **Progressive disclosure** — simple for simple apps, powerful for complex ones

### 4. Mock the Surrounding Portal Chrome

To make the POC feel real, we'll mock the Azure Portal shell (navigation, breadcrumbs, resource header) so stakeholders can evaluate the UX in context.

---

## Approach

1. **Screenshot & document** the current portal experience (all deployment-related blades)
2. **Research** every deployment option, API, and configuration (see `docs/azure-app-service-deployments.md`)
3. **Identify** UX pain points and map user journeys
4. **Sketch** new UX concepts (wireframes → high-fi mockups in code)
5. **Build** the POC iteratively in this repo using React + TypeScript
6. **Iterate** based on feedback

## Repo Structure

```
aas-deployments-poc/
├── docs/
│   ├── exploration.md              # This file — goals, approach, findings
│   ├── agent-thoughts.md           # Sol's analysis and recommendations
│   ├── azure-app-service-deployments.md  # Deep-dive reference on AAS deployments
│   └── screenshots/                # Current portal screenshots for reference
├── src/                            # React app — the POC
│   ├── components/                 # UI components
│   ├── mock-data/                  # Fake data for the POC
│   └── ...
└── ...
```

---

## Current Experience Analysis

_To be populated with screenshots and observations from the Azure Portal._

### Deployment Center — Settings Tab

> Awaiting screenshots

### Deployment Center — Logs Tab

> Awaiting screenshots

### Deployment Slots Blade

> Awaiting screenshots

### Other Deployment-Related Blades

> Awaiting screenshots

---

## Pain Points & Opportunities

_To be populated as we analyze the current experience._

| Area | Pain Point | Opportunity |
|------|-----------|-------------|
| | | |

---

## Design Concepts

_To be populated as we iterate on the POC._
