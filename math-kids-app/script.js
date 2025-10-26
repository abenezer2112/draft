// Simple kid-friendly math app
(() => {
  const el = id => document.getElementById(id);
  const startBtn = el('startBtn');
  const operationSel = el('operation');
  const diffSel = el('difficulty');
  const status = el('status');
  const problemWrap = el('problemWrap');
  const problemDiv = el('problem');
  const answerInput = el('answerInput');
  const submitBtn = el('submitBtn');
  const feedback = el('feedback');
  const explanationDiv = el('explanation');
  const scoreSpan = el('score');
  const correctSpan = el('correct');
  const wrongSpan = el('wrong');
  const stars = el('stars');
  const showVisualChk = el('showVisual');
  const objectChoice = el('objectChoice');
  const visualDiv = el('visual');

  let state = {
    score: 0, correct: 0, wrong: 0, current: null
  };

  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}

  function pickOperation(op){
    if(op==='mixed'){
      const arr=['add','sub','mul','div'];
      return arr[randInt(0,arr.length-1)];
    }
    return op;
  }

  function generateProblem(rawOp, diff){
    const op = pickOperation(rawOp);
    let a,b,ans;
    const ranges = {
      easy:[1,10],
      medium:[2,20],
      hard:[10,99]
    };
    const [min,max] = ranges[diff] || ranges.medium;

    if(op==='add'){
      a = randInt(min,max); b = randInt(min,max); ans = a+b;
    } else if(op==='sub'){
      a = randInt(min,max); b = randInt(min,Math.min(a,max)); ans = a-b;
    } else if(op==='mul'){
      a = randInt(Math.max(1,Math.floor(min/2)), Math.min(max,20)); b = randInt(1,12); ans = a*b;
    } else if(op==='div'){
      // make clean divisible pairs
      b = randInt(1,12);
      ans = randInt(1,Math.floor(max/Math.max(1,b)));
      a = ans * b;
    }

    const sym = op==='add'?'+':op==='sub'?'-':op==='mul'?'×':'÷';
    return {a,b,op,ans,text:`${a} ${sym} ${b} = ?`} ;
  }

  function setStatus(txt){ status.textContent = txt }

  function showProblem(){
    problemWrap.classList.remove('hidden');
    const p = state.current;
    problemDiv.textContent = p.text;
    answerInput.value='';
    answerInput.focus();
    feedback.textContent=''; feedback.className='feedback';
    explanationDiv.textContent = '';
    if(visualDiv) visualDiv.innerHTML = '';
  }

  function renderVisual(p){
    if(!visualDiv) return;
    visualDiv.innerHTML = '';
    if(!showVisualChk || !showVisualChk.checked) return;
    const emoji = (objectChoice && objectChoice.value) || '🍎';
    const {a=0,b=0,op} = p || {};
    const maxItems = 20; // cap visuals to avoid huge clutter

    function makeItem(content, crossed){
      const d = document.createElement('div'); d.className = 'item' + (crossed? ' crossed':''); d.textContent = content; return d;
    }

    if(op==='add'){
      const g1 = document.createElement('div'); g1.className='group';
      const g2 = document.createElement('div'); g2.className='group';
      const aCount = Math.min(a, maxItems);
      const bCount = Math.min(b, Math.max(0, maxItems - aCount));
      for(let i=0;i<aCount;i++) g1.appendChild(makeItem(emoji,false));
      for(let i=0;i<bCount;i++) g2.appendChild(makeItem(emoji,false));
      visualDiv.appendChild(g1); visualDiv.appendChild(document.createTextNode('  +  ')); visualDiv.appendChild(g2);
      if(a+b > maxItems) visualDiv.appendChild(document.createTextNode(`  (showing ${aCount}+${bCount} items)`));
    }

    if(op==='sub'){
      const g = document.createElement('div'); g.className='group';
      const visible = Math.min(a, maxItems);
      const crossed = Math.min(b, visible);
      for(let i=0;i<visible;i++) g.appendChild(makeItem(emoji, i < crossed));
      visualDiv.appendChild(g);
      if(a > maxItems) visualDiv.appendChild(document.createTextNode(`  (showing ${visible} of ${a} items)`));
    }

    if(op==='mul'){
      const rows = Math.min(a, 6) || 1;
      const perRow = Math.min(b || 1, Math.ceil(maxItems/rows));
      for(let r=0;r<rows;r++){
        const g = document.createElement('div'); g.className='group';
        for(let j=0;j<perRow;j++) g.appendChild(makeItem(emoji,false));
        visualDiv.appendChild(g);
      }
      visualDiv.appendChild(document.createTextNode(`  (${a} × ${b} shown as ${rows} groups)`));
    }

    if(op==='div'){
      const groups = Math.min(b || 1, 10);
      const perGroup = Math.min(Math.max(1, Math.floor((a||0)/(b||1))), Math.ceil(maxItems/groups));
      for(let g=0; g<groups; g++){
        const gd = document.createElement('div'); gd.className='group';
        for(let i=0;i<perGroup;i++) gd.appendChild(makeItem(emoji,false));
        visualDiv.appendChild(gd);
      }
      visualDiv.appendChild(document.createTextNode(`  (${a} ÷ ${b} shown as ${groups} groups)`));
    }
  }

  function explainProblem(p){
    const {a,b,op,ans} = p;
    // kid-friendly short explanations
    if(op==='add'){
      const ones = (a % 10) + (b % 10);
      if(ones >= 10){
        return `Add the ones: ${a % 10} + ${b % 10} = ${ones}. Write ${ones % 10} and carry 1 to the tens. Add the tens and the carry to get ${ans}. So ${a} + ${b} = ${ans}.`;
      }
      return `Start with ${a} and add ${b}. Counting up gives ${ans}, so ${a} + ${b} = ${ans}.`;
    }
    if(op==='sub'){
      const aOnes = a % 10, bOnes = b % 10;
      if(aOnes < bOnes){
        return `We need to borrow because ${aOnes} is less than ${bOnes}. Borrow from the tens, then subtract: ${a} - ${b} = ${ans}.`;
      }
      return `Start with ${a} and take away ${b}. ${a} - ${b} = ${ans}.`;
    }
    if(op==='mul'){
      if(b <= 5){
        // show repeated addition for small b
        const parts = Array.from({length:b},()=>a).join(' + ');
        return `Multiplication is repeated addition: ${a} × ${b} = ${parts} = ${ans}.`;
      }
      return `Multiplication: ${a} × ${b} = ${ans}. You can think of it as ${b} groups of ${a}.`;
    }
    if(op==='div'){
      return `Division is sharing into equal groups: ${a} ÷ ${b} = ${ans}, because ${ans} × ${b} = ${a}.`;
    }
    return '';
  }

  function updateMeta(){ scoreSpan.textContent = state.score; correctSpan.textContent = state.correct; wrongSpan.textContent = state.wrong }

  function playSound(type){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      if(type==='correct'){ o.frequency.value=880; g.gain.value=0.08 }
      else { o.frequency.value=220; g.gain.value=0.06 }
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.5);
      setTimeout(()=>{ o.stop(); ctx.close(); }, 600);
    }catch(e){ /* silent */ }
  }

  function spawnStars(count=3){
    for(let i=0;i<count;i++){
      const s = document.createElement('div'); s.className='star';
      s.style.left = (50 + (Math.random()*80-40)) + '%';
      s.style.bottom = '8px';
      stars.appendChild(s);
      // delay to stagger
      setTimeout(()=>{ s.classList.add('animate'); }, i*120);
      setTimeout(()=>{ s.remove(); }, 1200);
    }
  }

  function checkAnswer(){
    const val = Number(answerInput.value);
    if(answerInput.value.trim()==='') { feedback.textContent='Please enter a number.'; feedback.classList.add('wrong'); return }
    const correct = state.current.ans;
    if(Math.abs(val - correct) < 0.0001){
      feedback.textContent = 'Great job!'; feedback.classList.add('correct');
      state.score += 10; state.correct += 1;
      playSound('correct'); spawnStars(4);
    } else {
      feedback.textContent = `Try again — correct: ${correct}`; feedback.classList.add('wrong');
      state.score = Math.max(0, state.score - 2); state.wrong += 1;
      playSound('wrong');
    }
    updateMeta();
    // show explanation to help them understand the logic
    try{ explanationDiv.textContent = explainProblem(state.current); }catch(e){ explanationDiv.textContent = ''; }
    try{ renderVisual(state.current); }catch(e){ if(visualDiv) visualDiv.innerHTML = ''; }
    // prepare next after short delay
    setTimeout(()=>{ nextProblem(); }, 800);
  }

  function nextProblem(){
    const op = operationSel.value;
    const diff = diffSel.value;
    state.current = generateProblem(op, diff);
    showProblem();
  }

  // Event wiring
  startBtn.addEventListener('click', ()=>{
    state.score = 0; state.correct = 0; state.wrong = 0; updateMeta();
    setStatus('Good luck! Solve the problem');
    nextProblem();
  });

  submitBtn.addEventListener('click', checkAnswer);
  answerInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAnswer(); });

  // expose a tiny helper for dev / future saving
  window.mathFun = {state, nextProblem};

  // re-render visual when options change
  if(showVisualChk) showVisualChk.addEventListener('change', ()=>{ renderVisual(state.current || {}); });
  if(objectChoice) objectChoice.addEventListener('change', ()=>{ renderVisual(state.current || {}); });
})();