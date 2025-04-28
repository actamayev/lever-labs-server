#!/bin/bash

# This script will find all instances of res.status(400).json({ message: ... }) that don't already 
# have as MessageResponse and fix them
# It will also make sure all files have the import for MessageResponse

# Find files with message responses that don't have type assertion
find_cmd="find ./src -name \"*.ts\" -type f -exec grep -l \"res.status(400).json({ message:\" {} \\;"
files=$(eval $find_cmd | xargs cat | grep -v "as MessageResponse" | cut -d':' -f1 | sort | uniq)

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
  
  # Update all instances of res.status(400).json({ message: ... }) that don't have as MessageResponse
  perl -i -pe 's/(res\.status\(400\)\.json\(\{ message: "(.*?)".*?\})(?!\s*as)/$1 as MessageResponse/g' "$file"
done

echo "All files updated!"