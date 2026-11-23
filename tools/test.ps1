# Headless Chrome: screenshot a stav hry pro jeden skriptovaný průchod (Playwright tu firemní politika blokuje).
# Předpoklad: běží server  python -m http.server 8010  v kořeni projektu.
# Příklad:  .\tools\test.ps1 -Query "test&skript=ovce" -Out C:\temp\ovce.png
# Vypíše řádek STAV {...} z render_game_to_text() a případné hlášky/chyby z konzole hry.
param(
  [Parameter(Mandatory = $true)][string]$Query,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Budget = 20000
)
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
# čistý profil = žádné staré JS z cache. Pokaždé nový adresář: starý profil občas zůstane zamčený (firemní
# rozšíření v něm ještě běží), nejde smazat a Chrome pak potichu nic nevyfotí (2026-11-23).
$userDir = Join-Path $env:TEMP ('klasterka-chrome-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$log = Join-Path $env:TEMP 'klasterka-console.txt'
$url = "http://localhost:8010/index.html?$Query"
$chromeArgs = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', "--user-data-dir=$userDir",
  '--window-size=1920,1080', "--virtual-time-budget=$Budget", '--enable-logging=stderr', '--v=0',
  "--screenshot=$Out", "`"$url`"")
Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -WindowStyle Hidden -RedirectStandardError $log
Remove-Item -Recurse -Force $userDir -ErrorAction SilentlyContinue # zamčený zůstane, nevadí
Get-Content $log -Encoding UTF8 | Where-Object { $_ -match 'CONSOLE' -and $_ -match 'localhost:8010' } | ForEach-Object {
  if ($_ -match '"(STAV .*)", source') { $Matches[1] -replace '\\"', '"' } else { $_ }
}
