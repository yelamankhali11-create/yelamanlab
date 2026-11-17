/* ========= НАСТРОЙКИ ========= */
const CONFIG = {
  whatsapp: "77022541366", // номер WhatsApp без +. Пусто → кнопки ведут в Instagram Direct
  instagram: "yelamanlab"
};
/* ============================ */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ");
const tg = n => fmt(n) + " ₸";
const short = n => { const a = Math.abs(n), s = n < 0 ? "−" : ""; return a >= 1e6 ? s + (a/1e6).toFixed(a >= 1e7 ? 0 : 1).replace(".", ",") + " млн ₸" : s + fmt(a) + " ₸"; };
$("#yr").textContent = new Date().getFullYear();

/* ===== i18n ===== */
let LANG = "ru";
const t = s => (LANG === "kz" && window.KZ && KZ[s] !== undefined) ? KZ[s] : s;
const L = (ru, kz) => LANG === "kz" ? kz : ru;

function ctaLink(text){
  return CONFIG.whatsapp
    ? "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text)
    : "https://ig.me/m/" + CONFIG.instagram;
}
function wireCtas(){ $$("[data-cta]").forEach(a => { a.href = ctaLink(t(a.dataset.cta)); a.target = "_blank"; a.rel = "noopener"; }); }

const SKIP = "script,style,[data-kz],#xlT,#cjm,#fnRows,#bars,#waBody,#flowLog,#mq,#csStage,#csTxt,#fnDelta,#chTot,#k1,#k2,#k3,#k4,#fnRev,#lossM";
function translateStatic(){
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  let n;
  while ((n = w.nextNode())){
    if (n.__ru === undefined) n.__ru = n.nodeValue;
    const key = n.__ru.trim().replace(/\s+/g, " ");
    if (!key) continue;
    if (LANG === "kz" && KZ[key] !== undefined){
      const m = n.__ru.match(/^(\s*)[\s\S]*?(\s*)$/);
      n.nodeValue = m[1] + KZ[key] + m[2];
    } else n.nodeValue = n.__ru;
  }
  $$("[data-kz]").forEach(el => {
    if (el.dataset.ru === undefined) el.dataset.ru = el.innerHTML;
    el.innerHTML = LANG === "kz" ? el.dataset.kz : el.dataset.ru;
  });
  $$("img[alt]").forEach(img => { if (img.dataset.altRu === undefined) img.dataset.altRu = img.alt; img.alt = t(img.dataset.altRu); });
}
function setLang(l){
  LANG = l === "kz" ? "kz" : "ru";
  try { localStorage.setItem("yl-lang", LANG); } catch(e){}
  document.documentElement.lang = LANG === "kz" ? "kk" : "ru";
  document.title = L("Yelaman Lab — систематизация бизнеса", "Yelaman Lab — бизнесті жүйелеу");
  $$(".lang button").forEach(b => b.classList.toggle("on", b.dataset.l === LANG));
  translateStatic(); wireCtas();
  renderMarquee(); renderChips(); setMode(csMode); renderFin(); renderCjm(); renderFunnel(); renderCalc();
  $("#waSt").textContent = t("в сети");
  if (!flowBusy) $("#flowLog").innerHTML = "<div>$ " + L("ожидание заказа…", "тапсырыс күтілуде…") + "</div>";
  if ($("#p-ai").classList.contains("on")) playAi();
}
$$(".lang button").forEach(b => b.onclick = () => setLang(b.dataset.l));

/* nav + sticky cta */
addEventListener("scroll", () => {
  $("#nav").classList.toggle("scrolled", scrollY > 20);
  $("#mcta").classList.toggle("show", scrollY > innerHeight * .8 && (innerHeight + scrollY) < document.body.scrollHeight - 300);
}, {passive:true});

/* reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold:.12});
$$(".rv").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });

/* marquee */
function renderMarquee(){
  const items = L(["Финансовый учёт","P&L и ДДС","Карта пути клиента","Воронка продаж","CRM","WhatsApp-автоматизация","Kaspi","Сайты","AI-ассистенты","Дашборды","Регламенты"],
                  ["Қаржылық есеп","P&L және ДДС","Клиент жолының картасы","Сату воронкасы","CRM","WhatsApp-автоматтандыру","Kaspi","Сайттар","AI-ассистенттер","Дашбордтар","Регламенттер"]);
  $("#mq").innerHTML = [0,1].map(() => "<span>" + items.join("</span><span>") + "</span>").join("");
}

/* ===== chaos -> system ===== */
const chips = [
  {t:"Заявки", k:"Өтінімдер", i:"💬", c:[8,6], s:[38,0]},
  {t:"Финансы", k:"Қаржы", i:"📊", c:[52,62], s:[37,18]},
  {t:"Маркетинг", k:"Маркетинг", i:"🧭", c:[58,2], s:[4,36]},
  {t:"Продажи", k:"Сату", i:"🤝", c:[6,74], s:[60,36]},
  {t:"Склад", k:"Қойма", i:"📦", c:[38,32], s:[6,54]},
  {t:"Сайт", k:"Сайт", i:"🌐", c:[4,40], s:[62,54]},
  {t:"Kaspi", k:"Kaspi", i:"💳", c:[64,28], s:[39,72]},
];
const stage = $("#csStage");
chips.forEach((c, k) => { const d = document.createElement("div"); d.className = "chip"; d.dataset.k = k; stage.appendChild(d); });
function renderChips(){ $$(".chip").forEach(d => { const c = chips[d.dataset.k]; d.innerHTML = "<i>" + c.i + "</i>" + L(c.t, c.k); }); }
let csMode = "chaos";
function setMode(m){
  csMode = m;
  const sys = m === "system";
  $("#cs").classList.toggle("system", sys);
  $$(".cs-toggle button").forEach(b => { b.classList.toggle("on", b.dataset.m === m); b.classList.toggle("sys", sys && b.dataset.m === m); });
  $$(".chip").forEach(d => {
    const c = chips[d.dataset.k], p = sys ? c.s : c.c;
    d.style.left = p[0] + "%"; d.style.top = p[1] + "%";
    d.style.transform = sys ? "rotate(0)" : "rotate(" + ((d.dataset.k * 37) % 24 - 12) + "deg)";
  });
  $("#csTxt").textContent = sys
    ? L("Каждый процесс на месте, цифры в реальном времени, бизнес работает без вас", "Әр процесс орнында, сандар нақты уақытта, бизнес сізсіз жұмыс істейді")
    : L("Заявки теряются, прибыль неизвестна, всё держится на владельце", "Өтінімдер жоғалады, пайда белгісіз, бәрі иесіне байланып тұр");
  $("#csVal").textContent = sys ? "+40%" : "−30%";
  $("#csVal").style.color = sys ? "var(--lime)" : "var(--red)";
}
let csTimer;
$$(".cs-toggle button").forEach(b => b.onclick = () => { clearInterval(csTimer); setMode(b.dataset.m); });
renderChips(); setMode("chaos");
csTimer = setInterval(() => setMode(csMode === "chaos" ? "system" : "chaos"), 3200);

/* ===== tabs ===== */
$$(".tab").forEach(tb => tb.onclick = () => {
  $$(".tab").forEach(x => x.classList.toggle("on", x === tb));
  $$(".panel").forEach(p => p.classList.toggle("on", p.id === "p-" + tb.dataset.t));
  if (tb.dataset.t === "ai") playAi();
});

