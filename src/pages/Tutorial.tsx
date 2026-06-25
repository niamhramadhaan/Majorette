import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Calendar, Monitor, Music, Play, ChevronLeft, BookOpen, FolderOpen, ListChecks, ScreenShare, Volume2, Maximize, ArrowRight, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

type TopicId = 'overview' | 'media' | 'schedule' | 'screens' | 'audio' | 'player';

interface Topic {
  id: TopicId;
  icon: React.ElementType;
  label: string;
}

const topics: Topic[] = [
  { id: 'overview', icon: BookOpen, label: 'Overview' },
  { id: 'media', icon: FolderOpen, label: 'Add Media' },
  { id: 'schedule', icon: ListChecks, label: 'Create Schedule' },
  { id: 'screens', icon: ScreenShare, label: 'Assign to Screens' },
  { id: 'audio', icon: Volume2, label: 'Background Audio' },
  { id: 'player', icon: Maximize, label: 'Open the Player' },
];

const workflowSteps = [
  { id: 'media' as TopicId, icon: FolderOpen, label: 'Add Media', desc: 'Ingest files' },
  { id: 'schedule' as TopicId, icon: ListChecks, label: 'Create Schedule', desc: 'Build timeline' },
  { id: 'screens' as TopicId, icon: ScreenShare, label: 'Assign Screens', desc: 'Pick endpoints' },
  { id: 'player' as TopicId, icon: Maximize, label: 'Open Player', desc: 'Start display' },
];

