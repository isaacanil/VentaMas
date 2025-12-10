# Script para dividir el reporte de linting por tipo de error y severidad
param(
    [int]$MaxPerFile = 50,
    [string]$ReportsDir = "reports",
    [string]$InputFile = "lint-report.txt"
)

# Función para generar archivo de regla
function GenerateRuleFile {
    param(
        [string]$FilePath,
        [string]$RuleName,
        [array]$Errors,
        [string]$Severity,
        [int]$PartNum,
        [int]$TotalParts
    )
    
    $output = @()
    $output += "=" * 80
    if ($TotalParts -gt 1) {
        $output += "REGLA: $RuleName (PARTE $PartNum de $TotalParts)"
    }
    else {
        $output += "REGLA: $RuleName"
    }
    $output += "SEVERIDAD: $Severity"
    $output += "TOTAL DE PROBLEMAS: $($Errors.Count)"
    $output += "=" * 80
    $output += ""
    
    # Agrupar por archivo
    $grouped = $Errors | Group-Object -Property File
    
    foreach ($group in $grouped) {
        $fileName = Split-Path $group.Name -Leaf
        $sourceFilePath = $group.Name
        
        $output += ""
        $output += "FILE: $fileName"
        $output += "   $sourceFilePath"
        $output += "   $($group.Count) problema(s)"
        $output += ""
        
        foreach ($lintError in $group.Group) {
            $icon = if ($lintError.Severity -eq "error") { "[ERROR]" } else { "[WARN] " }
            
            $output += "   $icon Linea $($lintError.Line):$($lintError.Column)"
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
    
    # Archivos más afectados
    $output += ""
    $output += "=" * 80
    $output += "ARCHIVOS MAS AFECTADOS"
    $output += "=" * 80
    $topFiles = $grouped | Sort-Object Count -Descending | Select-Object -First 5
    foreach ($fileGroup in $topFiles) {
        $fileName = Split-Path $fileGroup.Name -Leaf
        $output += "  * $fileName - $($fileGroup.Count) ocurrencias"
    }
    
    # Guardar archivo
    $output | Out-File -FilePath $FilePath -Encoding UTF8 -Force
}

$inputPath = Join-Path $ReportsDir $InputFile

# Verificar que existe el archivo
if (-not (Test-Path $inputPath)) {
    Write-Host "[X] Error: No se encontro el archivo $inputPath" -ForegroundColor Red
    Write-Host "Por favor, asegurate de que existe el archivo lint-report.txt en la carpeta reports/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[*] Procesando reporte de linting por tipo..." -ForegroundColor Cyan

# Leer el archivo de reporte
$content = Get-Content $inputPath -Raw
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
        $rule = "sin-regla"
        if ($message -match '\s+([a-z-/@]+)$') {
            $rule = $matches[1]
            $message = $message -replace '\s+[a-z-/@]+$', ''
        }
        
        # Recopilar líneas adicionales del mensaje (contexto)
        $j = $i + 1
        $contextLines = @()
        
        while ($j -lt $lines.Count -and $lines[$j] -notmatch '^\s+\d+:\d+\s+(error|warning)' -and $lines[$j] -notmatch '^C:\\') {
            if ($lines[$j].Trim() -ne "") {
                $contextLines += $lines[$j]
            }
            $j++
        }
        
        $errors += [PSCustomObject]@{
            File     = $currentFile
            Line     = $lineNum
            Column   = $colNum
            Severity = $severity
            Message  = $message
            Rule     = $rule
            Context  = ($contextLines -join "`n")
        }
    }
    
    $i++
}

$totalErrors = $errors.Count
Write-Host "[OK] Se encontraron $totalErrors problemas" -ForegroundColor Green

# Crear estructura de carpetas
$batchesDir = Join-Path $ReportsDir "by-type"
if (Test-Path $batchesDir) {
    Remove-Item $batchesDir -Recurse -Force
}
New-Item -ItemType Directory -Path $batchesDir -Force | Out-Null

$errorsDir = Join-Path $batchesDir "errors"
$warningsDir = Join-Path $batchesDir "warnings"
New-Item -ItemType Directory -Path $errorsDir -Force | Out-Null
New-Item -ItemType Directory -Path $warningsDir -Force | Out-Null

Write-Host "[*] Organizando por severidad y tipo de regla..." -ForegroundColor Cyan

# Agrupar por severidad y luego por regla
$bySeverity = $errors | Group-Object -Property Severity

$allRuleStats = @()

foreach ($severityGroup in $bySeverity) {
    $severity = $severityGroup.Name
    $targetDir = if ($severity -eq "error") { $errorsDir } else { $warningsDir }
    
    Write-Host "`n[$severity] Procesando $($severityGroup.Count) $severity(s)..." -ForegroundColor $(if ($severity -eq "error") { "Red" } else { "Yellow" })
    
    # Agrupar por regla
    $byRule = $severityGroup.Group | Group-Object -Property Rule | Sort-Object Count -Descending
    
    foreach ($ruleGroup in $byRule) {
        $ruleName = $ruleGroup.Name
        $ruleCount = $ruleGroup.Count
        
        # Sanitizar nombre de archivo
        $safeRuleName = $ruleName -replace '[\\/:*?"<>|]', '-'
        if ($safeRuleName -eq "") { $safeRuleName = "sin-regla" }
        
        # Si hay más de MaxPerFile, dividir en múltiples archivos
        if ($ruleCount -le $MaxPerFile) {
            # Un solo archivo
            $fileName = "$safeRuleName.txt"
            $filePath = Join-Path $targetDir $fileName
            
            GenerateRuleFile -FilePath $filePath -RuleName $ruleName -Errors $ruleGroup.Group -Severity $severity -PartNum 0 -TotalParts 1
            
            Write-Host "  [+] $fileName ($ruleCount problemas)" -ForegroundColor Gray
        }
        else {
            # Múltiples archivos
            $totalParts = [Math]::Ceiling($ruleCount / $MaxPerFile)
            
            for ($partNum = 0; $partNum -lt $totalParts; $partNum++) {
                $start = $partNum * $MaxPerFile
                $end = [Math]::Min($start + $MaxPerFile, $ruleCount)
                $subset = $ruleGroup.Group[$start..($end - 1)]
                
                $fileName = "$safeRuleName-parte-$($partNum + 1)-de-$totalParts.txt"
                $filePath = Join-Path $targetDir $fileName
                
                GenerateRuleFile -FilePath $filePath -RuleName $ruleName -Errors $subset -Severity $severity -PartNum ($partNum + 1) -TotalParts $totalParts
                
                Write-Host "  [+] $fileName ($($subset.Count) problemas)" -ForegroundColor Gray
            }
        }
        
        # Guardar estadísticas
        $allRuleStats += [PSCustomObject]@{
            Rule     = $ruleName
            Severity = $severity
            Count    = $ruleCount
        }
    }
}

# Crear índice general
$indexPath = Join-Path $batchesDir "00-INDICE.txt"
$indexContent = @()
$indexContent += "=" * 80
$indexContent += "INDICE DE ERRORES DE LINTING POR TIPO"
$indexContent += "=" * 80
$indexContent += ""
$indexContent += "Total de problemas encontrados: $totalErrors"
$indexContent += ""

# Estadísticas por severidad
$errorCount = ($errors | Where-Object { $_.Severity -eq "error" }).Count
$warningCount = ($errors | Where-Object { $_.Severity -eq "warning" }).Count

$indexContent += "=" * 80
$indexContent += "RESUMEN POR SEVERIDAD"
$indexContent += "=" * 80
$indexContent += "[X] Errores: $errorCount"
$indexContent += "[!] Warnings: $warningCount"
$indexContent += ""

# Errores por tipo
$indexContent += "=" * 80
$indexContent += "ERRORES POR TIPO"
$indexContent += "=" * 80
$errorStats = $allRuleStats | Where-Object { $_.Severity -eq "error" } | Sort-Object Count -Descending
foreach ($stat in $errorStats) {
    $indexContent += "  * $($stat.Rule): $($stat.Count) ocurrencias"
}
$indexContent += ""

# Warnings por tipo
$indexContent += "=" * 80
$indexContent += "WARNINGS POR TIPO"
$indexContent += "=" * 80
$warningStats = $allRuleStats | Where-Object { $_.Severity -eq "warning" } | Sort-Object Count -Descending
foreach ($stat in $warningStats) {
    $indexContent += "  * $($stat.Rule): $($stat.Count) ocurrencias"
}
$indexContent += ""

# Estructura de carpetas
$indexContent += "=" * 80
$indexContent += "ESTRUCTURA DE CARPETAS"
$indexContent += "=" * 80
$indexContent += "by-type/"
$indexContent += "  errors/     - Archivos con errores criticos"
$indexContent += "  warnings/   - Archivos con advertencias"
$indexContent += ""

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8

Write-Host "`n[OK] Proceso completado!" -ForegroundColor Green
Write-Host "`n[*] Resumen:" -ForegroundColor Cyan
Write-Host "  * Total de problemas: $totalErrors" -ForegroundColor White
Write-Host "  * Errores: $errorCount" -ForegroundColor Red
Write-Host "  * Warnings: $warningCount" -ForegroundColor Yellow
Write-Host "  * Ubicacion: $batchesDir" -ForegroundColor White
Write-Host "`n[i] Revisa el archivo '00-INDICE.txt' para ver el resumen completo" -ForegroundColor Yellow
Write-Host ""
