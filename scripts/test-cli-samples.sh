#!/bin/bash
set -e

# Ensure we are in the repo root
cd "$(dirname "$0")/.."

# Build the CLI
echo "Building CLI..."
cd packages/language
pnpm build:cli
cd ../..

CLI_PATH="packages/language/out/cli/index.js"
SAMPLES_DIR="code_samples"
CONFIG_DIR="$SAMPLES_DIR/.pliplugin"

# Create config directory
mkdir -p "$CONFIG_DIR"

# Create proc_grps.json
cat > "$CONFIG_DIR/proc_grps.json" <<EOF
{
  "pgroups": [
    {
      "name": "default",
      "compiler-options": [],
      "pli-options": {},
      "libs": ["preprocessor"],
      "include-extensions": [".pli"]
    }
  ]
}
EOF

# Create pgm_conf.json
# We use a glob pattern to match all pli files in preprocessor directory
cat > "$CONFIG_DIR/pgm_conf.json" <<EOF
{
  "pgms": [
    {
      "program": "preprocessor/*.pli",
      "pgroup": "default"
    }
  ]
}
EOF

# Run CLI on samples
echo "Running CLI on code_samples/preprocessor/include.pli..."
node "$CLI_PATH" -i "$SAMPLES_DIR/preprocessor/include.pli" -o "$SAMPLES_DIR/preprocessor/include.out.pli"

# Check output (optional, just ensuring it ran is a good start)
if [ -f "$SAMPLES_DIR/preprocessor/include.out.pli" ]; then
    echo "Success: Output file generated."
    # cat "$SAMPLES_DIR/preprocessor/include.out.pli"
else
    echo "Error: Output file not generated."
    exit 1
fi

# Cleanup
rm -rf "$CONFIG_DIR"
rm -f "$SAMPLES_DIR/preprocessor/include.out.pli"

echo "Done."
