# MultiCatálogo AI Harness PowerShell Wrapper
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HarnessPy = Join-Path $ScriptDir "ai_harness.py"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is required to run the AI Harness."
    exit 1
}

if ($args.Count -eq 0) {
    python $HarnessPy "doctor"
} else {
    python $HarnessPy @args
}
