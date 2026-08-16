  // Relaxed teamwork intro: TTS starts automatically, but pupils may start the match at any time.
  setTeamworkIntroReady=function(){
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
  };

  finishTeamworkIntro=function(){
    if(!teamworkIntroContinue) return;
    clearTimeout(teamworkIntroWaitTimer);
    teamworkIntroWaitTimer=0;
    // Starting early is allowed. Stop the intro voice so it does not talk over the spelling prompt.
    try{window.speechSynthesis?.cancel();}catch(e){}
    document.getElementById('teamworkIntroScreen')?.classList.add('hidden');
    const go=teamworkIntroContinue;
    teamworkIntroContinue=null;
    go();
  };

  speakTeamworkIntro=function(){
    const text=`Teamwork challenge! You can both win a Teamwork Star by working together. As a team, spell at least ${TEAM_CORRECT_TARGET} out of 10 words correctly. If your partner gets the first try wrong, help by saying the sounds or syllables slowly together. Do not give the spelling. Work together and earn the star!`;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    const status=document.getElementById('teamworkIntroStatus');

    // The button is available immediately. Listening is encouraged, not compulsory.
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
        if(status && !document.getElementById('teamworkIntroScreen')?.classList.contains('hidden')){
          status.textContent='✓ Teamwork rules finished. Ready to start!';
        }
      };
      u.onerror=()=>{
        if(status && !document.getElementById('teamworkIntroScreen')?.classList.contains('hidden')){
          status.textContent='Read the teamwork rules above, then start the match.';
        }
      };
      // Reading begins automatically; no extra tap is required.
      window.speechSynthesis.speak(u);
    }catch(e){
      if(status) status.textContent='Read the teamwork rules above, then start the match.';
    }
  };

  showTeamworkIntro=function(continueGame){
    const screen=ensureTeamworkIntro();
    teamworkIntroContinue=continueGame;
    const btn=document.getElementById('teamworkIntroContinueBtn');
    if(btn){btn.disabled=false;btn.dataset.ready='1';btn.textContent='Start Match →';}
    screen.classList.remove('hidden');
    // Auto-read immediately. Pupils do not need to press anything to hear the full message.
    speakTeamworkIntro();
  };
