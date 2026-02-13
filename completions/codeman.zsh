#compdef codeman

_codeman() {
  local -a modes cmds
  modes=(
    safe cautious balanced autonomous networked full reckless full-autonomy
    l1 l2 l3 l4 l5 l6 l7
  )
  cmds=(
    help modes aliases version upgrade prefix notify-test resume fork bump completion
  )

  local -a common_opts
  common_opts=(
    '--no-notify[Disable Slack/Discord notifications]'
    '-N[Disable Slack/Discord notifications]'
    '--no-confirm[Skip press-Enter confirmation]'
    '-y[Skip press-Enter confirmation]'
  )

  _arguments -s -S \
    $common_opts \
    '1:cmd_or_mode:->first' \
    '*::args:->rest'

  case "$state" in
    first)
      _values 'codeman' $cmds $modes
      return
      ;;
    rest)
      local first="${words[2]}"
      case "$first" in
        prefix)
          _values 'prefix action' show set clear
          return
          ;;
        bump)
          _values 'bump kind' major minor patch
          return
          ;;
        completion)
          _values 'shell' zsh bash
          return
          ;;
      esac
      ;;
  esac
}

compdef _codeman codeman

