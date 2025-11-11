# AI Notetaker - Architecture & Design Document

## Project Overview

A minimalistic web application for recording, transcribing, and summarizing meeting audio on macOS with a focus on simplicity and user experience.

---

## Requirements

### Functional Requirements

#### Core Features (MVP)
1. **Audio Recording**
   - Capture system audio (speakers/headphones) on macOS
   - Support for Teams, Zoom, Google Meet, and other meeting platforms
   - Manual start/stop recording controls
   - Audio format: WAV or MP3

2. **Transcription**
   - Convert recorded audio to text using voice-to-text API
   - Support for multiple transcription services (OpenAI Whisper, AssemblyAI, Google Speech-to-Text)
   - User-provided API keys
   - Display transcription progress

3. **Summary Generation**
   - Generate meeting summaries using LLM (OpenAI GPT, Anthropic Claude, etc.)
   - Customizable summary template
   - User-provided API keys
   - Export summary as markdown/text

4. **API Key Management**
   - Secure storage of user API keys
   - Support for multiple service providers
   - Easy configuration interface

#### Future Features (Post-MVP)
- Auto-detect meeting start/end
- Real-time transcription
- Speaker diarization
- Multiple summary templates
- Calendar integration
- Search and archive past meetings
- Multi-language support

### Non-Functional Requirements

1. **Security**
   - API keys encrypted at rest
   - No audio/transcription data sent to third-party servers (except chosen APIs)
   - Local storage of recordings

2. **Performance**
   - Handle recordings up to 2 hours
   - Transcription processing within reasonable time
   - Responsive UI (no freezing during processing)

3. **Usability**
   - Minimalistic, Apple-style interface
   - Maximum 3 clicks to start recording
   - Clear visual feedback for all states

4. **Compatibility**
   - macOS 11+ (Big Sur and later)
   - Modern browsers (Chrome, Safari, Firefox)

---

## Technical Architecture

### Architecture Pattern: Client-Server with Local Processing

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (UI)                      │
│  - React/Next.js                                     │
│  - Tailwind CSS (minimalistic styling)              │
│  - State management (Zustand/Context)               │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  │
┌─────────────────▼───────────────────────────────────┐
│              Backend Server (Node.js)                │
│  - Express.js/Fastify                                │
│  - Audio processing (FFmpeg)                         │
│  - API orchestration                                 │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┼─────────┬─────────────┐
        │         │         │             │
┌───────▼──┐ ┌────▼────┐ ┌─▼─────────┐  ┌▼──────────┐
│  macOS   │ │Voice-to-│ │    LLM    │  │   Local   │
│  Audio   │ │  Text   │ │    API    │  │  Storage  │
│ Capture  │ │   API   │ │           │  │ (SQLite)  │
└──────────┘ └─────────┘ └───────────┘  └───────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript (Vite)
- **Styling**: Tailwind CSS with custom minimalistic theme + Typography plugin
- **Markdown Rendering**: react-markdown for summary display
- **State Management**: Zustand
- **Icons**: SF Symbols style (SVG icons)

#### Backend
- **Runtime**: Electron with Node.js 20+
- **Audio Processing**: FFmpeg and FFprobe (with automatic path resolution for production builds)
- **Database**: SQLite (for local storage)
- **Encryption**: AES-256-GCM for API key encryption
- **Audio Capture**: Electron desktopCapturer API

#### macOS Audio Capture
- **Option 1**: BlackHole (virtual audio driver) + SoX/FFmpeg
- **Option 2**: Electron with desktopCapturer API
- **Option 3**: Native macOS app with Screen Recording permission

#### External APIs
- **Transcription Services**:
  - OpenAI Whisper API (gpt-4o-transcribe, gpt-4o-transcribe-diarize, gpt-4o-mini-transcribe, gpt-4o-mini-tts)
  - AssemblyAI (planned)
  - Google Cloud Speech-to-Text (planned)

- **LLM Services**:
  - OpenAI GPT models (gpt-5, gpt-5-mini, gpt-4o, gpt-4o-mini)
  - Anthropic Claude (planned)
  - Google Gemini (planned)

---

## Infrastructure & Deployment

### Development Environment
```
ai-notetaker/
├── frontend/               # Next.js application
│   ├── app/
│   │   ├── page.tsx       # Main recording interface
│   │   ├── settings/      # API key configuration
│   │   └── history/       # Past meetings
│   ├── components/
│   └── styles/
├── backend/               # Node.js server
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── audio.service.ts
│   │   │   ├── transcription.service.ts
│   │   │   └── summary.service.ts
│   │   └── db/
│   └── uploads/           # Temporary audio files
├── electron/              # Electron wrapper (if needed)
└── docs/
```

