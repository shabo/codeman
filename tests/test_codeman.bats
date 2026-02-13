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

