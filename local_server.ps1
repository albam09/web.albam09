$ErrorActionPreference='Stop'
$root=[System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$listener=$null
foreach($port in 8765..8779){
  try {
    $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,[int]$port)
    $listener.Start()
    break
  } catch { $listener=$null }
}
if($null -eq $listener){throw '사용 가능한 로컬 포트가 없습니다.'}
$url='http://127.0.0.1:'+([System.Net.IPEndPoint]$listener.LocalEndpoint).Port+'/'
Write-Host ('albam09 local: '+$url)
Write-Host '종료: Ctrl+C'
Start-Process $url
$mimes=@{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.mjs'='application/javascript; charset=utf-8';'.json'='application/json; charset=utf-8';'.xml'='application/xml; charset=utf-8';'.txt'='text/plain; charset=utf-8';'.webp'='image/webp';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.png'='image/png';'.svg'='image/svg+xml';'.ttf'='font/ttf';'.ico'='image/x-icon';'.webmanifest'='application/manifest+json'}
try {
  while($true){
    $client=$listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout=10000
      $stream=$client.GetStream()
      $reader=New-Object System.IO.StreamReader($stream,[System.Text.Encoding]::ASCII,$false,1024,$true)
      $request=$reader.ReadLine()
      if([string]::IsNullOrEmpty($request)){continue}
      while($true){$line=$reader.ReadLine();if([string]::IsNullOrEmpty($line)){break}}
      $parts=$request.Split(' ')
      $method=$parts[0]
      $path=([string]$parts[1]).Split('?')[0].Split('#')[0]
      $path=[System.Uri]::UnescapeDataString($path).Replace('/',[System.IO.Path]::DirectorySeparatorChar)
      if($path.StartsWith([string][System.IO.Path]::DirectorySeparatorChar)){$path=$path.Substring(1)}
      $file=[System.IO.Path]::GetFullPath((Join-Path $root $path))
      $allowed=$file.StartsWith(($root.TrimEnd([System.IO.Path]::DirectorySeparatorChar)+[System.IO.Path]::DirectorySeparatorChar),[System.StringComparison]::OrdinalIgnoreCase) -or $file.Equals($root,[System.StringComparison]::OrdinalIgnoreCase)
      if($allowed -and [System.IO.Directory]::Exists($file)){$file=Join-Path $file 'index.html'}
      $status=200
      if(-not $allowed){$status=403;$data=[System.Text.Encoding]::UTF8.GetBytes('Forbidden')}
      elseif(-not [System.IO.File]::Exists($file)){$status=404;$data=[System.Text.Encoding]::UTF8.GetBytes('Not found')}
      else{$data=[System.IO.File]::ReadAllBytes($file)}
      $type='application/octet-stream'
      if($status -ne 200){$type='text/plain; charset=utf-8'}
      else {$ext=[System.IO.Path]::GetExtension($file).ToLowerInvariant();if($mimes.ContainsKey($ext)){$type=$mimes[$ext]}}
      $head='HTTP/1.1 '+$status+' '+$(if($status -eq 200){'OK'}else{'Error'})+"`r`nContent-Type: $type`r`nContent-Length: $($data.Length)`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`n`r`n"
      $hdr=[System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hdr,0,$hdr.Length)
      if($method -ne 'HEAD'){$stream.Write($data,0,$data.Length)}
    } catch { Write-Host ('Request error: '+$_.Exception.Message) }
    finally { $client.Dispose() }
  }
} finally {$listener.Stop()}
