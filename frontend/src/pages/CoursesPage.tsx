import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseApi } from '../services/api';
import { BookOpen, Plus, FileText, AlertCircle, X, Search, ArrowUpRight, CheckCircle2, Sparkles, UserPlus } from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';

  const [courses, setCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const [enrolledData, availableData] = await Promise.all([
        courseApi.list(),
        courseApi.listAvailable().catch(() => []),
      ]);
      setCourses(enrolledData);
      setAvailableCourses(availableData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      await courseApi.enroll(courseId, 'student');
      await fetchCourses();
      // Navigate to chat for the newly enrolled course
      navigate(`/chat?course_id=${courseId}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to enroll in course');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const created = await courseApi.create({ name, code });
      setShowCreateModal(false);
      setCode('');
      setName('');
      fetchCourses();
      // Directly navigate user to upload documents for this new course
      navigate(`/documents?course_id=${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEnrolled = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAvailable = availableCourses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Onboarding Alert Banner */}
      {isOnboarding && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-500/30 flex items-start gap-4 shadow-xl">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Welcome! Step 1: Enroll in a Course</h3>
            <p className="text-xs text-slate-300 mt-1">
              Select any of the available courses below to enroll, or create a new course workspace to start asking AI questions.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" /> Course Workspaces
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Enroll in available courses or click any enrolled course card to open its AI Chat
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 self-start hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses by code or title..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Section 1: Enrolled Courses */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> My Enrolled Courses ({courses.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading course list...</div>
        ) : filteredEnrolled.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center border border-dashed border-slate-800">
            <p className="text-slate-400 text-sm">You have not enrolled in any courses yet. Select a course below to enroll!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEnrolled.map((course) => (
              <div
                key={course.id}
                onClick={() => navigate(`/chat?course_id=${course.id}`)}
                className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-0.5"
                title={`Click to open AI Chat for ${course.code}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">
                      {course.code}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Enrolled</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                    {course.name}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/documents?course_id=${course.id}`);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Documents
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat?course_id=${course.id}`);
                    }}
                    className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    Open AI Chat <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Available Courses to Enroll */}
      {filteredAvailable.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" /> Available Courses to Enroll
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAvailable.map((course) => (
              <div
                key={course.id}
                className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between group bg-slate-900/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold font-mono">
                      {course.code}
                    </span>
                    <span className="text-[11px] text-slate-400">Available</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {course.name}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Student Enrollment</span>
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingId === course.id}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-800 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-slate-400 hover:text-white absolute right-4 top-4"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Create New Course</h2>
            <p className="text-slate-400 text-xs mb-6">Add a new course workspace for students and document uploads</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Course Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CSC 410"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Course Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Introduction to Computer Science"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {submitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
