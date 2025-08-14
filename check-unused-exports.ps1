# check-unused-exports.ps1
#requires -Version 7.0
param(
  [string]$srcPath = ".\src",
  [switch]$SaveCsv,
  [string]$CsvPath = ".\unused-exports.csv",
  [int]$ThrottleLimit = [math]::Max(2, [Environment]::ProcessorCount),
  [string[]]$ExcludeDirPatterns = @(
    "node_modules", ".git", "dist", "build", "coverage", "out",
    ".next", ".nuxt", "storybook-static", "cypress", "playwright",
    ".turbo", ".yarn", ".pnpm-store"
  ),
  [switch]$ShowProgress,
  [int]$ProgressUpdateMs = 200
)

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Analizando exports no utilizados en la carpeta src (PS7, paralelo)..."
Write-Host "========================================="

function New-Set { New-Object 'System.Collections.Generic.HashSet[string]' }

# -------- Recolección de archivos --------
if (-not (Test-Path -LiteralPath $srcPath)) {
  throw "Ruta no encontrada: $srcPath"
}
$srcRoot   = (Resolve-Path -LiteralPath $srcPath).Path
$excludeRe = ($ExcludeDirPatterns | ForEach-Object { [regex]::Escape($_) }) -join '|'

$allFiles = Get-ChildItem -Path (Join-Path $srcRoot '*') -Recurse -File -Include "*.js","*.jsx","*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "(\\|/)($excludeRe)(\\|/)" }

Write-Host ("Archivos encontrados: {0}" -f $allFiles.Count)
if ($allFiles.Count -eq 0) { Write-Host "No hay archivos JS/TS en $srcRoot. Saliendo."; exit 0 }

