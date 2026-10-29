# Windows PowerShell 5+/PowerShell 7. No API key, no login, no node dependency.
# Right click -> Run with PowerShell. Compares both URLs using HTTP GET, not search snippets.
$ErrorActionPreference = 'Stop'
$pages = 1..8
$log = @()
$reportFile = Join-Path $PSScriptRoot 'LIVE_URL_AUDIT_RESULT.txt'
function Get-HashOfText([string] $text) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($text))).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
foreach ($n in $pages) {
    $base = "https://albam09.com/page/karaoke$n/"
    $responses = @()
    foreach ($url in @($base, "${base}?utm_source=chatgpt.com")) {
        try {
            $r = Invoke-WebRequest -Uri $url -Method Get -MaximumRedirection 5 -Headers @{'Cache-Control'='no-cache';'Pragma'='no-cache'} -UseBasicParsing -TimeoutSec 25
            $h = $r.Content
            if ($h -is [byte[]]) { $h = [Text.Encoding]::UTF8.GetString($h) }
            $version = if ($h -match 'name="albam09-content-release"\s+content="([^"]+)"') { $Matches[1] } else { 'NOT-FOUND' }
            $canonical = if ($h -match '<link\s+[^>]*href="([^"]+)"\s+rel="canonical"') {$Matches[1]} else { 'NOT-FOUND' }
            $record = [ordered]@{Page=$n;URL=$url;FinalURL=$r.BaseResponse.ResponseUri.AbsoluteUri;Status=[int]$r.StatusCode;Hash=(Get-HashOfText $h);Release=$version;Canonical=$canonical;ETag=$r.Headers['ETag'];CacheControl=$r.Headers['Cache-Control'];CacheStatus=$r.Headers['Cache-Status'];Age=$r.Headers['Age'];NetlifyRequestId=$r.Headers['X-Nf-Request-Id']}
            $responses += [pscustomobject]$record
        } catch { $responses += [pscustomobject]@{Page=$n;URL=$url;ERROR=$_.Exception.Message} }
    }
    if ($responses.Count -eq 2 -and $responses[0].Hash -and $responses[1].Hash) {
       $same = $responses[0].Hash -eq $responses[1].Hash
       $log += "karaoke$n : $(if($same){'PASS same HTML'}else{'FAIL different HTML'})"
    } else { $log += "karaoke$n : ERROR request failed" }
    $log += ($responses | Format-List | Out-String)
}
$log | Set-Content -LiteralPath $reportFile -Encoding UTF8
Write-Host "URL test report: $reportFile"
Write-Host "A mismatch is NOT a reason to alter canonical automatically; inspect the response and deployment first."
