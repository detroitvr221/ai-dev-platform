import React, { useState, useRef, useEffect } from 'react';
import hljs from 'highlight.js/lib/common';
import { useWebSocket } from '../hooks/useWebSocket';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

export function ChatInterface({ selectedProjectId }: { selectedProjectId: string | null }) {
  const { send, agentUpdates } = useWebSocket();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'output'>('chat');
  const [stream, setStream] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentUpdates, stream]);

  useEffect(() => {
    if (!agentUpdates.length) return;
    const last = agentUpdates[agentUpdates.length - 1];
    if (last.status === 'stream' && typeof last.message === 'string') {
      setStream((prev) => (prev + last.message).slice(-20000));
    }
  }, [agentUpdates]);

  const highlighted = React.useMemo(() => {
    try { return hljs.highlightAuto(stream).value; } catch { return stream; }
  }, [stream]);

  const onSend = () => {
    if (!selectedProjectId || !input.trim()) return;
    setIsTyping(true);
    setStream('');
    setActiveTab('output');
    send({ type: 'user_message', text: input, projectId: selectedProjectId });
    setInput('');
    setTimeout(() => setIsTyping(false), 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started': return <Loader2 size={14} className="animate-spin" />;
      case 'completed': return '✓';
      case 'error': return '✗';
      default: return '•';
    }
  };

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
        <Bot size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
        <p className="text-sm text-center">
          Create or select a project to start chatting with AI agents
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full bg-white">
      {/* Tabs */}
      <div className="px-4 pt-3 flex gap-2 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-rose-50">
        <button onClick={() => setActiveTab('chat')} className={`px-3 py-2 text-sm rounded-lg ${activeTab==='chat'?'bg-white text-slate-900 shadow-soft':'text-slate-600 hover:text-slate-900'}`}>Chat</button>
        <button onClick={() => setActiveTab('output')} className={`px-3 py-2 text-sm rounded-lg ${activeTab==='output'?'bg-white text-slate-900 shadow-soft':'text-slate-600 hover:text-slate-900'}`}>Output</button>
        <div className="ml-auto text-xs text-slate-500 flex items-center gap-1"><Sparkles size={14}/> Live</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'chat' ? (
          <div className="space-y-3">
            {agentUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Bot size={32} className="mb-2 opacity-50" />
                <p className="text-sm text-center">Start building by describing what you want to create</p>
              </div>
            ) : (
              agentUpdates.map((update, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-slate-50 border border-slate-200/60">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900 capitalize">{update.agent}</span>
                      <span className={`text-xs ${getStatusColor(update.status)} flex items-center gap-1`}>
                        {getStatusIcon(update.status)}
                        {update.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{update.message}</p>
                    {update.data && (
                      <div className="mt-2 p-2 bg-white rounded border text-xs text-slate-600 font-mono">
                        {JSON.stringify(update.data, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-sm text-slate-600">AI agents are working...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-soft overflow-hidden">
            <div className="px-3 py-2 text-xs text-slate-500 border-b bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
              <span>Token Stream</span>
              <button className="px-2 py-1 text-blue-600 hover:text-blue-800" onClick={() => navigator.clipboard.writeText(stream)}>Copy</button>
            </div>
            <pre className="p-4 text-sm whitespace-pre leading-relaxed font-mono bg-gradient-to-b from-white to-slate-50 max-h-[55vh] overflow-auto" dangerouslySetInnerHTML={{ __html: highlighted }} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200/60 p-4 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              className="w-full border border-slate-200 rounded-lg px-4 py-3 pr-12 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you want to build..."
              rows={2}
              disabled={!selectedProjectId}
            />
            <button
              onClick={onSend}
              disabled={!selectedProjectId || !input.trim() || isTyping}
              className="absolute right-2 top-2 p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">Press Enter to send, Shift+Enter for new line</div>
      </div>
    </div>
  );
}

