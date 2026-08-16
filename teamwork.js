  // 2-player collaboration layer: keep the individual match winner while
  // giving both pupils a shared success target and a structured way to help.
  const TEAM_CORRECT_TARGET=8;
  let lastTeamworkResult=null;

  function currentTeamCorrect(){
    if(state.mode!==2) return 0;
    return state.players.reduce((sum,p)=>sum+(Number(p.missionWords)||0),0);
  }

  function ensureTeamGoalUI(){
    let chip=document.getElementById('teamGoalChip');
    const strip=document.querySelector('.missionStrip');
    if(!chip&&strip){
      chip=document.createElement('span');
      chip.id='teamGoalChip';
      chip.className='missionChip teamGoalChip hidden';
      strip.appendChild(chip);
    }
    return chip;
  }

  function updateTeamGoalUI(){
    const chip=ensureTeamGoalUI();
    if(!chip) return;
    const twoPlayer=state.mode===2;
    chip.classList.toggle('hidden',!twoPlayer);
    if(!twoPlayer) return;
    const correct=currentTeamCorrect();
    const reached=correct>=TEAM_CORRECT_TARGET;
    chip.textContent=reached
      ? `🤝⭐ Team Goal ${correct}/10`
      : `🤝 Team Goal ${correct}/${TEAM_CORRECT_TARGET}`;
    chip.title=`Together, spell at least ${TEAM_CORRECT_TARGET} of the 10 match words correctly to earn a Teamwork Star.`;
    chip.classList.toggle('teamGoalReached',reached);
  }

  const baseUpdateStatsForTeamwork=updateStats;
  updateStats=function(){
    const result=baseUpdateStatsForTeamwork.apply(this,arguments);
    updateTeamGoalUI();
    return result;
  };

  // After the first incorrect attempt, invite the waiting player to coach the
  // sound/syllable process without supplying the answer.
  const baseCheckAnswerForTeamwork=checkAnswer;
  checkAnswer=function(){
    const result=baseCheckAnswerForTeamwork.apply(this,arguments);
    if(state.mode===2&&!state.solved&&state.attemptsThisWord===1){
      const partner=state.players[1-state.currentPlayer];
      const partnerName=partner?.name||'Partner';
      feedback.textContent=`${feedback.textContent}  🤝 ${partnerName}, help by saying the sounds or syllables slowly together — do not give the spelling.`;
    }
    updateTeamGoalUI();
    return result;
  };

  const baseCompleteTwoPlayerMissionForTeamwork=completeTwoPlayerMission;
  completeTwoPlayerMission=function(){
    if(state.mode!==2) return baseCompleteTwoPlayerMissionForTeamwork.apply(this,arguments);
    const mission=Math.max(1,Math.min(state.totalMissions,Number(state.players[0]?.mission)||1));
    const correct=currentTeamCorrect();
    lastTeamworkResult={mission,correct,earned:correct>=TEAM_CORRECT_TARGET};
    const result=baseCompleteTwoPlayerMissionForTeamwork.apply(this,arguments);
    updateTeamGoalUI();
    return result;
  };

  // Preserve the individual match-winner announcement from match-celebration.js,
  // then add the shared outcome underneath it.
  const baseShowMissionDanceForTeamwork=showMissionDance;
  showMissionDance=function(mission,preview=false){
    const result=baseShowMissionDanceForTeamwork.apply(this,arguments);
    const m=Math.max(1,Math.min(state.totalMissions,Number(mission)||1));
    if(state.mode===2&&!preview&&lastTeamworkResult&&lastTeamworkResult.mission===m){
      const r=lastTeamworkResult;
      const shared=r.earned
        ? ` 🤝⭐ Teamwork Star earned! Together you spelled ${r.correct}/10 words correctly.`
        : ` 🤝 Team Goal: ${r.correct}/10 words correct. Work together to reach ${TEAM_CORRECT_TARGET}/10 in the next match.`;
      $('#danceNote').textContent=($('#danceNote').textContent||'').trim()+shared;
      if(r.earned) $('#danceBadge').textContent=`Match ${m} Complete • Teamwork Star ⭐`;
    }
    return result;
  };

  const teamworkRules=document.getElementById('rulesBox');
  if(teamworkRules&&!teamworkRules.dataset.teamworkRuleAdded){
    teamworkRules.dataset.teamworkRuleAdded='1';
    teamworkRules.innerHTML += `<br><b>🤝 Team Goal:</b> work together to spell at least ${TEAM_CORRECT_TARGET} of the 10 match words correctly. Reach the goal and both players earn a Teamwork Star. After a first incorrect try, the waiting player may help by saying the sounds or syllables slowly together, but should not give the spelling.`;
  }

  const teamworkStyle=document.createElement('style');
  teamworkStyle.id='teamwork-style';
  teamworkStyle.textContent='.teamGoalChip{background:#edf9f2!important;border-color:#a9dfbd!important;color:#247248!important}.teamGoalChip.teamGoalReached{background:#fff4c9!important;border-color:#efcf62!important;color:#775b0c!important;box-shadow:0 0 0 2px rgba(244,185,66,.12)}@media(max-width:620px){.teamGoalChip{font-size:8.5px!important;padding:2px 5px!important}}';
  document.head.appendChild(teamworkStyle);
  updateTeamGoalUI();
