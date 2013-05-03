var decks = ['meetup'];
var cards = [];
var queue = [];
var s;
var visible;

var said = [];
var skip = [];
var forget = [];


function escape_(s) {
    if (typeof s === 'string') {
        return s.replace(/&/g, '&amp;')
                .replace(/>/g, '&gt;')
                .replace(/</g, '&lt;')
                .replace(/'/g, '&#39;')
                .replace(/"/g, '&#34;');
    } else {
        return s;
    }
}

function newCard(card) {
    return '<article id="card-' + escape_(card.id) +
           '" data-id="' + escape_(card.id) + '">' + escape_(card.body) +
           '<details open>' + escape_(card.details) + '</details></article>';
}

function deck(items) {
    cards = cards.concat(items);
    queue = queue.concat(items);
    draw();
}

function draw() {
    // TODO: If no more cards left, say that!
    visible = queue.shift();

    if (!visible) {
        $('main div').html("<article>You're on your own!</article>");
        $('main menu').hide();
        return;
    }

    var rememberedSaid = JSON.parse(localStorage.said || '[]');
    var rememberedForget = JSON.parse(localStorage.forget || '[]');
    if (rememberedSaid.indexOf(visible.id) > -1 ||
        rememberedForget.indexOf(visible.id) > -1) {
        // Draw another if we've already "said it" or "forget it."
        return draw();
    }

    if (visible) {
        $('main div').html(newCard(visible));
    }
    //setTimeout(function () {
    //$('article, menu').addClass('show');
    //}, 500);
}

for (var i = 0; i < decks.length; i++) {
    s = document.createElement('script');
    s.src = 'decks/' + decks[i] + '.js';
    document.body.appendChild(s);
}

function saidIt() {
    said.push(visible);

    // Remember in localStorage.
    var remembered = JSON.parse(localStorage.said || '[]');
    remembered.push(visible.id);
    localStorage.said = JSON.stringify(remembered);

    draw();
}

function forgetIt() {
    forget.push(visible);

    // Remember in localStorage.
    var remembered = JSON.parse(localStorage.forget || '[]');
    remembered.push(visible.id);
    localStorage.forget = JSON.stringify(remembered);

    draw();
}

function skipIt() {
    skip.push(visible);

    // Push onto the end of the queue.
    queue.push(visible);
    draw();
}

function resetAll() {
    localStorage.clear();
    location.reload();
}

$(document.body).on('click', 'button', function() {
    switch ($(this).attr('class')) {
        case 'said-it':
            console.log('said', visible.id);
            saidIt(visible);
            break;
        case 'forget-it':
            console.log('forget', visible.id);
            forgetIt(visible);
            break;
        case 'skip-it':
            console.log('skip', visible.id);
            skipIt(visible);
            break;
        case 'view-all':
            console.log('view-all');
            break;
        case 'reset-all':
            console.log('reset-all');
            resetAll();
            break;
    }
    $('.show').removeClass('show');
}).on('click', 'h1', function() {
    location.reload();
});
