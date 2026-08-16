  // Comprehensive 80-word dyslexia-informed revision bank.
  // This patch runs inside the game's own lexical scope.

  const COMPREHENSIVE_BANK_VERSION='comprehensive80-v1';
  const COMPREHENSIVE_MISSIONS=[
    ['fix','shut','chat','that','then','quick','catch','edge','fill','buzz'],
    ['shape','theme','five','tube','space','side','plane','broke','age','knife'],
    ['train','away','green','heavy','field','far','north','third','vein','better'],
    ['float','grow','town','sound','point','stood','food','true','flew','seize'],
    ['candle','gentle','circle','knuckle','problem','eagle','pencil','juice','dimple','tadpole'],
    ['value','stew','fruit','turkey','dry','ceiling','circus','yellow','zero','oyster'],
    ['books','matches','crawled','walked','visited','unhappy','unable','incomplete','stressful','replayed'],
    ['disliked','disobeying','misuse','pretest','preheat','brighter','brightest','restless','cried','stuff']
  ];
  const COMPREHENSIVE_WORDS=COMPREHENSIVE_MISSIONS.flat();
  const COMPREHENSIVE_SET=new Set(COMPREHENSIVE_WORDS);

  // A new bank needs a clean journey so saved six-mission progress cannot
  // accidentally skip part of the verified 80-word sequence.
  const bankVersionKey='spellingComprehensiveBankVersion';
  if(localStorage.getItem(bankVersionKey)!==COMPREHENSIVE_BANK_VERSION){
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(bankVersionKey,COMPREHENSIVE_BANK_VERSION);
  }

  state.totalMissions=8;

  // Extend the visual journey from six to eight stars.
  const missionStarsEl=document.querySelector('.missionStars');
  if(missionStarsEl){
    [7,8].forEach(n=>{
      if(!missionStarsEl.querySelector(`[data-mission-star="${n}"]`)){
        const star=document.createElement('span');
        star.className='missionStar';
        star.dataset.missionStar=String(n);
        star.title=`Mission ${n}`;
        star.textContent='☆';
        missionStarsEl.appendChild(star);
      }
    });
  }
  const roadmap=document.getElementById('missionRoadmap');
  if(roadmap) roadmap.setAttribute('aria-label','Eight mission progress');

  MISSION_NOTES[7]='Super work! You are now applying spelling patterns to meaningful word parts such as prefixes and suffixes.';
  MISSION_NOTES[8]='Amazing! Eight missions complete. You have revised the full technical phonogram set and the taught morphology through 80 carefully selected words.';

  const startBadge=document.querySelector('.startBadge');
  if(startBadge) startBadge.textContent='Comprehensive 80-Word Revision';
  const startIntro=document.querySelector('#startScreen .modal > p');
  if(startIntro) startIntro.textContent='Eight short missions revise the full taught phonogram system and meaningful word parts in a carefully controlled 80-word bank.';
  const rules=document.getElementById('rulesBox');
  if(rules){
    rules.innerHTML='<b>Goal:</b> complete 8 missions of 10 words each — exactly 80 different revision words with no repeats. The bank is verified to cover every technical phonogram token taught in the loaded Cycle 1–18 material (excluding the removed word <i>redo</i>) and all taught morphology/morpheme targets.<br>'+ 
      '<b>Scoring:</b> 10 points for a first-try spelling, 6 after self-correction, plus 1 point for each newly covered phonogram.<br>'+ 
      '<b>1 player:</b> finish all 8 missions to complete the comprehensive revision.<br>'+ 
      '<b>2 players:</b> each mission has 10 words total — 5 words per pupil. Players alternate turns. Each word allows only 2 tries; after 2 incorrect tries, that word scores 0.<br>'+ 
      '<b>🎲 Random Mission:</b> reshuffles the 10 words inside the current mission only, so the progression and full coverage are never lost.';
  }

  // Morphology/morphemes taught in the SDR source bank.
  const MORPHEME_TARGETS=[
    {id:'plural-s',label:'-s',meaning:'more than one',words:['books','digits','nights','shapes']},
    {id:'plural-es',label:'-es',meaning:'more than one',words:['matches','benches','dishes','boxes']},
    {id:'past-ed',label:'-ed',meaning:'happened in the past',words:['crawled','reached','visited','played','picked','rested','walked','replayed','disliked']},
    {id:'prefix-un',label:'un-',meaning:'not / opposite of',words:['unscrew','unhappy','unlucky','unable']},
    {id:'prefix-in',label:'in-',meaning:'not',words:['incomplete','incorrect','insane']},
    {id:'suffix-ing',label:'-ing',meaning:'action happening now / continuing',words:['singing','drawing','feeling','disobeying']},
    {id:'suffix-ful',label:'-ful',meaning:'full of / having',words:['stressful','powerful','thankful']},
    {id:'prefix-re',label:'re-',meaning:'again',words:['rethink','reread','replayed','reuse']},
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

  function tokenSetFromWords(words){
    const set=new Set();
    words.forEach(w=>(w?.syllables||[]).forEach(s=>(s.letters||[]).forEach(t=>{
      const k=tokenKey(t);
      if(k) set.add(k);
    })));
    return set;
  }

  let comprehensiveAudit={missingWords:[],missingTech:[],sourceTechCount:0,bankTechCount:0,morphCount:0};

  const baseLoadCorpusForPatch=loadCorpus;
  loadCorpus=async function(){
    await baseLoadCorpusForPatch();

    // REDO is intentionally excluded even if a device receives an old cached
    // Cycle 17 file that still contains it.
    const sourceWithoutRedo=state.words.filter(w=>String(w?.word||'').toLowerCase()!=='redo');
    const sourceTech=tokenSetFromWords(sourceWithoutRedo);

    const byName=new Map();
    sourceWithoutRedo.forEach(w=>{
      const key=String(w?.word||'').toLowerCase();
      if(key&&!byName.has(key)) byName.set(key,w);
    });

    const selected=COMPREHENSIVE_WORDS.map(name=>byName.get(name)).filter(Boolean);
    const missingWords=COMPREHENSIVE_WORDS.filter(name=>!byName.has(name));
    const bankTech=tokenSetFromWords(selected);
    const missingTech=[...sourceTech].filter(k=>!bankTech.has(k)).sort();

    state.words=selected;
    state.bank={1:[],2:[],3:[],4:[],5:[]};
    selected.forEach(w=>{
      const n=Math.max(1,Math.min(5,w.syllables?.length||1));
      state.bank[n].push(w);
    });
    state.allTokens=[...bankTech];
    state.challengeWords=[...selected];

    const morphCovered=MORPHEME_TARGETS.filter(m=>m.words.some(word=>COMPREHENSIVE_SET.has(word)));
    comprehensiveAudit={
      missingWords,
      missingTech,
      sourceTechCount:sourceTech.size,
      bankTechCount:bankTech.size,
      morphCount:morphCovered.length
    };

    const bankStatus=$('#bankStatus');
    if(bankStatus){
      const techText=missingTech.length
        ? `⚠ ${missingTech.length} technical token${missingTech.length===1?'':'s'} missing`
        : `✓ ${bankTech.size}/${sourceTech.size} technical tokens covered`;
      const wordText=missingWords.length
        ? `⚠ ${selected.length}/80 bank words loaded`
        : '✓ 80/80 bank words loaded';
      bankStatus.textContent=`Comprehensive revision bank: ${wordText} • ${techText} • ✓ ${morphCovered.length}/${MORPHEME_TARGETS.length} morphology targets represented.`;
    }
    const coverageList=$('#coverageTokenList');
    if(coverageList){
      coverageList.innerHTML='<b>Verified technical coverage ('+bankTech.size+'/'+sourceTech.size+'):</b> '+state.allTokens.map(displayToken).join(' • ');
    }
    updateMorphUI();
  };

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

  function currentMissionNumberForBank(){
    if(state.mode===2){
      return Math.max(1,Math.min(8,Math.min(state.players[0]?.mission||1,state.players[1]?.mission||1)));
    }
    return Math.max(1,Math.min(8,state.players[state.currentPlayer]?.mission||1));
  }

  function missionWordObjects(mission){
    const names=new Set(COMPREHENSIVE_MISSIONS[Math.max(1,Math.min(8,mission))-1]);
    return state.words.filter(w=>names.has(String(w.word).toLowerCase()));
  }

  function scoreCoverageCandidate(w,remainingPhon,remainingMorph,randomness=20){
    const phonFresh=wordTokenKeys(w).filter(k=>remainingPhon.has(k)).length;
    const morphFresh=morphsInWord(w).filter(m=>remainingMorph.has(m.id)).length;
    const syllables=Math.max(1,w.syllables?.length||1);
    const tiles=(w.syllables||[]).reduce((sum,s)=>sum+(s.letters||[]).length,0);
    return {w,phonFresh,morphFresh,score:morphFresh*18000+phonFresh*10000-syllables*5-tiles*.3+Math.random()*randomness};
  }

  function pickCoverageCandidate(candidates,remainingPhon,remainingMorph,randomness=20){
    if(!candidates.length) return null;
    const scored=candidates.map(w=>scoreCoverageCandidate(w,remainingPhon,remainingMorph,randomness)).sort((a,b)=>b.score-a.score);
    const best=scored[0];
    const peers=scored.filter(x=>x.morphFresh===best.morphFresh&&x.phonFresh===best.phonFresh).slice(0,8);
    const pool=peers.length?peers:scored.slice(0,6);
    return pool[Math.floor(Math.random()*pool.length)]?.w||best.w;
  }

  // Keep the carefully sequenced mission bands, but vary the order within them.
  chooseCoverageWord=function(){
    if(typeof randomMissionQueue!=='undefined'&&randomMissionQueue.length){
      const queued=randomMissionQueue.shift();
      if(queued) return queued;
    }
    const used=globalUsedWords();
    const mission=currentMissionNumberForBank();
    const available=missionWordObjects(mission).filter(w=>!used.has(String(w.word).toLowerCase()));
    if(!available.length) return null;
    const remaining=remainingCoverageSets();
    return pickCoverageCandidate(available,remaining.phon,remaining.morph,55);
  };

  // Random Mission now shuffles only the current ten-word mission. It never
  // swaps in a word from another difficulty band and never sacrifices coverage.
  if(typeof buildRandomMissionQueue==='function'){
    buildRandomMissionQueue=function(){
      const used=globalUsedWords();
      const mission=currentMissionNumberForBank();
      const queue=missionWordObjects(mission).filter(w=>!used.has(String(w.word).toLowerCase()));

      for(let i=queue.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [queue[i],queue[j]]=[queue[j],queue[i]];
      }

      const currentKey=String(state.current?.word||'').toLowerCase();
      if(queue.length>1&&String(queue[0]?.word||'').toLowerCase()===currentKey){
        const swapIndex=1+Math.floor(Math.random()*(queue.length-1));
        [queue[0],queue[swapIndex]]=[queue[swapIndex],queue[0]];
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
    const legend=document.querySelector('.coverageLegend');
    if(legend&&!document.getElementById('morphLegend')){
      const item=document.createElement('span');
      item.id='morphLegend';
      item.className='legendChip';
      item.textContent='🧩 Morpheme = meaningful word part';
      legend.appendChild(item);
    }
    const teacher=document.getElementById('coverageTokenList');
    if(teacher&&!document.getElementById('morphTeacherList')){
      const box=document.createElement('div');
      box.id='morphTeacherList';
      box.className='morphTeacherList';
      teacher.insertAdjacentElement('afterend',box);
    }
    if(teacher&&!document.getElementById('bankTeacherList')){
      const box=document.createElement('div');
      box.id='bankTeacherList';
      box.className='morphTeacherList';
      box.innerHTML='<b>80-word mission bank:</b><br>'+COMPREHENSIVE_MISSIONS.map((words,i)=>`<b>M${i+1}:</b> ${words.join(' • ')}`).join('<br>');
      const morphBox=document.getElementById('morphTeacherList');
      (morphBox||teacher).insertAdjacentElement('afterend',box);
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
    const chip=document.getElementById('morphCoverageChip');
    if(chip) chip.title=msg;
  }

  const baseUpdateStatsForMorph=updateStats;
  updateStats=function(){
    const result=baseUpdateStatsForMorph.apply(this,arguments);
    updateMorphUI();
    return result;
  };

  const baseSolveRoundForMorph=solveRound;
  solveRound=function(){
    const result=baseSolveRoundForMorph.apply(this,arguments);
    updateMorphUI();
    explainCurrentMorphology();
    return result;
  };

  const baseFailWordForMorph=failWordAfterTwoTries;
  failWordAfterTwoTries=function(){
    const result=baseFailWordForMorph.apply(this,arguments);
    updateMorphUI();
    explainCurrentMorphology();
    return result;
  };

  const morphologyStyle=document.createElement('style');
  morphologyStyle.id='morphology-style';
  morphologyStyle.textContent='.morphCoverageChip{background:#f4ecff!important;border-color:#c9b0ee!important;color:#604494!important}.morphCoverageChip.morphComplete{background:#e8f7ec!important;border-color:#98d7ad!important;color:#247248!important}.morphTeacherList{margin-top:10px;padding:9px;border:1.5px solid #d9c9ee;border-radius:12px;background:#faf7ff;font-size:12px;line-height:1.55;color:#53697a}.morphTeacherItem{display:inline-block;margin:2px 3px;padding:3px 6px;border-radius:8px;background:#f0edf4}.morphTeacherItem.done{background:#e7f7ec;color:#27754b}.morphTeacherItem small{font-size:10px;font-weight:700}.missionStars{gap:clamp(2px,.6vw,7px)}@media(max-width:620px){.morphCoverageChip{font-size:8.5px!important;padding:2px 5px!important}.morphTeacherList{font-size:10px}.missionStar{font-size:20px!important}}';
  document.head.appendChild(morphologyStyle);
