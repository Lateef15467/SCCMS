import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState([]);
  const { user } = useAuth();

  const fetchComplaints = async () => {
    const res = await fetch('/api/complaints', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sccms_token')}` }
    });
    const data = await res.json();
    setComplaints(data);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const res = await fetch(`/api/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sccms_token')}` 
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchComplaints();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Department Dashboard</h1>
        <p className="text-slate-500">Manage and resolve assigned complaints for {user?.department || 'your department'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {complaints.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-500">No complaints assigned to you yet.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:border-indigo-200 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {c.priority} Priority
                    </span>
                    <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{c.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-3">{c.description}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><AlertCircle size={14} /> {c.category}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> Student: {c.student_name}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[150px]">
                  <Link 
                    to={`/complaint/${c.id}`}
                    className="w-full text-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-all"
                  >
                    View Details
                  </Link>
                  {c.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusChange(c.id, 'resolved')}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle size={16} />
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
