  // Reliable, child-friendly partner-help prompt for 2-player mode.
  // It sits in the empty lower part of the listening panel so it never covers
  // the syllable boxes or phonogram tiles. It remains until Check is pressed again.

  showPartnerHelpPrompt=function(){
    if(state.mode!==2) return;
    const helper=state.players[1-state.currentPlayer];
    const active=state.players[state.currentPlayer];
    const helperName=helper?.name||'Partner';
    const activeName=active?.name||'your friend';

    let prompt=document.getElementById('partnerHelpPrompt');
    const listenBar=document.querySelector('.listenBar');
    if(!prompt){
      prompt=document.createElement('div');
      prompt.id='partnerHelpPrompt';
      prompt.setAttribute('aria-live','polite');
    }
    // Keep the reminder physically inside the listening panel.
    if(listenBar && prompt.parentElement!==listenBar) listenBar.appendChild(prompt);
    else if(!prompt.parentElement) document.body.appendChild(prompt);

    prompt.className='partnerHelpPrompt bigCuteHelp';
    prompt.innerHTML=`
      <div class="helpTitle">🤝 ${escapeHtml(helperName)}, help ${escapeHtml(activeName)}! 💛</div>
      <div class="helpMain">👂 Say the <b>sounds or syllables</b> slowly together.</div>
      <div class="helpDont">🙊 Don’t give the spelling.</div>
    `;

    // No auto-hide timer. The reminder stays visible until Check is pressed again.
    clearTimeout(partnerHelpTimer);
    partnerHelpTimer=0;
  };

  // The original Check listener is already registered before this patch.
  // This second listener runs after the answer is checked.
  const teamworkCheckBtn=document.getElementById('checkBtn');
  if(teamworkCheckBtn&&!teamworkCheckBtn.dataset.teamworkPromptFixed){
    teamworkCheckBtn.dataset.teamworkPromptFixed='1';
    teamworkCheckBtn.addEventListener('click',()=>{
      const prompt=document.getElementById('partnerHelpPrompt');
      const wasVisible=!!(prompt&&!prompt.classList.contains('hidden'));

      // Any subsequent Check removes the existing teamwork reminder.
      if(wasVisible) hidePartnerHelpPrompt();

      // Only the first incorrect try creates a new reminder.
      setTimeout(()=>{
        if(!wasVisible && state.mode===2 && !state.solved && state.attemptsThisWord===1){
          showPartnerHelpPrompt();
        }
      },0);
    });
  }

  const cuteHelpStyle=document.createElement('style');
  cuteHelpStyle.id='big-cute-teamwork-help-style';
  cuteHelpStyle.textContent=`
    .listenBar{position:relative!important}
    #partnerHelpPrompt.bigCuteHelp{
      position:absolute!important;
      left:50%!important;
      bottom:12px!important;
      top:auto!important;
      transform:translateX(-50%)!important;
      z-index:20!important;
      width:min(760px,82%)!important;
      padding:10px 16px 9px!important;
      border-radius:22px!important;
      background:linear-gradient(180deg,#fffdf0,#fff5bd)!important;
      border:4px solid #f2c94c!important;
      box-shadow:0 8px 22px rgba(91,72,12,.16),0 0 0 5px rgba(255,255,255,.55)!important;
      text-align:center!important;
      color:#5d4a10!important;
      pointer-events:none!important;
      animation:cuteHelpPop .32s cubic-bezier(.2,.9,.2,1.2)!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpTitle{
      font-size:clamp(20px,2.4vw,31px)!important;
      line-height:1.08!important;
      font-weight:1000!important;
      color:#7a5700!important;
      margin:0 0 5px!important;
      text-shadow:0 2px 0 rgba(255,255,255,.9)!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpMain{
      font-size:clamp(15px,1.65vw,21px)!important;
      line-height:1.2!important;
      font-weight:900!important;
      color:#385d73!important;
      margin:2px 0!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpDont{
      font-size:clamp(14px,1.45vw,19px)!important;
      line-height:1.18!important;
      font-weight:1000!important;
      color:#b34f52!important;
      margin-top:2px!important;
    }
    @keyframes cuteHelpPop{
      from{opacity:0;transform:translateX(-50%) scale(.82) translateY(8px)}
      to{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}
    }
    @media(max-width:760px){
      #partnerHelpPrompt.bigCuteHelp{width:min(560px,78%)!important;bottom:9px!important;padding:8px 10px 7px!important;border-width:3px!important;border-radius:18px!important}
      #partnerHelpPrompt.bigCuteHelp .helpTitle{font-size:clamp(16px,4.3vw,23px)!important;margin-bottom:3px!important}
      #partnerHelpPrompt.bigCuteHelp .helpMain{font-size:clamp(12px,3.3vw,17px)!important}
      #partnerHelpPrompt.bigCuteHelp .helpDont{font-size:clamp(11px,3vw,15px)!important}
    }
    @media(max-height:620px){
      #partnerHelpPrompt.bigCuteHelp{bottom:5px!important;padding:5px 9px!important;border-width:3px!important}
      #partnerHelpPrompt.bigCuteHelp .helpTitle{font-size:16px!important;margin-bottom:1px!important}
      #partnerHelpPrompt.bigCuteHelp .helpMain,#partnerHelpPrompt.bigCuteHelp .helpDont{font-size:11px!important;line-height:1.1!important}
    }
  `;
  document.head.appendChild(cuteHelpStyle);