### Deployment Strategy

#### Option 1: Electron App (Recommended for MVP)
- **Pros**: Full system audio access, native macOS integration, offline-first
- **Cons**: Larger app size, platform-specific builds
- **Distribution**: DMG installer for macOS

#### Option 2: Web App + Local Server
- **Pros**: Lighter weight, easier updates
- **Cons**: Requires separate audio capture utility
- **Distribution**: npm package or standalone server

### Storage Requirements
- **Audio Files**: ~10-50 MB per hour (compressed)
- **Database**: ~1-5 MB per 100 meetings
- **Application**: ~100-200 MB (including dependencies)

---

## System Design

### Audio Recording Flow

```
User clicks "Record"
    → Request microphone/screen recording permission
    → Start capturing system audio
    → Display recording timer
    → User clicks "Stop"
    → Save audio file locally
    → Navigate to meeting detail page
    → Automatically start transcription (see Transcription Flow)
```

### Transcription Flow

```
Automatic (after recording stops) OR User clicks "Transcribe Audio"
    → Send audio file to selected transcription API
    → Display transcription progress
    → Receive transcript from API
    → Save transcript to local database
    → Update UI with transcript
    → Automatically trigger summary generation (see Summary Generation Flow)
```

### Summary Generation Flow

```
Automatic (after transcription completes) OR User clicks "Generate Summary"
    → Send transcript + template to LLM API
    → Display loading state (showing "Generating Summary...")
    → Receive and display summary
    → Save summary to database
    → Switch to summary tab to display result
    → Allow editing and export
```

### Data Models

#### Meeting Record
```typescript
interface Meeting {
  id: string;
  title: string;
  date: Date;
  duration: number;
  audioFilePath: string;
  transcript?: string;
  summary?: string;
  status: 'recorded' | 'transcribed' | 'summarized';
}
```

#### API Configuration
```typescript
interface APIConfig {
  transcriptionProvider: 'openai' | 'assemblyai' | 'google';
  transcriptionApiKey: string;
  transcriptionModel?: string; // Model selection for OpenAI
  llmProvider: 'openai' | 'anthropic' | 'google';
  llmApiKey: string;
  llmModel?: string; // Model selection for OpenAI
  summaryTemplate: string;
}
```

---

## UI/UX Design Principles

