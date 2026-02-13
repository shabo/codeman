.PHONY: help config-sync config-sync-dry config-sync-diff

help:
	@echo "Targets:"
	@echo "  make config-sync        Sync ~/.config/codeman/config.env with config/config.env.example (prompts on deletions)"
	@echo "  make config-sync-dry    Same as config-sync, but doesn't write"
	@echo "  make config-sync-diff   Print a diff of the proposed changes (may include secrets)"

config-sync:
	@python3 scripts/sync_config_env.py --template config/config.env.example --config "$$HOME/.config/codeman/config.env"

config-sync-dry:
	@python3 scripts/sync_config_env.py --template config/config.env.example --config "$$HOME/.config/codeman/config.env" --dry-run

config-sync-diff:
	@python3 scripts/sync_config_env.py --template config/config.env.example --config "$$HOME/.config/codeman/config.env" --dry-run --show-diff

