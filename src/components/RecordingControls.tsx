import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Button } from './ui/button';

function RecordingControls() {
  const {
    isRecording,
    recordingDuration,
    setRecording,
    setRecordingDuration,
    addMeeting,
    setCurrentView,
    setSelectedMeetingId,
  } = useAppStore();

  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer every second while recording
  useEffect(() => {
    if (isRecording && recordingStartTime > 0) {
      timerRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
        setRecordingDuration(duration);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, recordingStartTime, setRecordingDuration]);

  const startRecording = async () => {
    if (!window.electronAPI) {
      alert('This app must be run in Electron.');
      return;
    }

    try {
      console.log('Starting system audio recording via Swift...');
      const result = await window.electronAPI.startRecording();

      if (result.success) {
        setRecording(true);
        setRecordingStartTime(Date.now());
        setRecordingDuration(0);
        console.log('Recording started successfully! File:', result.filePath);
      } else {
        throw new Error(result.error || 'Failed to start recording');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(`Failed to start recording: ${(error as Error).message}`);
    }
  };

  const stopRecording = async () => {
    if (!window.electronAPI) {
      alert('This app must be run in Electron.');
      return;
    }

    try {
      console.log('Stopping system audio recording...');
      const result = await window.electronAPI.stopRecording();

      if (result.success && result.filePath) {
        setRecording(false);

        const timestamp = Date.now();
        const duration = Math.floor((timestamp - recordingStartTime) / 1000);

        // Save the meeting
        const meeting = {
          title: `Meeting ${new Date(timestamp).toLocaleString()}`,
          date: timestamp,
          duration,
          audioFilePath: result.filePath,
          status: 'recorded' as const,
        };

        const saveResult = await window.electronAPI.saveMeeting(meeting);

        if (saveResult.success && saveResult.id) {
          addMeeting({
            ...meeting,
            id: saveResult.id,
            createdAt: timestamp,
            updatedAt: timestamp,
          });

          // Navigate to meeting detail page to auto-start transcription
          setSelectedMeetingId(saveResult.id);
          setCurrentView('meeting-detail');
        } else {
          throw new Error(saveResult.error || 'Failed to save meeting');
        }
      } else {
        throw new Error(result.error || 'Failed to stop recording');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert(`Failed to stop recording: ${(error as Error).message}`);
    }
  };


  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Circular Microphone Icon */}
      <div className="mb-6">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors ${
          isRecording ? 'bg-red-500' : 'bg-primary'
        }`}>
          <svg
            className="w-16 h-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>

      {/* Status Text */}
      <div className="mb-8 text-center">
        {isRecording ? (
          <div>
            <div className="text-xl text-muted-foreground mb-2">Recording</div>
            <div className="text-3xl font-light text-foreground tabular-nums">
              {formatTime(recordingDuration)}
            </div>
          </div>
        ) : (
          <div className="text-xl text-muted-foreground">Ready to record</div>
        )}
      </div>

      {/* Recording Button */}
      {!isRecording ? (
        <Button
          onClick={startRecording}
          size="lg"
          className="px-10 rounded-full"
        >
          Start Recording
        </Button>
      ) : (
        <Button
          onClick={stopRecording}
          variant="outline"
          size="lg"
          className="px-10 rounded-full border-2"
        >
          Stop Recording
        </Button>
      )}
    </div>
  );
}

export default RecordingControls;