/* ===== FINANCE (Excel mock) ===== */
const F = { check: 2200, perDay: 90, growth: 4, cogs: 32, fixed: 2280000 };
const inputsDef = [
  ["check", ["Средний чек, ₸","Орташа чек, ₸"], v => fmt(v), "Вводные!B5"],
  ["perDay", ["Чеков в день","Күніне чек"], v => fmt(v), "Вводные!B6"],
  ["growth", ["Рост в месяц, %","Айлық өсім, %"], v => v, "Вводные!B7"],
  ["cogs", ["Себестоимость, %","Өзіндік құн, %"], v => v, "Вводные!B9"],
  ["fixed", ["Пост. расходы / мес, ₸","Тұрақты шығын / ай, ₸"], v => fmt(v), ["Аренда + ФОТ + маркетинг + прочее","Жалдау + ЕТҚ + маркетинг + басқа"]],
];
function calcFin(){
  const months = L(["Янв","Фев","Мар","Апр","Май","Июн"], ["Қаң","Ақп","Нау","Сәу","Мам","Мау"]);
  return months.map((m, k) => {
    const checks = Math.round(F.perDay * Math.pow(1 + F.growth/100, k) * 30);
    const rev = checks * F.check, cogs = rev * F.cogs/100, tax = rev * .0395;
    return {m, checks, rev, cogs, gross: rev - cogs, fixed: F.fixed, tax, profit: rev - cogs - F.fixed - tax};
  });
}
function renderFin(){
  const d = calcFin();
  const cols = "<thead><tr><th class='rn'></th><th>A</th>" + d.map((_, i) => "<th>" + "BCDEFG"[i] + "</th>").join("") + "<th>H</th></tr></thead>";
  let rows = "", r = 1;
  inputsDef.forEach(([k, label, f, src]) => {
    const s = Array.isArray(src) ? L(src[0], src[1]) : src;
    rows += "<tr><td class='rn'>" + (r++) + "</td><td>" + L(label[0], label[1]) + "</td><td class='in'><input data-k='" + k + "' data-src='" + s + "' value='" + f(F[k]) + "' inputmode='numeric'></td><td colspan='6' style='color:#9aa3b2;text-align:left;font-size:12px'>" + L("← измените значение", "← мәнін өзгертіңіз") + "</td></tr>";
  });
  rows += "<tr><td class='rn'>" + (r++) + "</td><td colspan='8' style='background:#1d2433;color:#fff;font-weight:800'>P&amp;L, ₸</td></tr>";
  rows += "<tr><td class='rn'>" + (r++) + "</td><td><b>" + L("Статья","Бап") + "</b></td>" + d.map(x => "<td><b>" + x.m + "</b></td>").join("") + "<td><b>" + L("Итого","Барлығы") + "</b></td></tr>";
  const plain = ["checks","profit","rev","gross"];
  const line = (label, key, cls, f) => {
    const tot = d.reduce((s, x) => s + x[key], 0);
    const v = n => plain.includes(key) ? fmt(n) : "−" + fmt(n);
    const pc = n => key === "profit" ? (n < 0 ? "neg" : "pos") : "";
    return "<tr class='" + (cls||"") + "' data-f='" + f + "'><td class='rn'>" + (r++) + "</td><td>" + label + "</td>" +
      d.map(x => "<td class='" + pc(x[key]) + "'>" + v(x[key]) + "</td>").join("") + "<td class='" + pc(tot) + "'>" + v(tot) + "</td></tr>";
  };
  rows += line(L("Чеков","Чек саны"), "checks", "", L("= Чеков в день × (1+рост)^мес × 30","= Күніне чек × (1+өсім)^ай × 30"));
  rows += line(L("Выручка","Түсім"), "rev", "tot", L("= Чеков × Средний чек","= Чек саны × Орташа чек"));
  rows += line(L("Себестоимость","Өзіндік құн"), "cogs", "", L("= Выручка × Себестоимость %","= Түсім × Өзіндік құн %"));
  rows += line(L("Валовая прибыль","Жалпы пайда"), "gross", "", L("= Выручка − Себестоимость","= Түсім − Өзіндік құн"));
  rows += line(L("Постоянные расходы","Тұрақты шығындар"), "fixed", "", L("= Аренда + ФОТ + Маркетинг + Прочее","= Жалдау + ЕТҚ + Маркетинг + Басқа"));
  rows += line(L("Налог + Kaspi","Салық + Kaspi"), "tax", "", L("= Выручка × (3% + 0,95%)","= Түсім × (3% + 0,95%)"));
  rows += line(L("Чистая прибыль","Таза пайда"), "profit", "tot", L("= Валовая − Постоянные − Налоги","= Жалпы пайда − Тұрақты − Салық"));
  $("#xlT").innerHTML = cols + "<tbody>" + rows + "</tbody>";
  $$("#xlT input").forEach(inp => {
    inp.onfocus = () => { $("#fxCell").textContent = "B" + (inputsDef.findIndex(x => x[0] === inp.dataset.k) + 1); $("#fxF").textContent = inp.dataset.src; inp.select(); };
    inp.onchange = inp.onblur = () => {
      const v = parseFloat(inp.value.replace(/[^\d.,]/g, "").replace(",", "."));
      if (!isNaN(v) && v >= 0) F[inp.dataset.k] = v;
      renderFin();
    };
    inp.onkeydown = e => { if (e.key === "Enter") inp.blur(); };
  });
  $$("#xlT tr[data-f]").forEach(tr => tr.onmouseenter = () => { $("#fxCell").textContent = "fx"; $("#fxF").textContent = tr.dataset.f; });

  const max = Math.max(...d.map(x => Math.abs(x.profit)), 1);
  $("#bars").innerHTML = d.map(x => "<div class='bar'><small>" + short(x.profit).replace(" ₸","") + "</small><i class='" + (x.profit < 0 ? "n" : "") + "' style='height:" + (Math.abs(x.profit)/max*100) + "%'></i><small>" + x.m + "</small></div>").join("");
  const tp = d.reduce((s, x) => s + x.profit, 0), tr = d.reduce((s, x) => s + x.rev, 0);
  $("#chTot").textContent = L("Выручка: ","Түсім: ") + short(tr);
  $("#k1").textContent = short(tp); $("#k1").style.color = tp < 0 ? "var(--red)" : "var(--lime)";
  $("#k2").textContent = tr ? (tp/tr*100).toFixed(1).replace(".", ",") + "%" : "—";
  const margin = F.check * (1 - F.cogs/100 - .0395);
  $("#k3").textContent = margin > 0 ? Math.ceil(F.fixed / margin / 30) + L(" чеков/день"," чек/күн") : L("не достижима","жетпейді");
  const avg = tp / 6;
  $("#k4").textContent = avg > 0 ? (12000000 / avg).toFixed(1).replace(".", ",") + L(" мес."," ай") : L("не окупается","өтелмейді");
}

