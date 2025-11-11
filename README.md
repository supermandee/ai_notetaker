# AI Notetaker

A minimalistic macOS application for recording, transcribing, and summarizing meetings using AI.

## Overview

AI Notetaker is an Electron-based desktop application built with React and TypeScript that helps you capture, transcribe, and summarize your online meetings. The application uses OpenAI's Whisper for high-quality transcription and GPT-4 for intelligent summarization, all while keeping your data secure and stored locally on your machine.

**Tech Stack:**
- **Frontend**: React 18 with TypeScript, Zustand for state management, Tailwind CSS with Typography plugin for styling
- **Backend**: Electron with Node.js
- **AI Services**: OpenAI Whisper models (transcription), OpenAI GPT models (summarization)
- **Database**: SQLite for local data storage
- **Build Tool**: Vite for fast development and building
- **Markdown Rendering**: react-markdown for beautiful summary display

## Features

- **Audio Recording**: Capture system audio from meetings on Teams, Zoom, Google Meet, and other platforms
- **Automatic Workflow**: After recording, automatically transcribes audio and generates summary - no manual intervention needed
- **AI Transcription**: Convert audio to text using OpenAI Whisper models (gpt-4o-transcribe, gpt-4o-transcribe-diarize, gpt-4o-mini-transcribe, gpt-4o-mini-tts)
- **AI Summarization**: Generate structured meeting summaries using GPT models (gpt-5, gpt-5-mini, gpt-4o, gpt-4o-mini)
- **Model Selection**: Choose the best model for your needs and budget
- **Large File Support**: Automatic chunking for audio files over 25MB
- **Markdown Summaries**: Beautiful markdown-rendered summaries with custom typography
- **Local Storage**: All recordings and data are stored locally on your machine
- **Encrypted API Keys**: Your API keys are encrypted and stored securely
- **Export**: Export meeting summaries and transcripts as Markdown or plain text
- **Minimalistic UI**: Clean, Apple-style interface focused on simplicity

## Prerequisites

- macOS 11 (Big Sur) or later
- Node.js 20 or later
- npm or yarn
- OpenAI API key (for transcription and summarization)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/supermandee/ai_notetaker.git
cd ai_notetaker
```

2. Install dependencies:
```bash
npm install
```

3. Set up your OpenAI API key (you'll need this for transcription and summarization)
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - You'll configure it in the app settings after launching

## Development

### Starting the Development Server

To run the application in development mode with hot-reload:

```bash
npm run dev
```

This will:
- Start the Vite development server for the React frontend
- Launch Electron with the app in development mode
- Enable hot module replacement for fast development

### Setting Up Recording in Development Mode

**Important:** Recording in development mode requires additional setup due to macOS Screen Recording permissions.

#### Quick Setup:
```bash
# Grant Screen Recording permission to your terminal app
./grant-dev-permission.sh

