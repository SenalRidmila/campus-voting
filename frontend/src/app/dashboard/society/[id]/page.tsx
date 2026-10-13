"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import FaceScanner from "@/components/FaceScanner";

// --- Simple Toast System ---
type Toast = { id: number; message: string; type: "success" | "error" | "warning" };

const ToastContainer = ({ toasts, onRemoveToast }: { toasts: Toast[], onRemoveToast: (id: number) => void }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded shadow-lg text-white font-bold text-sm min-w-[250px] transform transition-all duration-300 ${
            t.type === "success" ? "bg-green-500" :
            t.type === "error" ? "bg-red-500" : "bg-yellow-500"
          }`}
          onClick={() => onRemoveToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};
// ---------------------------

const SwipeToVote = ({ onVote, isVoting, disabled }: { onVote: (reset: () => void) => void, isVoting: boolean, disabled: boolean }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => {
    if (disabled || isVoting) return;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - 25; 
    const maxX = rect.width - 50; 
    setDragX(Math.max(0, Math.min(newX, maxX)));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const rect = containerRef.current?.getBoundingClientRect();
    const maxX = rect ? rect.width - 50 : 200;

    if (dragX > maxX * 0.8) {
      setDragX(maxX); 
      onVote(() => setDragX(0)); 
    } else {
      setDragX(0); 
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative h-12 border-2 overflow-hidden select-none touch-none ${disabled ? 'border-[#d5cbb4] bg-[#e8e4c9]' : 'border-[#1a2f4c] bg-white hover:shadow-[4px_4px_0px_#1a2f4c] transition-all'}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${disabled ? 'text-[#8b2635]' : 'text-[#1a2f4c]'}`}>
        {isVoting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Processing
          </span>
        ) : disabled ? "Voting Disabled" : "Swipe to Vote"}
      </div>
      <div className="absolute top-0 left-0 h-full bg-[#1a2f4c]/10 border-r-2 border-[#1a2f4c]" style={{ width: dragX + 25 }}></div>
      <div 
        onPointerDown={handlePointerDown}
        className={`absolute top-[0px] left-0 h-full w-12 flex items-center justify-center border-r-2 border-[#1a2f4c] z-10
          ${!isDragging ? 'transition-transform duration-300' : 'duration-0 cursor-grabbing'} 
          ${disabled || isVoting ? 'cursor-not-allowed bg-[#d5cbb4] text-[#8b2635]' : 'cursor-grab bg-[#1a2f4c] hover:bg-[#2c4875] text-white'}`}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        <span className="font-extrabold text-sm uppercase">&gt;&gt;</span>
      </div>
    </div>
  );
};

