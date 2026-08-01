<#
.SYNOPSIS
  TurkceOkulu Audit CI - Skorlama Motoru + Rapor Uretici
.DESCRIPTION
  Performans, guvenlik, erisilebilirlik, kod kalitesi ve test sagligi
  boyutlarinda platformu puanlar (0-100). Weighted toplam ile final grade.
.PARAMETER ReportPath
  JSON raporun yazilacagi yol (varsayilan: ./audit-ci-raporu.json)
.PARAMETER SkipPlaywright
  Playwright/Lighthouse sonuclarini atla (lokal hizli test)
#>

param(
  [string]$ReportPath = "./audit-ci-raporu.json",
  [switch]$SkipPlaywright
)

$ErrorActionPreference = "Continue"

# --- Constants ---

$KATEGORILER = @(
  @{ Ad = "Performans";     Weight = 0.25; Puan = 0; Bulgular = @(); Detay = @{} }
  @{ Ad = "Guvenlik";       Weight = 0.30; Puan = 0; Bulgular = @(); Detay = @{} }
  @{ Ad = "Erisilebilirlik";Weight = 0.15; Puan = 0; Bulgular = @(); Detay = @{} }
  @{ Ad = "KodKalitesi";    Weight = 0.15; Puan = 0; Bulgular = @(); Detay = @{} }
  @{ Ad = "TestSagligi";    Weight = 0.15; Puan = 0; Bulgular = @(); Detay = @{} }
)

$ROOT = if ($env:CI) { $env:GITHUB_WORKSPACE } else { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$WEB = Join-Path $ROOT "web"
$API = Join-Path $ROOT "api"

# --- Yardimcilar ---

function Add-Bulgu($kat, $kriter, $puan, $aciklama, $severity) {
  $kat.Bulgular += @{ Kriter = $kriter; Puan = $puan; Aciklama = $aciklama; Seviye = $severity }
}

function Read-File-Safe($path) {
  if (Test-Path $path) { return [System.IO.File]::ReadAllText($path) }
  return $null
}

# CI runner (Linux) '/' kullanir, lokal (Windows) '\' — sabit "*\klasor\*" wildcard'i
# Linux'ta hicbir zaman eslesmez ve node_modules/bin/obj disarida birakilamaz. Regex
# her iki ayirici ile de calisir.
function Exclude-BuildDirs($fullName) {
  return $fullName -notmatch '[\\/](node_modules|bin|obj|\.git)[\\/]'
}

function Score-Color($score) {
  if ($score -ge 80) { return "Green" }
  elseif ($score -ge 60) { return "Yellow" }
  else { return "Red" }
}

function Sev-Color($sev) {
  switch ($sev) {
    "success"  { return "Green" }
    "warning"  { return "Yellow" }
    "critical" { return "Red" }
    default    { return "Gray" }
  }
}

# --- 1. PERFORMANS (25%) ---

$perf = $KATEGORILER | Where-Object { $_.Ad -eq "Performans" }

# 1a. Web build basarisi
$buildLog = Read-File-Safe (Join-Path $ROOT "audit-build.txt")
$buildOk = ($buildLog -and ($buildLog -match "OK" -or $buildLog -match "success"))
if ($buildOk) {
  Add-Bulgu $perf "Web Build" 100 "Production build basarili" "success"
} else {
  Add-Bulgu $perf "Web Build" 0 "Production build HATA - audit-build.txt" "critical"
}

# 1b. Bundle boyutu
$bundleSize = 0
$bundleNote = "Olculmedi"
if ($buildLog) {
  if ($buildLog -match "(?:First Load JS shared by all|\u03bb)\s+([\d.]+)\s*(kB|MB)") {
    $bundleSize = [double]$Matches[1]
    if ($Matches[2] -eq "MB") { $bundleSize = $bundleSize * 1024 }
    $bundleNote = "$([math]::Round($bundleSize,0))kB shared JS"
    if ($bundleSize -lt 200) { $bScore = 100 }
    elseif ($bundleSize -lt 300) { $bScore = 80 }
    elseif ($bundleSize -lt 400) { $bScore = 60 }
    elseif ($bundleSize -lt 500) { $bScore = 40 }
    else { $bScore = 20 }
    $bsSev = if ($bScore -ge 80) { "success" } elseif ($bScore -ge 60) { "warning" } else { "critical" }
    Add-Bulgu $perf "Bundle Boyutu" $bScore "$bundleNote - skor: $bScore/100" $bsSev
  } else {
    Add-Bulgu $perf "Bundle Boyutu" 50 "Bundle parse edilemedi" "warning"
  }
}

# 1c. Lighthouse
$lhDir = Join-Path $ROOT ".lighthouseci"
if ((-not $SkipPlaywright) -and (Test-Path $lhDir)) {
  $lhRapor = Get-ChildItem $lhDir -Filter "lhr-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($lhRapor) {
    $lh = [System.IO.File]::ReadAllText($lhRapor.FullName) | ConvertFrom-Json
    $lhPerf = [math]::Round($lh.categories.performance.score * 100)
    $lcpVal = $lh.audits.'largest-contentful-paint'.numericValue
    $clsVal = $lh.audits.'cumulative-layout-shift'.numericValue
    $lcpSev = if ($lhPerf -ge 90) { "success" } elseif ($lhPerf -ge 50) { "warning" } else { "critical" }
    $clsSev = if ($lhPerf -ge 90) { "success" } elseif ($lhPerf -ge 50) { "warning" } else { "critical" }
    Add-Bulgu $perf "Lighthouse Performans" $lhPerf "LCP: $lcpVal ms" $lcpSev
    Add-Bulgu $perf "CLS" $lhPerf "Cumulative Layout Shift: $clsVal" $clsSev
  }
}

