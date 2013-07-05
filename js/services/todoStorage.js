/*global todomvc */
'use strict';

/**
 * Services that persists and retrieves TODOs from localStorage
*/
todomvc.factory('todoStorage', function() {
    var STORAGE_ID = 'wisdumb';
    if ('Parse' in window) {
        var Note = Parse.Collection.extend({
            model: Note
        });
        var collection = new Note();
    }
    return {
        get: function() {
            var value = JSON.parse(localStorage[STORAGE_ID] || '[]');
            if ('Parse' in window) {
                value = collection.at(0) || [];
                collection.fetch({
                    success: function(collection) {
                        console.error('collection', collection);
                        collection.each(function(object) {
                            console.warn('object', object);
                        });
                    },
                    error: function(collection, error) {
                        // The collection could not be retrieved.
                    }
                });
            }
            return value;
        },
        put: function(todos) {
            if ('Parse' in window) {
                collection.reset(todos);
            }
            localStorage[STORAGE_ID] = JSON.stringify(todos);
        }
    };
});
