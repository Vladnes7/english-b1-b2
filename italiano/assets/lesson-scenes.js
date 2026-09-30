/* Each chapter opens with its own original Italian photograph. */
(() => {
  const scenes = [
    ['Ogni amicizia comincia con un ciao.', 'Каждая дружба начинается с «привет».', 'Соседи приветствуют друг друга на солнечной итальянской площади'],
    ['A tavola, siamo una famiglia.', 'За столом мы — одна семья.', 'Итальянская семья за воскресным обедом в лимонном саду'],
    ['Un piatto di pasta, un sorriso.', 'Тарелка пасты — и улыбка.', 'Официант принимает заказ у пары в итальянском ресторане'],
    ['Ogni strada racconta una storia.', 'Каждая дорога рассказывает историю.', 'Улица итальянского городка с цветными домами и видом на море'],
    ['Le piccole cose fanno una bella giornata.', 'Маленькие вещи делают день прекрасным.', 'Итальянский пекарь открывает свою пекарню с корзиной хлеба'],
    ['Io, tu, noi: insieme è più bello.', 'Я, ты, мы: вместе прекраснее.', 'Трое друзей беседуют на террасе у моря'],
    ['C’è sempre tempo per un caffè.', 'Для кофе всегда найдётся время.', 'Историческая часовая башня над площадью с утренним кафе'],
    ['Imparare apre nuove porte.', 'Учёба открывает новые двери.', 'Студенты с тетрадями в светлом дворе итальянского университета'],
    ['Ogni stagione ha la sua bellezza.', 'У каждого времени года своя красота.', 'Золотистые виноградники итальянской ранней осенью'],
    ['Un cappuccino, per favore.', 'Капучино, пожалуйста.', 'Бариста подаёт капучино посетителю итальянского кафе'],
    ['Oggi faccio spazio alla felicità.', 'Сегодня я нахожу место для счастья.', 'Друзья рисуют и читают у озера Комо'],
    ['Casa è dove mi sento bene.', 'Дом — там, где мне хорошо.', 'Солнечная итальянская квартира с арочными окнами и цветами'],
    ['La vita è più bella a colori.', 'В цвете жизнь прекраснее.', 'Покупательница выбирает льняное платье в итальянском бутике'],
    ['Il viaggio comincia con un passo.', 'Путешествие начинается с одного шага.', 'Путешественники с чемоданами на солнечной прибрежной дороге'],
    ['Mi prendo cura di me, ogni giorno.', 'Я забочусь о себе каждый день.', 'Женщина пьёт воду после лёгкой тренировки в итальянском саду'],
    ['Fare, parlare, vivere: cominciamo!', 'Делать, говорить, жить: начинаем!', 'Друзья вместе готовят свежую пасту на солнечной кухне']
  ];
  const figure = document.getElementById('lessonScene');
  let shown = -1;
  function showScene(index, review) {
    if (review || !Number.isInteger(index) || !scenes[index]) return;
    const scene = scenes[index];
    if (shown === index) return;
    shown = index;
    const number = String(index + 1).padStart(2, '0');
    const photo = document.getElementById('lessonPhoto');
    photo.src = `assets/scenes/${number}.jpg`;
    photo.alt = scene[2];
    document.getElementById('sceneKicker').textContent = `CAPITOLO ${number} · ${LESSONS[index].topic}`;
    document.getElementById('sceneQuote').textContent = scene[0];
    document.getElementById('sceneTranslation').textContent = scene[1];
    figure.dataset.chapter = number;
  }
  window.addEventListener('italiano:lesson-change', event => showScene(event.detail.lessonIndex, event.detail.review));
  const current = entry();
  showScene(current.li, current.type === 'review');
})();
