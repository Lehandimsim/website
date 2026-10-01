# log_prompt.ps1 - UserPromptSubmit hook: appends every prompt, verbatim and timestamped,
# to Memos/prompt_log.md. Registered in .claude/settings.json.
#
# Kept ASCII-only on purpose: Windows PowerShell 5.1 reads BOM-less scripts as ANSI.
# Never blocks a prompt: on failure it shows the user a warning and still exits 0.

$ErrorActionPreference = 'Stop'

function Write-HookWarning([string]$message) {
    # JSON on stdout with exit code 0 = warning shown to the user; the prompt goes through.
    @{ systemMessage = "prompt log: $message" } | ConvertTo-Json -Compress
}

try {
    # Read stdin as raw bytes and decode as UTF-8; console code pages would mangle non-ASCII text.
    $stdin = [Console]::OpenStandardInput()
    $buffer = New-Object System.IO.MemoryStream
    $stdin.CopyTo($buffer)
    $raw = [System.Text.Encoding]::UTF8.GetString($buffer.ToArray()).TrimStart([char]0xFEFF)
    $payload = $raw | ConvertFrom-Json

    $projectDir = $env:CLAUDE_PROJECT_DIR
    if (-not $projectDir) { $projectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
    $logPath = Join-Path $projectDir 'Memos\prompt_log.md'
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null

    $session = [string]$payload.session_id
    if ($session.Length -gt 8) { $session = $session.Substring(0, 8) }
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
    $prompt = [string]$payload.prompt

    # The VS Code extension prepends IDE context (the open file, any selection) to the prompt.
    # Nobody typed it, so it is logged as a note above the prompt instead of inside the quote.
    $notes = New-Object System.Collections.Generic.List[string]
    $prompt = [regex]::Replace($prompt, '(?s)<ide_opened_file>(.*?)</ide_opened_file>\s*', {
        param($m)
        $file = [regex]::Match($m.Groups[1].Value, 'opened the file (.+?) in the IDE').Groups[1].Value
        if (-not $file) { $file = $m.Groups[1].Value.Trim() }
        if ($file.StartsWith($projectDir, [System.StringComparison]::OrdinalIgnoreCase)) {
            $file = $file.Substring($projectDir.Length).TrimStart('\', '/') -replace '\\', '/'
        }
        $notes.Add("_IDE: ``$file`` was open_")
        ''
    })
    $prompt = [regex]::Replace($prompt, '(?s)<ide_selection>(.*?)</ide_selection>\s*', {
        param($m)
        $notes.Add("<details><summary>IDE selection sent with this prompt</summary>`n`n~~~`n" +
            $m.Groups[1].Value.Trim() + "`n~~~`n`n</details>")
        ''
    })
    $noteBlock = ''
    if ($notes.Count -gt 0) { $noteBlock = ($notes -join "`n`n") + "`n`n" }

    # Blockquote every line so the prompt stays visibly separate from the log's own headings.
    # Two trailing spaces = markdown line break, so line structure survives in preview.
    $lines = $prompt.Trim("`r", "`n") -split "\r?\n"
    $quoted = ($lines | ForEach-Object { if ($_.Length -eq 0) { '>' } else { '> ' + $_ + '  ' } }) -join "`n"
    $entry = "`n### $stamp | session $session`n`n$noteBlock$quoted`n"

    # Dropbox can briefly lock the file while syncing, so retry a few times before giving up.
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            [System.IO.File]::AppendAllText($logPath, $entry, $utf8NoBom)
            break
        } catch {
            if ($attempt -eq 5) { throw }
            Start-Sleep -Milliseconds 300
        }
    }
} catch {
    Write-HookWarning ('this prompt was NOT added to Memos/prompt_log.md: ' + $_.Exception.Message)
}
exit 0
