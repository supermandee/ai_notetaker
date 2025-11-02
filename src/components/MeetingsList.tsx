import { useAppStore } from '../store/appStore';

function MeetingsList() {
  const { meetings, setCurrentView, setSelectedMeetingId } = useAppStore();

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      recorded: { text: 'Recorded', color: 'bg-gray-100 text-gray-700' },
      transcribing: { text: 'Transcribing...', color: 'bg-blue-100 text-blue-700' },
      transcribed: { text: 'Transcribed', color: 'bg-green-100 text-green-700' },
      summarizing: { text: 'Summarizing...', color: 'bg-purple-100 text-purple-700' },
      summarized: { text: 'Summarized', color: 'bg-accent/10 text-accent' },
    };

    const badge = badges[status] || badges.recorded;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const handleMeetingClick = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setCurrentView('meeting-detail');
  };

  if (meetings.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No meetings yet. Start recording to create your first meeting note.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meetings.slice(0, 10).map((meeting) => (
        <button
          key={meeting.id}
          onClick={() => handleMeetingClick(meeting.id)}
          className="card w-full text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-lg mb-1">{meeting.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{formatDate(meeting.date)}</span>
                <span>{formatDuration(meeting.duration)}</span>
              </div>
            </div>
            <div>{getStatusBadge(meeting.status)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default MeetingsList;
