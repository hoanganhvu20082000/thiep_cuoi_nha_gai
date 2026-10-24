# Đóng gói thiệp vào thư mục dist/ để deploy (chỉ lấy file cần thiết + ảnh đang dùng)
# Chạy: powershell -ExecutionPolicy Bypass -File build.ps1
$root = $PSScriptRoot
$dist = Join-Path $root 'dist'
if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory -Force -Path "$dist\assets\photos" | Out-Null

Copy-Item "$root\index.html", "$root\style.css", "$root\main.js", "$root\config.js" $dist

# Chỉ copy ảnh được nhắc tới trong config.js (heroPhoto + album)
$cfg = Get-Content "$root\config.js" -Raw
$photos = [regex]::Matches($cfg, 'photo_\d+|hero') | ForEach-Object { $_.Value } | Select-Object -Unique
foreach ($p in $photos) { Copy-Item "$root\assets\photos\$p.jpg" "$dist\assets\photos\" }
if (Test-Path "$root\assets\music") { Copy-Item -Recurse "$root\assets\music" "$dist\assets\" }

$size = (Get-ChildItem $dist -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
Write-Output ("dist/ ready: {0} photos, {1:N1} MB" -f $photos.Count, $size)