# Then run the dev server
npm run dev
```

For detailed setup instructions, see [DEV_RECORDING_SETUP.md](./DEV_RECORDING_SETUP.md)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the app for production
- `npm run build:mac` - Build macOS DMG installer
- `npm run build:electron` - Build Electron main process only
- `npm run type-check` - Run TypeScript type checking
- `npm run preview` - Preview production build locally

## Building for Production

### Build the Application

To build the macOS application:

```bash
npm run build:mac
```

This will:
1. Compile the TypeScript code
2. Build the React frontend with Vite
3. Package the Electron app
4. Create a DMG installer

The DMG installer will be created in the `release/` directory.

### Build Output

After building, you'll find:
- `dist/` - Compiled frontend assets
- `dist-electron/` - Compiled Electron main process
- `release/` - Final DMG installer for distribution

## Configuration

1. Launch the application
2. Click the Settings icon (gear icon) in the top right
3. Configure your transcription service:
   - **Provider**: OpenAI Whisper (more providers coming soon)
   - **Model**: Choose from gpt-4o-transcribe (recommended), gpt-4o-transcribe-diarize, gpt-4o-mini-transcribe, or gpt-4o-mini-tts
   - **API Key**: Your OpenAI API key
4. Configure your summary service:
   - **Provider**: OpenAI (more providers coming soon)
   - **Model**: Choose from gpt-5 (recommended), gpt-5-mini, gpt-4o, or gpt-4o-mini
   - **API Key**: Your OpenAI API key (can be the same key)
5. Optionally customize the summary template
6. Click "Save Settings"

Your API keys are encrypted using AES-256-GCM and stored locally. They are never sent to any server except the AI service you've configured.

## Usage

### Recording a Meeting

1. Click "Start Recording" on the home screen
2. Select the audio source (your screen/window with the meeting)
3. Grant necessary permissions when prompted
4. The recording will start automatically
5. Click "Stop Recording" when the meeting ends

### Automatic Processing

After you stop recording, the app will automatically:
1. Navigate to the meeting detail page
2. Start transcribing the audio using your configured transcription model
3. Once transcription completes, automatically generate a summary using your configured summary model
4. Display the final summary on the screen

The entire process is automatic - just start and stop recording, and the app handles the rest!

### Manual Transcription and Summarization

You can also manually process existing recordings:
1. Click on a meeting from the Recent Meetings list
2. Click "Transcribe Audio" to convert the audio to text (if not already transcribed)
3. Once transcribed, click "Generate Summary" to create a structured summary
4. View the transcript or summary using the tabs

### Exporting

From the meeting detail page:
- Click "Export MD" to export as Markdown
- Click "Export TXT" to export as plain text

## Project Structure

```
ai-notetaker/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script for IPC
│   ├── types.ts          # TypeScript types
│   └── services/         # Backend services
│       ├── database.service.ts
│       ├── config.service.ts
│       ├── audio.service.ts
│       ├── transcription.service.ts
│       └── summary.service.ts
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── store/           # Zustand state management
│   └── types.ts         # TypeScript types
├── build/               # Build configuration
└── dist/                # Compiled output
```

## Permissions

The application requires the following macOS permissions:

- **Screen Recording**: To capture system audio during meetings
- **Microphone** (optional): For additional audio input

These permissions can be managed in System Preferences > Security & Privacy > Privacy.

## Troubleshooting

### Recording doesn't work in development mode
- **Error:** "NO_DISPLAY_FOUND" or "Screen Recording permission needed"
- **Solution:** Run `./grant-dev-permission.sh` to set up permissions
- See [DEV_RECORDING_SETUP.md](./DEV_RECORDING_SETUP.md) for detailed instructions

### Intermittent "STREAM_FUNCTION_NOT_CALLED" error
- **Error:** Recording fails on first attempt with "STREAM_FUNCTION_NOT_CALLED" but works on retry
- **Cause:** macOS ScreenCaptureKit needs time to initialize and start delivering audio samples
- **Solution:** This has been fixed by increasing the stream initialization timeout from 2 to 5 seconds. If you still encounter this, try:
  - Wait a few seconds before starting your first recording
  - Ensure no other apps are heavily using system resources
  - If persistent, restart the application

### Recording doesn't capture audio in production
- Ensure you've granted Screen Recording permission to "AI Notetaker" in System Preferences
- Select the correct audio source (the window or screen with your meeting)
- Some apps may have additional audio privacy settings

### Transcription fails
- Verify your OpenAI API key is correct
- Check that you have sufficient API credits
- Ensure the audio file is in a supported format
- For production builds, ensure ffmpeg and ffprobe are installed (Homebrew: `brew install ffmpeg`)

### Summary generation fails
- Verify your OpenAI API key has access to GPT-4
- Check that the transcript is not empty
- Ensure you have sufficient API credits

## Security

- API keys are encrypted using AES-256-GCM encryption
- The encryption key is stored in macOS Keychain
- All recordings are stored locally on your machine
- No data is sent to any server except the configured AI services

## Future Enhancements

- [ ] Auto-detect meeting start/end
- [ ] Real-time transcription
- [ ] Speaker diarization
- [ ] Multiple summary templates
- [ ] Calendar integration
- [ ] Support for AssemblyAI and Google Speech-to-Text
- [ ] Support for Anthropic Claude and Google Gemini
- [ ] Multi-language support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.