/* ===== CJM ===== */
const CJM = {
  ru: {
    head: ["Этап","Эмоции"],
    stages: [["01","Узнаёт"],["02","Изучает"],["03","Записывается"],["04","Визит"],["05","Возвращается"]],
    rows: [
      ["Действия клиента", [["Видит Reels у подруги","Ищет «маникюр рядом» в 2ГИС"],["Смотрит профиль и работы","Сравнивает цены"],["Пишет в Direct","Ждёт ответа, выбирает время"],["Приходит, ждёт мастера","Платит Kaspi"],["Думает о следующей записи","Советует подруге"]]],
      ["Точки контакта", [["Instagram Reels","2ГИС, таргет"],["Профиль, Highlights","Отзывы"],["Direct, WhatsApp"],["Администратор, мастер","Kaspi QR"],["WhatsApp-напоминание","Программа лояльности"]]],
      ["Боли", [["Не понятно, чем вы лучше"],["Нет цен в профиле","Мало отзывов"],["Отвечают через 3 часа","Нет онлайн-записи"],["Ожидание 15 минут"],["О ней забывают","Нет повода вернуться"]], "pn"],
      ["Решение", [["Оффер в шапке и Reels с результатом"],["Прайс и отзывы в Highlights"],["AI-ответ за 5 сек + онлайн-запись"],["Напоминание за 2 часа","Чек-лист сервиса"],["Авто-напоминание через 21 день","Бонус за друга"]], "sl"],
      ["Метрика", [["Охват → переходы в профиль"],["Профиль → Direct, %"],["Direct → запись, %"],["Доходимость, %"],["Повторные визиты, %"]], "mt"],
    ]
  },
  kz: {
    head: ["Кезең","Эмоция"],
    stages: [["01","Біледі"],["02","Зерттейді"],["03","Жазылады"],["04","Келеді"],["05","Қайта келеді"]],
    rows: [
      ["Клиент әрекеті", [["Құрбысынан Reels көреді","2ГИС-тен «жақын маникюр» іздейді"],["Профиль мен жұмыстарды қарайды","Бағаларды салыстырады"],["Direct-ке жазады","Жауап күтіп, уақыт таңдайды"],["Келеді, шеберді күтеді","Kaspi арқылы төлейді"],["Келесі жазылуды ойлайды","Құрбысына ұсынады"]]],
      ["Байланыс нүктелері", [["Instagram Reels","2ГИС, таргет"],["Профиль, Highlights","Пікірлер"],["Direct, WhatsApp"],["Әкімші, шебер","Kaspi QR"],["WhatsApp-еске салу","Лояльность бағдарламасы"]]],
      ["Мәселелер", [["Сіздің артықшылығыңыз түсініксіз"],["Профильде баға жоқ","Пікір аз"],["3 сағаттан кейін жауап береді","Онлайн-жазылу жоқ"],["15 минут күту"],["Оны ұмытып кетеді","Қайта келуге себеп жоқ"]], "pn"],
      ["Шешім", [["Шапкадағы оффер және нәтижесі бар Reels"],["Highlights-та прайс пен пікірлер"],["5 секундта AI-жауап + онлайн-жазылу"],["2 сағат бұрын еске салу","Сервис чек-парағы"],["21 күннен кейін авто-еске салу","Досын әкелгені үшін бонус"]], "sl"],
      ["Метрика", [["Қамту → профильге өту"],["Профиль → Direct, %"],["Direct → жазылу, %"],["Келіп жету, %"],["Қайталама келу, %"]], "mt"],
    ]
  },
  emo: [3, 2, 0.6, 2.4, 3.6]
};
function renderCjm(){
  const c = CJM[LANG];
  let h = "<div class='rl'>" + c.head[0] + "</div>" + c.stages.map(s => "<div class='st'><small>" + s[0] + "</small>" + s[1] + "</div>").join("");
  h += "<div class='rl'>" + c.head[1] + "</div><div class='emo'>" + emoSvg() + "</div>";
  c.rows.forEach(([label, cells, cls]) => {
    h += "<div class='rl'>" + label + "</div>" + cells.map(x => "<div class='" + (cls||"") + "'><ul>" + x.map(y => "<li>" + y + "</li>").join("") + "</ul></div>").join("");
  });
  $("#cjm").innerHTML = h;
}
function emoSvg(){
  const W = 1000, Hh = 120, pts = CJM.emo.map((v, i) => [W/10 + i*W/5, Hh - 18 - v/4*(Hh - 36)]);
  let d = "M" + pts[0];
  for (let i = 1; i < pts.length; i++){ const [x0,y0] = pts[i-1], [x1,y1] = pts[i], cx = (x0+x1)/2; d += " C" + cx + "," + y0 + " " + cx + "," + y1 + " " + x1 + "," + y1; }
  const face = v => v >= 3 ? "😍" : v >= 2 ? "🙂" : v >= 1.2 ? "😐" : "😤";
  return "<svg viewBox='0 0 " + W + " " + Hh + "' preserveAspectRatio='none'><defs><linearGradient id='eg' x1='0' x2='1'><stop offset='0' stop-color='#8b7bff'/><stop offset='.45' stop-color='#ff5c6c'/><stop offset='1' stop-color='#c6ff3d'/></linearGradient></defs>" +
    "<line x1='0' x2='" + W + "' y1='" + Hh/2 + "' y2='" + Hh/2 + "' stroke='#1f2430' stroke-dasharray='4 6'/>" +
    "<path d='" + d + "' fill='none' stroke='url(#eg)' stroke-width='3.5' vector-effect='non-scaling-stroke'/>" +
    pts.map((p, i) => "<text x='" + p[0] + "' y='" + (p[1] + 7) + "' font-size='22' text-anchor='middle'>" + face(CJM.emo[i]) + "</text>").join("") + "</svg>";
}

