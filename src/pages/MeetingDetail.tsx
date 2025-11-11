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

    try {
      const result = await window.electronAPI.generateSummary(transcript);

      if (result.success && result.summary) {
        const updatedMeeting = {
          ...meeting,
          summary: result.summary,
          status: 'summarized' as const,
        };

        await window.electronAPI.updateMeeting(meeting.id, {
          summary: result.summary,
          status: 'summarized',
        });

        setMeeting(updatedMeeting);
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
    if (!meeting || !meeting.transcript) return;
    await handleSummarizeWithTranscript(meeting.transcript);
  };

  const handleExport = async (format: 'md' | 'txt') => {
    if (!meeting) return;

    try {
      const result = await window.electronAPI.exportMeeting(meeting.id, format);

      if (result.success && result.content) {
        // Create a download link
        const blob = new Blob([result.content], {
          type: format === 'md' ? 'text/markdown' : 'text/plain',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${meeting.title}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export meeting. Please try again.');
    }
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-border bg-white px-8 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 hover:bg-secondary rounded-lg transition-colors mt-1"
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
            </button>

            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="input-field text-2xl font-semibold"
                    autoFocus
                  />
                  <button
                    onClick={handleTitleSave}
                    className="btn-primary py-2 px-4"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(meeting.title);
                    }}
                    className="btn-secondary py-2 px-4"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-2xl font-semibold cursor-pointer hover:text-accent"
                >
                  {meeting.title}
                </h1>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span>{new Date(meeting.date).toLocaleString()}</span>
                <span>{formatDuration(meeting.duration)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('md')}
              className="btn-secondary"
              disabled={!meeting.summary && !meeting.transcript}
            >
              Export MD
            </button>
            <button
              onClick={() => handleExport('txt')}
              className="btn-secondary"
              disabled={!meeting.summary && !meeting.transcript}
            >
              Export TXT
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-4">
            {!meeting.transcript && (
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="btn-primary"
              >
                {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
              </button>
            )}

            {meeting.transcript && !meeting.summary && (
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="btn-primary"
              >
                {isSummarizing ? 'Generating Summary...' : 'Generate Summary'}
              </button>
            )}

            {meeting.transcript && meeting.summary && (
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="btn-secondary"
              >
                {isSummarizing ? 'Regenerating...' : 'Regenerate Summary'}
              </button>
            )}
          </div>

          {/* Tabs */}
          {(meeting.transcript || meeting.summary) && (
            <div className="border-b border-border">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'summary'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-gray-500 hover:text-text'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`pb-2 font-medium transition-colors ${
                    activeTab === 'transcript'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-gray-500 hover:text-text'
                  }`}
                >
                  Transcript
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="card">
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
