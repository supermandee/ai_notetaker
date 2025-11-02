import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';

function RecordingControls() {
  const {
    isRecording,
    recordingDuration,
    setRecording,
    setRecordingDuration,
    addMeeting,
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

          alert('Recording saved successfully!');
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
    <div className="card text-center">
      {/* Timer Display */}
      <div className="mb-8">
        <div className={`text-5xl font-light tabular-nums ${isRecording ? 'text-red-500' : 'text-text'}`}>
          {isRecording && (
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-4 animate-pulse" />
          )}
          {formatTime(recordingDuration)}
        </div>
      </div>

      {/* Recording Button */}
      <div className="mb-6">
        {!isRecording ? (
          <button onClick={startRecording} className="btn-primary px-12">
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="btn-secondary px-12">
            Stop Recording
          </button>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <p>🎤 System Audio Recording</p>
        <p className="text-xs mt-1">Captures all audio from your Mac (meetings, calls, etc.)</p>
      </div>
    </div>
  );
}

export default RecordingControls;
