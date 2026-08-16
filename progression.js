(()=>{
  'use strict';

  // Gentle mission-by-mission syllable progression.
  // This is only a preference layer: phonogram coverage always comes first.
  const profiles={
    1:{1:58,2:8,3:-34,4:-52},
    2:{1:42,2:30,3:-12,4:-30},
    3:{1:24,2:42,3:6,4:-18},
    4:{1:4,2:48,3:24,4:-4},
    5:{1:-14,2:36,3:44,4:18},
    6:{1:-28,2:26,3:52,4:38}
  };

  function missionNumber(){
    if(typeof state==='undefined' || !state.players?.length) return 1;
    if(state.mode===2){
      const nums=state.players.map(p=>Math.max(1,Math.min(6,Number(p.mission)||1)));
      return Math.max(1,Math.min(6,Math.min(...nums)));
    }
    const p=state.players[state.currentPlayer]||state.players[0];
    return Math.max(1,Math.min(6,Number(p?.mission)||1));
  }

  function syllablesIn(w){
    return Math.max(1,Array.isArray(w?.syllables)?w.syllables.length:1);
  }

  function tilesIn(w){
    return (w?.syllables||[]).reduce((sum,s)=>sum+(s.letters||[]).length,0);
  }

  function difficultyValue(w,mission){
    const count=syllablesIn(w);
    const profile=profiles[mission]||profiles[1];
    const base=profile[Math.min(4,count)] ?? profile[4];
    if(count<=4) return base;
    return base+(mission>=5?(count-4)*5:-(count-4)*10);
  }

  function progressivePick(candidates,remaining,coverageFirst){
    if(!candidates?.length) return null;
    const mission=missionNumber();
    const scored=candidates.map(w=>{
      const keys=wordTokenKeys(w);
      const fresh=keys.filter(k=>remaining.has(k)).length;
      // Coverage is deliberately weighted far more heavily than difficulty.
      const score=(coverageFirst?fresh*10000:0)
        +difficultyValue(w,mission)*80
        -tilesIn(w)*0.35
        +Math.random()*42;
      return {w,fresh,score};
    }).sort((a,b)=>b.score-a.score);

    if(coverageFirst && scored[0]?.fresh>0){
      const bestFresh=scored[0].fresh;
      const sameCoverage=scored.filter(x=>x.fresh===bestFresh).slice(0,10);
      const bestScore=sameCoverage[0]?.score??0;
      const close=sameCoverage.filter(x=>x.score>=bestScore-150).slice(0,6);
      const pool=close.length?close:sameCoverage;
      return pool[Math.floor(Math.random()*pool.length)]?.w||scored[0].w;
    }

    const bestScore=scored[0]?.score??0;
    const close=scored.filter(x=>x.score>=bestScore-180).slice(0,10);
    const pool=close.length?close:scored.slice(0,6);
    return pool[Math.floor(Math.random()*pool.length)]?.w||scored[0].w;
  }

  if(typeof chooseCoverageWord==='function'){
    chooseCoverageWord=function(player){
      if(typeof randomMissionQueue!=='undefined' && randomMissionQueue.length){
        const queued=randomMissionQueue.shift();
        if(queued) return queued;
      }

      const allKeys=state.allTokens.map(tokenKey);
      const globalUsedWords=new Set(
        state.players.flatMap(p=>[...p.usedWords].map(x=>String(x).toLowerCase()))
      );

      const presentedCoverage=new Set();
      state.words.forEach(w=>{
        if(globalUsedWords.has(String(w.word).toLowerCase())){
          wordTokenKeys(w).forEach(k=>presentedCoverage.add(k));
        }
      });
      const remaining=new Set(allKeys.filter(k=>!presentedCoverage.has(k)));
      const unused=state.words.filter(w=>!globalUsedWords.has(String(w.word).toLowerCase()));
      if(!unused.length) return null;

      if(remaining.size){
        let coveragePool=state.challengeWords.filter(w=>
          !globalUsedWords.has(String(w.word).toLowerCase()) &&
          wordTokenKeys(w).some(k=>remaining.has(k))
        );
        if(!coveragePool.length){
          coveragePool=unused.filter(w=>wordTokenKeys(w).some(k=>remaining.has(k)));
        }
        if(coveragePool.length){
          return progressivePick(coveragePool,remaining,true);
        }
      }

      return progressivePick(unused,remaining,false);
    };
  }

  if(typeof buildRandomMissionQueue==='function'){
    buildRandomMissionQueue=function(){
      const allKeys=state.allTokens.map(tokenKey);
      const globalUsedWords=new Set(
        state.players.flatMap(p=>[...p.usedWords].map(x=>String(x).toLowerCase()))
      );
      const presentedCoverage=new Set();
      state.words.forEach(w=>{
        if(globalUsedWords.has(String(w.word).toLowerCase())){
          wordTokenKeys(w).forEach(k=>presentedCoverage.add(k));
        }
      });
      const remaining=new Set(allKeys.filter(k=>!presentedCoverage.has(k)));
      let available=state.words.filter(w=>{
        const key=String(w.word||'').toLowerCase();
        return !globalUsedWords.has(key) &&
          (typeof randomMissionRerollExclusions==='undefined' || !randomMissionRerollExclusions.has(key));
      });
      const queue=[];

      for(let slot=0;slot<10 && available.length;slot++){
        let candidates=available;
        let coverageFirst=false;

        if(remaining.size){
          const compact=state.challengeWords.filter(w=>{
            const key=String(w.word||'').toLowerCase();
            return !globalUsedWords.has(key) &&
              (typeof randomMissionRerollExclusions==='undefined' || !randomMissionRerollExclusions.has(key)) &&
              available.includes(w) &&
              wordTokenKeys(w).some(k=>remaining.has(k));
          });
          const freshPool=available.filter(w=>wordTokenKeys(w).some(k=>remaining.has(k)));
          if(compact.length){
            candidates=compact;
            coverageFirst=true;
          }else if(freshPool.length){
            candidates=freshPool;
            coverageFirst=true;
          }
        }

        const pick=progressivePick(candidates,remaining,coverageFirst);
        if(!pick) break;
        queue.push(pick);
        available=available.filter(w=>w!==pick);
        wordTokenKeys(pick).forEach(k=>remaining.delete(k));
      }
      return queue;
    };
  }
})();
