# Codeman 🤖💻🔥

![Codeman Logo](assets/logo.png)

Codeman is a thin launcher around `codex` that makes permission level selection explicit and fast.

## Security Levels (low risk -> high risk) 🚨

- `l1` / `safe` 🟢: read-only sandbox + strict approvals
- `l2` / `cautious` 🟢: workspace-write + strict approvals
- `l3` / `balanced` 🟡: workspace-write + on-request approvals
- `l4` / `autonomous` 🟡: workspace-write + on-failure approvals
- `l5` / `networked` 🟠: l4 + network access
- `l6` / `full` 🔴: danger-full-access + no approvals
- `l7` / `reckless` 🚨: bypass sandbox + bypass approvals

High-risk levels can execute destructive commands including file deletions.

## Quick Start 🚀

### One-command remote install

```bash
curl -fsSL https://raw.githubusercontent.com/shabo/codeman/main/install.sh | bash -s -- --repo https://github.com/shabo/codeman.git
```

### Local install from this checkout

```bash
./install.sh --local
source ~/.zshrc
```

## Usage

### Interactive mode picker (no args)

```bash
codeman
```

- With `fzf`: pick mode using arrow keys + Enter
- Without `fzf`: type mode name (`l1`..`l7`, `safe`, `full-autonomy`, etc.)

### Common commands

```bash
codeman help
codeman modes
codeman l1
codeman full autonomy "clean up temp files"
codeman resume l3 --last
codeman fork l6 --last
codeman prefix
codeman prefix set "MBP-Blue"
codeman version
codeman upgrade
```

### Disable notifications for one run

```bash
codeman --no-notify l6
# short flag
codeman -N l4
```

## Slack/Discord Notifications 🔔

If Slack or Discord webhook is configured, Codeman can notify when:

- input/approval is likely needed (`SandboxDenied`, permission issues)
- task completes

### Configure

```bash
export CODEMAN_SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'
export CODEMAN_DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'
```

Optional controls:

```bash
export CODEMAN_NOTIFY_PREFIX='MBP-Blue'
export CODEMAN_NOTIFY_HOST_CODENAME='MBP-Blue'
export CODEMAN_NOTIFY_PROJECT_CODENAME='HiveCore'
export CODEMAN_NOTIFY_ON='wait,complete'
export CODEMAN_NOTIFY_COOLDOWN_SEC=30
export CODEMAN_NOTIFY_DISABLED=1
```

### Prefix command

```bash
codeman prefix
codeman prefix set "MBP-Blue"
codeman prefix clear
```

Prefix behavior:

- Notification prefix defaults to host name
- If `codeman prefix set ...` was used, saved prefix is used first
- If unset, `CODEMAN_NOTIFY_HOST_CODENAME` is used
- Project label uses `CODEMAN_NOTIFY_PROJECT_CODENAME`, otherwise git repository name

Notification format is:

```text
🚨 <prefix-or-hostname> 📁 <project-codename-or-repo> ⏳ Codeman is waiting for your input/approval
```

Manual test:

```bash
codeman notify-test
```

If no webhook is configured, Codeman prints:

```text
ℹ️ No Slack/Discord integration configured. There won't be notifications.
```

If webhook is configured but notifications are suppressed (`-N` or `CODEMAN_NOTIFY_DISABLED=1`), Codeman prints:

```text
🔕 Webhook is configured, but notifications are disabled (--no-notify/-N or CODEMAN_NOTIFY_DISABLED=1).
```

## Upgrade

```bash
codeman upgrade
```

`codeman upgrade` pulls from `origin` on the current branch and reapplies local install wiring.

## Repo Layout

- `bin/codeman`: main command
- `bin/codeman-install`: idempotent zsh wiring tool
- `bin/codeman-aliases.zsh`: optional aliases
- `install.sh`: bootstrap installer
- `VERSION`: current release version
