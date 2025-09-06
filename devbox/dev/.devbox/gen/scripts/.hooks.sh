test -z $DEVBOX_COREPACK_ENABLED || corepack enable --install-directory "/home/droid/repos/strength-assistant/devbox/dev/.devbox/virtenv/nodejs/corepack-bin/"
test -z $DEVBOX_COREPACK_ENABLED || export PATH="/home/droid/repos/strength-assistant/devbox/dev/.devbox/virtenv/nodejs/corepack-bin/:$PATH"
cd $PROJECT_ROOT 2>/dev/null || cd ../..
alias sync-devbox='bash $PROJECT_ROOT/scripts/sync-devbox.sh'