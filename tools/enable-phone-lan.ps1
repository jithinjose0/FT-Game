# Run only after the user authorizes the scoped firewall exception.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$program = 'C:\Program Files\nodejs\node.exe'
$ruleName = 'FartTogether-WiFi-TCP-2567'
$blocked = @(Get-NetFirewallRule -Direction Inbound | Where-Object {
    $_.Enabled -eq 'True' -and $_.Action -eq 'Block' -and $_.Profile.ToString() -eq 'Public'
} | Where-Object {
    $app = $_ | Get-NetFirewallApplicationFilter
    $port = $_ | Get-NetFirewallPortFilter
    $app.Program -ieq $program -and $port.Protocol -eq 'TCP'
})
if ($blocked.Count -ne 1) { throw 'Expected exactly one public TCP block for this Node installation; no changes made.' }
$portFilter = $blocked[0] | Get-NetFirewallPortFilter
if ($portFilter.LocalPort -ne 'Any') { throw 'Node block ports have changed; review them before modifying the firewall.' }
if (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue) { throw 'The game exception already exists; inspect it before changing anything.' }
$backup = [pscustomobject]@{BlockRuleName=$blocked[0].Name;OriginalLocalPort=$portFilter.LocalPort;CreatedRuleName=$ruleName;Program=$program;CreatedAt=(Get-Date).ToString('o')}
$backup | ConvertTo-Json | Set-Content -LiteralPath "$projectRoot/artifacts/firewall-lan-backup.json" -Encoding UTF8
try {
    # An explicit block beats an allow. Exclude only 2567 from the existing TCP block.
    $portFilter | Set-NetFirewallPortFilter -LocalPort @('1-2566','2568-65535')
    New-NetFirewallRule -Name $ruleName -DisplayName 'Fart Together - Wi-Fi TCP 2567 only' -Direction Inbound -Action Allow -Enabled True -Protocol TCP -LocalPort 2567 -RemoteAddress LocalSubnet -InterfaceType Wireless -Profile Public -Program $program | Out-Null
} catch {
    $blocked[0] | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -LocalPort Any
    throw
}
Get-NetFirewallRule -Name $ruleName | Select-Object Name,Enabled,Direction,Action,Profile | Format-List
Write-Output 'Phone LAN exception enabled. Other TCP ports and the UDP block were left in place.'
