import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { courseApi, documentApi } from '../services/api';
import { FileText, UploadCloud, CheckCircle2, Clock, AlertTriangle, Trash2, RefreshCw, Layers, File } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdParam = searchParams.get('course_id') || '';

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseIdParam);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.list();
        setCourses(data);
        if (!selectedCourseId && data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  // Sync state with URL parameter
  useEffect(() => {
    if (courseIdParam) {
      setSelectedCourseId(courseIdParam);
    }
  }, [courseIdParam]);

  // Fetch Documents for selected course
  const fetchDocuments = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const data = await documentApi.list(selectedCourseId);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCourseId]);

  // Auto-poll status when documents are processing or pending
  useEffect(() => {
    const isProcessing = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (isProcessing) {
      const interval = setInterval(() => {
        if (!selectedCourseId) return;
        documentApi.list(selectedCourseId).then((data) => setDocuments(data)).catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, selectedCourseId]);

  const formatApiError = (err: any, defaultMsg: string = 'Failed to upload document.'): string => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => (typeof d === 'string' ? d : d.msg || 'Validation error')).join('; ');
    }
    if (detail && typeof detail === 'object') {
      return detail.msg || JSON.stringify(detail);
    }
    return err?.message || defaultMsg;
  };

  // Handle File Upload
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      let targetCourseId = selectedCourseId;
      if (!targetCourseId && courses.length > 0) {
        targetCourseId = courses[0].id;
        setSelectedCourseId(targetCourseId);
      }

      if (!targetCourseId) {
        setError('Please select or enroll in a course before uploading document files.');
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB maximum limit.');
        return;
      }

      setError(null);
      setUploading(true);

      try {
        await documentApi.upload(targetCourseId, file);
        await fetchDocuments();
      } catch (err: any) {
        setError(formatApiError(err, 'Failed to upload document.'));
      } finally {
        setUploading(false);
      }
    },
    [selectedCourseId, courses]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/tiff': ['.tiff'],
    },
    maxFiles: 1,
  });

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentApi.delete(docId);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing OCR
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" /> Course Documents
          </h1>
          <p className="text-slate-400 text-sm mt-1">Upload lecture notes, PDFs, or scanned slides for AI extraction</p>
        </div>

        {/* Course Select Dropdown */}
        <div className="w-full sm:w-64">
          {courses.length === 0 ? (
            <a
              href="/courses"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              + Create First Course
            </a>
          ) : (
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSearchParams({ course_id: e.target.value });
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        {...getRootProps()}
        className={`glass-panel border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-600/10 scale-[1.01]'
            : 'border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-white">
          {uploading ? 'Uploading document...' : isDragActive ? 'Drop file here' : 'Drag & drop lecture notes or PDF here'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Supports PDF, PNG, JPEG, TIFF up to 10MB. Scanned images are automatically processed using PyTesseract OCR.
        </p>
      </div>

      {/* Document List Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Uploaded Documents ({documents.length})
          </h3>
          <button
            onClick={fetchDocuments}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading document records...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No documents uploaded for this course yet. Drag and drop a file above to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Filename</th>
                  <th className="px-6 py-3.5 font-semibold">Size</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Chunks</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                        <File className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{doc.original_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.error_message && (
                          <div className="text-[11px] text-rose-400 mt-1 max-w-xs font-sans leading-tight">
                            {doc.error_message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{formatBytes(doc.file_size_bytes)}</td>
                    <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {doc.chunk_count ? `${doc.chunk_count} vectors` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