# 1d. API AsNoTracking kullanimi
$apiServices = @()
if (Test-Path $API) {
  $apiServices = Get-ChildItem (Join-Path $API "Services") -Recurse -Filter "*.cs" -ErrorAction SilentlyContinue
}
$asNoTrackingCount = 0
$totalQueryMethods = 0
foreach ($f in $apiServices) {
  try { $content = [System.IO.File]::ReadAllText($f.FullName) } catch { continue }
  $queryCalls = [regex]::Matches($content, '(ToListAsync|FirstOrDefaultAsync|CountAsync|AnyAsync|SingleOrDefaultAsync)')
  $totalQueryMethods += $queryCalls.Count
  $asNoTrackingCalls = [regex]::Matches($content, 'AsNoTracking\(\)')
  $asNoTrackingCount += $asNoTrackingCalls.Count
}
if ($totalQueryMethods -gt 0) {
  $asRatio = [math]::Round(($asNoTrackingCount / $totalQueryMethods) * 100)
  $ratioSev = if ($asRatio -ge 80) { "success" } elseif ($asRatio -ge 50) { "warning" } else { "critical" }
  $ratioScore = if ($asRatio -ge 80) { 100 } elseif ($asRatio -ge 50) { 60 } else { 20 }
  Add-Bulgu $perf "AsNoTracking" $ratioScore "%$asRatio sorgu AsNoTracking ile" $ratioSev
} else {
  Add-Bulgu $perf "AsNoTracking" 50 "Sorgu tespit edilemedi" "warning"
}

$perf.Puan = if ($perf.Bulgular.Count -gt 0) { [math]::Round(($perf.Bulgular | ForEach-Object { $_.Puan } | Measure-Object -Average).Average) } else { 50 }

# --- 2. GUVENLIK (30%) ---

$guv = $KATEGORILER | Where-Object { $_.Ad -eq "Guvenlik" }

