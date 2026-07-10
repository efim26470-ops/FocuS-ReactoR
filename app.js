(() => {
  'use strict';

  const STORAGE_KEY = 'focus-reactor-v2';
  const LEGACY_KEY = 'focus-reactor-v1';
  const BACKUP_KEY = 'focus-reactor-auto-backups-v2';
  const VERSION = 2;

  const MODES = [
    { id:'classic', name:'25 / 5', work:25, break:5, icon:'⚡', type:'countdown', desc:'Классический рабочий цикл' },
    { id:'long', name:'50 / 10', work:50, break:10, icon:'◈', type:'countdown', desc:'Длинный устойчивый цикл' },
    { id:'deep', name:'Глубокая', work:90, break:20, icon:'⬢', type:'countdown', desc:'90 минут глубокой работы' },
    { id:'flow', name:'Flow Mode', work:60, break:10, icon:'∞', type:'flow', desc:'Таймер идёт вверх без ограничения' },
    { id:'boss', name:'Boss Session', work:120, break:25, icon:'👑', type:'countdown', desc:'Одна большая цель на 90–180 минут' },
    { id:'sprint', name:'Sprint', work:15, break:3, icon:'➤', type:'countdown', desc:'Короткий интенсивный рывок' },
    { id:'night', name:'Night Shift', work:50, break:10, icon:'☾', type:'countdown', desc:'Приглушённый режим без лишних частиц' },
    { id:'custom', name:'Свой', work:40, break:10, icon:'⌁', type:'countdown', desc:'Собственная длительность' }
  ];

  const THEMES = [
    {id:'oled',name:'OLED Black',icon:'◉',style:'precision',desc:'Абсолютный чёрный и холодное ядро'},
    {id:'nuclear',name:'Nuclear Green',icon:'☢',style:'precision',desc:'Зелёный свет промышленного реактора'},
    {id:'soviet',name:'Soviet Control Room',icon:'★',style:'industrial',desc:'Латунь, приборы и строгая панель'},
    {id:'terminal',name:'Retro Terminal',icon:'>_',style:'terminal',desc:'Моноширинный зелёный терминал'},
    {id:'cyberpunk',name:'Cyberpunk Reactor',icon:' neon ',style:'angular',desc:'Бирюзовый неон и магента'},
    {id:'arctic',name:'Arctic Laboratory',icon:'❄',style:'soft',desc:'Светлая ледяная лаборатория'},
    {id:'mars',name:'Mars Colony',icon:'♂',style:'industrial',desc:'Пыльная марсианская станция'},
    {id:'ocean',name:'Deep Ocean',icon:'≈',style:'fluid',desc:'Глубоководный биореактор'},
    {id:'solar',name:'Solar Core',icon:'☀',style:'warm',desc:'Горячая солнечная плазма'},
    {id:'quantum',name:'Quantum Purple',icon:'⌘',style:'soft',desc:'Фиолетовая квантовая аномалия'},
    {id:'paper',name:'Paper Laboratory',icon:'▤',style:'paper',desc:'Бумажная ретрофутуристическая схема'},
    {id:'minimal',name:'Minimal White',icon:'○',style:'minimal',desc:'Чистый белый интерфейс'},
    {id:'industrial',name:'Industrial Yellow',icon:'⚠',style:'industrial',desc:'Жёлтая разметка и заводская панель'},
    {id:'redalert',name:'Red Alert',icon:'!',style:'angular',desc:'Красный аварийный протокол'},
    {id:'cozy',name:'Cozy Night Lab',icon:'☕',style:'soft',desc:'Тёплая ночная лаборатория'},
    {id:'void',name:'Cosmic Void',icon:'✦',style:'precision',desc:'Космическая пустота и мягкий неон'},
    {id:'toxic',name:'Toxic Laboratory',icon:'🧪',style:'precision',desc:'Кислотный экспериментальный сектор'},
    {id:'sakura',name:'Sakura Singularity',icon:'✿',style:'soft',desc:'Розовый квантовый сад'},
    {id:'arcade',name:'Arcade Collider',icon:'👾',style:'terminal',desc:'Неоновый аркадный коллайдер'},
    {id:'gameboy',name:'Game Boy',icon:'▣',style:'terminal',desc:'Четыре оттенка карманной науки',locked:'research'},
    {id:'mac1984',name:'Macintosh 1984',icon:'⌘',style:'retro',desc:'Чёрно-белое окно старой лаборатории',locked:'research'},
    {id:'win95',name:'Windows 95 Lab',icon:'▦',style:'retro',desc:'Серая панель и бирюзовый рабочий стол',locked:'research'},
    {id:'cartoon',name:'Cartoon Reactor',icon:'✨',style:'cartoon',desc:'Мягкие формы и забавное ядро',locked:'contract'},
    {id:'anime',name:'Anime Control Room',icon:'☆',style:'anime',desc:'Пастельный командный центр',locked:'contract'}
  ];

  const REACTORS = [
    {id:'zero',name:'Нулевое ядро',icon:'⚛️',symbol:'⚛',desc:'Надёжный стартовый реактор',unlock:()=>true},
    {id:'plasma',name:'Плазменный цветок',icon:'🌺',symbol:'✺',desc:'Любит чистые серии без пауз',unlock:s=>s.bestCleanStreak>=3},
    {id:'quantum',name:'Квантовый пончик',icon:'🍩',symbol:'◉',desc:'Стабилизирует длинные циклы',unlock:s=>operatorLevel(s.xp)>=4},
    {id:'frog',name:'Лягушачий синтезатор',icon:'🐸',symbol:'☢',desc:'Серьёзная наука с несерьёзным лицом',unlock:s=>operatorLevel(s.xp)>=6},
    {id:'sun',name:'Карманное солнце',icon:'🌞',symbol:'☀',desc:'Выдаёт больше энергии длинным сессиям',unlock:s=>operatorLevel(s.xp)>=8},
    {id:'cat',name:'Кот-коллайдер',icon:'🐈',symbol:'✦',desc:'Физика не объясняет, почему он мурчит',unlock:s=>operatorLevel(s.xp)>=10},
    {id:'cryo',name:'Криоядро «Мороз»',icon:'🧊',symbol:'❄',desc:'Открывается охлаждающим комплексом',unlock:s=>roomUnlocked('cooling',s)},
    {id:'singularity',name:'Сингулярность FR-X',icon:'🕳️',symbol:'●',desc:'Награда за особый недельный контракт',unlock:s=>s.unlockedAssets.reactors.includes('singularity')}
  ];

  const SOUNDS = [
    {id:'off',name:'Выключен',icon:'◖',desc:'Тишина лаборатории'},
    {id:'rain',name:'Космический дождь',icon:'🌧️',desc:'Мягкий фильтрованный шум'},
    {id:'engine',name:'Гул реактора',icon:'⚙️',desc:'Низкочастотный ровный тон'},
    {id:'noise',name:'Белый шум',icon:'〰️',desc:'Широкополосный фон'},
    {id:'forest',name:'Квантовый лес',icon:'🌲',desc:'Шум и редкие электронные птицы'},
    {id:'cafe',name:'Орбитальное кафе',icon:'☕',desc:'Тихий гул и редкие сигналы',locked:true},
    {id:'oceanSound',name:'Глубокий океан',icon:'🌊',desc:'Медленные волны низких частот',locked:true},
    {id:'vinyl',name:'Виниловая лаборатория',icon:'💿',desc:'Тёплый шум и лёгкие щелчки',locked:true},
    {id:'scanner',name:'Сканер сектора',icon:'📡',desc:'Редкие технологичные импульсы',locked:true}
  ];

  const PROFILE_FRAMES = [
    {id:'standard',name:'Стандартная',icon:'○'},
    {id:'spectrum',name:'Спектральная рамка',icon:'◉'},
    {id:'gold',name:'Золотой оператор',icon:'✦'},
    {id:'hazard',name:'Аварийная разметка',icon:'⚠'}
  ];
  const CORE_EFFECTS = [
    {id:'standard',name:'Стандартная орбита',icon:'⚛'},
    {id:'sparks',name:'Ионные искры',icon:'✧'},
    {id:'plasma',name:'Плазменный шлейф',icon:'◌'},
    {id:'orbital',name:'Орбитальный рой',icon:'◎'},
    {id:'aurora',name:'Полярное сияние',icon:'⌇'}
  ];

  const SMART_BREAKS = [
    {id:'breath',icon:'◉',title:'Дыхание 4–4',desc:'Вдохни на четыре счёта и выдохни на четыре. Повтори шесть раз.'},
    {id:'eyes',icon:'👁️',title:'Разгрузка глаз',desc:'20 секунд смотри на самый дальний объект, который видишь.'},
    {id:'neck',icon:'↻',title:'Разминка шеи',desc:'Медленно поверни голову влево и вправо, затем опусти плечи.'},
    {id:'water',icon:'💧',title:'Контроль жидкости',desc:'Выпей стакан воды. Реакторы и операторы нуждаются в охлаждении.'},
    {id:'walk',icon:'🚶',title:'Короткая прогулка',desc:'Пройди хотя бы 100 шагов без телефона в руках.'},
    {id:'phone',icon:'📵',title:'Без телефона',desc:'Положи телефон экраном вниз и ничего не открывай до конца перерыва.'},
    {id:'stretch',icon:'↕',title:'Растяжка оператора',desc:'Потянись вверх, выпрями спину и сделай пять медленных наклонов.'}
  ];

  const ROOMS = [
    {id:'reactor',name:'Реакторный зал',icon:'⚛️',color:'#69ffe0',need:0,desc:'Основной таймер, телеметрия и управление ядром.',benefit:'Базовая система фокуса и живой реактор.'},
    {id:'control',name:'Центр управления',icon:'🎛️',color:'#7f93ff',need:30,desc:'Режимы, профили сессий и автоматизация.',benefit:'Усиливает пользовательские режимы и автозапуск.'},
    {id:'cooling',name:'Охлаждающий комплекс',icon:'❄️',color:'#62dfff',need:80,desc:'Криоконтур и аварийное охлаждение.',benefit:'Открывает криореактор и дополнительный заряд охлаждения.'},
    {id:'archive',name:'Архив исследований',icon:'🗄️',color:'#c89cff',need:160,desc:'Расширенная аналитика и долгосрочные данные.',benefit:'Открывает глубокие выводы по темам и звукам.'},
    {id:'sound',name:'Генератор фоновых шумов',icon:'🎚️',color:'#77ffb1',need:250,desc:'Синтетические звуковые среды без внешних файлов.',benefit:'Позволяет исследовать новые звуки.'},
    {id:'vault',name:'Хранилище достижений',icon:'🏆',color:'#ffd15b',need:360,desc:'Многоуровневые и секретные награды.',benefit:'Повышает награды за новые уровни достижений.'},
    {id:'experimental',name:'Экспериментальный сектор',icon:'🧬',color:'#ff77e1',need:520,desc:'Квантовый резонанс и редкие эффекты ядра.',benefit:'Открывает шанс квантового резонанса.'},
    {id:'bunker',name:'Аварийный бункер',icon:'🛡️',color:'#ff775d',need:750,desc:'Протокол спасения критических сессий.',benefit:'Даёт ещё одно аварийное охлаждение в каждом цикле.'}
  ];

  const RESEARCH = [
    {id:'efficiency',name:'Эффективность',icon:'⚡',desc:'Больше наград за фактическое время',nodes:[
      {id:'yield',name:'Выход исследований',max:3,costs:[35,75,135],desc:l=>`+${(l+1)*10}% очков исследований за сессию`},
      {id:'longCharge',name:'Длинный заряд',max:3,costs:[45,90,160],desc:l=>`+${(l+1)*8} энергии за сессии длиннее 45 минут`},
      {id:'precision',name:'Точная калибровка',max:3,costs:[55,105,180],desc:l=>`+${(l+1)*5}% наград по контрактам`}
    ]},
    {id:'stability',name:'Стабильность',icon:'💎',desc:'Меньше штрафов и сильнее охлаждение',nodes:[
      {id:'dampers',name:'Гасители импульсов',max:3,costs:[40,85,150],desc:l=>`Штраф за отвлечение меньше на ${(l+1)*2}%`},
      {id:'coolant',name:'Криосмесь',max:3,costs:[50,100,175],desc:l=>`Охлаждение сильнее на ${(l+1)*5}°C`},
      {id:'recovery',name:'Восстановление',max:3,costs:[45,90,165],desc:l=>`Умный перерыв даёт +${5+(l+1)*2}% стабильности`}
    ]},
    {id:'automation',name:'Автоматизация',icon:'⚙️',desc:'Меньше рутины между циклами',nodes:[
      {id:'autoProtocol',name:'Автопротокол',max:2,costs:[55,120],desc:l=>l===0?'Перерыв готовится автоматически':'Следующий режим запоминается для проекта'},
      {id:'backupDepth',name:'Глубина автокопий',max:3,costs:[45,90,150],desc:l=>`Хранить ${5+(l+1)*2} локальных автокопий`},
      {id:'coolingCharges',name:'Резервный контур',max:2,costs:[80,170],desc:l=>`+${l+1} применение охлаждения за сессию`}
    ]},
    {id:'visual',name:'Визуал',icon:'✦',desc:'Темы, частицы и эффекты ядра',nodes:[
      {id:'retroThemes',name:'Архив интерфейсов',max:3,costs:[60,125,210],desc:l=>['Открывает Game Boy','Открывает Macintosh 1984','Открывает Windows 95 Lab'][l]},
      {id:'coreEffects',name:'Эффекты ядра',max:3,costs:[50,105,180],desc:l=>`Интенсивность частиц: уровень ${l+1}`},
      {id:'quantumFx',name:'Квантовая оптика',max:2,costs:[100,220],desc:l=>`Шанс резонанса +${(l+1)*4}%`}
    ]},
    {id:'sound',name:'Звук',icon:'♫',desc:'Новые синтетические фоновые среды',nodes:[
      {id:'soundLab',name:'Звуковая лаборатория',max:3,costs:[60,125,210],desc:l=>['Открывает Орбитальное кафе','Открывает Глубокий океан','Открывает Виниловую лабораторию'][l]},
      {id:'scannerSound',name:'Секторный сканер',max:1,costs:[145],desc:()=> 'Открывает звук Сканер сектора'},
      {id:'soundReward',name:'Акустическая дисциплина',max:3,costs:[45,95,165],desc:l=>`+${(l+1)*3}% опыта при работе со звуком`}
    ]},
    {id:'discipline',name:'Дисциплина',icon:'🎯',desc:'Цели, контракты и спасение серий',nodes:[
      {id:'goalSlots',name:'Слоты целей',max:3,costs:[40,80,145],desc:l=>`+${l+1} ежедневный слот цели`},
      {id:'contractBonus',name:'Контрактный бонус',max:3,costs:[55,110,190],desc:l=>`+${(l+1)*8}% энергии и опыта за контракты`},
      {id:'salvage',name:'Спасение смены',max:1,costs:[220],desc:()=> 'Первое критическое завершение дня не обрывает чистую серию'}
    ]}
  ];

  const ACHIEVEMENT_GROUPS = [
    {id:'clean',icon:'💎',name:'Без прерываний',desc:'Чистые сессии без пауз и отвлечений',thresholds:[1,10,50,250,1000],metric:s=>s.perfectSessions,unit:'сессий'},
    {id:'deep',icon:'⬢',name:'Глубокая работа',desc:'Фактическое время в режимах Deep, Boss и длинных циклах',thresholds:[5,25,100,500],metric:s=>Math.floor(s.deepWorkSeconds/3600),unit:'часов'},
    {id:'series',icon:'🔥',name:'Серии дней',desc:'Дни с хотя бы одной завершённой фокус-сессией',thresholds:[3,7,14,30,100],metric:s=>s.bestDayStreak,unit:'дней'},
    {id:'operator',icon:'🏭',name:'Оператор реактора',desc:'Общее количество завершённых сессий',thresholds:[10,50,200,500,1000],metric:s=>s.totalSessions,unit:'сессий'}
  ];

  const SECRET_ACHIEVEMENTS = [
    {id:'nightStart',icon:'🌙',title:'Ночной запуск',desc:'Запусти реактор ночью'},
    {id:'fourAM',icon:'04',title:'Четвёртая смена',desc:'Заверши сессию между 04:00 и 04:59'},
    {id:'perfectStability',icon:'100',title:'Абсолютная стабильность',desc:'Заверши сессию со стабильностью 100%'},
    {id:'criticalSave',icon:'🛡️',title:'Спаситель ядра',desc:'Доведи реактор почти до аварии и охлади его'},
    {id:'exact42',icon:'42',title:'Ответ найден',desc:'Проведи ровно 42 минуты фокуса'},
    {id:'resonance',icon:'🧬',title:'Квантовый резонанс',desc:'Заверши сессию в состоянии резонанса'}
  ];

  const DAILY_CONTRACTS = [
    {id:'sessions3',icon:'⚛️',title:'Тройной запуск',desc:'Провести 3 фокус-сессии',target:3,metric:(h)=>h.length,reward:{rp:18,energy:45,xp:30}},
    {id:'minutes120',icon:'⏱️',title:'Два часа энергии',desc:'Работать 120 минут',target:120,metric:h=>sum(h,x=>x.actualSeconds)/60,reward:{rp:24,energy:60,xp:40}},
    {id:'clean1',icon:'💎',title:'Чистое ядро',desc:'Завершить цикл без пауз',target:1,metric:h=>h.filter(x=>x.clean).length,reward:{rp:22,energy:50,xp:38,asset:{type:'sound',id:'cafe'}}},
    {id:'morning',icon:'🌅',title:'Утренняя смена',desc:'Завершить сессию до 10:00',target:1,metric:h=>h.filter(x=>new Date(x.date).getHours()<10).length,reward:{rp:16,energy:45,xp:28}},
    {id:'deep',icon:'⬢',title:'Глубокое погружение',desc:'Использовать глубокий или Boss-режим',target:1,metric:h=>h.filter(x=>['deep','boss'].includes(x.modeId)).length,reward:{rp:28,energy:70,xp:50,asset:{type:'theme',id:'cartoon'}}},
    {id:'goals',icon:'🎯',title:'План выполнен',desc:'Закрыть все цели дня',target:1,metric:()=>allGoalsDone()?1:0,reward:{rp:25,energy:55,xp:45}},
    {id:'flow',icon:'∞',title:'Поймать поток',desc:'Завершить Flow-сессию длиннее 30 минут',target:1,metric:h=>h.filter(x=>x.modeId==='flow'&&x.actualSeconds>=1800).length,reward:{rp:26,energy:65,xp:45}}
  ];

  const WEEKLY_CONTRACTS = [
    {id:'minutes600',icon:'🏭',title:'Малая электростанция',desc:'Накопить 600 минут фокуса',target:600,metric:h=>sum(h,x=>x.actualSeconds)/60,reward:{rp:80,energy:220,xp:150,asset:{type:'effect',id:'aurora'}}},
    {id:'sessions12',icon:'⚡',title:'Стабильная выработка',desc:'Провести 12 сессий',target:12,metric:h=>h.length,reward:{rp:65,energy:180,xp:120}},
    {id:'clean5',icon:'💠',title:'Пять чистых циклов',desc:'Провести 5 сессий без пауз',target:5,metric:h=>h.filter(x=>x.clean).length,reward:{rp:75,energy:200,xp:140}},
    {id:'boss',icon:'👑',title:'Победа над боссом',desc:'Завершить Boss Session не короче 90 минут',target:1,metric:h=>h.filter(x=>x.modeId==='boss'&&x.actualSeconds>=5400).length,reward:{rp:95,energy:260,xp:180,asset:{type:'reactor',id:'singularity'}}},
    {id:'projects3',icon:'◫',title:'Три сектора',desc:'Поработать минимум над 3 проектами',target:3,metric:h=>new Set(h.map(x=>x.projectId).filter(Boolean)).size,reward:{rp:70,energy:190,xp:130,asset:{type:'frame',id:'spectrum'}}},
    {id:'streak3',icon:'🔥',title:'Три дня без остановки',desc:'Поддерживать серию 3 дня',target:3,metric:()=>state.dayStreak,reward:{rp:90,energy:240,xp:170,asset:{type:'theme',id:'anime'}}},
    {id:'night2',icon:'☾',title:'Ночная лаборатория',desc:'Провести 2 Night Shift-сессии',target:2,metric:h=>h.filter(x=>x.modeId==='night').length,reward:{rp:72,energy:190,xp:135}}
  ];

  const PROJECT_PRESETS = [
    {id:'study',name:'Учёба',icon:'🎓',color:'#7f93ff',targetMinutes:600,notes:'Лекции, конспекты и подготовка.'},
    {id:'work',name:'Работа',icon:'💼',color:'#ffb85c',targetMinutes:900,notes:'Основные рабочие задачи.'},
    {id:'programming',name:'Программирование',icon:'💻',color:'#63f2c5',targetMinutes:720,notes:'Код, тестирование и проекты.'},
    {id:'serbian',name:'Сербский язык',icon:'🇷🇸',color:'#ff6f7f',targetMinutes:300,notes:'Слова, грамматика и аудирование.'},
    {id:'reading',name:'Чтение',icon:'📚',color:'#c690ff',targetMinutes:240,notes:'Книги и профессиональные материалы.'},
    {id:'diploma',name:'Диплом',icon:'📑',color:'#55c8ff',targetMinutes:1200,notes:'Исследование, текст и оформление.'},
    {id:'personal',name:'Личный проект',icon:'🚀',color:'#ff80ce',targetMinutes:480,notes:'Свободный творческий проект.'}
  ];

  const defaultState = () => ({
    version:VERSION,
    modeId:'classic',customWork:40,customBreak:10,bossMinutes:120,weeklyGoalMinutes:600,
    phase:'work',durationSec:1500,remainingSec:1500,elapsedSec:0,timerStatus:'idle',endAt:null,flowStartedAt:null,sessionStartedAt:null,sessionId:null,
    interruptions:0,pauseCount:0,stabilityBase:100,coolingOffset:0,coolingUses:0,savedFromCritical:false,quantumSeed:Math.random(),nextStabilityBonus:0,
    theme:'oled',reactor:'zero',sound:'off',autoBreak:true,autoLock:false,haptics:true,wakeLock:true,
    researchPoints:0,lifetimeResearch:0,energyCurrency:0,xp:0,researchLevels:{},
    unlockedAssets:{themes:THEMES.filter(t=>!t.locked).map(t=>t.id),sounds:['off','rain','engine','noise','forest'],reactors:['zero'],frames:['standard'],effects:['standard']},profileFrame:'standard',coreEffect:'standard',
    projects:PROJECT_PRESETS.map(p=>({...p,deadline:'',createdAt:new Date().toISOString()})),activeProjectId:'programming',
    goals:[],history:[],pendingReport:null,breakTask:null,breakTaskDone:false,
    totalSessions:0,totalFocusSeconds:0,perfectSessions:0,idealSessions:0,deepWorkSeconds:0,riskySessions:0,completedGoals:0,
    dayStreak:0,bestDayStreak:0,lastFocusDate:null,cleanStreak:0,bestCleanStreak:0,
    achievementRewards:{},secretAchievements:[],contractClaims:{},
    historyProjectFilter:null,lastAutoBackupDate:null
  });

  let state = loadState();
  let ticker = null;
  let deferredInstallPrompt = null;
  let toastTimer = null;
  let unlockTimer = null;
  let wakeLockSentinel = null;
  let audio = {ctx:null,nodes:[],intervals:[]};

  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];
  const el = id=>document.getElementById(id);
  const clamp = (n,min,max)=>Math.min(max,Math.max(min,n));
  const sum = (arr,fn=x=>x)=>arr.reduce((a,x)=>a+(Number(fn(x))||0),0);
  const uid = ()=>crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function loadState(){
    try{
      const current=JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(current)return normalizeState({...defaultState(),...current});
      const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY));
      if(legacy)return normalizeState(migrateLegacy(legacy));
    }catch{}
    return defaultState();
  }

  function migrateLegacy(old){
    const next=defaultState();
    next.modeId=old.modeId||'classic';next.customWork=old.customWork||40;next.customBreak=old.customBreak||10;
    next.theme=THEMES.some(t=>t.id===old.theme)?old.theme:'void';next.reactor=old.reactor||'zero';next.sound=old.sound||'off';
    next.autoBreak=old.autoBreak!==false;next.autoLock=!!old.autoLock;next.haptics=old.haptics!==false;
    next.goals=Array.isArray(old.goals)?old.goals:[];
    next.history=(Array.isArray(old.history)?old.history:[]).map(h=>({...h,actualSeconds:Math.max(1,Math.round((h.minutes||0)*60)),projectId:'programming',theme:old.theme||'void',sound:old.sound||'off',reactor:old.reactor||'zero',clean:(h.interruptions||0)===0,pauseCount:0,reportComplete:false}));
    next.totalSessions=old.totalSessions||next.history.filter(h=>h.type==='work').length;
    next.totalFocusSeconds=Math.round((old.totalFocusMinutes||sum(next.history.filter(h=>h.type==='work'),h=>h.minutes))*60);
    next.perfectSessions=old.perfectSessions||next.history.filter(h=>h.clean).length;
    next.riskySessions=old.riskySessions||0;next.completedGoals=old.completedGoals||0;
    next.cleanStreak=old.streak||0;next.bestCleanStreak=old.bestStreak||0;
    next.secretAchievements=Array.isArray(old.unlockedAchievements)?[]:[];
    return next;
  }

  function normalizeState(s){
    const d=defaultState();
    s.version=VERSION;
    ['projects','goals','history','secretAchievements'].forEach(k=>{if(!Array.isArray(s[k]))s[k]=d[k]});
    if(!s.projects.length)s.projects=d.projects;
    s.projects=s.projects.map((p,i)=>({...PROJECT_PRESETS[i%PROJECT_PRESETS.length],...p,id:p.id||uid()}));
    if(!s.projects.some(p=>p.id===s.activeProjectId))s.activeProjectId=s.projects[0]?.id||'programming';
    s.researchLevels={...d.researchLevels,...(s.researchLevels||{})};
    s.unlockedAssets={...d.unlockedAssets,...(s.unlockedAssets||{})};
    ['themes','sounds','reactors','frames','effects'].forEach(k=>{if(!Array.isArray(s.unlockedAssets[k]))s.unlockedAssets[k]=d.unlockedAssets[k]});
    s.contractClaims=s.contractClaims||{};s.achievementRewards=s.achievementRewards||{};
    s.history=s.history.map(h=>({...h,actualSeconds:Number(h.actualSeconds)||Math.round((h.minutes||0)*60),projectId:h.projectId||s.activeProjectId,clean:h.clean??((h.interruptions||0)===0&&(h.pauseCount||0)===0)}));
    const mode=getMode(s);
    if(!Number.isFinite(s.durationSec)||s.durationSec<1)s.durationSec=(s.phase==='break'?mode.break:mode.work)*60;
    if(!Number.isFinite(s.remainingSec))s.remainingSec=s.durationSec;
    if(!Number.isFinite(s.elapsedSec))s.elapsedSec=Math.max(0,s.durationSec-s.remainingSec);
    if(s.timerStatus==='running')syncTimerObject(s);
    syncResearchUnlocks(s);
    if(!reactorUnlocked(s.reactor,s))s.reactor='zero';
    if(!themeUnlocked(s.theme,s))s.theme='oled';
    if(!soundUnlocked(s.sound,s))s.sound='off';
    if(!s.unlockedAssets.frames.includes(s.profileFrame))s.profileFrame='standard';
    if(!s.unlockedAssets.effects.includes(s.coreEffect))s.coreEffect='standard';
    return s;
  }

  function saveState({backup=false}={}){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
    if(backup)maybeAutoBackup();
  }

  function getMode(s=state){
    const base=MODES.find(m=>m.id===s.modeId)||MODES[0];
    if(base.id==='custom')return {...base,work:clamp(Number(s.customWork)||40,1,240),break:clamp(Number(s.customBreak)||10,1,90)};
    if(base.id==='boss')return {...base,work:clamp(Number(s.bossMinutes)||120,90,180)};
    return base;
  }

  function researchLevel(id,s=state){return Number(s.researchLevels[id])||0}
  function operatorLevel(xp=state.xp){return Math.max(1,Math.floor(Math.sqrt(Math.max(0,xp)/110))+1)}
  function operatorProgress(){const level=operatorLevel();const prev=(level-1)**2*110;const next=level**2*110;return{level,current:state.xp-prev,target:next-prev}}
  function roomUnlocked(id,s=state){const room=ROOMS.find(r=>r.id===id);return !!room&&s.lifetimeResearch>=room.need}
  function reactorUnlocked(id,s=state){const reactor=REACTORS.find(r=>r.id===id);return !!reactor&&(reactor.unlock(s)||s.unlockedAssets.reactors.includes(id))}
  function themeUnlocked(id,s=state){return s.unlockedAssets.themes.includes(id)}
  function soundUnlocked(id,s=state){return s.unlockedAssets.sounds.includes(id)}

  function syncResearchUnlocks(s=state){
    const retro=researchLevel('retroThemes',s);
    ['gameboy','mac1984','win95'].slice(0,retro).forEach(id=>pushUnique(s.unlockedAssets.themes,id));
    const soundLab=researchLevel('soundLab',s);
    ['cafe','oceanSound','vinyl'].slice(0,soundLab).forEach(id=>pushUnique(s.unlockedAssets.sounds,id));
    if(researchLevel('scannerSound',s)>0)pushUnique(s.unlockedAssets.sounds,'scanner');
    ['sparks','plasma','orbital'].slice(0,researchLevel('coreEffects',s)).forEach(id=>pushUnique(s.unlockedAssets.effects,id));
    if(roomUnlocked('cooling',s))pushUnique(s.unlockedAssets.reactors,'cryo');
  }
  function pushUnique(arr,value){if(!arr.includes(value))arr.push(value)}

  function todayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function weekKey(d=new Date()){
    const date=new Date(d);date.setHours(0,0,0,0);date.setDate(date.getDate()+3-((date.getDay()+6)%7));
    const week1=new Date(date.getFullYear(),0,4);return `${date.getFullYear()}-W${String(1+Math.round(((date-week1)/86400000-3+((week1.getDay()+6)%7))/7)).padStart(2,'0')}`;
  }
  function startOfDay(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);return x}
  function startOfWeek(d=new Date()){const x=startOfDay(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
  function formatTime(sec,countUp=false){const n=Math.max(0,Math.floor(sec));const h=Math.floor(n/3600),m=Math.floor((n%3600)/60),s=n%60;if(h>0)return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
  function formatDuration(sec){const n=Math.max(0,Math.round(sec));if(n<60)return `${n} сек`;const min=n/60;if(min<60)return `${Math.round(min)} мин`;const h=Math.floor(min/60),m=Math.round(min%60);return m?`${h} ч ${m} мин`:`${h} ч`}
  function formatDate(iso){return new Date(iso).toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function haptic(pattern=10){if(state.haptics&&navigator.vibrate)navigator.vibrate(pattern)}
  function toast(message){const node=el('toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),2600)}

  function init(){
    bindEvents();applyTheme();applySettingsUI();refreshTimeSensitiveData();restoreTimer();renderAll();registerServiceWorker();maybeAutoBackup();
    const params=new URLSearchParams(location.search);const initialView=params.get('view');if(['timer','lab','research','projects','stats','achievements','settings'].includes(initialView))switchView(initialView);if(params.get('action')==='focus')setTimeout(openFocusMode,180);
    if(state.pendingReport)setTimeout(openPendingReport,250);
    setInterval(()=>{if(state.timerStatus==='running'){syncTimer();renderTimer();checkTimerCompletion()}},500);
  }

  function bindEvents(){
    document.addEventListener('click',e=>{
      const view=e.target.closest('[data-view]');if(view){switchView(view.dataset.view);return}
      if(e.target.closest('[data-close-modal]'))closeModal();
    });
    el('modeStrip').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)selectMode(b.dataset.mode)});
    el('startButton').addEventListener('click',toggleTimer);el('focusToggleButton').addEventListener('click',toggleTimer);
    el('resetButton').addEventListener('click',requestResetTimer);el('finishSessionButton').addEventListener('click',requestFinishSession);
    el('interruptButton').addEventListener('click',registerInterruption);el('emergencyCoolingButton').addEventListener('click',emergencyCooling);
    el('reactorSelectButton').addEventListener('click',openReactorModal);el('activeProjectButton').addEventListener('click',openProjectSelector);
    el('themeButton').addEventListener('click',openThemeModal);el('soundToggle').addEventListener('click',cycleSound);
    el('focusModeButton').addEventListener('click',openFocusMode);el('exitFocusButton').addEventListener('click',closeFocusMode);
    el('lockButton').addEventListener('click',lockControls);bindUnlockHold();
    el('breakTaskDoneButton').addEventListener('click',completeSmartBreakTask);
    el('addGoalButton').addEventListener('click',openGoalModal);el('goalsList').addEventListener('click',handleGoalClick);
    el('dailyContracts').addEventListener('click',handleContractClick);el('weeklyContracts').addEventListener('click',handleContractClick);
    el('labMap').addEventListener('click',e=>{const b=e.target.closest('[data-room]');if(b)openRoomModal(b.dataset.room)});
    el('researchBranches').addEventListener('click',e=>{const b=e.target.closest('[data-research]');if(b)purchaseResearch(b.dataset.research)});
    el('addProjectButton').addEventListener('click',()=>openProjectForm());el('projectsGrid').addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)openProjectDetails(b.dataset.project)});
    el('exportButton').addEventListener('click',openExportModal);el('clearHistoryFilters').addEventListener('click',openHistoryFilterModal);
    el('settingsTheme').addEventListener('click',openThemeModal);el('settingsSound').addEventListener('click',openSoundModal);el('settingsReactor').addEventListener('click',openReactorModal);
    el('settingsProfileFrame').addEventListener('click',openFrameModal);el('settingsCoreEffect').addEventListener('click',openCoreEffectModal);
    el('settingsCustomMode').addEventListener('click',openCustomModeModal);el('settingsWeeklyGoal').addEventListener('click',openWeeklyGoalModal);el('installButton').addEventListener('click',installApp);
    el('backupButton').addEventListener('click',downloadBackup);el('csvButton').addEventListener('click',()=>exportCSV());el('htmlReportButton').addEventListener('click',exportHTMLReport);
    el('pdfReportButton').addEventListener('click',printPDFReport);el('statsExportButton').addEventListener('click',exportStatsOnly);el('projectExportButton').addEventListener('click',openProjectExportModal);
    el('importButton').addEventListener('click',()=>el('importFile').click());el('importFile').addEventListener('change',importBackup);el('autoBackupsButton').addEventListener('click',openAutoBackupsModal);
    el('resetDataButton').addEventListener('click',confirmResetData);
    [['autoBreak','autoBreakToggle'],['autoLock','autoLockToggle'],['haptics','hapticsToggle'],['wakeLock','wakeLockToggle']].forEach(([key,id])=>el(id).addEventListener('change',e=>{state[key]=e.target.checked;saveState();if(key==='wakeLock'&&!state.wakeLock)releaseWakeLock()}));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){restoreTimer();if(state.timerStatus==='running')requestWakeLock()}else{releaseWakeLock()}});
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e});window.addEventListener('appinstalled',()=>toast('Focus Reactor установлен'));
  }

  function switchView(name){
    $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    refreshTimeSensitiveData();renderView(name);window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderView(name){if(name==='lab')renderLab();if(name==='research')renderResearch();if(name==='projects')renderProjects();if(name==='stats')renderStats();if(name==='achievements')renderAchievements();if(name==='settings')renderSettings()}

  function selectMode(id){
    if(state.timerStatus==='running'||state.timerStatus==='paused'||state.elapsedSec>0){toast('Сначала заверши или сбрось текущую сессию');return}
    if(!MODES.some(m=>m.id===id))return;state.modeId=id;resetTimerState('work');saveState();renderAll();haptic();
  }

  function resetTimerState(phase='work'){
    const mode=getMode();state.phase=phase;state.durationSec=(phase==='break'?mode.break:mode.work)*60;state.remainingSec=state.durationSec;state.elapsedSec=0;state.timerStatus='idle';state.endAt=null;state.flowStartedAt=null;state.sessionStartedAt=null;state.sessionId=null;
    state.interruptions=0;state.pauseCount=0;state.stabilityBase=clamp(100+state.nextStabilityBonus,0,120);if(phase==='work')state.nextStabilityBonus=0;state.coolingOffset=0;state.coolingUses=0;state.savedFromCritical=false;state.quantumSeed=Math.random();
  }

  function toggleTimer(){
    if(state.pendingReport){openPendingReport();return}
    if(state.timerStatus==='running')pauseTimer();else startTimer();
  }

  function startTimer(){
    if(state.phase==='work'&&!state.sessionId){state.sessionId=uid();state.sessionStartedAt=Date.now();state.stabilityBase=clamp(100+state.nextStabilityBonus,0,120);state.nextStabilityBonus=0;checkStartSecrets()}
    if(state.phase==='break'&&!state.breakTask)assignBreakTask();
    const mode=getMode();state.timerStatus='running';
    if(state.phase==='work'&&mode.type==='flow')state.flowStartedAt=Date.now()-state.elapsedSec*1000;else state.endAt=Date.now()+state.remainingSec*1000;
    saveState();startTicker();requestWakeLock();startSelectedSound();renderAll();haptic([8,28,8]);if(state.autoLock)setTimeout(lockControls,500);
  }

  function pauseTimer(){
    syncTimer();state.timerStatus='paused';state.endAt=null;state.flowStartedAt=null;
    if(state.phase==='work'&&state.elapsedSec>=15){state.pauseCount+=1;state.stabilityBase=clamp(state.stabilityBase-Math.max(2,6-researchLevel('dampers')),0,100);toast('Пауза повысила нестабильность')}
    clearInterval(ticker);ticker=null;releaseWakeLock();saveState();renderAll();haptic(14);
  }

  function startTicker(){clearInterval(ticker);ticker=setInterval(()=>{syncTimer();renderTimer();checkTimerCompletion()},500)}
  function syncTimer(){syncTimerObject(state);const telemetry=getTelemetry();state.lastTelemetry=telemetry}
  function syncTimerObject(s){
    if(s.timerStatus!=='running')return;const mode=getMode(s);const now=Date.now();
    if(s.phase==='work'&&mode.type==='flow'){s.elapsedSec=Math.max(0,Math.floor((now-(s.flowStartedAt||now))/1000));s.remainingSec=0}
    else if(s.endAt){s.remainingSec=Math.max(0,Math.ceil((s.endAt-now)/1000));s.elapsedSec=Math.max(0,s.durationSec-s.remainingSec)}
  }
  function restoreTimer(){
    if(state.timerStatus==='running'){syncTimer();checkTimerCompletion();if(state.timerStatus==='running')startTicker()}
    renderAll();
  }
  function checkTimerCompletion(){
    const mode=getMode();if(state.timerStatus!=='running')return;
    if(!(state.phase==='work'&&mode.type==='flow')&&state.remainingSec<=0){clearInterval(ticker);ticker=null;releaseWakeLock();if(state.phase==='work')commitSessionBase('timer');else finishBreakPhase(state.breakTaskDone)}
  }

  function requestResetTimer(){
    if(state.elapsedSec<15&&state.timerStatus==='idle'){resetTimerState('work');saveState();renderAll();toast('Цикл перезапущен');return}
    openModal('Сбросить текущий цикл?','НЕСОХРАНЁННАЯ СЕССИЯ',`<p style="color:var(--muted);font-size:11px;line-height:1.6">Фактическое время ${formatDuration(state.elapsedSec)} не попадёт в статистику.</p><div class="button-row"><button id="discardSession" class="primary-control form-submit" style="background:var(--danger);color:white">Сбросить без сохранения</button></div>`);
    el('discardSession').onclick=()=>{clearInterval(ticker);ticker=null;releaseWakeLock();resetTimerState('work');saveState();closeModal();renderAll();toast('Сессия удалена')};
  }

  function requestFinishSession(){
    if(state.phase==='break'){openBreakFinishModal();return}
    syncTimer();if(state.elapsedSec<1){toast('Реактор ещё не выработал энергию');return}
    if(state.elapsedSec<60){openModal('Очень короткая сессия','ПОДТВЕРЖДЕНИЕ',`<p style="color:var(--muted);font-size:11px;line-height:1.6">В статистику попадёт фактическое время: <b>${formatDuration(state.elapsedSec)}</b>.</p><button id="confirmShortFinish" class="primary-control form-submit">Завершить и сохранить</button>`);el('confirmShortFinish').onclick=()=>{closeModal();commitSessionBase('manual')}}else commitSessionBase('manual');
  }

  function commitSessionBase(reason){
    if(state.pendingReport)return openPendingReport();syncTimer();clearInterval(ticker);ticker=null;releaseWakeLock();
    const actualSeconds=Math.max(1,Math.round(state.elapsedSec));const telemetry=getTelemetry();const now=new Date();const mode=getMode();const clean=state.interruptions===0&&state.pauseCount===0;
    const perfect=clean&&telemetry.stability>=95;const ideal=perfect&&actualSeconds>=1200&&Math.random()<.12;const quantum=telemetry.stateId==='quantum';
    const record={id:uid(),type:'work',date:now.toISOString(),startedAt:state.sessionStartedAt?new Date(state.sessionStartedAt).toISOString():now.toISOString(),actualSeconds,projectId:state.activeProjectId,modeId:state.modeId,modeName:mode.name,stability:Math.round(telemetry.stability),temperature:Math.round(telemetry.temperature),pressure:Number(telemetry.pressure.toFixed(2)),energy:Math.round(telemetry.energy),interruptions:state.interruptions,pauseCount:state.pauseCount,clean,perfect,ideal,quantum,manual:reason==='manual',theme:state.theme,sound:state.sound,reactor:state.reactor,reportComplete:false,done:'',focusEase:0,energyLevel:0,mood:'',note:''};
    state.history.unshift(record);state.history=state.history.slice(0,2500);state.totalSessions+=1;state.totalFocusSeconds+=actualSeconds;if(perfect)state.perfectSessions+=1;if(ideal)state.idealSessions+=1;if(telemetry.stability<50)state.riskySessions+=1;
    if(['deep','boss'].includes(state.modeId)||actualSeconds>=3000)state.deepWorkSeconds+=actualSeconds;
    updateDayStreak(now);updateCleanStreak(clean,telemetry);progressGoals(record);
    const minutes=actualSeconds/60;let rp=Math.max(1,Math.floor(minutes/5));rp=Math.round(rp*(1+researchLevel('yield')*.1));if(perfect)rp+=5;if(ideal)rp+=12;if(quantum)rp+=18;
    let energy=Math.max(1,Math.round(minutes*1.6+telemetry.energy*.12));if(minutes>=45)energy+=researchLevel('longCharge')*8;if(ideal)energy*=2;
    let xp=Math.max(2,Math.round(minutes*2));if(perfect)xp+=18;if(ideal)xp+=35;if(state.sound!=='off')xp=Math.round(xp*(1+researchLevel('soundReward')*.03));
    state.researchPoints+=rp;state.lifetimeResearch+=rp;state.energyCurrency+=energy;state.xp+=xp;
    if(state.savedFromCritical)unlockSecret('criticalSave');if(now.getHours()===4)unlockSecret('fourAM');if(record.stability===100)unlockSecret('perfectStability');if(Math.abs(actualSeconds-2520)<=5)unlockSecret('exact42');if(quantum)unlockSecret('resonance');
    updateAchievementRewards();syncResearchUnlocks();state.pendingReport={historyId:record.id,reason};state.timerStatus='report';saveState({backup:true});renderAll();openPendingReport();
    const special=ideal?'Идеальный цикл! Двойная выработка.':quantum?'Квантовый резонанс зафиксирован.':'Сессия сохранена по фактическому времени.';toast(special);haptic([50,60,50,60,90]);
  }

  function updateDayStreak(now){
    const today=todayKey(now);if(state.lastFocusDate===today)return;const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
    state.dayStreak=state.lastFocusDate===todayKey(yesterday)?state.dayStreak+1:1;state.bestDayStreak=Math.max(state.bestDayStreak,state.dayStreak);state.lastFocusDate=today;
  }
  function updateCleanStreak(clean,telemetry){
    if(clean)state.cleanStreak+=1;else if(!(researchLevel('salvage')&&telemetry.stateId==='critical'))state.cleanStreak=0;state.bestCleanStreak=Math.max(state.bestCleanStreak,state.cleanStreak);
  }

  function openPendingReport(){
    const pending=state.pendingReport;if(!pending)return;const record=state.history.find(x=>x.id===pending.historyId);if(!record){state.pendingReport=null;saveState();return}
    const project=getProject(record.projectId);const defaultAction=state.autoBreak?'break':'stop';
    openModal('Отчёт о сессии','СЕССИЯ УЖЕ СОХРАНЕНА',`<div class="report-summary"><span><b>${formatDuration(record.actualSeconds)}</b><small>фактически</small></span><span><b>${record.stability}%</b><small>стабильность</small></span><span><b>${record.interruptions}</b><small>отвлечений</small></span><span><b>${record.ideal?'ИДЕАЛ':record.quantum?'РЕЗОНАНС':record.clean?'ЧИСТО':'ГОТОВО'}</b><small>результат</small></span></div><form id="sessionReportForm" class="form-grid"><div class="form-field"><label>ЧТО БЫЛО СДЕЛАНО</label><input name="done" maxlength="120" placeholder="Написал модуль, повторил 40 слов…" value="${escapeHtml(record.done)}"></div><div class="form-field"><label>НАСколько ЛЕГКО БЫЛО СОСРЕДОТОЧИТЬСЯ</label><div class="rating-picker">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="focusEase" value="${n}" ${Number(record.focusEase)===n?'checked':''}><span>${n}</span></label>`).join('')}</div></div><div class="form-field"><label>УРОВЕНЬ ЭНЕРГИИ ПОСЛЕ СЕССИИ</label><div class="rating-picker">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="energyLevel" value="${n}" ${Number(record.energyLevel)===n?'checked':''}><span>${n}</span></label>`).join('')}</div></div><div class="form-field"><label>НАСТРОЕНИЕ</label><div class="mood-picker">${['😫','😐','🙂','😄','🤯'].map((m,i)=>`<label><input type="radio" name="mood" value="${m}" ${record.mood===m?'checked':''}><span>${m}</span></label>`).join('')}</div></div><div class="form-field"><label>ЗАМЕТКА</label><textarea name="note" maxlength="700" placeholder="Что помогло, что отвлекало, что изменить в следующем цикле">${escapeHtml(record.note)}</textarea></div><div class="form-field"><label>ЧТО ДАЛЬШЕ</label><select name="next"><option value="break" ${defaultAction==='break'?'selected':''}>Запустить умный перерыв</option><option value="new">Подготовить новую сессию</option><option value="stop" ${defaultAction==='stop'?'selected':''}>Завершить работу</option></select></div><button class="primary-control form-submit">Сохранить отчёт</button></form><p style="color:var(--muted);font-size:8px;line-height:1.5;margin-top:12px">Проект: ${escapeHtml(project?.icon||'◫')} ${escapeHtml(project?.name||'Без проекта')}. Отвлечения и фактическое время уже записаны.</p>`);
    el('sessionReportForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);record.done=String(fd.get('done')||'').trim();record.focusEase=Number(fd.get('focusEase'))||0;record.energyLevel=Number(fd.get('energyLevel'))||0;record.mood=String(fd.get('mood')||'');record.note=String(fd.get('note')||'').trim();record.reportComplete=true;const next=fd.get('next');state.pendingReport=null;closeModal();if(next==='break')beginBreak(true);else{resetTimerState('work');saveState();renderAll();if(next==='new')toast('Новый реакторный цикл готов')}saveState({backup:true});renderAll()};
  }

  function beginBreak(startNow=false){
    resetTimerState('break');assignBreakTask();state.timerStatus=startNow?'running':'idle';if(startNow)state.endAt=Date.now()+state.remainingSec*1000;saveState();if(startNow){startTicker();requestWakeLock()}renderAll();toast('Контур охлаждения активирован');
  }
  function assignBreakTask(){const index=Math.abs(hashString(`${todayKey()}-${state.totalSessions}-${state.modeId}`))%SMART_BREAKS.length;state.breakTask={...SMART_BREAKS[index]};state.breakTaskDone=false}
  function completeSmartBreakTask(){if(state.phase!=='break'||state.breakTaskDone)return;state.breakTaskDone=true;const bonus=5+researchLevel('recovery')*2;state.nextStabilityBonus=clamp(state.nextStabilityBonus+bonus,0,20);state.energyCurrency+=5;saveState();renderAll();toast(`Задание выполнено: +${bonus}% к следующей стабильности`);haptic([10,25,10])}
  function openBreakFinishModal(){openModal('Завершить перерыв?','ОХЛАЖДЕНИЕ',`<p style="color:var(--muted);font-size:11px">Отметь мини-задачу, если действительно выполнил её.</p><div class="button-row"><button id="finishBreakDone" class="primary-control form-submit">Выполнено</button><button id="finishBreakSkip" class="small-btn form-submit">Пропустить</button></div>`);el('finishBreakDone').onclick=()=>{closeModal();finishBreakPhase(true)};el('finishBreakSkip').onclick=()=>{closeModal();finishBreakPhase(false)}}
  function finishBreakPhase(done){clearInterval(ticker);ticker=null;releaseWakeLock();if(done&&!state.breakTaskDone)completeSmartBreakTask();state.history.unshift({id:uid(),type:'break',date:new Date().toISOString(),actualSeconds:Math.max(0,state.elapsedSec),taskId:state.breakTask?.id||'',taskDone:done||state.breakTaskDone});state.history=state.history.slice(0,2500);state.breakTask=null;state.breakTaskDone=false;resetTimerState('work');saveState();renderAll();toast('Охлаждение завершено. Реактор готов')}

  function registerInterruption(){
    if(state.phase!=='work'){toast('На перерыве отвлечения не учитываются');return}if(state.timerStatus==='idle'&&state.elapsedSec===0){toast('Сначала запусти сессию');return}
    state.interruptions+=1;state.stabilityBase=clamp(state.stabilityBase-Math.max(4,12-researchLevel('dampers')*2),0,100);saveState();renderTimer();haptic([20,30,20]);toast(state.stabilityBase<45?'Критическая нестабильность растёт':'Отвлечение зарегистрировано');
  }

  function getTelemetry(){
    const mode=getMode();const elapsedMin=state.elapsedSec/60;let progress=mode.type==='flow'?clamp(state.elapsedSec/(60*60),0,1.35):clamp(state.elapsedSec/Math.max(1,state.durationSec),0,1.35);
    if(state.phase==='break'){
      const p=clamp(state.elapsedSec/Math.max(1,state.durationSec),0,1);const stability=clamp(state.stabilityBase+p*(12+researchLevel('recovery')*2),0,100);return{temperature:clamp(68-p*38-state.coolingOffset,20,90),pressure:clamp(2.2-p*1.1,0.8,3),energy:clamp(75-p*25,0,100),stability,stateId:'cooling',stateName:'Охлаждение',progress:p};
    }
    const longOver=Math.max(0,elapsedMin-75);const modeHeat=state.modeId==='sprint'?-5:['deep','boss'].includes(state.modeId)?4:0;
    const temperature=clamp(32+progress*48+state.interruptions*5.5+state.pauseCount*3.2+longOver*.58+modeHeat-state.coolingOffset,18,140);
    const pressure=clamp(1+progress*1.9+state.interruptions*.18+Math.max(0,temperature-88)*.045-state.coolingOffset*.018,.6,6.5);
    const energy=clamp(progress*100+Math.max(0,elapsedMin-45)*.35+(state.reactor==='sun'?8:0),0,135);
    const stability=clamp(state.stabilityBase-Math.max(0,temperature-86)*.62-Math.max(0,pressure-3.7)*5,0,100);
    const quantumAvailable=roomUnlocked('experimental')&&state.quantumSeed<(0.04+researchLevel('quantumFx')*.04)&&state.interruptions===0&&state.pauseCount===0&&progress>=.78;
    let stateId='stable',stateName='Стабильный';
    if(stability<25||temperature>=112||pressure>=5){stateId='critical';stateName='Критический'}
    else if(temperature>=92){stateId='overheated';stateName='Перегретый'}
    else if(quantumAvailable){stateId='quantum';stateName='Квантовый резонанс'}
    else if(energy>=100&&stability>=82){stateId='supercharged';stateName='Сверхзаряженный'}
    else if(stability<70){stateId='unstable';stateName='Нестабильный'}
    return{temperature,pressure,energy,stability,stateId,stateName,progress};
  }

  function emergencyCooling(){
    const before=getTelemetry();const maxUses=1+researchLevel('coolingCharges')+(roomUnlocked('bunker')?1:0);if(state.phase!=='work'||state.coolingUses>=maxUses||!(before.temperature>=80||before.stability<=65)){toast('Аварийное охлаждение пока не требуется');return}
    state.coolingUses+=1;state.coolingOffset+=18+researchLevel('coolant')*5;state.stabilityBase=clamp(state.stabilityBase+10+researchLevel('recovery')*2,0,120);if(before.stateId==='critical'){state.savedFromCritical=true;unlockSecret('criticalSave')}
    saveState();renderTimer();haptic([40,40,20]);toast(`Криоконтур активирован · заряд ${state.coolingUses}/${maxUses}`);
  }

  function renderAll(){renderModes();renderTimer();renderGoals();renderContractPreview();renderHeader();renderLab();renderResearch();renderProjects();renderStats();renderAchievements();renderSettings()}
  function renderHeader(){const op=operatorProgress();el('headerResearch').textContent=state.researchPoints;el('headerEnergy').textContent=state.energyCurrency;el('headerLevel').textContent=op.level;el('researchBalance').textContent=state.researchPoints}
  function renderModes(){el('modeStrip').innerHTML=MODES.map(m=>{const x=m.id==='custom'?{...m,work:state.customWork,break:state.customBreak}:m.id==='boss'?{...m,work:state.bossMinutes}:m;const suffix=m.type==='flow'?'':` · ${x.work}/${x.break}`;return `<button class="mode-btn ${state.modeId===m.id?'active':''}" data-mode="${m.id}" title="${escapeHtml(m.desc)}">${m.icon} ${escapeHtml(m.name)}${suffix}</button>`}).join('')}

  function renderTimer(){
    if(state.timerStatus==='running')syncTimer();const mode=getMode();const telemetry=getTelemetry();state.lastTelemetry=telemetry;const reactor=REACTORS.find(r=>r.id===state.reactor)||REACTORS[0];const project=getProject(state.activeProjectId)||state.projects[0];
    const display=state.phase==='work'&&mode.type==='flow'?formatTime(state.elapsedSec,true):formatTime(state.remainingSec);el('timerDisplay').textContent=display;el('focusTimer').textContent=display;
    el('actualTimeValue').textContent=formatDuration(state.elapsedSec);el('dayStreakValue').textContent=state.dayStreak;el('interruptionsValue').textContent=state.interruptions;el('pauseCountValue').textContent=state.pauseCount;
    el('temperatureValue').textContent=Math.round(telemetry.temperature);el('pressureValue').textContent=telemetry.pressure.toFixed(1);el('reactorEnergyValue').textContent=Math.round(telemetry.energy);el('stabilityValue').textContent=Math.round(telemetry.stability);
    el('temperatureBar').style.width=`${clamp(telemetry.temperature/120*100,0,100)}%`;el('pressureBar').style.width=`${clamp(telemetry.pressure/5.5*100,0,100)}%`;el('reactorEnergyBar').style.width=`${clamp(telemetry.energy,0,100)}%`;el('stabilityBar').style.width=`${clamp(telemetry.stability,0,100)}%`;
    el('reactor').style.setProperty('--charge',`${clamp(telemetry.energy,0,100)}%`);el('reactor').className=`reactor ${state.timerStatus==='running'?'running ':''}${telemetry.stateId}`;
    const badge=el('reactorStateBadge');badge.className=`state-badge ${telemetry.stateId}`;badge.querySelector('b').textContent=telemetry.stateName;const focusBadge=el('focusState');focusBadge.className=`state-badge ${telemetry.stateId}`;focusBadge.querySelector('b').textContent=telemetry.stateName;
    el('reactorEvent').textContent=reactorEventText(telemetry);el('systemStatus').textContent=state.pendingReport?'Отчёт ожидает заполнения':`${telemetry.stateName} · ${Math.round(telemetry.stability)}%`;
    el('reactorEmoji').textContent=reactor.icon;el('reactorName').textContent=reactor.name;el('coreSymbol').textContent=reactor.symbol;el('focusCoreSymbol').textContent=reactor.symbol;
    el('activeProjectIcon').textContent=project?.icon||'◫';el('activeProjectName').textContent=project?.name||'Без проекта';
    el('phaseLabel').textContent=state.phase==='work'?'РАБОЧИЙ ЦИКЛ':'ОХЛАЖДЕНИЕ';el('sessionTitle').textContent=state.phase==='work'?(state.timerStatus==='running'?'Активная зона запущена':'Реактор ожидает оператора'):'Умный перерыв';
    el('timerHint').textContent=timerHint(telemetry,mode);const running=state.timerStatus==='running';el('startText').textContent=running?'Пауза':state.pendingReport?'Открыть отчёт':state.timerStatus==='paused'?'Продолжить':'Запустить';el('startIcon').textContent=running?'Ⅱ':'▶';el('focusToggleButton').innerHTML=`<span>${running?'Ⅱ':'▶'}</span><span>${running?'Пауза':'Запустить'}</span>`;
    el('focusTemp').textContent=Math.round(telemetry.temperature);el('focusPressure').textContent=telemetry.pressure.toFixed(1);el('focusStability').textContent=`${Math.round(telemetry.stability)}%`;
    const maxUses=1+researchLevel('coolingCharges')+(roomUnlocked('bunker')?1:0);const coolingReady=state.phase==='work'&&(telemetry.temperature>=80||telemetry.stability<=65)&&state.coolingUses<maxUses;const cool=el('emergencyCoolingButton');cool.disabled=!coolingReady;cool.classList.toggle('ready',coolingReady);el('coolingHint').textContent=coolingReady?`Доступно зарядов: ${maxUses-state.coolingUses}`:state.coolingUses>=maxUses?'Контуры израсходованы':'Система в норме';
    el('finishSessionButton').disabled=state.phase==='work'&&state.elapsedSec<1;document.body.classList.toggle('night-session',state.modeId==='night');renderBreakCoach();
  }
  function reactorEventText(t){if(t.stateId==='critical')return 'ТРЕВОГА: требуется охлаждение';if(t.stateId==='overheated')return 'Температура выше нормы';if(t.stateId==='quantum')return 'Редкий квантовый резонанс';if(t.stateId==='supercharged')return 'Ядро вышло на сверхзаряд';if(t.stateId==='unstable')return 'Компенсаторы удерживают ядро';if(t.stateId==='cooling')return 'Контур отводит избыточное тепло';return state.timerStatus==='running'?'Выработка идёт по плану':'Ядро синхронизировано'}
  function timerHint(t,mode){if(state.phase==='break')return state.breakTaskDone?'Мини-задача выполнена — стабильность восстановится':'Выполни мини-задачу и отметь результат';if(t.stateId==='critical')return 'Заверши сессию или включи аварийное охлаждение';if(t.stateId==='overheated')return 'Длинная работа без отдыха нагревает активную зону';if(t.stateId==='quantum')return 'Не прерывай цикл: лаборатория наблюдает редкое состояние';if(mode.type==='flow')return 'Flow Mode считает фактическое время вверх';return state.timerStatus==='running'?'Реактор преобразует внимание в энергию':'Фактическое время сохранится даже при досрочном завершении'}
  function renderBreakCoach(){const show=state.phase==='break';el('breakCoach').classList.toggle('hidden',!show);if(!show)return;if(!state.breakTask)assignBreakTask();el('breakTaskIcon').textContent=state.breakTask.icon;el('breakTaskTitle').textContent=state.breakTask.title;el('breakTaskDescription').textContent=state.breakTask.desc;const btn=el('breakTaskDoneButton');btn.disabled=state.breakTaskDone;btn.textContent=state.breakTaskDone?'Выполнено ✓':'Выполнено + стабильность'}

  function renderGoals(){
    const today=todayKey();const goals=state.goals.filter(g=>g.date===today);const max=3+researchLevel('goalSlots');el('addGoalButton').disabled=goals.length>=max;el('addGoalButton').textContent=goals.length>=max?`Лимит ${max}`:'+ Цель';
    el('goalsList').innerHTML=goals.length?goals.map(g=>{const progress=clamp((Number(g.progress)||0)/(Number(g.target)||1)*100,0,100);const done=progress>=100;return `<div class="goal-row"><button class="goal-check" data-goal-action="toggle" data-goal="${g.id}">${done?'✓':g.type==='minutes'?'◷':'⚛'}</button><div><b>${escapeHtml(g.name)}</b><small>${formatGoalProgress(g)}${g.projectId?` · ${escapeHtml(getProject(g.projectId)?.name||'Проект')}`:''}</small><div class="goal-progress"><i style="width:${progress}%"></i></div></div><button class="goal-delete" data-goal-action="delete" data-goal="${g.id}">×</button></div>`}).join(''):`<div class="empty-state">Добавь до ${max} целей на сегодня. Они могут учитывать минуты или завершённые сессии.</div>`;
  }
  function formatGoalProgress(g){return g.type==='minutes'?`${Math.round(g.progress||0)} / ${g.target} мин`:`${Math.round(g.progress||0)} / ${g.target} сессий`}
  function openGoalModal(){
    const max=3+researchLevel('goalSlots');if(state.goals.filter(g=>g.date===todayKey()).length>=max){toast('Открой дополнительные слоты в ветке дисциплины');return}
    openModal('Новая цель','БЛОК ЦЕЛИ',`<form id="goalForm" class="form-grid"><div class="form-field"><label>НАЗВАНИЕ</label><input name="name" maxlength="60" placeholder="Закончить прототип" required></div><div class="form-field"><label>ТИП</label><select name="type"><option value="sessions">Завершённые сессии</option><option value="minutes">Фактические минуты</option></select></div><div class="form-field"><label>ЗНАЧЕНИЕ</label><input name="target" type="number" min="1" max="999" value="3" required></div><div class="form-field"><label>ПРОЕКТ</label><select name="project"><option value="">Все проекты</option>${state.projects.map(p=>`<option value="${p.id}">${escapeHtml(p.icon)} ${escapeHtml(p.name)}</option>`).join('')}</select></div><button class="primary-control form-submit">Добавить цель</button></form>`);
    el('goalForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);state.goals.push({id:uid(),name:String(fd.get('name')).trim(),type:String(fd.get('type')),target:clamp(Number(fd.get('target')),1,999),progress:0,date:todayKey(),projectId:String(fd.get('project')||''),rewarded:false});saveState();closeModal();renderGoals();renderContractPreview();toast('Цель добавлена')};
  }
  function handleGoalClick(e){const b=e.target.closest('[data-goal]');if(!b)return;const goal=state.goals.find(g=>g.id===b.dataset.goal);if(!goal)return;if(b.dataset.goalAction==='delete')state.goals=state.goals.filter(g=>g.id!==goal.id);else{const wasDone=goal.progress>=goal.target;goal.progress=wasDone?0:goal.target;if(!wasDone&&!goal.rewarded){goal.rewarded=true;state.completedGoals+=1;state.energyCurrency+=10}}saveState();renderGoals();renderHeader();renderContractPreview()}
  function progressGoals(record){state.goals.filter(g=>g.date===todayKey()&&(!g.projectId||g.projectId===record.projectId)).forEach(g=>{const before=g.progress>=g.target;g.progress=Number(g.progress||0)+(g.type==='minutes'?record.actualSeconds/60:1);const after=g.progress>=g.target;if(!before&&after&&!g.rewarded){g.rewarded=true;state.completedGoals+=1;state.energyCurrency+=10}})}
  function allGoalsDone(){const goals=state.goals.filter(g=>g.date===todayKey());return goals.length>0&&goals.every(g=>Number(g.progress)>=Number(g.target))}

  function refreshTimeSensitiveData(){renderContractPreview()}
  function seededPick(list,count,seed){const a=[...list];let x=Math.abs(hashString(seed))||1;for(let i=a.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,count)}
  function hashString(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h|0}
  function currentContracts(period){return period==='daily'?seededPick(DAILY_CONTRACTS,4,`daily-${todayKey()}`):seededPick(WEEKLY_CONTRACTS,4,`weekly-${weekKey()}`)}
  function periodHistory(period){const start=period==='daily'?startOfDay():startOfWeek();return getWorkHistory().filter(h=>new Date(h.date)>=start)}
  function contractProgress(contract,period){return Number(contract.metric(periodHistory(period)))||0}
  function contractClaimKey(contract,period){return `${period}:${period==='daily'?todayKey():weekKey()}:${contract.id}`}
  function contractClaimed(contract,period){return !!state.contractClaims[contractClaimKey(contract,period)]}
  function renderContractPreview(){
    const candidates=[...currentContracts('daily').map(c=>({c,p:'daily'})),...currentContracts('weekly').map(c=>({c,p:'weekly'}))];const item=candidates.find(x=>!contractClaimed(x.c,x.p))||candidates[0];
    if(!item){el('contractPreview').innerHTML='<div class="empty-state">Контракты недоступны</div>';return}const progress=contractProgress(item.c,item.p),pct=clamp(progress/item.c.target*100,0,100);el('contractPreview').innerHTML=`<div class="contract-preview-main"><span>${item.c.icon}</span><div><b>${escapeHtml(item.c.title)}</b><small>${Math.floor(progress)} / ${item.c.target} · ${rewardText(item.c.reward)}</small><div class="contract-progress"><i style="width:${pct}%"></i></div></div><span>${pct>=100?'✓':'›'}</span></div>`;
  }
  function renderLab(){
    const unlocked=ROOMS.filter(r=>roomUnlocked(r.id)).length;el('labProgressBadge').textContent=`${unlocked} / ${ROOMS.length}`;el('labMap').innerHTML=ROOMS.map(r=>{const open=roomUnlocked(r.id),ready=!open&&state.lifetimeResearch>=r.need;return `<button class="room-card ${open?'':'locked'} ${ready?'ready':''}" style="--room-color:${r.color}" data-room="${r.id}"><span class="room-icon">${r.icon}</span><span class="room-status">${open?'ОТКРЫТО':`${state.lifetimeResearch}/${r.need} ⌬`}</span><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.desc)}</p></button>`}).join('');renderContracts('daily');renderContracts('weekly');el('dailyReset').textContent=timeUntilDayReset();el('weeklyReset').textContent=timeUntilWeekReset()}
  function renderContracts(period){const target=el(period==='daily'?'dailyContracts':'weeklyContracts');const contracts=currentContracts(period);target.innerHTML=contracts.map(c=>{const p=contractProgress(c,period),pct=clamp(p/c.target*100,0,100),claimed=contractClaimed(c,period);return `<div class="contract-row"><span class="contract-icon">${c.icon}</span><div><b>${escapeHtml(c.title)}</b><small>${escapeHtml(c.desc)} · ${Math.min(c.target,Math.floor(p))}/${c.target}</small><div class="contract-progress"><i style="width:${pct}%"></i></div><small>${rewardText(c.reward)}</small></div><button class="claim-btn ${claimed?'claimed':''}" data-contract="${c.id}" data-period="${period}" ${claimed||pct<100?'disabled':''}>${claimed?'Получено':'Забрать'}</button></div>`}).join('')}
  function handleContractClick(e){const b=e.target.closest('[data-contract]');if(!b)return;const period=b.dataset.period;const contract=(period==='daily'?DAILY_CONTRACTS:WEEKLY_CONTRACTS).find(c=>c.id===b.dataset.contract);if(contract)claimContract(contract,period)}
  function claimContract(c,period){const key=contractClaimKey(c,period);if(state.contractClaims[key]||contractProgress(c,period)<c.target)return;const precision=1+researchLevel('precision')*.05,discipline=1+researchLevel('contractBonus')*.08;state.researchPoints+=Math.round(c.reward.rp*precision);state.lifetimeResearch+=Math.round(c.reward.rp*precision);state.energyCurrency+=Math.round(c.reward.energy*discipline);state.xp+=Math.round(c.reward.xp*discipline);state.contractClaims[key]=true;if(c.reward.asset)unlockAsset(c.reward.asset);syncResearchUnlocks();saveState({backup:true});renderAll();toast(`Контракт выполнен: ${rewardText(c.reward)}`);haptic([20,30,50])}
  function unlockAsset(asset){const map={theme:'themes',sound:'sounds',reactor:'reactors',frame:'frames',effect:'effects'};const bucket=map[asset.type];if(bucket&&!state.unlockedAssets[bucket].includes(asset.id)){state.unlockedAssets[bucket].push(asset.id);if(asset.type==='frame')state.profileFrame=asset.id;if(asset.type==='effect')state.coreEffect=asset.id;toast(`Открыта новая награда: ${asset.id}`)}else{state.researchPoints+=15;state.lifetimeResearch+=15}}
  function rewardText(r){const extra=r.asset?` · новый ${r.asset.type}`:'';return `${r.rp}⌬ · ${r.energy}ϟ · ${r.xp} XP${extra}`}
  function timeUntilDayReset(){const now=new Date(),next=new Date(now);next.setHours(24,0,0,0);const h=Math.floor((next-now)/3600000),m=Math.floor(((next-now)%3600000)/60000);return `${h}ч ${m}м`}
  function timeUntilWeekReset(){const now=new Date(),next=startOfWeek(now);next.setDate(next.getDate()+7);const d=Math.floor((next-now)/86400000),h=Math.floor(((next-now)%86400000)/3600000);return `${d}д ${h}ч`}
  function openRoomModal(id){const r=ROOMS.find(x=>x.id===id);if(!r)return;const open=roomUnlocked(id);openModal(r.name,open?'КОМНАТА ОТКРЫТА':'ЗАКРЫТЫЙ СЕКТОР',`<div style="font-size:52px;margin-bottom:12px">${r.icon}</div><p style="color:var(--muted);font-size:11px;line-height:1.6">${escapeHtml(r.desc)}</p><div class="empty-state" style="text-align:left"><b>${open?'Активный бонус':'Требование'}</b><br>${open?escapeHtml(r.benefit):`Накопить ${r.need} очков исследований за всё время. Сейчас: ${state.lifetimeResearch}.`}</div>${open&&id==='archive'?'<button id="roomAction" class="primary-control form-submit">Открыть аналитику</button>':open&&id==='vault'?'<button id="roomAction" class="primary-control form-submit">Открыть достижения</button>':''}`);const action=el('roomAction');if(action)action.onclick=()=>{closeModal();switchView(id==='archive'?'stats':'achievements')}}

  function renderResearch(){
    el('researchBalance').textContent=state.researchPoints;el('researchBranches').innerHTML=RESEARCH.map(branch=>`<article class="research-branch glass"><div class="branch-head"><span class="branch-icon">${branch.icon}</span><div><h2>${escapeHtml(branch.name)}</h2><p>${escapeHtml(branch.desc)}</p></div></div><div class="research-nodes">${branch.nodes.map(node=>{const level=researchLevel(node.id),maxed=level>=node.max,cost=maxed?0:node.costs[level];return `<button class="research-node ${maxed?'maxed':''}" data-research="${node.id}" ${maxed?'disabled':''}><h3>${escapeHtml(node.name)}</h3><p>${escapeHtml(maxed?'Исследование полностью завершено':node.desc(level))}</p><div class="node-levels">${Array.from({length:node.max},(_,i)=>`<i class="${i<level?'on':''}"></i>`).join('')}</div><span class="node-cost">${maxed?'MAX':`${cost} ⌬`}</span></button>`}).join('')}</div></article>`).join('')}
  function findResearchNode(id){for(const b of RESEARCH){const node=b.nodes.find(n=>n.id===id);if(node)return node}return null}
  function purchaseResearch(id){const node=findResearchNode(id);if(!node)return;const level=researchLevel(id);if(level>=node.max)return;const cost=node.costs[level];if(state.researchPoints<cost){toast(`Не хватает ${cost-state.researchPoints} очков исследований`);return}state.researchPoints-=cost;state.researchLevels[id]=level+1;syncResearchUnlocks();if(id==='coreEffects'&&state.unlockedAssets.effects[level+1])state.coreEffect=state.unlockedAssets.effects[level+1];saveState();applyTheme();renderAll();toast(`Исследование улучшено: ${node.name} · уровень ${level+1}`);haptic([15,20,15])}

  function getProject(id){return state.projects.find(p=>p.id===id)}
  function projectStats(id){const h=getWorkHistory().filter(x=>x.projectId===id);const total=sum(h,x=>x.actualSeconds);const dates=[...new Set(h.map(x=>todayKey(new Date(x.date))))].sort().reverse();let streak=0;if(dates.length){let cursor=startOfDay();for(const date of dates){const key=todayKey(cursor);if(date===key){streak++;cursor.setDate(cursor.getDate()-1)}else if(streak===0){const y=new Date();y.setDate(y.getDate()-1);if(date===todayKey(y)){streak++;cursor=y;cursor.setDate(cursor.getDate()-1)}else break}else break}}return{sessions:h.length,totalSeconds:total,streak,averageStability:h.length?sum(h,x=>x.stability)/h.length:100,last:h[0]}}
  function renderProjects(){
    const active=getProject(state.activeProjectId)||state.projects[0],stats=projectStats(active.id),pct=clamp(stats.totalSeconds/60/(active.targetMinutes||1)*100,0,100);el('activeProjectSummary').style.setProperty('--project-color',active.color);el('activeProjectSummary').innerHTML=`<span class="project-big-icon">${active.icon}</span><div><span class="eyebrow">АКТИВНЫЙ ПРОЕКТ</span><h2>${escapeHtml(active.name)}</h2><p>${escapeHtml(active.notes||'Без заметки')} · цель ${Math.round(active.targetMinutes/60*10)/10} ч · ${Math.round(pct)}%</p></div><div class="project-summary-metrics"><span><b>${formatDuration(stats.totalSeconds)}</b><small>всего</small></span><span><b>${stats.sessions}</b><small>сессий</small></span><span><b>${stats.streak}</b><small>серия дней</small></span></div>`;
    el('projectsGrid').innerHTML=state.projects.map(p=>{const s=projectStats(p.id),pr=clamp(s.totalSeconds/60/(p.targetMinutes||1)*100,0,100);return `<button class="project-card ${p.id===state.activeProjectId?'active':''}" style="--project-color:${p.color}" data-project="${p.id}"><div class="project-card-head"><span>${p.icon}</span><i>${p.deadline?new Date(p.deadline).toLocaleDateString('ru-RU'):'БЕЗ ДЕДЛАЙНА'}</i></div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.notes||'Нет заметки')}</p><div class="project-card-stats"><span><b>${formatDuration(s.totalSeconds)}</b><small>ФОКУС</small></span><span><b>${s.sessions}</b><small>СЕССИЙ</small></span></div><div class="project-progress"><i style="width:${pr}%"></i></div></button>`}).join('')}
  function openProjectSelector(){openModal('Выбрать проект','АКТИВНЫЙ СЕКТОР',`<div class="choice-grid">${state.projects.map(p=>`<button class="choice-card ${p.id===state.activeProjectId?'selected':''}" data-select-project="${p.id}"><span>${p.icon}</span><b>${escapeHtml(p.name)}</b><small>${formatDuration(projectStats(p.id).totalSeconds)} · ${projectStats(p.id).sessions} сессий</small></button>`).join('')}</div>`);$$('[data-select-project]').forEach(b=>b.onclick=()=>{state.activeProjectId=b.dataset.selectProject;saveState();closeModal();renderAll();toast(`Активный проект: ${getProject(state.activeProjectId)?.name}`)})}
  function openProjectForm(project=null){
    const p=project||{id:'',name:'',icon:'🚀',color:'#63f2c5',targetMinutes:300,notes:'',deadline:''};openModal(project?'Изменить проект':'Новый проект','ПРОЕКТНЫЙ БЛОК',`<form id="projectForm" class="form-grid two"><div class="form-field"><label>НАЗВАНИЕ</label><input name="name" maxlength="48" value="${escapeHtml(p.name)}" required></div><div class="form-field"><label>ИКОНКА</label><input name="icon" maxlength="8" value="${escapeHtml(p.icon)}" required></div><div class="form-field"><label>ЦВЕТ</label><input name="color" type="color" value="${escapeHtml(p.color)}"></div><div class="form-field"><label>ЦЕЛЬ, МИНУТ</label><input name="target" type="number" min="1" max="100000" value="${p.targetMinutes}" required></div><div class="form-field full"><label>ДЕДЛАЙН</label><input name="deadline" type="date" value="${escapeHtml(p.deadline||'')}"></div><div class="form-field full"><label>ЗАМЕТКИ</label><textarea name="notes" maxlength="800">${escapeHtml(p.notes||'')}</textarea></div><button class="primary-control form-submit">${project?'Сохранить':'Создать проект'}</button></form>`);
    el('projectForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const data={name:String(fd.get('name')).trim(),icon:String(fd.get('icon')).trim()||'◫',color:String(fd.get('color')),targetMinutes:clamp(Number(fd.get('target')),1,100000),deadline:String(fd.get('deadline')||''),notes:String(fd.get('notes')||'').trim()};if(project)Object.assign(project,data);else{const newProject={id:uid(),...data,createdAt:new Date().toISOString()};state.projects.push(newProject);state.activeProjectId=newProject.id}saveState();closeModal();renderAll();toast(project?'Проект обновлён':'Проект создан')};
  }
  function openProjectDetails(id){const p=getProject(id);if(!p)return;const s=projectStats(id);const sessions=getWorkHistory().filter(x=>x.projectId===id).slice(0,5);openModal(p.name,'КАРТОЧКА ПРОЕКТА',`<div class="report-summary"><span><b>${formatDuration(s.totalSeconds)}</b><small>фокус</small></span><span><b>${s.sessions}</b><small>сессий</small></span><span><b>${Math.round(s.averageStability)}%</b><small>стабильность</small></span><span><b>${s.streak}</b><small>серия</small></span></div><div class="empty-state" style="text-align:left">${escapeHtml(p.notes||'Нет заметки')}<br><br><b>Дедлайн:</b> ${p.deadline?new Date(p.deadline).toLocaleDateString('ru-RU'):'не задан'}</div><div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="activateProject" class="small-btn">Сделать активным</button><button id="editProject" class="small-btn">Изменить</button><button id="exportThisProject" class="small-btn">CSV</button>${state.projects.length>1?'<button id="deleteProject" class="small-btn danger-text">Удалить</button>':''}</div><div class="history-list">${sessions.map(historyRowHTML).join('')||'<div class="empty-state">Сессий пока нет</div>'}</div>`);el('activateProject').onclick=()=>{state.activeProjectId=id;saveState();closeModal();renderAll();toast(`Активный проект: ${p.name}`)};el('editProject').onclick=()=>{closeModal();openProjectForm(p)};el('exportThisProject').onclick=()=>exportCSV(id);const del=el('deleteProject');if(del)del.onclick=()=>{state.projects=state.projects.filter(x=>x.id!==id);if(state.activeProjectId===id)state.activeProjectId=state.projects[0].id;saveState();closeModal();renderAll();toast('Проект удалён, история сохранена')}}

  function getWorkHistory(){return state.history.filter(h=>h.type==='work')}
  function renderStats(){
    const h=getWorkHistory(),now=new Date(),today=startOfDay(now),week=startOfWeek(now),todayH=h.filter(x=>new Date(x.date)>=today),weekH=h.filter(x=>new Date(x.date)>=week);const avg=h.length?sum(h,x=>x.actualSeconds)/h.length:0,avgStab=h.length?sum(h,x=>x.stability)/h.length:100;
    el('statToday').textContent=formatDuration(sum(todayH,x=>x.actualSeconds));el('statTodaySessions').textContent=`${todayH.length} сессий`;el('statWeek').textContent=formatDuration(sum(weekH,x=>x.actualSeconds));el('statWeekSessions').textContent=`${weekH.length} сессий`;el('statAverage').textContent=formatDuration(avg);el('statAverageStability').textContent=`${Math.round(avgStab)}% стабильности`;
    const elapsedDays=Math.max(1,Math.floor((now-week)/86400000)+1),weekMinutes=sum(weekH,x=>x.actualSeconds)/60,forecast=weekMinutes/elapsedDays*7,pct=clamp(forecast/state.weeklyGoalMinutes*100,0,999);el('statForecast').textContent=`${Math.round(pct)}%`;el('statForecastText').textContent=`прогноз ${Math.round(forecast)} / ${state.weeklyGoalMinutes} мин`;
    const hours=Array(24).fill(0),weekdays=Array(7).fill(0);h.forEach(x=>{const d=new Date(x.date);hours[d.getHours()]+=x.actualSeconds/60;weekdays[(d.getDay()+6)%7]+=x.actualSeconds/60});const bestHour=indexOfMax(hours),bestDay=indexOfMax(weekdays);el('bestHourBadge').textContent=h.length?`${String(bestHour).padStart(2,'0')}:00`:'—';el('bestDayBadge').textContent=h.length?['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][bestDay]:'—';renderBarChart('hourChart',hours,(v,i)=>i%3===0?String(i):'',24);renderBarChart('weekdayChart',weekdays,(v,i)=>['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i],7);
    const stabilityDays=lastNDays(14).map(d=>{const day=h.filter(x=>todayKey(new Date(x.date))===d.key);return{label:d.label,value:day.length?sum(day,x=>x.stability)/day.length:0}});renderBarChart('stabilityChart',stabilityDays.map(x=>x.value),(v,i)=>stabilityDays[i].label,14);const lastStab=stabilityDays.filter(x=>x.value>0);el('stabilityTrendBadge').textContent=lastStab.length?`${Math.round(lastStab[lastStab.length-1].value)}%`:'—';
    renderProjectDistribution(h);renderModeComparison(h);renderEnvironmentImpact(h);renderInsights(h,hours,bestHour,avgStab);renderHistory();
    el('analyticsSummary').textContent=analyticsSentence(h,hours,bestHour,weekMinutes,forecast);if(!roomUnlocked('archive'))el('environmentImpact').innerHTML='<div class="empty-state">Накопи 160 очков исследований и открой Архив, чтобы сравнивать темы и звуки.</div>';
  }
  function renderBarChart(id,values,labelFn,count){const max=Math.max(1,...values);el(id).innerHTML=values.slice(0,count).map((v,i)=>`<div class="chart-bar"><b>${v?Math.round(v):''}</b><i style="height:${Math.max(v?4:1,v/max*100)}%"></i><span>${labelFn(v,i)}</span></div>`).join('')}
  function indexOfMax(arr){return arr.reduce((best,v,i)=>v>arr[best]?i:best,0)}
  function lastNDays(n){return Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(n-1-i));return{key:todayKey(d),label:String(d.getDate())}})}
  function renderProjectDistribution(h){const rows=state.projects.map(p=>({p,value:sum(h.filter(x=>x.projectId===p.id),x=>x.actualSeconds)})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);const max=Math.max(1,...rows.map(x=>x.value));el('projectChart').innerHTML=rows.length?rows.slice(0,7).map(x=>`<div class="distribution-row"><span>${x.p.icon} ${escapeHtml(x.p.name)}</span><div class="distribution-track"><i style="width:${x.value/max*100}%;background:${x.p.color}"></i></div><b>${formatDuration(x.value)}</b></div>`).join(''):'<div class="empty-state">Проектная статистика появится после первой сессии.</div>';el('projectShareBadge').textContent=rows[0]?rows[0].p.name:'—'}
  function renderModeComparison(h){const modes=['classic','long'].map(id=>{const arr=h.filter(x=>x.modeId===id);return{id,arr,minutes:sum(arr,x=>x.actualSeconds)/60,stability:arr.length?sum(arr,x=>x.stability)/arr.length:0,clean:arr.length?arr.filter(x=>x.clean).length/arr.length*100:0}});const max=Math.max(1,...modes.map(x=>x.minutes));el('modeComparison').innerHTML=modes.map(x=>`<div class="comparison-row"><div><strong>${x.id==='classic'?'25 / 5':'50 / 10'}</strong><small>${x.arr.length} сессий · ${Math.round(x.stability)}% стабильности · ${Math.round(x.clean)}% чистых</small></div><b>${Math.round(x.minutes)} мин</b><div class="comparison-meter"><i style="width:${x.minutes/max*100}%"></i></div></div>`).join('')}
  function renderEnvironmentImpact(h){const themeGroups=groupStats(h,'theme'),soundGroups=groupStats(h,'sound');const bestTheme=themeGroups[0],bestSound=soundGroups[0];el('environmentImpact').innerHTML=`${bestTheme?comparisonHTML(`Тема: ${THEMES.find(t=>t.id===bestTheme.key)?.name||bestTheme.key}`,bestTheme):'<div class="empty-state">Нет данных по темам</div>'}${bestSound?comparisonHTML(`Звук: ${SOUNDS.find(s=>s.id===bestSound.key)?.name||bestSound.key}`,bestSound):''}`}
  function groupStats(h,key){const map={};h.forEach(x=>{const k=x[key]||'off';(map[k]??=[]).push(x)});return Object.entries(map).map(([k,a])=>({key:k,count:a.length,minutes:sum(a,x=>x.actualSeconds)/60,stability:sum(a,x=>x.stability)/a.length,avg:sum(a,x=>x.actualSeconds)/a.length/60})).sort((a,b)=>(b.stability*b.count)-(a.stability*a.count))}
  function comparisonHTML(title,x){return `<div class="comparison-row"><div><strong>${escapeHtml(title)}</strong><small>${x.count} сессий · средняя ${Math.round(x.avg)} мин</small></div><b>${Math.round(x.stability)}%</b><div class="comparison-meter"><i style="width:${x.stability}%"></i></div></div>`}
  function renderInsights(h,hours,bestHour,avgStability){const interruptionRate=h.length?sum(h,x=>x.interruptions)/h.length:0;const cleanRate=h.length?h.filter(x=>x.clean).length/h.length*100:0;const cards=[{icon:'◷',title:h.length?`Пик: ${String(bestHour).padStart(2,'0')}:00`:'Нужны данные',text:h.length?'В этот час накоплено больше всего фактического фокуса.':'Заверши несколько сессий в разное время.'},{icon:'💎',title:`${Math.round(cleanRate)}% чистых`,text:`Среднее число отвлечений: ${interruptionRate.toFixed(1)} на сессию.`},{icon:'⚛',title:`${Math.round(avgStability)}% стабильности`,text:avgStability>=85?'Реактор работает в хорошем диапазоне.':'Попробуй более короткие циклы или умные перерывы.'}];el('insightCards').innerHTML=cards.map(c=>`<article class="insight-card"><span>${c.icon}</span><b>${c.title}</b><p>${c.text}</p></article>`).join('')}
  function analyticsSentence(h,hours,bestHour,weekMinutes,forecast){if(h.length<3)return 'Заверши минимум три сессии — лаборатория начнёт находить закономерности.';const delta=forecast-state.weeklyGoalMinutes;return `Лучшее окно начинается около ${String(bestHour).padStart(2,'0')}:00. За неделю накоплено ${Math.round(weekMinutes)} минут; прогноз ${Math.round(forecast)} минут, ${delta>=0?'цель будет выполнена':'до цели не хватает примерно '+Math.round(-delta)+' минут'}.`}
  function renderHistory(){let h=getWorkHistory();if(state.historyProjectFilter)h=h.filter(x=>x.projectId===state.historyProjectFilter);el('clearHistoryFilters').textContent=state.historyProjectFilter?getProject(state.historyProjectFilter)?.name||'Фильтр':'Все проекты';el('historyList').innerHTML=h.length?h.slice(0,30).map(historyRowHTML).join(''):'<div class="empty-state">В журнале пока нет рабочих сессий.</div>'}
  function historyRowHTML(x){const p=getProject(x.projectId);return `<div class="history-row"><span class="history-icon">${p?.icon||'⚛'}</span><div class="history-main"><b>${escapeHtml(x.done||p?.name||'Фокус-сессия')}</b><small>${formatDate(x.date)} · ${escapeHtml(x.modeName||x.modeId)} · ${x.interruptions||0} отвлечений${x.mood?' · '+x.mood:''}</small></div><div class="history-score"><b>${formatDuration(x.actualSeconds)}</b><small>${x.stability}% стаб.</small></div></div>`}
  function openHistoryFilterModal(){openModal('Фильтр журнала','ПРОЕКТЫ',`<div class="choice-grid"><button class="choice-card ${!state.historyProjectFilter?'selected':''}" data-history-project=""><span>▥</span><b>Все проекты</b><small>Полный журнал сессий</small></button>${state.projects.map(p=>`<button class="choice-card ${state.historyProjectFilter===p.id?'selected':''}" data-history-project="${p.id}"><span>${p.icon}</span><b>${escapeHtml(p.name)}</b><small>${projectStats(p.id).sessions} сессий</small></button>`).join('')}</div>`);$$('[data-history-project]').forEach(b=>b.onclick=()=>{state.historyProjectFilter=b.dataset.historyProject||null;saveState();closeModal();renderHistory()})}

  function updateAchievementRewards(){
    ACHIEVEMENT_GROUPS.forEach(group=>{const value=group.metric(state);group.thresholds.forEach((threshold,index)=>{const key=`${group.id}:${index+1}`;if(value>=threshold&&!state.achievementRewards[key]){state.achievementRewards[key]=true;const boost=roomUnlocked('vault')?1.25:1;state.xp+=Math.round((20+(index+1)*15)*boost);state.researchPoints+=Math.round((5+(index+1)*3)*boost);state.lifetimeResearch+=Math.round((5+(index+1)*3)*boost)}})});
  }
  function renderAchievements(){
    let unlocked=0,total=0;el('achievementGroups').innerHTML=ACHIEVEMENT_GROUPS.map(g=>{const value=g.metric(state);total+=g.thresholds.length;unlocked+=g.thresholds.filter(t=>value>=t).length;return `<article class="achievement-group glass"><div class="achievement-group-head"><span class="achievement-group-icon">${g.icon}</span><div><h2>${escapeHtml(g.name)}</h2><p>${escapeHtml(g.desc)}</p></div><span class="achievement-progress">${value} ${g.unit}</span></div><div class="tier-track">${g.thresholds.map((t,i)=>`<div class="tier-card ${value>=t?'unlocked':''}"><span>${value>=t?'✦':'·'}</span><b>${['I','II','III','IV','V'][i]}</b><small>${t} ${g.unit}</small></div>`).join('')}</div></article>`}).join('');el('achievementCount').textContent=`${unlocked} / ${total} уровней`;el('secretAchievements').innerHTML=SECRET_ACHIEVEMENTS.map(a=>{const open=state.secretAchievements.includes(a.id);return `<div class="secret-card ${open?'':'locked'}"><span>${open?a.icon:'?'}</span><b>${open?escapeHtml(a.title):'Засекречено'}</b><small>${open?escapeHtml(a.desc):'Условие неизвестно'}</small></div>`}).join('')}
  function unlockSecret(id){if(!state.secretAchievements.includes(id)){state.secretAchievements.push(id);state.xp+=45;state.researchPoints+=12;state.lifetimeResearch+=12;toast(`Секретное достижение: ${SECRET_ACHIEVEMENTS.find(a=>a.id===id)?.title||id}`)}}
  function checkStartSecrets(){const hour=new Date().getHours();if(hour>=23||hour<5)unlockSecret('nightStart')}

  function renderSettings(){
    const theme=THEMES.find(t=>t.id===state.theme)||THEMES[0],sound=SOUNDS.find(s=>s.id===state.sound)||SOUNDS[0],reactor=REACTORS.find(r=>r.id===state.reactor)||REACTORS[0],frame=PROFILE_FRAMES.find(f=>f.id===state.profileFrame)||PROFILE_FRAMES[0],effect=CORE_EFFECTS.find(f=>f.id===state.coreEffect)||CORE_EFFECTS[0];el('currentThemeName').textContent=theme.name;el('currentSoundName').textContent=sound.name;el('currentReactorName').textContent=reactor.name;el('currentFrameName').textContent=frame.name;el('currentEffectName').textContent=effect.name;el('customModeLabel').textContent=`${state.customWork} / ${state.customBreak} минут`;el('weeklyGoalLabel').textContent=formatDuration(state.weeklyGoalMinutes*60);el('autoBreakToggle').checked=state.autoBreak;el('autoLockToggle').checked=state.autoLock;el('hapticsToggle').checked=state.haptics;el('wakeLockToggle').checked=state.wakeLock;const backups=readBackups();el('autoBackupLabel').textContent=backups.length?`${backups.length} копий · ${new Date(backups[0].date).toLocaleDateString('ru-RU')}`:'Нет копий';el('soundToggle').textContent=sound.icon}
  function applyTheme(){const theme=THEMES.find(t=>t.id===state.theme)||THEMES[0];document.body.dataset.theme=theme.id;document.body.dataset.themeStyle=theme.style;document.body.dataset.frame=state.profileFrame;document.body.dataset.coreEffect=state.coreEffect;document.body.dataset.coreLevel=researchLevel('coreEffects');const color=getComputedStyle(document.body).getPropertyValue('--bg').trim();document.querySelector('meta[name="theme-color"]').setAttribute('content',color||'#05070b')}
  function applySettingsUI(){applyTheme();renderSettings()}

  function openThemeModal(){openModal('Визуальные темы','24 РЕЖИМА ЛАБОРАТОРИИ',`<div class="choice-grid">${THEMES.map(t=>{const open=themeUnlocked(t.id);return `<button class="choice-card ${state.theme===t.id?'selected':''} ${open?'':'locked'}" data-theme-choice="${t.id}"><span>${t.icon}</span><b>${escapeHtml(t.name)}</b><small>${escapeHtml(t.desc)}</small>${open?'':`<i class="choice-lock">🔒 ${t.locked==='research'?'исследование':'контракт'}</i>`}</button>`}).join('')}</div>`);$$('[data-theme-choice]').forEach(b=>b.onclick=()=>{const id=b.dataset.themeChoice;if(!themeUnlocked(id)){toast('Эта тема откроется через исследования или контракт');return}state.theme=id;saveState();applyTheme();renderSettings();closeModal();toast(`Тема: ${THEMES.find(t=>t.id===id).name}`)})}
  function openReactorModal(){openModal('Выбрать реактор','АКТИВНЫЕ ЯДРА',`<div class="choice-grid">${REACTORS.map(r=>{const open=reactorUnlocked(r.id);return `<button class="choice-card ${state.reactor===r.id?'selected':''} ${open?'':'locked'}" data-reactor-choice="${r.id}"><span>${r.icon}</span><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.desc)}</small>${open?'':'<i class="choice-lock">🔒</i>'}</button>`}).join('')}</div>`);$$('[data-reactor-choice]').forEach(b=>b.onclick=()=>{const id=b.dataset.reactorChoice;if(!reactorUnlocked(id)){toast('Реактор ещё не открыт');return}state.reactor=id;saveState();closeModal();renderAll();toast(`Активирован: ${REACTORS.find(r=>r.id===id).name}`)})}
  function openSoundModal(){openModal('Фоновые звуки','СИНТЕТИЧЕСКИЙ ГЕНЕРАТОР',`<div class="choice-grid">${SOUNDS.map(s=>{const open=soundUnlocked(s.id);return `<button class="choice-card ${state.sound===s.id?'selected':''} ${open?'':'locked'}" data-sound-choice="${s.id}"><span>${s.icon}</span><b>${escapeHtml(s.name)}</b><small>${escapeHtml(s.desc)}</small>${open?'':'<i class="choice-lock">🔒 исследование</i>'}</button>`}).join('')}</div>`);$$('[data-sound-choice]').forEach(b=>b.onclick=()=>{const id=b.dataset.soundChoice;if(!soundUnlocked(id)){toast('Сначала исследуй этот звуковой профиль');return}setSound(id);closeModal()})}
  function openFrameModal(){openModal('Рамка оператора','КОСМЕТИЧЕСКАЯ НАГРАДА',`<div class="choice-grid">${PROFILE_FRAMES.map(f=>{const open=state.unlockedAssets.frames.includes(f.id);return `<button class="choice-card ${state.profileFrame===f.id?'selected':''} ${open?'':'locked'}" data-frame-choice="${f.id}"><span>${f.icon}</span><b>${escapeHtml(f.name)}</b><small>${open?'Доступна для профиля':'Открывается контрактами'}</small></button>`}).join('')}</div>`);$$('[data-frame-choice]').forEach(b=>b.onclick=()=>{if(!state.unlockedAssets.frames.includes(b.dataset.frameChoice)){toast('Рамка ещё не открыта');return}state.profileFrame=b.dataset.frameChoice;saveState();applyTheme();renderSettings();closeModal()})}
  function openCoreEffectModal(){openModal('Анимация ядра','ЭФФЕКТЫ РЕАКТОРА',`<div class="choice-grid">${CORE_EFFECTS.map(f=>{const open=state.unlockedAssets.effects.includes(f.id);return `<button class="choice-card ${state.coreEffect===f.id?'selected':''} ${open?'':'locked'}" data-effect-choice="${f.id}"><span>${f.icon}</span><b>${escapeHtml(f.name)}</b><small>${open?'Эффект открыт':'Исследование или контракт'}</small></button>`}).join('')}</div>`);$$('[data-effect-choice]').forEach(b=>b.onclick=()=>{if(!state.unlockedAssets.effects.includes(b.dataset.effectChoice)){toast('Эффект ещё не открыт');return}state.coreEffect=b.dataset.effectChoice;saveState();applyTheme();renderSettings();closeModal()})}

  function openCustomModeModal(){openModal('Собственные режимы','КАЛИБРОВКА',`<form id="customModeForm" class="form-grid two"><div class="form-field"><label>РАБОТА, МИНУТ</label><input name="work" type="number" min="1" max="240" value="${state.customWork}" required></div><div class="form-field"><label>ПЕРЕРЫВ, МИНУТ</label><input name="break" type="number" min="1" max="90" value="${state.customBreak}" required></div><div class="form-field full"><label>BOSS SESSION, МИНУТ</label><input name="boss" type="number" min="90" max="180" value="${state.bossMinutes}" required></div><button class="primary-control form-submit">Сохранить режимы</button></form>`);el('customModeForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);state.customWork=clamp(Number(fd.get('work')),1,240);state.customBreak=clamp(Number(fd.get('break')),1,90);state.bossMinutes=clamp(Number(fd.get('boss')),90,180);if(state.timerStatus==='idle'&&state.elapsedSec===0)resetTimerState('work');saveState();closeModal();renderAll();toast('Режимы откалиброваны')}}
  function openWeeklyGoalModal(){openModal('Недельная цель','ПРОГНОЗ ВЫРАБОТКИ',`<form id="weeklyGoalForm" class="form-grid"><div class="form-field"><label>МИНУТ ФОКУСА В НЕДЕЛЮ</label><input name="minutes" type="number" min="30" max="10000" value="${state.weeklyGoalMinutes}" required></div><button class="primary-control form-submit">Сохранить цель</button></form>`);el('weeklyGoalForm').onsubmit=e=>{e.preventDefault();state.weeklyGoalMinutes=clamp(Number(new FormData(e.currentTarget).get('minutes')),30,10000);saveState();closeModal();renderStats();renderSettings();toast('Недельная цель обновлена')}}

  function cycleSound(){const available=SOUNDS.filter(s=>soundUnlocked(s.id));const i=available.findIndex(s=>s.id===state.sound);setSound(available[(i+1)%available.length].id)}
  function setSound(id){if(!soundUnlocked(id))return;state.sound=id;saveState();stopSound();if(id!=='off')startSound(id);renderSettings();toast(`Звук: ${SOUNDS.find(s=>s.id===id)?.name}`);haptic()}
  function startSelectedSound(){if(state.sound!=='off'&&!audio.nodes.length)startSound(state.sound)}
  function getAudioCtx(){if(!audio.ctx)audio.ctx=new (window.AudioContext||window.webkitAudioContext)();if(audio.ctx.state==='suspended')audio.ctx.resume();return audio.ctx}
  function stopSound(){audio.intervals.forEach(clearInterval);audio.intervals=[];audio.nodes.forEach(n=>{try{n.stop?.();n.disconnect?.()}catch{}});audio.nodes=[]}
  function createNoise(ctx,volume=.02,filterFreq=1800,type='lowpass'){const len=ctx.sampleRate*2,buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buffer;src.loop=true;filter.type=type;filter.frequency.value=filterFreq;gain.gain.value=volume;src.connect(filter).connect(gain).connect(ctx.destination);src.start();audio.nodes.push(src,filter,gain);return{src,filter,gain}}
  function blip(ctx,freq=900,volume=.015,duration=.25){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(volume,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);o.connect(g).connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration+.02);audio.nodes.push(o,g)}
  function startSound(id){try{const ctx=getAudioCtx();stopSound();if(id==='noise')createNoise(ctx,.024,5500);if(id==='rain'){const n=createNoise(ctx,.032,1900);audio.intervals.push(setInterval(()=>n.filter.frequency.setTargetAtTime(800+Math.random()*2100,ctx.currentTime,.8),1800))}if(id==='engine'){const o=ctx.createOscillator(),g=ctx.createGain(),l=ctx.createOscillator(),lg=ctx.createGain();o.type='sine';o.frequency.value=56;g.gain.value=.025;l.frequency.value=.13;lg.gain.value=5;l.connect(lg).connect(o.frequency);o.connect(g).connect(ctx.destination);o.start();l.start();audio.nodes.push(o,g,l,lg)}if(id==='forest'){createNoise(ctx,.012,2300);audio.intervals.push(setInterval(()=>blip(ctx,900+Math.random()*1100,.014,.35),1700))}if(id==='cafe'){createNoise(ctx,.014,1100);audio.intervals.push(setInterval(()=>blip(ctx,380+Math.random()*220,.006,.18),2400))}if(id==='oceanSound'){const n=createNoise(ctx,.03,650);audio.intervals.push(setInterval(()=>n.gain.gain.setTargetAtTime(.012+Math.random()*.028,ctx.currentTime,1.4),2100))}if(id==='vinyl'){createNoise(ctx,.012,6500,'highpass');audio.intervals.push(setInterval(()=>blip(ctx,120+Math.random()*90,.004,.05),700+Math.random()*900))}if(id==='scanner'){createNoise(ctx,.007,1700);audio.intervals.push(setInterval(()=>{blip(ctx,640,.012,.12);setTimeout(()=>blip(ctx,920,.009,.1),160)},2600))}}catch{state.sound='off';saveState();renderSettings()}}

  async function requestWakeLock(){if(!state.wakeLock||!('wakeLock'in navigator)||document.hidden)return;try{wakeLockSentinel=await navigator.wakeLock.request('screen');wakeLockSentinel.addEventListener('release',()=>{wakeLockSentinel=null})}catch{}}
  function releaseWakeLock(){try{wakeLockSentinel?.release()}catch{}wakeLockSentinel=null}
  function openFocusMode(){el('focusOverlay').classList.add('open');el('focusOverlay').setAttribute('aria-hidden','false');document.documentElement.requestFullscreen?.().catch(()=>{});haptic()}
  function closeFocusMode(){el('focusOverlay').classList.remove('open');el('focusOverlay').setAttribute('aria-hidden','true');if(document.fullscreenElement)document.exitFullscreen?.()}
  function lockControls(){el('lockOverlay').classList.add('open');el('lockOverlay').setAttribute('aria-hidden','false');haptic([15,25,15])}
  function unlockControls(){el('lockOverlay').classList.remove('open');el('lockOverlay').setAttribute('aria-hidden','true');haptic([10,20,10])}
  function bindUnlockHold(){const b=el('unlockHoldButton'),start=e=>{e.preventDefault();b.classList.add('holding');clearTimeout(unlockTimer);unlockTimer=setTimeout(()=>{b.classList.remove('holding');unlockControls()},1200)},stop=()=>{clearTimeout(unlockTimer);b.classList.remove('holding')};b.addEventListener('pointerdown',start);['pointerup','pointercancel','pointerleave'].forEach(x=>b.addEventListener(x,stop))}

  function openModal(title,eyebrow,html){el('modalTitle').textContent=title;el('modalEyebrow').textContent=eyebrow;el('modalContent').innerHTML=html;el('modal').classList.add('open');el('modal').setAttribute('aria-hidden','false')}
  function closeModal(){el('modal').classList.remove('open');el('modal').setAttribute('aria-hidden','true');el('modalContent').innerHTML=''}

  async function installApp(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;return}const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);openModal('Установка приложения','PWA НА ГЛАВНОМ ЭКРАНЕ',ios?`<div class="install-steps"><div class="install-step"><span>1</span><div><b>Открой «Поделиться» в Safari</b><p>Кнопка с квадратом и стрелкой находится на панели браузера.</p></div></div><div class="install-step"><span>2</span><div><b>Выбери «На экран Домой»</b><p>При необходимости прокрути список действий.</p></div></div><div class="install-step"><span>3</span><div><b>Нажми «Добавить»</b><p>Таймер будет восстанавливаться после закрытия PWA.</p></div></div></div>`:`<div class="install-steps"><div class="install-step"><span>1</span><div><b>Открой меню браузера</b><p>Найди «Установить приложение» или «Добавить на главный экран».</p></div></div><div class="install-step"><span>2</span><div><b>Подтверди установку</b><p>Приложение продолжит работать локально и офлайн.</p></div></div></div>`)}

  function openExportModal(){openModal('Экспорт данных','ФОРМАТ ОТЧЁТА',`<div class="choice-grid"><button class="choice-card" id="modalExportHTML"><span>HTML</span><b>Красивый отчёт</b><small>Сводка, проекты и последние сессии</small></button><button class="choice-card" id="modalExportCSV"><span>CSV</span><b>Все сессии</b><small>Для Excel, Numbers и анализа</small></button><button class="choice-card" id="modalExportPDF"><span>PDF</span><b>Печать в PDF</b><small>Через системное окно браузера</small></button><button class="choice-card" id="modalExportJSON"><span>JSON</span><b>Полная копия</b><small>Для переноса на другое устройство</small></button></div>`);el('modalExportHTML').onclick=exportHTMLReport;el('modalExportCSV').onclick=()=>exportCSV();el('modalExportPDF').onclick=printPDFReport;el('modalExportJSON').onclick=downloadBackup}
  function downloadBackup(){downloadBlob(JSON.stringify(state,null,2),`focus-reactor-backup-${todayKey()}.json`,'application/json');toast('Полная резервная копия сохранена')}
  function exportStatsOnly(){const data={generatedAt:new Date().toISOString(),totalSessions:state.totalSessions,totalFocusSeconds:state.totalFocusSeconds,perfectSessions:state.perfectSessions,idealSessions:state.idealSessions,dayStreak:state.dayStreak,bestDayStreak:state.bestDayStreak,deepWorkSeconds:state.deepWorkSeconds,projects:state.projects.map(p=>({...p,stats:projectStats(p.id)})),sessions:getWorkHistory()};downloadBlob(JSON.stringify(data,null,2),`focus-reactor-statistics-${todayKey()}.json`,'application/json');toast('Статистика экспортирована')}
  function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
  function exportCSV(projectId=null){const rows=getWorkHistory().filter(h=>!projectId||h.projectId===projectId),headers=['date','project','mode','actual_seconds','actual_minutes','stability','temperature','pressure','interruptions','pauses','clean','ideal','quantum','theme','sound','reactor','done','focus_ease','energy_level','mood','note'];const lines=[headers.join(',')];rows.forEach(x=>lines.push([x.date,getProject(x.projectId)?.name||x.projectId,x.modeName||x.modeId,x.actualSeconds,(x.actualSeconds/60).toFixed(2),x.stability,x.temperature,x.pressure,x.interruptions,x.pauseCount,x.clean,x.ideal,x.quantum,x.theme,x.sound,x.reactor,x.done,x.focusEase,x.energyLevel,x.mood,x.note].map(csvEscape).join(',')));const name=projectId?`focus-reactor-${slug(getProject(projectId)?.name||'project')}.csv`:`focus-reactor-sessions-${todayKey()}.csv`;downloadBlob('\ufeff'+lines.join('\n'),name,'text/csv;charset=utf-8');toast('CSV-файл готов')}
  function slug(s){return String(s).toLowerCase().replace(/[^a-zа-я0-9]+/gi,'-').replace(/^-|-$/g,'')||'data'}
  function openProjectExportModal(){openModal('Экспорт проекта','ВЫБЕРИ ПРОЕКТ',`<div class="choice-grid">${state.projects.map(p=>`<button class="choice-card" data-export-project="${p.id}"><span>${p.icon}</span><b>${escapeHtml(p.name)}</b><small>${projectStats(p.id).sessions} сессий · ${formatDuration(projectStats(p.id).totalSeconds)}</small></button>`).join('')}</div>`);$$('[data-export-project]').forEach(b=>b.onclick=()=>{exportCSV(b.dataset.exportProject);closeModal()})}
  function exportHTMLReport(){downloadBlob(buildReportHTML(),`focus-reactor-report-${todayKey()}.html`,'text/html;charset=utf-8');toast('HTML-отчёт готов')}
  function printPDFReport(){const win=window.open('','_blank');if(!win){downloadBlob(buildReportHTML(),`focus-reactor-report-${todayKey()}.html`,'text/html;charset=utf-8');toast('Всплывающее окно заблокировано — скачан HTML');return}win.document.open();win.document.write(buildReportHTML(true));win.document.close();setTimeout(()=>{win.focus();win.print()},400)}
  function buildReportHTML(print=false){const h=getWorkHistory(),bestProject=state.projects.map(p=>({p,s:projectStats(p.id)})).sort((a,b)=>b.s.totalSeconds-a.s.totalSeconds)[0];return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Focus Reactor Report</title><style>body{font:15px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:980px;margin:0 auto;padding:36px;color:#14201c;background:#f4f7f6}h1{font-size:42px;margin:0}h2{margin:0 0 14px}.muted{color:#66746e}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.card,section{background:white;border:1px solid #dfe7e3;border-radius:18px;padding:18px;margin:12px 0}.card b{display:block;font-size:24px;margin-top:7px}.projects{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.project{padding:12px;border-radius:12px;background:#f0f5f3}.row{display:grid;grid-template-columns:150px 1fr auto;gap:12px;padding:10px 0;border-bottom:1px solid #edf0ef}.row:last-child{border:0}@media(max-width:700px){.grid{grid-template-columns:1fr 1fr}.projects{grid-template-columns:1fr}.row{grid-template-columns:1fr}}@media print{body{background:white;padding:0}.card,section{break-inside:avoid}}</style></head><body><h1>Focus Reactor Report</h1><p class="muted">Сформирован ${new Date().toLocaleString('ru-RU')} · уровень оператора ${operatorLevel()} · ${state.researchPoints} очков исследований</p><div class="grid"><div class="card"><span>Фокус</span><b>${formatDuration(state.totalFocusSeconds)}</b></div><div class="card"><span>Сессии</span><b>${state.totalSessions}</b></div><div class="card"><span>Чистые циклы</span><b>${state.perfectSessions}</b></div><div class="card"><span>Серия дней</span><b>${state.bestDayStreak}</b></div></div><section><h2>Проекты</h2><div class="projects">${state.projects.map(p=>{const s=projectStats(p.id);return `<div class="project"><b>${escapeHtml(p.icon)} ${escapeHtml(p.name)}</b><br>${formatDuration(s.totalSeconds)} · ${s.sessions} сессий · ${Math.round(s.averageStability)}% стабильности</div>`}).join('')}</div></section><section><h2>Вывод</h2><p>Самый энергозатратный проект: <b>${escapeHtml(bestProject?.p.name||'нет данных')}</b>. Лучший дневной стрик: <b>${state.bestDayStreak}</b>. Идеальных циклов: <b>${state.idealSessions}</b>.</p></section><section><h2>Последние сессии</h2>${h.slice(0,40).map(x=>`<div class="row"><span>${formatDate(x.date)}</span><span>${escapeHtml(getProject(x.projectId)?.name||'Без проекта')} · ${escapeHtml(x.done||x.modeName||x.modeId)}</span><b>${formatDuration(x.actualSeconds)} · ${x.stability}%</b></div>`).join('')||'<p>Нет данных</p>'}</section>${print?'<script>document.title="Focus Reactor Report"<\/script>':''}</body></html>`}
  function downloadBlob(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),700)}

  function maybeAutoBackup(){const today=todayKey();if(state.lastAutoBackupDate===today)return;const backups=readBackups();backups.unshift({id:uid(),date:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))});const limit=5+researchLevel('backupDepth')*2;try{localStorage.setItem(BACKUP_KEY,JSON.stringify(backups.slice(0,limit)));state.lastAutoBackupDate=today;localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}}
  function readBackups(){try{const b=JSON.parse(localStorage.getItem(BACKUP_KEY));return Array.isArray(b)?b:[]}catch{return[]}}
  function openAutoBackupsModal(){const backups=readBackups();openModal('Автоматические копии','ЛОКАЛЬНЫЙ АРХИВ',backups.length?`<div class="backup-list">${backups.map(b=>`<div class="backup-row"><div><b>${new Date(b.date).toLocaleString('ru-RU')}</b><small>${b.state.totalSessions||0} сессий · ${formatDuration(b.state.totalFocusSeconds||0)}</small></div><button class="small-btn" data-restore-backup="${b.id}">Восстановить</button></div>`).join('')}</div>`:'<div class="empty-state">Первая автокопия создаётся локально при запуске и после значимых обновлений данных.</div>');$$('[data-restore-backup]').forEach(btn=>btn.onclick=()=>{const backup=readBackups().find(x=>x.id===btn.dataset.restoreBackup);if(!backup)return;state=normalizeState({...defaultState(),...backup.state});saveState();applyTheme();stopSound();closeModal();renderAll();toast('Автокопия восстановлена')})}
  async function importBackup(e){const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());state=normalizeState({...defaultState(),...data});saveState({backup:true});applyTheme();stopSound();renderAll();toast('Данные восстановлены')}catch{toast('Не удалось прочитать резервную копию')}finally{e.target.value=''}}
  function confirmResetData(){openModal('Сбросить лабораторию?','НЕОБРАТИМАЯ ОПЕРАЦИЯ',`<p style="color:var(--muted);font-size:11px;line-height:1.6">Будут удалены проекты, история, исследования, достижения, контракты и настройки. Автокопии останутся доступными до очистки данных браузера.</p><button id="confirmReset" class="primary-control form-submit" style="background:var(--danger);color:white">Удалить данные</button>`);el('confirmReset').onclick=()=>{clearInterval(ticker);releaseWakeLock();stopSound();state=defaultState();saveState();applyTheme();closeModal();renderAll();toast('Лаборатория возвращена к заводским настройкам')}}

  function registerServiceWorker(){if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}

  init();
})();
