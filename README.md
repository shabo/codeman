# Codeman 🤖💻🔥

<p align="center">
  <img src="assets/logo.png" alt="Codeman Logo" width="50%" />
</p>

<p align="center">
  <a href="https://codeman.elderberry.games"><kbd>🌐 codeman.elderberry.games</kbd></a>
</p>

<p align="center">
  <a href="https://github.com/sponsors/shabo">
    <img
      alt="Sponsor on GitHub"
      src="https://img.shields.io/badge/GitHub-Sponsor-ff4d6d?logo=githubsponsors&logoColor=white"
    />
  </a>
  <a href="https://www.patreon.com/shabers">
    <img
      alt="Support on Patreon"
      src="https://img.shields.io/badge/Patreon-Support-FF424D?logo=patreon&logoColor=white"
    />
  </a>
</p>

Codeman is a thin launcher around `codex` that makes permission level selection explicit and fast.

## Support

- GitHub Sponsors: https://github.com/sponsors/shabo
- Patreon: https://www.patreon.com/shabers

## Security Levels (low risk -> high risk) 🚨

| Level | Name | Risk | Description |
| --- | --- | --- | --- |
| `l1` | `safe` | 🟢 | read-only sandbox + strict approvals |
| `l2` | `cautious` | 🟢 | workspace-write + strict approvals |
| `l3` | `balanced` | 🟡 | workspace-write + on-request approvals |
| `l4` | `autonomous` | 🟡 | workspace-write + on-failure approvals |
| `l5` | `networked` | 🟠 | `l4` + network access |
| `l6` | `full` | 🔴 | danger-full-access + no approvals |
| `l7` | `reckless` | 🚨 | bypass sandbox + bypass approvals |

High-risk levels can execute destructive commands including file deletions.

## Quick Start 🚀

### One-command remote install

```bash
curl -fsSL https://raw.githubusercontent.com/shabo/codeman/main/install.sh | bash -s -- --repo https://github.com/shabo/codeman.git
```

### Local install from this checkout

```bash
git clone https://github.com/shabo/codeman.git
cd codeman
./install.sh --local
source ~/.zshrc
```

## Usage

### Default mode (no args)

```bash
codeman
```

- Prints the mode list and asks you to choose explicitly

### Common commands

```bash
codeman help
codeman modes
codeman l1
codeman full autonomy "clean up temp files"
codeman resume l3 --last
codeman resume l3 019c5410-c382-7551-a290-6cd52a31c9dc
codeman fork l6 --last
codeman -y l3 "skip the press-Enter confirmation"
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

### Step-by-step setup

1. Create a webhook URL
   - Slack: create an Incoming Webhook and copy the webhook URL
   - Discord: create a Webhook for a channel and copy the webhook URL
2. Add the webhook URL to your shell environment
   - Slack:
     ```bash
     export CODEMAN_SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'
     ```
   - Discord:
     ```bash
     export CODEMAN_DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'
     ```
3. Persist it so it works in every terminal
   - Add the `export ...` line(s) to `~/.zshrc` (or `~/.bashrc`)
   - Then reload your shell:
     ```bash
     source ~/.zshrc
     ```
4. Verify it works
   ```bash
   codeman notify-test
   ```
   - If you see `ℹ️ No Slack/Discord integration configured...`, your env var is not set in this shell.
   - If you see `🔕 Webhook is configured, but notifications are disabled...`, remove `-N` or unset `CODEMAN_NOTIFY_DISABLED`.
5. Choose when notifications should fire (optional)
   ```bash
   export CODEMAN_NOTIFY_ON='wait,complete'
   ```
6. Customize the label (optional)
   ```bash
   export CODEMAN_NOTIFY_PREFIX='MBP-Blue'
   export CODEMAN_NOTIFY_PROJECT_CODENAME='HiveCore'
   ```
7. Disable notifications
   - One run:
     ```bash
     codeman -N l3
     ```
   - Globally:
     ```bash
     export CODEMAN_NOTIFY_DISABLED=1
     ```

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

## Version Bumping

Codeman uses the `VERSION` file for `codeman version`.

## Releases (Tags)

This repo can auto-create a tag and GitHub Release on merge to `main` if `VERSION` was bumped.

Workflow:

1. Bump the version in your branch:
   ```bash
   codeman bump patch
   ```
2. Commit the `VERSION` change as part of your PR.
3. Merge the PR to `main`.
4. GitHub Actions will run CI, then create/push a tag like `v0.1.1` and create a GitHub Release (if the tag does not already exist).

### Bump version (SemVer)

```bash
codeman bump patch
codeman bump minor
codeman bump major
```

### Bump + commit + tag

```bash
codeman bump patch --commit --tag
```

This will:

- update `VERSION`
- create a git commit
- create an annotated tag like `v0.1.1`

## Shell Completion

Generate a completion script and add it to your shell config.

### zsh

```bash
codeman completion zsh > ~/.codeman-completion.zsh
echo 'source ~/.codeman-completion.zsh' >> ~/.zshrc
source ~/.zshrc
```

### bash

```bash
codeman completion bash > ~/.codeman-completion.bash
echo 'source ~/.codeman-completion.bash' >> ~/.bashrc
source ~/.bashrc
```

## Repo Layout

- `bin/codeman`: main command
- `bin/codeman-install`: idempotent zsh wiring tool
- `bin/codeman-aliases.zsh`: optional aliases
- `install.sh`: bootstrap installer
- `VERSION`: current release version
