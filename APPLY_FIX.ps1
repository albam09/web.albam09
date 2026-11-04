$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $repo '_PATCH_FILES'
$required = @('netlify.toml','scripts/check-release.mjs','data/public-venues.js','explore/write/index.html','explore/post/index.html')
foreach($rel in $required){
  if(-not (Test-Path (Join-Path $repo ($rel -replace '/', '\')))){ throw "GitHub site root not found. Extract this ZIP into your albam09 repository root, beside netlify.toml, and rerun. Missing $rel" }
}
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path (Split-Path -Parent $repo) ("ALBAM09_BEFORE_V6_" + $stamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
$files = @('css/albam09-v5-mobile-frame-fix-20261104.css','js/explorer-write.js','js/explorer-post.js','scripts/build-site.mjs','explore/write/index.html','explore/post/index.html')
foreach($rel in $files){
 $orig = Join-Path $repo ($rel -replace '/', '\'); $replacement = Join-Path $src ($rel -replace '/', '\')
 if(Test-Path $orig){
   $old = Join-Path $backup ($rel -replace '/', '\');New-Item -ItemType Directory -Path (Split-Path -Parent $old) -Force | Out-Null
   Copy-Item $orig $old -Force
 }
 if(-not (Test-Path $replacement)){throw "Missing patch file $rel"}
 Copy-Item $replacement $orig -Force
}
$oldToken = 'albam09-v5-mobile-frame-fix-20261104.css?v=20261104-v5mobileframe'
$newToken = 'albam09-v5-mobile-frame-fix-20261104.css?v=20261104-v6tworows-venues'
$changed = 0
Get-ChildItem -Path $repo -Filter '*.html' -File -Recurse | Where-Object {$_.FullName -notlike "*$([IO.Path]::DirectorySeparatorChar)_PATCH_FILES$([IO.Path]::DirectorySeparatorChar)*"} | ForEach-Object {
 $content = [IO.File]::ReadAllText($_.FullName,[Text.Encoding]::UTF8)
 if($content.Contains($oldToken)){
  $next = $content.Replace($oldToken,$newToken)
  [IO.File]::WriteAllText($_.FullName,$next,(New-Object Text.UTF8Encoding($false)))
  $changed++
 }
}
Write-Host "Completed. HTML cache links updated: $changed. Backup: $backup"
Write-Host 'Check GitHub Desktop Changes, then commit and Push origin.'
