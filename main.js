(function() {
    var cards = [];
    var decks = [];
    var decksObj = {};
    var deckName;
    var idx;
    var queue = [];
    var s;
    var visibleDeck;
    var visibleCard;

    var said = [];
    var skip = [];
    var forget = [];

    var decksRef = new Firebase('https://wisdumb.firebaseio.com/decks');
    decksRef.on('value', function(snapshot) {
        var value;
        for (idx in snapshot.val()) {
            value = snapshot.val()[idx];
            if (!(value.slug in decksObj)) {
                value.pk = idx;
                decks.push([value.slug, value.name]);
                decksObj[value.slug] = value;
            }
        }
        deckName = loadDeck();
        loadDropdown(deckName);
    });

    $('select[name=deck]').on('change', function(e) {
        location.search = '?deck=' + $(this).val();
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
        $('select[name=deck] option[value=""] ~ option').remove();
        $('select[name=deck]').append(deckHTML);
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

    function slugify(s) {
        if (typeof s === 'string') {
            return s.toLowerCase()
                    .replace(/\s+/g, '-')      // Replace spaces with dashes
                    .replace(/[^\w\-]+/g, '')  // Remove anything non-alphanumeric
                    .replace(/\-\-+/g, '-')    // Collapse dashes
                    .replace(/^-+/, '')        // Strip leading whitespace
                    .replace(/-+$/, '');       // Strip trailing whitespace
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
            $('.view').html("<article>You're on your own!</article>");
            $('main menu').addClass('empty');
            return;
        }

        var rememberedSaid = JSON.parse(localStorage[deckName + '_said'] || '[]');
        var rememberedForget = JSON.parse(localStorage[deckName + '_forget'] || '[]');
        if (rememberedSaid.indexOf(visibleCard.id) > -1 ||
            rememberedForget.indexOf(visibleCard.id) > -1) {
            // Draw another if we've already "said it" or "forget it."
            return draw();
        }

        $('.view').html(newCard(visibleCard));
    }

    function loadDeck() {
        deckName = location.search.replace('?deck=', '');

        var deckObj = decksObj[deckName];
        if (deckObj) {
            visibleDeck = deckObj;

            // Append this deck's cards to the global `cards` and `queue` arrays.
            var card;
            for (idx in deckObj.items) {
                card = deckObj.items[idx];
                card.id = idx;
                cards.push(card);
                queue.push(card);
            }

            // Draw first card.
            draw();

            showEditDeckButton();
            showAddCardButton();
        }

        return deckName;
    }

    function toggleAddDeck() {
        $('div.create-deck').toggle();
    }

    function toggleEditDeck() {
        var $div = $('div.edit-deck');
        $div.toggle();
        $div.find('input[name=title]').val(visibleDeck.name);
        $div.find('select[name=author]').val(visibleDeck.author);
    }

    function showEditDeckButton() {
        $('button.edit-deck').show();
    }

    function showAddCardButton() {
        $('button.add-card').show();
    }

    function toggleAddCard() {
        $('.view, .create-card').toggle();
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

    $(document.body).on('pointerdown', 'button', function() {
        switch ($(this).attr('class')) {
            case 'organize add-deck':
                console.log('add-deck');
                toggleAddDeck();
                break;
            case 'organize edit-deck':
                console.log('edit-deck');
                toggleEditDeck();
                break;
            case 'organize add-card':
                console.log('add-card');
                toggleAddCard();
                break;
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
    }).on('pointerdown', 'h1', function() {
        location.reload();
    }).on('pointerdown', '.create-deck .cancel', function() {
        toggleAddDeck();
    }).on('submit', '.form-new-deck', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $this = $(this);
        var title = $this.find('input[name=title]').val();
        decksRef.push({
            name: title,
            slug: slugify(title),
            author: +$this.find('select[name=author]').val(),
            items: {}
        });
    }).on('submit', '.form-edit-deck', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $this = $(this);
        var title = $this.find('input[name=title]').val();
        var slug = slugify(title);
        decksRef.child(visibleDeck.pk).update({
            name: title,
            slug: slug,
            author: +$this.find('select[name=author]').val()
        });
        window.location.search = '?deck=' + slug;
    }).on('submit', '.form-new-card', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $this = $(this);
        decksRef.child(visibleDeck.pk + '/items').push({
            body: $this.find('textarea[name=body]').val(),
            details: $this.find('textarea[name=details]').val(),
            position: 0
        });
        // Clear out the `textarea`s.
        $this.find('textarea').val('');

        // If the queue was empty, it's not anymore now!
        toggleAddCard();

        // Show the other buttons if the queue was empty before this addition.
        $('menu.empty').removeClass('empty');
    }).on('pointerdown', '.create-card .cancel', function() {
        toggleAddCard();
    });

})();
