import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  sources?: any[];
  timestamp: string;
}

interface CopilotChatProps {
  machineId?: number;
  operatorId?: number;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ machineId = 1, operatorId = 1 }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: 'Hello, I am your CAT Safety & Operations Copilot. How can I assist you with machine diagnostics, fluid levels, or pre-shift safety guidelines?',
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');

    const newMsg: Message = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const res = await api.askCopilot(userText, machineId, operatorId);
      const botMsg: Message = {
        sender: 'copilot',
        text: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        sender: 'copilot',
        text: `Error retrieving guidance: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-cat-gray-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cat-gray-200 flex items-center justify-between bg-cat-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cat-black text-cat-yellow flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-cat-black">CAT Technical Copilot</h3>
            <p className="text-[10px] text-cat-gray-500 font-bold uppercase">RAG Engine • Powered by CAT 320 Manual</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-cat-green bg-cat-green/10 px-2 py-0.5 rounded-lg border border-cat-green/20">
          <Sparkles className="w-3 h-3" /> Live Context Active
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'copilot' && (
              <div className="w-7 h-7 rounded-lg bg-cat-black text-cat-yellow flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cat-black text-white rounded-tr-none'
                  : 'bg-cat-gray-50 border border-cat-gray-200 text-cat-black rounded-tl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {/* Citations */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-cat-gray-200/80">
                  <div className="text-[10px] font-extrabold uppercase text-cat-gray-500 flex items-center gap-1 mb-1.5">
                    <BookOpen className="w-3 h-3 text-cat-yellow" /> Caterpillar Official Manual Citations
                  </div>
                  {m.sources.map((s, i) => (
                    <div key={i} className="text-[11px] p-1.5 bg-white rounded-lg border border-cat-gray-200 mt-1">
                      <span className="font-bold text-cat-black">{s.doc_name}</span>
                      <span className="text-cat-gray-500 block">{s.section}</span>
                    </div>
                  ))}
                </div>
              )}

              <span className={`block text-[9px] mt-2 font-medium ${m.sender === 'user' ? 'text-cat-gray-400' : 'text-cat-gray-500'}`}>
                {m.timestamp}
              </span>
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-cat-yellow text-cat-black flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-cat-black text-cat-yellow flex items-center justify-center shrink-0 mt-0.5 text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-cat-gray-50 border border-cat-gray-200 rounded-2xl p-4 text-xs text-cat-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cat-yellow animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-cat-yellow animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-cat-yellow animate-bounce delay-200" />
              <span>Analyzing manual chapters & live sensors...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-cat-gray-200 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot (e.g., 'What is standard hydraulic temperature for CAT 320?')"
          className="flex-1 bg-cat-gray-50 border border-cat-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-cat-yellow text-cat-black"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-cat-yellow hover:bg-yellow-400 disabled:opacity-50 text-cat-black px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>
    </div>
  );
};
