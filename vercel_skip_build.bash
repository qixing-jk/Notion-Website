#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"
if [[ "$VERCEL_GIT_COMMIT_REF" == "Notrans" ]]; then
  echo "🛑 - Build was cancelled, branch is $VERCEL_GIT_COMMIT_REF"
  exit 0
fi