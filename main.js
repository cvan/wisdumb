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
    return '<article id="card-' + escape_(card.id) + '" data-id="' + escape_(card.id) + '">' + escape_(card.body) + '<details open>' + escape_(card.details) + '</details></article>';
}

function deck(items) {
    cards = cards.concat(items);
    queue = queue.concat(items);
    draw();
}

function draw() {
    // TODO: If no more cards left, say that!
    visible = queue.shift();
    if (visible) {
        $('main div').html(newCard(visible));
    } else {
        $('main div').html("<article>You're on your own!</article>");
        $('main menu').hide();
    }
    setTimeout(function () {
        $('article, menu').addClass('show');
    }, 500);
}

for (var i = 0; i < decks.length; i++) {
    s = document.createElement('script');
    s.src = 'decks/' + decks[i] + '.js';
    document.body.appendChild(s);
}

function resetAll() {
    localStorage.clear();
    location.reload();
}


$(document.body).on('click', 'button', function() {
    switch ($(this).attr('class')) {
        case 'said-it':
            console.log('said', visible.id);
            said.push(visible);
            draw();
            break;
        case 'skip-it':
            console.log('skip', visible.id);
            skip.push(visible);
            // Push onto the end of the queue.
            queue.push(visible);
            draw();
            break;
        case 'forget-it':
            console.log('forget', visible.id);
            forget.push(visible);
            draw();
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
    resetAll();
});