# 2a. npm audit
# npm 10+ artik "found N vulnerabilities" degil, sadece "N vulnerabilities (...)" yaziyor —
# "found " onekini opsiyonel yapiyoruz (eski/yeni npm surumleriyle uyumlu).
$npmAudit = Read-File-Safe (Join-Path $ROOT "audit-npm.txt")
if ($npmAudit -and ($npmAudit -match "(?:found\s+)?0\s+vulnerabilities")) {
  Add-Bulgu $guv "npm Audit" 100 "0 bilinen guvenlik acigi" "success"
} elseif ($npmAudit) {
  $vulnCount = 0
  if ($npmAudit -match "(?:found\s+)?(\d+)\s+vulnerabilities") { $vulnCount = [int]$Matches[1] }
  $hasHigh = $npmAudit -match "high"
  $hasCritical = $npmAudit -match "critical"
  $npmScore = if ($hasCritical) { 10 } elseif ($hasHigh) { 30 } else { 80 }
  $npmSev = if ($hasCritical -or $hasHigh) { "critical" } else { "warning" }
  Add-Bulgu $guv "npm Audit" $npmScore "$vulnCount vulnerability" $npmSev
} else {
  Add-Bulgu $guv "npm Audit" 50 "npm audit calismadi" "warning"
}

# 2b. NuGet audit
$nugetAudit = Read-File-Safe (Join-Path $ROOT "audit-nuget.txt")
if ($nugetAudit -and ($nugetAudit -notmatch "vulnerability")) {
  Add-Bulgu $guv "NuGet Audit" 100 "Guvenlik acigi yok" "success"
} elseif ($nugetAudit) {
  Add-Bulgu $guv "NuGet Audit" 40 "Vulnerable paket var - audit-nuget.txt" "critical"
} else {
  Add-Bulgu $guv "NuGet Audit" 50 "NuGet audit calismadi" "warning"
}

# 2c. ESLint
$lintLog = Read-File-Safe (Join-Path $ROOT "audit-lint.txt")
$lintErrorCount = 0
if ($lintLog -and ($lintLog -match "(\d+) error")) {
  $lintErrorCount = [int]$Matches[1]
}
if ($lintErrorCount -eq 0 -and $lintLog) {
  Add-Bulgu $guv "ESLint" 100 "0 hata" "success"
} elseif ($lintLog) {
  $lintScore = [math]::Max(0, 100 - ($lintErrorCount * 10))
  $lintSev = if ($lintErrorCount -gt 5) { "critical" } else { "warning" }
  Add-Bulgu $guv "ESLint" $lintScore "$lintErrorCount eslint hatasi" $lintSev
} else {
  Add-Bulgu $guv "ESLint" 50 "ESLint calismadi" "warning"
}

# 2d. Security tests
# Onceki regex "security.spec.ts.*?(\d+) passed" ariyordu ama audit-ci.yml artik
# 3 spec dosyasini TEK Playwright calistirmasinda birlestiriyor (security+rate-limiting+
# a11y) — birlesik ozet satiri ("18 passed") dosya adini hic icermiyor, regex asla
# eslesmiyor, skor sessizce "sonuc yok" (50) varsayilanina dusuyor (18/18 gecmisken bile).
# Fix: dosya bazinda satir-satir sayim. Sonuc satirlari "N [chromium] › e2e/security.spec.ts..."
# formatinda (N=sira no, bosluktan hemen sonra parantez) — basarisizlik-detay bloklarindaki
# tekrar basliklar ("N) [chromium] › ...") sayidan sonra ")" geldigi icin \s+\[chromium\]
# ile eslesmiyor, cift saymiyor. Basarisizlik glyph'i (Playwright surumune gore ✘/✗
# degisebilir) TAHMIN EDILMIYOR — total-passed-skipped cikarmasiyla glyph-bagimsiz tespit.
$playwrightLog = Read-File-Safe (Join-Path $ROOT "audit-playwright.txt")
$secPassed = 0; $secFailed = 0; $secSkipped = 0
if ($playwrightLog) {
  $secLines = ($playwrightLog -split "`r?`n") | Where-Object { $_ -match '\d+\s+\[chromium\]' -and $_ -match 'e2e/security\.spec\.ts' }
  $secTotal = $secLines.Count
  $secPassed = ($secLines | Where-Object { $_ -match '^\s*✓' }).Count
  $secSkipped = ($secLines | Where-Object { $_ -match '^\s*-\s' }).Count
  $secFailed = $secTotal - $secPassed - $secSkipped
}
if ($secFailed -eq 0 -and $secPassed -gt 0) {
  Add-Bulgu $guv "Security Tests" 100 "Tum IDOR/JWT/Input testleri gecti ($secPassed passed, $secSkipped skipped)" "success"
} elseif ($secPassed -gt 0) {
  $secScore = [math]::Max(0, 100 - ($secFailed * 20))
  Add-Bulgu $guv "Security Tests" $secScore "$secFailed/$($secFailed+$secPassed+$secSkipped) guvenlik testi BASARISIZ" "critical"
} else {
  Add-Bulgu $guv "Security Tests" 50 "Security test sonucu yok" "warning"
}

