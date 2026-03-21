param()
Add-Type -AssemblyName System.Drawing

$screenshotsDir = "c:\GitHub\Digital Passport\public\screenshots"
if (-not (Test-Path $screenshotsDir)) {
  New-Item -ItemType Directory -Path $screenshotsDir | Out-Null
}

$files = @(
  @{ Src = "C:\Users\balac\.gemini\antigravity\brain\78b6956f-c8eb-4173-8b05-204df0b140e5\dp_screenshot_dashboard_1773222935452.png"; Dst = "$screenshotsDir\dashboard.png" },
  @{ Src = "C:\Users\balac\.gemini\antigravity\brain\78b6956f-c8eb-4173-8b05-204df0b140e5\dp_screenshot_vault_1773222953138.png"; Dst = "$screenshotsDir\vault.png" }
)

foreach ($f in $files) {
  $img = [System.Drawing.Image]::FromFile($f.Src)
  $bmp = New-Object System.Drawing.Bitmap 1080, 1920
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, 1080, 1920)
  $bmp.Save($f.Dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Host "Saved: $($f.Dst)"
}
Write-Host "Done."
