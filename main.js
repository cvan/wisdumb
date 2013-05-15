(function() {
    var cards = [];
    var decks = [];
    var decksObj = {};
    var deckName;
    var queue = [];
    var s;
    var visibleDeck;
    var visibleCard;

    var said = [];
    var skip = [];
    var forget = [];

    var usersRef = new Firebase('https://wisdumb.firebaseio.com/decks');
    usersRef.on('value', function(snapshot) {
        snapshot.val().forEach(function(value) {
            decks.push([value.slug, value.name]);
            decksObj[value.slug] = value;
        });
        deckName = loadDeck();
        loadDropdown(deckName);
    });

    function loadDropdown(deckName) {
        var deckHTML = '';
        var optionValue;
        var optionText;
        decks.forEach(function(value) {
            optionValue = value[0];
            optionText = value[1];
            deckHTML += '<option value="' + optionValue + '"' + (optionValue == deckName ? ' selected' : '') + '>' + optionText + '</option>';
        });
        $('select[name=deck]').append(deckHTML).on('change', function(e) {
            location.search = '?deck=' + $(this).val();
        });
    }

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
               '<details open>' + escape_(card.details || '') + '</details></article>';
    }

    function draw() {
        visibleCard = queue.shift();

        if (!visibleCard) {
            $('main div').html("<article>You're on your own!</article>");
            $('main menu').hide();
            return;
        }

        var rememberedSaid = JSON.parse(localStorage[deckName + '_said'] || '[]');
        var rememberedForget = JSON.parse(localStorage[deckName + '_forget'] || '[]');
        if (rememberedSaid.indexOf(visibleCard.id) > -1 ||
            rememberedForget.indexOf(visibleCard.id) > -1) {
            // Draw another if we've already "said it" or "forget it."
            return draw();
        }

        $('main div').html(newCard(visibleCard));
    }

    function loadDeck() {
        deckName = location.search.replace('?deck=', '');

        var deckObj = decksObj[deckName];
        if (deckObj) {
            visibleDeck = deckObj;

            // Append this deck's cards to the global `cards` array.
            cards = cards.concat(deckObj.items);

            // Append this deck's cards to the global `queue` array.
            queue = queue.concat(deckObj.items);

            // Draw first card.
            draw();
        }

        return deckName;
    }

    function saidIt() {
        said.push(visibleCard);

        // Look up the remembered value in `localStorage`. Then store it.
        var remembered = JSON.parse(localStorage[deckName + '_said'] || '[]');
        remembered.push(visibleCard.id);
        localStorage[deckName + '_said'] = JSON.stringify(remembered);

        draw();
    }

    function forgetIt() {
        forget.push(visibleCard);

        // Look up the remembered value in `localStorage`. Then store it.
        var remembered = JSON.parse(localStorage[deckName + '_forget'] || '[]');
        remembered.push(visibleCard.id);
        localStorage[deckName + '_forget'] = JSON.stringify(remembered);

        draw();
    }

    function skipIt() {
        skip.push(visibleCard);

        // Push onto the end of the queue.
        queue.push(visibleCard);
        draw();
    }

    function resetAll() {
        localStorage.clear();
        location.reload();
    }

    $(document.body).on('click', 'button', function() {
        switch ($(this).attr('class')) {
            case 'said-it':
                console.log('said', visibleCard.id);
                saidIt(visibleCard);
                break;
            case 'forget-it':
                console.log('forget', visibleCard.id);
                forgetIt(visibleCard);
                break;
            case 'skip-it':
                console.log('skip', visibleCard.id);
                skipIt(visibleCard);
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
})();