# 2e. TypeScript
$tscLog = Read-File-Safe (Join-Path $ROOT "audit-typecheck.txt")
$tsErrors = 0
if ($tscLog -and ($tscLog -match "(\d+) error")) {
  $tsErrors = [int]$Matches[1]
}
if (-not $tscLog -or $tsErrors -eq 0) {
  Add-Bulgu $guv "TypeScript" 100 "Type check basarili" "success"
} else {
  $tsScore = [math]::Max(0, 100 - ($tsErrors * 10))
  $tsSev = if ($tsErrors -gt 5) { "critical" } else { "warning" }
  Add-Bulgu $guv "TypeScript" $tsScore "$tsErrors type hatasi" $tsSev
}

$guv.Puan = if ($guv.Bulgular.Count -gt 0) { [math]::Round(($guv.Bulgular | ForEach-Object { $_.Puan } | Measure-Object -Average).Average) } else { 50 }

# --- 3. ERISILEBILIRLIK (15%) ---

$eri = $KATEGORILER | Where-Object { $_.Ad -eq "Erisilebilirlik" }

# 3a. axe-core a11y
$a11yFile = Join-Path $ROOT "test-results/a11y-bulgular.json"
if (-not (Test-Path $a11yFile)) { $a11yFile = Join-Path $WEB "test-results/a11y-bulgular.json" }
if (Test-Path $a11yFile) {
  try {
    $a11yRaw = [System.IO.File]::ReadAllText($a11yFile)
    $a11y = $a11yRaw | ConvertFrom-Json
    $critical = @($a11y | Where-Object { $_.impact -eq "critical" }).Count
    $serious  = @($a11y | Where-Object { $_.impact -eq "serious" }).Count
    $moderate = @($a11y | Where-Object { $_.impact -eq "moderate" }).Count
    $total    = @($a11y).Count
    $a11yScore = [math]::Max(0, 100 - ($critical * 20) - ($serious * 10) - ($moderate * 5))
    if ($critical -eq 0 -and $total -eq 0) {
      Add-Bulgu $eri "axe-core a11y" 100 "0 ihlal" "success"
    } elseif ($critical -eq 0) {
      $aSev = if ($a11yScore -ge 80) { "success" } elseif ($a11yScore -ge 60) { "warning" } else { "critical" }
      Add-Bulgu $eri "axe-core a11y" $a11yScore "$total ihlal ($critical kritik, $serious ciddi)" $aSev
    } else {
      Add-Bulgu $eri "axe-core a11y" $a11yScore "$critical KRITIK a11y ihlali!" "critical"
    }
  } catch {
    Add-Bulgu $eri "axe-core a11y" 50 "a11y parse hatasi: $_" "warning"
  }
} else {
  Add-Bulgu $eri "axe-core a11y" 50 "a11y raporu bulunamadi" "warning"
}

