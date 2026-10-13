"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FaceScanner from "@/components/FaceScanner";

export default function SignupPage() {
  const router = useRouter();
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [faculty, setFaculty] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@horizoncampus.edu.lk")) {
      setError("Strictly use your @horizoncampus.edu.lk email.");
      return;
    }

    const emailPrefix = email.split("@")[0].toLowerCase();
    const idNormalized = studentId.trim().toLowerCase();

    if (emailPrefix !== idNormalized) {
      setError("Your Student ID must match the first part of your email.");
      return;
    }

    setShowScanner(true);
  };

  const processRegistration = async (faceImage: string) => {
    setShowScanner(false);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/auth/request-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, studentId, faculty, email, faceImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong!");
      }

      setShowScanner(true);
      setShowOtp(true);
      setShowScanner(false); // Make sure it's closed
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if(otp.length !== 6) {
        setError("Please enter the 6-digit OTP.");
        return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/auth/verify-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      alert("Registration Successful! You can now log in.");
      router.push('/login');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ece8dc] text-[#333] font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Subtle Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1a2f4c 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="mx-auto flex justify-center mb-2">
          {/* Logo unchanged as requested */}
          <img src="/vote.png" alt="Horizon Campus Logo" className="h-24 w-auto object-contain drop-shadow-xl" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#1a2f4c] uppercase tracking-widest">Register to Vote</h2>
        <p className="mt-2 text-center text-sm font-bold text-[#8b2635] uppercase tracking-widest">Create your secure student voting account</p>
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
            <form className="space-y-5" onSubmit={handleSendOtp}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2f4c] mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="block w-full px-4 py-3 bg-white border-2 border-[#d5cbb4] focus:outline-none focus:border-[#1a2f4c] sm:text-sm" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2f4c] mb-1">Student ID</label>
                  <input type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="block w-full px-4 py-3 bg-white border-2 border-[#d5cbb4] focus:outline-none focus:border-[#1a2f4c] sm:text-sm" placeholder="HC-1234" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2f4c] mb-1">Faculty</label>
                  <select required value={faculty} onChange={(e) => setFaculty(e.target.value)} className="block w-full px-4 py-3 bg-white border-2 border-[#d5cbb4] focus:outline-none focus:border-[#1a2f4c] sm:text-sm">
                    <option value="">Select Faculty</option>
                    <option value="Faculty of Management">Faculty of Management</option>
                    <option value="Faculty of Technology">Faculty of Technology</option>
                    <option value="Faculty of Science">Faculty of Science</option>
                    <option value="Faculty of IT">Faculty of IT</option>
                    <option value="Faculty of Education">Faculty of Education</option>
                    <option value="Faculty of Law">Faculty of Law</option>
                    <option value="Department of Nursing">Department of Nursing</option>
                    <option value="English Language Teaching Unit">English Language Teaching Unit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2f4c] mb-1">Campus Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-4 py-3 bg-white border-2 border-[#d5cbb4] focus:outline-none focus:border-[#1a2f4c] sm:text-sm" placeholder="hc-1234@horizoncampus.edu.lk" />
                {error && <p className="mt-2 text-xs font-bold text-[#c0392b] bg-[#fceef0] border border-[#fadbd8] p-2 text-center">{error}</p>}
              </div>
              
              <button type="submit" disabled={isLoading} className="w-full mt-4 flex justify-center py-3 px-4 shadow-lg text-sm font-bold text-white uppercase tracking-widest bg-[#1a2f4c] border-2 border-[#1a2f4c] hover:bg-[#2c4875] transition-all disabled:opacity-50">
                {isLoading ? "Processing..." : "Send Verification OTP"}
              </button>
            </form>
          ) : (
             <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-sm font-medium text-slate-600 text-center mb-4">Enter Code sent to <br/><span className="text-indigo-600 font-semibold mt-1 inline-block">{email}</span></label>
                <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-4xl tracking-[0.3em] font-mono font-bold transition-all text-slate-800" placeholder="••••••" />
                {error && <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg flex items-center justify-center">{error}</p>}
              </div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3.5 px-4 rounded-lg shadow-md hover:shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                 {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Verifying...
                  </span>
                ) : "Verify & Sign Up"}
              </button>
            </form>
          )}

          {!showOtp && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-center text-sm font-medium text-slate-500">
                Already registered? <br/>
                <Link href="/login" className="inline-block mt-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Log In Here</Link>
              </p>
            </div>
          )}
        </div>
      </div>
      
      {showScanner && (
        <FaceScanner 
          title="Face Registration"
          message="Please look at the camera to register your face. This will be used to verify your identity when voting."
          onCapture={processRegistration}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
