import React, { useState, useEffect } from 'react';

function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  
  return time.toLocaleString('es-US', {
    hour: 'numeric',
    minute: 'numeric',
    // second: 'numeric',
    hour12: true,
    // year: 'numeric',
    // month: 'long',
    // day: 'numeric'
  });
}

function Clock() {
  const time = useClock();

  return (
    <div>
      {time}
    </div>
  );
}

export default Clock;