# Script para dividir el reporte de linting en archivos de 50 errores
param(
    [int]$BatchSize = 50,
    [string]$ReportsDir = "reports",
    [string]$InputFile = "lint-report.txt"
)

$inputPath = Join-Path $ReportsDir $InputFile

# Verificar que existe el archivo
if (-not (Test-Path $inputPath)) {
    Write-Host "[X] Error: No se encontro el archivo $inputPath" -ForegroundColor Red
    Write-Host "Por favor, asegurate de que existe el archivo lint-report.txt en la carpeta reports/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[*] Procesando reporte de linting..." -ForegroundColor Cyan

# Leer el archivo de reporte
$content = Get-Content $inputPath -Raw
$lines = $content -split "`n"

# Estructura para almacenar errores
$errors = @()
$currentFile = ""
$currentError = $null
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
        
        # Recopilar líneas adicionales del mensaje (contexto)
        $fullMessage = $message
        $j = $i + 1
        $contextLines = @()
        
        while ($j -lt $lines.Count -and $lines[$j] -notmatch '^\s+\d+:\d+\s+(error|warning)' -and $lines[$j] -notmatch '^C:\\') {
            if ($lines[$j].Trim() -ne "") {
                $contextLines += $lines[$j]
            }
            $j++
        }
        
        $errors += [PSCustomObject]@{
            File = $currentFile
            Line = $lineNum
            Column = $colNum
            Severity = $severity
            Message = $fullMessage
            Rule = $rule
            Context = ($contextLines -join "`n")
        }
    }
    
    $i++
}

$totalErrors = $errors.Count
Write-Host "[OK] Se encontraron $totalErrors problemas" -ForegroundColor Green

# Crear carpeta para los lotes si no existe
$batchesDir = Join-Path $ReportsDir "batches"
if (Test-Path $batchesDir) {
    Remove-Item $batchesDir -Recurse -Force
}
New-Item -ItemType Directory -Path $batchesDir -Force | Out-Null

# Dividir en lotes
$batchCount = [Math]::Ceiling($totalErrors / $BatchSize)
Write-Host "[*] Creando $batchCount archivos de lotes..." -ForegroundColor Cyan

for ($batchNum = 0; $batchNum -lt $batchCount; $batchNum++) {
    $start = $batchNum * $BatchSize
    $end = [Math]::Min($start + $BatchSize, $totalErrors)
    $subset = $errors[$start..($end - 1)]
    
    # Crear nombre de archivo con número de lote
    $batchFileName = "lote-{0:D3}.txt" -f ($batchNum + 1)
    $batchFilePath = Join-Path $batchesDir $batchFileName
    
    # Generar contenido del archivo
    $output = @()
    $output += "=" * 80
    $output += "REPORTE DE LINTING - LOTE $($batchNum + 1) de $batchCount"
    $output += "Problemas $($start + 1) a $end de $totalErrors"
    $output += "=" * 80
    $output += ""
    
    # Agrupar por archivo
    $grouped = $subset | Group-Object -Property File
    
    foreach ($group in $grouped) {
        $fileName = Split-Path $group.Name -Leaf
        $filePath = $group.Name
        
        $output += ""
        $output += "FILE: $fileName"
        $output += "   $filePath"
        $output += "   $($group.Count) problema(s)"
        $output += ""
        
        foreach ($lintError in $group.Group) {
            $icon = if ($lintError.Severity -eq "error") { "[ERROR]" } else { "[WARN] " }
            
            $output += "   $icon Linea $($lintError.Line):$($lintError.Column) [$($lintError.Rule)]"
            $output += "      $($lintError.Message)"
            
            if ($lintError.Context) {
                $output += ""
                $output += "      Contexto:"
                $contextLines = $lintError.Context -split "`n"
                foreach ($ctxLine in $contextLines) {
                    if ($ctxLine.Trim() -ne "") {
                        $output += "      $ctxLine"
                    }
                }
            }
            $output += ""
        }
    }
    
    # Estadísticas del lote
    $output += ""
    $output += "=" * 80
    $output += "ESTADÍSTICAS DEL LOTE"
    $output += "=" * 80
    
    $errorCount = ($subset | Where-Object { $_.Severity -eq "error" }).Count
    $warningCount = ($subset | Where-Object { $_.Severity -eq "warning" }).Count
    
    $output += "[X] Errores: $errorCount"
    $output += "[!] Warnings: $warningCount"
    $output += ""
    
    # Top reglas en este lote
    $output += "Top 5 reglas más frecuentes en este lote:"
    $topRules = $subset | Group-Object -Property Rule | 
        Sort-Object Count -Descending | 
        Select-Object -First 5
    
    foreach ($ruleGroup in $topRules) {
        $output += "  * $($ruleGroup.Name): $($ruleGroup.Count) ocurrencias"
    }
    
    # Guardar archivo
    $output | Out-File -FilePath $batchFilePath -Encoding UTF8
    
    Write-Host "  [+] Creado: $batchFileName ($($subset.Count) problemas)" -ForegroundColor Gray
}

