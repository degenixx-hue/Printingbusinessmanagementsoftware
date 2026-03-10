import { useState, useEffect } from 'react';

export function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg">
      <span className="text-white text-xl font-bold">
        {currentTime.toLocaleDateString('en-IN', { 
          day: '2-digit',
          month: 'short', 
          year: 'numeric'
        })}
      </span>
      <span className="text-gray-500 text-2xl">|</span>
      <span className="text-blue-400 text-2xl font-bold tabular-nums">
        {currentTime.toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        })}
      </span>
    </div>
  );
}
