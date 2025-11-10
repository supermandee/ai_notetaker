import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Finds the full path to ffmpeg or ffprobe binaries.
 * In production Electron apps, the PATH is restricted, so we need to
 * check common installation locations manually.
 */
export function findBinaryPath(binaryName: 'ffmpeg' | 'ffprobe'): string {
  // Common installation paths on macOS
  const commonPaths = [
    `/opt/homebrew/bin/${binaryName}`, // Apple Silicon Homebrew
    `/usr/local/bin/${binaryName}`,     // Intel Homebrew / manual install
    `/opt/local/bin/${binaryName}`,     // MacPorts
  ];

  // Check common paths first
  for (const binPath of commonPaths) {
    if (fs.existsSync(binPath)) {
      return binPath;
    }
  }

  // Try to find it using 'which' command
  try {
    const result = execSync(`which ${binaryName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
    }).trim();

    if (result && fs.existsSync(result)) {
      return result;
    }
  } catch (error) {
    // 'which' failed, continue to fallback
  }

  // Fallback to just the binary name (will work if it's in PATH)
  return binaryName;
}

// Cache the paths so we don't need to search every time
let cachedFfmpegPath: string | null = null;
let cachedFfprobePath: string | null = null;

export function getFfmpegPath(): string {
  if (!cachedFfmpegPath) {
    cachedFfmpegPath = findBinaryPath('ffmpeg');
    console.log(`Using ffmpeg at: ${cachedFfmpegPath}`);
  }
  return cachedFfmpegPath;
}

export function getFfprobePath(): string {
  if (!cachedFfprobePath) {
    cachedFfprobePath = findBinaryPath('ffprobe');
    console.log(`Using ffprobe at: ${cachedFfprobePath}`);
  }
  return cachedFfprobePath;
}
