
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_BUSES, SCHEDULES } from '../services/dataService';
import { dbService } from '../services/dbService';

interface LogEntry {
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

const CliMode: React.FC = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'success', text: 'Areyeng Terminal System v1.0.0 initialized.' },
    { type: 'output', text: 'Type "help" for available commands.' }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    inputRef.current?.focus();
  }, [logs]);

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    
    // Echo input
    const newLogs: LogEntry[] = [...logs, { type: 'input', text: `> ${cmd}` }];

    switch (true) {
      case trimmed === 'help':
        newLogs.push({ 
          type: 'output', 
          text: `
AVAILABLE COMMANDS:
-------------------
status       : Show real-time bus locations and status
schedule     : List all bus schedules
buses        : List active fleet
clear        : Clear terminal screen
exit         : Return to graphical interface
whoami       : Show current user session
date         : Show system time
          ` 
        });
        break;

      case trimmed === 'status' || trimmed === 'buses':
        newLogs.push({ type: 'output', text: 'Fetching fleet data...' });
        newLogs.push({ 
          type: 'success', 
          text: INITIAL_BUSES.map(b => 
            `[${b.routeId}] ${b.routeName} | Status: ${b.status} | Occ: ${b.occupancy}%`
          ).join('\n')
        });
        break;

      case trimmed === 'schedule':
        newLogs.push({ type: 'output', text: 'Loading timetables...' });
        newLogs.push({ 
            type: 'output', 
            text: SCHEDULES.map(s => 
              `${s.routeId} @ ${s.stopName}: Arr ${s.arrivalTime} / Dep ${s.departureTime}`
            ).join('\n')
        });
        break;

      case trimmed === 'clear':
        setLogs([]);
        setInput('');
        return;

      case trimmed === 'whoami':
        const session = localStorage.getItem('areyeng_session');
        if (session) {
            const user = JSON.parse(session);
            newLogs.push({ type: 'success', text: `User: ${user.username} (${user.role})\nEmail: ${user.email}` });
        } else {
            newLogs.push({ type: 'error', text: 'Not logged in.' });
        }
        break;

      case trimmed === 'exit':
        newLogs.push({ type: 'success', text: 'Terminating session... Redirecting to GUI.' });
        setLogs(newLogs);
        setTimeout(() => navigate('/'), 1000);
        setInput('');
        return;
        
      case trimmed === 'date':
        newLogs.push({ type: 'output', text: new Date().toString() });
        break;

      case trimmed === '':
        break;

      default:
        newLogs.push({ type: 'error', text: `Command not found: "${trimmed}". Type "help" for options.` });
    }

    setLogs(newLogs);
    setInput('');
  };

  return (
    <div 
        className="min-h-screen bg-black text-green-500 font-mono p-4 overflow-hidden flex flex-col"
        onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto space-y-1 pb-4">
        {logs.map((log, i) => (
          <div key={i} className={`whitespace-pre-wrap ${
            log.type === 'error' ? 'text-red-500' :
            log.type === 'success' ? 'text-green-400 font-bold' :
            log.type === 'input' ? 'text-white opacity-80' :
            'text-green-600'
          }`}>
            {log.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-green-900 pt-2">
        <span className="text-green-500 font-bold animate-pulse">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommand(input)}
          className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-900"
          placeholder="Enter command..."
          autoFocus
        />
      </div>
    </div>
  );
};

export default CliMode;
