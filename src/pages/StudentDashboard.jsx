import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function StudentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Internet',
    priority: 'medium',
    image: null
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('priority', formData.priority);
    if (formData.image) data.append('image', formData.image);

    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('sccms_token')}` },
      body: data
    });

    if (res.ok) {
      setShowForm(false);
      setFormData({ title: '', description: '', category: 'Internet', priority: 'medium', image: null });
      fetchComplaints();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="text-amber-500" size={18} />;
      case 'in-progress': return <AlertCircle className="text-blue-500" size={18} />;
      case 'resolved': return <CheckCircle className="text-emerald-500" size={18} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Complaints</h1>
          <p className="text-slate-500">Track and manage your reported issues</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          New Complaint
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-4">
          <h2 className="mb-4 text-xl font-bold">Submit New Complaint</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief summary of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option>Internet</option>
                  <option>Classroom Maintenance</option>
                  <option>Hostel Issues</option>
                  <option>Administrative</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-4">
                  {['low', 'medium', 'high'].map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={formData.priority === p}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="capitalize text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about the problem..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supporting Image (Optional)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                    />
                  </label>
                </div>
                {formData.image && <p className="mt-2 text-xs text-indigo-600 font-medium">Selected: {formData.image.name}</p>}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-6 py-2 font-medium text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-8 py-2 font-semibold text-white hover:bg-indigo-700 transition-all"
              >
                Submit Complaint
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {complaints.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-500">No complaints submitted yet. Click "New Complaint" to get started.</p>
          </div>
        ) : (
          complaints.map((c) => (
            <Link
              key={c.id}
              to={`/complaint/${c.id}`}
              className="group flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  c.status === 'resolved' ? 'bg-emerald-50' : c.status === 'in-progress' ? 'bg-blue-50' : 'bg-amber-50'
                }`}>
                  {getStatusIcon(c.status)}
                </div>
                <div>
                  <h3 className="font-bold group-hover:text-indigo-600 transition-colors">{c.title}</h3>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full">{c.category}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className={`text-xs font-bold uppercase tracking-wider ${
                    c.priority === 'high' ? 'text-red-500' : c.priority === 'medium' ? 'text-indigo-500' : 'text-slate-400'
                  }`}>
                    {c.priority} Priority
                  </p>
                  <p className="text-sm font-medium capitalize text-slate-600 mt-0.5">{c.status.replace('-', ' ')}</p>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 transition-all">
                  →
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
