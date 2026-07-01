[CmdletBinding()]
param(
  [string]$ChecklistPath = 'docs/audits/venta-facturacion-inventario-release-checklist-2026-06-30.md',
  [int]$MaxOutsideChangesToShow = 80,
  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

function Normalize-RepoPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $normalized = $Path.Trim().Trim('"').Replace('\', '/')
  if ($normalized.StartsWith('./')) {
    $normalized = $normalized.Substring(2)
  }
  return $normalized
}

function Convert-GitStatusPath {
  param([Parameter(Mandatory = $true)][string]$RawPath)

  $path = $RawPath
  if ($path.Contains(' -> ')) {
    $path = ($path -split ' -> ')[-1]
  }
  return Normalize-RepoPath $path
}

function Write-Section {
  param([Parameter(Mandatory = $true)][string]$Title)

  if (-not $Json) {
    Write-Output ''
    Write-Output $Title
    Write-Output ('-' * $Title.Length)
  }
}

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
  throw 'No se pudo resolver la raiz del repo con git rev-parse.'
}

Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath $ChecklistPath)) {
  throw "No existe el checklist: $ChecklistPath"
}

$checklistContent = Get-Content -LiteralPath $ChecklistPath -Raw
$manifestMatch = [regex]::Match(
  $checklistContent,
  '(?s)\$saleReleaseFiles\s*=\s*@\((?<body>.*?)\)\s*\r?\n\s*git add'
)

if (-not $manifestMatch.Success) {
  throw 'No se encontro el bloque $saleReleaseFiles en el checklist.'
}

$manifestPaths = [regex]::Matches($manifestMatch.Groups['body'].Value, "'([^']+)'") |
  ForEach-Object { Normalize-RepoPath $_.Groups[1].Value } |
  Sort-Object -Unique

if ($manifestPaths.Count -eq 0) {
  throw 'El bloque $saleReleaseFiles no contiene rutas.'
}

$manifestSet = [System.Collections.Generic.HashSet[string]]::new(
  [System.StringComparer]::OrdinalIgnoreCase
)
foreach ($path in $manifestPaths) {
  [void]$manifestSet.Add($path)
}

$missingManifestFiles = @(
  $manifestPaths | Where-Object {
    -not (Test-Path -LiteralPath (Join-Path $repoRoot $_))
  }
)

$statusLines = @(& git -c color.ui=false status --porcelain=v1 --untracked-files=all)
$statusRecords = foreach ($line in $statusLines) {
  if ([string]::IsNullOrWhiteSpace($line) -or $line.Length -lt 4) {
    continue
  }

  $code = $line.Substring(0, 2)
  $path = Convert-GitStatusPath $line.Substring(3)
  $indexStatus = $code.Substring(0, 1)
  $worktreeStatus = $code.Substring(1, 1)

  [pscustomobject]@{
    Code = $code
    IndexStatus = $indexStatus
    WorktreeStatus = $worktreeStatus
    Path = $path
    InManifest = $manifestSet.Contains($path)
    IsStaged = $indexStatus -ne ' ' -and $indexStatus -ne '?'
    IsUnstaged = $worktreeStatus -ne ' ' -and $worktreeStatus -ne '?'
    IsUntracked = $code -eq '??'
  }
}

$manifestStatus = @($statusRecords | Where-Object { $_.InManifest })
$stagedOutsideManifest = @(
  $statusRecords | Where-Object { $_.IsStaged -and -not $_.InManifest }
)
$mixedIndexWorktree = @(
  $statusRecords | Where-Object {
    $_.IsStaged -and $_.IsUnstaged
  }
)
$outsideManifestChanges = @(
  $statusRecords | Where-Object { -not $_.InManifest }
)

$diffCheckErrorFile = New-TemporaryFile
try {
  $diffCheckStdout = @(
    & git -c color.ui=false diff --check -- $manifestPaths 2> $diffCheckErrorFile
  )
  $diffCheckExitCode = $LASTEXITCODE
  $diffCheckStderr = @(
    if (Test-Path -LiteralPath $diffCheckErrorFile) {
      Get-Content -LiteralPath $diffCheckErrorFile
    }
  )
  $diffCheckOutput = @($diffCheckStdout)
  if ($diffCheckExitCode -ne 0) {
    $diffCheckOutput += $diffCheckStderr
  }
} finally {
  if (Test-Path -LiteralPath $diffCheckErrorFile) {
    Remove-Item -LiteralPath $diffCheckErrorFile -Force
  }
}

