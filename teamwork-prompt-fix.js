  // Reliable, child-friendly partner-help prompt for 2-player mode.
  // The original Check button listener is already registered before this patch,
  // so this second listener runs after the answer has been checked.
  let partnerHelpDismissArmedAt=0;

  function dismissPartnerHelpOnInteraction(){
    const prompt=document.getElementById('partnerHelpPrompt');
    if(!prompt || prompt.classList.contains('hidden')) return;
    if(performance.now()<partnerHelpDismissArmedAt) return;
    hidePartnerHelpPrompt();
  }

  showPartnerHelpPrompt=function(){
    if(state.mode!==2) return;
    const helper=state.players[1-state.currentPlayer];
    const active=state.players[state.currentPlayer];
    const helperName=helper?.name||'Partner';
    const activeName=active?.name||'your friend';

    let prompt=document.getElementById('partnerHelpPrompt');
    if(!prompt){
      prompt=document.createElement('div');
      prompt.id='partnerHelpPrompt';
      prompt.setAttribute('aria-live','polite');
      document.body.appendChild(prompt);
    }

    prompt.className='partnerHelpPrompt bigCuteHelp';
    prompt.innerHTML=`
      <div class="helpFaces">🤝 💛 🤝</div>
      <div class="helpTitle">${escapeHtml(helperName)}, help ${escapeHtml(activeName)}!</div>
      <div class="helpMain">👂 Say the <b>sounds or syllables</b> slowly together.</div>
      <div class="helpDont">🙊 Don’t give the spelling.</div>
    `;

    // Ignore the same click/tap that produced the wrong-answer result, then
    // dismiss as soon as the pupils next touch the screen or use the mouse.
    partnerHelpDismissArmedAt=performance.now()+350;
    clearTimeout(partnerHelpTimer);
    partnerHelpTimer=setTimeout(hidePartnerHelpPrompt,7000);
  };

  // Add a direct listener to the existing Check button so the help prompt is
  // triggered reliably after the first wrong try, even though the original
  // click handler was registered before the teamwork wrapper existed.
  const teamworkCheckBtn=document.getElementById('checkBtn');
  if(teamworkCheckBtn&&!teamworkCheckBtn.dataset.teamworkPromptFixed){
    teamworkCheckBtn.dataset.teamworkPromptFixed='1';
    teamworkCheckBtn.addEventListener('click',()=>{
      setTimeout(()=>{
        if(state.mode===2&&!state.solved&&state.attemptsThisWord===1){
          showPartnerHelpPrompt();
        }
      },0);
    });
  }

  // The reminder should never get in the way once pupils resume interacting.
  if(!document.documentElement.dataset.teamworkHelpDismissFixed){
    document.documentElement.dataset.teamworkHelpDismissFixed='1';
    document.addEventListener('pointerdown',dismissPartnerHelpOnInteraction,true);
    document.addEventListener('touchstart',dismissPartnerHelpOnInteraction,{capture:true,passive:true});
    document.addEventListener('mousemove',dismissPartnerHelpOnInteraction,{capture:true,passive:true});
  }

  const cuteHelpStyle=document.createElement('style');
  cuteHelpStyle.id='big-cute-teamwork-help-style';
  cuteHelpStyle.textContent=`
    #partnerHelpPrompt.bigCuteHelp{
      position:fixed!important;
      left:50%!important;
      top:max(calc(env(safe-area-inset-top) + 10px),4vh)!important;
      transform:translateX(-50%)!important;
      z-index:120!important;
      width:min(620px,92vw)!important;
      padding:16px 20px 14px!important;
      border-radius:28px!important;
      background:linear-gradient(180deg,#fffdf0,#fff7c8)!important;
      border:5px solid #f2c94c!important;
      box-shadow:0 16px 50px rgba(0,0,0,.28),0 0 0 8px rgba(255,255,255,.5)!important;
      text-align:center!important;
      color:#5d4a10!important;
      pointer-events:none!important;
      animation:cuteHelpPop .34s cubic-bezier(.2,.9,.2,1.25)!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpFaces{
      font-size:clamp(34px,8vw,56px)!important;
      line-height:1!important;
      margin-bottom:2px!important;
      animation:cuteHelpBounce 1s ease-in-out infinite alternate!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpTitle{
      font-size:clamp(22px,5.5vw,36px)!important;
      line-height:1.08!important;
      font-weight:1000!important;
      color:#7a5700!important;
      margin:3px 0 9px!important;
      text-shadow:0 2px 0 rgba(255,255,255,.9)!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpMain{
      font-size:clamp(16px,4vw,23px)!important;
      line-height:1.25!important;
      font-weight:900!important;
      color:#385d73!important;
      background:#f5fbff!important;
      border:3px solid #b9d9ef!important;
      border-radius:18px!important;
      padding:9px 12px!important;
      margin:6px 0!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpDont{
      font-size:clamp(15px,3.8vw,21px)!important;
      line-height:1.2!important;
      font-weight:1000!important;
      color:#b34f52!important;
      background:#fff0f1!important;
      border:3px solid #efb9bd!important;
      border-radius:18px!important;
      padding:8px 12px!important;
    }
    @keyframes cuteHelpPop{
      from{opacity:0;transform:translateX(-50%) scale(.72) rotate(-2deg)}
      to{opacity:1;transform:translateX(-50%) scale(1) rotate(0)}
    }
    @keyframes cuteHelpBounce{
      from{transform:translateY(0) rotate(-2deg)}
      to{transform:translateY(-4px) rotate(2deg)}
    }
    @media(max-height:650px){
      #partnerHelpPrompt.bigCuteHelp{top:max(calc(env(safe-area-inset-top) + 6px),2vh)!important;padding:9px 12px 8px!important;border-radius:20px!important;border-width:4px!important}
      #partnerHelpPrompt.bigCuteHelp .helpFaces{font-size:30px!important;margin-bottom:0!important}
      #partnerHelpPrompt.bigCuteHelp .helpTitle{font-size:21px!important;margin:1px 0 5px!important}
      #partnerHelpPrompt.bigCuteHelp .helpMain,#partnerHelpPrompt.bigCuteHelp .helpDont{font-size:14px!important;padding:5px 8px!important;margin:3px 0!important;border-width:2px!important}
    }
  `;
  document.head.appendChild(cuteHelpStyle);
