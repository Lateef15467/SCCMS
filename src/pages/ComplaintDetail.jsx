import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Clock, CheckCircle, AlertCircle, MessageSquare, Send, User } from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [newComment, setNewComment] = useState('');

  const fetchDetail = async () => {
    const res = await fetch(`/api/complaints/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('sccms_token')}` }
    });
    const data = await res.json();
    setComplaint(data);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await fetch(`/api/complaints/${id}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sccms_token')}` 
      },
      body: JSON.stringify({ comment: newComment })
    });
    if (res.ok) {
      setNewComment('');
      fetchDetail();
    }
  };

  if (!complaint) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1"
      >
        ← Back to Dashboard
      </button>

      <div className="rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                complaint.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {complaint.status.replace('-', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                complaint.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {complaint.priority} Priority
              </span>
            </div>
            <span className="text-sm text-slate-400">{new Date(complaint.created_at).toLocaleString()}</span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{complaint.title}</h1>
          <div className="flex items-center gap-6 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
            <span className="flex items-center gap-2"><User size={16} /> Student: {complaint.student_name}</span>
            <span className="flex items-center gap-2"><AlertCircle size={16} /> Category: {complaint.category}</span>
            {complaint.staff_name && (
              <span className="flex items-center gap-2"><CheckCircle size={16} /> Assigned to: {complaint.staff_name}</span>
            )}
          </div>

          <div className="prose prose-slate max-w-none mb-8">
            <h3 className="text-lg font-bold mb-2">Description</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.image_url && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Supporting Image</h3>
              <img 
                src={complaint.image_url} 
                alt="Complaint evidence" 
                className="rounded-xl max-h-96 w-auto border border-slate-200 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-8 border-t border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <MessageSquare size={20} />
            Discussion & Updates
          </h3>
          
          <div className="space-y-4 mb-8">
            {complaint.comments.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No comments yet.</p>
            ) : (
              complaint.comments.map((c) => (
                <div key={c.id} className={`flex gap-4 ${c.user_id === user.id ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-1 rounded-2xl p-4 ${
                    c.user_role === 'student' ? 'bg-white border border-slate-200' : 'bg-indigo-600 text-white'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{c.user_name} ({c.user_role})</span>
                      <span className="text-[10px] opacity-70">{new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm">{c.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleComment} className="relative">
            <input
              type="text"
              placeholder="Add a comment or update..."
              className="w-full rounded-full border border-slate-200 pl-6 pr-14 py-3 focus:border-indigo-500 focus:outline-none shadow-sm"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 h-9 w-9 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
