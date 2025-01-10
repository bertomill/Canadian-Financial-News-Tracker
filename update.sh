#!/bin/bash

# Run the daily update
echo "Running daily update..."
npx tsx src/scripts/daily-update.ts

# Generate a fresh report
echo -e "\nGenerating fresh report..."
npx tsx src/scripts/generate-articles-report.ts

# Open the report in the default browser
echo -e "\nOpening report..."
open articles-report.html 