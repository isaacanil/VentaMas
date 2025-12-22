# Script para procesar errores de linting de 100 en 100
param(
    [int]$Start = 0,
    [int]$Count = 100,
    [string]$LintFile = "lint-report.txt"
)

# Leer el archivo de reporte
$content = Get-Content $LintFile -Raw
$lines = $content -split "`n"

# Estructura para almacenar errores
$errors = @()
$currentFile = ""
$i = 0

while ($i -lt $lines.Count) {
    $line = $lines[$i]
    
    # Detectar archivo
    if ($line -match '^C:\\.*\.(jsx?|tsx?)$') {
        $currentFile = $line.Trim()
        $i++
        continue
    }
    
    # Detectar error o warning
    if ($line -match '^\s+(\d+):(\d+)\s+(error|warning)\s+(.+)') {
        $lineNum = $matches[1]
        $colNum = $matches[2]
        $severity = $matches[3]
        $message = $matches[4]
        
        # Extraer el nombre de la regla al final del mensaje
        $rule = ""
        if ($message -match '\s+([a-z-/@]+)$') {
            $rule = $matches[1]
            $message = $message -replace '\s+[a-z-/@]+$', ''
        }
        
        $errors += [PSCustomObject]@{
            File = $currentFile
            Line = $lineNum
            Column = $colNum
            Severity = $severity
            Message = $message
            Rule = $rule
        }
    }
    
    $i++
}

# Calcular rango
$totalErrors = $errors.Count
$end = [Math]::Min($Start + $Count, $totalErrors)
$subset = $errors[$Start..($end - 1)]

# Mostrar resumen
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "REPORTE DE LINTING - ERRORES $($Start + 1) a $end de $totalErrors" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Agrupar por archivo
$grouped = $subset | Group-Object -Property File

foreach ($group in $grouped) {
    $fileName = Split-Path $group.Name -Leaf
    $filePath = $group.Name
    
    Write-Host "`n📁 $fileName" -ForegroundColor Yellow
    Write-Host "   $filePath" -ForegroundColor DarkGray
    Write-Host "   $($group.Count) problema(s)`n" -ForegroundColor DarkGray
    
    foreach ($error in $group.Group) {
        $icon = if ($error.Severity -eq "error") { "❌" } else { "⚠️ " }
        $color = if ($error.Severity -eq "error") { "Red" } else { "Yellow" }
        
        Write-Host "   $icon Línea $($error.Line):$($error.Column) " -NoNewline -ForegroundColor $color
        Write-Host "[$($error.Rule)]" -ForegroundColor Magenta
        Write-Host "      $($error.Message)" -ForegroundColor Gray
    }
}

# Estadísticas
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ESTADÍSTICAS DEL LOTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$errorCount = ($subset | Where-Object { $_.Severity -eq "error" }).Count
$warningCount = ($subset | Where-Object { $_.Severity -eq "warning" }).Count

Write-Host "❌ Errores: $errorCount" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warningCount" -ForegroundColor Yellow

# Top reglas en este lote
Write-Host "`nTop 5 reglas más frecuentes en este lote:" -ForegroundColor Cyan
$subset | Group-Object -Property Rule | 
    Sort-Object Count -Descending | 
    Select-Object -First 5 | 
    ForEach-Object {
        Write-Host "  • $($_.Name): $($_.Count) ocurrencias" -ForegroundColor Gray
    }

# Navegación
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NAVEGACIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($end -lt $totalErrors) {
    $nextStart = $end
    Write-Host "Para ver los siguientes 100 errores, ejecuta:" -ForegroundColor Green
    Write-Host "  pwsh .\.tools\process-lint-errors.ps1 -Start $nextStart" -ForegroundColor White
} else {
    Write-Host "✅ Has llegado al final del reporte" -ForegroundColor Green
}

if ($Start -gt 0) {
    $prevStart = [Math]::Max(0, $Start - $Count)
    Write-Host "`nPara ver los 100 errores anteriores, ejecuta:" -ForegroundColor Green
    Write-Host "  pwsh .\.tools\process-lint-errors.ps1 -Start $prevStart" -ForegroundColor White
}

Write-Host ""
