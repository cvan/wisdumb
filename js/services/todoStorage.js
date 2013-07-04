/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
*/
todomvc.factory('todoStorage', function () {
    var STORAGE_ID = 'wisdumb';
    var Note = Parse.Collection.extend({
        model: Note
    });
    var note = new Note();
    return {
        get: function() {
            var value = JSON.parse(localStorage[STORAGE_ID] || '[]');
            value = note.at(0);
            return value;
        },
        put: function(todos) {
            note.reset(todos);
            localStorage[STORAGE_ID] = JSON.stringify(todos);
        }
    };
});
