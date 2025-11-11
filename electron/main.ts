import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { DatabaseService } from './services/database.service';
import { AudioService } from './services/audio.service';
import { SystemAudioService } from './services/system-audio.service';
import { TranscriptionService } from './services/transcription.service';
import { SummaryService } from './services/summary.service';
import { ConfigService } from './services/config.service';

let mainWindow: BrowserWindow | null = null;
let dbService: DatabaseService;
let audioService: AudioService;
let systemAudioService: SystemAudioService;
let transcriptionService: TranscriptionService;
let summaryService: SummaryService;
let configService: ConfigService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#FAFAFA',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize services
  const userDataPath = app.getPath('userData');
  const appPath = app.getAppPath();
  dbService = new DatabaseService(userDataPath);
  configService = new ConfigService(userDataPath);
  audioService = new AudioService();
  systemAudioService = new SystemAudioService(userDataPath, appPath);
  transcriptionService = new TranscriptionService(configService);
  summaryService = new SummaryService(configService);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Check screen recording permission (using Swift recorder)
ipcMain.handle('check-screen-permission', async () => {
  if (process.platform !== 'darwin') {
    return { granted: true };
  }

  try {
    const granted = await systemAudioService.checkPermissions();
    return { granted };
  } catch (error) {
    return { granted: false };
  }
});

// Request screen recording permission
ipcMain.handle('request-screen-permission', async () => {
  if (process.platform !== 'darwin') {
    return { granted: true };
  }

  // On macOS, permission request is handled by the Swift binary
  // when it first tries to capture
  try {
    const granted = await systemAudioService.checkPermissions();
    return { granted };
  } catch (error) {
    return { granted: false };
  }
});

// Start system audio recording (using Swift recorder)
ipcMain.handle('start-recording', async () => {
  try {
    console.log('Starting system audio recording...');
    const result = await systemAudioService.startRecording();
    console.log('Recording result:', result);
    return result;
  } catch (error) {
    console.error('Error starting recording:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Stop system audio recording
ipcMain.handle('stop-recording', async () => {
  try {
    console.log('Stopping system audio recording...');
    const result = systemAudioService.stopRecording();
    console.log('Stop result:', result);
    return result;
  } catch (error) {
    console.error('Error stopping recording:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Save meeting to database
ipcMain.handle('save-meeting', async (_event, meeting) => {
  try {
    const id = dbService.saveMeeting(meeting);
    return { success: true, id };
  } catch (error) {
    console.error('Error saving meeting:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get all meetings
ipcMain.handle('get-meetings', async () => {
  try {
    const meetings = dbService.getAllMeetings();
    return { success: true, meetings };
  } catch (error) {
    console.error('Error getting meetings:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get meeting by ID
ipcMain.handle('get-meeting', async (_event, id: string) => {
  try {
    const meeting = dbService.getMeeting(id);
    return { success: true, meeting };
  } catch (error) {
    console.error('Error getting meeting:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Update meeting
ipcMain.handle('update-meeting', async (_event, id: string, updates) => {
  try {
    dbService.updateMeeting(id, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating meeting:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Delete meeting
ipcMain.handle('delete-meeting', async (_event, id: string) => {
  try {
    dbService.deleteMeeting(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Transcribe audio
ipcMain.handle('transcribe-audio', async (_event, filePath: string) => {
  try {
    const transcript = await transcriptionService.transcribe(filePath);
    return { success: true, transcript };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Generate summary
ipcMain.handle('generate-summary', async (_event, transcript: string) => {
  try {
    const result = await summaryService.generateSummary(transcript);
    return { success: true, summary: result.summary, title: result.title };
  } catch (error) {
    console.error('Error generating summary:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Generate meeting title
ipcMain.handle('generate-meeting-title', async (_event, summary: string) => {
  try {
    const title = await summaryService.generateMeetingTitle(summary);
    return { success: true, title };
  } catch (error) {
    console.error('Error generating meeting title:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Config management
ipcMain.handle('get-config', async () => {
  try {
    const config = configService.getConfig();
    return { success: true, config };
  } catch (error) {
    console.error('Error getting config:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('save-config', async (_event, config) => {
  try {
    configService.saveConfig(config);
    return { success: true };
  } catch (error) {
    console.error('Error saving config:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Export meeting
ipcMain.handle('export-meeting', async (_event, meetingId: string, format: 'md' | 'txt') => {
  try {
    const meeting = dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const content = format === 'md'
      ? audioService.exportAsMarkdown(meeting)
      : audioService.exportAsText(meeting);

    return { success: true, content };
  } catch (error) {
    console.error('Error exporting meeting:', error);
    return { success: false, error: (error as Error).message };
  }
});
