import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Bot, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface VoiceAssistantProps {
  machineId?: number;
  operatorId?: number;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ machineId, operatorId }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Speech STT Recognition setup
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleSendQuestion(text);
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Voice recognition error. You can also type your question.');
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    } else {
      setError('Web Speech API is not supported in this browser. Please use text input.');
    }
  }, [machineId, operatorId]);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError(null);
      setTranscript('');
      setResponse(null);
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendQuestion = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.askCopilot(text, machineId || 1, operatorId || 1);
      setResponse(res);

      // Web Speech TTS Audio Synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Speak first 2 sentences for clarity
        const speakText = res.answer.split('\n\n')[0].replace(/\*\*/g, '');
        const utterance = new SpeechSynthesisUtterance(speakText);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setError(`Failed to consult Copilot: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cat-gray-200 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cat-black text-cat-yellow flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-cat-black">Voice-Activated Safety & Operations Copilot</h3>
            <p className="text-xs text-cat-gray-500 font-semibold">Caterpillar Technical Manual RAG & Live Telemetry</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-cat-yellow text-cat-black font-extrabold text-[10px] rounded-lg uppercase tracking-wider">
          Hands-Free Cabin Voice
        </span>
      </div>

      {/* Voice Mic Orb & Visualizer */}
      <div className="flex flex-col items-center justify-center py-6 bg-cat-black rounded-2xl border border-cat-gray-700/50 mb-5 text-white">
        <button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-cat-red text-white shadow-lg animate-ping'
              : 'bg-cat-yellow hover:bg-yellow-400 text-cat-black shadow-md cursor-pointer'
          }`}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>

        <p className="mt-4 text-xs font-bold text-cat-gray-200">
          {isListening ? 'Listening to your command...' : 'Tap to speak hands-free or try a sample prompt below'}
        </p>

        {/* Animated Waveform Bars */}
        <div className="flex items-center gap-1.5 mt-3 h-6">
          {[20, 45, 75, 100, 60, 85, 30, 90, 50, 25].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-300 ${
                isListening ? 'bg-cat-yellow' : 'bg-cat-gray-700'
              }`}
              style={{ height: isListening ? `${h}%` : '4px' }}
            />
          ))}
        </div>
      </div>

      {/* Sample Quick Questions */}
      <div className="mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-cat-gray-500 block mb-2">
          Recommended Pilot Queries
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            'What is the standard hydraulic operating temperature for CAT 320?',
            'What does the level 2 warning on hydraulic fluid mean?',
            'What are the mandatory pre-start safety checklist requirements?',
            'How does Cat Grade E-Fence boundary lock work?'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(prompt);
                handleSendQuestion(prompt);
              }}
              className="text-left bg-cat-gray-50 hover:bg-cat-yellow/20 hover:border-cat-yellow border border-cat-gray-200 px-3 py-1.5 rounded-xl text-xs font-medium text-cat-black transition-all cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Transcript Input / Display */}
      {transcript && (
        <div className="p-3 bg-cat-gray-50 rounded-xl border border-cat-gray-200 mb-4 text-xs">
          <span className="text-[10px] font-bold text-cat-gray-500 uppercase">You asked:</span>
          <p className="font-bold text-cat-black mt-0.5">{transcript}</p>
        </div>
      )}

      {isLoading && (
        <div className="p-4 bg-cat-yellow/10 border border-cat-yellow/30 rounded-xl text-xs font-bold text-cat-black flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-cat-yellow border-t-transparent rounded-full animate-spin" />
          <span>Searching CAT 320 Technical Manual & analyzing live sensor state...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-cat-red/10 border border-cat-red/30 rounded-xl text-xs font-bold text-cat-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Copilot Synthesized Answer with Manual Section Citations */}
      {response && (
        <div className="mt-4 p-5 bg-white border-2 border-cat-yellow/60 rounded-2xl shadow-sm text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-cat-gray-200 mb-3">
            <span className="font-extrabold text-cat-black flex items-center gap-2">
              <Bot className="w-4 h-4 text-cat-yellow" />
              Copilot Verified Guidance
            </span>
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(response.answer.replace(/\*\*/g, ''));
                  window.speechSynthesis.speak(utterance);
                }
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-cat-blue hover:underline cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" /> Replay Audio
            </button>
          </div>

          <div className="text-cat-black font-normal whitespace-pre-line leading-relaxed">
            {response.answer}
          </div>

          {/* Manual Citations */}
          {response.sources && response.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-cat-gray-100">
              <span className="text-[10px] font-black uppercase text-cat-gray-500 flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-cat-gray-500" />
                Caterpillar Manual Citations
              </span>
              <div className="space-y-1.5">
                {response.sources.map((src: any, i: number) => (
                  <div key={i} className="p-2 bg-cat-gray-50 rounded-lg border border-cat-gray-200 text-[11px]">
                    <span className="font-bold text-cat-black">{src.doc_name}</span>
                    <span className="text-cat-gray-500 font-semibold block">{src.section}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