const PositionSection = ({ pos, votedPositions, initiateVote, votingFor, isViewOnly }: any) => {
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(() => {
    if (!pos.resultTime) return false;
    return new Date(pos.resultTime).getTime() <= Date.now();
  });
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const sortedCandidates = [...pos.candidates].sort((a: any, b: any) => (b.voteCount || 0) - (a.voteCount || 0));
  const winner = sortedCandidates.length > 0 && (sortedCandidates[0].voteCount || 0) > 0 ? sortedCandidates[0] : null;
  const maxVotes = sortedCandidates.length > 0 && (sortedCandidates[0].voteCount || 0) > 0 ? sortedCandidates[0].voteCount : 1;

  useEffect(() => {
    if (!pos.resultTime || isFinished) return;
    const targetDate = new Date(pos.resultTime).getTime();
    const audio = new Audio('/tick.mp3');
    audio.preload = "auto";
    audio.loop = true;

    // Try starting the audio immediately based on target
    if (targetDate - Date.now() > 0) {
       audio.play().catch(e => console.log("Audio autoplay blocked by browser policy:", e));
    }

    // Check immediately
    if (targetDate - Date.now() <= 0) {
      setIsFinished(true);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setIsFinished(true);
        audio.pause();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1a2f4c', '#8b2635', '#d5cbb4'],
          zIndex: 9999
        });
      } else {
        if (audio.paused) audio.play().catch(() => {});
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      audio.pause();
      audio.src = "";
    };
  }, [pos.resultTime, isFinished]);

  return (
    <div className="relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-5 border-l-4 border-[#1a2f4c] pl-4 sm:pl-6 bg-white p-4 sm:p-6 border border-[#d5cbb4] shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-2xl font-extrabold text-[#1a2f4c] uppercase tracking-widest break-words">
              {pos.name}
            </h2>
            {isFinished && winner && (
              <span className="self-start sm:self-auto bg-[#1a2f4c] text-white px-3 py-1.5 text-[11px] sm:text-xs uppercase font-extrabold shadow-sm border-2 border-[#1a2f4c] flex items-center gap-2">
                <span>👑 WINNER:</span> <span className="text-[#efecd2]">{winner.name}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[#8b2635] font-bold text-xs uppercase tracking-widest">
              {pos.candidates.length} Candidates
            </p>
            {isFinished && (
              <span className="bg-[#8b2635] text-white px-2 py-1 text-[10px] uppercase font-bold animate-pulse">
                Voting Closed
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto border-t-2 lg:border-none border-[#d5cbb4]/50 pt-4 lg:pt-0">
          {!isFinished && timeLeft && (
            <div className="flex justify-center sm:justify-start gap-2 items-center bg-[#e8e4c9] border-2 border-[#8b2635] px-3 py-2 shadow-sm font-extrabold text-[#8b2635] text-xs uppercase tracking-widest w-full sm:w-auto">
               <span className="w-2 h-2 rounded-full bg-[#8b2635] animate-pulse"></span>
               <span>Ends in: {String(timeLeft.d).padStart(2,'0')}:{String(timeLeft.h).padStart(2,'0')}:{String(timeLeft.m).padStart(2,'0')}:{String(timeLeft.s).padStart(2,'0')}</span>
            </div>
          )}

          {isFinished && (
            <button 
               onClick={() => setShowResults(true)}
               className="bg-[#1a2f4c] text-white border-2 border-[#1a2f4c] px-4 py-2 font-bold text-[11px] sm:text-xs uppercase tracking-widest hover:bg-[#8b2635] hover:border-[#8b2635] transition-colors shadow-sm w-full sm:w-auto text-center"
            >
               View Results
            </button>
          )}

          {votedPositions.has(pos.id) && (
            <div className="inline-flex items-center justify-center sm:justify-start px-4 py-2 border-2 border-[#1a2f4c] bg-[#1a2f4c] text-white text-[11px] sm:text-xs font-bold uppercase tracking-widest shadow-sm w-full sm:w-auto">
              <span className="mr-2 font-extrabold text-[#27ae60]">✓</span> Vote Recorded
            </div>
          )}
        </div>
      </div>

      {/* Modern Modal for Results Graph */}
      {showResults && isFinished && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Official Results</h3>
                  <p className="text-sm font-medium text-slate-500">{pos.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResults(false)} 
                className="text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {sortedCandidates.map((c: any, index: number) => {
                const voteCount = c.voteCount || 0;
                const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0; 
                const isWinner = index === 0 && voteCount > 0;
                
                return (
                  <div key={c.id} className="flex items-center gap-4">
                    {/* Candidate Profile Image */}
                    <div className={`relative w-14 h-14 shrink-0 flex-none rounded-full overflow-hidden border-[3px] shadow-md z-10 
                       ${isWinner ? 'border-indigo-500 shadow-indigo-200' : 'border-slate-200'} `}>
                       {c.profilePic ? (
                          <img src={c.profilePic} alt={c.name} className="w-full h-full object-cover bg-white" />
                       ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                          </div>
                       )}
                       {isWinner && (
                         <div className="absolute -top-1 -right-1 bg-white rounded-full text-indigo-500 p-0.5 shadow-sm text-xs">
                           👑
                         </div>
                       )}
                    </div>
                    
                    {/* Result Graph Container */}
                    <div className="flex flex-col gap-2 flex-grow">
                      <div className="flex justify-between items-end pl-1">
                        <span className={`font-bold text-base leading-none ${isWinner ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {c.name}
                        </span>
                        <div className="flex flex-col items-end leading-none">
                          <span className={`font-extrabold text-xl ${isWinner ? 'text-indigo-600' : 'text-slate-600'}`}>
                            {voteCount} <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Votes</span>
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full relative overflow-hidden shadow-inner">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full 
                             ${isWinner ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-400'}`} 
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pos.candidates.map((c: any) => (
          <div key={c.id} className="group relative bg-[#fbf9f4] border-4 border-double border-[#d5cbb4] shadow-xl hover:shadow-[8px_8px_0_#1a2f4c] transition-all duration-300 flex flex-col overflow-hidden">
            <div className="absolute top-2 left-2 w-2 h-2 bg-[#1a2f4c] z-20 pointer-events-none"></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#1a2f4c] z-20 pointer-events-none"></div>

            <div className="relative w-full h-56 sm:h-64 bg-white border-b-4 border-double border-[#d5cbb4] overflow-hidden flex items-center justify-center">
              {c.profilePic ? (
                 <img src={c.profilePic} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:grayscale-0 grayscale" alt={c.name} loading="lazy" />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#d5cbb4]">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#1a2f4c]">No Photo</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 bg-white/90 border-t-2 border-r-2 border-[#1a2f4c] p-2 pl-4 pr-6">
                <h3 className="text-lg font-extrabold text-[#1a2f4c] uppercase tracking-wider">
                  {c.name}
                </h3>
              </div>
            </div>

            <div className="relative p-6 flex-grow flex flex-col">
              <p className="text-[#1a2f4c] font-medium text-sm leading-relaxed mb-6 line-clamp-4">
                {c.description || "No description provided."}
              </p>
              
              <div className="mt-auto">
                {!isViewOnly ? (
                  isFinished || votedPositions.has(pos.id) ? (
                    <button disabled className="w-full py-3 bg-[#e8e4c9] text-[#1a2f4c] border-2 border-[#d5cbb4] font-bold text-xs uppercase tracking-widest cursor-not-allowed text-center">
                      Voting Closed
                    </button>
                  ) : (
                    <SwipeToVote onVote={(reset) => initiateVote(c.id, c.name, pos.id, reset)} isVoting={votingFor === c.id} disabled={false} />
                  )
                ) : (
                   <button disabled className="w-full py-3 bg-white text-[#8b2635] border-2 border-[#d5cbb4] font-bold text-xs uppercase tracking-widest cursor-not-allowed text-center mt-2">
                      View Only
                   </button>
                )}
              </div>
            </div>
            
            <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#1a2f4c] pointer-events-none"></div>

            {votedPositions.has(pos.id) && (
              <div className="absolute top-4 right-4 w-8 h-8 bg-white border-2 border-[#1a2f4c] text-[#1a2f4c] flex items-center justify-center pointer-events-none shadow-sm">
                <span className="text-lg font-bold">🔒</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="border-b-4 border-double border-[#d5cbb4] mt-16 last:hidden" />
    </div>
  );
};

export default function VotingPage() {
  const router = useRouter();
  const { id: societyId } = useParams();
  
  const searchParams = useSearchParams();
  const isViewOnly = searchParams.get("viewOnly") === "true";
  
  const [positions, setPositions] = useState<any[]>([]);
  const [votingFor, setVotingFor] = useState<number | null>(null);
  const [votedPositions, setVotedPositions] = useState<Set<number>>(new Set()); 
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60); // 60s countdown tracking

  const [showScanner, setShowScanner] = useState(false);
  const [pendingVote, setPendingVote] = useState<any>(null);

  // -- Toast State --
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };
  const showSuccess = (msg: string) => addToast(msg, "success");
  const showError = (msg: string) => addToast(msg, "error");
  const showWarning = (msg: string) => addToast(msg, "warning");
  // -----------------

  useEffect(() => {
    const token = localStorage.getItem("voting_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    
    fetchPositions();
  }, [societyId]);

  // -- 60s Logout Timer Effect --
  useEffect(() => {
    if (isViewOnly || showScanner) return; 

    if (timeLeft <= 0) {
      showError("Time is up! You have been logged out due to inactivity.");
      localStorage.removeItem("voting_token");
      localStorage.removeItem("user_data");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000); 
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isViewOnly, showScanner]);
  // -----------------------------

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/societies/${societyId}/positions`);
      const data = await res.json();
      setPositions(data);
      
      await checkVotedPositions();
    } catch (err) { 
      console.error(err);
      showError("Failed to load positions");
    } finally {
      setIsLoading(false);
    }
  };

  const checkVotedPositions = async () => {
    try {
      const token = localStorage.getItem("voting_token");
      const userDataStr = localStorage.getItem("user_data");
      
      if (!token || !userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      const userId = userData.id;

      const res = await fetch(`/api/vote/status/${userId}?societyId=${societyId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.votedPositionIds && Array.isArray(data.votedPositionIds)) {
          setVotedPositions(new Set(data.votedPositionIds));
        }
      }
    } catch (err) {
      console.error("Failed to check voted positions:", err);
    }
  };

  const initiateVote = (candidateId: number, candidateName: string, positionId: number, resetSwipe: () => void) => {
    if (isViewOnly) {
      showWarning("You are not eligible to vote in this society's election");
      resetSwipe();
      return;
    }

    if (votedPositions.has(positionId)) {
      showError(`You have already voted for the ${positions.find(p => p.id === positionId)?.name} position`);
      resetSwipe();
      return;
    }

    const userDataStr = localStorage.getItem("user_data");
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    
    if (!userData || !userData.faceDescriptor) {
      if (!window.confirm(`Are you sure you want to vote for ${candidateName.toUpperCase()}?\n\n(No Face Data found, proceeding without verification)`)) {
        resetSwipe(); 
        return;
      }
      handleVote(candidateId, candidateName, positionId, resetSwipe);
      return;
    }

    setPendingVote({ candidateId, candidateName, positionId, resetSwipe });
    setShowScanner(true);
  };

  const processFaceVerification = (capturedImageBase64: string) => {
    setShowScanner(false);
    if (!pendingVote) return;
    
    const { candidateId, candidateName, positionId, resetSwipe } = pendingVote;
    
    // We send the image to the backend to let it verify using AI Microservice
    handleVote(candidateId, candidateName, positionId, resetSwipe, capturedImageBase64);
    setPendingVote(null);
  };

  const handleVote = async (candidateId: number, candidateName: string, positionId: number, resetSwipe: () => void, faceImage?: string) => {
    if (isViewOnly) {
      showWarning("You are not eligible to vote in this society's election");
      resetSwipe();
      return;
    }

    if (votedPositions.has(positionId)) {
      showError(`You have already voted for the ${positions.find(p => p.id === positionId)?.name} position`);
      resetSwipe();
      return;
    }

    if (!window.confirm(`Are you sure you want to vote for ${candidateName.toUpperCase()}?\n\nThis action cannot be undone.`)) {
      resetSwipe(); 
      return;
    }

    setVotingFor(candidateId);
    try {
      const token = localStorage.getItem("voting_token");
      if (!token) {
        showError("Authentication error: Please log in again");
        window.location.href = "/login"; 
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/vote`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          candidateId, 
          societyId, 
          positionId, 
          timeTaken: 60 - Math.max(0, timeLeft),
          faceImage 
        }), 
        cache: "no-store", 
      });

      const data = await res.json();

      if (res.status === 401) {
        showError("Session Expired! Please log in again");
        localStorage.removeItem("voting_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login"; 
        return;
      }

      if (res.ok) {
        setVotedPositions(prev => new Set([...prev, positionId]));
        
        const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
        userData.hasVoted = true;
        localStorage.setItem("user_data", JSON.stringify(userData));

        showSuccess(`You have successfully voted for ${candidateName}!`);
        setTimeLeft(60); // Reset timer
      } else {
        showError(data.message || "Failed to process your vote. Please try again.");
      }
    } catch (err) {
      console.error("Vote error:", err);
      showError("Network error: Failed to connect to the server");
    } finally { 
      setVotingFor(null); 
      resetSwipe(); 
    }
  };

  return (
    <div className="min-h-screen bg-[#efecd2] font-serif text-[#1a2f4c] relative overflow-x-hidden pb-20">
      {/* Old School Dotted Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#1a2f4c 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      <header className="bg-white shadow-lg border-b-4 border-[#d5cbb4] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-[#8b2635] hover:text-[#1a2f4c] transition flex items-center gap-2 font-bold text-xs uppercase tracking-widest bg-white border-2 border-[#d5cbb4] px-3 py-1 shadow-sm">
            <svg className="w-4 h-4 text-[#1a2f4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          
          {/* 20s Logout Timer UI */}
          {!isViewOnly && (
            <div className={`font-bold px-4 flex items-center gap-2 py-1 rounded shadow-sm border-2 ${
              timeLeft <= 5 ? "bg-red-50 text-red-600 border-red-500 animate-pulse" : "bg-[#fbf9f4] text-[#1a2f4c] border-[#d5cbb4]"
            }`}>
              <svg className={`w-4 h-4 ${timeLeft <= 5 ? "text-red-500" : "text-[#1a2f4c]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="uppercase text-[10px] tracking-widest hidden sm:inline">Time Left:</span> 
              <span className={`text-lg leading-none ${timeLeft <= 5 ? "text-red-600" : "text-[#8b2635]"}`}>{timeLeft}s</span>
            </div>
          )}

          <div className="flex items-center gap-3">
             <div className="w-8 h-8 border-2 border-[#1a2f4c] bg-[#1a2f4c] flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg uppercase font-serif">V</span>
             </div>
             <div className="text-[#1a2f4c] font-extrabold text-sm uppercase tracking-widest hidden sm:block">Voting Hub</div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto mt-8 px-4 pb-12">
        
        {/* Page Header */}
        <div className="text-center sm:text-left mb-10 border-b-2 border-double border-[#d5cbb4] pb-6 bg-[#fbf9f4] border-4 border-[#d5cbb4] p-8 shadow-[8px_8px_0_#d5cbb4]">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2f4c] uppercase tracking-widest mb-2">Official Election</h1>
          <p className="text-[#8b2635] font-bold uppercase tracking-widest text-sm">Secure & Anonymous Voting Process</p>
        </div>

        {isViewOnly && (
          <div className="bg-white text-[#8b2635] border-4 border-double border-[#8b2635] p-4 text-center mb-10 font-bold text-xs uppercase tracking-widest shadow-md">
            <span className="mr-2">⚠️</span> View Only Mode - You are not eligible to vote in this election
          </div>
        )}
        {votedPositions.size > 0 && !isViewOnly && (
          <div className="bg-white text-[#1a2f4c] border-4 border-[#1a2f4c] p-4 text-center mb-10 font-bold text-xs uppercase tracking-widest shadow-md">
             <span className="mr-2 font-extrabold">✓</span> You have securely submitted {votedPositions.size} vote{votedPositions.size > 1 ? 's' : ''}
          </div>
        )}

        <div className="space-y-16">
          {positions.map((pos) => (
             <PositionSection 
                key={pos.id} 
                pos={pos} 
                votedPositions={votedPositions} 
                initiateVote={initiateVote} 
                votingFor={votingFor} 
                isViewOnly={isViewOnly} 
             />
          ))}
        </div>
        
        {positions.length === 0 && (
          <div className="text-center py-16 bg-[#fbf9f4] border-4 border-double border-[#d5cbb4] relative shadow-2xl mt-8">
             <div className="mx-auto w-12 h-12 bg-white border-2 border-[#d5cbb4] flex items-center justify-center mb-4">
               <span className="text-[#8b2635] text-xl font-bold uppercase">X</span>
             </div>
             <p className="text-[#1a2f4c] font-bold uppercase tracking-wider text-sm">No positions active in this election yet.</p>
          </div>
        )}
        
        <div className="mt-16 pb-8 text-center text-[#d5cbb4] text-xs uppercase tracking-widest font-bold">
          *** End of Ballot ***
        </div>
      </main>

      {showScanner && (
        <FaceScanner 
          title="Security Check"
          message="Please verify your identity to authorize this vote."
          onCapture={processFaceVerification}
          onCancel={() => {
            setShowScanner(false);
            if (pendingVote) pendingVote.resetSwipe();
            setPendingVote(null);
          }}
        />
      )}
    </div>
  );
}
