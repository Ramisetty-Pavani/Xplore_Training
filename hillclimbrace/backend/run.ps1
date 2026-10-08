param(
    [ValidateSet('spring-boot:run', 'test')]
    [string]$Goal = 'spring-boot:run'
)

$ErrorActionPreference = 'Stop'

$mavenVersion = '3.9.11'
$installRoot = Join-Path $env:LOCALAPPDATA 'RidgeRunner\tools'
$mavenHome = Join-Path $installRoot "apache-maven-$mavenVersion"
$mavenExecutable = Join-Path $mavenHome 'bin\mvn.cmd'
$databaseDirectory = Join-Path $PSScriptRoot 'data'

if (-not (Test-Path $mavenExecutable)) {
    New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
    $archive = Join-Path $installRoot "apache-maven-$mavenVersion-bin.zip"
    $archiveUrl = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$mavenVersion/apache-maven-$mavenVersion-bin.zip"
    Invoke-WebRequest -Uri $archiveUrl -OutFile $archive
    Expand-Archive -Path $archive -DestinationPath $installRoot -Force
}

New-Item -ItemType Directory -Path $databaseDirectory -Force | Out-Null
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    & $mavenExecutable -f backend/pom.xml $Goal
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}