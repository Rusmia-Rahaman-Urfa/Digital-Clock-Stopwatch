import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";

// Icons (using inline SVG for simplicity)
const ClockIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const StopwatchIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zm-7 0h2v2h-2v-2z"></path></svg>);
const AlarmIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM5 3v2M19 3v2M12 2v2M5.64 18.36l-1.41 1.41M18.36 18.36l1.41 1.41"></path></svg>);
const XIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);

// --- Helper Components ---

const Title = ({ children }) => (
  <h1 className="title-style">
    {children}
  </h1>
);

const Button = ({ onClick, children, isPrimary, isDisabled = false, className = '' }) => (
  <button
    onClick={onClick}
    className={`button-base ${isPrimary ? 'button-primary' : 'button-secondary'} ${className}`}
    disabled={isDisabled}
  >
    {children}
  </button>
);

// Custom Modal to replace the forbidden alert()
const MessageModal = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Notification</h3>
                    <button className="modal-close" onClick={onClose}><XIcon /></button>
                </div>
                <p className="modal-body">{message}</p>
                <div className="modal-footer">
                    <Button onClick={onClose} isPrimary={true} className="w-auto px-6 py-2">
                        Dismiss
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- Digital Clock Logic ---

const DigitalClock = ({ setModalMessage, alarms, setAlarms }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Memoized Time and Date & HH:MM for alarm checking
  const { formattedTime, formattedDate, currentHourMinute } = useMemo(() => {
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeString = currentTime.toLocaleTimeString('en-US', timeOptions);
    const dateString = currentTime.toLocaleDateString('en-US', dateOptions);
    
    // For checking alarms (24-hour HH:MM format)
    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    
    return { 
        formattedTime: timeString, 
        formattedDate: dateString,
        currentHourMinute: `${hh}:${mm}`
    };
  }, [currentTime]);

  // Clock Update Effect 
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timerId);
  }, []);
  
  // Alarm check logic (runs when currentHourMinute changes)
  useEffect(() => {
    const triggeredAlarm = alarms.find(a => a.time === currentHourMinute && a.active);
    
    if (triggeredAlarm) {
        setModalMessage(`⏰ ALARM: ${triggeredAlarm.label} is ringing!`);
        
        // Deactivate alarm after trigger
        setAlarms(prevAlarms => prevAlarms.map(a => 
            a.id === triggeredAlarm.id ? { ...a, active: false } : a
        ));
    }
  }, [currentHourMinute, alarms, setModalMessage, setAlarms]);

  return (
    <div className="digital-clock-container">
      <div className="display-box time-box md:p-8 p-6 mb-4">
        <p className="time-display-large">{formattedTime}</p>
      </div>
      <div className="display-box date-box">
        <p className="display-text">{formattedDate}</p>
      </div>
      <div className="clock-info mt-4">
        <p>Your local system time, updated in real-time.</p>
      </div>
      
      {/* Displaying active alarm count */}
      <AlarmStatusIndicator alarms={alarms} />
    </div>
  );
}

const AlarmStatusIndicator = ({ alarms }) => {
    const activeAlarms = alarms.filter(a => a.active).length;
    return (
        <div className="alarm-status-box">
            <p className="text-sm font-semibold text-gray-400">
                <AlarmIcon /> {activeAlarms} Active Alarm{activeAlarms !== 1 ? 's' : ''}
            </p>
        </div>
    );
}

// --- Alarm Feature Logic ---

