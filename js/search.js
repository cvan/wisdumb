(function() {
    var WisdumbSearch = (function() {
        var engine = new fullproof.ScoringEngine();
        var data = [];
        var dbName = 'wisdumb';

        function makeInitializer(progressCallback) {
            return function(injector, callback) {
                var synchro = fullproof.make_synchro_point(callback, data.length - 1);
                var values = [];
                for (var i = 0; i < data.length; ++i) {
                    values.push(i);
                }
                injector.injectBulk(data, values, callback, progressCallback);
            }
        }

        /**
         * Starts the WisdumbSearch search engine
         * @param callback called when the search engine is ready
         * @param progress if the indexes need to be initialized, this function is called with the progress value, ranging from 0 to 1.
         */
        this.start = function(callback, progress) {

            data = window.manageView.getAll().map(function(x) { return x.attributes.content; });
            console.error(data)

            var index1 = new fullproof.IndexUnit('normalindex',
                new fullproof.Capabilities().setStoreObjects(false)
                                            .setUseScores(true)
                                            .setDbName(dbName)
                                            .setComparatorObject(fullproof.ScoredEntry.comparatorObject)
                                            .setDbSize(8 * 1024 * 1024),
                new fullproof.ScoringAnalyzer(fullproof.normalizer.to_lowercase_nomark,
                                              fullproof.normalizer.remove_duplicate_letters),
                makeInitializer(function(val) {
                    progress(val / 2);
                }));

            var index2 = new fullproof.IndexUnit('stemmedindex',
                new fullproof.Capabilities().setStoreObjects(false)
                                            .setUseScores(true)
                                            .setDbName(dbName)
                                            .setComparatorObject(fullproof.ScoredEntry.comparatorObject)
                                            .setDbSize(8 * 1024 * 1024),
                new fullproof.ScoringAnalyzer(fullproof.normalizer.to_lowercase_nomark,
                                              fullproof.english.metaphone),
                makeInitializer(function(val) {
                    progress(val / 2 + 0.5);
                }));

            engine.open([index1, index2],
                        fullproof.make_callback(callback, true),
                        fullproof.make_callback(callback, false));
        }

        this.lookup = function(txt, callback) {
            engine.lookup(txt, function(resultset) {
                if (!resultset) {
                    return 'No match';
                }

                resultset.setComparatorObject({
                    lower_than: function(a,b) {
                        return a.score > b.score;
                    },
                    equals: function(a,b) {
                        return a.score === b.score;
                    }
                });

                var result = '';
                if (resultset.getSize() == 0) {
                    result += "<div style='font-weight:bold;'>No result found for query &ldquo;" + txt + '&rdquo;</div>';
                } else {
                    result += "<div>" + resultset.getSize() + " entr" + (resultset.getSize() > 1 ? 'ies were' : 'y was') + " found</div>";
                }
                result += "<table><tr><th>Tip</th><th>Search score</th></tr>";
                resultset.forEach(function(entry) {
                    if (entry instanceof fullproof.ScoredElement) {
                        var line = data[entry.value];
                        result += '<tr><td>' + (line || '-') + '</td><td>' + entry.score.toFixed(3) + '</td></tr>';
                    } else {
                        result += '<tr><td>' + (data[line] || '-') + '</td></tr>';
                    }
                });
                result += '</table>';

                if (!txt) {
                    result = '';
                }

                callback(result);
            });
        };

        this.reloadDatabase = function(callback) {
            engine.clear(callback || function() {
                window.location.reload(true);
            });
        };

        return this;
    })();

    $(document).on('todosrendered', function() {
        WisdumbSearch.start(function(i) {
            if (i) {
                $('#loading').hide();
                $('#application').show();
            }
        }, function(progress) {
            $('#progress').html(parseInt(progress * 100));
        });

        var now = (function() {
            var perf = window.performance || {};
            var fn = perf.now || perf.mozNow || perf.webkitNow || perf.msNow || perf.oNow;
            // fn.bind will be available in all the browsers that support the advanced window.performance... ;-)
            return fn ? fn.bind(perf) : function() { return new Date().getTime(); };
        })();

        function search() {
            var value = $("#typehere").val();

            var startTime = now();

            WisdumbSearch.lookup(value, function(result) {
                var time = now() - startTime;
                time = time.toFixed(3);
                result = "<div>Request processed in " + time + " ms</div>" + result;
                if (!value) {
                    result = '';
                }
                $('#results').html(result);
            });
        }

        $('#clear').click(function() {
            $('#results').html('');
        });

        $('#search').click(search);
        $('#typehere').change(search);
        $('#reload').click(function() {
            WisdumbSearch.reloadDatabase();
        });
    });

})();
