import { useAppStore } from '../store/appStore';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

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
    const badges: Record<string, { text: string; variant: 'default' | 'secondary' | 'outline' }> = {
      recorded: { text: 'Recorded', variant: 'outline' },
      transcribing: { text: 'Transcribing...', variant: 'secondary' },
      transcribed: { text: 'Transcribed', variant: 'secondary' },
      summarizing: { text: 'Summarizing...', variant: 'secondary' },
      summarized: { text: 'Summarized', variant: 'default' },
    };

    const badge = badges[status] || badges.recorded;

    return (
      <Badge variant={badge.variant}>
        {badge.text}
      </Badge>
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
      {meetings.map((meeting) => (
        <Card
          key={meeting.id}
          className="cursor-pointer hover:shadow-md transition-shadow p-5"
          onClick={() => handleMeetingClick(meeting.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-card-foreground text-lg mb-2">{meeting.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatDate(meeting.date)}</span>
                <span>•</span>
                <span>{formatDuration(meeting.duration)}</span>
              </div>
            </div>
            <div>{getStatusBadge(meeting.status)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default MeetingsList;
