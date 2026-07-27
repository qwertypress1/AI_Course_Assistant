import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseApi } from '../services/api';
import { BookOpen, FileText, MessageSquareText, Plus, Sparkles, ArrowUpRight, GraduationCap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await courseApi.list();
        setCourses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-violet-950/60 border border-indigo-500/20">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> AI Academic Workspace
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.full_name}! 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl">
              Ask questions grounded strictly in your uploaded course materials with source citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/chat"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm hover:scale-[1.02]"
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Start AI Chat</span>
            </Link>
            <Link
              to="/documents"
              className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-all flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Courses</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{courses.length}</div>
          <div className="text-xs text-slate-400 mt-1">Active learning workspaces</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course Documents</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">Ready</div>
          <div className="text-xs text-slate-400 mt-1">Processed with Tesseract OCR</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">RAG AI Mode</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">Active</div>
          <div className="text-xs text-slate-400 mt-1">Ground-truth source attribution</div>
        </div>
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> My Courses
          </h2>
          <Link
            to="/courses"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase tracking-wider"
          >
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-dashed border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No courses enrolled yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Join or create your course workspace to upload lecture notes and start asking questions.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-all"
            >
              <Plus className="w-4 h-4" /> Enroll in Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div key={course.id} className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">
                      {course.code}
                    </span>
                    <span className="text-[11px] text-slate-400">Active</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {course.description || 'No description provided for this course workspace.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    to={`/documents?course_id=${course.id}`}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Docs
                  </Link>
                  <Link
                    to={`/chat?course_id=${course.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    Ask AI <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
