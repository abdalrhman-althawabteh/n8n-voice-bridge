import React from 'react';

export const Waveform: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 bg-white/80 rounded-full animate-pulse"
          style={{
            height: '100%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
};
