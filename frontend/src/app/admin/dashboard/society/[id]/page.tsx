"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ManageElection() {
  const router = useRouter();
  const { id: societyId } = useParams();

  const [positions, setPositions] = useState<any[]>([]);
  
  const [editingPosId, setEditingPosId] = useState<number | null>(null);
  const [posName, setPosName] = useState("");
  const [posResultTime, setPosResultTime] = useState("");

  const [editingCandId, setEditingCandId] = useState<number | null>(null);
  const [candName, setCandName] = useState("");
  const [candBatch, setCandBatch] = useState("");
  const [candFaculty, setCandFaculty] = useState("");
  const [candPositionId, setCandPositionId] = useState("");
  const [candDesc, setCandDesc] = useState("");
  const [candImage, setCandImage] = useState(""); 

  const [selectedPositionForResults, setSelectedPositionForResults] = useState<any>(null);

  useEffect(() => { 
    if (!localStorage.getItem("admin_token")) router.push("/admin/login");
    else fetchPositions(); 
  }, []);

  const fetchPositions = async () => {
    const res = await fetch(`/api/admin/societies/${societyId}/positions`);
    setPositions(await res.json());
  };

  const handlePosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPosId ? `/api/admin/positions/${editingPosId}` : "/api/admin/positions";
    const res = await fetch(url, {
      method: editingPosId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: posName, societyId: Number(societyId), resultTime: posResultTime ? new Date(posResultTime).toISOString() : null }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      alert(error?.message || "Failed to save position. Refresh the society list and try again.");
      return;
    }

    setEditingPosId(null); setPosName(""); setPosResultTime(""); fetchPositions();
  };

  const deletePos = async (id: number) => {
    if(confirm("Are you sure you want to delete this position?")) {
      await fetch(`/api/admin/positions/${id}`, { method: "DELETE" });
      fetchPositions();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          setCandImage(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: candName, batch: candBatch, faculty: candFaculty,
      description: candDesc, profilePic: candImage, positionId: Number(candPositionId)
    };
    const url = editingCandId ? `/api/admin/candidates/${editingCandId}` : "/api/admin/candidates";
    await fetch(url, {
      method: editingCandId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    resetCandForm(); fetchPositions();
  };

  const editCand = (cand: any, posId: number) => {
    setEditingCandId(cand.id); setCandName(cand.name); setCandBatch(cand.batch);
    setCandFaculty(cand.faculty); setCandDesc(cand.description);
    setCandImage(cand.profilePic || ""); setCandPositionId(posId.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCand = async (id: number) => {
    if(confirm("Are you sure you want to delete this candidate?")) {
      await fetch(`/api/admin/candidates/${id}`, { method: "DELETE" });
      fetchPositions();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    router.push("/admin/login");
  };

  const resetCandForm = () => {
    setEditingCandId(null); setCandName(""); setCandBatch(""); setCandFaculty("");
    setCandDesc(""); setCandImage(""); setCandPositionId("");
  };

  return (
    <div className="min-h-screen bg-[#ece8dc] text-[#333] font-serif">
      <header className="bg-[#2c3e50] text-[#ecf0f1] p-5 shadow-md border-b-[6px] border-[#c0392b]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">Election Manager</h1>
            <p className="text-xs italic text-[#bdc3c7] mt-1">Manage Positions & Candidates</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => router.push("/admin/dashboard")} className="text-sm font-bold uppercase tracking-wider hover:text-[#e74c3c] transition">« Back</button>
            <button onClick={handleLogout} className="border border-[#ecf0f1] px-3 py-1 text-sm font-bold uppercase tracking-wider hover:bg-[#ecf0f1] hover:text-[#2c3e50] transition">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        <div className="space-y-8">
          
          <div className="bg-[#fbf9f4] p-6 border-2 border-[#d5cbb4] shadow-sm relative">
            <h3 className="font-bold text-xl mb-4 text-[#2c3e50] uppercase tracking-wide border-b border-[#d5cbb4] pb-2">
              {editingPosId ? "Edit Position" : "Add Position"}
            </h3>
            <form onSubmit={handlePosSubmit} className="flex flex-col gap-3">
              <input type="text" required value={posName} onChange={e => setPosName(e.target.value)} placeholder="e.g. President" className="border-2 border-[#d5cbb4] bg-white p-2 font-medium focus:outline-none focus:border-[#2c3e50]" />
              <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Countdown Target Time (Optional)</label>
              <input type="datetime-local" value={posResultTime} onChange={e => setPosResultTime(e.target.value)} className="border-2 border-[#d5cbb4] bg-white p-2 font-medium focus:outline-none focus:border-[#2c3e50]" />
              <div className="flex gap-2 mt-2">
                <button className="flex-1 bg-[#2c3e50] text-white py-2 font-bold uppercase tracking-wider text-sm border-2 border-[#2c3e50] hover:bg-[#34495e]">{editingPosId ? "Update" : "Add Position"}</button>
                {editingPosId && <button type="button" onClick={() => {setEditingPosId(null); setPosName(""); setPosResultTime("");}} className="px-4 border-2 border-[#c0392b] text-[#c0392b] font-bold uppercase text-sm">Cancel</button>}
              </div>
            </form>
          </div>

          <div className="bg-[#fbf9f4] p-6 border-2 border-[#d5cbb4] shadow-sm relative">
            <h3 className="font-bold text-xl mb-4 text-[#2c3e50] uppercase tracking-wide border-b border-[#d5cbb4] pb-2">
              {editingCandId ? "Edit Candidate" : "Add Candidate"}
            </h3>
            <form onSubmit={handleCandSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Select Position</label>
                <select required value={candPositionId} onChange={e => setCandPositionId(e.target.value)} className="w-full border-2 border-[#d5cbb4] bg-white p-2 mt-1 focus:outline-none">
                  <option value="">-- Select --</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Candidate Name</label>
                <input type="text" required value={candName} onChange={e => setCandName(e.target.value)} className="w-full border-2 border-[#d5cbb4] bg-white p-2 mt-1 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Batch</label>
                  <input type="text" required value={candBatch} onChange={e => setCandBatch(e.target.value)} placeholder="e.g. 12" className="w-full border-2 border-[#d5cbb4] bg-white p-2 mt-1 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Faculty</label>
                  <input type="text" required value={candFaculty} onChange={e => setCandFaculty(e.target.value)} placeholder="e.g. IT" className="w-full border-2 border-[#d5cbb4] bg-white p-2 mt-1 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Description / Manifesto</label>
                <textarea required rows={3} value={candDesc} onChange={e => setCandDesc(e.target.value)} className="w-full border-2 border-[#d5cbb4] bg-white p-2 mt-1 focus:outline-none resize-none" />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Candidate Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-xs mt-1 file:bg-[#2c3e50] file:text-white file:border-0 file:px-3 file:py-1 file:mr-2 cursor-pointer" />
                {candImage && <div className="mt-3 text-center"><img src={candImage} alt="Preview" className="h-24 w-20 object-cover border-4 border-white shadow-md mx-auto" /></div>}
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-[#27ae60] text-white py-3 border-2 border-[#27ae60] font-bold uppercase tracking-widest hover:bg-[#219653] transition">
                  {editingCandId ? "Update Candidate" : "Add Candidate"}
                </button>
                {editingCandId && <button type="button" onClick={resetCandForm} className="bg-transparent border-2 border-[#333] text-[#333] px-4 font-bold uppercase">Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-8">
          <div className="text-center mb-8 border-y-2 border-[#d5cbb4] py-4">
            <h2 className="text-3xl font-bold text-[#2c3e50] uppercase tracking-widest">Positions & Candidates</h2>
          </div>

          {positions.length === 0 ? (
             <div className="text-center p-12 italic text-[#7f8c8d]">No positions added yet. Please add a position first.</div>
          ) : (
            positions.map(pos => (
              <div key={pos.id} className="mb-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b-4 border-[#2c3e50] pb-2 mb-6 gap-2">
                  <div>
                    <h3 className="text-2xl font-bold text-[#2c3e50] uppercase">{pos.name}</h3>
                    {pos.resultTime && <span className="text-xs text-[#c0392b] font-bold block mt-1">Results at: {new Date(pos.resultTime).toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-4 items-center mb-1">
                    <button onClick={() => setSelectedPositionForResults(pos)} className="text-xs font-bold uppercase bg-[#c0392b] text-white px-3 py-1 border border-[#922b21] hover:bg-[#922b21] transition shadow-sm rounded-sm">
                      View Result
                    </button>
                    <button onClick={() => { 
                      setEditingPosId(pos.id); 
                      setPosName(pos.name); 
                      setPosResultTime(pos.resultTime ? new Date(pos.resultTime).toISOString().slice(0,16) : "");
                      window.scrollTo({ top: 0, behavior: 'smooth' }); 
                    }} className="text-xs font-bold uppercase text-[#2980b9] hover:underline">Edit</button>
                    <button onClick={() => deletePos(pos.id)} className="text-xs font-bold uppercase text-[#c0392b] hover:underline">Delete</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pos.candidates.length === 0 && <span className="text-sm italic text-[#95a5a6]">No candidates added yet.</span>}
                  
                  {pos.candidates.map((cand: any) => (
                    <div key={cand.id} className="bg-[#fffdf8] border border-[#d5cbb4] shadow-md p-5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#27ae60]"></div>
                      
                      <div className="flex flex-col sm:flex-row gap-5">
                        <div className="shrink-0">
                          {cand.profilePic ? (
                            <img src={cand.profilePic || undefined} className="w-20 h-24 object-cover border-2 border-[#d5cbb4] p-1 bg-white" />
                          ) : (
                            <div className="w-20 h-24 bg-[#eae6d8] border-2 border-[#d5cbb4] flex items-center justify-center text-xs text-center text-[#888] italic p-2">No Photo</div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <h4 className="font-bold text-lg text-[#2c3e50] leading-tight">{cand.name}</h4>
                          <div className="text-xs font-bold text-[#7f8c8d] uppercase tracking-wide mt-1 pb-2 border-b border-[#d5cbb4]">
                            {cand.faculty} <br/> Batch {cand.batch}
                          </div>
                          <p className="text-sm mt-3 text-[#555] line-clamp-3 italic">"{cand.description}"</p>
                          
                          <div className="mt-auto pt-4 flex gap-3 justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                            <button onClick={() => editCand(cand, pos.id)} className="text-xs font-bold uppercase bg-[#ecf0f1] text-[#2980b9] px-3 py-1 border border-[#bdc3c7] hover:bg-[#2980b9] hover:text-white transition">Edit</button>
                            <button onClick={() => deleteCand(cand.id)} className="text-xs font-bold uppercase bg-[#fceef0] text-[#c0392b] px-3 py-1 border border-[#fadbd8] hover:bg-[#c0392b] hover:text-white transition">Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedPositionForResults && (
        <div className="fixed inset-0 bg-[#1a2f4cc0] z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-[#fbf9f4] w-full max-w-2xl max-h-[85vh] overflow-y-auto border-4 border-double border-[#d5cbb4] shadow-2xl relative flex flex-col">
            
            <div className="bg-[#2c3e50] text-[#ecf0f1] p-4 sticky top-0 z-10 border-b-4 border-[#c0392b] flex justify-between items-center shadow-md">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest">{selectedPositionForResults.name}</h3>
                <p className="text-xs text-[#bdc3c7] uppercase font-bold tracking-wider mt-1">Live Voting Standings</p>
              </div>
              <button 
                onClick={() => setSelectedPositionForResults(null)}
                className="text-white hover:text-[#e74c3c] text-3xl font-bold px-3 py-1 leading-none transition"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              {[...selectedPositionForResults.candidates].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)).map((cand: any, index: number) => (
                <div key={cand.id} className={`flex items-center gap-4 p-4 border-2 ${index === 0 ? 'bg-[#f4fce8] border-[#27ae60] shadow-md transform scale-[1.02]' : 'bg-white border-[#d5cbb4]'} transition-all`}>
                  
                  <div className={`w-10 h-10 flex items-center justify-center font-bold text-xl shrink-0 ${index === 0 ? 'bg-[#27ae60] text-white rounded-sm shadow-sm' : 'bg-[#ece8dc] text-[#7f8c8d] border border-[#d5cbb4] rounded-sm'}`}>
                    #{index + 1}
                  </div>
                  
                  {cand.profilePic ? (
                    <img src={cand.profilePic} className="w-16 h-16 object-cover border-2 border-[#2c3e50] shrink-0 p-0.5 bg-white" />
                  ) : (
                    <div className="w-16 h-16 bg-[#eae6d8] border-2 border-[#2c3e50] flex items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase text-[#888] font-bold text-center">No Photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#2c3e50] text-lg uppercase tracking-wide truncate">{cand.name}</h4>
                    <p className="text-[11px] font-bold text-[#7f8c8d] uppercase tracking-wider truncate mt-1">
                      {cand.faculty} <span className="opacity-50 mx-1">|</span> BATCH {cand.batch}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0 border-l-2 border-[#d5cbb4] pl-4">
                    <span className={`block text-3xl font-extrabold ${index === 0 ? 'text-[#27ae60]' : 'text-[#c0392b]'} tabular-nums leading-none`}>
                      {cand.voteCount || 0}
                    </span>
                    <span className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-widest mt-1 block">Votes</span>
                  </div>
                </div>
              ))}
              
              {selectedPositionForResults.candidates.length === 0 && (
                <div className="text-center py-10 bg-white border-2 border-dashed border-[#d5cbb4]">
                  <span className="text-sm font-bold uppercase tracking-widest text-[#7f8c8d]">No candidates available</span>
                </div>
              )}
            </div>
            
            <div className="bg-[#ece8dc] p-4 text-center border-t-4 border-[#2c3e50] mt-auto">
               <button onClick={() => setSelectedPositionForResults(null)} className="px-8 py-3 bg-[#2c3e50] text-white font-bold uppercase tracking-widest border-2 border-[#2c3e50] hover:bg-white hover:text-[#2c3e50] transition shadow-md">
                 Close View
               </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
