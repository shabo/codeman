#!/usr/bin/env bats

@test "codeman (no args) prints mode picker and does not crash" {
  run ./bin/codeman

  # codeman intentionally exits 2 when no args are provided
  [ "$status" -eq 2 ]

  [[ "$output" == *"Pick a mode explicitly."* ]]
  [[ "$output" == *"Available modes:"* ]]

  # Regression guard for Bash 3.2 + `set -u` empty-array expansion.
  [[ "$output" != *"unbound variable"* ]]
  [[ "$output" != *"PARSED_ARGS[@]"* ]]
}

@test "codeman help prints usage" {
  run ./bin/codeman help
  [ "$status" -eq 0 ]
  [[ "$output" == *"USAGE"* ]]
  [[ "$output" == *"codeman"* ]]
}

@test "codeman completion zsh prints a completion script" {
  run ./bin/codeman completion zsh
  [ "$status" -eq 0 ]
  [[ "$output" == *"#compdef codeman"* ]]
}

@test "codeman mode run works on bash 3.2 (no mapfile) with a stubbed codex" {
  tmp="$(mktemp -d)"
  mkdir -p "$tmp/bin"
  cat >"$tmp/bin/codex" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "STUB CODEX OK"
EOF
  chmod +x "$tmp/bin/codex"

  # Avoid confirmations/notifications; just verify the mode path doesn't crash.
  HOME="$tmp" PATH="$tmp/bin:$PATH" run ./bin/codeman -N -y l3 "hello"
  [ "$status" -eq 0 ]
  [[ "$output" == *"STUB CODEX OK"* ]]
}

@test "codeman sends per-message notifications when CODEMAN_NOTIFY_ON includes message (no jq required)" {
  tmp="$(mktemp -d)"
  mkdir -p "$tmp/bin"
  mkdir -p "$tmp/.codex/sessions/2026/02/13"

  # Stub curl to capture payloads.
  cat >"$tmp/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "curl $*" >> "${HOME}/curl_calls.txt"
exit 0
EOF
  chmod +x "$tmp/bin/curl"

  # Stub codex to write an agent_message line into the session log.
  cat >"$tmp/bin/codex" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
log="${HOME}/.codex/sessions/2026/02/13/stub.jsonl"
printf '%s\n' '{"type":"event_msg","payload":{"type":"agent_message","message":"hello from stub"}}' >> "$log"
sleep 2
EOF
  chmod +x "$tmp/bin/codex"

  HOME="$tmp" PATH="$tmp/bin:$PATH" CODEMAN_NOTIFY_POLL_SEC=1 CODEMAN_NOTIFY_ON=message CODEMAN_DISCORD_WEBHOOK_URL='http://example.invalid' run ./bin/codeman -y l3 "hello"
  [ "$status" -eq 0 ]
  [ -f "$tmp/curl_calls.txt" ]
}
