$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$index = Join-Path $root 'index.html'
$style = Join-Path $root 'css\albam09-v13-fold-pixel-polish.css'
if (-not (Test-Path (Join-Path $root 'netlify.toml'))) { throw 'netlify.toml이 있는 저장소 최상위 폴더에 풀고 실행하세요.' }
if (-not (Test-Path $index)) { throw 'index.html을 찾을 수 없습니다.' }
if (-not (Test-Path $style)) { throw 'css 파일을 찾을 수 없습니다. 압축 내부 css 폴더도 복사하세요.' }
$html=[System.IO.File]::ReadAllText($index,[System.Text.Encoding]::UTF8)
if ($html -notmatch 'class="info-panel-stack"') { throw '메인 페이지 정보 접기 영역이 확인되지 않아 변경하지 않았습니다.' }
$tag='<link rel="stylesheet" href="css/albam09-v13-fold-pixel-polish.css?v=20261109-v13" data-ab09-v13-fold="1">'
if($html -notmatch 'data-ab09-v13-fold="1"') {
  if($html -notmatch '</head>'){throw '</head>를 찾을 수 없어 변경하지 않았습니다.'}
  $backup = "$index.before_v13.bak"
  Copy-Item $index $backup -Force
  $pos = $html.IndexOf('</head>')
  $html = $html.Insert($pos, "$tag`r`n")
  [System.IO.File]::WriteAllText($index, $html, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host '적용 완료: index.html (원본 백업: index.html.before_v13.bak)' -ForegroundColor Green
} else {
  Write-Host '이미 V13 스타일 링크가 적용되어 있습니다.' -ForegroundColor Yellow
}
Write-Host 'GitHub Desktop에서 index.html 과 CSS 파일만 Commit → Push origin 하세요.'
