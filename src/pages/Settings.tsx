import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { APIConfig } from '../types';

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

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-border bg-white px-8 py-4 flex items-center">
        <button
          onClick={() => setCurrentView('home')}
          className="p-2 hover:bg-secondary rounded-lg transition-colors mr-4"
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
        <h1 className="text-2xl font-semibold">Settings</h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transcription Settings */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Transcription Service</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Provider
                  </label>
                  <select
                    value={formData.transcriptionProvider}
                    onChange={(e) =>
                      handleChange(
                        'transcriptionProvider',
                        e.target.value as 'openai' | 'assemblyai' | 'google'
                      )
                    }
                    className="input-field"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="assemblyai" disabled>
                      AssemblyAI (Coming Soon)
                    </option>
                    <option value="google" disabled>
                      Google Speech-to-Text (Coming Soon)
                    </option>
                  </select>
                </div>

                {formData.transcriptionProvider === 'openai' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Model
                    </label>
                    <select
                      value={formData.transcriptionModel || 'gpt-4o-transcribe'}
                      onChange={(e) =>
                        handleChange('transcriptionModel', e.target.value)
                      }
                      className="input-field"
                    >
                      <option value="gpt-4o-transcribe">gpt-4o-transcribe</option>
                      <option value="gpt-4o-transcribe-diarize">gpt-4o-transcribe-diarize</option>
                      <option value="gpt-4o-mini-transcribe">gpt-4o-mini-transcribe</option>
                      <option value="gpt-4o-mini-tts">gpt-4o-mini-tts</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the transcription model for best quality and cost
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.transcriptionApiKey}
                    onChange={(e) =>
                      handleChange('transcriptionApiKey', e.target.value)
                    }
                    placeholder="sk-..."
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is encrypted and stored locally
                  </p>
                </div>
              </div>
            </div>

            {/* LLM Settings */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Summary Service</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Provider
                  </label>
                  <select
                    value={formData.llmProvider}
                    onChange={(e) =>
                      handleChange(
                        'llmProvider',
                        e.target.value as 'openai' | 'anthropic' | 'google'
                      )
                    }
                    className="input-field"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic" disabled>
                      Anthropic Claude (Coming Soon)
                    </option>
                    <option value="google" disabled>
                      Google Gemini (Coming Soon)
                    </option>
                  </select>
                </div>

                {formData.llmProvider === 'openai' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Model
                    </label>
                    <select
                      value={formData.llmModel || 'gpt-5'}
                      onChange={(e) =>
                        handleChange('llmModel', e.target.value)
                      }
                      className="input-field"
                    >
                      <option value="gpt-5">gpt-5</option>
                      <option value="gpt-5-mini">gpt-5-mini</option>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the model for generating summaries
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.llmApiKey}
                    onChange={(e) => handleChange('llmApiKey', e.target.value)}
                    placeholder="sk-..."
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is encrypted and stored locally
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Template */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Summary Template</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Template (Markdown)
                </label>
                <textarea
                  value={formData.summaryTemplate}
                  onChange={(e) =>
                    handleChange('summaryTemplate', e.target.value)
                  }
                  rows={10}
                  className="input-field font-mono text-sm"
                  placeholder="# Meeting Summary&#10;&#10;## Key Points&#10;..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This template guides how the AI structures your meeting summaries
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>

              {saveSuccess && (
                <span className="text-green-600 text-sm">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Settings;
