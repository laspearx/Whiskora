# Project HQ monitor

Outside watcher for the projects' public sites → Discord (`#alerts`, `#releases`). Design, costs, install steps and
open decisions: `docs/OPS_DISCORD_MONITORING.md`. No dependencies (Node ≥ 20).

```bash
node --test ops/monitor/test/*.test.mjs                 # mock tests, no network
node ops/monitor/src/cli.mjs --state /tmp/s.json         # dry run: real GETs of public pages, prints, posts nothing
MONITOR_SEND=1 node ops/monitor/src/cli.mjs --send …     # real posts — runtime only, webhook URLs from its secrets
```

Add a project: `projects/<id>.json` (`enabled: false` until its URLs are known). Never put a webhook URL in a file.
