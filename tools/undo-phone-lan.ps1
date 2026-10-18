$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backup = Get-Content -LiteralPath "$projectRoot/artifacts/firewall-lan-backup.json" -Raw | ConvertFrom-Json
Get-NetFirewallRule -Name $backup.BlockRuleName | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -LocalPort $backup.OriginalLocalPort
Remove-NetFirewallRule -Name $backup.CreatedRuleName -ErrorAction SilentlyContinue
Write-Output 'Restored the original Node TCP block and removed the game LAN exception.'
