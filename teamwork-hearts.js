  // Shared 2-player teamwork hearts: one heart can be earned in each of the 8 matches.
  const TEAMWORK_HEARTS_KEY=STORAGE_KEY+':teamwork-hearts-v1';
  let teamworkHearts=Array.from({length:state.totalMissions||8},()=>false);

  function loadTeamworkHearts(){
    try{
      const saved=JSON.parse(localStorage.getItem(TEAMWORK_HEARTS_KEY)||'null');
      if(Array.isArray(saved)){
        teamworkHearts=Array.from({length:state.totalMissions||8},(_,i)=>saved[i]===true);
      }
    }catch(e){}
  }

  function saveTeamworkHearts(){
    try{localStorage.setItem(TEAMWORK_HEARTS_KEY,JSON.stringify(teamworkHearts));}catch(e){}
  }

  function ensureTeamworkHeartsUI(){
    let wrap=document.getElementById('teamworkHeartsWrap');
    const roadmap=document.querySelector('.missionRoadmap');
    if(!wrap&&roadmap){
      wrap=document.createElement('div');
      wrap.id='teamworkHeartsWrap';
      wrap.className='teamworkHeartsWrap hidden';
      wrap.innerHTML='<span class="teamworkHeartsLabel">Teamwork Hearts</span><span id="teamworkHeartsTrack" class="teamworkHeartsTrack" aria-label="Teamwork Hearts progress"></span>';
      roadmap.appendChild(wrap);
    }
    return wrap;
  }

  function renderTeamworkHearts(){
    const wrap=ensureTeamworkHeartsUI();
    if(!wrap) return;
    const twoPlayer=state.mode===2;
    wrap.classList.toggle('hidden',!twoPlayer);
    if(!twoPlayer) return;
    const track=document.getElementById('teamworkHeartsTrack');
    if(!track) return;
    track.innerHTML=teamworkHearts.map((earned,i)=>
      `<span class="teamworkHeart ${earned?'earned':''}" title="Match ${i+1}: ${earned?'Teamwork Heart earned':'not earned yet'}" aria-label="Match ${i+1} ${earned?'Teamwork Heart earned':'Teamwork Heart not earned'}">${earned?'♥':'♡'}</span>`
    ).join('');
  }

  function changeTeamworkStarWordingToHeart(root=document){
    const badge=root.querySelector?.('.teamworkIntroIcon');
    if(badge) badge.textContent='🤝❤️';
    const title=root.querySelector?.('#teamworkIntroTitle');
    if(title) title.textContent='Win a Teamwork Heart Together!';
    const goalLabel=root.querySelector?.('.teamworkIntroGoal b');
    if(goalLabel) goalLabel.textContent='❤️ Team Goal';
    const small=root.querySelector?.('.teamworkIntroSmall');
    if(small) small.textContent='You can compete for the match win and still earn the Teamwork Heart together.';
  }

  const baseEnsureTeamworkIntroForHearts=ensureTeamworkIntro;
  ensureTeamworkIntro=function(){
    const screen=baseEnsureTeamworkIntroForHearts.apply(this,arguments);
    changeTeamworkStarWordingToHeart(screen||document);
    return screen;
  };

  // Keep the relaxed auto-reading behaviour, but use Teamwork Heart wording.
  speakTeamworkIntro=function(){
    const text=`Teamwork challenge! You can both win a Teamwork Heart by working together. As a team, spell at least ${TEAM_CORRECT_TARGET} out of 10 words correctly. If your partner gets the first try wrong, help by saying the sounds or syllables slowly together. Do not give the spelling. Work together and earn the heart!`;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    const status=document.getElementById('teamworkIntroStatus');
    if(btn){btn.disabled=false;btn.dataset.ready='1';btn.textContent='Start Match →';}
    if(status) status.textContent='🔊 Teamwork rules are being read aloud…';
    if(!('speechSynthesis' in window)){
      if(status) status.textContent='Read the teamwork rules above, then start the match.';
      return;
    }
    try{
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='en-GB';u.rate=.76;u.pitch=1.03;u.volume=1;
      const v=typeof britishVoice==='function'?britishVoice():null;
      if(v) u.voice=v;
      u.onend=()=>{
        if(status&&!document.getElementById('teamworkIntroScreen')?.classList.contains('hidden')) status.textContent='✓ Teamwork rules finished. Ready to start!';
      };
      u.onerror=()=>{
        if(status&&!document.getElementById('teamworkIntroScreen')?.classList.contains('hidden')) status.textContent='Read the teamwork rules above, then start the match.';
      };
      window.speechSynthesis.speak(u);
    }catch(e){
      if(status) status.textContent='Read the teamwork rules above, then start the match.';
    }
  };

  const baseUpdateTeamGoalUIForHearts=updateTeamGoalUI;
  updateTeamGoalUI=function(){
    const result=baseUpdateTeamGoalUIForHearts.apply(this,arguments);
    const chip=document.getElementById('teamGoalChip');
    if(chip&&state.mode===2){
      const correct=currentTeamCorrect();
      const reached=correct>=TEAM_CORRECT_TARGET;
      chip.textContent=reached?`🤝❤️ Team Goal ${correct}/10`:`🤝 Team Goal ${correct}/${TEAM_CORRECT_TARGET}`;
      chip.title=`Together, spell at least ${TEAM_CORRECT_TARGET} of the 10 match words correctly to earn a Teamwork Heart.`;
    }
    return result;
  };

  const baseUpdateStatsForHearts=updateStats;
  updateStats=function(){
    const result=baseUpdateStatsForHearts.apply(this,arguments);
    if(state.mode===2){
      const roadmapName=document.getElementById('roadmapName');
      if(roadmapName) roadmapName.textContent='Match Progress';
    }
    renderTeamworkHearts();
    return result;
  };

  const baseCompleteTwoPlayerMissionForHearts=completeTwoPlayerMission;
  completeTwoPlayerMission=function(){
    const result=baseCompleteTwoPlayerMissionForHearts.apply(this,arguments);
    if(state.mode===2&&lastTeamworkResult){
      const idx=Math.max(0,Math.min(teamworkHearts.length-1,(Number(lastTeamworkResult.mission)||1)-1));
      if(lastTeamworkResult.earned){
        teamworkHearts[idx]=true;
        saveTeamworkHearts();
      }
      renderTeamworkHearts();
    }
    return result;
  };

  const baseShowMissionDanceForHearts=showMissionDance;
  showMissionDance=function(){
    const result=baseShowMissionDanceForHearts.apply(this,arguments);
    if(state.mode===2){
      const note=document.getElementById('danceNote');
      const badge=document.getElementById('danceBadge');
      if(note) note.textContent=(note.textContent||'').replace(/🤝⭐/g,'🤝❤️').replace(/Teamwork Star/g,'Teamwork Heart');
      if(badge) badge.textContent=(badge.textContent||'').replace(/Teamwork Star/g,'Teamwork Heart').replace(/⭐/g,'❤️');
    }
    return result;
  };

  const baseResetRaceForHearts=resetRace;
  resetRace=function(){
    teamworkHearts=Array.from({length:state.totalMissions||8},()=>false);
    try{localStorage.removeItem(TEAMWORK_HEARTS_KEY);}catch(e){}
    const result=baseResetRaceForHearts.apply(this,arguments);
    renderTeamworkHearts();
    return result;
  };

  const teamworkRulesForHearts=document.getElementById('rulesBox');
  if(teamworkRulesForHearts){
    teamworkRulesForHearts.innerHTML=teamworkRulesForHearts.innerHTML.replace(/Teamwork Star/g,'Teamwork Heart');
  }

  const teamworkHeartsStyle=document.createElement('style');
  teamworkHeartsStyle.id='teamwork-hearts-style';
  teamworkHeartsStyle.textContent=`
    .teamworkHeartsWrap{display:flex;align-items:center;justify-content:center;gap:8px;margin-left:16px;padding-left:16px;border-left:2px solid rgba(91,126,149,.18);white-space:nowrap}
    .teamworkHeartsLabel{font-size:11px;font-weight:1000;color:#9b4760}
    .teamworkHeartsTrack{display:flex;align-items:center;gap:5px}
    .teamworkHeart{display:inline-block;font-family:Arial,sans-serif;font-size:25px;line-height:1;color:#c2c9cf;text-shadow:0 1px 0 #fff;transition:transform .2s,color .2s}
    .teamworkHeart.earned{color:#e84e6a;transform:scale(1.08);filter:drop-shadow(0 2px 2px rgba(197,61,85,.18))}
    @media(max-width:900px){.teamworkHeartsWrap{margin-left:9px;padding-left:9px;gap:5px}.teamworkHeartsLabel{font-size:9px}.teamworkHeartsTrack{gap:3px}.teamworkHeart{font-size:21px}}
    @media(max-width:760px){.teamworkHeartsWrap{margin-left:5px;padding-left:5px}.teamworkHeartsLabel{display:none}.teamworkHeart{font-size:19px}.teamworkHeartsTrack{gap:2px}}
    @media(max-width:520px){.teamworkHeart{font-size:16px}.teamworkHeartsTrack{gap:1px}.teamworkHeartsWrap{border-left-width:1px}}
  `;
  document.head.appendChild(teamworkHeartsStyle);

  loadTeamworkHearts();
  if(state.mode===2){
    const roadmapName=document.getElementById('roadmapName');
    if(roadmapName) roadmapName.textContent='Match Progress';
  }
  renderTeamworkHearts();
