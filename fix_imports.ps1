$files = Get-ChildItem -Path "src" -Recurse -Include *.js,*.jsx,*.ts,*.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Fix corrupted imports
    # Pattern: import { formatPricefrom '... 
    
    # We use a broad match for the corrupted import line. 
    # Note: Regex uses [ "'" ] to match quotes.
    $content = $content -replace 'import\s+\{\s*formatPricefrom\s+["\'"]([^"''\r\n]+)["\'"]', "import { formatPrice } from '@/utils/format';"

    # Also fix cases where the line ends abruptly (unterminated string)
    # matching import { formatPricefrom '... up to newline
    $content = $content -replace 'import\s+\{\s*formatPricefrom\s+["\'"]([^"''\r\n]*)((\r?\n)|$)', "import { formatPrice } from '@/utils/format';`n"

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed imports in $($file.FullName)"
    }
}