set -e

if [ -z "$__DEVBOX_SKIP_INIT_HOOK_b24fe463b612d47a5dd55b7d14eb6c908a024328c178daf08f77c3ed16779bde" ]; then
    . "/home/droid/repos/strength-assistant/devbox/dev/.devbox/gen/scripts/.hooks.sh"
fi

../../scripts/test.sh
