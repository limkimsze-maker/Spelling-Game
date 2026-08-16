  // Reliable, child-friendly partner-help prompt for 2-player mode.
  // The original Check button listener is already registered before this patch,
  // so this second listener runs after the answer has been checked.

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

  const cuteHelpStyle=document.createElement('style');
  cuteHelpStyle.id='big-cute-teamwork-help-style';
  cuteHelpStyle.textContent=`
    #partnerHelpPrompt.bigCuteHelp{
      position:fixed!important;
      left:50%!important;
      top:50%!important;
      transform:translate(-50%,-50%)!important;
      z-index:120!important;
      width:min(620px,92vw)!important;
      padding:20px 22px 18px!important;
      border-radius:28px!important;
      background:linear-gradient(180deg,#fffdf0,#fff7c8)!important;
      border:5px solid #f2c94c!important;
      box-shadow:0 22px 70px rgba(0,0,0,.30),0 0 0 8px rgba(255,255,255,.5)!important;
      text-align:center!important;
      color:#5d4a10!important;
      pointer-events:none!important;
      animation:cuteHelpPop .34s cubic-bezier(.2,.9,.2,1.25)!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpFaces{
      font-size:clamp(42px,10vw,68px)!important;
      line-height:1!important;
      margin-bottom:4px!important;
      animation:cuteHelpBounce 1s ease-in-out infinite alternate!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpTitle{
      font-size:clamp(24px,6vw,38px)!important;
      line-height:1.08!important;
      font-weight:1000!important;
      color:#7a5700!important;
      margin:4px 0 12px!important;
      text-shadow:0 2px 0 rgba(255,255,255,.9)!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpMain{
      font-size:clamp(17px,4.5vw,25px)!important;
      line-height:1.3!important;
      font-weight:900!important;
      color:#385d73!important;
      background:#f5fbff!important;
      border:3px solid #b9d9ef!important;
      border-radius:18px!important;
      padding:11px 14px!important;
      margin:8px 0!important;
    }
    #partnerHelpPrompt.bigCuteHelp .helpDont{
      font-size:clamp(16px,4.2vw,23px)!important;
      line-height:1.25!important;
      font-weight:1000!important;
      color:#b34f52!important;
      background:#fff0f1!important;
      border:3px solid #efb9bd!important;
      border-radius:18px!important;
      padding:10px 14px!important;
    }
    @keyframes cuteHelpPop{
      from{opacity:0;transform:translate(-50%,-50%) scale(.72) rotate(-2deg)}
      to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}
    }
    @keyframes cuteHelpBounce{
      from{transform:translateY(0) rotate(-2deg)}
      to{transform:translateY(-5px) rotate(2deg)}
    }
    @media(max-height:650px){
      #partnerHelpPrompt.bigCuteHelp{padding:12px 14px 11px!important;border-radius:22px!important}
      #partnerHelpPrompt.bigCuteHelp .helpFaces{font-size:38px!important;margin-bottom:0!important}
      #partnerHelpPrompt.bigCuteHelp .helpTitle{font-size:24px!important;margin:2px 0 7px!important}
      #partnerHelpPrompt.bigCuteHelp .helpMain,#partnerHelpPrompt.bigCuteHelp .helpDont{font-size:15px!important;padding:7px 9px!important;margin:5px 0!important}
    }
  `;
  document.head.appendChild(cuteHelpStyle);
