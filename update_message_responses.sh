#!/bin/bash

# This script will find all instances of res.status(400).json({ message: ... }) and replace them
# with res.status(400).json({ message: ... } as MessageResponse)
# It will also add the import for MessageResponse if needed

# Find all .ts files that contain the pattern but don't already have MessageResponse
find_pattern="res.status(400).json({ message:"
exception_pattern="as MessageResponse"

# Find all files with the pattern
files=$(find ./src -name "*.ts" -type f -exec grep -l "$find_pattern" {} \; | xargs grep -L "$exception_pattern" || true)

if [ -z "$files" ]; then
  echo "No files found that need updating"
  exit 0
fi

echo "Found files to update:"
echo "$files"

# For each file
for file in $files; do
  echo "Processing $file"
  
  # Check if the file already imports MessageResponse
  if ! grep -q "import.*MessageResponse.*from.*@bluedotrobots/common-ts" "$file"; then
    # Check if the file already imports from common-ts
    if grep -q "import.*from.*@bluedotrobots/common-ts" "$file"; then
      # Add MessageResponse to existing import
      sed -i '' -E 's/import \{(.*)\} from "@bluedotrobots\/common-ts"/import \{\1, MessageResponse\} from "@bluedotrobots\/common-ts"/' "$file"
    else
      # Add new import statement at the top of the file, after existing imports
      first_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ ! -z "$first_import_line" ]; then
        sed -i '' "${first_import_line}a\\
import { MessageResponse } from \"@bluedotrobots/common-ts\"" "$file"
      else
        # No imports found, add at the beginning of the file
        sed -i '' '1i\\
import { MessageResponse } from "@bluedotrobots/common-ts"
' "$file"
      fi
    fi
  fi
  
  # Update all instances of res.status(400).json({ message: ... }) to include as MessageResponse
  sed -i '' -E 's/res\.status\(400\)\.json\(\{ message: "(.*)" \}\)/res.status\(400\).json\({ message: "\1" \} as MessageResponse)/g' "$file"
done

echo "All files updated!"