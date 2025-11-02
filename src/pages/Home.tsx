import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import RecordingControls from '../components/RecordingControls';
import MeetingsList from '../components/MeetingsList';
import Header from '../components/Header';

function Home() {
  const { isRecording, recordingDuration, setRecordingDuration } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(recordingDuration + 1);
      }, 1000);
    } else {
      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, recordingDuration, setRecordingDuration]);

  return (
    <div className="flex flex-col h-full">
      <Header />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Recording Section */}
          <RecordingControls />

          {/* Recent Meetings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Meetings</h2>
            <MeetingsList />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
