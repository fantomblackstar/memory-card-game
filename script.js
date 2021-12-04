const levelsBlock = document.querySelector('.levels');
const gameBlock = document.querySelector('.game');
const imageCount = 23;
const tableBody = document.querySelector('tbody');
const movesBlock = document.querySelector('.game__moves').children[0];
const tableWrap = document.querySelector('.table__wrap');
const modalWrap = document.querySelector('.modal-wrap');
const gameModeBlock = document.querySelector('.game-mode');
const serverURL = "https://game-memory-card.herokuapp.com/";
// const serverURL = "http://127.0.0.1:3080/";
const multiplayerModal = document.querySelector('.window-multiplayer');
let usedImages = [];
let currentMoves = 0;
let currentCardImage = [];
let findedCards = 0;
let timeSpeedSec = 1000;
let currentLevel = 1;
let tableSize = [];
let memoryPoint = 0;
let timeStarted = '';
const findCardAudio = new Audio('audio/findcard-sound.wav');
let multiplayerFlag = false;
let mpEndGameFlag = false;
let multiplayerObj = {
    room: '-1',
    userID: `${new Date().getTime()}`,
}

let levelsRounds = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
}

for (let elem of document.querySelectorAll('.level')) {
    elem.addEventListener('click', startGame);
    elem.children[3].style.backgroundImage = 'url("img/play_icon.png")';
}

for (let elem of document.querySelectorAll('.game-mode__button')) {
    elem.addEventListener('click', setGameMode);
}

for (let elem of document.querySelectorAll('.game__button-speed')) {
    elem.addEventListener('click', changeSpeed);
}

function rotateCard() {
    this.classList.toggle('active');
    let image = this.dataset.imageid;
    currentCardImage.push(image);
    this.removeEventListener('click',rotateCard);
    if (currentCardImage.length === 2) checkCard();
}

function checkCard() {
    tableWrap.style.zIndex = '5';
    if (currentCardImage[0] === currentCardImage[1]) findCardAudio.play();
    setTimeout(() => {
        if (currentCardImage[0] === currentCardImage[1]) {
            findedCards += 2;
            for (let card of document.querySelectorAll(`.card.active`)) {
                card.removeEventListener('click', rotateCard);
                card.classList.remove('active');
                card.style.display = 'none';
            }
            if (findedCards === document.querySelectorAll('.card').length) {
                (multiplayerFlag)?  winMultiplayerGame() : endGame();
            } else if(multiplayerFlag){
                checkingMultiplayerEndGame();
            }
        } else {
            for (let elem of document.querySelectorAll('.card.active')) {
                elem.classList.remove('active');
                elem.addEventListener('click', rotateCard);
            }
        }
        currentCardImage = [];

        tableWrap.style.zIndex = '-1';
    }, timeSpeedSec)

    movesBlock.textContent = ++currentMoves;
}

function setGameMode() {
    if (!this.classList.contains('active')) {
        document.querySelector('.game-mode__button.active').classList.remove('active');
        this.classList.add('active');
        multiplayerFlag = (this.textContent === 'Multiplayer') ? true : false;
    };
}

async function startGame() {
    currentLevel = +this.dataset.level;
    document.querySelector('.game__img_restart').style.cursor = 'pointer';
    if (multiplayerFlag) {
        multiplayerObj['level'] = currentLevel.toString();
        let conected = await findPlayer();
        if (!conected) return;
        document.querySelector('.game__img_restart').removeEventListener('click', restartGame);
        document.querySelector('.game__img_restart').style.cursor = 'not-allowed';
    }
    levelsBlock.classList.add('hide');
    gameBlock.classList.remove('hide');
    gameModeBlock.classList.add('hide');

    tableSize = this.dataset.table.split('x');
    findedCards = currentMoves = 0;
    createTable(tableSize[0], tableSize[1]);
    setGameInfo();
    timeStarted = new Date().getTime();
}

function setGameInfo () {
    document.querySelector('.game__level').textContent = `Level ${currentLevel}`;
    document.querySelector('.game__rounds').children[0].textContent = `${levelsRounds[currentLevel]}`;
    document.querySelector('.game__moves').children[0].textContent = `${currentMoves}`;
    document.querySelector('.game__points').children[0].textContent = memoryPoint;
    document.querySelector('.switch__input').checked = false;
}

