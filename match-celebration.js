  // Treat each 2-player mission as one match and celebrate the match winner.
  let lastMatchResult=null;

  function ensureMissionScores(){
    state.players.forEach(p=>{
      if(!Number.isFinite(Number(p.missionScore))) p.missionScore=0;
    });
  }

  const baseSaveProgressForMatches=saveProgress;
  saveProgress=function(){
    ensureMissionScores();
    const result=baseSaveProgressForMatches.apply(this,arguments);
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      const saved=raw?JSON.parse(raw):null;
      if(saved&&Array.isArray(saved.players)){
        saved.players.forEach((sp,i)=>{sp.missionScore=Number(state.players[i]?.missionScore)||0;});
        localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));
      }
    }catch(e){}
    return result;
  };

  const baseLoadProgressForMatches=loadProgress;
  loadProgress=function(){
    const result=baseLoadProgressForMatches.apply(this,arguments);
    ensureMissionScores();
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      const saved=raw?JSON.parse(raw):null;
      if(saved&&Array.isArray(saved.players)){
        saved.players.forEach((sp,i)=>{
          if(state.players[i]) state.players[i].missionScore=Math.max(0,Number(sp.missionScore)||0);
        });
      }
    }catch(e){}
    return result;
  };

  const baseSolveRoundForMatches=solveRound;
  solveRound=function(){
    ensureMissionScores();
    const idx=state.currentPlayer;
    const player=state.players[idx];
    const before=Number(player?.score)||0;
    const result=baseSolveRoundForMatches.apply(this,arguments);
    if(state.mode===2&&player){
      const gained=Math.max(0,(Number(player.score)||0)-before);
      player.missionScore=(Number(player.missionScore)||0)+gained;
      saveProgress();
    }
    return result;
  };

  const baseCompleteTwoPlayerMissionForMatches=completeTwoPlayerMission;
  completeTwoPlayerMission=function(){
    if(state.mode!==2) return baseCompleteTwoPlayerMissionForMatches.apply(this,arguments);
    ensureMissionScores();
    const mission=Math.max(1,Math.min(state.totalMissions,Number(state.players[0]?.mission)||1));
    const a=state.players[0],b=state.players[1];
    const aScore=Number(a.missionScore)||0;
    const bScore=Number(b.missionScore)||0;
    lastMatchResult={
      mission,
      aName:a.name||'Player 1',bName:b.name||'Player 2',
      aScore,bScore,
      winner:aScore===bScore?'tie':(aScore>bScore?0:1)
    };

    const result=baseCompleteTwoPlayerMissionForMatches.apply(this,arguments);
    state.players.forEach(p=>{p.missionScore=0;});
    saveProgress();
    return result;
  };

  const baseShowMissionDanceForMatches=showMissionDance;
  showMissionDance=function(mission,preview=false){
    const result=baseShowMissionDanceForMatches.apply(this,arguments);
    const m=Math.max(1,Math.min(state.totalMissions,Number(mission)||1));
    if(state.mode===2&&!preview&&lastMatchResult&&lastMatchResult.mission===m){
      const r=lastMatchResult;
      $('#danceBadge').textContent=`Match ${m} Complete`;
      if(r.winner==='tie'){
        $('#danceTitle').textContent=`🤝 Match ${m} is a tie!`;
        $('#danceNote').textContent=`Well played, ${r.aName} and ${r.bName}! You both scored ${r.aScore} points in this match.`;
      }else{
        const winnerName=r.winner===0?r.aName:r.bName;
        const winnerScore=r.winner===0?r.aScore:r.bScore;
        const otherName=r.winner===0?r.bName:r.aName;
        const otherScore=r.winner===0?r.bScore:r.aScore;
        $('#danceTitle').textContent=`🏆 Congratulations, ${winnerName}!`;
        $('#danceNote').textContent=`${winnerName} wins Match ${m}, ${winnerScore}–${otherScore}. Great effort, ${otherName}!`;
      }
    }
    return result;
  };

  const baseUpdateStatsForMatches=updateStats;
  updateStats=function(){
    const result=baseUpdateStatsForMatches.apply(this,arguments);
    if(state.mode===2){
      const p=state.players[state.currentPlayer]||state.players[0];
      const chip=$('#missionChip');
      if(chip) chip.textContent=`🏆 Match ${p.mission} • 5 words each`;
      const roadmapName=$('#roadmapName');
      if(roadmapName) roadmapName.textContent='Match Stars';
    }
    return result;
  };

  const baseShowWinnerForMatches=showWinner;
  showWinner=function(){
    const result=baseShowWinnerForMatches.apply(this,arguments);
    if(state.mode===2){
      const summary=$('#winnerSummary');
      if(summary) summary.innerHTML=summary.innerHTML.replace(/missions/g,'matches');
    }
    return result;
  };

  const matchRules=document.getElementById('rulesBox');
  if(matchRules&&!matchRules.dataset.matchRuleAdded){
    matchRules.dataset.matchRuleAdded='1';
    matchRules.innerHTML += '<br><b>2-player matches:</b> each mission is one match. After both pupils complete 5 words, the player with the higher score for that mission is congratulated as the match winner. A tie celebrates both players.';
  }
