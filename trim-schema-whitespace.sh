#!/bin/bash

# Script to trim trailing whitespace from schema.prisma file

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Error: $SCHEMA_FILE not found"
    exit 1
fi

# Trim trailing whitespace using sed
sed -i '' 's/[[:space:]]*$//' "$SCHEMA_FILE"

echo "Trailing whitespace trimmed from $SCHEMA_FILE"