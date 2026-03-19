# Azure App Service — Deployment Methods & UX Reference

> **Purpose:** Comprehensive technical reference for teams building modernized deployment UX for Azure App Service.
> **Last Updated:** July 2025

---

## Table of Contents

1. [Deployment Architecture Overview](#1-deployment-architecture-overview)
2. [Deployment Center (Portal UX)](#2-deployment-center-portal-ux)
3. [Source-Based Deployment (CI/CD)](#3-source-based-deployment-cicd)
4. [Build Providers](#4-build-providers)
5. [Manual / Direct Deployment Methods](#5-manual--direct-deployment-methods)
6. [Deployment Slots](#6-deployment-slots)
7. [Deployment Configuration & Settings](#7-deployment-configuration--settings)
8. [Monitoring & Logs](#8-monitoring--logs)
9. [Platform-Specific Behaviors](#9-platform-specific-behaviors)
10. [Current UX Pain Points](#10-current-ux-pain-points)

---

## 1. Deployment Architecture Overview

Azure App Service deployments have **three independent components** that combine to form a deployment pipeline:

### 1.1 Deployment Source
Where code lives. Options:
- **GitHub** — most common, first-class integration
- **Bitbucket** — OAuth-based integration
- **Azure Repos** — Azure DevOps Git repositories
- **Local Git** — push directly to a Kudu-managed Git remote
- **External Git** — any publicly-reachable Git/Mercurial repo (Windows only)
- **Local machine** — ZIP deploy, FTP, Web Deploy (no source control)
- **Container registry** — ACR, Docker Hub, or private registries+

### 1.2 Build Pipeline
Who compiles/packages the code:
- **GitHub Actions** — build in GitHub-hosted runners
- **Azure Pipelines** — build in Azure DevOps
- **App Service Build Service (Kudu/Oryx)** — build on the SCM site
- **No build / pre-built** — deploy a ready-to-run artifact

### 1.3 Deployment Mechanism
How files reach `/home/site/wwwroot`:
- **Kudu endpoints** — `zipdeploy`, `wardeploy`, `api/publish` (the primary mechanism)
- **FTP/FTPS** — direct file upload (no Kudu involvement)
- **Web Deploy (MSDeploy)** — IIS-native deployment tool (no Kudu involvement)
- **Run From Package** — ZIP mounted as read-only wwwroot (no file extraction)

```
┌─────────────┐    ┌──────────────┐    ┌────────────────────┐
│   Source     │───▶│  Build       │───▶│  Deploy Mechanism  │
│             │    │  Pipeline    │    │                    │
│ GitHub      │    │ GH Actions   │    │ Kudu /api/publish  │
│ Azure Repos │    │ AzPipelines  │    │ FTP/FTPS           │
│ Bitbucket   │    │ Kudu/Oryx    │    │ Web Deploy         │
│ Local Git   │    │ Pre-built    │    │ Run From Package   │
│ External Git│    │              │    │                    │
│ Local ZIP   │    │              │    │                    │
└─────────────┘    └──────────────┘    └────────────────────┘
```

---

## 2. Deployment Center (Portal UX)

### 2.1 What It Is
The **Deployment Center** is the portal blade located at `<app> > Deployment > Deployment Center`. It's the unified UI for configuring and monitoring continuous deployment.

### 2.2 Tabs / Views

| Tab | Purpose |
|---|---|
| **Settings** | Configure source, build provider, repository, branch, authentication |
| **Logs** | View deployment history, commit SHAs, status, timestamps, log links |
| **FTPS Credentials** | View/copy FTPS endpoint, app-scope and user-scope credentials |

### 2.3 UX Flow — Setting Up CI/CD

1. User navigates to **Deployment Center**
2. On **Settings** tab, selects **Source** dropdown:
   - GitHub, Bitbucket, Azure Repos, Local Git, External Git
3. For GitHub/Bitbucket: OAuth authorization flow, then select Org → Repo → Branch
4. For GitHub: choose **Build Provider** (GitHub Actions is default; can switch to App Service Build Service or Azure Pipelines)
5. For GitHub Actions: choose **Authentication Type** (User-assigned identity recommended, or Basic Auth / publish profile)
6. Preview the generated workflow file (optional)
7. Click **Save** → webhook created, workflow file committed, first deployment triggers

### 2.4 Deployment Center During App Creation

GitHub Actions deployment can also be configured in the **Create Web App** wizard under the **Deployment** tab by setting **Continuous deployment** to **Enable**. The authentication method is auto-selected based on whether basic auth is enabled.

### 2.5 API Surface

The Deployment Center is backed by ARM APIs:
- `GET/PUT /providers/Microsoft.Web/sites/{name}/sourcecontrols/web` — source control configuration
- `GET /providers/Microsoft.Web/sites/{name}/deployments` — deployment history
- `POST /providers/Microsoft.Web/sites/{name}/config/publishingcredentials/list` — credentials
- `GET/PUT /providers/Microsoft.Web/sites/{name}/config/web` — scmType, deployment branch, etc.

---

## 3. Source-Based Deployment (CI/CD)

### 3.1 GitHub Actions Integration

**How it works:**
1. Portal generates a GitHub Actions workflow YAML file based on the app's language stack
2. Commits the file to `.github/workflows/` in the selected repository
3. Creates necessary secrets or federated credentials in GitHub
4. Subsequent pushes to the configured branch trigger the workflow

**Authentication methods (in order of security):**

| Method | Security | Portal Setup | Details |
|---|---|---|---|
| **User-assigned managed identity (OIDC)** | ★★★★★ | Yes — default | Creates federated credential between Azure MI and GitHub. Uses `Azure/login@v2` with OIDC. Short-lived tokens. No secrets to rotate. |
| **OpenID Connect (app registration)** | ★★★★ | Manual only | Create Entra app + service principal + federated credential manually. |
| **Service Principal (client secret)** | ★★★ | Manual only | `az ad sp create-for-rbac`, stores JSON in `AZURE_CREDENTIALS` secret. Secrets expire. |
| **Publish Profile** | ★★ | Yes | Downloads XML publish profile, stores as `AZURE_WEBAPP_PUBLISH_PROFILE` secret. Requires basic auth enabled. |

**What the portal configures for user-assigned identity:**
- Creates or selects a user-assigned managed identity
- Creates a federated credential linking the identity to the GitHub repo/branch
- Creates GitHub secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- Assigns the identity to the app
- Generates and commits the workflow file

**Generated workflow file structure:**
```yaml
name: Build and deploy to Azure
on:
  push:
    branches: [ main ]
permissions:
  id-token: write    # Required for OIDC
  contents: read
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      # ... language-specific build steps ...
      - uses: azure/webapps-deploy@v3
        with:
          app-name: <app-name>
          package: <path>
```

**Key GitHub Action: `azure/webapps-deploy@v3`**
- Inputs: `app-name`, `slot-name`, `package`, `publish-profile`, `images` (for containers)
- Uses Kudu's `api/publish` endpoint under the hood
- Supports ZIP, WAR, JAR, EAR, static files, startup scripts

**Log integration:** Portal pulls workflow run logs from GitHub API and displays on the **Logs** tab.

### 3.2 Azure DevOps Pipelines Integration

**Two paths:**
1. **Via Deployment Center** — Select Azure Repos as source, change provider to Azure Pipelines, then configure the pipeline directly in Azure DevOps. The portal redirects to ADO.
2. **Directly in Azure DevOps** — Use the `AzureWebApp@1` task or `AzureRmWebAppDeployment@4` task.

**Portal behavior:**
- When selecting Azure Pipelines as build provider, the portal does NOT generate a pipeline YAML — it redirects you to Azure DevOps to configure it
- This is a notable UX gap vs. GitHub Actions where the portal generates the full workflow

**Common Azure DevOps tasks:**
```yaml
# azure-pipelines.yml
- task: AzureWebApp@1
  inputs:
    azureSubscription: '<service-connection>'
    appName: '<app-name>'
    package: '$(Build.ArtifactStagingDirectory)/**/*.zip'
    slotName: 'staging'
    deploymentMethod: 'zipDeploy'  # or 'runFromPackage'
```

**Authentication:** Uses Azure DevOps service connections (service principal or managed identity).

### 3.3 Bitbucket Integration

- Uses OAuth to authenticate with Bitbucket
- Build provider is always **App Service Build Service** (no GitHub Actions or Azure Pipelines option)
- Portal creates a webhook in Bitbucket
- On push, Kudu pulls the source and builds using its native build engine
- Requires SCM basic auth to be enabled (webhook uses basic auth)

### 3.4 Local Git

**How it works:**
1. Enable Local Git in Deployment Center → sets `scmType` to `LocalGit`
2. Portal provides a Git clone URL: `https://<app>.scm.azurewebsites.net/<app>.git`
3. Developer adds this as a Git remote and pushes
4. Kudu receives the push, triggers build automation, deploys

**Key details:**
- Requires basic auth (user-scope or app-scope credentials)
- Deploy to the `master` branch by default; configurable via `DEPLOYMENT_BRANCH` app setting
- Build automation runs automatically (Kudu on Windows, Oryx on Linux)
- `.deployment` file in repo root can customize build commands

**URL formats:**
- User-scope: `https://<user>@<app>.scm.azurewebsites.net/<app>.git`
- App-scope: `https://$<app>@<app>.scm.azurewebsites.net/<app>.git`

**Common gotcha:** If local branch is `main` but deploy branch is `master`, use: `git push azure main:master`

### 3.5 External Git

- **Windows apps only** (not available on Linux)
- Manually provide a Git repo URL (e.g., GitLab, self-hosted Git)
- Kudu polls or uses a webhook for changes
- Uses App Service Build Service for builds
- Supports Git and Mercurial
- Configured via `scmType = "ExternalGit"` and `repoUrl` in site config

### 3.6 Authentication & Trigger Summary

| Source | Auth Method | Trigger Mechanism | Build Provider Options |
|---|---|---|---|
| GitHub | OAuth + OIDC/MI/SP/publish profile | Webhook → GitHub Actions runs, then deploys | GitHub Actions, App Service Build Service, Azure Pipelines |
| Azure Repos | Service connection | Webhook or pipeline trigger | App Service Build Service, Azure Pipelines |
| Bitbucket | OAuth | Webhook → Kudu pull | App Service Build Service only |
| Local Git | Basic auth (user/app scope) | `git push` → Kudu receives | App Service Build Service only |
| External Git | None (public) or basic auth | Webhook or polling | App Service Build Service only |

---

## 4. Build Providers

### 4.1 GitHub Actions as Build Provider

- Default for GitHub source
- Workflow file lives in the repo at `.github/workflows/`
- Build runs on GitHub-hosted runners (Ubuntu, Windows, macOS)
- Developer has full control over build steps
- Portal provides generated templates per language stack
- Logs streamed from GitHub API into Deployment Center

**Supported stacks with template generation:**
- .NET / ASP.NET Core
- Node.js
- Python
- Java (SE, Tomcat, JBoss EAP)
- PHP
- Go
- Static HTML

### 4.2 Azure Pipelines as Build Provider

- Available for GitHub and Azure Repos sources
- Portal redirects to Azure DevOps for pipeline configuration (no inline editing)
- Uses Azure DevOps agents (Microsoft-hosted or self-hosted)
- More control over complex multi-stage pipelines
- Better for enterprise scenarios with approval gates

### 4.3 App Service Build Service (Kudu / Oryx)

This is the **native build engine** running on the SCM site (`<app>.scm.azurewebsites.net`).

**Architecture:**
- **Windows apps:** Kudu (C#/.NET based, open-source at github.com/projectkudu/kudu)
- **Linux apps:** Kudu Lite + Oryx (build system at github.com/microsoft/Oryx)
- Runs as a separate process/container from the main app

**How Oryx detects and builds apps (Linux):**

Oryx auto-detects the language by looking for specific files in the project root:

| Runtime | Detection Files |
|---|---|
| ASP.NET Core | `*.csproj`, `*.sln` |
| Node.js | `package.json` (with start script), `server.js`, `app.js` |
| Python | `requirements.txt`, `pyproject.toml`, `setup.py`, `runtime.txt` |
| PHP | `index.php`, `composer.json` |
| Ruby | `Gemfile` |
| Java | `pom.xml`, `build.gradle` |

**Oryx build steps (Python example):**
1. Run `PRE_BUILD_COMMAND` if set
2. Detect dependency file (`requirements.txt`, `pyproject.toml` with uv/poetry)
3. Install dependencies (`pip install`, `uv sync`, `poetry install`)
4. Run `manage.py collectstatic` for Django (unless `DISABLE_COLLECTSTATIC=true`)
5. Run `POST_BUILD_COMMAND` if set

**Kudu build steps (Windows):**
1. Detect project type (MSBuild, npm, pip, etc.)
2. Run `SCM_SCRIPT_GENERATOR_ARGS` or auto-detected deployment script
3. Execute build: `dotnet restore` + `dotnet build`, `npm install`, `pip install`, etc.
4. Copy output to `/home/site/wwwroot`

**Customization:**
- `.deployment` file in repo root — points to custom deployment script
- `SCM_BUILD_ARGS` — append MSBuild args (Windows)
- `SCM_SCRIPT_GENERATOR_ARGS` — override deployment script generation
- `PRE_BUILD_COMMAND` / `POST_BUILD_COMMAND` — custom commands (Linux/Oryx)
- `PRE_BUILD_SCRIPT_PATH` / `POST_BUILD_SCRIPT_PATH` — paths to custom scripts

### 4.4 No Build / Pre-built Deployment

When deploying pre-built artifacts:
- Set `SCM_DO_BUILD_DURING_DEPLOYMENT=false` (or don't set to `true`)
- ZIP deploy assumes package is ready-to-run by default
- Run From Package (`WEBSITE_RUN_FROM_PACKAGE=1`) mounts ZIP as-is
- Most CI/CD pipelines build externally and deploy artifacts

---

## 5. Manual / Direct Deployment Methods

### 5.1 ZIP Deploy

**The primary recommended deployment mechanism for most scenarios.**

**Endpoints:**
- **Modern (OneDeploy):** `POST https://<app>.scm.azurewebsites.net/api/publish?type=zip`
- **Legacy:** `POST https://<app>.scm.azurewebsites.net/api/zipdeploy`
- Both accept a ZIP file in the request body

**Authentication:**
- **Microsoft Entra ID (recommended):** `Authorization: Bearer <token>`
- **Basic auth:** `-u <username>:<password>` (requires SCM basic auth enabled)

**CLI:**
```bash
az webapp deploy --resource-group <rg> --name <app> --src-path app.zip
# or from URL:
az webapp deploy --resource-group <rg> --name <app> --src-url "https://..."
```

**PowerShell:**
```powershell
Publish-AzWebApp -ResourceGroupName <rg> -Name <app> -ArchivePath app.zip
```

**Behavior:**
- Files extracted to `/home/site/wwwroot`
- Only overwrites files with newer timestamps
- Can delete old files with `clean=true` query param
- Restarts the app by default (`restart=true`)
- Max package size: 2048 MB
- Does NOT run build automation by default (set `SCM_DO_BUILD_DURING_DEPLOYMENT=true` to enable)

**Kudu Publish API (`/api/publish`) query parameters:**

| Parameter | Values | Description |
|---|---|---|
| `type` | `zip`, `war`, `jar`, `ear`, `lib`, `startup`, `static` | Artifact type; sets default target path |
| `restart` | `true`/`false` | Restart app after deploy (default: `true`) |
| `clean` | `true`/`false` | Delete target dir before deploy |
| `ignorestack` | `true`/`false` | Disable language-specific defaults |
| `path` | absolute path | Custom deploy target path |

**WAR/JAR/EAR deploy:**
```bash
az webapp deploy --resource-group <rg> --name <app> --src-path app.war
# Kudu API: POST /api/publish?type=war
# Default target: /home/site/wwwroot/app.war
```

### 5.2 FTP / FTPS Deployment

**No build automation.** Files uploaded directly to `/site/wwwroot`.

**Endpoints:**
- From portal: **Deployment Center → FTPS Credentials** tab
- From CLI: `az webapp deployment list-publishing-profiles`
- Control port: 21 (FTP), 990 (FTPS implicit)
- Data ports: 989, 10001-10300

**Credentials:**
- App-scope: `<app>\$<app>` (auto-generated)
- User-scope: `<app>\<username>` (user-set)

**Security configuration:**
```bash
# Enforce FTPS only (disable plain FTP):
az webapp config set --name <app> --resource-group <rg> --ftps-state FtpsOnly
# Disable FTP entirely:
az webapp config set --name <app> --resource-group <rg> --ftps-state Disabled
```

**Limitations:**
- No dependency restoration (npm, pip, NuGet, etc.)
- No compilation
- No `web.config` generation
- Manual process — not suitable for CI/CD
- Requires basic auth enabled

### 5.3 Web Deploy (MSDeploy)

- IIS-native deployment tool, **Windows apps only**
- Used by Visual Studio's "Publish" feature
- Does NOT go through Kudu
- Supports incremental deployment (only changed files)
- Endpoint: `https://<app>.scm.azurewebsites.net:443/msdeploy.axd`
- Auth: basic auth (publish profile credentials)
- Requires basic auth enabled on SCM site

### 5.4 Run From Package (`WEBSITE_RUN_FROM_PACKAGE`)

**A fundamentally different deployment model.** Instead of extracting files to `/home/site/wwwroot`, the ZIP package is mounted as a **read-only filesystem**.

**Modes:**

| Setting Value | Behavior |
|---|---|
| `1` | Run from a local ZIP in `/home/data/SitePackages/` |
| `<url>` | Run from an external URL (e.g., Azure Blob Storage SAS URL) |
| Not set / removed | Normal deployment (files extracted to wwwroot) |

**Benefits:**
- Eliminates file lock conflicts between deployment and runtime
- Ensures atomic deployment — only fully-deployed apps run
- Faster cold starts (especially for Node.js/Functions)
- Deterministic deployments

**Limitations:**
- `wwwroot` is **read-only** — app cannot write files there
- TAR/GZIP not supported (ZIP only)
- Max 1 GB package size
- Not compatible with local cache
- **Not supported for Python apps** (need build automation for venv)
- Cannot migrate from local ZIP to external URL without recreating the resource

**With managed identity (no SAS keys):**
```bash
az webapp config appsettings set --name <app> --resource-group <rg> \
  --settings WEBSITE_RUN_FROM_PACKAGE="https://<storage>.blob.core.windows.net/<container>/app.zip"
# Assign Storage Blob Data Reader to the app's managed identity
# Optionally: WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID=<user-assigned-MI-resource-id>
```

### 5.5 OneDrive / Dropbox Sync

- **Effectively deprecated.** The portal UI for these was removed.
- Was implemented via Kudu's content sync feature
- Used OAuth to connect to OneDrive/Dropbox
- Synced a folder from cloud storage to wwwroot
- Not recommended for any new deployments

### 5.6 ARM Template Deployments

ARM templates can deploy code via the `Microsoft.Web/sites/extensions` resource:

```json
{
  "type": "Microsoft.Web/sites/extensions",
  "apiVersion": "2021-03-01",
  "name": "<app-name>/onedeploy",
  "properties": {
    "packageUri": "https://<storage-url>/app.zip?<sas>",
    "type": "zip"
  }
}
```

**Constraints:**
- Only supports remote package URLs (no inline content)
- Useful for infrastructure-as-code deployments
- Supports `type`, `path` parameters

---

## 6. Deployment Slots

### 6.1 Overview

Deployment slots are **fully independent App Service instances** sharing the same App Service Plan. Each slot:
- Has its own hostname: `<app>-<slot>.azurewebsites.net`
- Has its own configuration (mostly)
- Can have its own deployment source
- Is a live, running app
- Can receive a percentage of production traffic

**Tier requirements:**

| Tier | Max Slots |
|---|---|
| Free / Shared / Basic | 0 (no slots) |
| Standard | 5 |
| Premium | 20 |
| Isolated | 20 |

**Naming:** URL format is `<sitename>-<slotname>.azurewebsites.net`. Site name max 40 chars, slot name max 19 chars, combined max 59 chars.

### 6.2 What Happens During a Swap

This is a **multi-phase warm-up + routing switch** — NOT a file copy.

**Swap steps:**
1. **Apply target slot settings to source slot:** slot-specific app settings, connection strings, CD settings, auth settings from the target (production) are applied to all source slot instances
2. **Wait for source slot restart:** All instances must complete restart. If any fail, swap aborts.
3. **Local cache initialization** (if enabled): HTTP request to `/` on each source instance, wait for response, triggers another restart
4. **Custom warm-up** (if `applicationInitialization` configured in web.config): HTTP requests to configured paths on each source instance. If not configured, request to app root.
5. **Routing switch:** DNS/routing rules swapped between source and target. **This is instantaneous — zero downtime.**
6. **Source slot recycle:** Source slot (now holding old production app) restarts its instances

**Critical insight:** All warm-up work happens on the **source** slot. The target (production) slot remains online throughout. If warm-up fails, swap aborts with no production impact.

### 6.3 Settings That Swap vs. Stay

**Settings that SWAP (follow the content):**
- Language framework versions (.NET, Java, PHP, Node.js, Python)
- 32/64-bit platform setting
- WebSockets
- App settings (unless marked "slot setting")
- Connection strings (unless marked "slot setting")
- Handler mappings
- Public certificates
- WebJobs content
- Path mappings
- Mounted storage accounts (unless marked slot setting)
- Hybrid connections, service endpoints, CDN

**Settings that DON'T swap (stick to the slot):**
- Publishing endpoints
- Custom domain names
- Non-public certificates / TLS settings
- Scale settings
- IP restrictions ✱
- Always On ✱
- Diagnostic log settings ✱
- CORS ✱
- Protocol settings (HTTPS Only, TLS version) ✱
- Managed identities
- Settings ending with `_EXTENSION_VERSION`
- Virtual network integration
- Settings created by Service Connector

✱ = Can be made swappable by adding `WEBSITE_OVERRIDE_PRESERVE_DEFAULT_STICKY_SLOT_SETTINGS=0|false` to **every** slot. This is all-or-nothing for the starred settings.

### 6.4 Making Settings Slot-Specific ("Sticky")

Any app setting or connection string can be marked as a **"deployment slot setting"** (sticky):
- In portal: check the "Deployment slot setting" checkbox next to the setting
- Via CLI: `az webapp config appsettings set --slot-settings KEY=VALUE`
- Via ARM: set the `slotConfigNames` resource

Common slot-specific settings: `ASPNETCORE_ENVIRONMENT`, database connection strings pointing to staging DBs, feature flags.

### 6.5 Auto-Swap

Automatically swaps a slot into production after deployment completes successfully.

**Configuration:**
- Set on the **source** slot (e.g., staging)
- `az webapp deployment slot auto-swap --slot staging --auto-swap-slot production`
- In portal: slot's Configuration > General Settings > Auto swap enabled → target slot

**How it works:**
1. Code deployed to staging slot
2. App Service waits for warm-up
3. Automatically initiates swap to target slot
4. No manual intervention needed

**Limitations:**
- Not supported on Linux App Service / Web App for Containers
- Auto-swap target must be the production slot or another slot

### 6.6 Traffic Routing / Canary Deployments

Route a percentage of production traffic to a non-production slot:

```bash
# Route 15% of traffic to staging:
az webapp traffic-routing set --distribution staging=15 --name <app> --resource-group <rg>
```

**How it works:**
- Uses `x-ms-routing-name` cookie to pin clients to a slot
- Client cookie: `x-ms-routing-name=staging` or `x-ms-routing-name=self` (production)
- Percentage is evaluated for new sessions without the routing cookie
- User can manually opt in: `<app>.azurewebsites.net/?x-ms-routing-name=staging`

**UX in portal:** The **Deployment slots** page shows a **Traffic %** column for each slot that can be edited inline.

### 6.7 Swap with Preview (Multi-Phase Swap)

A two-phase swap that lets you validate before completing:

1. **Phase 1:** Apply target settings to source, restart, warm up (same as steps 1-4 above), then **pause**
2. **Validate:** Test the source slot with production settings
3. **Phase 2:** Complete the swap (or cancel)

```bash
# Start phase 1:
az webapp deployment slot swap --slot staging --target-slot production --action preview
# Complete:
az webapp deployment slot swap --slot staging --target-slot production --action swap
# Cancel:
az webapp deployment slot swap --slot staging --target-slot production --action reset
```

### 6.8 Slot Cloning

When creating a new slot, you can **clone configuration from an existing slot**:
- Clones app settings, connection strings, language framework versions, web sockets, HTTP version, platform bitness
- Does NOT clone content/files
- Does NOT clone private endpoints

---

## 7. Deployment Configuration & Settings

### 7.1 Build Automation Settings

| Setting | Platform | Default | Description |
|---|---|---|---|
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | Both | `false` for ZIP; `true` for Git | Enables build automation during ZIP deploy. For Git-based deploys, always runs. |
| `ENABLE_ORYX_BUILD` | Linux | `true` | Enables Oryx build system. Set to `false` for .NET/Java issues. |
| `DISABLE_COLLECTSTATIC` | Linux (Python/Django) | `false` | Skip `manage.py collectstatic` during build |
| `PRE_BUILD_COMMAND` | Linux | — | Custom command to run before build |
| `POST_BUILD_COMMAND` | Linux | — | Custom command to run after build |
| `PRE_BUILD_SCRIPT_PATH` | Linux | — | Path to custom pre-build script |
| `POST_BUILD_SCRIPT_PATH` | Linux | — | Path to custom post-build script |

### 7.2 Kudu-Specific Settings (Windows)

| Setting | Description |
|---|---|
| `SCM_BUILD_ARGS` | Append args to MSBuild command line |
| `SCM_SCRIPT_GENERATOR_ARGS` | Override deployment script generation (e.g., `--basic -p <folder>`) |
| `SCM_TRACE_LEVEL` | Build trace level (1-4, default 1) |
| `SCM_COMMAND_IDLE_TIMEOUT` | Timeout (seconds) per build command (default: 60) |
| `SCM_LOGSTREAM_TIMEOUT` | Log stream inactivity timeout (default: 1800s / 30min) |
| `SCM_USE_LIBGIT2SHARP_REPOSITORY` | Set to `0` to use git.exe instead of libgit2sharp |
| `WEBSITE_SCM_IDLE_TIMEOUT_IN_MINUTES` | SCM site idle timeout (default: 20min) |

### 7.3 Run From Package Settings

| Setting | Description |
|---|---|
| `WEBSITE_RUN_FROM_PACKAGE` | `1` (local) or `<url>` (external). Mounts ZIP as read-only wwwroot. |
| `WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID` | Resource ID of user-assigned MI for blob access. `SystemAssigned` for system MI. |

### 7.4 Deployment Branch & SCM Type

| Setting | Description |
|---|---|
| `DEPLOYMENT_BRANCH` | Branch Kudu deploys from (default: `master`). Set to `main` if needed. |
| `scmType` (site config) | Values: `None`, `LocalGit`, `GitHub`, `BitbucketGit`, `ExternalGit`, `Dropbox`, `OneDrive`, `VSO` (Azure DevOps) |

### 7.5 Stack / Runtime Configuration

Deployment behavior depends on the configured runtime stack:
- Set via portal, CLI (`az webapp config set --linux-fx-version "NODE|20-lts"`), or ARM
- **Linux:** `linuxFxVersion` — e.g., `NODE|20-lts`, `PYTHON|3.12`, `DOTNETCORE|8.0`, `DOCKER|<image>`
- **Windows:** `netFrameworkVersion`, `phpVersion`, `nodeVersion`, `javaVersion`, `pythonVersion` (individual properties)
- The Oryx build system reads this to determine which SDK/runtime to use during build

### 7.6 Startup Commands

- **Linux:** Custom startup command configured via `az webapp config set --startup-file "<command>"` or in portal under Configuration > General Settings > Startup Command
- **Windows:** Configure via `web.config` and `applicationHost.config`
- Can also deploy a startup script via `/api/publish?type=startup`

### 7.7 Managed Identity for Deployment Auth

**Recommended over basic auth.** Two approaches:

1. **User-assigned managed identity + OIDC** (GitHub Actions):
   - Portal creates federated credential between MI and GitHub
   - Workflow uses `azure/login@v2` with client-id/tenant-id/subscription-id
   - No secrets to manage

2. **Managed identity for blob access** (Run From Package):
   - App's MI granted `Storage Blob Data Reader` role on the blob
   - `WEBSITE_RUN_FROM_PACKAGE` set to blob URL (no SAS token)

**Disabling basic auth:**
```bash
# Disable SCM basic auth:
az resource update --resource-group <rg> --name scm \
  --namespace Microsoft.Web --resource-type basicPublishingCredentialsPolicies \
  --parent sites/<app> --set properties.allow=false
# Disable FTP basic auth:
az resource update --resource-group <rg> --name ftp \
  --namespace Microsoft.Web --resource-type basicPublishingCredentialsPolicies \
  --parent sites/<app> --set properties.allow=false
```

---

## 8. Monitoring & Logs

### 8.1 Deployment Logs

**Where they live:**
- `/home/site/deployments/` — contains a folder per deployment with `log.log`, `status.xml`
- Each deployment folder named by commit SHA or timestamp
- `status.xml` contains: deployment ID, status (Success/Failed/Building), author, message, timestamps

**Accessing:**
- **Portal:** Deployment Center → Logs tab
- **Kudu console:** Browse to `/home/site/deployments/`
- **API:** `GET /api/deployments` returns deployment history as JSON
- **API:** `GET /api/deployments/{id}/log` returns detailed log entries

**For GitHub Actions:** Logs are pulled from the GitHub API (workflow run logs) and displayed in the Deployment Center Logs tab.

### 8.2 Log Streaming

Real-time log streaming from the app's stdout/stderr:

```bash
# CLI:
az webapp log tail --name <app> --resource-group <rg>
# Direct URL:
https://<app>.scm.azurewebsites.net/api/logstream
```

- Streams application logs, web server logs, detailed error messages
- Settings: `SCM_LOGSTREAM_TIMEOUT` (default 30 min inactivity timeout)

### 8.3 Kudu Console & Its Role

**URL:** `https://<app>.scm.azurewebsites.net`

**Key features:**
- **Debug Console** (CMD/PowerShell/Bash) — direct shell access to the app's file system
- **Process Explorer** — view running processes, memory usage
- **Environment** — all environment variables, connection strings, app settings
- **REST API** — programmatic access to deployments, files, processes, settings
- **Log Stream** — real-time stdout/stderr
- **Site Extensions** — install/manage site extensions
- **ZIP Push Deploy UI** — drag-and-drop ZIP deployment (Windows only)

**REST API endpoints:**
| Endpoint | Description |
|---|---|
| `GET /api/deployments` | Deployment history |
| `GET /api/deployments/{id}/log` | Deployment log |
| `POST /api/publish?type=zip` | OneDeploy (ZIP) |
| `POST /api/zipdeploy` | Legacy ZIP deploy |
| `GET /api/vfs/` | Virtual file system (browse files) |
| `GET /api/processes` | Running processes |
| `GET /api/settings` | App settings |
| `GET /api/environment` | Environment variables |

### 8.4 Deployment History & Rollback

**History:**
- Each deployment tracked with: ID, status, timestamp, author, commit message
- Visible in portal Deployment Center → Logs
- Stored in `/home/site/deployments/`

**Rollback options:**
- **Redeploy previous deployment:** Click on a previous deployment in Logs tab → "Redeploy"
- **Git revert:** Push a revert commit to trigger a new deployment
- **Slot swap back:** If using slots, swap the previous slot back to production (instant rollback)
- **Run From Package:** Repoint `WEBSITE_RUN_FROM_PACKAGE` to a previous ZIP URL
- **Manual ZIP deploy:** Re-deploy a previously saved artifact

---

## 9. Platform-Specific Behaviors

### 9.1 Windows vs. Linux Differences

| Aspect | Windows | Linux |
|---|---|---|
| **Build engine** | Kudu (C#-based) | Kudu Lite + Oryx |
| **SCM site** | Same process/sandbox | Separate container |
| **Build customization** | `.deployment` file, MSBuild args | `.deployment`, `PRE/POST_BUILD_COMMAND`, Oryx config |
| **External Git** | ✅ Supported | ❌ Not available |
| **Web Deploy (MSDeploy)** | ✅ Supported | ❌ Not available |
| **ZIP Push Deploy UI (Kudu)** | ✅ Works | ❌ Not supported |
| **Auto-swap** | ✅ Supported | ❌ Not supported for Linux/containers |
| **File system** | Persistent shared storage | Persistent `/home`, ephemeral local storage |
| **Default build content path** | `/home/site/wwwroot` | `/tmp/<uid>` during build (Linux Python), `/home/site/wwwroot` at runtime |
| **.NET framework support** | Full .NET Framework + .NET Core | .NET Core / .NET 6+ only |
| **Supported languages** | .NET, Node.js, PHP, Java, Python | .NET, Node.js, PHP, Java, Python, Ruby, Go |

### 9.2 Container-Based Deployments

**Custom Containers (single container):**
- Set `linuxFxVersion` to `DOCKER|<registry>/<image>:<tag>` (or Windows Containers)
- Configure via Deployment Center: select Container Registry source
- Supports: Azure Container Registry, Docker Hub, private registries
- Webhook-based continuous deployment: registry notifies App Service on image push
- ACR webhook URL: `https://<app>.scm.azurewebsites.net/api/registry/webhook`

**Container configuration settings:**
| Setting | Description |
|---|---|
| `DOCKER_REGISTRY_SERVER_URL` | Registry URL (e.g., `https://myacr.azurecr.io`) |
| `DOCKER_REGISTRY_SERVER_USERNAME` | Registry username (or use MI) |
| `DOCKER_REGISTRY_SERVER_PASSWORD` | Registry password |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | Mount persistent `/home` storage (`true`/`false`) |
| `DOCKER_ENABLE_CI` | Enable continuous deployment webhook |

**Docker Compose (multi-container, Linux only):**
- Set `linuxFxVersion` to `COMPOSE|<base64-encoded-compose-file>`
- Limited Docker Compose support (no volumes, networks, build directives)
- Primary use: sidecar containers

**Windows Containers:**
- Supported on Premium v3 and Isolated v2 pla
- Full Windows Server Core or Nano Server images
- Longer cold start times
- No SSH access (unlike Linux containers)

### 9.3 Static Web Apps vs. App Service

| Feature | Static Web Apps | App Service |
|---|---|---|
| **Use case** | SPAs, static sites, JAMstack | Full-stack apps, APIs, dynamic content |
| **Hosting** | Global CDN edge nodes | Regional App Service Plans |
| **CI/CD** | GitHub Actions built-in (auto-generated) | Deployment Center (configurable) |
| **API support** | Azure Functions (managed) | Full server-side runtime |
| **Custom domains** | Free SSL, auto-managed | Free SSL (App Service Managed cert) or custom |
| **Pricing** | Free tier available | No free tier for production |
| **Auth** | Built-in providers (easy) | More flexible but manual setup |
| **Staging** | Preview environments per PR | Deployment slots |
| **Build** | Oryx in GitHub Actions | Kudu/Oryx or external |

---

## 10. Current UX Pain Points

### 10.1 Deployment Center UX Issues

1. **Inconsistent build provider experience:**
   - GitHub gets a fully generated workflow file with preview → seamless
   - Azure Pipelines just redirects to Azure DevOps → broken flow, user leaves the portal
   - Bitbucket has no build provider choice at all

2. **Authentication confusion:**
   - Three auth methods for GitHub (OIDC, service principal, publish profile) with different security implications
   - Users don't understand what "user-assigned identity" means or why it's better
   - Error messages about insufficient permissions are opaque (need Owner/User Access Admin roles)

3. **Basic auth dependency:**
   - Local Git, Bitbucket, External Git, and FTP all require basic auth
   - Microsoft is pushing to disable basic auth, but many deployment methods break without it
   - The "deploy without basic auth" guidance is scattered and incomplete

4. **Deployment status visibility:**
   - Log integration varies wildly by source type
   - GitHub Actions logs are aggregated from GitHub API — can be slow to populate
   - App Service Build Service logs are in Kudu — different UI, different mental model
   - Azure Pipelines logs are in ADO — completely separate portal
   - No unified deployment status or notification system

5. **Slot management is a separate blade:**
   - Deployment slots are configured under `Deployment > Deployment slots`
   - But deployment source is under `Deployment > Deployment Center`
   - Each slot has its own Deployment Center → confusing navigation
   - Traffic routing and swap operations feel disconnected from the deployment flow

6. **No clear guidance for beginners:**
   - Too many options with no wizard or recommendation engine
   - "Which deployment method should I use?" is the #1 question
   - Decision tree is complex: source type × build provider × deploy mechanism × platform

### 10.2 Common User Confusion Points

1. **"I changed my code but the site doesn't update":**
   - Forgot to enable continuous deployment
   - Pushing to wrong branch (main vs master)
   - `DEPLOYMENT_BRANCH` not set correctly
   - Cached content / CDN issues

2. **"Build automation isn't running for ZIP deploy":**
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` defaults to `false` for ZIP
   - Users expect npm install / pip install to run automatically
   - Git deploy runs build automatically; ZIP does not — inconsistent

3. **"What's the difference between Kudu build and GitHub Actions build?":**
   - Kudu builds happen ON the SCM site (shared resources with the app)
   - GitHub Actions builds happen on GitHub runners (separate compute)
   - If using GitHub Actions as build provider, Kudu build should be OFF
   - Double-building is a real issue if misconfigured

4. **"My swap is slow / my app is down after swap":**
   - No `applicationInitialization` configured → cold instances
   - Slot-specific settings misconfigured → wrong DB connection after swap
   - Managed identity doesn't follow the swap → auth breaks
   - Long-running requests killed during recycle

5. **"Run From Package makes my app read-only":**
   - Apps that write to `wwwroot` (e.g., CMS systems, file uploads) break
   - Not clearly communicated in the portal

### 10.3 Areas Ripe for Modernization

1. **Guided deployment setup wizard** — recommend a deployment method based on:
   - Source (GitHub/ADO/local)
   - Build needs (simple vs. complex)
   - Security requirements (basic auth allowed?)
   - Platform (Windows/Linux/Container)

2. **Unified deployment timeline** — single view showing:
   - All deployments across slots
   - Deployment source, trigger, duration, status
   - Quick rollback action
   - Log drill-down regardless of build provider

3. **Slot-aware deployment flow** — connect slots to the deployment pipeline visually:
   - Show the flow: source → build → staging slot → swap → production
   - Inline traffic percentage controls
   - Swap preview with diff of settings that will change

4. **Smart defaults & validation:**
   - Auto-detect the best deployment method from repo structure
   - Validate workflow files before committing
   - Warn about common misconfigurations (double-build, wrong branch, missing build settings)
   - Pre-flight checks before swap (health endpoint check, settings diff)

5. **First-class container deployment UX:**
   - Currently a separate flow from code deployment
   - No unified view of "what's deployed" for containers
   - Image tag management / rollback is manual
   - No built-in vulnerability scanning integration in the deploy flow

---

## Appendix A: Quick Reference — Deployment Method Decision Matrix

| Scenario | Recommended Method |
|---|---|
| **GitHub repo, simple app** | GitHub Actions (via Deployment Center) |
| **GitHub repo, complex CI/CD** | GitHub Actions (manual workflow) |
| **Azure Repos, enterprise** | Azure Pipelines |
| **Quick deploy from local machine** | ZIP Deploy via `az webapp deploy` |
| **VS Code development** | Azure App Service extension (uses ZIP Deploy) |
| **Visual Studio (.NET)** | Web Deploy (publish profile) |
| **Solo dev, quick iterations** | Local Git |
| **Pre-built artifact, atomic deploy** | Run From Package |
| **Container image** | ACR + Webhook or GitHub Actions |
| **ARM/Bicep/Terraform IaC** | ARM template with `onedeploy` extension + Run From Package |
| **Static content** | Consider Static Web Apps instead |

## Appendix B: Key API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `https://<app>.scm.azurewebsites.net/api/publish?type=zip` | POST | OneDeploy (primary) |
| `https://<app>.scm.azurewebsites.net/api/zipdeploy` | POST | Legacy ZIP deploy |
| `https://<app>.scm.azurewebsites.net/api/wardeploy` | POST | Legacy WAR deploy |
| `https://<app>.scm.azurewebsites.net/api/deployments` | GET | Deployment history |
| `https://<app>.scm.azurewebsites.net/api/deployments/{id}/log` | GET | Deployment log |
| `https://<app>.scm.azurewebsites.net/api/vfs/` | GET | Virtual file system |
| `https://<app>.scm.azurewebsites.net/api/logstream` | GET | Real-time log stream |
| `https://<app>.scm.azurewebsites.net/api/settings` | GET | App settings |
| `https://<app>.scm.azurewebsites.net/api/processes` | GET | Running processes |
| `https://<app>.scm.azurewebsites.net/<app>.git` | Git | Local Git remote |
| `https://<app>.scm.azurewebsites.net/api/registry/webhook` | POST | Container registry webhook |

## Appendix C: ARM Resource Types for Deployment

```
Microsoft.Web/sites/sourcecontrols          — Source control configuration
Microsoft.Web/sites/config (web)            — scmType, deployment branch, runtime
Microsoft.Web/sites/config (appsettings)    — App settings
Microsoft.Web/sites/slots                   — Deployment slots
Microsoft.Web/sites/slots/config            — Slot-specific config
Microsoft.Web/sites/extensions (onedeploy)  — ZIP/WAR/JAR deployment via ARM
Microsoft.Web/sites/basicPublishingCredentialsPolicies — Basic auth enable/disable
Microsoft.Web/sites/config (slotConfigNames) — Which settings are sticky
```

---

*This document synthesizes official Microsoft Learn documentation, Kudu wiki (github.com/projectkudu/kudu), Oryx documentation (github.com/microsoft/Oryx), and operational knowledge from building Azure App Service portal experiences.*
