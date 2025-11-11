# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

**Development:**
```bash
npm run dev              # Start development server (Vite + Electron)
npm run dev:vite         # Start Vite dev server only
npm run dev:electron     # Build and run Electron only
```

**Building:**
```bash
npm run build            # Build both Electron and Vite
npm run build:electron   # Build Electron main process only
npm run build:vite       # Build Vite frontend only
npm run build:mac        # Build macOS DMG installer
npm run type-check       # Run TypeScript type checking
```

**Installation:**
```bash
npm install              # Install dependencies
npm run postinstall      # Rebuild native modules (runs automatically)
```

## Architecture Overview

This is an Electron-based macOS app with a React frontend. The architecture follows a clear client-server pattern within the Electron environment:

### IPC Communication Pattern
- **Frontend → Electron Main**: All communication goes through `window.electronAPI` (exposed via preload script)
- **Preload Script** (`electron/preload.ts`): Uses `contextBridge` to safely expose IPC methods to renderer
- **Main Process** (`electron/main.ts`): Handles IPC via `ipcMain.handle()` and delegates to service layer

### Service Layer (Backend)
All located in `electron/services/`:
- **ConfigService**: Encrypts/decrypts API keys using AES-256-GCM with key stored in user data directory
- **DatabaseService**: SQLite operations for meetings storage
- **TranscriptionService**: Handles OpenAI Whisper API calls with automatic chunking for files >25MB
- **SummaryService**: Handles OpenAI GPT API calls for summary generation
- **AudioService**: File management for audio recordings
- **SystemAudioService**: Wrapper for Swift binary that captures system audio

### State Management
- **Frontend**: Zustand store (`src/store/appStore.ts`) manages UI state, meetings list, config
- **Backend**: Services are instantiated once in `main.ts` and reused across IPC calls

### Critical Implementation Details

**FFmpeg Path Resolution**:
Production builds run with restricted PATH. The `electron/utils/ffmpeg-path.ts` utility automatically detects FFmpeg/FFprobe in common macOS locations:
- `/opt/homebrew/bin/` (Apple Silicon Homebrew)
- `/usr/local/bin/` (Intel Homebrew)
- `/opt/local/bin/` (MacPorts)

**Large Audio File Handling**:
Files >25MB are automatically split into 2-minute chunks, re-encoded to FLAC at 16kHz, transcribed sequentially, then combined. Temporary chunks are cleaned up automatically.

**Native System Audio Recording**:
Uses a compiled Swift binary (`swift/Recorder`) that leverages macOS ScreenCaptureKit API. The binary is:
- Compiled from `swift/Recorder.swift`
- Packaged with the app (see `build.asarUnpack` in `package.json`)
- Invoked by `SystemAudioService` via child process
- Requires Screen Recording permission (managed in macOS System Preferences)

**API Key Security**:
API keys are encrypted with AES-256-GCM before storage. The encryption key is generated once and stored at `~/.key` with 0o600 permissions. Config is saved to `config.enc`.

## Key File Locations

**Entry Points:**
- `electron/main.ts` - Electron main process entry
- `src/main.tsx` - React app entry
- `electron/preload.ts` - IPC bridge

**Type Definitions:**
- `electron/types.ts` - Backend types (Meeting, APIConfig, ElectronAPI interface)
- `src/types.ts` - Frontend types (mirrors backend types)

**Build Configuration:**
- `package.json` - Electron builder config, dependencies, scripts
- `vite.config.ts` - Vite build config
- `electron/tsconfig.json` - TypeScript config for Electron
- `tsconfig.json` - TypeScript config for React frontend

## Model Selection

**Transcription Models** (OpenAI Whisper):
- `gpt-4o-transcribe` (default, recommended)
- `gpt-4o-transcribe-diarize`
- `gpt-4o-mini-transcribe`
- `gpt-4o-mini-tts`

**Summary Models** (OpenAI GPT):
- `gpt-5` (default, recommended)
- `gpt-5-mini`
- `gpt-4o`
- `gpt-4o-mini`

Models are configured in Settings and stored in encrypted config.

## Permissions Required

**macOS System Permissions:**
- Screen Recording (for system audio capture via ScreenCaptureKit)
- Microphone (optional, for additional audio input)

Permission checks are handled by the Swift Recorder binary and exposed via IPC:
- `check-screen-permission`
- `request-screen-permission`

## Development Notes

**Recording in Development Mode:**
- Requires Screen Recording permission for your terminal app
- Run `./grant-dev-permission.sh` for setup instructions
- Or manually grant permission in System Settings > Privacy & Security > Screen Recording
- See DEV_RECORDING_SETUP.md for detailed instructions

**Native Module Dependencies:**
- `better-sqlite3` - Must be rebuilt for Electron after install (handled by postinstall script)
- Swift Recorder - Pre-compiled binary included in `swift/` directory

**Production Builds:**
- The app is packaged as a DMG for macOS
- Entitlements defined in `build/entitlements.mac.plist`
- Swift binary must be in `asarUnpack` to remain executable

**Database Location:**
Development and production use different locations based on Electron's `app.getPath('userData')`.

## Common Development Patterns

**Adding a new IPC handler:**
1. Add handler in `electron/main.ts` using `ipcMain.handle()`
2. Add method to preload in `electron/preload.ts`
3. Update `ElectronAPI` interface in `electron/types.ts`
4. Call from frontend via `window.electronAPI.methodName()`

**Adding a new service:**
1. Create service in `electron/services/`
2. Instantiate in `electron/main.ts` `app.whenReady()`
3. Use in IPC handlers

**API Integration:**
All external API calls go through service layer. API keys are retrieved from ConfigService, which handles decryption automatically.
- update @ARCHITECTURE.md and @README.md to reflect new changes before each commit
- when coding, make sure there is separation of concerns. do not overcomplicate solutions, use the most minimal changes to achieve the best resultsac