# Portal Chrome — Anatomy Reference

> Reference for mocking the Azure Portal shell in our POC.
> Based on screenshot of `nl-testwebapp-1` Overview blade (2026-03-19).

---

## Layout Zones (top → bottom, left → right)

### 1. Top Bar (dark blue, ~40px tall)

| Element | Position | Notes |
|---------|----------|-------|
| Waffle menu (⠿) | Far left | Microsoft Cloud menu — 9-dot grid icon |
| Hamburger (☰) | After waffle | "Show portal menu" — toggles global left nav |
| "Microsoft Azure (Preview)" | After hamburger | Product title, links to #home |
| Search bar | Center | `Search resources, services, and docs (G+/)` — has Copilot icon to left, full-width feel |
| Copilot button | Right of search | Purple icon + "Copilot" label |
| More tools (...) | Right area | Cloud Shell, notifications, settings, etc. |
| User avatar | Far right | Profile photo, circular |

**Colors:** Background `#0078d4` (Azure blue), white text, search bar is white with dark text.

### 2. Breadcrumb Bar (~30px, light gray)

- Simple text: `Home` (or `Home > Resource Group > Resource`)
- Light gray background, small font

### 3. Resource Header (~60px)

| Element | Position | Notes |
|---------|----------|-------|
| Resource icon | Far left | Circular icon matching resource type |
| Resource name | After icon | Large bold text: `nl-testwebapp-1` |
| Resource type | Below name | Small gray: `Web App` |
| Pin (📌) | Right of name | Pin to dashboard |
| Favorite (☆) | After pin | Star/favorite toggle |
| More (...) | After star | Context menu |
| Close (✕) | Far right | Closes the blade |

### 4. Left Navigation (~240px wide)

**Top controls:**
- Search box (with magnifying glass icon)
- Settings gear icon + collapse chevrons (‹‹)

**Menu structure (for App Service):**
```
Overview                          (icon: compass/grid)
Activity log                     (icon: document)
Access control (IAM)             (icon: shield)
Tags                             (icon: tag)
Diagnose and solve problems      (icon: stethoscope)
Microsoft Defender for Cloud     (icon: shield+check)
Events (preview)                 (icon: lightning bolt)
Resource visualizer              (icon: diagram)

▼ Deployment                     (collapsible section)
    Deployment slots             (icon: layers)
    Deployment Center            (icon: circular arrows)

▶ Settings                       (collapsed)
▶ Performance                    (collapsed)
▶ App Service plan               (collapsed)
▶ Development Tools              (collapsed)
▶ API                            (collapsed)
▶ Monitoring                     (collapsed)
▶ Automation                     (collapsed)
▶ Support + troubleshooting      (collapsed)
```

**Style:** White background, items ~32px tall, icons 16px, active item has left blue border + bold text.

### 5. Content Area (fills remaining space)

**Sub-zones:**

#### 5a. Toolbar (~40px)
Horizontal button row: `Browse | Stop | Swap | Restart | Delete | Refresh | Download publish profile | ...`
- Icon + text for each button
- Gray background, separated by thin vertical dividers
- Overflow menu (...) at end

#### 5b. Essentials Panel (collapsible)
- Toggle: `∧ Essentials` header with View Cost / JSON View links at right
- Two-column key-value grid:
  - Left: Resource group, Status, Location, Subscription, Subscription ID, Tags
  - Right: Default domain, App Service Plan, Operating System, Health Check
- Values are either plain text or blue links

#### 5c. Tabbed Content
Tabs: `Properties | Monitoring | Logs | Capabilities | Notifications (0) | Recommendations`
- Underline-style active tab indicator
- Content below varies per tab

### 6. Bottom Bar (~20px)
- Hint text: `Add or remove favorites by pressing Ctrl+Shift+F`
- Very subtle, light gray

---

## Mock Fidelity Guidance

For the POC, we need **medium fidelity** — enough to feel like the real portal so stakeholders can evaluate the deployment UX in context, but not pixel-perfect.

**Must mock (structural):**
- Top bar with Azure branding and search (non-functional)
- Breadcrumb
- Resource header with resource name/type
- Left nav with Deployment section expanded (clickable to switch between our two views)
- Toolbar
- Content area

**Can simplify:**
- Waffle menu, Copilot button, user avatar → static icons, no interaction
- Essentials panel → static mock data
- Non-deployment left nav items → visible but disabled/non-functional
- Bottom bar → skip entirely

**Skip entirely:**
- Global left nav (hamburger menu)
- Notifications panel
- Cloud Shell
- Settings/preferences