# 3b. Playwright pass rate
if ($playwrightLog) {
  $pwPassed = 0; $pwFailed = 0
  if ($playwrightLog -match "(\d+) passed") { $pwPassed = [int]$Matches[1] }
  if ($playwrightLog -match "(\d+) failed") { $pwFailed = [int]$Matches[1] }
  $pwTotal = $pwPassed + $pwFailed
  if ($pwTotal -gt 0) {
    $pwRate = [math]::Round(($pwPassed / $pwTotal) * 100)
    $pwSev = if ($pwRate -ge 95) { "success" } elseif ($pwRate -ge 80) { "warning" } else { "critical" }
    Add-Bulgu $eri "Playwright Pass" $pwRate "%$pwRate pass ($pwPassed/$pwTotal)" $pwSev
  }
}

$eri.Puan = if ($eri.Bulgular.Count -gt 0) { [math]::Round(($eri.Bulgular | ForEach-Object { $_.Puan } | Measure-Object -Average).Average) } else { 50 }

# --- 4. KOD KALITESI (15%) ---

$kod = $KATEGORILER | Where-Object { $_.Ad -eq "KodKalitesi" }

# 4a. TODO sayisi
$todoCount = 0
foreach ($dir in @($WEB, $API)) {
  if (-not (Test-Path $dir)) { continue }
  $files = Get-ChildItem $dir -Recurse -Include @("*.ts","*.tsx","*.js","*.jsx","*.cs") -ErrorAction SilentlyContinue | Where-Object { Exclude-BuildDirs $_.FullName }
  foreach ($f in $files) {
    try { $content = [System.IO.File]::ReadAllText($f.FullName) } catch { continue }
    $todoCount += [regex]::Matches($content, '\bTODO\b').Count
  }
}
$todoScore = [math]::Max(0, 100 - ($todoCount * 5))
$todoSev = if ($todoCount -eq 0) { "success" } elseif ($todoCount -le 10) { "success" } elseif ($todoCount -le 25) { "warning" } else { "critical" }
Add-Bulgu $kod "TODO Sayisi" $todoScore "$todoCount TODO" $todoSev

# 4b. Controller boyutu
$buyukController = $false
if (Test-Path $API) {
  $controllers = Get-ChildItem (Join-Path $API "Controllers") -Recurse -Filter "*Controller.cs" -ErrorAction SilentlyContinue
  foreach ($c in $controllers) {
    $lines = (Get-Content $c.FullName).Count
    if ($lines -gt 500) { $buyukController = $true }
  }
}
if (-not $buyukController) {
  Add-Bulgu $kod "Controller Boyutu" 100 "Tum controller'lar 500 satir alti" "success"
} else {
  Add-Bulgu $kod "Controller Boyutu" 60 "500+ satir controller var" "warning"
}

# 4c. Console.Error
$ceCount = 0
if (Test-Path $API) {
  $csFiles = Get-ChildItem $API -Recurse -Filter "*.cs" -ErrorAction SilentlyContinue | Where-Object { Exclude-BuildDirs $_.FullName }
  foreach ($f in $csFiles) {
    try { $content = [System.IO.File]::ReadAllText($f.FullName) } catch { continue }
    $ceCount += [regex]::Matches($content, 'Console\.Error').Count
  }
}
if ($ceCount -eq 0) {
  Add-Bulgu $kod "Console.Error" 100 "0 kullanim" "success"
} else {
  Add-Bulgu $kod "Console.Error" 30 "$ceCount Console.Error bulundu" "critical"
}

# 4d. eslint ignoreDuringBuilds
$nextConfig = Join-Path $WEB "next.config.ts"
if (Test-Path $nextConfig) {
  $nc = [System.IO.File]::ReadAllText($nextConfig)
  if ($nc -match 'ignoreDuringBuilds:\s*true') {
    Add-Bulgu $kod "ESLint Build Gate" 40 "ignoreDuringBuilds=true - build'de eslint atlaniyor" "warning"
  } else {
    Add-Bulgu $kod "ESLint Build Gate" 100 "Build gate aktif" "success"
  }
}