$blockers = @()
if ($missingManifestFiles.Count -gt 0) {
  $blockers += 'Manifest paths missing from the working tree.'
}
if ($stagedOutsideManifest.Count -gt 0) {
  $blockers += 'Current git index contains staged files outside the sale release manifest.'
}
if ($mixedIndexWorktree.Count -gt 0) {
  $blockers += 'Current git index has mixed staged plus unstaged files (MM/AM/etc.).'
}
if ($diffCheckExitCode -ne 0) {
  $blockers += 'git diff --check failed for manifest paths.'
}

$result = [pscustomobject]@{
  RepoRoot = $repoRoot
  ChecklistPath = Normalize-RepoPath $ChecklistPath
  ManifestFileCount = $manifestPaths.Count
  ManifestChangedFileCount = $manifestStatus.Count
  MissingManifestFiles = $missingManifestFiles
  StagedOutsideManifest = $stagedOutsideManifest
  MixedIndexWorktree = $mixedIndexWorktree
  OutsideManifestChangeCount = $outsideManifestChanges.Count
  OutsideManifestChanges = $outsideManifestChanges
  DiffCheckExitCode = $diffCheckExitCode
  DiffCheckOutput = $diffCheckOutput
  Blockers = $blockers
  IsReleasePackageReady = $blockers.Count -eq 0
}

if ($Json) {
  $result | ConvertTo-Json -Depth 6
} else {
  Write-Output 'VentaMas sale release package verifier'
  Write-Output "Repo: $repoRoot"
  Write-Output "Checklist: $ChecklistPath"
  Write-Output "Manifest files: $($manifestPaths.Count)"
  Write-Output "Manifest files changed in working tree: $($manifestStatus.Count)"
  Write-Output "Outside-manifest changed files: $($outsideManifestChanges.Count)"

  if ($blockers.Count -eq 0) {
    Write-Output ''
    Write-Output 'PASS: current index can represent the sale release package.'
  } else {
    Write-Output ''
    Write-Output 'FAIL: release package is not reproducible from the current index.'
    foreach ($blocker in $blockers) {
      Write-Output "BLOCKER: $blocker"
    }
  }

  if ($missingManifestFiles.Count -gt 0) {
    Write-Section 'Missing manifest files'
    $missingManifestFiles | ForEach-Object { Write-Output $_ }
  }

  if ($stagedOutsideManifest.Count -gt 0) {
    Write-Section 'Staged outside manifest'
    $stagedOutsideManifest |
      Sort-Object Path |
      Select-Object Code, Path |
      Format-Table -AutoSize | Out-String -Width 220 |
      Write-Output
  }

  if ($mixedIndexWorktree.Count -gt 0) {
    Write-Section 'Mixed index/worktree files'
    $mixedIndexWorktree |
      Sort-Object Path |
      Select-Object Code, Path, InManifest |
      Format-Table -AutoSize | Out-String -Width 220 |
      Write-Output
  }

  if ($diffCheckExitCode -ne 0 -and $diffCheckOutput.Count -gt 0) {
    Write-Section 'git diff --check output'
    $diffCheckOutput | ForEach-Object { Write-Output $_ }
  }

  if ($outsideManifestChanges.Count -gt 0) {
    Write-Section "Outside manifest changes (first $MaxOutsideChangesToShow)"
    $outsideManifestChanges |
      Sort-Object Path |
      Select-Object -First $MaxOutsideChangesToShow Code, Path |
      Format-Table -AutoSize | Out-String -Width 220 |
      Write-Output
  }

  Write-Output ''
  Write-Output 'Next safe isolation command, if approved:'
  Write-Output "  git restore --staged -- ."
  Write-Output "  git add -- `$saleReleaseFiles"
  Write-Output "  git -c color.ui=false diff --cached --check"
}

if ($blockers.Count -gt 0) {
  exit 1
}
