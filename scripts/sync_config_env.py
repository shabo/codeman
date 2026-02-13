#!/usr/bin/env python3
"""
Sync a codeman config env file (~/.config/codeman/config.env) with the repository
template (config/config.env.example).

Goals:
- Keep the template's structure/comments/order.
- For each KEY defined in the template (commented or not), preserve the user's
  value/commented-state if present; otherwise keep template defaults.
- For keys present in the user's config but not in the template, ask before
  deleting (default: keep).
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as _dt
import difflib
import os
import re
import shutil
import sys
from typing import Dict, List, Optional, Tuple


_ASSIGN_RE = re.compile(r"^\s*(?P<export>export\s+)?(?P<key>[A-Za-z_][A-Za-z0-9_]*)=(?P<val>.*)\s*$")
_COMMENTED_ASSIGN_RE = re.compile(
    r"^\s*#\s*(?P<export>export\s+)?(?P<key>[A-Za-z_][A-Za-z0-9_]*)=(?P<val>.*)\s*$"
)


@dataclasses.dataclass(frozen=True)
class AssignLine:
    key: str
    val: str  # raw RHS, including any quotes
    commented: bool
    exported: bool
    raw: str  # original line


@dataclasses.dataclass(frozen=True)
class TemplateLine:
    raw: str
    assign: Optional[AssignLine] = None


def _mask_value(val: str) -> str:
    v = val.strip()
    if not v:
        return v
    # Keep simple non-secret-ish small values visible; mask URLs/tokens.
    if "http://" in v or "https://" in v or "webhook" in v.lower():
        return "<redacted>"
    if len(v) > 24:
        return v[:3] + "<...>" + v[-3:]
    return v


def _parse_assign(line: str) -> Optional[AssignLine]:
    m = _ASSIGN_RE.match(line)
    if m:
        return AssignLine(
            key=m.group("key"),
            val=m.group("val"),
            commented=False,
            exported=bool(m.group("export")),
            raw=line.rstrip("\n"),
        )
    m = _COMMENTED_ASSIGN_RE.match(line)
    if m:
        return AssignLine(
            key=m.group("key"),
            val=m.group("val"),
            commented=True,
            exported=bool(m.group("export")),
            raw=line.rstrip("\n"),
        )
    return None


def _read_lines(path: str) -> List[str]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().splitlines(True)
    except FileNotFoundError:
        return []


def _parse_template(path: str) -> Tuple[List[TemplateLine], List[str]]:
    raw_lines = _read_lines(path)
    if not raw_lines:
        raise SystemExit(f"Template not found or empty: {path}")

    out: List[TemplateLine] = []
    keys: List[str] = []
    for ln in raw_lines:
        a = _parse_assign(ln)
        out.append(TemplateLine(raw=ln.rstrip("\n"), assign=a))
        if a:
            keys.append(a.key)
    return out, keys


def _parse_user_config(path: str) -> Dict[str, AssignLine]:
    d: Dict[str, AssignLine] = {}
    for ln in _read_lines(path):
        a = _parse_assign(ln)
        if not a:
            continue
        # Last one wins (common shell behavior).
        d[a.key] = a
    return d


def _render_assign(key: str, val: str, commented: bool, exported: bool) -> str:
    prefix = ""
    if commented:
        prefix = "# "
    exp = "export " if exported else ""
    return f"{prefix}{exp}{key}={val}".rstrip()


def _prompt_choice(prompt: str, choices: Dict[str, str], default_key: str) -> str:
    # choices: key -> label
    keys = "/".join([k.upper() if k == default_key else k for k in choices.keys()])
    while True:
        sys.stderr.write(f"{prompt} [{keys}]: ")
        sys.stderr.flush()
        ans = sys.stdin.readline()
        if not ans:
            return default_key
        ans = ans.strip().lower()
        if not ans:
            return default_key
        if ans in choices:
            return ans
        sys.stderr.write(f"Invalid choice: {ans}\n")


def _backup_file(path: str) -> Optional[str]:
    if not os.path.exists(path):
        return None
    ts = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    bak = f"{path}.bak.{ts}"
    shutil.copy2(path, bak)
    return bak


def _compute_new_content(
    template_lines: List[TemplateLine],
    template_keys: List[str],
    user: Dict[str, AssignLine],
    keep_unknown_keys: List[str],
) -> List[str]:
    template_keyset = set(template_keys)
    keep_unknown_set = set(keep_unknown_keys)

    rendered: List[str] = []
    for t in template_lines:
        if not t.assign:
            rendered.append(t.raw)
            continue

        key = t.assign.key
        # Pull user override if available; else template default.
        if key in user:
            u = user[key]
            rendered.append(_render_assign(key, u.val, u.commented, u.exported))
        else:
            rendered.append(_render_assign(key, t.assign.val, t.assign.commented, t.assign.exported))

    # Append unknown keys we decided to keep.
    unknown_kept = [k for k in user.keys() if k not in template_keyset and k in keep_unknown_set]
    if unknown_kept:
        rendered.append("")
        rendered.append("# --- User-defined (not in template) ---")
        for k in sorted(unknown_kept):
            u = user[k]
            rendered.append(_render_assign(k, u.val, u.commented, u.exported))

    # Ensure newline at EOF.
    return [ln + "\n" for ln in rendered]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", default="config/config.env.example")
    ap.add_argument("--config", default=os.path.expanduser("~/.config/codeman/config.env"))
    ap.add_argument("--dry-run", action="store_true", help="Don't write, just report what would change.")
    ap.add_argument(
        "--show-diff",
        action="store_true",
        help="Print a unified diff to stdout (may include secrets).",
    )
    ap.add_argument(
        "--non-interactive",
        action="store_true",
        help="Never prompt; keep unknown keys (no deletions).",
    )
    args = ap.parse_args()

    template_lines, template_keys = _parse_template(args.template)
    template_keyset = set(template_keys)
    user = _parse_user_config(args.config)

    unknown_keys = sorted([k for k in user.keys() if k not in template_keyset])
    keep_unknown: List[str] = unknown_keys[:]  # default: keep all

    if unknown_keys and not args.non_interactive:
        sys.stderr.write("Found keys in your config that are not in the template:\n")
        for k in unknown_keys:
            sys.stderr.write(f"  - {k}={_mask_value(user[k].val)}\n")

        choice = _prompt_choice(
            "Delete unknown keys not present in the template?",
            choices={"k": "keep all", "d": "delete all", "i": "decide one-by-one"},
            default_key="k",
        )
        if choice == "d":
            keep_unknown = []
        elif choice == "i":
            keep_unknown = []
            for k in unknown_keys:
                c = _prompt_choice(
                    f"Keep {k}?",
                    choices={"y": "keep", "n": "delete"},
                    default_key="y",
                )
                if c == "y":
                    keep_unknown.append(k)
        else:
            keep_unknown = unknown_keys[:]

    old_lines = _read_lines(args.config)
    new_lines = _compute_new_content(template_lines, template_keys, user, keep_unknown)

    changed = old_lines != new_lines
    if not changed:
        sys.stderr.write("No changes needed.\n")
        return 0

    if args.show_diff:
        diff = difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=args.config,
            tofile=f"{args.config} (synced)",
            lineterm="",
        )
        for ln in diff:
            print(ln)

    if args.dry_run:
        sys.stderr.write("Dry run: config would be updated.\n")
        return 0

    os.makedirs(os.path.dirname(args.config), exist_ok=True)
    bak = _backup_file(args.config)
    with open(args.config, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    if bak:
        sys.stderr.write(f"Updated {args.config} (backup: {bak}).\n")
    else:
        sys.stderr.write(f"Created {args.config}.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

