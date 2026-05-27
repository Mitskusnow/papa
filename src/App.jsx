import React, { useState, useEffect } from 'react';

// --- Assets & Generators ---
const DEFAULT_TEACHER_IMG = "https://api.dicebear.com/7.x/avataaars/svg?seed=";
const DEFAULT_AI_IMG = "https://api.dicebear.com/7.x/bottts/svg?seed=";

const SUBJECTS = ["Math", "English", "Code", "Science"];
const TASKS = {
  Math: ["Calculus Worksheet", "Algebra Test", "Fractions Homework"],
  English: ["Gatsby Essay", "Poem Analysis", "Grammar Check"],
  Code: ["React Bug Fix", "Python Script", "CSS Styling"],
  Science: ["Lab Report", "Physics Equations", "Chemistry Prep"]
};
const NAMES = ["Mr. Smith", "Mrs. Jones", "Coach Steve", "Principal Belding", "Timmy", "Sarah", "Dr. Brown", "Ms. Frizzle"];

const generateRandomCustomer = (index) => {
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const taskList = TASKS[subject];
  const task = taskList[Math.floor(Math.random() * taskList.length)];
  // Add an index so if the same name rolls twice in a day, they have a unique key
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  
  return {
    id: Date.now() + index + Math.random(), 
    teacher: name,
    subject: subject,
    task: task,
    img: DEFAULT_TEACHER_IMG + name.replace(/\s/g, '') + index
  };
};

