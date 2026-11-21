# Config Env Sync (Template → Local)

```mermaid
flowchart TD
  T[config/config.env.example<br/>Repo template] -->|make config-sync| S[scripts/sync_config_env.py]
  S -->|reads existing (if present)| C[(~/.config/codeman/config.env)]
  S -->|writes updated file<br/>keeps template order/comments| C
  S -->|optional: dry-run/diff| O[stdout / diff output]

  %% Legend / Notes
  subgraph Notes
    N1[Unknown keys in local config: prompt before deletion (default keep)]
    N2[Diff output may include secrets (webhook URLs)]
  end
```

