import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseApi, chatApi, documentApi, API_BASE_URL } from '../services/api';
import { MessageSquareText, Plus, Send, Sparkles, BookOpen, FileText, Trash2, ChevronRight, User, AlertCircle, Paperclip, Upload, Loader2, CheckCircle } from 'lucide-react';

interface Source {
  document_id: string;
  filename: string;
  page_number: number;
  chunk_id: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Source[];
}

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('course_id') || '';

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseIdParam);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Handle Direct Document Upload from Chat Page
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let targetCourseId = selectedCourseId;
    if (!targetCourseId && courses.length > 0) {
      targetCourseId = courses[0].id;
      setSelectedCourseId(targetCourseId);
    }

    if (!targetCourseId) {
      setError('Please select or enroll in a course before uploading a document.');
      return;
    }

    setUploadingDoc(true);
    setError(null);
    setUploadSuccess(null);

    try {
      await documentApi.upload(targetCourseId, file);
      setUploadSuccess(`Document "${file.name}" uploaded successfully! The AI Tutor is ready to answer questions about it.`);
      setTimeout(() => setUploadSuccess(null), 7000);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const formatted = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg || 'Error').join('; ') : err.message || 'Failed to upload document.');
      setError(formatted);
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.list();
        setCourses(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch Sessions for Course or General
  const fetchSessions = async () => {
    try {
      const courseParam = selectedCourseId ? selectedCourseId : 'general';
      const data = await chatApi.listSessions(courseParam);
      setSessions(data);
      if (data.length > 0) {
        setCurrentSessionId(data[0].id);
      } else {
        setCurrentSessionId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedCourseId]);

  // Fetch Message History for Current Session
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const fetchHistory = async () => {
      try {
        const history = await chatApi.getMessages(currentSessionId);
        setMessages(history);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [currentSessionId]);

  // Create New Session
  const handleNewSession = async () => {
    try {
      const defaultTitle = selectedCourseId ? 'New Course Chat' : 'General AI Chat';
      const newSession = await chatApi.createSession(selectedCourseId || undefined, defaultTitle);
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg || 'Error').join('; ') : err?.message || 'Failed to create chat session.');
      setError(msg);
    }
  };

  // Delete Session
  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat session?')) return;
    try {
      await chatApi.deleteSession(sid);
      const updated = sessions.filter((s) => s.id !== sid);
      setSessions(updated);
      if (currentSessionId === sid) {
        setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Message with SSE Stream Reader
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    let activeSid = currentSessionId;
    if (!activeSid) {
      try {
        const newSession = await chatApi.createSession(selectedCourseId || undefined, inputMessage.slice(0, 30));
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        activeSid = newSession.id;
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg || 'Error').join('; ') : err?.message || 'Failed to create chat session.');
        setError(msg);
        return;
      }
    }

    const userText = inputMessage.trim();
    setInputMessage('');
    setError(null);

    // Optimistically add user message to list
    const tempUserMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: userText };
    setMessages((prev) => [...prev, tempUserMsg]);

    setIsStreaming(true);
    setStreamingText('');
    setStreamingSources([]);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${activeSid}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedSources: Source[] = [];
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // keep incomplete trailing fragment in buffer

          for (const rawEvent of events) {
            const trimmed = rawEvent.trim();
            if (!trimmed) continue;

            const dataIndex = trimmed.indexOf('data:');
            if (dataIndex !== -1) {
              const jsonStr = trimmed.substring(dataIndex + 5).trim();
              try {
                const eventData = JSON.parse(jsonStr);

                if (eventData.type === 'chunk') {
                  accumulatedText += eventData.content || '';
                  setStreamingText(accumulatedText);
                } else if (eventData.type === 'sources') {
                  accumulatedSources = eventData.sources || [];
                  setStreamingSources(accumulatedSources);
                } else if (eventData.type === 'done') {
                  const finalAssistantMsg: Message = {
                    id: eventData.message_id || `msg-${Date.now()}`,
                    role: 'assistant',
                    content: accumulatedText,
                    sources: accumulatedSources,
                  };
                  setMessages((prev) => [...prev, finalAssistantMsg]);
                  setStreamingText('');
                  setStreamingSources([]);
                  setIsStreaming(false);
                }
              } catch (e) {
                console.error('SSE parse error:', e, jsonStr);
              }
            }
          }
        }

        // Finalize if stream ended but done event wasn't explicitly caught
        if (accumulatedText.trim()) {
          const finalAssistantMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: accumulatedText,
            sources: accumulatedSources,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === finalAssistantMsg.id || (m.role === 'assistant' && m.content === accumulatedText))) {
              return prev;
            }
            return [...prev, finalAssistantMsg];
          });
          setStreamingText('');
          setStreamingSources([]);
          setIsStreaming(false);
        }
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Failed to connect to backend server. Please make sure your FastAPI backend server is running (http://localhost:8000).');
      } else {
        setError(err.message || 'Error generating streaming answer.');
      }
      setIsStreaming(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 overflow-hidden">
      {/* Sessions Sidebar */}
      <div className="w-64 glass-panel rounded-2xl p-4 hidden lg:flex flex-col border border-slate-800 shrink-0">
        {/* Course Select */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setCurrentSessionId(null);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">✨ General AI Assistant (All Topics)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                📚 {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewSession}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all mb-2"
        >
          <Plus className="w-4 h-4" /> New Chat Session
        </button>

        {/* Upload Document Quick Action */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingDoc || !selectedCourseId}
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all mb-4 disabled:opacity-50"
        >
          {uploadingDoc ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
          )}
          {uploadingDoc ? 'Uploading File...' : 'Upload Document'}
        </button>

        {/* Session History List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">History</div>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between group cursor-pointer transition-all ${
                currentSessionId === s.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span className="truncate max-w-[140px]">{s.title || 'Chat Workspace'}</span>
              <button
                onClick={(e) => handleDeleteSession(e, s.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col border border-slate-800 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">
                {selectedCourseId ? 'AI Course Tutor' : 'General AI Assistant'}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                {selectedCourseId ? (
                  <>
                    <BookOpen className="w-3 h-3 text-indigo-400" /> Grounded in course documents
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-400" /> Answers any question flexibly
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingDoc || !selectedCourseId}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {uploadingDoc ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
            )}
            Add Document
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 glow-primary">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {selectedCourseId ? 'Ask your course assistant' : 'Ask General AI Anything'}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                {selectedCourseId
                  ? 'Questions are answered strictly using facts extracted from your uploaded lecture notes and PDFs.'
                  : 'Ask any question about general academic topics, coding, writing, explanations, or general knowledge.'}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-indigo-600/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Sources Cards */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        {msg.sources.some(s => s.document_id === 'general-ai') ? (
                          <><Sparkles className="w-3 h-3 text-indigo-400" /> AI Model Citation (ChatGPT Knowledge)</>
                        ) : (
                          <><FileText className="w-3 h-3 text-indigo-400" /> Grounded Source Citations</>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-1.5"
                          >
                            <span className="font-medium text-white">{src.filename}</span>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
                              {src.document_id === 'general-ai' ? src.page_number : `Page ${src.page_number}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Active Streaming Answer */}
          {isStreaming && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs shrink-0 shadow-md shadow-indigo-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="max-w-2xl rounded-2xl rounded-bl-none bg-slate-900/80 border border-slate-800 px-5 py-4 text-sm text-slate-200 leading-relaxed">
                <p className="whitespace-pre-wrap">{streamingText}</p>

                {/* Live Sources */}
                {streamingSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      {streamingSources.some(s => s.document_id === 'general-ai') ? (
                        <><Sparkles className="w-3 h-3 text-indigo-400" /> AI Model Citation (ChatGPT Knowledge)</>
                      ) : (
                        <><FileText className="w-3 h-3 text-indigo-400" /> Grounded Source Citations</>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {streamingSources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-1.5"
                        >
                          <span className="font-medium text-white">{src.filename}</span>
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
                            {src.document_id === 'general-ai' ? src.page_number : `Page ${src.page_number}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDirectUpload}
              accept=".pdf,.png,.jpg,.jpeg,.tiff"
              className="hidden"
            />

            {/* Paperclip Document Upload Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc || !selectedCourseId}
              title="Upload course document (PDF / Images)"
              className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-all disabled:opacity-40 shrink-0 flex items-center justify-center"
            >
              {uploadingDoc ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                uploadingDoc
                  ? "Uploading document to course..."
                  : selectedCourseId
                  ? "Ask a question about your course materials..."
                  : "Ask any general question or topic..."
              }
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputMessage.trim()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
