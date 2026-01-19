#!/bin/bash

# @DEMO File Metadata Fixer
# Fixes empty fields in file finder: last modified, date added, shared by, kind, type

echo "🔧 Fixing File Metadata for @DEMO"
echo "================================="

# Create comprehensive file listing with metadata
echo "📁 Generating file metadata..."

# Create metadata file
cat > file-metadata.json << 'EOF'
{
  "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "generator": "@DEMO File Metadata Fixer",
  "version": "2.0.1",
  "files": [
EOF

# Process each file and add metadata
find . -type f -not -path './.git/*' | while read -r file; do
    # Get file stats
    FILE_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
    MODIFIED=$(stat -f%Sm -t%Y-%m-%dT%H:%M:%SZ "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | sed 's/ /T/' | sed 's/$/Z/')
    CREATED=$(stat -f%B "%SB" -t%Y-%m-%dT%H:%M:%SZ "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | sed 's/ /T/' | sed 's/$/Z/')
    
    # Determine file type and kind
    EXTENSION="${file##*.}"
    case "$EXTENSION" in
        js) KIND="JavaScript"; TYPE="application/javascript"; ;;
        json) KIND="JSON"; TYPE="application/json"; ;;
        md) KIND="Markdown"; TYPE="text/markdown"; ;;
        sh) KIND="Shell Script"; TYPE="application/x-sh"; ;;
        html) KIND="HTML"; TYPE="text/html"; ;;
        css) KIND="CSS"; TYPE="text/css"; ;;
        yaml|yml) KIND="YAML"; TYPE="application/x-yaml"; ;;
        ico) KIND="Icon"; TYPE="image/x-icon"; ;;
        *) KIND="File"; TYPE="application/octet-stream"; ;;
    esac
    
    # Add shared by info
    SHARED_BY="@DEMO Team"
    
    # Escape JSON strings
    FILE_ESCAPED=$(echo "$file" | sed 's/"/\\"/g')
    KIND_ESCAPED=$(echo "$KIND" | sed 's/"/\\"/g')
    
    # Add comma for all but last file
    echo "    {
      \"path\": \"$FILE_ESCAPED\",
      \"name\": \"$(basename "$file")\",
      \"size\": $FILE_SIZE,
      \"size_human\": \"$(numfmt --to=iec $FILE_SIZE 2>/dev/null || echo $FILE_SIZE)\",
      \"modified\": \"$MODIFIED\",
      \"created\": \"$CREATED\",
      \"shared_by\": \"$SHARED_BY\",
      \"kind\": \"$KIND_ESCAPED\",
      \"type\": \"$TYPE\",
      \"extension\": \"$EXTENSION\",
      \"readable\": $([ -r "$file" ] && echo "true" || echo "false"),
      \"writable\": $([ -w "$file" ] && echo "true" || echo "false"),
      \"executable\": $([ -x "$file" ] && echo "true" || echo "false")
    },"
done

# Remove trailing comma and close JSON
sed '$ s/,$//' >> file-metadata.json
cat >> file-metadata.json << 'EOF'
  ],
  "summary": {
    "total_files": $(find . -type f -not -path './.git/*' | wc -l),
    "total_size": "$(du -sh . | cut -f1)",
    "generated_by": "@DEMO Platform",
    "features": [
      "Complete file metadata",
      "Size and type information", 
      "Creation and modification dates",
      "Permissions and accessibility",
      "Shared by attribution"
    ]
  }
}
EOF

echo "✅ File metadata generated: file-metadata.json"

# Create enhanced file listing
echo ""
echo "📊 Enhanced File Listing:"
echo "========================="

# Create detailed file list
find . -type f -not -path './.git/*' -exec stat -f "%Sm %N %z bytes" -t%Y-%m-%d\ %H:%M {} + | while read -r line; do
    DATE=$(echo "$line" | cut -d' ' -f1,2)
    FILE=$(echo "$line" | cut -d' ' -f3)
    SIZE=$(echo "$line" | cut -d' ' -f4,5)
    
    # Get file type
    EXT="${FILE##*.}"
    case "$EXT" in
        js) TYPE="JavaScript" ;;
        json) TYPE="JSON" ;;
        md) TYPE="Markdown" ;;
        sh) TYPE="Shell" ;;
        html) TYPE="HTML" ;;
        *) TYPE="File" ;;
    esac
    
    # Get permissions
    PERM=$(ls -l "$FILE" | cut -d' ' -f1)
    
    printf "%-12s %-8s %-10s %s\n" "$DATE" "$TYPE" "$SIZE" "$FILE"
done | sort

echo ""
echo "📋 File Summary:"
echo "==============="
echo "Total files: $(find . -type f -not -path './.git/*' | wc -l | tr -d ' ')"
echo "Total size: $(du -sh . | cut -f1)"
echo "Generated: $(date)"
echo "Shared by: @DEMO Team"

# Create file categories
echo ""
echo "📂 Files by Type:"
echo "================"
echo "JavaScript: $(find . -name "*.js" | wc -l | tr -d ' ') files"
echo "JSON: $(find . -name "*.json" | wc -l | tr -d ' ') files"
echo "Markdown: $(find . -name "*.md" | wc -l | tr -d ' ') files"
echo "Shell: $(find . -name "*.sh" | wc -l | tr -d ' ') files"
echo "Other: $(find . -type f -not -name "*.js" -not -name "*.json" -not -name "*.md" -not -name "*.sh" -not -path './.git/*' | wc -l | tr -d ' ') files"

echo ""
echo "✅ File metadata fix complete!"
echo "📄 Detailed metadata saved to: file-metadata.json"
