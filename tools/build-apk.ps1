param([string]$JdkPath = $env:JAVA_HOME, [string]$SdkPath = $env:ANDROID_HOME)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not $JdkPath) {
    $javaFolder = Get-ChildItem -LiteralPath "$projectRoot/.tools/java21" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($javaFolder) { $JdkPath = $javaFolder.FullName }
}
if (-not $JdkPath -or -not (Test-Path -LiteralPath "$JdkPath/bin/java.exe")) { throw 'Set JAVA_HOME to Java 21, or pass -JdkPath to this script.' }
if (-not $SdkPath) {
    if (Test-Path -LiteralPath "$projectRoot/.tools/android-sdk") { $SdkPath = "$projectRoot/.tools/android-sdk" }
    else { $SdkPath = "$env:LOCALAPPDATA/Android/Sdk" }
}
if (-not (Test-Path -LiteralPath "$SdkPath/platforms/android-35/android.jar")) { throw 'Install Android SDK Platform 35 and set ANDROID_HOME, or pass -SdkPath.' }
$env:JAVA_HOME = $JdkPath
$env:ANDROID_HOME = $SdkPath
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = "$projectRoot/.tools/android-user"
$env:GRADLE_USER_HOME = "$projectRoot/.tools/gradle-home"
$env:Path = "$env:JAVA_HOME/bin;$env:ANDROID_HOME/platform-tools;$env:Path"
$socketTemp = "$projectRoot/.tools/java-sockets"
New-Item -ItemType Directory -Force $socketTemp | Out-Null
$env:JAVA_TOOL_OPTIONS = ("$env:JAVA_TOOL_OPTIONS -Djava.net.preferIPv4Stack=true " + '"-Djdk.net.unixdomain.tmpdir=' + $socketTemp + '"').Trim()
New-Item -ItemType Directory -Force $env:ANDROID_USER_HOME,$env:GRADLE_USER_HOME | Out-Null
Push-Location -LiteralPath "$projectRoot/packages/client/android"
try {
    & ./gradlew.bat --no-daemon --console=plain --stacktrace '-Dorg.gradle.jvmargs=-Xmx1536m -Djava.net.preferIPv4Stack=true' assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "Android build failed: $LASTEXITCODE" }
} finally { Pop-Location }
$apk = "$projectRoot/artifacts/Fart-Together-debug.apk"
New-Item -ItemType Directory -Force "$projectRoot/artifacts" | Out-Null
Copy-Item -LiteralPath "$projectRoot/packages/client/android/app/build/outputs/apk/debug/app-debug.apk" -Destination $apk -Force
$signer = Get-ChildItem -Path "$env:ANDROID_HOME/build-tools/*/apksigner.bat" | Sort-Object FullName -Descending | Select-Object -First 1
if (-not $signer) { throw 'Android Build Tools / apksigner not found' }
& $signer.FullName verify --verbose --print-certs $apk
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed' }
Get-Item -LiteralPath $apk | Select-Object FullName,Length
$apkHash = Get-FileHash -LiteralPath $apk -Algorithm SHA256
$apkHash | Format-List
Set-Content -LiteralPath "$apk.sha256" -Value ($apkHash.Hash.ToLowerInvariant() + '  Fart-Together-debug.apk') -Encoding Ascii
