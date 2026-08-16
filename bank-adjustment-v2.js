  // Bank adjustment v2: walked retired from the comprehensive 80-word bank.
  // aw_a is intentionally treated as an irregular/special spelling and is not
  // required for the regular technical-token coverage audit.

  const BANK_ADJUSTMENT_VERSION='comprehensive80-v2-picked';
  const walkedIndex=COMPREHENSIVE_WORDS.indexOf('walked');
  if(walkedIndex>=0) COMPREHENSIVE_WORDS[walkedIndex]='picked';

  const mission7=COMPREHENSIVE_MISSIONS[6];
  const missionWalkedIndex=mission7.indexOf('walked');
  if(missionWalkedIndex>=0) mission7[missionWalkedIndex]='picked';

  COMPREHENSIVE_SET.delete('walked');
  COMPREHENSIVE_SET.add('picked');

  const adjustmentVersionKey='spellingComprehensiveBankAdjustmentVersion';
  if(localStorage.getItem(adjustmentVersionKey)!==BANK_ADJUSTMENT_VERSION){
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(adjustmentVersionKey,BANK_ADJUSTMENT_VERSION);
  }

  const loadCorpusBeforeBankAdjustment=loadCorpus;
  loadCorpus=async function(){
    await loadCorpusBeforeBankAdjustment();

    // aw_a is a deliberate irregular exception, so do not flag it as a gap.
    if(comprehensiveAudit?.missingTech){
      comprehensiveAudit.missingTech=comprehensiveAudit.missingTech.filter(k=>k!=='aw_a');
    }
    if(comprehensiveAudit?.sourceTechCount){
      comprehensiveAudit.sourceTechCount=Math.max(0,comprehensiveAudit.sourceTechCount-1);
    }

    const bankStatus=$('#bankStatus');
    if(bankStatus){
      const missing=comprehensiveAudit?.missingTech||[];
      const techText=missing.length
        ? `⚠ ${missing.length} regular technical token${missing.length===1?'':'s'} missing`
        : '✓ all regular technical tokens covered';
      const wordText=(comprehensiveAudit?.missingWords||[]).length
        ? `⚠ ${80-(comprehensiveAudit.missingWords||[]).length}/80 bank words loaded`
        : '✓ 80/80 bank words loaded';
      bankStatus.textContent=`Comprehensive revision bank: ${wordText} • ${techText} • aw_a intentionally excluded as irregular • ✓ ${comprehensiveAudit.morphCount}/${MORPHEME_TARGETS.length} morphology targets represented.`;
    }

    const bankTeacherList=document.getElementById('bankTeacherList');
    if(bankTeacherList){
      bankTeacherList.innerHTML='<b>80-word mission bank:</b><br>'+COMPREHENSIVE_MISSIONS.map((words,i)=>`<b>M${i+1}:</b> ${words.join(' • ')}`).join('<br>');
    }
  };
