import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Shuffle, AlertCircle, X, Plus, Swords, Shield, Zap, Link, Unlink, Trash2, Settings2, Save } from 'lucide-react';

type Constraint = { id: string; p1: string; p2: string };

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function App() {
  // Initialize state from localStorage if available
  const [teamSize, setTeamSize] = useState<number>(() => {
    const saved = localStorage.getItem('lol-team-size');
    return saved ? JSON.parse(saved) : 5;
  });
  
  const [players, setPlayers] = useState<string[]>(() => {
    const saved = localStorage.getItem('lol-players');
    if (saved) return JSON.parse(saved);
    return Array(teamSize * 2).fill('');
  });
  
  const [sameTeam, setSameTeam] = useState<Constraint[]>(() => {
    const saved = localStorage.getItem('lol-same-team');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [diffTeam, setDiffTeam] = useState<Constraint[]>(() => {
    const saved = localStorage.getItem('lol-diff-team');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [teamBlue, setTeamBlue] = useState<string[]>([]);
  const [teamRed, setTeamRed] = useState<string[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Save to localStorage whenever these states change
  useEffect(() => {
    localStorage.setItem('lol-team-size', JSON.stringify(teamSize));
    localStorage.setItem('lol-players', JSON.stringify(players));
    localStorage.setItem('lol-same-team', JSON.stringify(sameTeam));
    localStorage.setItem('lol-diff-team', JSON.stringify(diffTeam));
  }, [teamSize, players, sameTeam, diffTeam]);

  const handleManualSave = () => {
    localStorage.setItem('lol-team-size', JSON.stringify(teamSize));
    localStorage.setItem('lol-players', JSON.stringify(players));
    localStorage.setItem('lol-same-team', JSON.stringify(sameTeam));
    localStorage.setItem('lol-diff-team', JSON.stringify(diffTeam));
    
    setSaveMessage('저장되었습니다!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
    const totalPlayers = size * 2;
    setPlayers(prev => {
      if (prev.length < totalPlayers) {
        return [...prev, ...Array(totalPlayers - prev.length).fill('')];
      }
      return prev.slice(0, totalPlayers);
    });
    setError(null);
    setTeamBlue([]);
    setTeamRed([]);
  };

  const handleClearPlayers = () => {
    setPlayers(Array(teamSize * 2).fill(''));
    setSameTeam([]);
    setDiffTeam([]);
    setTeamBlue([]);
    setTeamRed([]);
    setError(null);
  };

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
    setError(null);
  };

  const addSameTeamConstraint = () => {
    setSameTeam([...sameTeam, { id: generateId(), p1: '', p2: '' }]);
  };

  const addDiffTeamConstraint = () => {
    setDiffTeam([...diffTeam, { id: generateId(), p1: '', p2: '' }]);
  };

  const updateConstraint = (type: 'same' | 'diff', id: string, field: 'p1' | 'p2', value: string) => {
    const list = type === 'same' ? sameTeam : diffTeam;
    const setList = type === 'same' ? setSameTeam : setDiffTeam;
    
    setList(list.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeConstraint = (type: 'same' | 'diff', id: string) => {
    if (type === 'same') {
      setSameTeam(sameTeam.filter(c => c.id !== id));
    } else {
      setDiffTeam(diffTeam.filter(c => c.id !== id));
    }
  };

  const validPlayerOptions = players.filter(p => p.trim() !== '');

  const handleGenerate = () => {
    setError(null);
    const validPlayers = players.map(p => p.trim()).filter(p => p !== '');
    
    const totalPlayers = teamSize * 2;
    if (validPlayers.length !== totalPlayers) {
      setError(`${totalPlayers}명의 소환사 이름을 모두 입력해주세요.`);
      return;
    }

    const uniquePlayers = new Set(validPlayers);
    if (uniquePlayers.size !== totalPlayers) {
      const nameMap = new Map<string, number[]>();
      players.forEach((p, i) => {
        const name = p.trim();
        if (!name) return;
        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name)!.push(i + 1);
      });

      const duplicateErrors: string[] = [];
      for (const [name, indices] of nameMap.entries()) {
        if (indices.length > 1) {
          duplicateErrors.push(`${indices.join(', ')}번 소환사 '${name}'님이 중복됩니다.`);
        }
      }
      
      if (duplicateErrors.length > 0) {
        setError(duplicateErrors.join('\n') + '\n서로 다른 이름으로 입력해주세요.');
        return;
      }
      
      setError('소환사 이름은 모두 달라야 합니다. (중복 불가)');
      return;
    }

    setIsGenerating(true);
    setTeamBlue([]);
    setTeamRed([]);

    setTimeout(() => {
      const MAX_ATTEMPTS = 10000;
      let found = false;

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const shuffled = [...validPlayers].sort(() => Math.random() - 0.5);
        const t1 = shuffled.slice(0, teamSize);
        const t2 = shuffled.slice(teamSize, totalPlayers);

        let isValid = true;

        for (const c of sameTeam) {
          if (!c.p1 || !c.p2) continue;
          const p1InT1 = t1.includes(c.p1);
          const p2InT1 = t1.includes(c.p2);
          if (p1InT1 !== p2InT1) {
            isValid = false;
            break;
          }
        }

        if (!isValid) continue;

        for (const c of diffTeam) {
          if (!c.p1 || !c.p2) continue;
          const p1InT1 = t1.includes(c.p1);
          const p2InT1 = t1.includes(c.p2);
          if (p1InT1 === p2InT1) {
            isValid = false;
            break;
          }
        }

        if (isValid) {
          setTeamBlue(t1);
          setTeamRed(t2);
          found = true;

          // Log the result
          fetch('/api/log-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              players: validPlayers,
              teamBlue: t1,
              teamRed: t2
            })
          }).catch(err => console.error('Failed to log result:', err));

          break;
        }
      }

      if (!found) {
        setError('조건을 만족하는 팀을 구성할 수 없습니다. 조건이 서로 충돌하는지 확인해주세요.');
      }
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-[#c89b3c]/30">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-[#1e2328] rounded-2xl border border-[#c89b3c]/30 mb-6 shadow-[0_0_30px_rgba(200,155,60,0.1)]"
          >
            <Swords className="w-8 h-8 text-[#c89b3c]" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#c89b3c] to-[#f0e6d2] mb-4"
          >
            {teamSize}v{teamSize} 팀 랜덤 배정
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto mb-6"
          >
            {teamSize * 2}명의 소환사 이름을 입력하고, 원하는 팀 구성 조건을 설정하세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#1e2328] via-[#2a2e33] to-[#1e2328] border border-[#c89b3c]/40 shadow-[0_0_20px_rgba(200,155,60,0.15)]"
          >
            <span className="text-sm font-medium text-slate-400 tracking-wide">Made by</span>
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c89b3c] to-[#f0e6d2]">규성</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Players */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1e2328] rounded-2xl border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#0ac8b9]" />
                  <h2 className="text-xl font-semibold text-slate-100">참가자 명단</h2>
                </div>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {saveMessage && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-[#0ac8b9] font-medium mr-2"
                      >
                        {saveMessage}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="text-xs font-medium px-2.5 py-1 bg-slate-800 rounded-full text-slate-400">
                    {players.filter(p => p.trim() !== '').length} / {teamSize * 2}
                  </span>
                  <button
                    onClick={handleManualSave}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-[#0ac8b9]"
                    title="현재 상태 저장"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearPlayers}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                    title="명단 초기화"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6 p-4 bg-[#0a0a0c] rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">팀 인원 설정</span>
                </div>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(size => (
                    <button
                      key={size}
                      onClick={() => handleTeamSizeChange(size)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        teamSize === size 
                          ? 'bg-[#c89b3c] text-[#0a0a0c] shadow-[0_0_10px_rgba(200,155,60,0.3)]' 
                          : 'bg-[#1e2328] text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {size}v{size}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-slate-500 text-sm font-mono">{index + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerChange(index, e.target.value)}
                      placeholder={`소환사 ${index + 1}`}
                      className="w-full bg-[#0a0a0c] border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-1 focus:ring-[#c89b3c] focus:border-[#c89b3c] block pl-10 p-3 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Constraints & Action */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Same Team Constraints */}
              <div className="bg-[#1e2328] rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Link className="w-5 h-5 text-[#0ac8b9]" />
                    <h2 className="text-lg font-semibold text-slate-100">같은 팀 조건</h2>
                  </div>
                  <button
                    onClick={addSameTeamConstraint}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-[#0ac8b9]"
                    title="조건 추가"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {sameTeam.length === 0 && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-slate-500 text-center py-4">
                        추가된 조건이 없습니다.
                      </motion.p>
                    )}
                    {sameTeam.map((constraint) => (
                      <motion.div
                        key={constraint.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                      >
                        <select
                          value={constraint.p1}
                          onChange={(e) => updateConstraint('same', constraint.id, 'p1', e.target.value)}
                          className="flex-1 bg-[#0a0a0c] border border-slate-800 text-slate-300 text-sm rounded-lg focus:ring-1 focus:ring-[#0ac8b9] focus:border-[#0ac8b9] p-2.5"
                        >
                          <option value="">선택</option>
                          {validPlayerOptions.filter(p => p !== constraint.p2).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <span className="text-slate-400 text-sm font-medium whitespace-nowrap">님과</span>
                        <select
                          value={constraint.p2}
                          onChange={(e) => updateConstraint('same', constraint.id, 'p2', e.target.value)}
                          className="flex-1 bg-[#0a0a0c] border border-slate-800 text-slate-300 text-sm rounded-lg focus:ring-1 focus:ring-[#0ac8b9] focus:border-[#0ac8b9] p-2.5"
                        >
                          <option value="">선택</option>
                          {validPlayerOptions.filter(p => p !== constraint.p1).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <span className="text-[#0ac8b9] text-sm font-bold whitespace-nowrap">같은 팀</span>
                        <button
                          onClick={() => removeConstraint('same', constraint.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Diff Team Constraints */}
              <div className="bg-[#1e2328] rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Unlink className="w-5 h-5 text-[#e84057]" />
                    <h2 className="text-lg font-semibold text-slate-100">다른 팀 조건</h2>
                  </div>
                  <button
                    onClick={addDiffTeamConstraint}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-[#e84057]"
                    title="조건 추가"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {diffTeam.length === 0 && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-slate-500 text-center py-4">
                        추가된 조건이 없습니다.
                      </motion.p>
                    )}
                    {diffTeam.map((constraint) => (
                      <motion.div
                        key={constraint.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                      >
                        <select
                          value={constraint.p1}
                          onChange={(e) => updateConstraint('diff', constraint.id, 'p1', e.target.value)}
                          className="flex-1 bg-[#0a0a0c] border border-slate-800 text-slate-300 text-sm rounded-lg focus:ring-1 focus:ring-[#e84057] focus:border-[#e84057] p-2.5"
                        >
                          <option value="">선택</option>
                          {validPlayerOptions.filter(p => p !== constraint.p2).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <span className="text-slate-400 text-sm font-medium whitespace-nowrap">님과</span>
                        <select
                          value={constraint.p2}
                          onChange={(e) => updateConstraint('diff', constraint.id, 'p2', e.target.value)}
                          className="flex-1 bg-[#0a0a0c] border border-slate-800 text-slate-300 text-sm rounded-lg focus:ring-1 focus:ring-[#e84057] focus:border-[#e84057] p-2.5"
                        >
                          <option value="">선택</option>
                          {validPlayerOptions.filter(p => p !== constraint.p1).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <span className="text-[#e84057] text-sm font-bold whitespace-nowrap">다른 팀</span>
                        <button
                          onClick={() => removeConstraint('diff', constraint.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Generate Button & Error */}
            <div className="flex flex-col items-center gap-4 py-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20 w-full"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm whitespace-pre-wrap">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#c89b3c] to-[#d4af6a] p-[1px] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(200,155,60,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <div className="relative flex items-center justify-center gap-2 rounded-2xl bg-[#1e2328] px-8 py-4 transition-all group-hover:bg-opacity-0">
                  {isGenerating ? (
                    <Shuffle className="w-6 h-6 text-[#c89b3c] group-hover:text-white animate-spin" />
                  ) : (
                    <Swords className="w-6 h-6 text-[#c89b3c] group-hover:text-white" />
                  )}
                  <span className="font-bold text-lg text-[#c89b3c] group-hover:text-white transition-colors">
                    {isGenerating ? '팀 구성 중...' : '팀 랜덤 배정하기'}
                  </span>
                </div>
              </button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {teamBlue.length > 0 && teamRed.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800"
                >
                  {/* Blue Team */}
                  <div className="relative overflow-hidden bg-gradient-to-b from-[#0ac8b9]/10 to-[#1e2328] rounded-2xl border border-[#0ac8b9]/30 p-1">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0ac8b9] to-transparent opacity-50"></div>
                    <div className="bg-[#0a0a0c]/80 backdrop-blur-sm rounded-xl p-6 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-[#0ac8b9] flex items-center gap-2">
                          <Shield className="w-6 h-6" />
                          블루 팀
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {teamBlue.map((player, idx) => (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-lg bg-[#1e2328]/50 border border-slate-800/50"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#0ac8b9]/20 flex items-center justify-center text-[#0ac8b9] font-bold text-sm">
                              {idx + 1}
                            </div>
                            <span className="font-medium text-slate-200">{player}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Red Team */}
                  <div className="relative overflow-hidden bg-gradient-to-b from-[#e84057]/10 to-[#1e2328] rounded-2xl border border-[#e84057]/30 p-1">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e84057] to-transparent opacity-50"></div>
                    <div className="bg-[#0a0a0c]/80 backdrop-blur-sm rounded-xl p-6 h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-[#e84057] flex items-center gap-2">
                          <Zap className="w-6 h-6" />
                          레드 팀
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {teamRed.map((player, idx) => (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-lg bg-[#1e2328]/50 border border-slate-800/50"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#e84057]/20 flex items-center justify-center text-[#e84057] font-bold text-sm">
                              {idx + 1}
                            </div>
                            <span className="font-medium text-slate-200">{player}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
