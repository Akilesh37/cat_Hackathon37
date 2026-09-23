import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, Award, ShieldCheck, Phone, FileCheck, Plus, X } from 'lucide-react';

export const OperatorManagement: React.FC = () => {
  const [operators, setOperators] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOp, setNewOp] = useState({ name: '', operator_code: '', role: 'Excavator Operator', pin: '1234', phone: '', license_no: '', cert_expiry_date: '2028-12-31' });

  const loadOperators = () => api.getOperators().then(setOperators);

  useEffect(() => {
    loadOperators();
  }, []);

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOperator(newOp);
      setIsModalOpen(false);
      setNewOp({ name: '', operator_code: '', role: 'Excavator Operator', pin: '1234', phone: '', license_no: '', cert_expiry_date: '2028-12-31' });
      loadOperators();
    } catch (err) {
      alert("Failed to add operator.");
      console.error(err);
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
          onClick={() => setIsModalOpen(true)}
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
            <h2 className="text-lg font-black text-black mb-4">Add New Operator</h2>
            <form onSubmit={handleAddOperator} className="space-y-4">
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
                Save Operator
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {operators.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-2xl border border-cat-gray-200 p-6 shadow-sm hover:border-cat-yellow transition-all"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-cat-gray-100">
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
