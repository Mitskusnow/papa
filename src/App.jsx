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
const NAMES = ["Mr. Smith", "Mrs. Jones", "Coach Steve", "Sarah", "Dr. Brown", "Ms. Frizzle"];
const CLOSER_NAMES = ["🚨 PRINCIPAL BELDING", "😈 CRITIC JOJO", "🕵️‍♂️ THE SCHOOL INSPECTOR"];

// Now accepts customPool to mix in your user-created characters!
const generateRandomCustomer = (index, isCloser = false, customPool = []) => {
  // 50% chance to spawn a custom customer if any exist (and it isn't a Closer)
  if (!isCloser && customPool.length > 0 && Math.random() > 0.5) {
    const custom = customPool[Math.floor(Math.random() * customPool.length)];
    return {
      id: Date.now() + index + Math.random(), 
      teacher: custom.name,
      subject: custom.subject,
      task: custom.task,
      patience: 100, 
      isCloser: false,
      img: custom.customImg && custom.customImg.trim() !== "" 
        ? custom.customImg.trim() 
        : DEFAULT_TEACHER_IMG + custom.name.replace(/\s/g, '') + index
    };
  }

  // Default Random Generation
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const taskList = TASKS[subject];
  const task = taskList[Math.floor(Math.random() * taskList.length)];
  const name = isCloser 
    ? CLOSER_NAMES[Math.floor(Math.random() * CLOSER_NAMES.length)]
    : NAMES[Math.floor(Math.random() * NAMES.length)];
  
  return {
    id: Date.now() + index + Math.random(), 
    teacher: name,
    subject: subject,
    task: task,
    patience: 100, 
    isCloser: isCloser,
    img: DEFAULT_TEACHER_IMG + name.replace(/\s/g, '') + index
  };
};

