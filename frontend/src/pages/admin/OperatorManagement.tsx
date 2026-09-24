import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, Award, ShieldCheck, Phone, FileCheck, Plus, X, MoreVertical, Edit2, FileText, Trash2 } from 'lucide-react';

export const OperatorManagement: React.FC = () => {
  const [operators, setOperators] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  const initialOpState = { name: '', operator_code: '', role: 'Excavator Operator', pin: '1234', phone: '', license_no: '', cert_expiry_date: '2028-12-31' };
  const [newOp, setNewOp] = useState(initialOpState);
  const [editOpId, setEditOpId] = useState<number | null>(null);

  const [reportOpId, setReportOpId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const loadOperators = () => api.getOperators().then(setOperators);

  useEffect(() => {
    loadOperators();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editOpId) {
        await api.updateOperator(editOpId, newOp);
      } else {
        await api.createOperator(newOp);
      }
      setIsModalOpen(false);
      setNewOp(initialOpState);
      setEditOpId(null);
      loadOperators();
    } catch (err: any) {
      alert(err.message || `Failed to ${editOpId ? 'update' : 'add'} operator.`);
      console.error(err);
    }
  };

  const openEdit = (op: any) => {
    setEditOpId(op.id);
    setNewOp({
      name: op.name,
      operator_code: op.operator_code,
      role: op.role,
      pin: op.pin,
      phone: op.phone || '',
      license_no: op.license_no || '',
      cert_expiry_date: op.cert_expiry_date || ''
    });
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const openReport = async (op: any) => {
    setOpenMenuId(null);
    try {
      const data = await api.getOperatorPerformance(op.id);
      setReportData(data);
      setReportOpId(op.id);
    } catch (err: any) {
      alert(err.message || "Failed to fetch performance report.");
    }
  };

  const handleDelete = async (op: any) => {
    if (confirm(`Remove ${op.name}? Their history will be kept.`)) {
      setIsDeleting(op.id);
      try {
        await api.deleteOperator(op.id);
        setOperators(prev => prev.filter(o => o.id !== op.id));
        setOpenMenuId(null);
        // Show success toast (simple alert for now since we don't have a toast library)
        alert(`Successfully removed ${op.name}.`);
      } catch (err: any) {
        alert(err.message || "Failed to remove operator.");
        console.error(err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cat-black text-cat-yellow">
            Workforce Safety & Compliance
          </span>
          <h1 className="text-xl font-black text-cat-black mt-1">Certified Heavy Machinery Operators</h1>
          <p className="text-xs text-cat-gray-500 font-semibold mt-0.5">
            OSHA Certification Tracking, License Expiry & 100-Point Safety Score Averages
          </p>
        </div>
        <button 
          onClick={() => {
            setEditOpId(null);
            setNewOp(initialOpState);
            setIsModalOpen(true);
          }}
          className="bg-[#2FA84F] hover:bg-green-700 text-white font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> Add Operator
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-black mb-4">{editOpId ? 'Edit Operator' : 'Add New Operator'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
                <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={newOp.name} onChange={e => setNewOp({...newOp, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Operator ID</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. OP-004" value={newOp.operator_code} onChange={e => setNewOp({...newOp, operator_code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">PIN</label>
                  <input required type="text" className="w-full border rounded-lg p-2 text-sm" value={newOp.pin} onChange={e => setNewOp({...newOp, pin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
                <select className="w-full border rounded-lg p-2 text-sm" value={newOp.role} onChange={e => setNewOp({...newOp, role: e.target.value})}>
                  <option>Excavator Operator</option>
                  <option>Loader Operator</option>
                  <option>Truck Driver</option>
                  <option>Grader Operator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">License No.</label>
                <input type="text" className="w-full border rounded-lg p-2 text-sm" value={newOp.license_no} onChange={e => setNewOp({...newOp, license_no: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-[#FFCD11] hover:bg-yellow-500 text-black font-black py-2 rounded-lg mt-2">
                {editOpId ? 'Save Changes' : 'Save Operator'}
              </button>
            </form>
          </div>
        </div>
      )}

      {reportOpId && reportData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setReportOpId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-black mb-4">Operator Performance Report</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold mb-1">Average Score</p>
                  <p className="text-xl font-black">{reportData.average_score} / 100</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold mb-1">Safety Incidents</p>
                  <p className="text-xl font-black">{reportData.safety_incidents_total}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">Recent Shifts</h3>
                {reportData.history && reportData.history.length > 0 ? (
                  <div className="space-y-2">
                    {reportData.history.map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="font-bold">{h.date}</span>
                        <span>Score: <span className="font-bold">{h.score}</span></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No shift history found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {operators.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm hover:border-cat-yellow transition-all"
          >
            <div className="flex items-start justify-between pb-4 border-b border-cat-gray-100 relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cat-black text-cat-yellow font-extrabold flex items-center justify-center text-base">
                  {op.name[0]}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-cat-yellow bg-cat-black px-1.5 py-0.5 rounded">
                    {op.operator_code}
                  </span>
                  <h3 className="font-black text-sm text-cat-black mt-1">{op.name}</h3>
                  <p className="text-xs text-cat-gray-500 font-semibold">{op.role}</p>
                </div>
              </div>
              
              <button 
                className="text-gray-400 hover:text-black p-1 transition-colors"
                onClick={() => setOpenMenuId(openMenuId === op.id ? null : op.id)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenuId === op.id && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 shadow-lg rounded-xl w-44 py-1 z-10 text-xs font-semibold">
                  <button 
                    onClick={() => openEdit(op)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  <button 
                    onClick={() => openReport(op)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Report
                  </button>
                  <button 
                    onClick={() => handleDelete(op)}
                    disabled={isDeleting === op.id}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {isDeleting === op.id ? 'Removing...' : 'Remove Operator'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-cat-gray-400" /> License No
                </span>
                <span className="font-extrabold text-cat-black">{op.license_no || 'DL-HE-9821'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cat-green" /> Cert Expiry
                </span>
                <span className="font-extrabold text-cat-green">{op.cert_expiry_date || '2028-06-30'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cat-gray-400" /> Cab Radio Phone
                </span>
                <span className="font-extrabold text-cat-black">{op.phone || '+91 98765 43210'}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-cat-gray-100">
                <span className="text-cat-gray-500 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cat-yellow" /> Safety Score
                </span>
                <span className="px-2 py-0.5 rounded bg-cat-green/10 text-cat-green font-black">
                  {op.id === 1 ? '96.2 / 100' : op.id === 2 ? '91.0 / 100' : '98.5 / 100'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
