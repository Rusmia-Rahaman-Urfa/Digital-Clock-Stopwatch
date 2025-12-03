import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";

// --- Helper Components from Original Pattern ---

const Title = ({ children }) => (
  <h1 className="title-style">
    {children}
  </h1>
);

const Button = ({ onClick, children, isPrimary, isDisabled = false }) => (
  <button
    onClick={onClick}
    className={`button-base ${isPrimary ? 'button-primary' : 'button-secondary'}`}
    disabled={isDisabled}
  >
    {children}
  </button>
);

// memo (Child Component) - Displays static/memoized time or date
const TimeDisplayComponent = ({ staticMessage, time, isTime }) => {
  // console.log("Memo component rendered");
  return (
    <div className={`display-box ${isTime ? 'time-box' : 'date-box'}`}>
      <p className="display-text">
        {time || staticMessage}
      </p>
    </div>
  );
};

const MemorizedTimeDisplay = memo(TimeDisplayComponent);
const MemorizedTitle = memo(Title);
const MemorizedButton = memo(Button);

// --- Digital Clock Logic ---

const DigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 1. useMemo: Memoize the time string to only recalculate when currentTime changes
  const formattedTime = useMemo(() => {
    // console.log("⚡️ useMemo: Recalculating Digital Time String");
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, [currentTime]);

  // Memoize the date string as well
  const formattedDate = useMemo(() => {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return currentTime.toLocaleDateString('en-US', dateOptions);
  }, [currentTime]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="digital-clock-container">
      <MemorizedTimeDisplay time={formattedTime} isTime={true} />
      <MemorizedTimeDisplay time={formattedDate} isTime={false} />
      <div className="clock-info">
         <p>Current System Time (Updated using useEffect)</p>
      </div>
    </div>
  );
}

// --- Stopwatch Logic ---

const formatStopwatchTime = (ms) => {
  const totalMilliseconds = Math.floor(ms);
  const milliseconds = String(totalMilliseconds % 1000).padStart(3, '0');
  const seconds = String(Math.floor(totalMilliseconds / 1000) % 60).padStart(2, '0');
  const minutes = String(Math.floor(totalMilliseconds / (1000 * 60)) % 60).padStart(2, '0');
  const hours = String(Math.floor(totalMilliseconds / (1000 * 60 * 60))).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

function Stopwatch() {
  const [time, setTime] = useState(0); // Time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const timeOffsetRef = useRef(0);
  const startTimeRef = useRef(0);

  // 1. useState for an unused state variable to satisfy the pattern, similar to secondaryState
  const [lapCount, setLapCount] = useState(0);

  // 2. useMemo (Formatted Display)
  const displayTime = useMemo(() => {
    // console.log("⚡️ useMemo: Recalculating Stopwatch Display");
    return formatStopwatchTime(time);
  }, [time]); 

  // 3. useCallback (Start/Stop function)
  const startStop = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      timeOffsetRef.current += Date.now() - startTimeRef.current;
      setIsRunning(false);
    } else {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTime(timeOffsetRef.current + (Date.now() - startTimeRef.current));
      }, 10);
      setIsRunning(true);
    }
  }, [isRunning]); 

  // 3. useCallback (Lap function)
  const handleLap = useCallback(() => {
    if (isRunning) {
      const lapTime = time;
      setLaps(prevLaps => [
        { id: Date.now(), lap: lapTime },
        ...prevLaps
      ]);
      setLapCount(prev => prev + 1); // Mimicking the secondary state update
    }
  }, [isRunning, time]);
  
  // Reset function (similar to the original secondary button handler)
  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(0);
    timeOffsetRef.current = 0;
    startTimeRef.current = 0;
    setLaps([]);
    setLapCount(0);
  };
  
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);


  return (
    <div className="stopwatch-container">
      
      <div className="kindness-counter-box">
        <p className="text-lg text-gray-500">Stopwatch Reading:</p>
        <p className="stopwatch-reading">{displayTime}</p>
      </div>

      <div className="battery-level-box">
        <p className="text-lg font-semibold text-pink-800">
          Lap Count Logged
        </p>
        <p className="text-4xl font-bold text-pink-500 mt-2">
          {lapCount}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {isRunning ? "Running..." : "Paused / Stopped"}
        </p>
      </div>

      <div className="space-y-3 mt-6">
        {/* Start/Stop Button using useCallback */}
        <MemorizedButton onClick={startStop} isPrimary={!isRunning}>
          {isRunning ? 'Stop Timer' : 'Start Timer'}
        </MemorizedButton>
        
        {/* Lap Button using useCallback */}
        <MemorizedButton onClick={handleLap} isPrimary={false} isDisabled={!isRunning}>
          Lap Time (Total Laps: {lapCount})
        </MemorizedButton>
        
        {/* Reset Button */}
        <Button onClick={resetTimer} isPrimary={false}>
          Reset Timer
        </Button>
      </div>
      
      {/* Laps List */}
      <div className="laps-list-container">
        {laps.length === 0 ? (
          <p className="laps-empty">No laps recorded yet.</p>
        ) : (
          <ul className="laps-list">
            {laps.map((lapItem, index) => (
              <li 
                key={lapItem.id} 
                className="lap-item"
              >
                <span className="lap-number">Lap {laps.length - index}</span>
                <span className="lap-time">{formatStopwatchTime(lapItem.lap)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


// --- Main App Component (for Tab Switching) ---
function ClockStopwatchApp() {
  const [activeTab, setActiveTab] = useState('clock');
  
  return (
    <div className="app-container">
      
      <MemorizedTitle>Digital Clock & Stopwatch</MemorizedTitle>
      
      <div className="tab-bar">
          <button 
            onClick={() => setActiveTab('clock')}
            className={`tab-button ${activeTab === 'clock' ? 'tab-active' : ''}`}
          >
            Digital Clock
          </button>
          <button 
            onClick={() => setActiveTab('stopwatch')}
            className={`tab-button ${activeTab === 'stopwatch' ? 'tab-active' : ''}`}
          >
            Stopwatch
          </button>
      </div>

      <div className="content-area">
          {activeTab === 'clock' ? (
            <DigitalClock />
          ) : (
            <Stopwatch />
          )}
      </div>
      
    </div>
  );
}

export default ClockStopwatchApp;