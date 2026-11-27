$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$storeRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).ProviderPath
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $storeRoot '../..')).ProviderPath
$outputDirectory = Join-Path $repoRoot '.tmp/google-play'
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
$zipPath = Join-Path $outputDirectory 'PoupEazy-Google-Play-pt-BR.zip'
if (Test-Path -LiteralPath $zipPath) { throw "O pacote já existe: $zipPath" }
$relativeFiles = @(
  'INSTRUCOES.txt', 'LEIA-ME.md', 'CAPTURAS.md',
  'pt-BR/title.txt', 'pt-BR/short-description.txt', 'pt-BR/full-description.txt',
  'pt-BR/screenshot-captions.json', 'pt-BR/tablet-manifest.json',
  'graphics/icon-512.png', 'graphics/feature-1024x500.png'
)
foreach ($folder in @('screenshots/phone', 'screenshots/tablet')) {
  $images = @(Get-ChildItem -LiteralPath (Join-Path $storeRoot $folder) -Filter '*.png' -File | Sort-Object Name)
  if ($images.Count -ne $(if ($folder -eq 'screenshots/phone') { 6 } else { 4 })) { throw "Quantidade inesperada: $folder" }
  foreach ($file in $images) { $relativeFiles += "$folder/$($file.Name)" }
}
foreach ($relative in $relativeFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $storeRoot $relative) -PathType Leaf)) { throw "Arquivo ausente: $relative" }
}
$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($relative in $relativeFiles) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $archive, (Join-Path $storeRoot $relative), $relative,
      [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally { $archive.Dispose() }
$check = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  if ($check.Entries.Count -ne $relativeFiles.Count) { throw 'Quantidade de arquivos no ZIP diverge.' }
  Write-Output "Pacote: $zipPath"
  Write-Output "Arquivos: $($check.Entries.Count); bytes: $((Get-Item -LiteralPath $zipPath).Length)"
} finally { $check.Dispose() }