function TopicLink({ topicId, label, onClick }: { topicId: TopicId; label: string; onClick: (id: TopicId) => void }) {
  return (
    <button onClick={() => onClick(topicId)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium transition-colors cursor-pointer">
      <ArrowRight className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function StepIndicator({ number, icon: Icon, title }: { number: number; icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">{number}</span>
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
    </div>
  );
}

function OverviewContent({ onNavigate }: { onNavigate: (id: TopicId) => void }) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600 leading-relaxed">
        Welcome to JEMIMA! This guide walks you through setting up your digital signage — from adding media files to displaying content on your screens.
      </p>

      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/15">
        <h3 className="font-heading font-semibold text-gray-900 mb-4 text-center">Workflow</h3>
        <div className="flex items-center justify-between gap-2">
          {workflowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <button onClick={() => onNavigate(step.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/60 transition-colors cursor-pointer group flex-1">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-md transition-all">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">{step.label}</p>
                    <p className="text-[10px] text-gray-500">{step.desc}</p>
                  </div>
                </button>
                {i < workflowSteps.length - 1 && (
                  <div className="flex-shrink-0 text-gray-300">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-heading font-semibold text-gray-900">Quick Steps</h3>
        <div className="space-y-3">
          <StepIndicator number={1} icon={FolderOpen} title="Add your media files to the content folder" />
          <StepIndicator number={2} icon={ListChecks} title="Create a schedule with your media" />
          <StepIndicator number={3} icon={ScreenShare} title="Assign the schedule to a screen" />
          <StepIndicator number={4} icon={Maximize} title="Open the player to start displaying" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Jump to a topic:</p>
        <div className="flex flex-wrap gap-3">
          <TopicLink topicId="media" label="Add Media" onClick={onNavigate} />
          <TopicLink topicId="schedule" label="Create Schedule" onClick={onNavigate} />
          <TopicLink topicId="screens" label="Assign to Screens" onClick={onNavigate} />
          <TopicLink topicId="audio" label="Background Audio" onClick={onNavigate} />
          <TopicLink topicId="player" label="Open the Player" onClick={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function MediaContent({ onNavigate }: { onNavigate: (id: TopicId) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-gray-600 leading-relaxed">
        JEMIMA reads media files directly from a folder on your system — no uploading required. Navigate to <strong>Films</strong> and click <strong>Ingest</strong> to scan the folder and add files to your library.
      </p>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">Supported Formats</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Film, label: 'Video', formats: 'MP4, WebM, MKV, AVI, MOV', color: 'bg-blue-50 text-blue-600 border-blue-100' },
            { icon: Music, label: 'Audio', formats: 'MP3, WAV, OGG, FLAC, AAC', color: 'bg-purple-50 text-purple-600 border-purple-100' },
            { icon: Play, label: 'Image', formats: 'JPG, PNG, WebP, GIF, SVG', color: 'bg-orange-50 text-orange-600 border-orange-100' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={cn("p-3 rounded-lg border", item.color)}>
                <Icon className="w-5 h-5 mb-1.5" />
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[10px] opacity-75 mt-0.5">{item.formats}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <FolderOpen className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-dark font-medium">The content folder location is shown in Settings. Place your files there, then click Ingest to scan.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Next step:</p>
        <TopicLink topicId="schedule" label="Create a Schedule" onClick={onNavigate} />
      </div>
    </div>
  );
}

function ScheduleContent({ onNavigate }: { onNavigate: (id: TopicId) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-gray-600 leading-relaxed">
        A schedule defines what plays and in what order. Go to <strong>Schedule</strong> and click <strong>New Schedule</strong> to open the builder.
      </p>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">Builder Options</h3>
        <div className="space-y-3">
          {[
            { num: 1, title: 'Name', desc: 'Give your schedule a descriptive name' },
            { num: 2, title: 'Items', desc: 'Drag media from your library into the timeline' },
            { num: 3, title: 'Mode', desc: 'Loop (continuous) or Once (plays once then stops)' },
            { num: 4, title: 'Duration', desc: 'Set how long each item displays' },
          ].map(step => (
            <div key={step.num} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{step.num}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-heading font-semibold text-gray-900">Builder Preview</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Daily Loop</span>
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">LOOP</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>4 items</span>
              <span>·</span>
              <span>2m 20s</span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { icon: Film, label: 'Welcome', dur: '30s', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { icon: Music, label: 'BGM', dur: '180s', color: 'bg-purple-50 border-purple-200 text-purple-700' },
              { icon: Play, label: 'Logo', dur: '10s', color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { icon: Film, label: 'Promo', dur: '15s', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border flex-shrink-0", item.color)}>
                  <Icon className="w-3.5 h-3.5" />
                  <div>
                    <p className="text-[11px] font-medium">{item.label}</p>
                    <p className="text-[9px] opacity-60">{item.dur}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '35%' }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-400">0:00</span>
            <span className="text-[9px] text-gray-400">2:20</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <GripVertical className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-dark font-medium">Reorder items by dragging. Set individual durations for images; videos use their natural length.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">See also:</p>
        <div className="flex flex-wrap gap-3">
          <TopicLink topicId="screens" label="Assign to Screens" onClick={onNavigate} />
          <TopicLink topicId="audio" label="Background Audio" onClick={onNavigate} />
        </div>
      </div>
    </div>
  );
}

function ScreensContent({ onNavigate }: { onNavigate: (id: TopicId) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-gray-600 leading-relaxed">
        Screens are display endpoints — each one can play a different schedule. Configure screens in <strong>Locations</strong>, then assign schedules to them.
      </p>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">How to Assign</h3>
        <div className="space-y-3">
          {[
            { num: 1, title: 'Open the schedule builder' },
            { num: 2, title: 'Use the Screen picker in the builder header' },
            { num: 3, title: 'Select one or more screens' },
            { num: 4, title: 'Save the schedule' },
          ].map(step => (
            <div key={step.num} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{step.num}</span>
              <span className="text-sm text-gray-700">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">Screen → Schedule Relationship</h3>
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-900">Daily Loop</span>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="w-px h-4 bg-gray-300" />
            </div>
            <div className="flex gap-1 text-gray-300">
              <span>┌───────┴───────┐</span>
            </div>
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Monitor className="w-7 h-7 text-primary" />
                </div>
                <span className="text-xs font-medium text-gray-700">Screen 1</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Monitor className="w-7 h-7 text-blue-500" />
                </div>
                <span className="text-xs font-medium text-gray-700">Screen 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <Monitor className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-dark font-medium">Each screen gets a unique URL: /player/screen/your-screen-id. Open it in a browser or the Electron player.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">See also:</p>
        <TopicLink topicId="player" label="Open the Player" onClick={onNavigate} />
      </div>
    </div>
  );
}

function AudioContent({ onNavigate }: { onNavigate: (id: TopicId) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-gray-600 leading-relaxed">
        Background audio plays continuously behind your video or image content. Add an audio item to your schedule and mark it as an overlay.
      </p>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">How It Works</h3>
        <div className="space-y-3">
          {[
            { num: 1, title: 'Add an audio file to your schedule' },
            { num: 2, title: 'Toggle the Audio Overlay switch on that item' },
            { num: 3, title: 'The audio plays on a loop behind all other items' },
            { num: 4, title: 'It continues until the schedule ends or a new schedule starts' },
          ].map(step => (
            <div key={step.num} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{step.num}</span>
              <span className="text-sm text-gray-700">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">Audio Overlay Visual</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-gray-200">
              <Volume2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-900">Background Music</span>
              <span className="ml-auto px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded">OVERLAY</span>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-gray-200 flex-1">
                <Film className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-900">Welcome Video</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-gray-200 flex-1">
                <Play className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-gray-900">Logo Display</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center">Audio continues playing across all items</p>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-heading font-semibold text-gray-900">Mute Controls</h3>
        <p className="text-sm text-gray-600">
          The player has a mute toggle. You can configure default mute behavior in <strong>Settings</strong> for different scenarios (video with overlay, image, etc.).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">See also:</p>
        <TopicLink topicId="schedule" label="Create Schedule" onClick={onNavigate} />
      </div>
    </div>
  );
}

function PlayerContent({ onNavigate }: { onNavigate: (id: TopicId) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-gray-600 leading-relaxed">
        The player displays your scheduled content in fullscreen. Open it from the dashboard or navigate directly to the player URL.
      </p>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'Space', action: 'Play / Pause', group: 'playback' },
            { key: '→', action: 'Skip to next', group: 'playback' },
            { key: '←', action: 'Skip to previous', group: 'playback' },
            { key: 'F', action: 'Toggle fullscreen', group: 'ui' },
            { key: 'M', action: 'Mute / Unmute', group: 'ui' },
            { key: 'L', action: 'Lock controls', group: 'ui' },
            { key: '?', action: 'Show shortcuts', group: 'ui' },
          ].map(({ key, action }) => (
            <div key={key} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg">
              <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-700 shadow-sm min-w-[2rem] text-center">{key}</kbd>
              <span className="text-xs text-gray-600">{action}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-heading font-semibold text-gray-900">Player Modes</h3>
        <div className="space-y-2">
          {[
            { mode: 'Default Player', desc: 'Plays the active schedule (no screen assignment)', icon: Play },
            { mode: 'Screen Player', desc: 'Plays the schedule assigned to a specific screen', icon: Monitor },
            { mode: 'Electron EXE', desc: 'Standalone kiosk player with auto-reconnect', icon: Maximize },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.mode} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.mode}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <Monitor className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-primary-dark font-medium">Press Ctrl+Shift+C in the Electron player to return to the config screen at any time.</p>
      </div>
    </div>
  );
}

const contentMap: Record<TopicId, React.ComponentType<{ onNavigate: (id: TopicId) => void }>> = {
  overview: OverviewContent,
  media: MediaContent,
  schedule: ScheduleContent,
  screens: ScreensContent,
  audio: AudioContent,
  player: PlayerContent,
};

export default function Tutorial() {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState<TopicId>('overview');
  const [visitedTopics, setVisitedTopics] = useState<Set<TopicId>>(new Set(['overview']));

  const handleTopicChange = (id: TopicId) => {
    setActiveTopic(id);
    setVisitedTopics(prev => new Set(prev).add(id));
  };

  const ContentComponent = contentMap[activeTopic];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Tutorial</h1>
          <p className="text-sm text-gray-500 mt-0.5">Learn how to use JEMIMA</p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-52 flex-shrink-0">
          <nav className="card p-2 space-y-0.5">
            {topics.map(topic => {
              const Icon = topic.icon;
              const isActive = activeTopic === topic.id;
              const isVisited = visitedTopics.has(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicChange(topic.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{topic.label}</span>
                  {isVisited && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <div className="card p-6">
            <ContentComponent onNavigate={handleTopicChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
