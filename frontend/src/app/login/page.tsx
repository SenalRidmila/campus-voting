"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => { setToast(null); }, 2000);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/auth/request-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      showNotification("OTP Sent to your Email!", "success");
      setShowOtp(true);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if(otp.length !== 6) {
        setError("Please enter the 6-digit OTP.");
        return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/auth/verify-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      localStorage.setItem("voting_token", data.token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      
      showNotification("Login Successful! Redirecting...", "success");
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efecd2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-serif">
      
      {/* Old School Dotted Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1a2f4c 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 border-2 shadow-lg font-bold flex items-center gap-3 transition-all animate-fade-in-down ${toast.type === 'success' ? 'bg-[#f4fce8] text-[#1a2f4c] border-[#1a2f4c]' : 'bg-[#fceef0] text-[#8b2635] border-[#8b2635]'}`}>
          <span className="text-sm uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        
        
        <div className="flex justify-center w-full mb-6">
          <div className="p-4 bg-white border-4 border-[#d5cbb4] shadow-md inline-block">
            <img src="/vote.png" alt="Logo" className="h-16 w-auto object-contain drop-shadow-md" />
          </div>
        </div>
        
        <h2 className="text-center text-3xl font-extrabold text-[#1a2f4c] uppercase tracking-widest">Student Portal</h2>
        <p className="mt-2 text-center text-sm font-bold text-[#8b2635] uppercase tracking-widest">Secure 2-Factor Authentication</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Old School Form Container */}
        <div className="bg-[#fbf9f4] py-8 px-6 shadow-2xl border-4 border-double border-[#d5cbb4] relative sm:px-10">

          {/* Decorative Corners */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-[#1a2f4c]"></div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-[#1a2f4c]"></div>
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-[#1a2f4c]"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#1a2f4c]"></div>

          {!showOtp ? (
            <form className="space-y-5" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2f4c] mb-1">Campus Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border-2 border-[#d5cbb4] focus:outline-none focus:border-[#1a2f4c] sm:text-sm text-[#1a2f4c]"
                  placeholder="hc-1234@horizoncampus.edu.lk"
                />
                {error && <p className="mt-2 text-xs font-bold text-[#c0392b] bg-[#fceef0] border border-[#fadbd8] p-2 text-center">{error}</p>}
              </div>
              
              <button 
                type="submit" disabled={isLoading}
                className="w-full mt-4 flex justify-center py-3 px-4 shadow-lg text-sm font-bold text-white uppercase tracking-widest bg-[#1a2f4c] border-2 border-[#1a2f4c] hover:bg-[#2c4875] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Checking...
                  </span>
                ) : "Obtain Login Code"}
              </button>
            </form>
          ) : (
             <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2f4c] mb-1 text-center">
                  Enter Login Code sent to <br/><span className="text-[#8b2635] font-bold mt-1 inline-block text-sm">{email}</span>
                </label>
                <input
                  type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-4 py-4 bg-white border-2 border-[#d5cbb4] focus:outline-none focus:border-[#1a2f4c] text-center text-4xl tracking-[0.3em] font-mono font-bold transition-all text-[#1a2f4c]"
                  placeholder="••••••"
                />
                {error && <p className="mt-2 text-xs font-bold text-[#c0392b] bg-[#fceef0] border border-[#fadbd8] p-2 text-center">{error}</p>}
              </div>
              <button type="submit" disabled={isLoading} className="w-full mt-4 flex justify-center py-3 px-4 shadow-lg text-sm font-bold text-white uppercase tracking-widest bg-[#1a2f4c] border-2 border-[#1a2f4c] hover:bg-[#2c4875] transition-all disabled:opacity-50">
                 {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Verifying...
                  </span>
                ) : "Sign In"}
              </button>
            </form>
          )}

          {!showOtp && (
            <div className="mt-8 border-t-2 border-[#d5cbb4] pt-6">
              <p className="text-center text-xs font-bold text-[#1a2f4c] mb-4 uppercase tracking-wider">New to the app?</p>
              <div className="flex justify-center">
                <Link href="/signup" replace className="w-full flex flex-col items-center justify-center p-3 text-[#1a2f4c] bg-white border-2 border-[#d5cbb4] hover:bg-[#efecd2] transition-colors text-sm font-bold uppercase tracking-widest shadow-md">
                   <span>Register Account</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