const INITIAL_STATE = {
  score: 0,
  tokens: 15,
  day: 1,
  isDayActive: false,
  showSummary: false,
  combo: 0,
  customerQueue: [],
  assignments: [],
  completed: [],
  customPool: [], // Stores blueprints of all your created customers
  upgrades: {
    tokenCap: 0,       
    tipMultiplier: 0,  
    hintScanner: false,
    processingSpeed: 0 
  },
  stats: {
    dailyTips: 0,
    dailyPerfect: 0,
    dailyFlops: 0
  },
  aiTools: [
    { id: "ai1", name: "MathSolver 3000", handles: "Math", img: DEFAULT_AI_IMG + "Math" },
    { id: "ai2", name: "EssayBot Pro", handles: "English", img: DEFAULT_AI_IMG + "Essay" },
    { id: "ai3", name: "CodeGenie", handles: "Code", img: DEFAULT_AI_IMG + "Code" },
    { id: "ai4", name: "ScienceLab AI", handles: "Science", img: DEFAULT_AI_IMG + "Science" }
  ]
};

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [selectedAI, setSelectedAI] = useState("");
  const [message, setMessage] = useState("Welcome back to the Prompt-eria!");

  // Timers & Delays
  const [processing, setProcessing] = useState(null); 

  // Mini-Game System State
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [miniGamePrize, setMiniGamePrize] = useState(null);
  const [currentWheelOption, setCurrentWheelOption] = useState("❓ SPIN ME");

  // Sandbox Form State
  const [newTeacher, setNewTeacher] = useState({ name: "", subject: "Math", task: "", customImg: "" });

  const miniGamePrizes = [
    { text: "💰 Extra $40 Cash Payout!", action: (prev) => ({ ...prev, score: prev.score + 40 }) },
    { text: "🔋 +8 Ultra Core Tokens!", action: (prev) => ({ ...prev, tokens: prev.tokens + 8 }) },
    { text: "🔥 Instant +3 Combo Streak!", action: (prev) => ({ ...prev, combo: prev.combo + 3 }) },
    { text: "💰 JackPot! Extra $75!", action: (prev) => ({ ...prev, score: prev.score + 75 }) },
    { text: "🔋 Mini Stock Up: +3 Tokens", action: (prev) => ({ ...prev, tokens: prev.tokens + 3 }) }
  ];

  // --- Upgrade Costs ---
  const upgradeCosts = {
    tokenCap: [100, 250, 500][gameState.upgrades.tokenCap] || null,
    tipMultiplier: [150, 300, 600][gameState.upgrades.tipMultiplier] || null,
    hintScanner: gameState.upgrades.hintScanner ? null : 200,
    processingSpeed: [120, 280, 550][gameState.upgrades.processingSpeed] || null 
  };

  // --- Day Management ---
  const handleStartDay = () => {
    const numCustomers = Math.min(3 + gameState.day, 10); 
    
    // Generate new queue, passing in our custom pool to spawn familiar faces
    const newQueue = Array.from({ length: numCustomers }).map((_, i) => {
      const isLast = i === numCustomers - 1;
      return generateRandomCustomer(i, isLast, gameState.customPool);
    });

    const tokenStipend = 5 + (gameState.upgrades.tokenCap * 5);

    setGameState(prev => ({
      ...prev,
      isDayActive: true,
      showSummary: false,
      customerQueue: newQueue,
      assignments: [],
      completed: [],
      combo: 0,
      tokens: prev.tokens + tokenStipend,
      stats: { dailyTips: 0, dailyPerfect: 0, dailyFlops: 0 }
    }));
    setProcessing(null);
    setShowMiniGame(false);
    setMiniGamePrize(null);
    setMessage(`☀️ Day ${gameState.day} active! Upgrade Server Cores to outrun the 7s timer!`);
  };

  const handleEndDayTrigger = () => {
    setGameState(prev => ({ ...prev, showSummary: true, isDayActive: false }));
    setMessage("🔔 Shift complete! Review metrics before Foodini's mini-game!");
  };

  const triggerMiniGameScreen = () => {
    setGameState(prev => ({ ...prev, showSummary: false }));
    setShowMiniGame(true);
    setCurrentWheelOption("❓ SPIN ME");
  };

  const handleNextDay = () => {
    setGameState(prev => ({ ...prev, day: prev.day + 1 }));
    setShowMiniGame(false);
    setMessage(`Ready for Day ${gameState.day + 1}? Maximize shop upgrades!`);
  };

  // --- Foodini Spin Wheel Animation Logic ---
  const handleSpinWheel = () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setMiniGamePrize(null);

    let intervalsRun = 0;
    const interval = setInterval(() => {
      const randomPrize = miniGamePrizes[Math.floor(Math.random() * miniGamePrizes.length)];
      setCurrentWheelOption(randomPrize.text);
      intervalsRun++;

      if (intervalsRun > 12) {
        clearInterval(interval);
        const finalPrize = miniGamePrizes[Math.floor(Math.random() * miniGamePrizes.length)];
        setCurrentWheelOption(finalPrize.text);
        setMiniGamePrize(finalPrize.text);
        setWheelSpinning(false);

        setGameState(prev => finalPrize.action(prev));
      }
    }, 150);
  };

  // --- Customer Patience Draining Timer Loop ---
  useEffect(() => {
    let loop;
    if (gameState.isDayActive) {
      loop = setInterval(() => {
        setGameState(prev => {
          const updatedAssignments = prev.assignments.map(a => ({
            ...a,
            patience: Math.max(0, a.patience - (a.isCloser ? 4 : 2))
          }));

          const walkedOut = updatedAssignments.filter(a => a.patience <= 0);
          const remainingAssignments = updatedAssignments.filter(a => a.patience > 0);

          let currentScore = prev.score;
          let currentCompleted = [...prev.completed];
          let feedMessage = prev.message;
          let extraFlops = 0;

          if (walkedOut.length > 0) {
            walkedOut.forEach(w => {
              const loss = w.isCloser ? 50 : 25; 
              currentScore -= loss; 
              extraFlops += 1;
              currentCompleted = [{ ...w, grade: 0, aiUsed: "Walked Out", payout: -loss }, ...currentCompleted];
            });
            feedMessage = `😡 ${walkedOut[0].teacher} ran out of patience! (-$${walkedOut[0].isCloser ? '50 Closer' : '25'} Penalty)`;
          }

          let finalQueue = [...prev.customerQueue];
          let finalAssignments = [...remainingAssignments];

          if (finalQueue.length > 0 && finalAssignments.length < 4 && Math.random() > 0.5) {
            const nextInLine = finalQueue[0];
            finalQueue = finalQueue.slice(1);
            finalAssignments.push(nextInLine);
            feedMessage = nextInLine.isCloser 
              ? `⚠️ ALERT: Closer ${nextInLine.teacher} has arrived at the counter!`
              : `🛎️ Ding! ${nextInLine.teacher} lined up at the counter.`;
          }

          return {
            ...prev,
            customerQueue: finalQueue,
            assignments: finalAssignments,
            score: currentScore,
            completed: currentCompleted,
            message: walkedOut.length > 0 ? feedMessage : prev.message,
            combo: walkedOut.length > 0 ? 0 : prev.combo, 
            stats: { ...prev.stats, dailyFlops: prev.stats.dailyFlops + extraFlops }
          };
        });
      }, 1000);
    }
    return () => clearInterval(loop);
  }, [gameState.isDayActive]);

  // --- Precise AI Processing Loop (Updates every 100ms) ---
  useEffect(() => {
    let procTimer;
    if (processing) {
      procTimer = setInterval(() => {
        setProcessing(prev => {
          if (!prev) return null;
          const nextElapsed = prev.elapsed + 0.1;
          if (nextElapsed >= prev.duration) {
            clearInterval(procTimer);
            return { ...prev, elapsed: prev.duration };
          }
          return { ...prev, elapsed: nextElapsed };
        });
      }, 100);
    }
    return () => clearInterval(procTimer);
  }, [processing]);

  useEffect(() => {
    if (processing && processing.elapsed >= processing.duration) {
      finalizeGradingLogic(processing.ticketId, processing.aiId);
      setProcessing(null);
    }
  }, [processing]);

  // --- Shop Upgrade Purchases ---
  const buyUpgrade = (type) => {
    const cost = upgradeCosts[type];
    if (cost !== null && gameState.score >= cost) {
      setGameState(prev => ({
        ...prev,
        score: prev.score - cost,
        upgrades: { ...prev.upgrades, [type]: type === 'hintScanner' ? true : prev.upgrades[type] + 1 }
      }));
      setMessage("🛒 Shop hardware upgraded successfully!");
    } else {
      setMessage("❌ Insufficient store revenue!");
    }
  };

  const handleProcessWork = () => {
    if (gameState.tokens <= 0) {
      setMessage("❌ Out of tokens!");
      return;
    }
    const currentDuration = [7, 5, 3, 1][gameState.upgrades.processingSpeed] || 7;
    
    setProcessing({ ticketId: activeTicketId, aiId: selectedAI, duration: currentDuration, elapsed: 0 });
    setMessage("⏳ Prompt engines are humming... Writing matrices!");
    setActiveTicketId("");
    setSelectedAI("");
  };

  const finalizeGradingLogic = (ticketId, aiId) => {
    let assignment;
    setGameState(prev => {
      assignment = prev.assignments.find(a => a.id === ticketId);
      if (!assignment) return prev; 

      const aiTool = prev.aiTools.find(ai => ai.id === aiId);
      let grade = 0;
      let basePayout = 0;
      let feedback = "";
      let isPerfect = false;

      if (assignment.subject === aiTool.handles) {
        grade = 100;
        isPerfect = true;
        const upgradeBonus = 1 + (prev.upgrades.tipMultiplier * 0.50);
        const patienceFactor = assignment.patience / 100;
        const comboBonus = prev.combo * 10;
        
        basePayout = Math.round((50 * upgradeBonus * patienceFactor) + comboBonus);
        if (assignment.isCloser) basePayout *= 2; 
        
        feedback = `${assignment.isCloser ? '🔥 Closer Match!' : 'Perfect Match!'} Patience: ${assignment.patience}%`;
      } else {
        grade = 0;
        basePayout = assignment.isCloser ? -40 : -20;
        feedback = `Mismatched Core Failure with ${aiTool.name}!`;
      }

      const nextCombo = isPerfect ? prev.combo + 1 : 0;
      return {
        ...prev,
        score: prev.score + basePayout,
        tokens: prev.tokens - 1,
        combo: nextCombo,
        assignments: prev.assignments.filter(a => a.id !== ticketId),
        completed: [{ ...assignment, grade, aiUsed: aiTool.name, payout: basePayout }, ...prev.completed],
        message: `📝 Ticket Closed: ${grade}% Grade! ${feedback}`,
        stats: {
          dailyTips: prev.stats.dailyTips + (isPerfect ? basePayout : 0),
          dailyPerfect: prev.stats.dailyPerfect + (isPerfect ? 1 : 0),
          dailyFlops: prev.stats.dailyFlops + (!isPerfect ? 1 : 0)
        }
      };
    });

    if (!assignment) {
      setMessage("💨 Disaster! Customer walked out before printing finished!");
      setGameState(prev => ({ ...prev, tokens: Math.max(0, prev.tokens - 1) }));
    }
  };

  // Saves the custom teacher to the roster so they return in future days
  const handleAddAssignment = () => {
    const newId = Date.now();
    const trackingImg = newTeacher.customImg.trim() !== "" 
      ? newTeacher.customImg.trim() 
      : DEFAULT_TEACHER_IMG + newTeacher.name;

    const newCustomerInstance = { 
      id: newId, 
      teacher: newTeacher.name, 
      subject: newTeacher.subject, 
      task: newTeacher.task, 
      patience: 100, 
      isCloser: false, 
      img: trackingImg 
    };

    const newCustomTemplate = {
      name: newTeacher.name,
      subject: newTeacher.subject,
      task: newTeacher.task,
      customImg: newTeacher.customImg
    };

    setGameState(prev => ({
      ...prev,
      assignments: [...prev.assignments, newCustomerInstance],
      customPool: [...prev.customPool, newCustomTemplate] // Saves to memory pool
    }));
    
    setNewTeacher({ name: "", subject: "Math", task: "", customImg: "" });
  };

  const activeTicket = gameState.assignments.find(a => a.id === activeTicketId);
  const isProcessDisabled = !activeTicketId || !selectedAI || gameState.tokens <= 0 || processing !== null;
  const isDayFinished = gameState.isDayActive && gameState.customerQueue.length === 0 && gameState.assignments.length === 0 && processing === null;
  
  const secondsLeft = processing ? Math.max(0, processing.duration - processing.elapsed).toFixed(1) : "0.0";
  const progressPercent = processing ? (processing.elapsed / processing.duration) * 100 : 0;

  return (
    <div style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fcf8f2', minHeight: '100vh' }}>
      
      <style>{`
        @keyframes ui-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinning-loader { display: inline-block; animation: ui-spin 1.5s linear infinite; }
        @keyframes neon-pulse { 0% { border-color: #ef5350; box-shadow: 0 0 5px #ef5350; } 50% { border-color: #9c27b0; box-shadow: 0 0 15px #9c27b0; } 100% { border-color: #ef5350; box-shadow: 0 0 5px #ef5350; } }
        .closer-card-active { animation: neon-pulse 1.5s infinite; }
      `}</style>

      {/* Title Header */}
      <div style={{ backgroundColor: '#e17055', padding: '15px', border: '4px solid #2d3436', borderRadius: '16px', marginBottom: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', textShadow: '2px 2px 0px #000' }}>🍕 Papa's Prompt-eria!</h1>
          <p style={{ margin: '5px 0 0 0', color: '#ffeaa7' }}>Boost your computing cores to slash prompt delivery pipelines below 7 seconds!</p>
        </div>
        {gameState.combo > 1 && (
          <div style={{ backgroundColor: '#fdcb6e', color: '#2d3436', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', border: '2px solid #000' }}>
            🔥 STREAK COMBO: {gameState.combo}
          </div>
        )}
      </div>

      {/* HUD Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#2d3436', color: 'white', padding: '15px 25px', borderRadius: '12px', fontSize: '1.2rem', marginBottom: '20px', borderBottom: '5px solid #000' }}>
        <span><strong>Day Shift:</strong> {gameState.day}</span>
        <span style={{ color: '#fdcb6e' }}>✨ <strong>{message}</strong></span>
        <span><strong>Vault:</strong> <span style={{color: '#55efc4'}}>${gameState.score}</span> | 🔋 <strong>Tokens:</strong> {gameState.tokens}</span>
      </div>

      {/* --- BETWEEN DAYS MENU / UPGRADE STOREFRONT --- */}
      {!gameState.isDayActive && !gameState.showSummary && !showMiniGame && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, backgroundColor: '#dfe6e9', border: '4px solid #b2bec3', borderRadius: '16px', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2>Store Shutters Down</h2>
            <button onClick={handleStartDay} style={{ alignSelf: 'center', padding: '15px 40px', fontSize: '22px', backgroundColor: '#10ac84', color: 'white', border: '3px solid #000', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 5px 0 #0f8b69' }}>
              ▶️ OPEN SHOP (DAY {gameState.day})
            </button>
          </div>

          <div style={{ flex: 1.5, backgroundColor: '#ffeaa7', border: '4px solid #fdcb6e', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ marginTop: 0, color: '#d35400' }}>🛒 Upgrades Dashboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '2px solid #fdcb6e' }}>
                <div>
                  <strong>⚡ Quantum Server Cores</strong> (Lvl {gameState.upgrades.processingSpeed}/3)
                  <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Speeds processing time: Lvl0 (15s) ➔ Lvl1 (11s) ➔ Lvl2 (7s) ➔ Lvl3 (4s)</div>
                </div>
                <button onClick={() => buyUpgrade('processingSpeed')} disabled={upgradeCosts.processingSpeed === null} style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: upgradeCosts.processingSpeed ? '#10ac84' : '#b2bec3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {upgradeCosts.processingSpeed ? `Buy: $${upgradeCosts.processingSpeed}` : 'MAXED'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '2px solid #fdcb6e' }}>
                <div><strong>🔋 Token Capacitor</strong> (Lvl {gameState.upgrades.tokenCap}/3)</div>
                <button onClick={() => buyUpgrade('tokenCap')} disabled={upgradeCosts.tokenCap === null} style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: upgradeCosts.tokenCap ? '#10ac84' : '#b2bec3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {upgradeCosts.tokenCap ? `Buy: $${upgradeCosts.tokenCap}` : 'MAXED'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '2px solid #fdcb6e' }}>
                <div><strong>💵 Golden Prompts</strong> (Lvl {gameState.upgrades.tipMultiplier}/3)</div>
                <button onClick={() => buyUpgrade('tipMultiplier')} disabled={upgradeCosts.tipMultiplier === null} style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: upgradeCosts.tipMultiplier ? '#10ac84' : '#b2bec3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {upgradeCosts.tipMultiplier ? `Buy: $${upgradeCosts.tipMultiplier}` : 'MAXED'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '2px solid #fdcb6e' }}>
                <div><strong>✨ AI Hint Scanner Module</strong></div>
                <button onClick={() => buyUpgrade('hintScanner')} disabled={upgradeCosts.hintScanner === null} style={{ padding: '8px 12px', fontWeight: 'bold', backgroundColor: upgradeCosts.hintScanner ? '#10ac84' : '#b2bec3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {upgradeCosts.hintScanner ? `Buy: $${upgradeCosts.hintScanner}` : 'OWNED'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- END OF DAY SHIFT REPORT --- */}
      {gameState.showSummary && (
        <div style={{ backgroundColor: '#fff', border: '5px solid #000', borderRadius: '16px', padding: '30px', marginBottom: '20px', textAlign: 'center', boxShadow: '6px 6px 0px #ccc' }}>
          <h2 style={{ color: '#10ac84', fontSize: '2rem', margin: '0 0 10px 0' }}>🏁 Shift Complete Summary</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', margin: '25px 0' }}>
            <div style={{ backgroundColor: '#e3faf1', padding: '15px 25px', borderRadius: '12px', border: '2px solid #10ac84' }}><strong>{gameState.stats.dailyPerfect}</strong> Matches Delivered</div>
            <div style={{ backgroundColor: '#ffe3e3', padding: '15px 25px', borderRadius: '12px', border: '2px solid #ff7675' }}><strong>{gameState.stats.dailyFlops}</strong> Failures/Walkouts</div>
            <div style={{ backgroundColor: '#fff9db', padding: '15px 25px', borderRadius: '12px', border: '2px solid #f1c40f' }}><strong>+${gameState.stats.dailyTips}</strong> Tips Made</div>
          </div>
          <button onClick={triggerMiniGameScreen} style={{ padding: '12px 35px', fontSize: '18px', backgroundColor: '#9b59b6', color: 'white', border: '3px solid #000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 0 #7d3c98' }}>
            🎪 PLAY FOODINI'S PRIZE WHEEL MINI-GAME
          </button>
        </div>
      )}

      {/* --- FOODINI'S INTERMISSION MINI-GAME VIEW --- */}
      {showMiniGame && (
        <div style={{ backgroundColor: '#2c3e50', border: '6px solid #f1c40f', borderRadius: '16px', padding: '30px', marginBottom: '20px', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ color: '#f1c40f', margin: '0 0 5px 0', fontSize: '2rem' }}>🎪 Foodini's Intermission Wheels</h2>
          <p style={{ color: '#bdc3c7' }}>Spin the rapid configuration matrix wheel to score free hardware parts!</p>
          
          <div style={{ width: '320px', backgroundColor: '#ecf0f1', color: '#2c3e50', padding: '35px 20px', margin: '20px auto', borderRadius: '50%', border: '8px dashed #e74c3c', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
            <div style={{ transform: wheelSpinning ? 'scale(1.05)' : 'none', transition: 'transform 0.1s' }}>
              {currentWheelOption}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px' }}>
            <button onClick={handleSpinWheel} disabled={wheelSpinning || miniGamePrize !== null} style={{ padding: '12px 30px', fontSize: '18px', backgroundColor: (wheelSpinning || miniGamePrize) ? '#7f8c8d' : '#e74c3c', color: 'white', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              🎰 SPIN WHEEL
            </button>
            {miniGamePrize && (
              <button onClick={handleNextDay} style={{ padding: '12px 30px', fontSize: '18px', backgroundColor: '#2ecc71', color: 'white', border: '2px solid #000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                Continue to Store Setup 🧹
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- LIVE WORK STATIONS SCREEN --- */}
      {gameState.isDayActive && (
        <>
          {/* STATION 1: THE TICKET RAIL WITH GAUGE & CLOSER ALERTS */}
          <div style={{ backgroundColor: '#dfe6e9', padding: '20px', borderRadius: '12px', border: '3px solid #636e72', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>📎 Ticket Rail Counter</h2>
              <span style={{ fontWeight: 'bold', backgroundColor: '#b2bec3', padding: '5px 12px', borderRadius: '20px' }}>
                Queue Waiting in Line: {gameState.customerQueue.length} 🧍
              </span>
            </div>
            
            {gameState.assignments.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#666' }}>Counter is clear. Waiting for customers to approach...</p>
            ) : (
              <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                {gameState.assignments.map(a => {
                  const barColor = a.patience > 55 ? '#10ac84' : a.patience > 25 ? '#f1c40f' : '#d63031';
                  const isThisTicketCompiling = processing && processing.ticketId === a.id;

                  return (
                    <div 
                      key={a.id} 
                      onClick={() => processing === null && setActiveTicketId(a.id)}
                      className={a.isCloser ? 'closer-card-active' : ''}
                      style={{ 
                        minWidth: '240px', 
                        backgroundColor: activeTicketId === a.id ? '#fff9db' : '#fff', 
                        border: activeTicketId === a.id ? '4px solid #e17055' : a.isCloser ? '4px solid #9c27b0' : '2px dashed #b2bec3', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        cursor: processing !== null ? 'not-allowed' : 'pointer', 
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                      
                      {/* Side-by-side patience meter */}
                      <div style={{ width: '14px', height: '110px', backgroundColor: '#eee', borderRadius: '6px', border: '1px solid #ccc', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ width: '100%', height: `${a.patience}%`, backgroundColor: barColor, transition: 'height 1s linear' }} />
                      </div>

                      {/* Main Ticket Layout */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {a.isCloser && <div style={{ fontSize: '0.7rem', backgroundColor: '#9c27b0', color: '#fff', borderRadius: '4px', padding: '2px 4px', fontWeight: 'bold', marginBottom: '4px' }}>⚠️ CLOSER (2X SPEED)</div>}
                        
                        <img 
                          src={a.img} 
                          alt={a.teacher} 
                          style={{ 
                            width: '55px', 
                            height: '55px', 
                            borderRadius: '50%', 
                            backgroundColor: '#f1f2f6',
                            objectFit: 'cover'
                          }} 
                        />
                        
                        <h4 style={{ margin: '4px 0 2px 0', fontSize: '0.95rem' }}>{a.teacher}</h4>
                        <span style={{ display: 'inline-block', backgroundColor: '#74b9ff', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{a.subject}</span>
                        <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', fontSize: '0.75rem', color: '#555' }}>"{a.task}"</p>
                      </div>

                      {/* Compilation Overlay Countdown */}
                      {isThisTicketCompiling && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                          <span className="spinning-loader" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>⚙️</span>
                          <strong style={{ color: '#10ac84', fontSize: '0.85rem' }}>Compiling AI...</strong>
                          <span style={{ fontSize: '0.8rem', backgroundColor: '#10ac84', color: '#fff', padding: '2px 8px', borderRadius: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                            {secondsLeft}s left
                          </span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

            {isDayFinished && (
              <div style={{ marginTop: '15px', textAlign: 'right' }}>
                <button onClick={handleEndDayTrigger} style={{ padding: '10px 20px', backgroundColor: '#ff7675', color: 'white', border: '2px solid #000', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  🛎️ Clock Out Shift
                </button>
              </div>
            )}
          </div>

          {/* STATION 2 & RECIEPT LISTING SPLIT */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            
            {/* PROMPT CONTROL HOUSING */}
            <div style={{ flex: 1.3, backgroundColor: '#e3faf1', padding: '20px', borderRadius: '12px', border: '3px solid #10ac84' }}>
              <h2 style={{ marginTop: 0, color: '#10ac84' }}>💻 Prompt Control Dashboard</h2>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Selected Target Ticket:</label>
                <input type="text" readOnly value={activeTicket ? `${activeTicket.teacher} [${activeTicket.subject}]` : "Click a customer panel above!"} style={{ width: '100%', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Select Core Engine Unit Router:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {gameState.aiTools.map(ai => {
                    const isHinted = gameState.upgrades.hintScanner && activeTicket && activeTicket.subject === ai.handles;
                    return (
                      <div 
                        key={ai.id} 
                        onClick={() => processing === null && setSelectedAI(ai.id)}
                        style={{
                          border: selectedAI === ai.id ? '4px solid #10ac84' : isHinted ? '4px solid #f1c40f' : '2px solid #2d3436',
                          boxShadow: isHinted ? '0 0 10px #f1c40f' : 'none',
                          backgroundColor: selectedAI === ai.id ? '#fff' : '#636e72',
                          color: selectedAI === ai.id ? '#000' : '#fff',
                          padding: '10px', borderRadius: '8px', cursor: processing !== null ? 'not-allowed' : 'pointer', textAlign: 'center', width: '110px'
                        }}>
                        <img src={ai.img} alt={ai.name} style={{ width: '45px', height: '45px', backgroundColor: '#b2bec3', borderRadius: '6px' }} />
                        <p style={{ margin: '5px 0 2px 0', fontSize: '0.8rem', fontWeight: 'bold' }}>{ai.name}</p>
                        <small>({ai.handles})</small>
                      </div>
                    );
                  })}
                </div>
              </div>

              {processing ? (
                <div style={{ backgroundColor: '#fff', border: '2px solid #10ac84', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#2d3436' }}>⚙️ Compiling Active Engine Ticket ({secondsLeft} Seconds Left)</div>
                  <div style={{ width: '100%', backgroundColor: '#eee', height: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, backgroundColor: '#10ac84', height: '100%', transition: 'width 0.1s linear' }} />
                  </div>
                </div>
              ) : (
                <button onClick={handleProcessWork} disabled={isProcessDisabled} style={{ width: '100%', padding: '14px', backgroundColor: isProcessDisabled ? '#b2bec3' : '#10ac84', color: 'white', border: 'none', borderRadius: '8px', cursor: isProcessDisabled ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: isProcessDisabled ? 'none' : '0 4px 0 #0f8b69' }}>
                  {isProcessDisabled ? "Select parameters to activate terminals" : "🚀 EXECUTE GENERATION SEQUENCE"}
                </button>
              )}
            </div>

            {/* LIVE RECEIPTS COUNTER LOG FEED */}
            <div style={{ flex: 1, backgroundColor: '#fff5f5', padding: '20px', borderRadius: '12px', border: '3px solid #ff7675' }}>
              <h2 style={{ marginTop: 0, color: '#ff7675' }}>💯 Shifting History Logs</h2>
              {gameState.completed.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No tickets routed yet this morning.</p>
              ) : (
                <div style={{ maxHeight: '290px', overflowY: 'auto' }}>
                  {gameState.completed.map((c, idx) => (
                    <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #ffe3e3', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{c.teacher}</strong> {c.isCloser && <span style={{color:'#9c27b0', fontSize:'0.7rem', fontWeight:'bold'}}>[CLOSER]</span>}
                        <div><small>"{c.task}"</small></div>
                        <div style={{ fontWeight: 'bold', color: c.grade === 100 ? '#10ac84' : '#ff7675' }}>
                          Result: {c.grade === 100 ? `Payout (+$${c.payout})` : `Failed ($${c.payout})`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* --- BOX 3: EXTRA SANDBOX OVERRIDES CONTROLS --- */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '3px solid #0984e3', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, color: '#0984e3' }}>🏢 Sandbox Override Panel</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, padding: '12px', backgroundColor: '#f1f2f6', borderRadius: '8px' }}>
            <h4>Force Inject Customer Ticket & Save Blueprint to Memory Pool</h4>
            <input type="text" placeholder="Teacher Name" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="Task Details" value={newTeacher.task} onChange={e => setNewTeacher({...newTeacher, task: e.target.value})} style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            
            <input type="text" placeholder="Custom Image URL (Optional - e.g. https://.../pic.png)" value={newTeacher.customImg} onChange={e => setNewTeacher({...newTeacher, customImg: e.target.value})} style={{ width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            
            <select value={newTeacher.subject} onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})} style={{ width: '100%', marginBottom: '12px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={handleAddAssignment} disabled={!newTeacher.name || !newTeacher.task} style={{ width: '100%', padding: '10px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Instantiate & Save Customer</button>
            <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '10px', textAlign: 'center' }}>Once created, this customer has a 50% chance of returning to your shop in future days!</p>
          </div>
        </div>
      </div>
      
      {/* Wipe save data module area */}
      <hr style={{ margin: '20px 0', borderColor: '#b2bec3' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => { if(window.confirm("Perform complete cache flush factory reset? This will erase custom customers too.")) setGameState(INITIAL_STATE); }} style={{ padding: '8px 15px', backgroundColor: '#d63031', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⚠️ Structural Hardware Factory Wipe
        </button>
      </div>

    </div>
  );
}
