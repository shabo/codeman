# Codeman Docs

This folder contains the static website published via GitHub Pages.

## Notifications Config

Codeman loads configuration from:

- Shell environment variables (for example in `~/.zshrc` or `~/.bashrc`)
- `~/.config/codeman/config.env` (sourced automatically by `codeman`; override dir with `CODEMAN_CONFIG_DIR`)

Template for `config.env` lives in the repo:

- `config/config.env.example`

To sync a local `~/.config/codeman/config.env` with template updates (adds new keys, prompts before deleting unknown keys):

```bash
make config-sync
```

Note: `make config-sync-diff` prints a diff that may include secrets (webhook URLs).

