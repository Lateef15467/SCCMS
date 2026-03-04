import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, CheckCircle, Clock, BarChart3, Filter } from 'lucide-react';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, inProgress: 0 });
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    const token = localStorage.getItem('sccms_token');
    const [compRes, staffRes, statsRes] = await Promise.all([
      fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/users/staff', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    setComplaints(await compRes.json());
    setStaff(await staffRes.json());
    setStats(await statsRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (complaintId, staffId) => {
    const res = await fetch(`/api/complaints/${complaintId}/assign`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sccms_token')}` 
      },
      body: JSON.stringify({ staff_id: staffId })
    });
    if (res.ok) fetchData();
  };

  const filteredComplaints = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500">Monitor system-wide complaints and performance</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-all">
            <BarChart3 size={18} />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats.total} icon={<FileText className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="text-amber-600" />} color="bg-amber-50" />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Filter className="text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle className="text-emerald-600" />} color="bg-emerald-50" />
      </div>

      <div className="rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
          <h2 className="font-bold">Recent Complaints</h2>
          <div className="flex gap-2">
            {['all', 'pending', 'in-progress', 'resolved'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="px-6 py-4">Complaint</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assignment</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/complaint/${c.id}`} className="font-bold text-indigo-600 hover:underline">{c.title}</Link>
                    <p className="text-xs text-slate-500 mt-1">{c.category} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{c.student_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                      c.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.staff_name ? (
                      <span className="text-sm font-medium text-slate-600">Assigned to: {c.staff_name}</span>
                    ) : (
                      <select
                        onChange={(e) => handleAssign(c.id, e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign Staff...</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/complaint/${c.id}`} className="text-slate-400 hover:text-indigo-600">View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