# Crear archivo índice
$indexPath = Join-Path $batchesDir "00-indice.txt"
$indexContent = @()
$indexContent += "=" * 80
$indexContent += "ÍNDICE DE LOTES DE ERRORES DE LINTING"
$indexContent += "=" * 80
$indexContent += ""
$indexContent += "Total de problemas encontrados: $totalErrors"
$indexContent += "Divididos en $batchCount lotes de máximo $BatchSize problemas cada uno"
$indexContent += ""
$indexContent += "=" * 80
$indexContent += "ARCHIVOS GENERADOS"
$indexContent += "=" * 80
$indexContent += ""

for ($i = 0; $i -lt $batchCount; $i++) {
    $start = $i * $BatchSize + 1
    $end = [Math]::Min(($i + 1) * $BatchSize, $totalErrors)
    $fileName = "lote-{0:D3}.txt" -f ($i + 1)
    $indexContent += "  $fileName - Problemas $start a $end"
}

$indexContent += ""
$indexContent += "=" * 80
$indexContent += "ESTADÍSTICAS GENERALES"
$indexContent += "=" * 80
$indexContent += ""

$totalErrorCount = ($errors | Where-Object { $_.Severity -eq "error" }).Count
$totalWarningCount = ($errors | Where-Object { $_.Severity -eq "warning" }).Count

$indexContent += "[X] Total de Errores: $totalErrorCount"
$indexContent += "[!] Total de Warnings: $totalWarningCount"
$indexContent += ""

# Top 10 reglas más frecuentes
$indexContent += "Top 10 reglas mas frecuentes en todo el reporte:"
$topRulesAll = $errors | Group-Object -Property Rule | 
    Sort-Object Count -Descending | 
    Select-Object -First 10

foreach ($ruleGroup in $topRulesAll) {
    $indexContent += "  * $($ruleGroup.Name): $($ruleGroup.Count) ocurrencias"
}

# Top 10 archivos con más problemas
$indexContent += ""
$indexContent += "Top 10 archivos con mas problemas:"
$topFiles = $errors | Group-Object -Property File | 
    Sort-Object Count -Descending | 
    Select-Object -First 10

foreach ($fileGroup in $topFiles) {
    $fileName = Split-Path $fileGroup.Name -Leaf
    $indexContent += "  * $fileName - $($fileGroup.Count) problemas"
}

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8

Write-Host "`n[OK] Proceso completado!" -ForegroundColor Green
Write-Host "`n[*] Resumen:" -ForegroundColor Cyan
Write-Host "  * Total de problemas: $totalErrors" -ForegroundColor White
Write-Host "  * Archivos creados: $batchCount lotes" -ForegroundColor White
Write-Host "  * Ubicacion: $batchesDir" -ForegroundColor White
Write-Host "`n[i] Revisa el archivo '00-indice.txt' para ver el indice completo" -ForegroundColor Yellow
Write-Host ""
