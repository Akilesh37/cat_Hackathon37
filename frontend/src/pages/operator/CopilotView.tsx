import React, { useState } from 'react';
import { VoiceAssistant } from '../../components/VoiceAssistant';
import { CopilotChat } from '../../components/CopilotChat';
import { useSessionStore } from '../../store/sessionStore';
import { Mic, MessageSquare } from 'lucide-react';

export const CopilotView: React.FC = () => {
  const { user } = useSessionStore();
  const [mode, setMode] = useState<'voice' | 'chat'>('voice');
  const machineId = user?.userId === 3 ? 5 : (user?.userId === 2 ? 2 : 1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-cat-gray-200/60 rounded-2xl border border-cat-gray-200">
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'voice'
                ? 'bg-cat-yellow text-cat-black shadow-sm'
                : 'text-cat-gray-700 hover:text-cat-black'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice Assistant
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mode === 'chat'
                ? 'bg-cat-yellow text-cat-black shadow-sm'
                : 'text-cat-gray-700 hover:text-cat-black'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Text & Citations Chat
          </button>
        </div>
      </div>

      {mode === 'voice' ? (
        <VoiceAssistant machineId={machineId} operatorId={user?.userId || 1} />
      ) : (
        <CopilotChat machineId={machineId} operatorId={user?.userId || 1} />
      )}
    </div>
  );
};