/* funnel */
function renderFunnel(){
  const a = +$("#s1").value, b = +$("#s2").value, c = +$("#s3").value, ch = +$("#s4").value;
  $("#sv1").textContent = fmt(a); $("#sv2").textContent = b + "%"; $("#sv3").textContent = c + "%"; $("#sv4").textContent = tg(ch);
  const rec = a * b/100, vis = rec * c/100, rev = vis * ch;
  const base = 300 * .22 * .70 * ch;
  $("#fnRows").innerHTML = [[L("Пишут в Direct","Direct-ке жазады"), a, 100], [L("Записались","Жазылды"), rec, Math.max(rec/a*100, 18)], [L("Пришли и оплатили","Келіп, төледі"), vis, Math.max(vis/a*100, 12)]]
    .map(([l, v, w]) => "<div class='fn-row'><div class='fn-bar' style='width:" + w + "%'>" + fmt(v) + "</div><span>" + l + "</span></div>").join("");
  $("#fnRev").textContent = tg(rev);
  const dlt = rev - base, tail = L(" к текущей воронке", " — қазіргі воронкамен салыстырғанда");
  $("#fnDelta").innerHTML = Math.abs(dlt) < 1 ? L("Сейчас: типичная воронка без системы", "Қазір: жүйесіз әдеттегі воронка")
    : (dlt > 0 ? "<span style='color:var(--lime)'>+" + tg(dlt) + "</span>" + tail : "<span style='color:var(--red)'>" + tg(dlt) + "</span>" + tail);
}
["#s1","#s2","#s3","#s4"].forEach(s => $(s).oninput = renderFunnel);

