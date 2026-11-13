#!/usr/bin/env bash
# Quick read-only health check: load, memory, disks, containers, certificates and,
# once PLAR_DOMAIN is set, the PLAR site. Exit code 1 if any check fails.
set -u
. "$(dirname "$0")/common.sh"

ssh "${SSH_OPTS[@]}" "$TARGET" true 2>/dev/null || { key_help; exit 1; }
result=$(remote check "export PLAR_DOMAIN='${PLAR_DOMAIN//\'/}'")
echo "$result"
echo "$result" | grep -q '^SUMMARY 0 fail' || exit 1
