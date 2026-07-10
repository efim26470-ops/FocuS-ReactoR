(() => {
  'use strict';

  const STORAGE_KEY = 'focus-reactor-v1';
  const VERSION = 1;
  const MODES = [
    { id: 'classic', name: '25 / 5', work: 25, break: 5, icon: '⚡' },
    { id: 'long', name: '50 / 10', work: 50, break: 10, icon: '◈' },
    { id: 'deep', name: 'Глубокая', work: 90, break: 20, icon: '⬢' },
    { id: 'custom', name: 'Свой режим', work: 40, break: 10, icon: '⌁' }
  ];
  const THEMES = [
    { id:'void', name:'Космическая пустота', icon:'🌌', desc:'Холодное ядро и мягкое неоновое свечение' },
    { id:'solar', name:'Солнечная вспышка', icon:'☀️', desc:'Горячий янтарный реактор' },
    { id:'ocean', name:'Абиссальный океан', icon:'🌊', desc:'Глубокий синий биореактор' },
    { id:'toxic', name:'Токсичная лаборатория', icon:'🧪', desc:'Кислотно-зелёная научная станция' },
    { id:'sakura', name:'Сакура-сингулярность', icon:'🌸', desc:'Розовый квантовый сад' },
    { id:'mono', name:'Монохромный модуль', icon:'◐', desc:'Строгий чёрно-белый интерфейс' },
    { id:'paper', name:'Бумажная лаборатория', icon:'📜', desc:'Светлая ретрофутуристическая тема' },
    { id:'arcade', name:'Аркадный коллайдер', icon:'👾', desc:'Неоновый реактор из старой аркады' }
  ];
  const REACTORS = [
    { id:'zero', name:'Нулевое ядро', icon:'⚛️', symbol:'⚛', need:0, desc:'Надёжный стартовый реактор' },
    { id:'plasma', name:'Плазменный цветок', icon:'🌺', symbol:'✺', need:3, desc:'Открывается за серию из 3 циклов' },
    { id:'quantum', name:'Квантовый пончик', icon:'🍩', symbol:'◉', need:7, desc:'Открывается за серию из 7 циклов' },
    { id:'frog', name:'Лягушачий синтезатор', icon:'🐸', symbol:'☢', need:12, desc:'Серьёзная наука с несерьёзным лицом' },
    { id:'sun', name:'Карманное солнце', icon:'🌞', symbol:'☀', need:20, desc:'Для тех, кто научился не отвлекаться' },
    { id:'cat', name:'Кот-коллайдер', icon:'🐈', symbol:'✦', need:35, desc:'Физика не объясняет, почему он мурчит' }
  ];
  const SOUNDS = [
    { id:'off', name:'Выключен', icon:'◖' },
    { id:'rain', name:'Космический дождь', icon:'🌧️' },
    { id:'engine', name:'Гул реактора', icon:'⚙️' },
    { id:'noise', name:'Белый шум', icon:'〰️' },
    { id:'forest', name:'Квантовый лес', icon:'🌲' }
  ];
  const ACHIEVEMENTS = [
    { id:'first', icon:'🧪', title:'Первый запуск', desc:'Заверши один рабочий цикл', test:s=>s.totalSessions>=1 },
    { id:'streak3', icon:'⚡', title:'Цепная реакция', desc:'Собери серию из 3 циклов', test:s=>s.bestStreak>=3 },
    { id:'streak10', icon:'☄️', title:'Неуправляемая продуктивность', desc:'Собери серию из 10 циклов', test:s=>s.bestStreak>=10 },
    { id:'hour', icon:'⏱️', title:'Час чистой энергии', desc:'Накопи 60 минут фокуса', test:s=>s.totalFocusMinutes>=60 },
    { id:'tenhours', icon:'🌌', title:'Малая электростанция', desc:'Накопи 10 часов фокуса', test:s=>s.totalFocusMinutes>=600 },
    { id:'stable', icon:'💎', title:'Идеальная стабильность', desc:'Заверши цикл без прерываний', test:s=>s.perfectSessions>=1 },
    { id:'goals', icon:'🎯', title:'Охотник за миссиями', desc:'Закрой 10 целей', test:s=>s.completedGoals>=10 },
    { id:'morning', icon:'🌅', title:'Рассветный инженер', desc:'Заверши цикл до 08:00', test:s=>s.morningSessions>=1 },
    { id:'night', icon:'🌙', title:'Ночной оператор', desc:'Заверши цикл после 23:00', test:s=>s.nightSessions>=1 },
    { id:'century', icon:'🏭', title:'Промышленный масштаб', desc:'Заверши 100 циклов', test:s=>s.totalSessions>=100 },
    { id:'reactors', icon:'🔓', title:'Коллекционер ядер', desc:'Открой четыре реактора', test:s=>REACTORS.filter(r=>s.bestStreak>=r.need).length>=4 },
    { id:'unstable', icon:'💥', title:'На грани взрыва', desc:'Заверши цикл со стабильностью ниже 50%', test:s=>s.riskySessions>=1 }
  ];

  const defaultState = () => ({
    version: VERSION,
    modeId:'classic', customWork:40, customBreak:10,
    phase:'work', durationSec:25*60, remainingSec:25*60,
    timerStatus:'idle', endAt:null, startedAt:null,
    interruptions:0, stability:100,
    theme:'void', reactor:'zero', sound:'off',
    autoBreak:true, autoLock:false, haptics:true,
    streak:0, bestStreak:0, totalSessions:0, totalFocusMinutes:0,
    perfectSessions:0, riskySessions:0, completedGoals:0,
    morningSessions:0, nightSessions:0,
    goals:[], history:[], unlockedAchievements:[],
    lastSessionDate:null
  });

  let state = loadState();
  let ticker = null;
  let deferredInstallPrompt = null;
  let toastTimer = null;
  let audio = { ctx:null, nodes:[], interval:null };
  let unlockTimer = null;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const el = id => document.getElementById(id);

  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return normalizeState(saved ? {...defaultState(), ...saved} : defaultState());
    } catch { return defaultState(); }
  }
  function normalizeState(s){
    if (!Array.isArray(s.goals)) s.goals=[];
    if (!Array.isArray(s.history)) s.history=[];
    if (!Array.isArray(s.unlockedAchievements)) s.unlockedAchievements=[];
    const mode = getModeFrom(s);
    if (!s.durationSec || s.durationSec<1) s.durationSec=(s.phase==='work'?mode.work:mode.break)*60;
    if (s.remainingSec==null) s.remainingSec=s.durationSec;
    if (s.timerStatus==='running' && s.endAt) {
      s.remainingSec=Math.max(0,Math.ceil((s.endAt-Date.now())/1000));
    }
    return s;
  }
  function saveState(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  function getModeFrom(s=state){
    const base = MODES.find(m=>m.id===s.modeId) || MODES[0];
    return base.id==='custom' ? {...base,work:Number(s.customWork)||40,break:Number(s.customBreak)||10} : base;
  }
  function todayKey(d=new Date()){
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function formatTime(sec){
    const n=Math.max(0,Math.ceil(sec));
    return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  }
  function formatMinutes(min){
    if(min<60) return `${Math.round(min)} мин`;
    const h=Math.floor(min/60), m=Math.round(min%60);
    return m?`${h} ч ${m} мин`:`${h} ч`;
  }
  function haptic(pattern=10){ if(state.haptics && navigator.vibrate) navigator.vibrate(pattern); }
  function toast(msg){
    const node=el('toast'); node.textContent=msg; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('show'),2400);
  }

  function init(){
    bindEvents();
    applyTheme();
    applySettingsUI();
    restoreTimer();
    renderAll();
    registerServiceWorker();
    setInterval(()=>{ if(state.timerStatus==='running') renderTimer(); }, 250);
  }

  function bindEvents(){
    document.addEventListener('click', e=>{
      const viewBtn=e.target.closest('[data-view]');
      if(viewBtn) switchView(viewBtn.dataset.view);
      if(e.target.closest('[data-close-modal]')) closeModal();
    });
    el('modeStrip').addEventListener('click', e=>{
      const btn=e.target.closest('[data-mode]'); if(!btn) return;
      if(state.timerStatus==='running'){ toast('Сначала останови текущий цикл'); return; }
      selectMode(btn.dataset.mode);
    });
    el('startButton').addEventListener('click',toggleTimer);
    el('focusToggleButton').addEventListener('click',toggleTimer);
    el('resetButton').addEventListener('click',resetTimer);
    el('interruptButton').addEventListener('click',registerInterruption);
    el('reactorSelectButton').addEventListener('click',openReactorModal);
    el('themeButton').addEventListener('click',openThemeModal);
    el('soundToggle').addEventListener('click',cycleSound);
    el('focusModeButton').addEventListener('click',openFocusMode);
    el('exitFocusButton').addEventListener('click',closeFocusMode);
    el('lockButton').addEventListener('click',lockControls);
    el('addGoalButton').addEventListener('click',openGoalModal);
    el('goalsList').addEventListener('click',handleGoalClick);
    el('exportButton').addEventListener('click',exportReport);
    el('settingsTheme').addEventListener('click',openThemeModal);
    el('settingsSound').addEventListener('click',openSoundModal);
    el('settingsReactor').addEventListener('click',openReactorModal);
    el('settingsCustomMode').addEventListener('click',openCustomModeModal);
    el('installButton').addEventListener('click',installApp);
    el('backupButton').addEventListener('click',downloadBackup);
    el('importButton').addEventListener('click',()=>el('importFile').click());
    el('importFile').addEventListener('change',importBackup);
    el('resetDataButton').addEventListener('click',confirmResetData);
    ['autoBreak','autoLock','haptics'].forEach(name=>{
      const map={autoBreak:'autoBreakToggle',autoLock:'autoLockToggle',haptics:'hapticsToggle'};
      el(map[name]).addEventListener('change',e=>{ state[name]=e.target.checked; saveState(); });
    });
    bindUnlockHold();
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) restoreTimer(); });
    window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstallPrompt=e; });
    window.addEventListener('appinstalled',()=>toast('Focus Reactor установлен'));
  }

  function switchView(name){
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    if(name==='stats') renderStats();
    if(name==='achievements') renderAchievements();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function selectMode(id){
    state.modeId=id;
    state.phase='work';
    const mode=getModeFrom();
    state.durationSec=mode.work*60; state.remainingSec=state.durationSec;
    state.timerStatus='idle'; state.endAt=null; state.interruptions=0; state.stability=100;
    saveState(); renderAll(); haptic();
  }

  function toggleTimer(){
    if(state.timerStatus==='running') pauseTimer(); else startTimer();
  }
  function startTimer(){
    if(state.remainingSec<=0) resetTimer();
    state.timerStatus='running';
    state.startedAt=state.startedAt || Date.now();
    state.endAt=Date.now()+state.remainingSec*1000;
    saveState(); startTicker(); renderAll(); haptic([8,30,8]);
    if(state.autoLock) setTimeout(lockControls,450);
  }
  function pauseTimer(){
    updateRemaining();
    state.timerStatus='paused'; state.endAt=null;
    if(state.phase==='work' && state.durationSec-state.remainingSec>30){
      state.interruptions+=1; state.stability=Math.max(0,100-state.interruptions*12);
      toast('Пауза повысила нестабильность');
    }
    clearInterval(ticker); ticker=null; saveState(); renderAll(); haptic(14);
  }
  function resetTimer(){
    const mode=getModeFrom();
    state.timerStatus='idle'; state.phase='work'; state.durationSec=mode.work*60; state.remainingSec=state.durationSec;
    state.endAt=null; state.startedAt=null; state.interruptions=0; state.stability=100;
    clearInterval(ticker); ticker=null; saveState(); renderAll(); toast('Цикл перезапущен');
  }
  function registerInterruption(){
    if(state.phase!=='work'){ toast('На перерыве реактор и так отдыхает'); return; }
    state.interruptions+=1; state.stability=Math.max(0,100-state.interruptions*12);
    saveState(); renderAll(); haptic([20,35,20]);
    toast(state.stability<50?'Реактор опасно нестабилен':'Прерывание зарегистрировано');
  }
  function startTicker(){
    clearInterval(ticker);
    ticker=setInterval(()=>{
      updateRemaining();
      renderTimer();
      if(state.remainingSec<=0) completePhase();
    },500);
  }
  function updateRemaining(){
    if(state.timerStatus==='running' && state.endAt){
      state.remainingSec=Math.max(0,Math.ceil((state.endAt-Date.now())/1000));
    }
  }
  function restoreTimer(){
    if(state.timerStatus==='running' && state.endAt){
      updateRemaining();
      if(state.remainingSec<=0) completePhase(true); else startTicker();
    }
    renderAll();
  }
  function completePhase(restored=false){
    clearInterval(ticker); ticker=null;
    if(state.phase==='work') completeWorkSession(restored); else completeBreak();
  }
  function completeWorkSession(){
    const actualMinutes=Math.max(1,Math.round(state.durationSec/60));
    const now=new Date();
    const previousDate=state.lastSessionDate;
    const today=todayKey(now);
    if(previousDate===today) state.streak+=1;
    else {
      const yesterday=new Date(now); yesterday.setDate(now.getDate()-1);
      state.streak=(previousDate===todayKey(yesterday))?state.streak+1:1;
    }
    state.bestStreak=Math.max(state.bestStreak,state.streak);
    state.lastSessionDate=today;
    state.totalSessions+=1; state.totalFocusMinutes+=actualMinutes;
    if(state.interruptions===0) state.perfectSessions+=1;
    if(state.stability<50) state.riskySessions+=1;
    if(now.getHours()<8) state.morningSessions+=1;
    if(now.getHours()>=23) state.nightSessions+=1;
    state.history.unshift({id:cryptoId(),type:'work',date:now.toISOString(),minutes:actualMinutes,stability:state.stability,mode:state.modeId,interruptions:state.interruptions});
    state.history=state.history.slice(0,500);
    progressGoals(actualMinutes);
    const unlocked=checkAchievements();
    state.phase='break';
    const mode=getModeFrom(); state.durationSec=mode.break*60; state.remainingSec=state.durationSec;
    state.timerStatus=state.autoBreak?'running':'idle'; state.startedAt=null; state.endAt=state.autoBreak?Date.now()+state.remainingSec*1000:null;
    state.interruptions=0; state.stability=100;
    saveState();
    haptic([50,70,50,70,100]);
    toast(unlocked?`Достижение: ${unlocked.title}`:'Реактор заряжен. Отличная работа!');
    if(state.autoBreak) startTicker();
    renderAll();
  }
  function completeBreak(){
    const now=new Date();
    state.history.unshift({id:cryptoId(),type:'break',date:now.toISOString(),minutes:Math.round(state.durationSec/60),stability:100,mode:state.modeId,interruptions:0});
    state.phase='work'; const mode=getModeFrom(); state.durationSec=mode.work*60; state.remainingSec=state.durationSec;
    state.timerStatus='idle'; state.endAt=null; state.startedAt=null;
    saveState(); haptic([25,40,25]); toast('Перерыв завершён. Реактор ждёт новый цикл'); renderAll();
  }
  function cryptoId(){ return (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`); }

  function renderAll(){
    renderModes(); renderTimer(); renderGoals(); renderDaily(); renderStats(); renderAchievements(); renderSettings();
  }
  function renderModes(){
    el('modeStrip').innerHTML=MODES.map(m=>{
      const actual=m.id==='custom'?{...m,work:state.customWork,break:state.customBreak}:m;
      return `<button class="mode-btn ${state.modeId===m.id?'active':''}" data-mode="${m.id}">${m.icon} ${actual.name}${m.id==='custom'?` · ${actual.work}/${actual.break}`:''}</button>`;
    }).join('');
  }
  function renderTimer(){
    updateRemaining();
    const progress=state.durationSec?Math.max(0,Math.min(1,1-state.remainingSec/state.durationSec)):0;
    const charge=Math.round(progress*100);
    const reactor=REACTORS.find(r=>r.id===state.reactor)||REACTORS[0];
    el('timerDisplay').textContent=formatTime(state.remainingSec);
    el('focusTimer').textContent=formatTime(state.remainingSec);
    el('chargeValue').textContent=`${charge}%`;
    el('streakValue').textContent=state.streak;
    el('interruptionsValue').textContent=state.interruptions;
    el('stabilityValue').textContent=`${state.stability}%`;
    el('stabilityBar').style.width=`${state.stability}%`;
    el('reactor').style.setProperty('--charge',`${charge}%`);
    el('reactor').classList.toggle('running',state.timerStatus==='running');
    el('reactor').classList.toggle('unstable',state.stability<70);
    el('reactor').classList.toggle('critical',state.stability<45);
    el('phaseLabel').textContent=state.phase==='work'?'РАБОЧИЙ ЦИКЛ':'ОХЛАЖДЕНИЕ';
    el('sessionTitle').textContent=state.phase==='work'?'Загрузка реактора':'Стабилизация системы';
    el('timerHint').textContent=state.phase==='work'?(state.timerStatus==='running'?'Реактор принимает твоё внимание':'Один цикл — и Вселенная станет продуктивнее'):'Пусть нейроны немного остынут';
    const isRunning=state.timerStatus==='running';
    el('startText').textContent=isRunning?'Пауза':(state.timerStatus==='paused'?'Продолжить':'Запустить');
    el('startIcon').textContent=isRunning?'Ⅱ':'▶';
    el('focusToggleButton').innerHTML=`<span>${isRunning?'Ⅱ':'▶'}</span><span>${isRunning?'Пауза':state.timerStatus==='paused'?'Продолжить':'Запустить'}</span>`;
    el('reactorEmoji').textContent=reactor.icon; el('reactorName').textContent=reactor.name; el('coreSymbol').textContent=reactor.symbol;
    el('focusReactorClone').textContent=reactor.icon;
    el('reactorName').title=reactor.name;
    el('systemStatus').textContent=isRunning?(state.phase==='work'?'Реактор активен':'Идёт охлаждение'):state.timerStatus==='paused'?'Цикл приостановлен':'Система готова';
    document.title=`${formatTime(state.remainingSec)} · Focus Reactor`;
  }
  function renderGoals(){
    const today=todayKey();
    const goals=state.goals.filter(g=>!g.date || g.date===today);
    el('goalsList').innerHTML=goals.length?goals.map(g=>{
      const done=g.progress>=g.target;
      return `<div class="goal-item ${done?'done':''}" data-goal-id="${g.id}">
        <button class="goal-check" data-goal-action="toggle">${done?'✓':''}</button>
        <div><div class="goal-name">${escapeHtml(g.name)}</div><div class="goal-meta">${g.type==='minutes'?'Минут фокуса':'Рабочих циклов'}</div></div>
        <button class="goal-progress" data-goal-action="remove">${Math.min(g.progress,g.target)} / ${g.target} ×</button>
      </div>`;
    }).join(''):'<div class="empty-state">Добавь миссию: например, зарядить реактор на 3 цикла.</div>';
  }
  function renderDaily(){
    const today=todayKey();
    const sessions=state.history.filter(h=>h.type==='work'&&todayKey(new Date(h.date))===today);
    const minutes=sessions.reduce((a,b)=>a+b.minutes,0);
    const avg=sessions.length?Math.round(sessions.reduce((a,b)=>a+b.stability,0)/sessions.length):100;
    const todayGoals=state.goals.filter(g=>!g.date||g.date===today);
    const done=todayGoals.filter(g=>g.progress>=g.target).length;
    const goalRate=todayGoals.length?Math.round(done/todayGoals.length*100):0;
    const efficiency=Math.min(100,Math.round((Math.min(minutes/120,1)*55)+(avg/100*30)+(goalRate/100*15)));
    el('todayMinutes').textContent=minutes;
    el('todayEfficiency').textContent=`${efficiency}%`;
    el('focusBar').style.width=`${Math.min(100,minutes/120*100)}%`;
    el('dailyStabilityBar').style.width=`${avg}%`;
    el('goalsBar').style.width=`${goalRate}%`;
  }
  function renderStats(){
    const today=todayKey(); const now=new Date(); const weekStart=new Date(now); weekStart.setDate(now.getDate()-6); weekStart.setHours(0,0,0,0);
    const works=state.history.filter(h=>h.type==='work');
    const todayWorks=works.filter(h=>todayKey(new Date(h.date))===today);
    const weekWorks=works.filter(h=>new Date(h.date)>=weekStart);
    const todayMin=sumMinutes(todayWorks), weekMin=sumMinutes(weekWorks);
    el('statToday').textContent=formatMinutes(todayMin); el('statTodaySessions').textContent=`${todayWorks.length} циклов`;
    el('statWeek').textContent=formatMinutes(weekMin); el('statWeekSessions').textContent=`${weekWorks.length} циклов`;
    el('statTotal').textContent=formatMinutes(state.totalFocusMinutes); el('statTotalSessions').textContent=`${state.totalSessions} циклов`;
    el('statBestStreak').textContent=state.bestStreak;
    renderDayChart(works); renderHourChart(works); renderHistory();
  }
  function sumMinutes(arr){return arr.reduce((a,b)=>a+(Number(b.minutes)||0),0)}
  function renderDayChart(works){
    const labels=['Вс','Пн','Вт','Ср','Чт','Пт','Сб']; const days=[]; const now=new Date();
    for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const key=todayKey(d);days.push({key,label:labels[d.getDay()],minutes:sumMinutes(works.filter(h=>todayKey(new Date(h.date))===key))})}
    const max=Math.max(1,...days.map(d=>d.minutes));
    el('dayChart').innerHTML=days.map(d=>`<div class="bar-col"><b>${d.minutes||''}</b><i style="height:${Math.max(2,d.minutes/max*150)}px"></i><small>${d.label}</small></div>`).join('');
    el('weekTotalBadge').textContent=formatMinutes(days.reduce((a,b)=>a+b.minutes,0));
  }
  function renderHourChart(works){
    const buckets=Array.from({length:24},(_,h)=>({h,min:0})); works.forEach(w=>{buckets[new Date(w.date).getHours()].min+=w.minutes});
    const shown=buckets.filter((_,i)=>i%2===0).map((b,i)=>({h:b.h,min:b.min+(buckets[b.h+1]?.min||0)}));
    const max=Math.max(1,...shown.map(x=>x.min));
    el('hourChart').innerHTML=shown.map(x=>`<div class="hour-block"><i style="height:${Math.max(3,x.min/max*112)}px"></i><small>${String(x.h).padStart(2,'0')}</small></div>`).join('');
    const best=shown.reduce((a,b)=>b.min>a.min?b:a,{h:0,min:0}); el('bestHourBadge').textContent=best.min?`${String(best.h).padStart(2,'0')}:00–${String(best.h+2).padStart(2,'0')}:00`:'—';
  }
  function renderHistory(){
    const items=state.history.slice(0,10);
    el('historyList').innerHTML=items.length?items.map(h=>{
      const d=new Date(h.date); const title=h.type==='work'?'Рабочий цикл':'Охлаждение'; const icon=h.type==='work'?'⚛️':'❄️';
      return `<div class="history-item"><div class="history-icon">${icon}</div><div><b>${title}</b><small>${d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}, ${d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}${h.type==='work'?` · стабильность ${h.stability}%`:''}</small></div><span class="history-duration">${h.minutes} мин</span></div>`;
    }).join(''):'<div class="empty-state">История появится после первого завершённого цикла.</div>';
  }
  function renderAchievements(){
    checkAchievements(false);
    el('achievementCount').textContent=`${state.unlockedAchievements.length} / ${ACHIEVEMENTS.length}`;
    el('achievementsGrid').innerHTML=ACHIEVEMENTS.map(a=>{
      const unlocked=state.unlockedAchievements.includes(a.id);
      return `<article class="achievement-card glass ${unlocked?'unlocked':'locked'}"><span class="achievement-status">${unlocked?'ОТКРЫТО':'ЗАКРЫТО'}</span><div class="achievement-icon">${a.icon}</div><h3>${a.title}</h3><p>${a.desc}</p></article>`;
    }).join('');
  }
  function renderSettings(){
    const theme=THEMES.find(t=>t.id===state.theme)||THEMES[0]; const sound=SOUNDS.find(s=>s.id===state.sound)||SOUNDS[0]; const reactor=REACTORS.find(r=>r.id===state.reactor)||REACTORS[0];
    el('currentThemeName').textContent=theme.name; el('currentSoundName').textContent=sound.name; el('currentReactorName').textContent=reactor.name;
    el('customModeLabel').textContent=`${state.customWork} / ${state.customBreak} минут`;
    el('autoBreakToggle').checked=state.autoBreak; el('autoLockToggle').checked=state.autoLock; el('hapticsToggle').checked=state.haptics;
  }

  function progressGoals(minutes){
    state.goals.forEach(g=>{
      if(g.date && g.date!==todayKey()) return;
      const wasDone=g.progress>=g.target;
      g.progress+=g.type==='minutes'?minutes:1;
      const isDone=g.progress>=g.target;
      if(!wasDone&&isDone){state.completedGoals+=1; toast(`Миссия выполнена: ${g.name}`)}
    });
  }
  function handleGoalClick(e){
    const item=e.target.closest('[data-goal-id]'); const action=e.target.closest('[data-goal-action]')?.dataset.goalAction; if(!item||!action)return;
    const goal=state.goals.find(g=>g.id===item.dataset.goalId); if(!goal)return;
    if(action==='remove'){state.goals=state.goals.filter(g=>g.id!==goal.id);}
    if(action==='toggle'){
      const wasDone=goal.progress>=goal.target;
      goal.progress=wasDone?0:goal.target;
      if(!wasDone)state.completedGoals+=1;
    }
    saveState();renderAll();haptic();
  }
  function checkAchievements(notify=true){
    let newly=null;
    ACHIEVEMENTS.forEach(a=>{if(!state.unlockedAchievements.includes(a.id)&&a.test(state)){state.unlockedAchievements.push(a.id); if(!newly)newly=a;}});
    if(newly){saveState();if(notify)haptic([30,40,30,40,80]);}
    return newly;
  }

  function openModal(title,eyebrow,content){el('modalTitle').textContent=title;el('modalEyebrow').textContent=eyebrow;el('modalContent').innerHTML=content;el('modal').classList.add('open');el('modal').setAttribute('aria-hidden','false')}
  function closeModal(){el('modal').classList.remove('open');el('modal').setAttribute('aria-hidden','true')}
  function openThemeModal(){
    openModal('Выбери атмосферу','ВИЗУАЛЬНАЯ ТЕМА',`<div class="choice-grid">${THEMES.map(t=>`<button class="choice-card ${state.theme===t.id?'active':''}" data-theme-choice="${t.id}"><div class="choice-icon">${t.icon}</div><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>`);
    $$('[data-theme-choice]',el('modalContent')).forEach(b=>b.onclick=()=>{state.theme=b.dataset.themeChoice;applyTheme();saveState();renderSettings();openThemeModal();haptic()});
  }
  function openReactorModal(){
    openModal('Коллекция реакторов','ЯДРА И СИНГУЛЯРНОСТИ',`<div class="choice-grid">${REACTORS.map(r=>{const unlocked=state.bestStreak>=r.need;return `<button class="choice-card ${state.reactor===r.id?'active':''}" data-reactor-choice="${r.id}" ${unlocked?'':'disabled'}><div class="choice-icon">${unlocked?r.icon:'🔒'}</div><b>${r.name}</b><small>${unlocked?r.desc:`Нужна лучшая серия: ${r.need}`}</small></button>`}).join('')}</div>`);
    $$('[data-reactor-choice]',el('modalContent')).forEach(b=>b.onclick=()=>{if(b.disabled)return;state.reactor=b.dataset.reactorChoice;saveState();renderAll();closeModal();haptic([10,20,10])});
  }
  function openSoundModal(){
    openModal('Звуковая среда','ФОНОВЫЕ ЗВУКИ',`<div class="choice-grid">${SOUNDS.map(s=>`<button class="choice-card ${state.sound===s.id?'active':''}" data-sound-choice="${s.id}"><div class="choice-icon">${s.icon}</div><b>${s.name}</b><small>${s.id==='off'?'Полная тишина':'Генерируется локально, без загрузки аудио'}</small></button>`).join('')}</div>`);
    $$('[data-sound-choice]',el('modalContent')).forEach(b=>b.onclick=()=>{setSound(b.dataset.soundChoice);openSoundModal();});
  }
  function openCustomModeModal(){
    openModal('Свой рабочий цикл','КАЛИБРОВКА',`<form id="customModeForm" class="form-grid"><div class="form-field"><label>ФОКУС, МИНУТЫ</label><input name="work" type="number" min="1" max="240" value="${state.customWork}" required></div><div class="form-field"><label>ПЕРЕРЫВ, МИНУТЫ</label><input name="break" type="number" min="1" max="90" value="${state.customBreak}" required></div><button class="primary-control form-submit">Сохранить режим</button></form>`);
    el('customModeForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);state.customWork=Math.max(1,Math.min(240,Number(fd.get('work'))));state.customBreak=Math.max(1,Math.min(90,Number(fd.get('break'))));saveState();selectMode('custom');closeModal();toast('Собственный режим сохранён')};
  }
  function openGoalModal(){
    openModal('Новая миссия','БЛОК ЦЕЛИ',`<form id="goalForm" class="form-grid"><div class="form-field"><label>НАЗВАНИЕ</label><input name="name" maxlength="48" placeholder="Написать главу диплома" required></div><div class="form-field"><label>ТИП ЦЕЛИ</label><select name="type"><option value="sessions">Рабочие циклы</option><option value="minutes">Минуты фокуса</option></select></div><div class="form-field"><label>ЗНАЧЕНИЕ</label><input name="target" type="number" min="1" max="999" value="3" required></div><button class="primary-control form-submit">Добавить миссию</button></form>`);
    el('goalForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);state.goals.push({id:cryptoId(),name:String(fd.get('name')).trim(),type:fd.get('type'),target:Number(fd.get('target')),progress:0,date:todayKey()});saveState();renderAll();closeModal();toast('Миссия добавлена')};
  }

  function applyTheme(){document.body.dataset.theme=state.theme;const color=getComputedStyle(document.body).getPropertyValue('--bg').trim();document.querySelector('meta[name="theme-color"]').setAttribute('content',color||'#070a12')}
  function cycleSound(){const i=SOUNDS.findIndex(s=>s.id===state.sound);setSound(SOUNDS[(i+1)%SOUNDS.length].id)}
  function setSound(id){state.sound=id;saveState();stopSound();if(id!=='off')startSound(id);renderSettings();const s=SOUNDS.find(x=>x.id===id);el('soundToggle').textContent=s.icon;toast(`Звук: ${s.name}`);haptic()}
  function applySettingsUI(){const s=SOUNDS.find(x=>x.id===state.sound)||SOUNDS[0];el('soundToggle').textContent=s.icon;if(state.sound!=='off')startSound(state.sound)}
  function getAudioCtx(){if(!audio.ctx)audio.ctx=new (window.AudioContext||window.webkitAudioContext)();if(audio.ctx.state==='suspended')audio.ctx.resume();return audio.ctx}
  function stopSound(){clearInterval(audio.interval);audio.interval=null;audio.nodes.forEach(n=>{try{n.stop?.();n.disconnect?.()}catch{}});audio.nodes=[]}
  function createNoise(ctx,volume=.03,filterFreq=1200){
    const len=ctx.sampleRate*2,buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
    const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=filterFreq;const gain=ctx.createGain();gain.gain.value=volume;src.connect(filter).connect(gain).connect(ctx.destination);src.start();audio.nodes.push(src,filter,gain);return {src,filter,gain};
  }
  function startSound(id){
    try{const ctx=getAudioCtx();stopSound();if(id==='noise')createNoise(ctx,.025,5000);if(id==='rain'){const n=createNoise(ctx,.035,1800);audio.interval=setInterval(()=>{n.filter.frequency.setTargetAtTime(900+Math.random()*1800,ctx.currentTime,.7)},1800)}if(id==='engine'){const osc=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),lfoGain=ctx.createGain();osc.type='sine';osc.frequency.value=58;gain.gain.value=.025;lfo.frequency.value=.12;lfoGain.gain.value=6;lfo.connect(lfoGain).connect(osc.frequency);osc.connect(gain).connect(ctx.destination);osc.start();lfo.start();audio.nodes.push(osc,gain,lfo,lfoGain)}if(id==='forest'){createNoise(ctx,.012,2200);audio.interval=setInterval(()=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=900+Math.random()*1000;o.type='sine';g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(.018,ctx.currentTime+.03);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.35);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+.4)},1600+Math.random()*1800)}}catch{state.sound='off';saveState()}
  }

  function openFocusMode(){el('focusOverlay').classList.add('open');el('focusOverlay').setAttribute('aria-hidden','false');document.documentElement.requestFullscreen?.().catch(()=>{});haptic()}
  function closeFocusMode(){el('focusOverlay').classList.remove('open');el('focusOverlay').setAttribute('aria-hidden','true');if(document.fullscreenElement)document.exitFullscreen?.();}
  function lockControls(){el('lockOverlay').classList.add('open');el('lockOverlay').setAttribute('aria-hidden','false');haptic([15,25,15])}
  function unlockControls(){el('lockOverlay').classList.remove('open');el('lockOverlay').setAttribute('aria-hidden','true');haptic([10,20,10])}
  function bindUnlockHold(){
    const btn=el('unlockHoldButton');
    const start=e=>{e.preventDefault();btn.classList.add('holding');clearTimeout(unlockTimer);unlockTimer=setTimeout(()=>{btn.classList.remove('holding');unlockControls()},1200)};
    const cancel=()=>{clearTimeout(unlockTimer);btn.classList.remove('holding')};
    btn.addEventListener('pointerdown',start);btn.addEventListener('pointerup',cancel);btn.addEventListener('pointercancel',cancel);btn.addEventListener('pointerleave',cancel);
  }

  async function installApp(){
    if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;return}
    const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
    openModal('Установка приложения','PWA НА ГЛАВНОМ ЭКРАНЕ',isiOS?`<div class="install-steps"><div class="install-step"><span>1</span><div><b>Открой меню «Поделиться»</b><p>Кнопка с квадратом и стрелкой в Safari.</p></div></div><div class="install-step"><span>2</span><div><b>Выбери «На экран Домой»</b><p>При необходимости прокрути список действий.</p></div></div><div class="install-step"><span>3</span><div><b>Нажми «Добавить»</b><p>Focus Reactor откроется как отдельное приложение.</p></div></div></div>`:`<div class="install-steps"><div class="install-step"><span>1</span><div><b>Открой меню браузера</b><p>Найди пункт «Установить приложение» или «Добавить на главный экран».</p></div></div><div class="install-step"><span>2</span><div><b>Подтверди установку</b><p>Приложение продолжит работать локально и офлайн.</p></div></div></div>`);
  }

  function exportReport(){
    const data=buildReport();
    const html=`<!doctype html><meta charset="utf-8"><title>Focus Reactor Report</title><style>body{font:16px system-ui;max-width:760px;margin:40px auto;padding:0 20px;color:#15211d}h1{font-size:42px}section{padding:18px;border:1px solid #ddd;border-radius:18px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.box{background:#f4f6f5;padding:14px;border-radius:12px}</style><h1>Focus Reactor Report</h1><p>Сформирован: ${new Date().toLocaleString('ru-RU')}</p><section class="grid"><div class="box"><b>Всего фокуса</b><br>${formatMinutes(data.totalMinutes)}</div><div class="box"><b>Циклы</b><br>${data.sessions}</div><div class="box"><b>Лучшая серия</b><br>${data.bestStreak}</div><div class="box"><b>Достижения</b><br>${data.achievements}/${ACHIEVEMENTS.length}</div></section><section><h2>Последние циклы</h2>${data.recent.map(x=>`<p>${new Date(x.date).toLocaleString('ru-RU')} — ${x.minutes} мин, стабильность ${x.stability}%</p>`).join('')||'<p>Нет данных</p>'}</section>`;
    downloadBlob(html,'focus-reactor-report.html','text/html');toast('HTML-отчёт готов');
  }
  function buildReport(){return{totalMinutes:state.totalFocusMinutes,sessions:state.totalSessions,bestStreak:state.bestStreak,achievements:state.unlockedAchievements.length,recent:state.history.filter(h=>h.type==='work').slice(0,20)}}
  function downloadBackup(){downloadBlob(JSON.stringify(state,null,2),`focus-reactor-backup-${todayKey()}.json`,'application/json');toast('Резервная копия сохранена')}
  function downloadBlob(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
  async function importBackup(e){
    const file=e.target.files?.[0];if(!file)return;
    try{const data=JSON.parse(await file.text());state=normalizeState({...defaultState(),...data});saveState();applyTheme();stopSound();applySettingsUI();renderAll();toast('Данные восстановлены')}catch{toast('Не удалось прочитать файл')}finally{e.target.value=''}
  }
  function confirmResetData(){
    openModal('Сбросить лабораторию?','ОПАСНАЯ ОПЕРАЦИЯ',`<p style="color:var(--muted);font-size:12px;line-height:1.6">Будут удалены цели, статистика, серии и достижения. Темы и настройки тоже вернутся к исходным.</p><button id="confirmReset" class="primary-control form-submit" style="background:var(--danger);color:white">Удалить все данные</button>`);
    el('confirmReset').onclick=()=>{stopSound();state=defaultState();saveState();applyTheme();applySettingsUI();renderAll();closeModal();toast('Лаборатория очищена')};
  }
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function registerServiceWorker(){if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}

  init();
})();
