#!/bin/bash

# This script will find all instances of res.status(400).json({ validationError: ... }) and replace them
# with res.status(400).json({ validationError: ... } as ValidationErrorResponse)
# It will also add the import for ValidationErrorResponse if needed

# Find files with validation error responses
files=$(grep -l "res.status(400).json({ validationError:" $(find ./src -name "*.ts"))

if [ -z "$files" ]; then
  echo "No files found that need updating"
  exit 0
fi

echo "Found files to update:"
echo "$files"

# For each file
for file in $files; do
  echo "Processing $file"
  
  # Check if the file already imports ValidationErrorResponse
  if ! grep -q "import.*ValidationErrorResponse.*from.*@bluedotrobots/common-ts" "$file"; then
    # Check if the file already imports from common-ts
    if grep -q "import.*from.*@bluedotrobots/common-ts" "$file"; then
      # Add ValidationErrorResponse to existing import
      sed -i '' -E 's/import \{(.*)\} from "@bluedotrobots\/common-ts"/import \{\1, ValidationErrorResponse\} from "@bluedotrobots\/common-ts"/' "$file"
    else
      # Add new import statement at the top of the file, after existing imports
      first_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ ! -z "$first_import_line" ]; then
        sed -i '' "${first_import_line}a\\
import { ValidationErrorResponse } from \"@bluedotrobots/common-ts\"" "$file"
      else
        # No imports found, add at the beginning of the file
        sed -i '' '1i\\
import { ValidationErrorResponse } from "@bluedotrobots/common-ts"
' "$file"
      fi
    fi
  fi
  
  # Update all instances of res.status(400).json({ validationError: ... }) to include as ValidationErrorResponse
  # First try exact pattern without trailing spaces or newlines
  perl -i -pe 's/(res\.status\(400\)\.json\(\{\s*validationError:\s*[^}]+\}\))(?!\s*as)/$1 as ValidationErrorResponse/g' "$file"
  
  # Also try for the pattern with error.details[0].message
  perl -i -pe 's/(res\.status\(400\)\.json\(\{\s*validationError:\s*error\.details\[0\]\.message\s*\}\))(?!\s*as)/$1 as ValidationErrorResponse/g' "$file"
  
  # Handle custom error messages
  perl -i -pe 's/(res\.status\(400\)\.json\(\{\s*validationError:\s*"[^"]+"\s*\}\))(?!\s*as)/$1 as ValidationErrorResponse/g' "$file"
done

echo "All files updated!"