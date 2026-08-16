  // 2-player collaboration layer: keep the individual match winner while
  // giving both pupils a shared success target and a structured way to help.
  const TEAM_CORRECT_TARGET=8;
  let lastTeamworkResult=null;
  let teamworkIntroShownForThisRun=false;
  let teamworkIntroContinue=null;
  let teamworkIntroWaitTimer=0;
  let partnerHelpTimer=0;

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

  function ensureTeamworkIntro(){
    let screen=document.getElementById('teamworkIntroScreen');
    if(screen) return screen;
    screen=document.createElement('div');
    screen.id='teamworkIntroScreen';
    screen.className='hidden';
    screen.innerHTML=`
      <div class="teamworkIntroCard" role="dialog" aria-modal="true" aria-labelledby="teamworkIntroTitle">
        <div class="teamworkIntroIcon">🤝⭐</div>
        <div class="teamworkIntroBadge">2-Player Team Challenge</div>
        <h2 id="teamworkIntroTitle">Win a Teamwork Star Together!</h2>
        <div class="teamworkIntroRule teamworkIntroGoal"><b>⭐ Team Goal</b><span>Get <strong>${TEAM_CORRECT_TARGET} out of 10</strong> words correct together.</span></div>
        <div class="teamworkIntroRule"><b>🤝 If Try 1 is wrong</b><span>Help your partner say the <strong>sounds or syllables</strong> slowly.</span></div>
        <div class="teamworkIntroRule teamworkIntroDont"><b>✋ Remember</b><span>Do not give the spelling.</span></div>
        <div class="teamworkIntroSmall">You can compete for the match win and still earn the Teamwork Star together.</div>
        <div id="teamworkIntroStatus" class="teamworkIntroStatus">🔊 Listen to the teamwork rules…</div>
        <button id="teamworkIntroContinueBtn" type="button" disabled>🔊 Listen first…</button>
      </div>`;
    document.body.appendChild(screen);
    document.getElementById('teamworkIntroContinueBtn')?.addEventListener('click',finishTeamworkIntro);
    return screen;
  }

  function setTeamworkIntroReady(){
    clearTimeout(teamworkIntroWaitTimer);
    teamworkIntroWaitTimer=0;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    const status=document.getElementById('teamworkIntroStatus');
    if(btn){
      btn.disabled=false;
      btn.textContent='Start Match →';
      btn.dataset.ready='1';
    }
    if(status) status.textContent='✓ Teamwork rules finished. Ready to start!';
  }

  function finishTeamworkIntro(){
    if(!teamworkIntroContinue) return;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    if(btn?.dataset.ready!=='1') return;
    clearTimeout(teamworkIntroWaitTimer);
    teamworkIntroWaitTimer=0;
    document.getElementById('teamworkIntroScreen')?.classList.add('hidden');
    const go=teamworkIntroContinue;
    teamworkIntroContinue=null;
    go();
  }

  function waitUntilTeamworkSpeechReallyEnds(){
    clearTimeout(teamworkIntroWaitTimer);
    const check=()=>{
      const synth=window.speechSynthesis;
      if(!synth || (!synth.speaking && !synth.pending)){
        setTeamworkIntroReady();
        return;
      }
      teamworkIntroWaitTimer=setTimeout(check,350);
    };
    teamworkIntroWaitTimer=setTimeout(check,350);
  }

  function speakTeamworkIntro(){
    const text=`Teamwork challenge! You can both win a Teamwork Star by working together. As a team, spell at least ${TEAM_CORRECT_TARGET} out of 10 words correctly. If your partner gets the first try wrong, help by saying the sounds or syllables slowly together. Do not give the spelling. Work together and earn the star!`;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    const status=document.getElementById('teamworkIntroStatus');
    if(btn){btn.disabled=true;btn.dataset.ready='0';btn.textContent='🔊 Listen first…';}
    if(status) status.textContent='🔊 Listen to the teamwork rules…';

    if(!('speechSynthesis' in window)){
      if(status) status.textContent='Read the teamwork rules above, then start the match.';
      setTeamworkIntroReady();
      return;
    }
    try{
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='en-GB';u.rate=.76;u.pitch=1.03;u.volume=1;
      const v=typeof britishVoice==='function'?britishVoice():null;
      if(v) u.voice=v;
      u.onend=()=>setTeamworkIntroReady();
      u.onerror=()=>waitUntilTeamworkSpeechReallyEnds();
      window.speechSynthesis.speak(u);
      // Do not use a fixed cut-off timer. Some devices read this message more
      // slowly than others. The button unlocks only after speechSynthesis has
      // genuinely stopped speaking/pending (or the onend event fires).
      waitUntilTeamworkSpeechReallyEnds();
    }catch(e){
      if(status) status.textContent='Read the teamwork rules above, then start the match.';
      setTeamworkIntroReady();
    }
  }

  function showTeamworkIntro(continueGame){
    const screen=ensureTeamworkIntro();
    teamworkIntroContinue=continueGame;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    if(btn){btn.disabled=true;btn.dataset.ready='0';btn.textContent='🔊 Listen first…';}
    screen.classList.remove('hidden');
    speakTeamworkIntro();
  }

  function ensurePartnerHelpPrompt(){
    let prompt=document.getElementById('partnerHelpPrompt');
    if(prompt) return prompt;
    prompt=document.createElement('div');
    prompt.id='partnerHelpPrompt';
    prompt.className='partnerHelpPrompt hidden';
    prompt.setAttribute('aria-live','polite');
    document.body.appendChild(prompt);
    return prompt;
  }

  function hidePartnerHelpPrompt(){
    clearTimeout(partnerHelpTimer);
    partnerHelpTimer=0;
    document.getElementById('partnerHelpPrompt')?.classList.add('hidden');
  }

  function showPartnerHelpPrompt(){
    if(state.mode!==2) return;
    const helper=state.players[1-state.currentPlayer];
    const active=state.players[state.currentPlayer];
    const helperName=helper?.name||'Partner';
    const activeName=active?.name||'your partner';
    const prompt=ensurePartnerHelpPrompt();
    prompt.innerHTML=`<b>🤝 ${escapeHtml(helperName)}, help ${escapeHtml(activeName)}!</b><span>Say the sounds or syllables slowly.</span><small>Do not give the spelling.</small>`;
    prompt.classList.remove('hidden');
    clearTimeout(partnerHelpTimer);
    partnerHelpTimer=setTimeout(hidePartnerHelpPrompt,6500);
  }

  const baseNextWordForTeamwork=nextWord;
  nextWord=function(){
    hidePartnerHelpPrompt();
    const freshTwoPlayer=state.mode===2 && !teamworkIntroShownForThisRun && state.players.every(p=>(Number(p.words)||0)===0);
    if(freshTwoPlayer){
      teamworkIntroShownForThisRun=true;
      const ctx=this,args=arguments;
      showTeamworkIntro(()=>baseNextWordForTeamwork.apply(ctx,args));
      return;
    }
    return baseNextWordForTeamwork.apply(this,arguments);
  };

  const baseResetRaceForTeamwork=resetRace;
  resetRace=function(){
    teamworkIntroShownForThisRun=false;
    teamworkIntroContinue=null;
    clearTimeout(teamworkIntroWaitTimer);
    try{window.speechSynthesis?.cancel();}catch(e){}
    document.getElementById('teamworkIntroScreen')?.classList.add('hidden');
    hidePartnerHelpPrompt();
    return baseResetRaceForTeamwork.apply(this,arguments);
  };

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
      showPartnerHelpPrompt();
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
    hidePartnerHelpPrompt();
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
  teamworkStyle.textContent=`
    .teamGoalChip{background:#edf9f2!important;border-color:#a9dfbd!important;color:#247248!important}
    .teamGoalChip.teamGoalReached{background:#fff4c9!important;border-color:#efcf62!important;color:#775b0c!important;box-shadow:0 0 0 2px rgba(244,185,66,.12)}
    #teamworkIntroScreen{position:fixed;inset:0;z-index:95;background:rgba(27,45,59,.76);display:grid;place-items:center;padding:16px;backdrop-filter:blur(4px)}
    .teamworkIntroCard{width:min(610px,94vw);max-height:calc(100dvh - 24px);overflow:auto;background:linear-gradient(180deg,#ffffff,#f7fbff);border:4px solid #a9dfbd;border-radius:26px;padding:20px;text-align:center;box-shadow:0 26px 80px rgba(0,0,0,.3)}
    .teamworkIntroIcon{font-size:54px;line-height:1}
    .teamworkIntroBadge{display:inline-block;margin:5px 0 2px;padding:5px 11px;border-radius:999px;background:#edf9f2;color:#247248;font-size:12px;font-weight:1000}
    .teamworkIntroCard h2{margin:7px 0 12px;color:#29485e;font-size:clamp(24px,5vw,34px)}
    .teamworkIntroRule{display:grid;grid-template-columns:minmax(120px,.7fr) 1.3fr;gap:10px;align-items:center;margin:8px 0;padding:10px 12px;border-radius:14px;background:#f5f9fc;border:2px solid #dce7ef;text-align:left;color:#4f687a;font-size:14px;line-height:1.35}
    .teamworkIntroRule b{color:#29485e}.teamworkIntroGoal{background:#fff8df;border-color:#f0d77b}.teamworkIntroDont{background:#fff3f3;border-color:#efc4c8}
    .teamworkIntroSmall{margin:10px auto 6px;color:#657d8e;font-size:12px;font-weight:800;max-width:500px;line-height:1.4}
    .teamworkIntroStatus{margin:5px auto 9px;color:#37699f;font-size:12px;font-weight:1000;min-height:17px}
    #teamworkIntroContinueBtn{border:none;border-radius:15px;padding:11px 22px;background:#2e9d63;color:#fff;font:inherit;font-size:17px;font-weight:1000;cursor:pointer;box-shadow:0 4px 0 #21804f}
    #teamworkIntroContinueBtn:disabled{background:#aab8c2;color:#f7fafc;box-shadow:0 4px 0 #8997a0;cursor:not-allowed;opacity:1}
    .partnerHelpPrompt{position:fixed;left:50%;top:max(92px,13vh);transform:translateX(-50%);z-index:58;width:min(520px,90vw);padding:10px 14px;border-radius:16px;background:#fff8d8;border:3px solid #efcf62;box-shadow:0 12px 32px rgba(44,63,77,.2);text-align:center;color:#5d4a10;pointer-events:none;animation:teamHelpPop .25s ease-out}
    .partnerHelpPrompt b,.partnerHelpPrompt span,.partnerHelpPrompt small{display:block}.partnerHelpPrompt b{font-size:15px}.partnerHelpPrompt span{font-size:14px;font-weight:900;margin-top:2px}.partnerHelpPrompt small{font-size:11px;font-weight:900;margin-top:2px;color:#8b6511}
    @keyframes teamHelpPop{from{opacity:0;transform:translateX(-50%) scale(.88)}to{opacity:1;transform:translateX(-50%) scale(1)}}
    @media(max-width:620px){.teamGoalChip{font-size:8.5px!important;padding:2px 5px!important}.teamworkIntroCard{padding:14px}.teamworkIntroIcon{font-size:42px}.teamworkIntroRule{grid-template-columns:1fr;font-size:12px;gap:3px;padding:8px 10px}.partnerHelpPrompt{top:108px;padding:8px 10px}.partnerHelpPrompt b{font-size:13px}.partnerHelpPrompt span{font-size:12px}}
  `;
  document.head.appendChild(teamworkStyle);
  updateTeamGoalUI();
