#!/bin/bash
# Generate a test API key and seed it into local D1
set -e

API_KEY="test-key-$(openssl rand -hex 16)"
KEY_HASH=$(echo -n "$API_KEY" | shasum -a 256 | cut -d' ' -f1)

echo "API Key (save this): $API_KEY"
echo "Key Hash: $KEY_HASH"

npx wrangler d1 execute alt-text-db --local \
  --command "INSERT INTO api_keys (id, key_hash, name, daily_limit) VALUES ('test-user', '$KEY_HASH', 'local-test', 50)"

echo "Seeded into local D1 successfully."
