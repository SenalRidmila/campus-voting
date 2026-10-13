"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr"; 

interface Society {
  id: number;
  name: string;
  description: string;
  isCommon: boolean;
  facultyName: string | null;
  image: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StudentDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("voting_token");
    const userStr = localStorage.getItem("user_data");

    if (!token || !userStr) {
      router.push("/login");
      return;
    }
    setUserData(JSON.parse(userStr));

    // 20 Minute Session Expiration
    const sessionTimer = setTimeout(() => {
      alert("Your session has expired (20 minutes). Please log in again.");
      localStorage.removeItem("voting_token");
      localStorage.removeItem("user_data");
      router.push("/login");
    }, 20 * 60 * 1000);

    return () => clearTimeout(sessionTimer);
  }, []);

  const { data: allSocieties, isLoading: isSwrLoading } = useSWR<Society[]>(
    "/api/admin/societies",
    fetcher,
    {
      revalidateOnFocus: true, 
      dedupingInterval: 2000,  
    }
  );

  const societies = Array.isArray(allSocieties) ? allSocieties : [];

  const handleLogout = () => {
    localStorage.removeItem("voting_token");
    localStorage.removeItem("user_data");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#efecd2] font-serif text-[#1a2f4c] relative overflow-x-hidden">
      {/* Old School Dotted Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#1a2f4c 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      {/* Old School Top Navigation */}
      <nav className="bg-white shadow-lg border-b-4 border-[#d5cbb4] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <img src="/vote.png" alt="Logo" className="h-10 w-auto object-contain" />
              <h1 className="text-xl font-extrabold text-[#1a2f4c] uppercase tracking-widest hidden sm:block">Student Portal</h1>
              
              {/* Mobile User Info directly beside the logo */}
              <div className="sm:hidden flex flex-col justify-center ml-1 border-l-2 border-[#d5cbb4] pl-3">
                {userData ? (
                  <>
                    <span className="text-[11px] font-extrabold text-[#1a2f4c] uppercase tracking-wider">{userData.fullName?.split(' ')[0]}</span>
                    <span className="text-[9px] font-bold text-[#8b2635] uppercase tracking-widest">{userData.faculty}</span>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5 justify-center h-full">
                    <div className="w-16 h-2 bg-[#d5cbb4] animate-pulse"></div>
                    <div className="w-10 h-1.5 bg-[#d5cbb4] animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Nav Actions */}
            <div className="flex items-center gap-3 sm:gap-6 relative z-10">
              
              <div className="hidden sm:block text-right border-l-2 border-[#d5cbb4] pl-6 ml-2">
                {userData ? (
                  <>
                    <p className="text-[#1a2f4c] font-bold text-xs uppercase tracking-wider">{userData.fullName}</p>
                    <p className="text-[#8b2635] text-[10px] font-bold uppercase tracking-widest mt-0.5">{userData.faculty}</p>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5 items-end justify-center h-full">
                    <div className="w-24 h-3 bg-[#d5cbb4] animate-pulse"></div>
                    <div className="w-16 h-2 bg-[#d5cbb4] animate-pulse"></div>
                  </div>
                )}
              </div>
              
              {/* Responsive Logout Button */}
              <button onClick={handleLogout} className="flex items-center justify-center gap-1.5 sm:gap-0 border-2 border-[#8b2635] text-[#8b2635] bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[#fceef0] transition-colors shadow-sm">
                <svg className="w-3 h-3 sm:hidden" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* Page Header */}
        <div className="text-center sm:text-left mb-10 border-b-2 border-double border-[#d5cbb4] pb-4">
          <h2 className="text-3xl font-extrabold text-[#1a2f4c] uppercase tracking-widest">Active Elections</h2>
          <p className="mt-2 text-[#8b2635] text-sm font-bold uppercase tracking-widest">Select a society below to view candidates and cast your vote.</p>
        </div>

        {isSwrLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#fbf9f4] border-4 border-double border-[#d5cbb4] relative p-6 h-64 flex flex-col justify-between">
                <div className="w-full h-32 bg-[#e8e4c9] mb-4 animate-pulse"></div>
                <div className="w-2/3 h-4 bg-[#d5cbb4] animate-pulse mb-2"></div>
                <div className="w-1/3 h-3 bg-[#e8e4c9] animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : societies.length === 0 ? (
          <div className="text-center py-16 bg-[#fbf9f4] border-4 border-double border-[#d5cbb4] relative shadow-2xl">
            <div className="mx-auto w-16 h-16 bg-white border-2 border-[#d5cbb4] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#8b2635]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <p className="text-[#1a2f4c] font-bold uppercase tracking-wider text-sm">No active elections available for you right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {societies.map((soc) => {
              
              // 🌟 Eligibility Logic
              const isEligible = 
                soc.isCommon || 
                (soc.facultyName && userData?.faculty && 
                 soc.facultyName.trim().toLowerCase() === userData.faculty.trim().toLowerCase());

              return (
                <div key={soc.id} className="group relative bg-[#fbf9f4] border-4 border-double border-[#d5cbb4] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full overflow-hidden">
                  
                  {/* Decorative Corners */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-[#1a2f4c] z-20 pointer-events-none"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[#1a2f4c] z-20 pointer-events-none"></div>
                  
                  {/* Large Card Header/Banner */}
                  <div className="relative w-full h-40 sm:h-48 bg-white border-b-4 border-double border-[#d5cbb4] overflow-hidden flex items-center justify-center">
                    {soc.image ? (
                       <img src={soc.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`${soc.name} Banner`} loading="lazy" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#d5cbb4]">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#1a2f4c]">No Image</span>
                      </div>
                    )}
                    
                    {/* View Only Overlay Badge */}
                    {!isEligible && (
                        <div className="absolute top-3 right-3 bg-white border-2 border-[#8b2635] text-[#8b2635] text-[10px] uppercase font-extrabold tracking-widest px-3 py-1.5 shadow-sm z-10">
                          View Only
                        </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="relative p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-extrabold text-[#1a2f4c] uppercase tracking-wider leading-tight group-hover:text-[#2c4875] transition-colors line-clamp-2 mb-3">{soc.name}</h3>
                    
                    <div className="flex items-center gap-2 mb-4 self-start bg-white border-2 border-[#d5cbb4] px-3 py-1.5 shadow-sm">
                      {soc.isCommon ? (
                        <>
                          <span className="w-2 h-2 bg-[#8b2635] border border-[#1a2f4c]"></span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a2f4c]">Common Society</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 bg-[#1a2f4c] border border-[#1a2f4c]"></span> 
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a2f4c]">{soc.facultyName || "Specific Faculty"}</span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-[#1a2f4c] font-medium text-sm leading-relaxed line-clamp-3">{soc.description}</p>
                  </div>
                  
                  {/* Card Footer / Action */}
                  <div className="relative p-6 pt-0 mt-auto">
                    {/* Bottom Decorative Corners */}
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>

                    <button 
                      onClick={() => {
                        if (isEligible) {
                          router.push(`/dashboard/society/${soc.id}`);
                        } else {
                          router.push(`/dashboard/society/${soc.id}?viewOnly=true`);
                        }
                      }}
                      className={`w-full py-3 px-4 font-bold text-xs uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 shadow-md
                        ${isEligible 
                          ? 'bg-[#1a2f4c] text-white border-[#1a2f4c] hover:bg-[#2c4875]' 
                          : 'bg-white text-[#8b2635] border-[#d5cbb4] hover:bg-[#e8e4c9]'}`}
                    >
                      {isEligible ? "Enter Election" : "View Candidates"}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