# -------- Worker (sin $using:, todo local al job) --------
$worker = {
  param([string]$path, [string]$srcRootArg)

  $rxOpts = [System.Text.RegularExpressions.RegexOptions]::Compiled
  $blockCommentRx   = [regex]::new('(?s)/\*.*?\*/', $rxOpts)
  $lineCommentRx    = [regex]::new('(?m)^\s*//.*$', $rxOpts)

  $exportPatterns = @(
    @{ kind='var';            rx=[regex]::new('(?m)^\s*export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='fn';             rx=[regex]::new('(?m)^\s*export\s+function\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='class';          rx=[regex]::new('(?m)^\s*export\s+class\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='type';           rx=[regex]::new('(?m)^\s*export\s+type\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='interface';      rx=[regex]::new('(?m)^\s*export\s+interface\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='enum';           rx=[regex]::new('(?m)^\s*export\s+enum\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='named-list';     rx=[regex]::new('(?m)^\s*export\s+\{\s*([^}]+)\s*\}(?:\s+from\s+[''"][^''""]+[''"])?', $rxOpts) }
    @{ kind='type-named-list';rx=[regex]::new('(?m)^\s*export\s+type\s+\{\s*([^}]+)\s*\}(?:\s+from\s+[''"][^''""]+[''"])?', $rxOpts) }
    @{ kind='ns-reexport';    rx=[regex]::new('(?m)^\s*export\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+[''"][^''""]+[''"]', $rxOpts) }
    @{ kind='default-named';  rx=[regex]::new('(?m)^\s*export\s+default\s+(?:function|class)\s+([A-Za-z_$][\w$]*)', $rxOpts) }
    @{ kind='default-anon';   rx=[regex]::new('(?m)^\s*export\s+default\s+(?!function|class)(.+)$', $rxOpts) }
  )

  $importNamedRx           = [regex]::new('(?m)^\s*import\s+\{([^}]+)\}\s+from\s+[''"]([^''""]+)[''"]', $rxOpts)
  $importDefaultRx         = [regex]::new('(?m)^\s*import\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]+\}\s*)?from\s+[''"]([^''""]+)[''"]', $rxOpts)
  $importNamespaceRx       = [regex]::new('(?m)^\s*import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+[''"]([^''""]+)[''"]', $rxOpts)

  # TypeScript: import type ...
  $importTypeNamedRx       = [regex]::new('(?m)^\s*import\s+type\s+\{([^}]+)\}\s+from\s+[''"]([^''""]+)[''"]', $rxOpts)
  $importTypeDefaultRx     = [regex]::new('(?m)^\s*import\s+type\s+([A-Za-z_$][\w$]*)\s+from\s+[''"]([^''""]+)[''"]', $rxOpts)
  $importTypeNamespaceRx   = [regex]::new('(?m)^\s*import\s+type\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+[''"]([^''""]+)[''"]', $rxOpts)

  $requireRx               = [regex]::new('(?m)^\s*const\s+\{([^}]+)\}\s*=\s*require\s*\(\s*[''"]([^''""]+)[''"]\s*\)', $rxOpts)

  $specCleanRx             = [regex]::new('[?#].*$', $rxOpts)
  $extensionRx             = [regex]::new('\.(?:[cm]?tsx?|jsx?)$', $rxOpts)
  $lastSegmentRx           = [regex]::new('([^/]+)$', $rxOpts)
  $indexDirRx              = [regex]::new('([^/]+)/index$', $rxOpts)

  $exportAsRx              = [regex]::new('^(?<local>[A-Za-z_$][\w$]*)\s+as\s+(?<exp>[A-Za-z_$][\w$]*)$', $rxOpts)
  $exportNameRx            = [regex]::new('^(?<name>[A-Za-z_$][\w$]*)$', $rxOpts)
  $importAsRx              = [regex]::new('^(?<exp>[A-Za-z_$][\w$]*)\s+as\s+(?<local>[A-Za-z_$][\w$]*)$', $rxOpts)
  $requireAsRx             = [regex]::new('^(?<exp>[A-Za-z_$][\w$]*)\s*:\s*[A-Za-z_$][\w$]*$', $rxOpts)

  function Get-SpecKeys([string]$spec) {
    $s = $specCleanRx.Replace($spec, '')
    $s = $extensionRx.Replace($s, '')
    $lastMatch = $lastSegmentRx.Match($s)
    $last = if ($lastMatch.Success) { $lastMatch.Groups[1].Value } else { $s }
    if ($last -ieq 'index') {
      $indexMatch = $indexDirRx.Match($s)
      if ($indexMatch.Success) { $indexMatch.Groups[1].Value }
      'index'
    } else { , $last }
  }

  $raw   = [System.IO.File]::ReadAllText($path)
  $clean = $lineCommentRx.Replace($blockCommentRx.Replace($raw, ''), '')
  $rel   = [IO.Path]::GetRelativePath($srcRootArg, $path).Replace('\','/')

  $base    = [IO.Path]::GetFileNameWithoutExtension($path)
  $dirName = [IO.Path]::GetFileName([IO.Path]::GetDirectoryName($path))
  $keys    = if ($base -ieq 'index') { @($dirName, 'index') } else { @($base) }

  # --- Exports ---
  $exports = New-Object System.Collections.Generic.List[object]
  foreach ($p in $exportPatterns) {
    foreach ($m in $p.rx.Matches($clean)) {
      switch ($p.kind) {
        'named-list' {
          $list = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
          foreach ($item in $list) {
            $entry   = ($item -replace '^\s*type\s+', '') # soporta "export { type Foo }"
            $asMatch = $exportAsRx.Match($entry)
            $nameMatch = $exportNameRx.Match($entry)
            if     ($asMatch.Success)   { $exports.Add([pscustomobject]@{ Name=$asMatch.Groups['exp'].Value;    Kind='named';   IsDefault=$false }) }
            elseif ($nameMatch.Success) { $exports.Add([pscustomobject]@{ Name=$nameMatch.Groups['name'].Value; Kind='named';   IsDefault=$false }) }
          }
        }
        'type-named-list' {
          $list = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
          foreach ($item in $list) {
            $entry   = ($item -replace '^\s*type\s+', '')
            $asMatch = $exportAsRx.Match($entry)
            $nameMatch = $exportNameRx.Match($entry)
            if     ($asMatch.Success)   { $exports.Add([pscustomobject]@{ Name=$asMatch.Groups['exp'].Value;    Kind='named';   IsDefault=$false }) }
            elseif ($nameMatch.Success) { $exports.Add([pscustomobject]@{ Name=$nameMatch.Groups['name'].Value; Kind='named';   IsDefault=$false }) }
          }
        }
        'ns-reexport'   { $exports.Add([pscustomobject]@{ Name=$m.Groups[1].Value; Kind='named';   IsDefault=$false }) }
        'default-named' { $exports.Add([pscustomobject]@{ Name=$m.Groups[1].Value; Kind='default'; IsDefault=$true  }) }
        'default-anon'  { $exports.Add([pscustomobject]@{ Name='<default>';        Kind='default'; IsDefault=$true  }) }
        default         { $exports.Add([pscustomobject]@{ Name=$m.Groups[1].Value; Kind='named';   IsDefault=$false }) }
      }
    }
  }
  $exports = $exports | Sort-Object Name, IsDefault -Unique

  # --- Imports ---
  $importRecords = New-Object System.Collections.Generic.List[object]

  foreach ($m in $importNamedRx.Matches($clean)) {
    $list = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    $spec = $m.Groups[2].Value
    foreach ($k in (Get-SpecKeys $spec)) {
      foreach ($it in $list) {
        $entry = ($it -replace '^\s*type\s+', '') # soporta "{ type Foo }"
        $asMatch = $importAsRx.Match($entry)
        $name = if ($asMatch.Success) { $asMatch.Groups['exp'].Value } else { $entry }
        $importRecords.Add([pscustomobject]@{ Key=$k; Kind='named'; Name=$name; FileRel=$rel })
      }
    }
  }

  foreach ($m in $importDefaultRx.Matches($clean)) {
    $spec = $m.Groups[2].Value
    foreach ($k in (Get-SpecKeys $spec)) {
      $importRecords.Add([pscustomobject]@{ Key=$k; Kind='default'; Name='<default>'; FileRel=$rel })
    }
  }

  foreach ($m in $importNamespaceRx.Matches($clean)) {
    $alias = $m.Groups[1].Value
    $spec  = $m.Groups[2].Value
    $aliasEsc = [regex]::Escape($alias)
    $memberRx = [regex]::new("\b$aliasEsc\.([A-Za-z_$][\w$]*)\b", $rxOpts)
    $members  = $memberRx.Matches($clean) | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    foreach ($k in (Get-SpecKeys $spec)) {
      foreach ($nm in $members) {
        $importRecords.Add([pscustomobject]@{ Key=$k; Kind='ns'; Name=$nm; FileRel=$rel })
      }
    }
  }

  # ---- TypeScript: import type ----
  foreach ($m in $importTypeNamedRx.Matches($clean)) {
    $list = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    $spec = $m.Groups[2].Value
    foreach ($k in (Get-SpecKeys $spec)) {
      foreach ($it in $list) {
        $entry = ($it -replace '^\s*type\s+', '')
        $asMatch = $importAsRx.Match($entry)
        $name = if ($asMatch.Success) { $asMatch.Groups['exp'].Value } else { $entry }
        $importRecords.Add([pscustomobject]@{ Key=$k; Kind='named'; Name=$name; FileRel=$rel })
      }
    }
  }

  foreach ($m in $importTypeDefaultRx.Matches($clean)) {
    $spec = $m.Groups[2].Value
    foreach ($k in (Get-SpecKeys $spec)) {
      $importRecords.Add([pscustomobject]@{ Key=$k; Kind='default'; Name='<default>'; FileRel=$rel })
    }
  }

  foreach ($m in $importTypeNamespaceRx.Matches($clean)) {
    $alias = $m.Groups[1].Value
    $spec  = $m.Groups[2].Value
    $aliasEsc = [regex]::Escape($alias)
    $memberRx = [regex]::new("\b$aliasEsc\.([A-Za-z_$][\w$]*)\b", $rxOpts)
    $members  = $memberRx.Matches($clean) | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
    foreach ($k in (Get-SpecKeys $spec)) {
      foreach ($nm in $members) {
        $importRecords.Add([pscustomobject]@{ Key=$k; Kind='ns'; Name=$nm; FileRel=$rel })
      }
    }
  }

  # require({ ... } = require('spec'))
  foreach ($m in $requireRx.Matches($clean)) {
    $list = $m.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    $spec = $m.Groups[2].Value
    foreach ($k in (Get-SpecKeys $spec)) {
      foreach ($it in $list) {
        $name = $it -replace '\s+as\s+.*$', ''
        $reqMatch = $requireAsRx.Match($name)
        if ($reqMatch.Success) { $name = $reqMatch.Groups['exp'].Value }
        $importRecords.Add([pscustomobject]@{ Key=$k; Kind='named'; Name=$name; FileRel=$rel })
      }
    }
  }

  [pscustomobject]@{
    Path          = $path
    Rel           = $rel
    Keys          = $keys
    Exports       = $exports
    ImportRecords = $importRecords
  }
}

# -------- Lanzar trabajos --------
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$jobs = foreach ($fi in $allFiles) {
  Start-ThreadJob -ThrottleLimit $ThrottleLimit -ScriptBlock $worker -ArgumentList @($fi.FullName, $srcRoot)
}

# -------- Progreso --------
if ($ShowProgress) {
  do {
    $done    = ($jobs | Where-Object { $_.State -match 'Completed|Failed|Stopped' }).Count
    $elapsed = [math]::Max(0.001, $sw.Elapsed.TotalSeconds)
    $rate    = $done / $elapsed
    $rem     = [math]::Max(0, $allFiles.Count - $done)
    $etaS    = if ($rate -gt 0) { [int]($rem / $rate) } else { 0 }
    $pct     = [int](($done * 100.0) / $allFiles.Count)
    $etaTS   = (New-TimeSpan -Seconds $etaS).ToString()
    $status  = "{0}/{1} archivos, {2:N1}/s, ETA {3}" -f $done, $allFiles.Count, $rate, $etaTS
    Write-Progress -Id 1 -Activity "Analizando exports/imports (paralelo)" -Status $status -PercentComplete $pct -SecondsRemaining $etaS
    Start-Sleep -Milliseconds $ProgressUpdateMs
  } while ($done -lt $allFiles.Count)
  Write-Progress -Id 1 -Completed -Activity "Analizando exports/imports (paralelo)"
}

# -------- Recoger resultados --------
$fileRecords = Receive-Job -Job $jobs -Wait -AutoRemoveJob
$sw.Stop()

# -------- Separar resultados --------
$fileData      = $fileRecords | ForEach-Object { [pscustomobject]@{ Path = $_.Path; Rel = $_.Rel; Keys = $_.Keys } }
$fileExports   = @{}
$importRecords = New-Object System.Collections.Generic.List[object]
foreach ($rec in $fileRecords) {
  $fileExports[$rec.Path] = $rec.Exports
  foreach ($impRec in $rec.ImportRecords) { $importRecords.Add($impRec) }
}

# -------- Índice de imports --------
$importIndex = @{}  # Key -> @{ Default=Set; Named=Hashtable name->Set; Ns=Hashtable name->Set }
function Ensure-KeyEntry($key) {
  if (-not $importIndex.ContainsKey($key)) { $importIndex[$key] = @{ Default=(New-Set); Named=@{}; Ns=@{} } }
}
foreach ($rec in $importRecords) {
  Ensure-KeyEntry $rec.Key
  $entry = $importIndex[$rec.Key]
  switch ($rec.Kind) {
    'default' { $null = $entry.Default.Add($rec.FileRel) }
    'named'   { if (-not $entry.Named.ContainsKey($rec.Name)) { $entry.Named[$rec.Name] = New-Set }
                $null = $entry.Named[$rec.Name].Add($rec.FileRel) }
    'ns'      { if (-not $entry.Ns.ContainsKey($rec.Name)) { $entry.Ns[$rec.Name] = New-Set }
                $null = $entry.Ns[$rec.Name].Add($rec.FileRel) }
  }
}

# -------- Evaluación --------
$unusedExports   = New-Object System.Collections.Generic.List[object]
$totalFiles      = 0
$filesWithExports= 0
foreach ($fd in $fileData) {
  $totalFiles++
  $exports = $fileExports[$fd.Path]
  if ($exports.Count -gt 0) {
    $filesWithExports++
    Write-Host ""
    Write-Host ("Analizando: {0}" -f $fd.Rel)
    foreach ($ex in $exports) {
      $used = $false
      foreach ($k in $fd.Keys) {
        if (-not $importIndex.ContainsKey($k)) { continue }
        $entry = $importIndex[$k]
        if ($ex.IsDefault) {
          if ($entry.Default.Count -gt 0) { $used = $true; break }
        } else {
          if ( ($entry.Named.ContainsKey($ex.Name) -and $entry.Named[$ex.Name].Count -gt 0) -or
               ($entry.Ns.ContainsKey($ex.Name)    -and $entry.Ns[$ex.Name].Count    -gt 0) ) { $used = $true; break }
        }
      }
      if (-not $used) {
        $unusedExports.Add([pscustomobject]@{ File=$fd.Rel; Export=$ex.Name; Kind=(if ($ex.IsDefault) { 'default' } else { $ex.Kind }) })
        Write-Host ("  [X] Export no utilizado: {0}" -f $ex.Name)
      } else {
        Write-Host ("  [OK] Export utilizado: {0}" -f $ex.Name)
      }
    }
  }
}

# -------- Resumen / CSV --------
$elapsed    = $sw.Elapsed
$throughput = "{0:N1}" -f ($allFiles.Count / [math]::Max(0.001, $elapsed.TotalSeconds))

Write-Host ""
Write-Host "========================================="
Write-Host "RESUMEN DEL ANALISIS"
Write-Host "========================================="
Write-Host ("Total de archivos analizados: {0}" -f $totalFiles)
Write-Host ("Archivos con exports: {0}" -f $filesWithExports)
Write-Host ("Exports no utilizados encontrados: {0}" -f $($unusedExports.Count))
Write-Host ("Tiempo total: {0} (≈ {1} archivos/seg)" -f $elapsed, $throughput)

if ($unusedExports.Count -gt 0) {
  Write-Host ""
  Write-Host "EXPORTS NO UTILIZADOS:"
  Write-Host "========================================="
  $unusedExports | Sort-Object File, Export | Format-Table -AutoSize File, Export, Kind

  if ($SaveCsv) {
    $fullCsvPath = if ([IO.Path]::IsPathRooted($CsvPath)) { $CsvPath } else { Join-Path -Path (Get-Location) -ChildPath $CsvPath }
    $dir = Split-Path -Parent -Path $fullCsvPath
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $unusedExports | Select-Object File, Export, Kind |
      Sort-Object File, Export |
      Export-Csv -Path $fullCsvPath -NoTypeInformation -Encoding UTF8 -UseCulture
    Write-Host ""
    Write-Host ("CSV guardado en: {0}" -f $fullCsvPath)
  } else {
    Write-Host ""
    Write-Host "Tip: usa -SaveCsv para exportar a CSV (ruta por defecto: .\unused-exports.csv)"
  }
} else {
  Write-Host ""
  Write-Host "No se encontraron exports sin utilizar."
}

Write-Host ""
Write-Host "========================================="
Write-Host "Analisis completado"
