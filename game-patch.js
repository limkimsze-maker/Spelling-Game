  // Live game patch: keep special spelling corrections and morphology inside
  // the game's own lexical scope so they can participate in word selection.

  // REDO ONLY: the final letter is <o> representing /uː/.  Some devices may
  // still receive the older cached JSON token oo_o.  Normalise it in-game and
  // reuse the existing /uː/ sound file while displaying the tile as "o".
  SOUND_TOKEN_FILE_OVERRIDES.o___='oo_o';
  DISPLAY_OVERRIDES.o___='o';

  function normaliseRedoWord(w){
    if(String(w?.word||'').trim().toLowerCase()!=='redo') return;
    (w.syllables||[]).forEach(s=>{
      if(!Array.isArray(s.letters)) return;
      s.letters=s.letters.map(t=>String(t)==='oo_o'?'o___':t);
    });
  }

  const baseLoadCorpusForPatch=loadCorpus;
  loadCorpus=async function(){
    await baseLoadCorpusForPatch();
    state.words.forEach(normaliseRedoWord);
    Object.values(state.bank||{}).flat().forEach(normaliseRedoWord);
    (state.challengeWords||[]).forEach(normaliseRedoWord);

    // Rebuild token coverage after the correction so redo contributes <o>,
    // not the stale oo token. Other genuine oo words remain unchanged.
    const tokenMap=new Map();
    state.words.forEach(w=>(w.syllables||[]).forEach(s=>(s.letters||[]).forEach(t=>{
      const k=String(t||'').trim();
      if(k) tokenMap.set(k.toLowerCase(),k);
    })));
    state.allTokens=[...tokenMap.values()];
    buildCoverageDeck();
    if($('#bankStatus')) $('#bankStatus').textContent=`Loaded ${state.words.length} source words. The 60-word journey protects phonogram and morphology coverage.`;
    if($('#coverageTokenList')) $('#coverageTokenList').innerHTML='<b>Phonogram coverage target ('+state.allTokens.length+'):</b> '+state.allTokens.map(displayToken).join(' • ');
    updateMorphUI();
  };

  // Morphology/morphemes taught in the SDR source bank. These are tracked as
  // meaningful word parts, separately from their sound/phonogram behaviour.
  const MORPHEME_TARGETS=[
    {id:'plural-s',label:'-s',meaning:'more than one',words:['books','digits','nights','shapes']},
    {id:'plural-es',label:'-es',meaning:'more than one',words:['matches','benches','dishes','boxes']},
    {id:'past-ed',label:'-ed',meaning:'happened in the past',words:['crawled','reached','visited','played','picked','rested','walked','replayed','disliked']},
    {id:'prefix-un',label:'un-',meaning:'not / opposite of',words:['unscrew','unhappy','unlucky','unable']},
    {id:'prefix-in',label:'in-',meaning:'not',words:['incomplete','incorrect','insane']},
    {id:'suffix-ing',label:'-ing',meaning:'action happening now / continuing',words:['singing','drawing','feeling','disobeying']},
    {id:'suffix-ful',label:'-ful',meaning:'full of / having',words:['stressful','powerful','thankful']},
    {id:'prefix-re',label:'re-',meaning:'again',words:['rethink','reread','redo','replayed','reuse']},
    {id:'prefix-dis',label:'dis-',meaning:'not / opposite / apart',words:['disbelief','disobeying','disliked']},
    {id:'comparative-er',label:'-er',meaning:'more (comparing two)',words:['brighter','greater','longer']},
    {id:'superlative-est',label:'-est',meaning:'most (comparing three or more)',words:['brightest','greatest','longest']},
    {id:'prefix-mis',label:'mis-',meaning:'wrongly / badly',words:['misuse','mistrust','mislead','misbehave','misplace','miscount']},
    {id:'prefix-pre',label:'pre-',meaning:'before',words:['pretest','preview','prepaid','preheat','precook','premix']},
    {id:'suffix-less',label:'-less',meaning:'without',words:['restless','harmless','homeless','helpless','hopeless','endless','useless']}
  ];

  const WORD_TO_MORPHEMES=new Map();
  MORPHEME_TARGETS.forEach(m=>m.words.forEach(word=>{
    const key=String(word).toLowerCase();
    if(!WORD_TO_MORPHEMES.has(key)) WORD_TO_MORPHEMES.set(key,[]);
    WORD_TO_MORPHEMES.get(key).push(m);
  }));
  const morphsInWord=w=>WORD_TO_MORPHEMES.get(String(w?.word||w||'').toLowerCase())||[];
  const globalUsedWords=()=>new Set(state.players.flatMap(p=>[...p.usedWords].map(x=>String(x).toLowerCase())));

  function presentedMorphology(){
    const used=globalUsedWords(),covered=new Set();
    used.forEach(word=>(WORD_TO_MORPHEMES.get(word)||[]).forEach(m=>covered.add(m.id)));
    return covered;
  }

  function presentedPhonograms(){
    const used=globalUsedWords(),covered=new Set();
    state.words.forEach(w=>{
      if(used.has(String(w.word).toLowerCase())) wordTokenKeys(w).forEach(k=>covered.add(k));
    });
    return covered;
  }

  function remainingCoverageSets(){
    const phonCovered=presentedPhonograms();
    const morphCovered=presentedMorphology();
    return {
      phon:new Set(state.allTokens.map(tokenKey).filter(k=>!phonCovered.has(k))),
      morph:new Set(MORPHEME_TARGETS.map(m=>m.id).filter(id=>!morphCovered.has(id)))
    };
  }

  function scoreCoverageCandidate(w,remainingPhon,remainingMorph,randomness=8){
    const phonFresh=wordTokenKeys(w).filter(k=>remainingPhon.has(k)).length;
    const morphFresh=morphsInWord(w).filter(m=>remainingMorph.has(m.id)).length;
    const syllables=Math.max(1,w.syllables?.length||1);
    const tiles=(w.syllables||[]).reduce((sum,s)=>sum+(s.letters||[]).length,0);
    // Morphology is deliberately strong so all 14 targets are introduced
    // early enough to fit comfortably inside the fixed 60-word journey.
    return {w,phonFresh,morphFresh,score:morphFresh*20000+phonFresh*10000-syllables*7-tiles*.5+Math.random()*randomness};
  }

  function pickCoverageCandidate(candidates,remainingPhon,remainingMorph,randomness=8){
    if(!candidates.length) return null;
    const scored=candidates.map(w=>scoreCoverageCandidate(w,remainingPhon,remainingMorph,randomness)).sort((a,b)=>b.score-a.score);
    const best=scored[0];
    const peers=scored.filter(x=>x.morphFresh===best.morphFresh&&x.phonFresh===best.phonFresh).slice(0,8);
    const pool=peers.length?peers:scored.slice(0,6);
    return pool[Math.floor(Math.random()*pool.length)]?.w||best.w;
  }

  chooseCoverageWord=function(){
    if(typeof randomMissionQueue!=='undefined'&&randomMissionQueue.length){
      const queued=randomMissionQueue.shift();
      if(queued) return queued;
    }
    const used=globalUsedWords();
    const unused=state.words.filter(w=>!used.has(String(w.word).toLowerCase()));
    if(!unused.length) return null;
    const remaining=remainingCoverageSets();
    const useful=unused.filter(w=>
      morphsInWord(w).some(m=>remaining.morph.has(m.id)) ||
      wordTokenKeys(w).some(k=>remaining.phon.has(k))
    );
    return pickCoverageCandidate(useful.length?useful:unused,remaining.phon,remaining.morph,12);
  };

  if(typeof buildRandomMissionQueue==='function'){
    buildRandomMissionQueue=function(){
      const used=globalUsedWords();
      const remaining=remainingCoverageSets();
      let available=state.words.filter(w=>{
        const key=String(w.word||'').toLowerCase();
        return !used.has(key) && (typeof randomMissionRerollExclusions==='undefined'||!randomMissionRerollExclusions.has(key));
      });
      const queue=[];
      for(let slot=0;slot<10&&available.length;slot++){
        const useful=available.filter(w=>
          morphsInWord(w).some(m=>remaining.morph.has(m.id)) ||
          wordTokenKeys(w).some(k=>remaining.phon.has(k))
        );
        const pick=pickCoverageCandidate(useful.length?useful:available,remaining.phon,remaining.morph,36);
        if(!pick) break;
        queue.push(pick);
        available=available.filter(w=>w!==pick);
        wordTokenKeys(pick).forEach(k=>remaining.phon.delete(k));
        morphsInWord(pick).forEach(m=>remaining.morph.delete(m.id));
      }
      return queue;
    };
  }

  function ensureMorphUI(){
    let chip=document.getElementById('morphCoverageChip');
    const strip=document.querySelector('.missionStrip');
    if(!chip&&strip){
      chip=document.createElement('span');
      chip.id='morphCoverageChip';
      chip.className='missionChip morphCoverageChip';
      chip.title='Morphology and morpheme coverage';
      strip.appendChild(chip);
    }
    const legend=document.querySelector('.legend');
    if(legend&&!document.getElementById('morphLegend')){
      const item=document.createElement('span');
      item.id='morphLegend';item.className='legendChip';item.textContent='🧩 Morpheme = meaningful word part';legend.appendChild(item);
    }
    const teacher=document.getElementById('coverageTokenList');
    if(teacher&&!document.getElementById('morphTeacherList')){
      const box=document.createElement('div');box.id='morphTeacherList';box.className='morphTeacherList';teacher.insertAdjacentElement('afterend',box);
    }
    return chip;
  }

  function updateMorphUI(){
    const chip=ensureMorphUI();
    const covered=presentedMorphology();
    if(chip){
      chip.textContent=`🧩 Morphemes ${covered.size}/${MORPHEME_TARGETS.length}`;
      chip.classList.toggle('morphComplete',covered.size===MORPHEME_TARGETS.length);
    }
    const teacher=document.getElementById('morphTeacherList');
    if(teacher){
      teacher.innerHTML='<b>Morphology target ('+MORPHEME_TARGETS.length+'):</b> '+MORPHEME_TARGETS.map(m=>`<span class="morphTeacherItem ${covered.has(m.id)?'done':''}">${covered.has(m.id)?'✓ ':'○ '}${m.label} <small>${m.meaning}</small></span>`).join(' ');
    }
  }

  function explainCurrentMorphology(){
    const ms=morphsInWord(state.current);
    if(!ms.length) return;
    const msg=ms.map(m=>`${m.label} = ${m.meaning}`).join(' • ');
    if(feedback&&state.solved&&!feedback.textContent.includes('🧩')) feedback.textContent=feedback.textContent.trim()+'  🧩 '+msg;
    const chip=document.getElementById('morphCoverageChip');if(chip) chip.title=msg;
  }

  const baseUpdateStatsForMorph=updateStats;
  updateStats=function(){const result=baseUpdateStatsForMorph.apply(this,arguments);updateMorphUI();return result;};
  const baseSolveRoundForMorph=solveRound;
  solveRound=function(){const result=baseSolveRoundForMorph.apply(this,arguments);updateMorphUI();explainCurrentMorphology();return result;};
  const baseFailWordForMorph=failWordAfterTwoTries;
  failWordAfterTwoTries=function(){const result=baseFailWordForMorph.apply(this,arguments);updateMorphUI();explainCurrentMorphology();return result;};

  const morphologyStyle=document.createElement('style');
  morphologyStyle.id='morphology-style';
  morphologyStyle.textContent='.morphCoverageChip{background:#f4ecff!important;border-color:#c9b0ee!important;color:#604494!important}.morphCoverageChip.morphComplete{background:#e8f7ec!important;border-color:#98d7ad!important;color:#247248!important}.morphTeacherList{margin-top:10px;padding:9px;border:1.5px solid #d9c9ee;border-radius:12px;background:#faf7ff;font-size:12px;line-height:1.55;color:#53697a}.morphTeacherItem{display:inline-block;margin:2px 3px;padding:3px 6px;border-radius:8px;background:#f0edf4}.morphTeacherItem.done{background:#e7f7ec;color:#27754b}.morphTeacherItem small{font-size:10px;font-weight:700}@media(max-width:620px){.morphCoverageChip{font-size:8.5px!important;padding:2px 5px!important}.morphTeacherList{font-size:10px}}';
  document.head.appendChild(morphologyStyle);
