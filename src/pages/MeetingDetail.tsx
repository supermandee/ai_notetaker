import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Meeting } from '../types';
import ReactMarkdown from 'react-markdown';

function MeetingDetail() {
  const { selectedMeetingId, setCurrentView, updateMeeting } = useAppStore();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('summary');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [autoStarted, setAutoStarted] = useState(false);

  useEffect(() => {
    if (selectedMeetingId) {
      loadMeeting(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Auto-start transcription for newly recorded meetings
  useEffect(() => {
    if (meeting && meeting.status === 'recorded' && !isTranscribing && !autoStarted) {
      setAutoStarted(true);
      handleTranscribe();
    }
  }, [meeting, isTranscribing, autoStarted]);

  // Sync local state with meeting status (for when returning to in-progress meetings)
  useEffect(() => {
    if (meeting) {
      // Only set isTranscribing to true for 'transcribing' status
      // Don't set to false for 'recorded' status (let auto-start handle it)
      if (meeting.status === 'transcribing') {
        setIsTranscribing(true);
      } else if (meeting.status === 'transcribed' || meeting.status === 'summarizing' || meeting.status === 'summarized') {
        setIsTranscribing(false);
      }

      // Only set isSummarizing to true for 'summarizing' status
      if (meeting.status === 'summarizing') {
        setIsSummarizing(true);
      } else if (meeting.status === 'summarized') {
        setIsSummarizing(false);
      }
    }
  }, [meeting?.status]);

  const loadMeeting = async (id: string) => {
    try {
      const result = await window.electronAPI.getMeeting(id);
      if (result.success && result.meeting) {
        setMeeting(result.meeting);
        setEditedTitle(result.meeting.title);
      }
    } catch (error) {
      console.error('Error loading meeting:', error);
    }
  };

  const handleTranscribe = async () => {
    if (!meeting) return;

    setIsTranscribing(true);

    // Update status to 'transcribing' at the start
    await window.electronAPI.updateMeeting(meeting.id, {
      status: 'transcribing',
    });
    updateMeeting(meeting.id, { status: 'transcribing' });

    try {
      const result = await window.electronAPI.transcribeAudio(meeting.audioFilePath);

      if (result.success && result.transcript) {
        const updatedMeeting = {
          ...meeting,
          transcript: result.transcript,
          status: 'transcribed' as const,
        };

        await window.electronAPI.updateMeeting(meeting.id, {
          transcript: result.transcript,
          status: 'transcribed',
        });

        setMeeting(updatedMeeting);
        updateMeeting(meeting.id, updatedMeeting);
        setActiveTab('transcript');

        // Automatically start summary generation after transcription
        setIsTranscribing(false);
        handleSummarizeWithTranscript(result.transcript);
      } else {
        alert(`Transcription failed: ${result.error || 'Unknown error'}`);
        setIsTranscribing(false);
      }
    } catch (error) {
      console.error('Error transcribing:', error);
      alert('Failed to transcribe audio. Please try again.');
      setIsTranscribing(false);
    }
  };

  const handleSummarizeWithTranscript = async (transcript: string) => {
    if (!meeting) return;

    setIsSummarizing(true);

    // Update status to 'summarizing' at the start
    await window.electronAPI.updateMeeting(meeting.id, {
      status: 'summarizing',
    });
    updateMeeting(meeting.id, { status: 'summarizing' });

    try {
      const result = await window.electronAPI.generateSummary(transcript);

      if (result.success && result.summary) {
        // Use title from summary response if available, otherwise keep default
        const meetingTitle = result.title || meeting.title;

        const updatedMeeting = {
          ...meeting,
          title: meetingTitle,
          transcript: transcript, // Ensure transcript is preserved
          summary: result.summary,
          status: 'summarized' as const,
        };

        await window.electronAPI.updateMeeting(meeting.id, {
          title: meetingTitle,
          summary: result.summary,
          status: 'summarized',
        });

        setMeeting(updatedMeeting);
        setEditedTitle(meetingTitle);
        updateMeeting(meeting.id, updatedMeeting);
        setActiveTab('summary');
      } else {
        alert(`Summary generation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarize = async () => {
    if (!meeting?.transcript) return;
    await handleSummarizeWithTranscript(meeting.transcript);
  };

  const handleExport = (format: 'md' | 'txt') => {
    if (!meeting) return;

    const content = activeTab === 'transcript'
      ? meeting.transcript
      : meeting.summary;

    if (!content) {
      alert('No content to export');
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTitleSave = async () => {
    if (!meeting || !editedTitle.trim()) return;

    try {
      await window.electronAPI.updateMeeting(meeting.id, { title: editedTitle });
      setMeeting({ ...meeting, title: editedTitle });
      updateMeeting(meeting.id, { title: editedTitle });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Failed to update title. Please try again.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading meeting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-8 py-6">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Back</span>
        </button>

        <div>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-2xl font-medium"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditedTitle(meeting.title);
                }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl font-medium text-gray-900 cursor-pointer hover:text-gray-700 mb-2"
            >
              {meeting.title}
            </h1>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{new Date(meeting.date).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}</span>
            <span>•</span>
            <span>{formatDuration(meeting.duration).replace(/h |m |s/g, (match) => match.trim())}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          {!meeting.transcript && !isTranscribing && (
            <button
              onClick={handleTranscribe}
              className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 text-sm font-medium"
            >
              Transcribe Audio
            </button>
          )}
          {isTranscribing && (
            <span className="text-sm text-gray-600">Transcribing...</span>
          )}
          {meeting.transcript && !meeting.summary && !isSummarizing && (
            <button
              onClick={handleSummarize}
              className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 text-sm font-medium"
            >
              Generate Summary
            </button>
          )}
          {meeting.summary && !isSummarizing && (
            <button
              onClick={handleSummarize}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 text-sm font-medium"
            >
              Regenerate Summary
            </button>
          )}
          {isSummarizing && (
            <span className="text-sm text-gray-600">Generating summary...</span>
          )}
          {(meeting.transcript || meeting.summary) && (
            <>
              <button
                onClick={() => handleExport('md')}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 text-sm font-medium"
              >
                Export MD
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 text-sm font-medium"
              >
                Export TXT
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          {(meeting.transcript || meeting.summary) && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-2.5 rounded-full font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-6 py-2.5 rounded-full font-medium transition-colors ${
                  activeTab === 'transcript'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Transcript
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="bg-white rounded-lg p-8">
            {activeTab === 'summary' && (
              <div>
                {meeting.summary ? (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{meeting.summary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No summary yet. Generate one from the transcript.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div>
                {meeting.transcript ? (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{meeting.transcript}</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>No transcript yet. Transcribe the audio to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MeetingDetail;