function createTable(n, m) {
    let cardWidth = 100 / m;
    let cardHeight = 100 / n;
    findedCards = 0;
    let firstHalfCards = [];
    let secondHalfCards = [];
    for (let i = 0; i < m * n / 2; i++) {
        firstHalfCards.push(createCard());
        secondHalfCards.push(cloneCard(i));
    }
    const allCards = firstHalfCards.concat(secondHalfCards);
    rundomizeArrayElements(allCards);
    let count = 0;
    for (let k = 0; k < n; k++) {
        let row = tableBody.insertRow(-1);
        row.style.height = `${cardHeight}%`;
        row.style.width = '100%';
        for (let l = 0; l < m; l++) {
            let cell = row.insertCell(l);
            let card = allCards[count++];
            let image = card.dataset.imageid;
            card.children[1].style.backgroundImage = `url('cards_img/animal/animal_${image}.png')`;
            card.children[0].children[0].textContent = count;
            cell.append(card);
            cell.style.width = `${cardWidth}%`;
        }
    }
    usedImages = [];
}

function createCard() {
    let cardNum = document.createElement('div');
    cardNum.classList.add('card__number');
    let cardBack = document.createElement('div');
    cardBack.classList.add('card__back');
    cardBack.append(cardNum);
    let cardFront = document.createElement('div');
    cardFront.classList.add('card__front');
    let card = document.createElement('div');
    card.classList.add('card');

    let imageNum = Math.trunc(Math.random() * 100) % imageCount + 1;
    while (usedImages.indexOf(imageNum) !== -1) {
        imageNum = Math.trunc(Math.random() * 100) % imageCount + 1;
    }
    usedImages.push(imageNum);
    card.dataset.imageid = imageNum;
    card.append(cardBack);
    card.append(cardFront);
    card.addEventListener('click', rotateCard);
    return card;
}


function cloneCard(index) {
    let cardNum = document.createElement('div');
    cardNum.classList.add('card__number');
    let cardBack = document.createElement('div');
    cardBack.classList.add('card__back');
    cardBack.append(cardNum);
    let cardFront = document.createElement('div');
    cardFront.classList.add('card__front');
    let card = document.createElement('div');
    card.classList.add('card');
    card.dataset.imageid = usedImages[index];
    card.append(cardBack);
    card.append(cardFront);
    card.addEventListener('click', rotateCard);
    return card;
}

function endGame() {
    modalWrap.classList.remove('hide');
    document.querySelector('.window-win').classList.remove('hide');
    let timePlayed = Math.floor((new Date().getTime() - timeStarted) / 1000);
    memoryPoint += currentLevel;
    addStarsRange.call(document.querySelector('.window-win__stars'));
    document.querySelector('.window-win h1').innerHTML = `You win this game!`;
    document.querySelector('.window-win__text').innerHTML = `You get ${currentLevel} Memory Points<br/>
    Moves: ${currentMoves}<br/>Time: ${Math.floor(timePlayed / 60)}:${(timePlayed % 60).toString().padStart(2,'0')}`;
    let winAudio = new Audio('audio/win-applause-sound.wav');
    winAudio.play();
    completedLevelStyle();
}

function completedLevelStyle () {
    const levelBlock = document.querySelector(`.level[data-level='${currentLevel}']`);
    levelBlock.style.backgroundColor = '#daffd4';
    levelBlock.children[3].style.backgroundImage = 'url("img/check_icon.png")';
    if(window.matchMedia("(max-width: 767px)").matches){
        levelBlock.children[3].style.width = levelBlock.children[3].style.height = '40px';
        levelBlock.children[3].style.marginRight = '6px';
        levelBlock.style.padding = '15px 20px';
    }
    else {
        levelBlock.children[3].style.width = levelBlock.children[3].style.height = '60px';
        levelBlock.children[3].style.marginRight = '8px';
    }
   
    addStarsRange.call(document.querySelector(`.level[data-level='${currentLevel}']`).children[2]);
}

function winMultiplayerGame(){
    multiplayerObj['moves'] = currentMoves;
    multiplayerObj['time'] = Math.floor((new Date().getTime() - timeStarted) / 1000);
    postData(serverURL,multiplayerObj, 'endGame')
    .catch(error => console.log(error));
    endGame();
}

function loseMultiplayerGame(data){
    modalWrap.classList.remove('hide');
    document.querySelector('.window-win').classList.remove('hide');
    document.querySelector('.window-win__stars').display = 'none';
    document.querySelector('.window-win h1').innerHTML = `You lose this game`;
    document.querySelector('.window-win__text').innerHTML = `You get 0 Memory Points<br/>
    Oponent Moves: ${data.moves}<br/>Time: ${Math.floor(data.time / 60)}:${(data.time % 60).toString().padStart(2,'0')}`;
    let loseAudio = new Audio('audio/lose_sound.wav');
    loseAudio.play();
}

