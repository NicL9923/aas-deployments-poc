# Sol's Thoughts — AAS Deployments POC

> Running notes, analysis, and opinions from your friendly neighborhood AI collaborator.

---

## Initial Impressions (2026-03-19)

### The Azure Portal Deployment UX Is Overdue for a Rethink

Let's be honest: the Azure Portal's Deployment Center was designed in an era when "CI/CD" meant "maybe Jenkins." The world has moved on. GitHub Actions is the default for most developers. Preview environments are table stakes. Yet the portal still asks you to choose between a dropdown of build providers like it's 2018.

### What I Think We Should Aim For

**1. GitHub-first, not source-agnostic — but nothing disappears**

The current UX treats GitHub, Azure DevOps, Bitbucket, Local Git, and External Git as equals in a flat dropdown. In reality, ~70%+ of new App Service deployments connect to GitHub. The UX should reflect this — make GitHub the hero path with a polished, opinionated flow. Other sources should be accessible but not competing for attention on the same screen.

**Important constraint:** This is a UX-only redesign — no backend changes, and all existing deployment methods must remain accessible. We're curating the experience, not cutting features. Think "smart defaults + progressive disclosure" — FTP and External Git are still there, just not on the front page. This actually makes the design challenge more interesting: how do you make a screen feel clean and modern while still exposing 10+ deployment methods?

**2. Real-time everything**

The current deployment experience is essentially a form you fill out, and then you go look at logs separately. A modern deployment UX should show:
- Live build progress (streaming, not "click refresh")
- Deployment status at a glance (not hidden in a logs tab)
- Clear success/failure states with actionable next steps

**3. Slots as a first-class visual concept**

Deployment slots are one of App Service's best features, but the UX makes them feel like an afterthought. You manage slots in a separate blade, swap with a modal that's mostly text, and traffic routing is buried in settings. Slots should be visual — think a lane/swimlane view where you can see all slots, their current deployment, and drag-to-swap or one-click promote.

**4. Progressive disclosure over kitchen-sink**

The current UX dumps every option on you at once. A better approach:
- **Simple path**: Connect GitHub repo → pick branch → deploy. Done.
- **Advanced path**: Build configuration, environment variables, slot settings, deployment rules — available but not in your face.

**5. Deployment history as a timeline, not a table**

The current logs tab shows a flat list of deployments. A timeline view — showing deployments, slot swaps, configuration changes, and incidents — would give operators a much clearer picture of "what happened to my app."

### Technical Considerations for the POC

- We should mock the Azure Portal chrome (top nav, left nav, breadcrumbs, resource header) at a fidelity level that makes the POC feel real without burning time on pixel-perfect portal replication.
- Use Fluent UI v9 since that's our team's standard and it's the closest to the actual portal design system (though the portal uses a customized older version).
- Mock data should feel realistic — real-looking resource names, deployment timestamps, GitHub repos, commit messages.
- The POC should be interactive enough to demo click-through flows, not just static screens.

### Questions I'm Thinking About

- How much of the "Deployment Center" concept do we keep vs. rethink entirely? Is it one blade or multiple?
- Should deployment slots be integrated into the deployment view or remain separate?
- How do we handle the Windows vs. Linux divergence cleanly in the UX?
- Container deployments are a whole different animal — do we tackle that in this POC or scope it out?
- What about the relationship between deployment and "Configuration" (app settings, connection strings)? Deployments often fail because of config, but those are separate blades today.

### What I Need From Nicolas

- Screenshots of the current portal experience (every deployment-related screen/state)
- Clarification on scope: Are we covering just the "Deployment Center" or also Slots, Configuration, and related blades?
- Any existing design direction or stakeholder feedback to incorporate
- Priority: breadth (cover all deployment methods) vs. depth (nail the GitHub Actions flow)?

---

## Research Notes

_Will be updated as I dig deeper into the deployment APIs and behaviors._

---

## Design Iterations

_Will track design decisions and rationale as we iterate._