/* ===== automation flow ===== */
let flowBusy = false;
$("#runFlow").onclick = async () => {
  if (flowBusy) return; flowBusy = true;
  const steps = L([
    "→ Новый визит из Instagram (био-ссылка)",
    "→ Заказ #1048: перфоратор, 2 дня, доставка",
    "✓ Договор подписан SMS-кодом · ИИН проверен",
    "✓ Оплата Kaspi 12 000 ₸ · чек получен",
    "✓ Google Sheets обновлён · склад: перфоратор 3 → 2",
    "✓ Уведомление владельцу и курьеру отправлено — 0 действий вручную"
  ], [
    "→ Instagram-нан жаңа кіру (биодағы сілтеме)",
    "→ Тапсырыс #1048: перфоратор, 2 күн, жеткізу",
    "✓ Шартқа SMS-кодпен қол қойылды · ЖСН тексерілді",
    "✓ Kaspi төлемі 12 000 ₸ · чек алынды",
    "✓ Google Sheets жаңарды · қойма: перфоратор 3 → 2",
    "✓ Иесі мен курьерге хабарлама кетті — қолмен 0 әрекет"
  ]);
  const nodes = $$("#flow .node"), log = $("#flowLog");
  log.innerHTML = "";
  for (let i = 0; i < nodes.length; i++){
    nodes.forEach((n, j) => n.classList.toggle("act", j === i));
    const line = document.createElement("div"); line.textContent = steps[i]; if (steps[i][0] === "✓") line.className = "ok";
    log.appendChild(line);
    await new Promise(r => setTimeout(r, 850));
  }
  nodes.forEach(n => n.classList.add("act"));
  setTimeout(() => { nodes.forEach(n => n.classList.remove("act")); flowBusy = false; }, 1600);
};

