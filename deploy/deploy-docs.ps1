[CmdletBinding()]
param(
  [string]$HostName = '107.182.191.131',
  [string]$UserName = 'root',
  [int]$Port = 22,
  [string]$IdentityFile = "$HOME/.ssh/focalapi_ed25519",
  [string]$Platform = 'linux/amd64',
  [string]$ImageRegistry = 'docker.m.daocloud.io/',
  [switch]$KeepLocalBuildArtifacts
)

# Deploy FocalAPI Docs: build a linux/amd64 image locally, export and upload it,
# then import it on the server and join the docs service to the focalapi-llm Compose project.
# Follow focalapi-llm/deploy/focalapi-llm/deploy.ps1 conventions and use non-interactive key authentication.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($ImageRegistry -and -not $ImageRegistry.EndsWith('/')) {
  $ImageRegistry += '/'
}

$scriptDirectory = $PSScriptRoot
$repositoryRoot = (Resolve-Path (Join-Path $scriptDirectory '..')).Path
$identityPath = (Resolve-Path $IdentityFile).Path

foreach ($commandName in @('docker', 'git', 'scp', 'ssh')) {
  if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
    throw "Required command is unavailable: $commandName"
  }
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw 'Docker is unavailable. Start Docker Desktop (Linux containers) and retry.'
}

& docker buildx version *> $null
if ($LASTEXITCODE -ne 0) {
  throw 'Docker Buildx is unavailable.'
}

$commit = (& git -C $repositoryRoot rev-parse --short=12 HEAD).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to resolve the current Git commit.'
}

$dirty = -not [string]::IsNullOrWhiteSpace((& git -C $repositoryRoot status --porcelain))
$timestamp = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
$version = "$timestamp-$commit"
if ($dirty) {
  $version += '-dirty'
}

$imageTarPath = Join-Path ([IO.Path]::GetTempPath()) "focalapi-docs-image-$version.tar"
$imageArchivePath = "$imageTarPath.gz"
$remoteImageArchive = "/tmp/focalapi-docs-image-$version.tar.gz"
$remoteScript = '/tmp/focalapi-docs-remote-deploy.sh'
$target = "${UserName}@${HostName}"
$image = "focalapi-docs:$version"

$sshOptions = @(
  '-p', $Port,
  '-i', $identityPath,
  '-o', 'BatchMode=yes',
  '-o', 'IdentitiesOnly=yes',
  '-o', 'StrictHostKeyChecking=accept-new',
  '-o', 'ConnectTimeout=15'
)
$scpOptions = @(
  '-P', $Port,
  '-i', $identityPath,
  '-o', 'BatchMode=yes',
  '-o', 'IdentitiesOnly=yes',
  '-o', 'StrictHostKeyChecking=accept-new',
  '-o', 'ConnectTimeout=15'
)

try {
  Push-Location $repositoryRoot
  try {
    Write-Host "Building $image for $Platform locally..."
    & docker buildx build `
      '--platform' $Platform `
      '--load' `
      '--tag' $image `
      '--build-arg' "IMAGE_REGISTRY=$ImageRegistry" `
      '--file' 'Dockerfile' `
      '.'
    if ($LASTEXITCODE -ne 0) {
      throw 'Failed to build the docs image.'
    }

    & docker save '--output' $imageTarPath $image
    if ($LASTEXITCODE -ne 0) {
      throw 'Failed to export the docs image.'
    }

    $sourceStream = [IO.File]::OpenRead($imageTarPath)
    try {
      $targetStream = [IO.File]::Create($imageArchivePath)
      try {
        $gzipStream = [IO.Compression.GzipStream]::new(
          $targetStream,
          [IO.Compression.CompressionMode]::Compress
        )
        try {
          $sourceStream.CopyTo($gzipStream)
        } finally {
          $gzipStream.Dispose()
        }
      } finally {
        $targetStream.Dispose()
      }
    } finally {
      $sourceStream.Dispose()
    }
  } finally {
    Pop-Location
  }

  Write-Host "Uploading prebuilt image $image..."
  & scp @scpOptions $imageArchivePath "${target}:${remoteImageArchive}"
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to upload the docs image.'
  }

  & scp @scpOptions (Join-Path $scriptDirectory 'remote-deploy-docs.sh') "${target}:${remoteScript}"
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to upload the remote deployment script.'
  }

  $remoteCommand = "chmod 700 '$remoteScript' && '$remoteScript' '$remoteImageArchive' '$version'; result=`$?; rm -f '$remoteScript'; exit `$result"
  & ssh @sshOptions $target $remoteCommand
  if ($LASTEXITCODE -ne 0) {
    throw "Remote deployment failed for docs release $version."
  }

  Write-Host "Docs deployment complete: http://${HostName}:3001/zh/docs"
  Write-Host 'Public access requires the docs.focalapi.com proxy site + DNS record (see README).'
} finally {
  Remove-Item -LiteralPath $imageTarPath -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $imageArchivePath -Force -ErrorAction SilentlyContinue

  if (-not $KeepLocalBuildArtifacts) {
    # The image is already uploaded to production. Remove the local image and Buildx cache by default
    # so Docker Desktop does not accumulate layers on C:. Keep artifacts only while diagnosing a build.
    # This cleanup is intentionally best-effort.
    try { & docker image rm --force $image *> $null } catch {}
    try { & docker builder prune --all --force *> $null } catch {}
  }
}
