$TOKEN = gcloud auth print-access-token
$BASE = "https://firestore.googleapis.com/v1/projects/digital-passport-peroneira/databases/(default)/documents"
$H = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }

function Patch([string]$path, $fields) {
  $b = @{ fields = $fields } | ConvertTo-Json -Depth 20
  Invoke-RestMethod -Method PATCH -Uri "$BASE/$path" -Headers $H -Body $b | Out-Null
}
function S([string]$v)  { return @{ stringValue = $v } }
function I([int64]$v)   { return @{ integerValue = "$v" } }
function B([bool]$v)    { return @{ booleanValue = $v } }
function A($x)          { return @{ arrayValue = @{ values = @($x) } } }

function Make-KW([string]$n) {
  $words = $n.ToLower() -split '\s+'
  $ks = [System.Collections.Generic.HashSet[string]]::new()
  foreach ($w in $words) {
    for ($i = 2; $i -le $w.Length; $i++) { $null = $ks.Add($w.Substring(0, $i)) }
    $null = $ks.Add($w)
  }
  return $ks | Where-Object { $_.Length -ge 2 } | ForEach-Object { S $_ }
}

Write-Host "`nSeeding REAL project data into Firestore..." -ForegroundColor Yellow

# ── Seed helper functions ──────────────────────────────────────────────────────

function Do-Project {
  param([string]$id, [string]$name, [string]$city, [string]$dev,
        [string[]]$bl, [int]$total, [int]$floors)
  $kw = Make-KW "$name $dev $city"
  Patch "projects/$id" @{
    name           = S $name
    city           = S $city
    developer      = S $dev
    totalUnits     = I $total
    totalFloors    = I $floors
    verified       = B $false
    searchKeywords = A $kw
    blocks         = A ($bl | ForEach-Object { S $_ })
  }
  Write-Host "==> $name" -ForegroundColor Cyan
}

function Do-UT {
  param([string]$proj, [string]$id, [string]$label,
        [int]$beds, [int]$baths, [int]$carpet, [int]$sbu,
        [string]$cfg, [string]$pat, [int]$f0, [int]$f1)
  $area = if ($carpet -gt 0) { $carpet } else { $sbu }
  $fr   = @(@{ integerValue = "$f0" }, @{ integerValue = "$f1" })
  Patch "projects/$proj/unitTypes/$id" @{
    label             = S $label
    bedrooms          = I $beds
    bathrooms         = I $baths
    area              = I $area
    carpetArea        = I $carpet
    superBuiltUpArea  = I $sbu
    configuration     = S $cfg
    flatNumberPattern = S $pat
    floorRange        = @{ arrayValue = @{ values = $fr } }
    genericDocs       = @{ arrayValue = @{ values = @() } }
  }
  $aStr = if ($carpet -gt 0) { "${carpet} sqft carpet" } else { "${sbu} sqft SBU" }
  Write-Host "    $label  ($aStr)" -ForegroundColor Gray
}

# ── Myhome Bhooja ── 3BHK & 4BHK only (no 2BHK) ──────────────────────────────
Do-Project "myhome-bhooja" "Myhome Bhooja" "Hyderabad" "Myhome Group" `
  @("B","C","D","E","F","G","H","I","J","K") 1416 36
Do-UT "myhome-bhooja" "3bhk-type-a" "3BHK Type A" 3 3 0 2595 "West-facing" "" 3 36
Do-UT "myhome-bhooja" "3bhk-type-b" "3BHK Type B" 3 3 0 2680 "East-facing" "" 3 36
Do-UT "myhome-bhooja" "3bhk-type-c" "3BHK Type C" 3 3 0 3430 "West-facing" "" 3 36
Do-UT "myhome-bhooja" "4bhk"        "4BHK"        4 4 0 4070 "East-facing" "" 3 36

# ── SAS Crown ── 4BHK & 5BHK ultra-luxury ────────────────────────────────────
Do-Project "sas-crown" "SAS Crown" "Hyderabad" "SAS Infratech" `
  @("A","B","C") 450 57
Do-UT "sas-crown" "4bhk-grand"  "4BHK Grand"        4 5 0 6565 "Standard"  "" 5 55
Do-UT "sas-crown" "4bhk-royal"  "4BHK Royal"        4 5 0 7000 "Corner"    "" 5 55
Do-UT "sas-crown" "4bhk-elite"  "4BHK Elite"        4 6 0 8151 "Corner"    "" 5 55
Do-UT "sas-crown" "5bhk"        "5BHK Signature"    5 6 0 8811 "Penthouse" "" 50 57

# ── Prestige Elysian ── 2BHK & 3BHK, RERA carpet areas ───────────────────────
Do-Project "prestige-elysian" "Prestige Elysian" "Bengaluru" "Prestige Group" `
  @("T1","T2","T3","T4") 548 18
Do-UT "prestige-elysian" "2bhk"         "2BHK"         2 2 722  1109 "Standard" "" 2 18
Do-UT "prestige-elysian" "3bhk-compact" "3BHK Compact" 3 3 939  1342 "Standard" "" 2 18
Do-UT "prestige-elysian" "3bhk-regular" "3BHK Regular" 3 3 1073 1600 "Standard" "" 2 18
Do-UT "prestige-elysian" "3bhk-large"   "3BHK Large"   3 3 1216 1810 "Standard" "" 2 18

# ── Konkrete One ── limited data ──────────────────────────────────────────────
Do-Project "konkrete-one" "Konkrete One" "Hyderabad" "Konkrete Developers" `
  @("A","B") 350 25
Do-UT "konkrete-one" "3bhk" "3BHK" 3 3 0 2000 "Standard" "" 2 25
Do-UT "konkrete-one" "4bhk" "4BHK" 4 4 0 3000 "Luxury"   "" 20 25

Write-Host ""
Write-Host "Done! Real data seeded." -ForegroundColor Green
