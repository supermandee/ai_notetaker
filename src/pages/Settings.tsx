import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { APIConfig } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function Settings() {
  const { config, setConfig, setCurrentView } = useAppStore();
  const [formData, setFormData] = useState<APIConfig>({
    transcriptionProvider: 'openai',
    transcriptionApiKey: '',
    llmProvider: 'openai',
    llmApiKey: '',
    summaryTemplate: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Detect unsaved changes
  useEffect(() => {
    if (!config) return;
    const changed = JSON.stringify(formData) !== JSON.stringify(config);
    setHasUnsavedChanges(changed);
  }, [formData, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if running in Electron
    if (!window.electronAPI) {
      alert('This app must be run in Electron. Please use "npm run dev" to start the app properly.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const result = await window.electronAPI.saveConfig(formData);

      if (result.success) {
        setConfig(formData);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    field: keyof APIConfig,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowWarning(true);
    } else {
      setCurrentView('home');
    }
  };

  const handleSaveAndGo = async () => {
    setShowWarning(false);
    setIsSaving(true);
    try {
      const result = await window.electronAPI.saveConfig(formData);
      if (result.success) {
        setConfig(formData);
        setCurrentView('home');
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowWarning(false);
    setCurrentView('home');
  };

  const handleCancel = () => {
    setShowWarning(false);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Content */}
      <main className="flex-1 overflow-auto px-8 pt-8 pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <Button
            onClick={handleBack}
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
          <h1 className="text-2xl font-medium text-foreground mb-6">Settings</h1>
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="template">Summary Template</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transcription Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Transcription Service</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transcription-provider" className="text-base">Provider</Label>
                      <Select
                        value={formData.transcriptionProvider}
                        onValueChange={(value) =>
                          handleChange('transcriptionProvider', value as 'openai' | 'assemblyai' | 'google')
                        }
                      >
                        <SelectTrigger id="transcription-provider" className="h-11">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="assemblyai" disabled>
                            AssemblyAI (Coming Soon)
                          </SelectItem>
                          <SelectItem value="google" disabled>
                            Google Speech-to-Text (Coming Soon)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                {formData.transcriptionProvider === 'openai' && (
                  <div className="space-y-2">
                    <Label htmlFor="transcription-model" className="text-base">Model</Label>
                    <Select
                      value={formData.transcriptionModel || 'gpt-4o-transcribe'}
                      onValueChange={(value) => handleChange('transcriptionModel', value)}
                    >
                      <SelectTrigger id="transcription-model" className="h-11">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-transcribe">gpt-4o-transcribe</SelectItem>
                        <SelectItem value="gpt-4o-transcribe-diarize">gpt-4o-transcribe-diarize</SelectItem>
                        <SelectItem value="gpt-4o-mini-transcribe">gpt-4o-mini-transcribe</SelectItem>
                        <SelectItem value="gpt-4o-mini-tts">gpt-4o-mini-tts</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select the transcription model for best quality and cost
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="transcription-api-key" className="text-base">API Key</Label>
                  <Input
                    id="transcription-api-key"
                    type="password"
                    value={formData.transcriptionApiKey}
                    onChange={(e) =>
                      handleChange('transcriptionApiKey', e.target.value)
                    }
                    placeholder="sk-..."
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key is encrypted and stored locally
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* LLM Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Summary Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-provider" className="text-base">Provider</Label>
                  <Select
                    value={formData.llmProvider}
                    onValueChange={(value) =>
                      handleChange('llmProvider', value as 'openai' | 'anthropic' | 'google')
                    }
                  >
                    <SelectTrigger id="llm-provider" className="h-11">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic" disabled>
                        Anthropic Claude (Coming Soon)
                      </SelectItem>
                      <SelectItem value="google" disabled>
                        Google Gemini (Coming Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.llmProvider === 'openai' && (
                  <div className="space-y-2">
                    <Label htmlFor="llm-model" className="text-base">Model</Label>
                    <Select
                      value={formData.llmModel || 'gpt-5'}
                      onValueChange={(value) => handleChange('llmModel', value)}
                    >
                      <SelectTrigger id="llm-model" className="h-11">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-5">gpt-5</SelectItem>
                        <SelectItem value="gpt-5-mini">gpt-5-mini</SelectItem>
                        <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Select the model for generating summaries
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="llm-api-key" className="text-base">API Key</Label>
                  <Input
                    id="llm-api-key"
                    type="password"
                    value={formData.llmApiKey}
                    onChange={(e) => handleChange('llmApiKey', e.target.value)}
                    placeholder="sk-..."
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your API key is encrypted and stored locally
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>

              {saveSuccess && (
                <span className="text-foreground text-sm font-medium">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="template">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Summary Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Summary Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="summary-template" className="text-base">Template (Markdown)</Label>
                <Textarea
                  id="summary-template"
                  value={formData.summaryTemplate}
                  onChange={(e) =>
                    handleChange('summaryTemplate', e.target.value)
                  }
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="# Meeting Summary&#10;&#10;## Key Points&#10;..."
                />
                <p className="text-sm text-muted-foreground">
                  This template guides how the AI structures your meeting summaries
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>

              {saveSuccess && (
                <span className="text-foreground text-sm font-medium">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </form>
        </TabsContent>
      </Tabs>
      </div>
    </main>

    {/* Unsaved Changes Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3">
            <Button
              onClick={handleSaveAndGo}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleDiscard}
              variant="outline"
              className="w-full"
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Settings;
