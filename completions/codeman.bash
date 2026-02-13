#!/usr/bin/env bash

_codeman_complete() {
  local cur prev
  cur="${COMP_WORDS[COMP_CWORD]}"
  prev="${COMP_WORDS[COMP_CWORD-1]}"

  local modes="safe cautious balanced autonomous networked full reckless full-autonomy l1 l2 l3 l4 l5 l6 l7"
  local cmds="help modes aliases version upgrade prefix notify-test resume fork bump completion"
  local opts="--no-notify -N --no-confirm -y"

  if [[ "$prev" == "prefix" ]]; then
    COMPREPLY=( $(compgen -W "show set clear" -- "$cur") )
    return 0
  fi
  if [[ "$prev" == "bump" ]]; then
    COMPREPLY=( $(compgen -W "major minor patch --commit --tag" -- "$cur") )
    return 0
  fi
  if [[ "$prev" == "completion" ]]; then
    COMPREPLY=( $(compgen -W "bash zsh" -- "$cur") )
    return 0
  fi

  if [[ "$cur" == -* ]]; then
    COMPREPLY=( $(compgen -W "$opts" -- "$cur") )
    return 0
  fi

  COMPREPLY=( $(compgen -W "$cmds $modes" -- "$cur") )
}

complete -F _codeman_complete codeman