const Alarm = ({ setModalMessage, alarms, setAlarms }) => {
    const [newTime, setNewTime] = useState('08:00');
    const [newLabel, setNewLabel] = useState('New Alarm');
    
    const handleAddAlarm = useCallback(() => {
        if (!newTime) {
            setModalMessage("Please select a time to set the alarm.");
            return;
        }

        const newAlarm = {
            id: Date.now(),
            time: newTime, // HH:MM (24-hour format)
            label: newLabel || 'Alarm',
            active: true,
        };
        setAlarms(prev => [...prev, newAlarm]);
        setNewTime('09:00');
        setNewLabel('');
    }, [newTime, newLabel, setAlarms, setModalMessage]);

    const toggleAlarm = useCallback((id) => {
        setAlarms(prev => prev.map(a => 
            a.id === id ? { ...a, active: !a.active } : a
        ));
    }, [setAlarms]);

    const deleteAlarm = useCallback((id) => {
        setAlarms(prev => prev.filter(a => a.id !== id));
    }, [setAlarms]);


    return (
        <div className="alarm-container">
            {/* Alarm Setting Form */}
            <div className="alarm-input-grid">
                <input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input-field time-input"
                    step="60" // Ensures only minutes are selectable
                />
                <input 
                    type="text" 
                    value={newLabel} 
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label (e.g., Meeting, Wake up)"
                    className="input-field label-input"
                    maxLength="30"
                />
                <Button 
                    onClick={handleAddAlarm} 
                    isPrimary={true}
                    className="add-alarm-button"
                >
                    Set Alarm
                </Button>
            </div>

            {/* Alarm List */}
            <div className="alarm-list-container">
                <h3 className="section-title">Scheduled Alarms ({alarms.length})</h3>
                {alarms.length === 0 ? (
                    <p className="laps-empty">No alarms scheduled.</p>
                ) : (
                    <ul className="alarm-list">
                        {alarms.map(alarm => (
                            <li key={alarm.id} className={`alarm-item ${alarm.active ? 'active-alarm' : 'inactive-alarm'}`}>
                                <div className="alarm-details">
                                    <span className="alarm-time">{alarm.time}</span>
                                    <span className="alarm-label">{alarm.label}</span>
                                </div>
                                <div className="alarm-actions">
                                    <Button 
                                        onClick={() => toggleAlarm(alarm.id)} 
                                        isPrimary={alarm.active}
                                        className="toggle-button"
                                    >
                                        {alarm.active ? 'Active' : 'Snoozed'}
                                    </Button>
                                    <button 
                                        onClick={() => deleteAlarm(alarm.id)}
                                        className="delete-button"
                                    >
                                        <XIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
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
  return `${hours}:${minutes}:${seconds}<span class="milliseconds">.${milliseconds}</span>`;
};

function Stopwatch() {
  const [time, setTime] = useState(0); // Time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const timeOffsetRef = useRef(0);
  const startTimeRef = useRef(0);

  const [lapCount, setLapCount] = useState(0);

  // useMemo (Formatted Display)
  const displayTimeHtml = useMemo(() => {
    return formatStopwatchTime(time);
  }, [time]); 

  // useCallback (Start/Stop function)
  const startStop = useCallback(() => {
    if (isRunning) {
      clearInterval(intervalRef.current);
      timeOffsetRef.current += Date.now() - startTimeRef.current;
      setIsRunning(false);
    } else {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setTime(timeOffsetRef.current + (Date.now() - startTimeRef.current));
      }, 10); // Update every 10ms for millisecond accuracy
      setIsRunning(true);
    }
  }, [isRunning]); 

  // useCallback (Lap function)
  const handleLap = useCallback(() => {
    if (isRunning) {
      const lapTime = time;
      setLaps(prevLaps => [
        { id: Date.now(), lap: lapTime },
        ...prevLaps
      ]);
      setLapCount(prev => prev + 1);
    }
  }, [isRunning, time]);
  
  // Reset function
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
      
      <div className="stopwatch-display-wrapper">
        <p className="text-sm font-semibold text-gray-400">Time Elapsed:</p>
        <p 
          className="stopwatch-reading" 
          dangerouslySetInnerHTML={{ __html: displayTimeHtml }}
        />
      </div>

      <div className="status-box">
        <p className="text-lg font-semibold text-sky-300">
          Total Laps Logged
        </p>
        <p className="text-4xl font-bold text-sky-500 mt-2">
          {lapCount}
        </p>
        <p className={`text-sm mt-1 font-mono ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
          {isRunning ? "TIMER RUNNING" : "STOPPED / PAUSED"}
        </p>
      </div>

      <div className="button-group-responsive">
        {/* Start/Stop Button */}
        <Button onClick={startStop} isPrimary={!isRunning}>
          {isRunning ? 'STOP' : (time > 0 ? 'RESUME' : 'START')}
        </Button>
        
        {/* Lap Button */}
        <Button onClick={handleLap} isPrimary={false} isDisabled={!isRunning} className="w-1/2 md:w-auto">
          Lap
        </Button>
        
        {/* Reset Button */}
        <Button onClick={resetTimer} isPrimary={false} isDisabled={isRunning || time === 0} className="w-1/2 md:w-auto">
          Reset
        </Button>
      </div>
      
      {/* Laps List */}
      <div className="laps-list-container">
        <h3 className="section-title">Lap Records</h3>
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
                <span className="lap-time" dangerouslySetInnerHTML={{ __html: formatStopwatchTime(lapItem.lap) }} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


// --- Main App Component ---
function ClockStopwatchApp() {
  const [activeTab, setActiveTab] = useState('clock');
  const [modalMessage, setModalMessage] = useState(null);
  const [alarms, setAlarms] = useState([]); // State shared between Clock and Alarm components

  return (
    <div className="app-container">
      
      <Title>Professional Utility Clock</Title>
      
      {/* Tab Navigation */}
      <div className="tab-bar">
          <button 
            onClick={() => setActiveTab('clock')}
            className={`tab-button ${activeTab === 'clock' ? 'tab-active' : ''}`}
          >
            <ClockIcon /> Digital Clock
          </button>
          <button 
            onClick={() => setActiveTab('stopwatch')}
            className={`tab-button ${activeTab === 'stopwatch' ? 'tab-active' : ''}`}
          >
            <StopwatchIcon /> Stopwatch
          </button>
          <button 
            onClick={() => setActiveTab('alarm')}
            className={`tab-button ${activeTab === 'alarm' ? 'tab-active' : ''}`}
          >
            <AlarmIcon /> Alarm
          </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
          {activeTab === 'clock' && <DigitalClock setModalMessage={setModalMessage} alarms={alarms} setAlarms={setAlarms} />}
          {activeTab === 'stopwatch' && <Stopwatch />}
          {activeTab === 'alarm' && <Alarm setModalMessage={setModalMessage} alarms={alarms} setAlarms={setAlarms} />}
      </div>
      
      {/* Custom Alert Modal */}
      <MessageModal message={modalMessage} onClose={() => setModalMessage(null)} />
      
    </div>
  );
}

export default ClockStopwatchApp;