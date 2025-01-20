#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "Notrans" ]]; then
  # Don't build
  echo "🛑 - Build was cancelled because branch is $VERCEL_GIT_COMMIT_REF"
  exit 0
else
  echo "✅ - Target branch is $VERCEL_GIT_COMMIT_REF, so build can proceed"
    exit 1
fi