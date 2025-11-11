import { useAppStore } from '../store/appStore';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

function Sidebar() {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <div className="w-20 h-full bg-muted flex flex-col items-center py-6 gap-4">
      <Button
        onClick={() => setCurrentView('home')}
        size="icon"
        variant={currentView === 'home' ? 'default' : 'outline'}
        className={cn(
          "w-12 h-12 rounded-full",
          currentView === 'home'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-foreground hover:bg-secondary'
        )}
        aria-label="Home"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </Button>

      <Button
        onClick={() => setCurrentView('settings')}
        size="icon"
        variant={currentView === 'settings' ? 'default' : 'outline'}
        className={cn(
          "w-12 h-12 rounded-full",
          currentView === 'settings'
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-foreground hover:bg-secondary'
        )}
        aria-label="Settings"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Button>
    </div>
  );
}

export default Sidebar;