$kod.Puan = if ($kod.Bulgular.Count -gt 0) { [math]::Round(($kod.Bulgular | ForEach-Object { $_.Puan } | Measure-Object -Average).Average) } else { 50 }

# --- 5. TEST SAGLIGI (15%) ---

$testCat = $KATEGORILER | Where-Object { $_.Ad -eq "TestSagligi" }

# 5a. API unit testleri
$apiTestLog = Read-File-Safe (Join-Path $ROOT "audit-apitester.txt")
$apiTotal = 0; $apiFailed = 0
if ($apiTestLog) {
  if ($apiTestLog -match "Total:\s*(\d+)") { $apiTotal = [int]$Matches[1] }
  if ($apiTestLog -match "Failed:\s*(\d+)") { $apiFailed = [int]$Matches[1] }
  if ($apiTotal -eq 0 -and $apiTestLog -match "passed") { $apiTotal = 1 }
}
$testDosyaSayisi = @(Get-ChildItem (Join-Path $API "TurkceOkulu.Api.Tests") -Recurse -Filter "*Tests.cs" -ErrorAction SilentlyContinue).Count
if ($apiTotal -gt 0 -and $apiFailed -eq 0) {
  Add-Bulgu $testCat "API Unit Tests" 100 "Tum $apiTotal test gecti ($testDosyaSayisi dosya)" "success"
} elseif ($apiTotal -gt 0 -and $apiFailed -gt 0) {
  $apiTestScore = [math]::Max(0, 100 - ($apiFailed * 10))
  Add-Bulgu $testCat "API Unit Tests" $apiTestScore "$apiFailed/$apiTotal BASARISIZ" "critical"
} else {
  Add-Bulgu $testCat "API Unit Tests" 50 "API test sonucu yok" "warning"
}

# 5b. E2E coverage
$e2eCount = @(Get-ChildItem $WEB -Recurse -Filter "*.spec.ts" -ErrorAction SilentlyContinue).Count
if ($e2eCount -ge 12) {
  Add-Bulgu $testCat "E2E Coverage" 100 "$e2eCount E2E dosyasi" "success"
} elseif ($e2eCount -ge 6) {
  Add-Bulgu $testCat "E2E Coverage" 70 "$e2eCount E2E dosyasi" "warning"
} else {
  Add-Bulgu $testCat "E2E Coverage" 40 "$e2eCount E2E dosyasi - yetersiz" "warning"
}

# 5c. Rate limit test
if ($playwrightLog -and ($playwrightLog -match "rate-limiting") -and -not ($playwrightLog -match "failed")) {
  Add-Bulgu $testCat "Rate Limit Tests" 100 "Rate limit testleri gecti" "success"
} elseif ($playwrightLog -and ($playwrightLog -match "rate-limiting.*failed")) {
  Add-Bulgu $testCat "Rate Limit Tests" 40 "Rate limit testi BASARISIZ" "critical"
}

$testCat.Puan = if ($testCat.Bulgular.Count -gt 0) { [math]::Round(($testCat.Bulgular | ForEach-Object { $_.Puan } | Measure-Object -Average).Average) } else { 50 }

# --- FINAL PUAN ---

$finalScore = 0
foreach ($kat in $KATEGORILER) {
  if ($kat.Puan -eq 0) { $kat.Puan = 50 } # hic puan yoksa varsayilan 50
  $finalScore += $kat.Puan * $kat.Weight
}
$finalScore = [math]::Round($finalScore)

$grade = if ($finalScore -ge 90) { "A" }
  elseif ($finalScore -ge 75) { "B" }
  elseif ($finalScore -ge 60) { "C" }
  elseif ($finalScore -ge 50) { "D" }
  else { "F" }

