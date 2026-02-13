# Codeman Flow (Modes + Confirmation + Notifications)

```mermaid
flowchart TD
  U[User] -->|runs| T[Terminal]
  T --> C[Codeman (launcher)]

  C -->|no args| ML[Print modes + notify status]
  ML --> U

  C -->|explicit mode (l1..l7)| P[Pre-run confirmation panel]
  P -->|Enter| X[Codex CLI]

  C -->|resume/fork| X

  C -->|spawns monitor (if webhook configured + curl available)| M[Session log monitor]
  X --> S[(~/.codex/sessions/...jsonl)]
  M --> S

  M -->|wait/complete signals| W[Webhook POST]
  W --> D[Discord]
  W --> SL[Slack]

  X -->|executes| SH[Shell commands]
  SH --> FS[(Filesystem / Workspace)]

  %% Legend
  subgraph Legend
    L1[Confirmation panel appears only for explicit modes in a TTY]
    L2[Notify status is printed consistently (and included in panel)]
    L3[Slack and Discord are optional targets]
  end
