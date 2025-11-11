import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import Home from './pages/Home';
import Settings from './pages/Settings';
import MeetingDetail from './pages/MeetingDetail';
import Sidebar from './components/Sidebar';

function App() {
  const { currentView, setMeetings, setConfig } = useAppStore();

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      // Check if running in Electron
      if (!window.electronAPI) {
        console.warn('Not running in Electron environment. Please use "npm run dev" to start the app properly.');
        return;
      }

      try {
        // Load meetings
        const meetingsResult = await window.electronAPI.getMeetings();
        if (meetingsResult.success && meetingsResult.meetings) {
          setMeetings(meetingsResult.meetings);
        }

        // Load config
        const configResult = await window.electronAPI.getConfig();
        if (configResult.success && configResult.config) {
          setConfig(configResult.config);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadData();
  }, [setMeetings, setConfig]);

  return (
    <div className="h-screen flex">
      <div className="flex-1 overflow-hidden">
        {currentView === 'home' && <Home />}
        {currentView === 'settings' && <Settings />}
        {currentView === 'meeting-detail' && <MeetingDetail />}
      </div>
      <Sidebar />
    </div>
  );
}

export default App;