### Design Language
- **Aesthetic**: Minimalist, Apple-inspired
- **Color Palette**:
  - Primary: White/Light Gray (#FAFAFA)
  - Accent: Subtle Blue (#007AFF)
  - Text: Dark Gray (#1D1D1F)
  - Borders: Light Gray (#E5E5E7)
- **Typography**: SF Pro Display (or Inter as fallback)
- **Spacing**: Generous whitespace, 8px grid system
- **Borders**: Subtle, rounded corners (8-12px)

### Key Screens

#### 1. Home/Recording Screen
```
┌────────────────────────────────────┐
│  AI Notetaker              ⚙️      │
├────────────────────────────────────┤
│                                     │
│         ⏺️  00:00:00               │
│                                     │
│     [    Start Recording    ]      │
│                                     │
│  Recent Meetings:                  │
│  • Team Sync - 2 hours ago         │
│  • Client Call - Yesterday         │
│                                     │
└────────────────────────────────────┘
```

#### 2. Settings Screen
```
┌────────────────────────────────────┐
│  ← Settings                         │
├────────────────────────────────────┤
│  Transcription Service             │
│  [OpenAI Whisper ▼]                │
│  API Key: ••••••••••••             │
│                                     │
│  Summary Service                   │
│  [OpenAI GPT-4 ▼]                  │
│  API Key: ••••••••••••             │
│                                     │
│  Summary Template                  │
│  [Edit Template]                   │
│                                     │
└────────────────────────────────────┘
```

#### 3. Meeting Summary Screen
```
┌────────────────────────────────────┐
│  ← Team Sync Meeting                │
├────────────────────────────────────┤
│  📅 Nov 1, 2025 • 45 min           │
│                                     │
│  Transcript | Summary              │
│  ─────────────────────              │
│                                     │
│  ## Key Points                     │
│  • Discussed Q4 roadmap            │
│  • Action items assigned           │
│                                     │
│  [Export]  [Regenerate]            │
│                                     │
└────────────────────────────────────┘
```

---

## Security Considerations

1. **API Key Storage**
   - Encrypt keys using AES-256
   - Store encryption key in macOS Keychain
   - Never log or expose keys in plain text

2. **Audio File Storage**
   - Store locally in user directory
   - Option to auto-delete after transcription
   - No cloud upload unless explicitly enabled

3. **Network Security**
   - HTTPS for all API calls
   - Validate SSL certificates
   - Implement rate limiting

4. **Permissions**
   - Request minimal macOS permissions
   - Clear explanation of why permissions are needed
   - Allow users to deny optional permissions

---

## Development Phases

### Phase 1: MVP (Weeks 1-4)
- [x] Basic UI with recording interface
- [x] Audio capture implementation
- [x] OpenAI Whisper integration with multiple model options
- [x] OpenAI GPT integration with GPT-5 support
- [x] Basic summary template
- [x] Settings page for API keys and model selection
- [x] Markdown rendering for summaries
- [x] Large file chunking support (>25MB)
- [x] Automatic transcription and summarization workflow

### Phase 2: Enhancement (Weeks 5-8)
- [ ] Multiple transcription providers
- [ ] Multiple LLM providers
- [ ] Custom summary templates
- [ ] Meeting history and search
- [x] Export functionality

### Phase 3: Advanced Features (Weeks 9+)
- [ ] Auto-detection of meetings
- [ ] Real-time transcription
- [ ] Speaker diarization
- [ ] Calendar integration
- [ ] Advanced templates

---

## Technical Challenges & Solutions

### Challenge 1: macOS System Audio Capture
**Problem**: macOS doesn't allow direct system audio capture for security reasons

**Solutions**:
1. Use virtual audio driver (BlackHole) - requires user installation
2. Use Electron's desktopCapturer with screen recording permission
3. Build native macOS app with Core Audio

**Implemented**: Electron with desktopCapturer API (best balance of ease and functionality)

### Challenge 4: FFmpeg Path Resolution in Production
**Problem**: Production Electron builds run with restricted PATH, causing ffmpeg/ffprobe to not be found

**Solution** (Implemented):
- Created utility to automatically detect FFmpeg installation paths
- Checks common macOS locations (Homebrew Intel/Silicon, MacPorts)
- Falls back to `which` command
- Caches paths for performance

### Challenge 5: Audio Stream Initialization Timeout
**Problem**: Swift Recorder binary intermittently fails with "STREAM_FUNCTION_NOT_CALLED" error on first recording attempt. The screen capture system needs time to initialize and deliver the first audio buffer, but this can exceed the timeout period, especially on slower systems or first run.

**Solution** (Implemented):
- Increased stream initialization timeout from 2 seconds to 5 seconds in Swift Recorder
- Allows sufficient time for macOS ScreenCaptureKit to initialize and start delivering audio samples
- Reduces intermittent failures while maintaining reasonable timeout protection

**Technical Details**: The Swift Recorder waits for the `stream(_:didOutputSampleBuffer:of:)` delegate method to be called, which confirms that the audio stream is actively delivering data. If this doesn't happen within the timeout, it indicates a system-level issue rather than the recorder waiting indefinitely.

### Challenge 2: Large Audio Files
**Problem**: Processing large audio files can be slow and exceed API limits

**Solutions** (Implemented):
1. Automatic chunking for files over 25MB
2. Re-encode to FLAC with 16kHz sample rate to reduce size
3. Sequential chunk processing with progress logging
4. Automatic cleanup of temporary chunk files

**Current Implementation**: Files are split into 2-minute chunks using FFmpeg, transcribed sequentially, then combined.

### Challenge 3: API Rate Limits
**Problem**: Transcription/LLM APIs have rate limits

**Solutions**:
1. Implement queue system
2. Show estimated wait times
3. Allow batch processing
4. Cache results locally

---

## Success Metrics

1. **User Experience**
   - Recording start time < 3 seconds
   - UI response time < 100ms
   - Transcription accuracy > 90%

2. **Reliability**
   - Zero data loss
   - Graceful API failure handling
   - Auto-save functionality

3. **Adoption**
   - User completes first recording within 5 minutes
   - User returns for second use
   - User recommends to others

---

## Next Steps

1. Set up development environment
2. Create basic UI mockups in Figma (optional)
3. Implement audio capture prototype
4. Test with different meeting platforms
5. Integrate first transcription API
6. Iterate based on user feedback