const INITIAL_STATE = {
  score: 0,
  tokens: 15,
  day: 1,
  isDayActive: false,
  customerQueue: [], // Customers waiting to enter the shop
  assignments: [],   // Customers currently on the ticket rail
  completed: [],     // Graded papers for the day
  aiTools: [
    { id: "ai1", name: "MathSolver 3000", handles: "Math", img: DEFAULT_AI_IMG + "Math" },
    { id: "ai2", name: "EssayBot Pro", handles: "English", img: DEFAULT_AI_IMG + "Essay" },
    { id: "ai3", name: "CodeGenie", handles: "Code", img: DEFAULT_AI_IMG + "Code" },
    { id: "ai4", name: "ScienceLab AI", handles: "Science", img: DEFAULT_AI_IMG + "Science" }
  ]
};

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  
  // Game Actions State
  const [activeTicketId, setActiveTicketId] = useState("");
  const [selectedAI, setSelectedAI] = useState("");
  const [message, setMessage] = useState("Welcome to Papa's Prompt-eria! Open for business.");

  // Custom Form States (Sandbox)
  const [newTeacher, setNewTeacher] = useState({ name: "", subject: "Math", task: "", imgUrl: "" });
  const [newAI, setNewAI] = useState({ name: "", handles: "Math", imgUrl: "" });

  // --- Day Management Logic ---
  const handleStartDay = () => {
    // Day 1 has 3 customers, Day 2 has 4, etc. Maximum of 15 per day to prevent chaos.
    const numCustomers = Math.min(2 + gameState.day, 15); 
    const newQueue = Array.from({ length: numCustomers }).map((_, i) => generateRandomCustomer(i));
    
    setGameState(prev => ({
      ...prev,
      isDayActive: true,
      customerQueue: newQueue,
      assignments: [],
      completed: [], // Clear yesterday's grades
      tokens: prev.tokens + 5 // Daily token stipend
    }));
    setMessage(`☀️ Day ${gameState.day} started! A line is forming outside...`);
  };

  const handleNextDay = () => {
    setGameState(prev => ({
      ...prev,
      day: prev.day + 1,
      isDayActive: false,
    }));
    setMessage(`🌙 Shop closed. Rest up for tomorrow!`);
  };

  // --- Customer Spawning Timer (The "Game Loop") ---
  useEffect(() => {
    let timer;
    // If the day is active, there are people in line, and the rail isn't full (max 5 at a time)
    if (gameState.isDayActive && gameState.customerQueue.length > 0 && gameState.assignments.length < 5) {
      // A new customer walks in every 4 seconds
      timer = setTimeout(() => {
        const nextCustomer = gameState.customerQueue[0];
        setGameState(prev => ({
          ...prev,
          customerQueue: prev.customerQueue.slice(1), // Remove from queue
          assignments: [...prev.assignments, nextCustomer] // Add to rail
        }));
        setMessage(`🔔 Ding! ${nextCustomer.teacher} entered the shop.`);
      }, 4000);
    }
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [gameState.isDayActive, gameState.customerQueue, gameState.assignments]);

  // --- Smart Rules Engine (Grading Logic) ---
  const handleProcessWork = () => {
    if (gameState.tokens <= 0) {
      setMessage("❌ Out of AI Tokens! You can't process any more homework.");
      return;
    }

    const assignment = gameState.assignments.find(a => a.id === activeTicketId);
    const aiTool = gameState.aiTools.find(ai => ai.id === selectedAI);

    let grade = 0;
    let pointsEarned = 0;
    let feedback = "";

    // Rule 1: Subject Matching
    if (assignment.subject === aiTool.handles) {
      grade = 100;
      pointsEarned = 50;
      feedback = `Perfect match! ${aiTool.name} aced the ${assignment.subject} assignment.`;
    } else {
      grade = 0;
      pointsEarned = -10;
      feedback = `Disaster! ${aiTool.name} doesn't know how to do ${assignment.subject}.`;
    }

    setGameState(prev => ({
      ...prev,
      score: prev.score + pointsEarned,
      tokens: prev.tokens - 1,
      assignments: prev.assignments.filter(a => a.id !== assignment.id),
      completed: [{ ...assignment, grade, aiUsed: aiTool.name, feedback }, ...prev.completed]
    }));
    
    setMessage(`📝 Order Graded: ${grade}%! ${feedback}`);
    setActiveTicketId("");
    setSelectedAI("");
  };

  // --- Sandbox Methods ---
  const handleAddAssignment = () => {
    const newId = Date.now();
    const finalImg = newTeacher.imgUrl.trim() !== "" ? newTeacher.imgUrl : DEFAULT_TEACHER_IMG + newTeacher.name;
    setGameState(prev => ({
      ...prev,
      assignments: [...prev.assignments, { id: newId, teacher: newTeacher.name, subject: newTeacher.subject, task: newTeacher.task, img: finalImg }]
    }));
    setNewTeacher({ name: "", subject: "Math", task: "", imgUrl: "" });
    setMessage("📥 Manual ticket injected to the rail!");
  };

  const handleAddAI = () => {
    const newId = `ai_${Date.now()}`;
    const finalImg = newAI.imgUrl.trim() !== "" ? newAI.imgUrl : DEFAULT_AI_IMG + newAI.name;
    setGameState(prev => ({
      ...prev,
      aiTools: [...prev.aiTools, { id: newId, name: newAI.name, handles: newAI.handles, img: finalImg }]
    }));
    setNewAI({ name: "", handles: "Math", imgUrl: "" });
    setMessage("🤖 New AI Machine installed at the Prompt Station!");
  };

  // --- Validation & Status ---
  const isProcessDisabled = !activeTicketId || !selectedAI || gameState.tokens <= 0;
  const isAddTeacherDisabled = !newTeacher.name || !newTeacher.task;
  const isAddAIDisabled = !newAI.name;
  
  // Day is complete when it's active, no one is in line, and no tickets are on the rail
  const isDayComplete = gameState.isDayActive && gameState.customerQueue.length === 0 && gameState.assignments.length === 0;

  return (
    <div style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fdf6e3', minHeight: '100vh' }}>
      
      <div style={{ backgroundColor: '#fff', padding: '15px', border: '3px solid #333', borderRadius: '12px', marginBottom: '20px', boxShadow: '4px 4px 0px #ccc' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#d9534f' }}>🍕 Papa's Prompt-eria</h1>
        <p style={{ margin: 0, color: '#555' }}>Start a day to let customers in. Match their ticket's subject to the correct AI machine. Don't run out of AI tokens!</p>
      </div>

      {/* HUD Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#333', color: 'white', padding: '15px 25px', borderRadius: '8px', fontSize: '1.2rem', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <span><strong>Day:</strong> {gameState.day} | <strong>Tips:</strong> ${gameState.score}</span>
        <span style={{ color: '#ffd700' }}><strong>{message}</strong></span>
        <span><strong>Tokens:</strong> 🔋 {gameState.tokens}</span>
      </div>

      {/* --- STATION 1: ORDER STATION (The Ticket Rail) --- */}
      <div style={{ backgroundColor: '#e2e8f0', padding: '20px', borderRadius: '12px', border: '3px solid #94a3b8', marginBottom: '20px', minHeight: '220px' }}>
        
        {!gameState.isDayActive && !isDayComplete && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h2>Shop is Closed.</h2>
            <button onClick={handleStartDay} style={{ padding: '15px 30px', fontSize: '20px', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              ▶️ START DAY {gameState.day}
            </button>
          </div>
        )}

        {isDayComplete && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h2 style={{ color: '#5cb85c' }}>Day {gameState.day} Complete! 🎉</h2>
            <p>All customers served. You survived the rush.</p>
            <button onClick={handleNextDay} style={{ padding: '15px 30px', fontSize: '20px', backgroundColor: '#337ab7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Advance to Day {gameState.day + 1} ⏭️
            </button>
          </div>
        )}

        {gameState.isDayActive && !isDayComplete && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ marginTop: 0 }}>📎 Order Station (Ticket Rail)</h2>
              <span style={{ fontWeight: 'bold', color: '#666' }}>Waiting outside: {gameState.customerQueue.length} 🧍</span>
            </div>
            
            {gameState.assignments.length === 0 ? <p>Waiting for customers to walk in...</p> : null}
            
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              {gameState.assignments.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => setActiveTicketId(a.id)}
                  style={{ 
                    minWidth: '200px', 
                    backgroundColor: activeTicketId === a.id ? '#ffeb3b' : '#fff', 
                    border: activeTicketId === a.id ? '4px solid #d9534f' : '2px dashed #999', 
                    padding: '10px', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                  }}>
                  <img src={a.img} alt={a.teacher} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee' }} />
                  <h3 style={{ margin: '10px 0 5px 0' }}>{a.teacher}</h3>
                  <p style={{ margin: '0', fontWeight: 'bold', color: '#5bc0de' }}>{a.subject}</p>
                  <p style={{ margin: '5px 0', fontStyle: 'italic' }}>"{a.task}"</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* --- STATION 2: PROMPT STATION --- */}
        <div style={{ flex: 1, backgroundColor: '#dff0d8', padding: '20px', borderRadius: '12px', border: '3px solid #5cb85c' }}>
          <h2 style={{ marginTop: 0 }}>💻 Prompt Station</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>1. Active Ticket ID:</label>
            <input type="text" readOnly value={activeTicketId ? `Ticket #${activeTicketId}` : "Click a ticket on the rail first!"} style={{ width: '100%', padding: '10px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>2. Route to AI Machine:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {gameState.aiTools.map(ai => (
                <div 
                  key={ai.id} 
                  onClick={() => setSelectedAI(ai.id)}
                  style={{
                    border: selectedAI === ai.id ? '4px solid #5cb85c' : '2px solid #555',
                    backgroundColor: selectedAI === ai.id ? '#fff' : '#444',
                    color: selectedAI === ai.id ? '#000' : '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    width: '120px'
                  }}>
                  <img src={ai.img} alt={ai.name} style={{ width: '60px', height: '60px', backgroundColor: '#aaa', borderRadius: '8px' }} />
                  <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>{ai.name}</p>
                  <small>Handles: {ai.handles}</small>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleProcessWork} 
            disabled={isProcessDisabled}
            style={{ 
              width: '100%', padding: '15px', backgroundColor: isProcessDisabled ? '#ccc' : '#5cb85c', 
              color: 'white', border: 'none', borderRadius: '8px', cursor: isProcessDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 'bold', fontSize: '18px', boxShadow: isProcessDisabled ? 'none' : '0 4px 0 #4cae4c'
            }}
          >
            {isProcessDisabled ? "Select Ticket & AI" : "Process Homework!"}
          </button>
        </div>

        {/* --- GRADING SCREEN (Output) --- */}
        <div style={{ flex: 1, backgroundColor: '#f9f2f4', padding: '20px', borderRadius: '12px', border: '3px solid #d9534f' }}>
          <h2 style={{ marginTop: 0 }}>💯 Grading Screen</h2>
          {gameState.completed.length === 0 ? (
            <p style={{ color: '#888' }}>No assignments turned in yet today.</p>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {gameState.completed.map((c, idx) => (
                <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={c.img} alt="Teacher" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                  <div>
                    <strong>{c.teacher}</strong> - {c.task}
                    <div style={{ color: c.grade === 100 ? 'green' : 'red', fontWeight: 'bold' }}>
                      Grade: {c.grade}% ({c.grade === 100 ? '+50 Tip' : '-10 Penalty'})
                    </div>
                    <small>Used: {c.aiUsed}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- STATION 3: MANAGEMENT OFFICE (Sandbox) --- */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '3px solid #337ab7', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, color: '#337ab7' }}>🏢 Sandbox / Cheats (Add Custom Entities)</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          
          <div style={{ flex: 1, padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
            <h3>Force Inject Customer</h3>
            <input type="text" placeholder="Teacher Name (e.g. Mr. White)" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
            <input type="text" placeholder="Task (e.g. History Essay)" value={newTeacher.task} onChange={e => setNewTeacher({...newTeacher, task: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
            <select value={newTeacher.subject} onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }}>
              <option value="Math">Math</option>
              <option value="English">English</option>
              <option value="Code">Code</option>
              <option value="Science">Science</option>
            </select>
            <input type="text" placeholder="Custom Image URL (Optional)" value={newTeacher.imgUrl} onChange={e => setNewTeacher({...newTeacher, imgUrl: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
            <button onClick={handleAddAssignment} disabled={isAddTeacherDisabled} style={{ padding: '8px 15px', backgroundColor: isAddTeacherDisabled ? '#ccc' : '#337ab7', color: 'white', border: 'none', cursor: 'pointer' }}>Inject Ticket</button>
          </div>

          <div style={{ flex: 1, padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
            <h3>Buy New AI Machine</h3>
            <input type="text" placeholder="AI Name (e.g. RoboTutor)" value={newAI.name} onChange={e => setNewAI({...newAI, name: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
            <select value={newAI.handles} onChange={e => setNewAI({...newAI, handles: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }}>
              <option value="Math">Math</option>
              <option value="English">English</option>
              <option value="Code">Code</option>
              <option value="Science">Science</option>
            </select>
            <input type="text" placeholder="Custom Image URL (Optional)" value={newAI.imgUrl} onChange={e => setNewAI({...newAI, imgUrl: e.target.value})} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
            <button onClick={handleAddAI} disabled={isAddAIDisabled} style={{ padding: '8px 15px', backgroundColor: isAddAIDisabled ? '#ccc' : '#337ab7', color: 'white', border: 'none', cursor: 'pointer' }}>Install Machine</button>
          </div>

        </div>
      </div>
      
      {/* Reset Area */}
      <hr style={{ margin: '30px 0', borderColor: '#ccc' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setGameState(INITIAL_STATE)} style={{ padding: '10px 15px', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⚠️ Wipe Save & Restart Game
        </button>
      </div>

    </div>
  );
}