/* ===== AI chat ===== */
const DIALOG = {
  ru: [
    ["in","Здравствуйте, сколько стоит маникюр с покрытием?"],
    ["out","Здравствуйте! 💅 Маникюр с покрытием гель-лак — 8 000 ₸, с дизайном — от 9 500 ₸. Есть свободные окна сегодня в 17:00 и завтра в 11:30. Записать вас?"],
    ["in","Завтра 11:30 можно"],
    ["out","Отлично! Записала вас на завтра, 11:30, мастер Айгерим ✨ Как вас зовут?"],
    ["in","Дана"],
    ["out","Дана, вы записаны ✅ Адрес: ул. Пример, 10. Напомню за 2 часа. Для брони можно внести 2 000 ₸ через Kaspi — отправить ссылку?"],
  ],
  kz: [
    ["in","Сәлеметсіз бе, гель-лакпен маникюр қанша тұрады?"],
    ["out","Сәлеметсіз бе! 💅 Гель-лакпен маникюр — 8 000 ₸, дизайнмен — 9 500 ₸-ден. Бүгін 17:00-де және ертең 11:30-да бос уақыт бар. Жазып қояйын ба?"],
    ["in","Ертең 11:30 болады"],
    ["out","Керемет! Сізді ертеңге, 11:30-ға, Әйгерім шеберге жаздым ✨ Есіміңіз кім?"],
    ["in","Дана"],
    ["out","Дана, сіз жазылдыңыз ✅ Мекенжай: Мысал көшесі, 10. 2 сағат бұрын еске саламын. Брондау үшін Kaspi арқылы 2 000 ₸ салуға болады — сілтеме жіберейін бе?"],
  ]
};
let aiRun = 0;
async function playAi(){
  const id = ++aiRun, body = $("#waBody"); body.innerHTML = "";
  const tm = () => new Date().toLocaleTimeString("ru-RU", {hour:"2-digit", minute:"2-digit"});
  for (const [who, text] of DIALOG[LANG]){
    if (id !== aiRun) return;
    if (who === "out"){
      $("#waSt").textContent = L("печатает…", "жазып жатыр…");
      const ty = document.createElement("div"); ty.className = "typing"; ty.innerHTML = "<i></i><i></i><i></i>"; body.appendChild(ty);
      await new Promise(r => setTimeout(r, 1100)); ty.remove(); $("#waSt").textContent = t("в сети");
    } else await new Promise(r => setTimeout(r, 700));
    if (id !== aiRun) return;
    const m = document.createElement("div"); m.className = "msg " + who; m.innerHTML = text + "<small>" + tm() + (who === "out" ? " ✓✓" : "") + "</small>";
    body.appendChild(m); body.scrollTop = body.scrollHeight;
  }
}
$("#replayAi").onclick = playAi;

/* ===== loss calculator ===== */
function renderCalc(){
  const n = +$("#c1").value, ch = +$("#c2").value, lp = +$("#c3").value, rp = +$("#c4").value;
  $("#cv1").textContent = fmt(n); $("#cv2").textContent = tg(ch); $("#cv3").textContent = lp + "%"; $("#cv4").textContent = rp + "%";
  const loss = n * lp/100 * .3 * ch, ret = loss * rp/100;
  $("#lossM").textContent = tg(loss); $("#lossY").textContent = tg(loss * 12); $("#lossR").textContent = tg(ret);
  const msg = L("Здравствуйте! Посчитал(а) на сайте: теряю около " + tg(loss) + " в месяц (" + fmt(n) + " заявок, чек " + tg(ch) + "). Хочу записаться на диагностику.",
                "Сәлеметсіз бе! Сайтта есептедім: айына шамамен " + tg(loss) + " жоғалтамын (" + fmt(n) + " өтінім, чек " + tg(ch) + "). Диагностикаға жазылғым келеді.");
  $("#calcCta").href = ctaLink(msg); $("#calcCta").target = "_blank";
}
["#c1","#c2","#c3","#c4"].forEach(s => $(s).oninput = renderCalc);

/* init */
let startLang = "ru";
try { startLang = localStorage.getItem("yl-lang") || "ru"; } catch(e){}
const qp = new URLSearchParams(location.search).get("lang");
if (qp) startLang = qp === "kz" || qp === "kk" ? "kz" : "ru";
setLang(startLang);