$verdict = switch ($grade) {
  "A" { "Gecis izni - tum kriterler karsilaniyor" }
  "B" { "Gecis izni - iyilestirme onerileri mevcut" }
  "C" { "Gecis icin onay gerekli - eksikler var" }
  "D" { "Gecis riskli - duzeltilmeden deploy edilmemeli" }
  "F" { "GECIS ENGELLENDI - kritik hatalar cozulmeli" }
}

# --- RAPOR ---

$report = @{
  Meta = @{
    Tarih     = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Ortam     = if ($env:CI) { "CI (GitHub Actions)" } else { "Lokal" }
    Grade     = $grade
    FinalPuan = $finalScore
    Karar     = $verdict
  }
  Kategoriler = @{}
}

foreach ($kat in $KATEGORILER) {
  $agPuan = [math]::Round($kat.Puan * $kat.Weight)
  $bulgularList = @()
  foreach ($b in $kat.Bulgular) {
    $bulgularList += @{
      Kriter   = $b.Kriter
      Puan     = $b.Puan
      Aciklama = $b.Aciklama
      Seviye   = $b.Seviye
    }
  }
  $report.Kategoriler[$kat.Ad] = @{
    Puan    = $kat.Puan
    Weight  = $kat.Weight
    AgirlikliPuan = $agPuan
    Bulgular = $bulgularList
  }
}

$reportJson = $report | ConvertTo-Json -Depth 5

# --- GOSTER ---

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  TurkceOkulu Audit CI Raporu" -ForegroundColor Cyan
Write-Host "  Tarih: $($report.Meta.Tarih)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
$finalColor = if ($grade -match "A|B") { "Green" } elseif ($grade -eq "C") { "Yellow" } else { "Red" }
Write-Host "  Final Puan: $finalScore/100  -  Grade: $grade" -ForegroundColor $finalColor
Write-Host "  Karar: $verdict" -ForegroundColor $finalColor
Write-Host ""

foreach ($kat in $KATEGORILER) {
  $color = Score-Color $kat.Puan
  Write-Host "  [$($kat.Ad)] $($kat.Puan)/100 (weight: $($kat.Weight))" -ForegroundColor $color
  foreach ($b in $kat.Bulgular) {
    $bColor = Sev-Color $b.Seviye
    Write-Host "    o $($b.Kriter): $($b.Puan)/100 - $($b.Aciklama)" -ForegroundColor $bColor
  }
  Write-Host ""
}

# JSON'a yaz
$ReportDir = Split-Path $ReportPath -Parent
if ($ReportDir -and -not (Test-Path $ReportDir)) {
  New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}
$reportJson | Out-File -FilePath $ReportPath -Encoding utf8
Write-Host "  JSON: $ReportPath" -ForegroundColor Gray

# GitHub Step Summary
if ($env:CI -and $env:GITHUB_STEP_SUMMARY) {
  $summary = @"
## Audit CI Raporu

| Metrik | Deger |
|--------|-------|
| **Final Puan** | **$finalScore/100** |
| **Grade** | **$grade** |
| **Karar** | $verdict |
| **Tarih** | $($report.Meta.Tarih) |

### Kategori Detayi

| Kategori | Puan | Weight |
|----------|------|--------|
"@
  foreach ($kat in $KATEGORILER) {
    $summary += "`n| $($kat.Ad) | $($kat.Puan) | $($kat.Weight) |"
  }
  $summary += "`n`n### Bulgular`n"
  foreach ($kat in $KATEGORILER) {
    $summary += "`n**$($kat.Ad)** ($($kat.Puan)/100):`n"
    foreach ($b in $kat.Bulgular) {
      $icon = switch ($b.Seviye) { "success" { "[OK]" } "warning" { "[!]" } "critical" { "[X]" } default { "[i]" } }
      $summary += "`n- $icon $($b.Kriter): $($b.Puan)/100 - $($b.Aciklama)"
    }
  }
  $summary | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8
}

Write-Host "===============================================" -ForegroundColor Cyan

return $report
