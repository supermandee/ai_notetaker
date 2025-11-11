import { create } from 'zustand';
import { Meeting, APIConfig } from '../types';

interface AppState {
  // Recording state
  isRecording: boolean;
  recordingDuration: number;

  // Meetings list
  meetings: Meeting[];

  // Config
  config: APIConfig | null;

  // UI state
  currentView: 'home' | 'settings' | 'meeting-detail';
  selectedMeetingId: string | null;

  // Actions
  setRecording: (isRecording: boolean) => void;
  setRecordingDuration: (duration: number) => void;
  setMeetings: (meetings: Meeting[]) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  removeMeeting: (id: string) => void;
  setConfig: (config: APIConfig) => void;
  setCurrentView: (view: 'home' | 'settings' | 'meeting-detail') => void;
  setSelectedMeetingId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isRecording: false,
  recordingDuration: 0,
  meetings: [],
  config: null,
  currentView: 'home',
  selectedMeetingId: null,

  // Actions
  setRecording: (isRecording) => set({ isRecording }),
  setRecordingDuration: (duration) => set({ recordingDuration: duration }),

  setMeetings: (meetings) => set({ meetings }),

  addMeeting: (meeting) =>
    set((state) => ({
      meetings: [meeting, ...state.meetings],
    })),

  updateMeeting: (id, updates) =>
    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  removeMeeting: (id) =>
    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
    })),

  setConfig: (config) => set({ config }),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedMeetingId: (id) => set({ selectedMeetingId: id }),
}));
