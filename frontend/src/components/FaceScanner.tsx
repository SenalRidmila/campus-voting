import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

interface FaceScannerProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export default function FaceScanner({ 
  onCapture, 
  onCancel, 
  title = "Biometric Face Scan", 
  message = "Please align your face within the frame for scanning." 
}: FaceScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanText, setScanText] = useState("");

  const startScan = () => {
    setIsScanning(true);
    setScanText("Detecting Facial Features...");
    
    // Simulate a high-tech scanning process
    setTimeout(() => {
        setScanText("Analyzing Biometrics...");
    }, 1500);
    
    setTimeout(() => {
        setScanText("Verifying Identity...");
        executeCapture();
    }, 3000);
  };

  const executeCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    } else {
      setIsScanning(false);
      alert("Failed to scan face. Please try again.");
    }
  }, [webcamRef, onCapture]);

  return (
    <div className="fixed inset-0 bg-[#0a192f]/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md font-mono">
      <div className="text-center mb-8 max-w-md">
        <h2 className="text-3xl font-extrabold text-cyan-400 uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          {title}
        </h2>
        <p className="text-sm font-bold text-cyan-200/70 uppercase tracking-widest">
          {isScanning ? scanText : message}
        </p>
      </div>

      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center mb-10">
        
        {/* HUD Elements */}
        <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl opacity-80"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl opacity-80"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl opacity-80"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl opacity-80"></div>
            
            {/* Center Reticle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-cyan-400/30 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
            </div>
        </div>

        {/* Circular Camera Cutout */}
        <div className={`w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-full overflow-hidden relative transition-all duration-500 flex items-center justify-center border-4 ${isScanning ? 'border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.4)]' : 'border-slate-700 bg-slate-900'}`}>
           <Webcam
             audio={false}
             ref={webcamRef}
             mirrored={true}
             screenshotFormat="image/jpeg"
             screenshotQuality={0.8}
             className={`w-full h-full object-cover transform scale-125 transition-all duration-1000 ${isScanning ? 'brightness-110 contrast-125 saturate-50' : 'brightness-75 grayscale'}`}
             videoConstraints={{ facingMode: "user" }}
           />

           {/* Scanning Laser Animation */}
           {isScanning && (
             <div className="absolute inset-0 pointer-events-none z-10" style={{
                background: 'linear-gradient(to bottom, rgba(34,211,238,0) 0%, rgba(34,211,238,0.2) 50%, rgba(34,211,238,0) 100%)',
                animation: 'scanLaser 2s ease-in-out infinite alternate'
             }}>
                <div className="w-full h-[2px] bg-cyan-300 shadow-[0_0_15px_#22d3ee]"></div>
             </div>
           )}
           
           {/* Scan Overlay Data */}
           {isScanning && (
               <div className="absolute left-4 top-1/4 flex flex-col gap-2 z-20 opacity-70">
                   <div className="h-1 w-8 bg-cyan-400"></div>
                   <div className="h-1 w-6 bg-cyan-400"></div>
                   <div className="h-1 w-12 bg-cyan-400"></div>
               </div>
           )}
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs relative z-30">
        {!isScanning ? (
            <button 
            onClick={startScan} 
            className="w-full py-4 rounded bg-cyan-500/20 border border-cyan-400 text-cyan-400 font-bold uppercase tracking-widest hover:bg-cyan-400 hover:text-[#0a192f] transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
            Initialize Scan
            </button>
        ) : (
            <div className="w-full py-4 rounded bg-cyan-900/50 border border-cyan-700 text-cyan-500 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Scanning...
            </div>
        )}
        <button 
          onClick={onCancel} 
          disabled={isScanning}
          className="w-full py-3 rounded bg-transparent border border-slate-600 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30"
        >
          Abort
        </button>
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300px); }
        }
      `}</style>
    </div>
  );
}
