param(
  [string]$SourceImage
)

Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\public\icons"
if (-not (Test-Path $iconsDir)) {
  New-Item -ItemType Directory -Path $iconsDir | Out-Null
  Write-Host "[resize-icons] Created /public/icons/"
}

$sizes = @(
  @{ Name = "icon-192.png";        Size = 192 },
  @{ Name = "icon-512.png";        Size = 512 },
  @{ Name = "apple-touch-icon.png"; Size = 180 }
)

$src = [System.Drawing.Image]::FromFile($SourceImage)

foreach ($entry in $sizes) {
  $size = $entry.Size
  $outPath = Join-Path $iconsDir $entry.Name

  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.DrawImage($src, 0, 0, $size, $size)
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()

  Write-Host "[resize-icons] Generated $($entry.Name) (${size}x${size})"
}

$src.Dispose()
Write-Host "[resize-icons] Done."
