import React from 'react';

export default function OfferLettersTable({ offerLetters, showAlert, onRefresh }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-black">
              <th className="p-4 py-3">Candidate</th>
              <th className="p-4 py-3">Role / Dept</th>
              <th className="p-4 py-3">Type</th>
              <th className="p-4 py-3">Status</th>
              <th className="p-4 py-3">Date Sent</th>
              <th className="p-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offerLetters.map((letter: any) => (
              <tr key={letter.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-sm text-slate-900">{letter.candidateName}</div>
                  <div className="text-xs text-slate-500 font-medium truncate w-48">{letter.candidateEmail}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-sm text-slate-800">{letter.Position?.title || 'Unknown'}</div>
                  <div className="text-xs text-slate-500 font-medium">{letter.Department?.name || 'Unknown'}</div>
                </td>
                <td className="p-4 text-sm font-medium text-slate-600">
                  {letter.employmentType}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase
                    ${letter.status === 'SENT' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                      letter.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      letter.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'}`}
                  >
                    {letter.status}
                  </span>
                </td>
                <td className="p-4 text-xs font-bold text-slate-700">
                  {letter.sentAt ? new Date(letter.sentAt).toLocaleDateString() : '—'}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {/* Just viewing info in this condensed version */}
                    <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {offerLetters.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500 text-sm font-medium">
                  No offer letters found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
