# Forge Companion — user guide

**Version 1.0.0 · PolyForm Noncommercial 1.0.0**

The Forge system in your pocket: the build queue, the state, the kit dependency graph and the repo
fleet, in one offline page. No accounts, no network, no telemetry.

This is **Forge tooling, not a product app** — it is the console the system's own operator carries.

Open it: <https://drsamonline.github.io/app-companion-forge/>

## What you get on opening it

- **A summary** — items done, queue remaining, kits live, fleet size, average conformance score,
  blocked items.
- **The build queue** — every item with its kit dependencies, its status, and whether it is runnable
  right now.
- **The kit graph** — each kit with its consumer apps.
- **The repo fleet** — role, conformance score and visibility.

Search any view, export it to CSV, switch language (English / हिन्दी / ગુજરાતી) and theme.

## Why a console rather than a dashboard

A dashboard is read; a console is used while deciding what to do next. The queue view exists to
answer one question — *what can I start now* — which is why it shows dependencies and runnability
beside each item rather than a chart of progress.

## Everything is local

The app never calls the network. The data it reads ships with it, so the console works on a plane, in
a basement, and when the Wi-Fi in a canteen drops — which is the same reasoning behind the rest of
this estate's offline-first apps.

## Licence

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).