function rundomizeArrayElements(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function showLevels() {
    tableBody.innerHTML = '';
    levelsRounds[currentLevel] = levelsRounds[currentLevel] += 1;
    levelsBlock.classList.remove('hide');
    gameBlock.classList.add('hide');
    gameModeBlock.classList.remove('hide');
}

function changeSpeed() {
    timeSpeedSec = +this.dataset.speed * 100;
    document.querySelector('.game__button-speed.active').classList.remove('active');
    this.classList.add('active');
}

function addStarsRange() {
    let starsCount = 1;
    if (currentMoves <= findedCards) starsCount = 3;
    else if (currentMoves < findedCards + Math.round(findedCards / 4)) starsCount = 2;

    this.innerHTML = '';
    this.display = 'flex';
    for (let i = 0; i < starsCount; i++) {
        let star = document.createElement('img');
        star.src = 'img/star_icon.png';
        this.append(star);
    }
}

async function findPlayer() {
    multiplayerModal.classList.remove('hide');
    modalWrap.classList.remove('hide');
    const mplayerModalTime = document.querySelector('.window-multiplayer__time');
    mplayerModalTime.textContent = '10';
    document.querySelector('.window-multiplayer__text').innerHTML = 'Waiting for player...'

    let intervalID = setInterval(() => {
        let count = +mplayerModalTime.textContent;
        mplayerModalTime.textContent = --count;
    }, 1000);

    await postData(serverURL, multiplayerObj, 'findPlayer')
        .then(response => response.json())
        .then(data => {
            multiplayerObj.room = data.room;
        })
        .catch(() => {
            showErrorFindPlayer();
        });

    clearInterval(intervalID);

    if (multiplayerObj.room !== '-1') {
        modalWrap.classList.add('hide');
        multiplayerModal.classList.add('hide');
        return true;
    }
    else {
        showErrorFindPlayer();
    }
    return false;
}

function showErrorFindPlayer() {
    document.querySelector('.window-multiplayer__time').textContent = '';
    document.querySelector('.window-multiplayer__text').innerHTML = `Sorry we can't find player for this level<br/>Please try latter or invite your friend`;
    setTimeout(() => {
        modalWrap.classList.add('hide');
        multiplayerModal.classList.add('hide');
    }, 3000);
}

function checkingMultiplayerEndGame() {
    setTimeout(async () => {
        await postData(serverURL, multiplayerObj, 'checkRoom')
            .then(result => result.json())
            .then(data => {
                if(data.end) loseMultiplayerGame(data);
            })
            .catch(() => {
                alert('З\'єднання перервано, надалі ви гратимете без конкурента');
            })
    }, 1000);
}

function showNumbers(){
    for (let elem of document.querySelectorAll('.card__number')) {
        document.querySelector('.switch__input').checked? elem.style.opacity = '1' : elem.style.opacity = '0';
    }
}

function restartGame(){
    tableBody.innerHTML = '';
    levelsRounds[currentLevel] = levelsRounds[currentLevel] += 1;
    document.querySelector('.game__rounds').children[0].textContent = `${levelsRounds[currentLevel]}`;
    createTable(tableSize[0], tableSize[1]);
    movesBlock.textContent = '0';
    showNumbers();
}

const delay = (ms) => {
    const startPoint = new Date().getTime()
    while (new Date().getTime() - startPoint <= ms) {/* wait */ }
}

async function postData(url, data, func) {
    data['func'] = func;
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data)
    });
    return response;
}

document.querySelector('.show-levels').onclick = showLevels;

document.querySelector('.switch__input').onclick = showNumbers;

document.querySelector('.game__img_restart').addEventListener('click', restartGame);

document.querySelector('.window-win__button').onclick = () => {
    modalWrap.classList.add('hide');
    document.querySelector('.window-win').classList.add('hide');
    showLevels();
}

function playGame(){
    let cardsArr = Array.from(document.querySelectorAll('.card'));
    cardsArr.sort((a,b) => +a.dataset.imageid - (+b.dataset.imageid));
    let count = 0;
    let interval = setInterval(() => {
        if(count === cardsArr.length) clearInterval(interval);
        cardsArr[count].click();
        setTimeout(() => {
            cardsArr[count + 1].click();
            count += 2;
        },750)
    },1500)
}