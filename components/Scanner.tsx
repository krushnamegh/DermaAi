
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ScannerProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Could not access camera. Please ensure permissions are granted.");
        console.error(err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-2xl">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
        <p className="text-red-700 font-medium text-center">{error}</p>
        <button 
          onClick={onCancel}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto overflow-hidden rounded-3xl bg-black shadow-2xl">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full aspect-[3/4] object-cover"
      />
      
      {/* Scanner UI Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-[40px] border-black/40"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-sky-400 rounded-full scanner-ring"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-sky-400/50 scan-line shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
        
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/60 backdrop-blur rounded-full text-white text-xs font-medium tracking-wider uppercase">
          Align Face within circle
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
        <button 
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        
        <button 
          onClick={handleCapture}
          className="group relative"
        >
          <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform group-active:scale-90">
             <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
        </button>

        <div className="w-12"></div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Scanner;
