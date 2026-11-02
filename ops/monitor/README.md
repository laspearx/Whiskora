# Project HQ monitor

Outside watcher for the projects' public sites → Discord (per project: `#<project>-alerts`, `#<project>-releases`).
Design, costs, state, install steps and open decisions: `docs/OPS_DISCORD_MONITORING.md`. No dependencies (Node ≥ 20).
Meant to live in the private repo `project-hq-ops`; not merged into Whiskora.

```bash
node --test ops/monitor/test/*.test.mjs                    # mock tests, no network
node ops/monitor/src/cli.mjs                               # preview: real GETs of public pages, prints, writes NOTHING
node ops/monitor/src/cli.mjs --trial-state /tmp/trial.json # trial: advances a separate state file, posts nothing
MONITOR_SEND=1 node ops/monitor/src/cli.mjs --state s.json --send [--first-run]   # runtime only
```

Add a project: `projects/<id>.json` with its own `routes` (`enabled: false` until its URLs are known). Never put a
webhook URL in a file.
