  // Creator credit shown unobtrusively on the start screen.
  const creditAnchor=document.querySelector('#startScreen .saveNote');
  if(creditAnchor&&!document.getElementById('creatorCredit')){
    const credit=document.createElement('div');
    credit.id='creatorCredit';
    credit.textContent='Designed and developed by Lim Kim Sze';
    credit.style.cssText='margin-top:8px;font-size:11px;font-weight:800;color:#738796;text-align:center;letter-spacing:.1px';
    creditAnchor.insertAdjacentElement('afterend',credit);
  }
