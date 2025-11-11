import { useEffect } from 'react';
import RecordingControls from '../components/RecordingControls';
import MeetingsList from '../components/MeetingsList';
import { useAppStore } from '../store/appStore';

function Home() {
  const { setMeetings, meetings } = useAppStore();

  // Refresh meetings list when component mounts
  useEffect(() => {
    const loadMeetings = async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.getMeetings();
        if (result.success && result.meetings) {
          setMeetings(result.meetings);
        }
      }
    };
    loadMeetings();
  }, [setMeetings]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <main className="flex-1 px-4 sm:px-8 md:px-16 py-8">
        {/* Title */}
        <h1 className="text-2xl font-medium text-gray-900 mb-12 text-center w-full">AI Notetaker</h1>

        {/* Recording Section */}
        <div className="max-w-3xl mx-auto">
          <RecordingControls />

          {/* Recent Meetings or Empty State */}
          <div className="mt-16">
            {meetings.length === 0 ? (
              <p className="text-center text-gray-500">
                No meetings yet. Start recording to create your first meeting.
              </p>
            ) : (
              <MeetingsList />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
