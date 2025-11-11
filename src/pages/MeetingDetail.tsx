import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Meeting } from '../types';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="px-8 pt-8 pb-6">
        <div className="max-w-5xl mx-auto">
          <Button
            onClick={() => setCurrentView('home')}
            variant="ghost"
            className="mb-6 px-2"
          >
            <svg
              className="w-5 h-5 mr-2"
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
          </Button>

          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-medium"
                  autoFocus
                />
                <Button onClick={handleTitleSave}>
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditedTitle(meeting.title);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl font-medium text-foreground cursor-pointer hover:text-muted-foreground mb-2"
              >
                {meeting.title}
              </h1>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            <Button
              onClick={handleTranscribe}
              className="rounded-full"
              size="sm"
            >
              Transcribe Audio
            </Button>
          )}
          {isTranscribing && (
            <span className="text-sm text-muted-foreground">Transcribing...</span>
          )}
          {meeting.transcript && !meeting.summary && !isSummarizing && (
            <Button
              onClick={handleSummarize}
              className="rounded-full"
              size="sm"
            >
              Generate Summary
            </Button>
          )}
          {meeting.summary && !isSummarizing && (
            <Button
              onClick={handleSummarize}
              variant="outline"
              className="rounded-full"
              size="sm"
            >
              Regenerate Summary
            </Button>
          )}
          {isSummarizing && (
            <span className="text-sm text-muted-foreground">Generating summary...</span>
          )}
          {(meeting.transcript || meeting.summary) && (
            <>
              <Button
                onClick={() => handleExport('md')}
                variant="outline"
                className="rounded-full"
                size="sm"
              >
                Export MD
              </Button>
              <Button
                onClick={() => handleExport('txt')}
                variant="outline"
                className="rounded-full"
                size="sm"
              >
                Export TXT
              </Button>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Tabs */}
          {(meeting.transcript || meeting.summary) && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'summary' | 'transcript')}>
              <TabsList className="mb-6">
                <TabsTrigger value="summary" className="px-6 rounded-full">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="transcript" className="px-6 rounded-full">
                  Transcript
                </TabsTrigger>
              </TabsList>

              <div className="bg-card rounded-lg p-8 border">
                <TabsContent value="summary">
                  {meeting.summary ? (
                    <div className="prose prose-slate max-w-none">
                      <ReactMarkdown>{meeting.summary}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No summary yet. Generate one from the transcript.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transcript">
                  {meeting.transcript ? (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{meeting.transcript}</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No transcript yet. Transcribe the audio to get started.</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}

export default MeetingDetail;
