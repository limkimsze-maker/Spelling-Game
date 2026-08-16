  // REDO has been deliberately retired from the game.
  // This exclusion runs inside the game's own scope and protects against old
  // cached copies of Cycle 17 Session 2 that may still contain the word.
  const REDO_EXCLUDED_WORD='redo';

  const prefixReTarget=MORPHEME_TARGETS.find(m=>m.id==='prefix-re');
  if(prefixReTarget){
    prefixReTarget.words=prefixReTarget.words.filter(w=>String(w).toLowerCase()!==REDO_EXCLUDED_WORD);
  }
  WORD_TO_MORPHEMES.delete(REDO_EXCLUDED_WORD);

  const loadCorpusBeforeRedoExclusion=loadCorpus;
  loadCorpus=async function(){
    await loadCorpusBeforeRedoExclusion();

    state.words=state.words.filter(w=>String(w?.word||'').trim().toLowerCase()!==REDO_EXCLUDED_WORD);
    Object.keys(state.bank||{}).forEach(k=>{
      state.bank[k]=(state.bank[k]||[]).filter(w=>String(w?.word||'').trim().toLowerCase()!==REDO_EXCLUDED_WORD);
    });
    state.challengeWords=(state.challengeWords||[]).filter(w=>String(w?.word||'').trim().toLowerCase()!==REDO_EXCLUDED_WORD);

    // Rebuild the technical token target without redo's special o___ token.
    const tokenMap=new Map();
    state.words.forEach(w=>(w.syllables||[]).forEach(s=>(s.letters||[]).forEach(t=>{
      const k=String(t||'').trim();
      if(k) tokenMap.set(k.toLowerCase(),k);
    })));
    state.allTokens=[...tokenMap.values()];
    buildCoverageDeck();

    if($('#bankStatus')) $('#bankStatus').textContent=`Loaded ${state.words.length} source words. Redo is excluded. The 60-word journey protects phonogram and morphology coverage.`;
    if($('#coverageTokenList')) $('#coverageTokenList').innerHTML='<b>Phonogram coverage target ('+state.allTokens.length+'):</b> '+state.allTokens.map(displayToken).join(' • ');
    updateMorphUI();
  };
