  // Creator credit shown unobtrusively on the start screen.
  const creditAnchor=document.querySelector('#startScreen .saveNote');
  if(creditAnchor&&!document.getElementById('creatorCredit')){
    const credit=document.createElement('div');
    credit.id='creatorCredit';
    credit.innerHTML='Designed and developed by Lim Kim Sze<br><span style="font-weight:700">Inspired by MOE PSB SDR</span>';
    credit.style.cssText='margin-top:8px;font-size:11px;font-weight:800;color:#738796;text-align:center;letter-spacing:.1px;line-height:1.45';
    creditAnchor.insertAdjacentElement('afterend',credit);
  }
