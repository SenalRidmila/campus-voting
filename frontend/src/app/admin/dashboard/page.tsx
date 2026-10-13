"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [societies, setSocieties] = useState<any[]>([]);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCommon, setIsCommon] = useState(true);
  const [facultyName, setFacultyName] = useState("");
  const [image, setImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const faculties = [
    "Faculty of Management", "Faculty of Technology", "Faculty of Science",
    "Faculty of IT", "Faculty of Education", "Faculty of Law",
    "Department of Nursing", "English Language Teaching Unit"
  ];

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) router.push("/admin/login");
    else fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const res = await fetch("/api/admin/societies");
      const data = await res.json();
      if (Array.isArray(data)) setSocieties(data);
      else console.error("Expected array but got:", data);
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
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
          
          // Compress to JPEG with 0.6 quality (reduces size by 90%)
          setImage(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = { name, description, image, isCommon, facultyName: isCommon ? null : facultyName };

    try {
      const url = editingId ? `/api/admin/societies/${editingId}` : "/api/admin/societies";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (res.ok) { resetForm(); fetchSocieties(); } 
      else alert("Action Failed!");
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  const handleEdit = (soc: any) => {
    setEditingId(soc.id); setName(soc.name); setDescription(soc.description);
    setIsCommon(soc.isCommon); setFacultyName(soc.facultyName || ""); setImage(soc.image || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this society?")) {
      await fetch(`/api/admin/societies/${id}`, { method: "DELETE" });
      fetchSocieties();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    router.push("/admin/login");
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setDescription(""); 
    setIsCommon(true); setFacultyName(""); setImage("");
  };

  return (
    <div className="min-h-screen bg-[#efecd2] font-serif text-[#1a2f4c] relative overflow-x-hidden">
      {/* Old School Dotted Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#1a2f4c 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <header className="bg-white border-b-4 border-[#d5cbb4] sticky top-0 z-50 shadow-lg relative">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/vote.png" alt="Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-extrabold tracking-widest text-[#1a2f4c] uppercase">Admin Portal</h1>
              <p className="text-[10px] font-bold text-[#8b2635] uppercase tracking-widest">Society Management</p>
            </div>
          </div>
          <button onClick={handleLogout} className="border-2 border-[#8b2635] text-[#8b2635] bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#fceef0] transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Form Section */}
        <div className="lg:col-span-4">
          <div className="bg-[#fbf9f4] p-6 sm:p-8 shadow-2xl border-4 border-double border-[#d5cbb4] sticky top-24 relative">
            {/* Corners */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>
            <div className="absolute top-1 right-1 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>

            <div className="mb-8 border-b-2 border-[#d5cbb4] pb-4">
              <h2 className="text-2xl font-extrabold text-[#1a2f4c] uppercase tracking-widest">
                {editingId ? "Edit Society" : "New Society"}
              </h2>
              <p className="text-xs font-bold text-[#8b2635] uppercase tracking-widest mt-2">
                {editingId ? "Update existing society details." : "Create a new society to host elections."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#1a2f4c] mb-2">Society Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} 
                  className="w-full border-2 border-[#1a2f4c] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b2635] transition-shadow shadow-inner font-sans font-medium" 
                  placeholder="e.g. Computer Science Society"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#1a2f4c] mb-2">Description *</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} 
                  className="w-full border-2 border-[#1a2f4c] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b2635] transition-shadow resize-none shadow-inner font-sans font-medium" 
                  placeholder="Mission statement..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#1a2f4c] mb-2">Brand Logo</label>
                <label className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#1a2f4c] bg-white hover:bg-[#e8e4c9] transition-colors group relative cursor-pointer overflow-hidden">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" accept="image/*" onChange={handleImageUpload} title="Upload Logo" />
                  <div className="space-y-2 text-center text-sm w-full relative z-10 pointer-events-none">
                    {image ? (
                       <div className="relative inline-block group-hover:opacity-80 transition-opacity">
                         <img src={image} alt="Preview" className="h-24 w-24 object-cover border-2 border-[#1a2f4c] p-1 bg-white mx-auto shadow-md" />
                       </div>
                    ) : (
                      <svg className="mx-auto h-12 w-12 text-[#1a2f4c] group-hover:text-[#8b2635] transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <div className="flex text-[#1a2f4c] font-bold justify-center uppercase tracking-widest text-[10px] mt-4">
                        <span className="underline decoration-2 decoration-[#1a2f4c] underline-offset-4 cursor-pointer">Upload a file</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="bg-[#e8e4c9] p-4 border-2 border-[#d5cbb4]">
                <label className="flex items-start gap-4 cursor-pointer">
                  <div className="flex items-center h-5 mt-0.5">
                    <input type="checkbox" checked={isCommon} onChange={(e) => setIsCommon(e.target.checked)} 
                      className="w-5 h-5 border-2 border-[#1a2f4c] text-[#8b2635] focus:ring-[#8b2635] focus:ring-offset-[#e8e4c9] cursor-pointer" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#1a2f4c] block mb-1">University-Wide Society</span>
                    <span className="text-[10px] text-[#8b2635] block leading-tight font-bold uppercase tracking-wider">Open to all campus students.</span>
                  </div>
                </label>
              </div>

              {!isCommon && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#1a2f4c] mb-2">Faculty Association *</label>
                  <select required value={facultyName} onChange={(e) => setFacultyName(e.target.value)} 
                    className="w-full border-2 border-[#1a2f4c] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b2635] transition-shadow cursor-pointer font-sans font-bold">
                    <option value="">-- Choose Faculty --</option>
                    {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-[#d5cbb4]">
                <button type="submit" disabled={isLoading} 
                  className="flex-1 bg-[#1a2f4c] text-white py-3 px-4 font-bold text-xs uppercase tracking-widest hover:bg-[#2c4875] transition-colors disabled:opacity-70 border-2 border-[#1a2f4c] shadow-md">
                  {isLoading ? 'Saving...' : editingId ? "Update" : "Create"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} 
                    className="py-3 px-6 font-bold text-xs uppercase tracking-widest text-[#8b2635] bg-white border-2 border-[#8b2635] hover:bg-[#fceef0] transition-colors shadow-md text-center">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="flex items-end justify-between border-b-4 border-double border-[#d5cbb4] pb-4 bg-[#efecd2]">
            <div>
              <h2 className="text-3xl font-extrabold text-[#1a2f4c] uppercase tracking-widest">Active Societies</h2>
            </div>
            <div className="bg-[#1a2f4c] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest border border-[#1a2f4c]">
              {societies.length} Total
            </div>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {societies.map((soc) => (
              <div key={soc.id} className="group bg-[#fbf9f4] p-5 shadow-xl border-4 border-double border-[#d5cbb4] flex flex-col h-full relative overflow-hidden active:scale-[0.99] transition-transform">
                {/* Decorative Corners */}
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#1a2f4c] pointer-events-none"></div>
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#1a2f4c] pointer-events-none"></div>

                <div className="absolute top-0 right-0 p-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2 z-20">
                  <button onClick={() => handleEdit(soc)} title="Edit" className="w-8 h-8 flex items-center justify-center bg-white text-[#1a2f4c] border-2 border-[#1a2f4c] hover:bg-[#e8e4c9] transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(soc.id)} title="Delete" className="w-8 h-8 flex items-center justify-center bg-white text-[#8b2635] border-2 border-[#8b2635] hover:bg-[#fceef0] transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="flex gap-4 items-start mb-4">
                  <div className="shrink-0 w-20 h-20 border-2 border-[#1a2f4c] bg-white flex items-center justify-center p-2 shadow-inner">
                    {soc.image ? (
                      <img src={soc.image} alt={soc.name} className="max-w-full max-h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-[#d5cbb4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div className="pr-12 flex-1 pt-1">
                    <h3 className="text-xl font-bold text-[#1a2f4c] uppercase tracking-wider leading-tight mb-2 line-clamp-2">{soc.name}</h3>
                    <span className="inline-flex items-center px-2 py-1 text-[9px] font-extrabold tracking-widest uppercase bg-white text-[#8b2635] border-2 border-[#d5cbb4] shadow-sm">
                      {soc.isCommon ? "University Wide" : soc.facultyName}
                    </span>
                  </div>
                </div>

                <p className="text-[#1a2f4c] text-sm leading-relaxed max-w-none mb-6 flex-1 font-medium font-sans">
                  {soc.description}
                </p>

                <div className="mt-auto pt-4 border-t-2 border-[#d5cbb4] relative">
                  <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#1a2f4c] pointer-events-none"></div>
                  <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#1a2f4c] pointer-events-none"></div>
                  
                  <button onClick={() => router.push(`/admin/dashboard/society/${soc.id}`)} 
                    className="w-full flex items-center justify-center gap-2 bg-[#1a2f4c] text-white py-3 border-2 border-[#1a2f4c] text-xs font-bold uppercase tracking-widest transition-colors hover:bg-[#2c4875] shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v1" /></svg>
                    Manage Elections
                  </button>
                </div>
              </div>
            ))}
          </div>

          {societies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-4 bg-[#fbf9f4] border-4 border-double border-[#d5cbb4] shadow-xl relative">
               <div className="absolute top-2 left-2 w-2 h-2 bg-[#1a2f4c]"></div>
               <div className="absolute top-2 right-2 w-2 h-2 bg-[#1a2f4c]"></div>
               <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#1a2f4c]"></div>
               <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#1a2f4c]"></div>
              
              <div className="w-16 h-16 bg-white border-2 border-[#d5cbb4] flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8 text-[#8b2635]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#1a2f4c] uppercase tracking-widest mb-2">No Societies Found</h3>
              <p className="text-xs font-bold text-[#8b2635] uppercase tracking-widest text-center max-w-sm">
                Get started by creating your first student society using the form.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );}

