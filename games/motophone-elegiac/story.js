// Created with Squiffy 5.1.2
// https://github.com/textadventures/squiffy

(function(){
/* jshint quotmark: single */
/* jshint evil: true */

var squiffy = {};

(function () {
    'use strict';

    squiffy.story = {};

    var initLinkHandler = function () {
        var handleLink = function (link) {
            if (link.hasClass('disabled')) return;
            var passage = link.data('passage');
            var section = link.data('section');
            var rotateAttr = link.attr('data-rotate');
            var sequenceAttr = link.attr('data-sequence');
            if (passage) {
                disableLink(link);
                squiffy.set('_turncount', squiffy.get('_turncount') + 1);
                passage = processLink(passage);
                if (passage) {
                    currentSection.append('<hr/>');
                    squiffy.story.passage(passage);
                }
                var turnPassage = '@' + squiffy.get('_turncount');
                if (turnPassage in squiffy.story.section.passages) {
                    squiffy.story.passage(turnPassage);
                }
                if ('@last' in squiffy.story.section.passages && squiffy.get('_turncount')>= squiffy.story.section.passageCount) {
                    squiffy.story.passage('@last');
                }
            }
            else if (section) {
                currentSection.append('<hr/>');
                disableLink(link);
                section = processLink(section);
                squiffy.story.go(section);
            }
            else if (rotateAttr || sequenceAttr) {
                var result = rotate(rotateAttr || sequenceAttr, rotateAttr ? link.text() : '');
                link.html(result[0].replace(/&quot;/g, '"').replace(/&#39;/g, '\''));
                var dataAttribute = rotateAttr ? 'data-rotate' : 'data-sequence';
                link.attr(dataAttribute, result[1]);
                if (!result[1]) {
                    disableLink(link);
                }
                if (link.attr('data-attribute')) {
                    squiffy.set(link.attr('data-attribute'), result[0]);
                }
                squiffy.story.save();
            }
        };

        squiffy.ui.output.on('click', 'a.squiffy-link', function () {
            handleLink(jQuery(this));
        });

        squiffy.ui.output.on('keypress', 'a.squiffy-link', function (e) {
            if (e.which !== 13) return;
            handleLink(jQuery(this));
        });

        squiffy.ui.output.on('mousedown', 'a.squiffy-link', function (event) {
            event.preventDefault();
        });
    };

    var disableLink = function (link) {
        link.addClass('disabled');
        link.attr('tabindex', -1);
    }
    
    squiffy.story.begin = function () {
        if (!squiffy.story.load()) {
            squiffy.story.go(squiffy.story.start);
        }
    };

    var processLink = function(link) {
		link = String(link);
        var sections = link.split(',');
        var first = true;
        var target = null;
        sections.forEach(function (section) {
            section = section.trim();
            if (startsWith(section, '@replace ')) {
                replaceLabel(section.substring(9));
            }
            else {
                if (first) {
                    target = section;
                }
                else {
                    setAttribute(section);
                }
            }
            first = false;
        });
        return target;
    };

    var setAttribute = function(expr) {
        var lhs, rhs, op, value;
        var setRegex = /^([\w]*)\s*=\s*(.*)$/;
        var setMatch = setRegex.exec(expr);
        if (setMatch) {
            lhs = setMatch[1];
            rhs = setMatch[2];
            if (isNaN(rhs)) {
				if(startsWith(rhs,"@")) rhs=squiffy.get(rhs.substring(1));
                squiffy.set(lhs, rhs);
            }
            else {
                squiffy.set(lhs, parseFloat(rhs));
            }
        }
        else {
			var incDecRegex = /^([\w]*)\s*([\+\-\*\/])=\s*(.*)$/;
            var incDecMatch = incDecRegex.exec(expr);
            if (incDecMatch) {
                lhs = incDecMatch[1];
                op = incDecMatch[2];
				rhs = incDecMatch[3];
				if(startsWith(rhs,"@")) rhs=squiffy.get(rhs.substring(1));
				rhs = parseFloat(rhs);
                value = squiffy.get(lhs);
                if (value === null) value = 0;
                if (op == '+') {
                    value += rhs;
                }
                if (op == '-') {
                    value -= rhs;
                }
				if (op == '*') {
					value *= rhs;
				}
				if (op == '/') {
					value /= rhs;
				}
                squiffy.set(lhs, value);
            }
            else {
                value = true;
                if (startsWith(expr, 'not ')) {
                    expr = expr.substring(4);
                    value = false;
                }
                squiffy.set(expr, value);
            }
        }
    };

    var replaceLabel = function(expr) {
        var regex = /^([\w]*)\s*=\s*(.*)$/;
        var match = regex.exec(expr);
        if (!match) return;
        var label = match[1];
        var text = match[2];
        if (text in squiffy.story.section.passages) {
            text = squiffy.story.section.passages[text].text;
        }
        else if (text in squiffy.story.sections) {
            text = squiffy.story.sections[text].text;
        }
        var stripParags = /^<p>(.*)<\/p>$/;
        var stripParagsMatch = stripParags.exec(text);
        if (stripParagsMatch) {
            text = stripParagsMatch[1];
        }
        var $labels = squiffy.ui.output.find('.squiffy-label-' + label);
        $labels.fadeOut(1000, function() {
            $labels.html(squiffy.ui.processText(text));
            $labels.fadeIn(1000, function() {
                squiffy.story.save();
            });
        });
    };

    squiffy.story.go = function(section) {
        squiffy.set('_transition', null);
        newSection();
        squiffy.story.section = squiffy.story.sections[section];
        if (!squiffy.story.section) return;
        squiffy.set('_section', section);
        setSeen(section);
        var master = squiffy.story.sections[''];
        if (master) {
            squiffy.story.run(master);
            squiffy.ui.write(master.text);
        }
        squiffy.story.run(squiffy.story.section);
        // The JS might have changed which section we're in
        if (squiffy.get('_section') == section) {
            squiffy.set('_turncount', 0);
            squiffy.ui.write(squiffy.story.section.text);
            squiffy.story.save();
        }
    };

    squiffy.story.run = function(section) {
        if (section.clear) {
            squiffy.ui.clearScreen();
        }
        if (section.attributes) {
            processAttributes(section.attributes);
        }
        if (section.js) {
            section.js();
        }
    };

    squiffy.story.passage = function(passageName) {
        var passage = squiffy.story.section.passages[passageName];
        if (!passage) return;
        setSeen(passageName);
        var masterSection = squiffy.story.sections[''];
        if (masterSection) {
            var masterPassage = masterSection.passages[''];
            if (masterPassage) {
                squiffy.story.run(masterPassage);
                squiffy.ui.write(masterPassage.text);
            }
        }
        var master = squiffy.story.section.passages[''];
        if (master) {
            squiffy.story.run(master);
            squiffy.ui.write(master.text);
        }
        squiffy.story.run(passage);
        squiffy.ui.write(passage.text);
        squiffy.story.save();
    };

    var processAttributes = function(attributes) {
        attributes.forEach(function (attribute) {
            if (startsWith(attribute, '@replace ')) {
                replaceLabel(attribute.substring(9));
            }
            else {
                setAttribute(attribute);
            }
        });
    };

    squiffy.story.restart = function() {
        if (squiffy.ui.settings.persist && window.localStorage) {
            var keys = Object.keys(localStorage);
            jQuery.each(keys, function (idx, key) {
                if (startsWith(key, squiffy.story.id)) {
                    localStorage.removeItem(key);
                }
            });
        }
        else {
            squiffy.storageFallback = {};
        }
        if (squiffy.ui.settings.scroll === 'element') {
            squiffy.ui.output.html('');
            squiffy.story.begin();
        }
        else {
            location.reload();
        }
    };

    squiffy.story.save = function() {
        squiffy.set('_output', squiffy.ui.output.html());
    };

    squiffy.story.load = function() {
        var output = squiffy.get('_output');
        if (!output) return false;
        squiffy.ui.output.html(output);
        currentSection = jQuery('#' + squiffy.get('_output-section'));
        squiffy.story.section = squiffy.story.sections[squiffy.get('_section')];
        var transition = squiffy.get('_transition');
        if (transition) {
            eval('(' + transition + ')()');
        }
        return true;
    };

    var setSeen = function(sectionName) {
        var seenSections = squiffy.get('_seen_sections');
        if (!seenSections) seenSections = [];
        if (seenSections.indexOf(sectionName) == -1) {
            seenSections.push(sectionName);
            squiffy.set('_seen_sections', seenSections);
        }
    };

    squiffy.story.seen = function(sectionName) {
        var seenSections = squiffy.get('_seen_sections');
        if (!seenSections) return false;
        return (seenSections.indexOf(sectionName) > -1);
    };
    
    squiffy.ui = {};

    var currentSection = null;
    var screenIsClear = true;
    var scrollPosition = 0;

    var newSection = function() {
        if (currentSection) {
            disableLink(jQuery('.squiffy-link', currentSection));
        }
        var sectionCount = squiffy.get('_section-count') + 1;
        squiffy.set('_section-count', sectionCount);
        var id = 'squiffy-section-' + sectionCount;
        currentSection = jQuery('<div/>', {
            id: id,
        }).appendTo(squiffy.ui.output);
        squiffy.set('_output-section', id);
    };

    squiffy.ui.write = function(text) {
        screenIsClear = false;
        scrollPosition = squiffy.ui.output.height();
        currentSection.append(jQuery('<div/>').html(squiffy.ui.processText(text)));
        squiffy.ui.scrollToEnd();
    };

    squiffy.ui.clearScreen = function() {
        squiffy.ui.output.html('');
        screenIsClear = true;
        newSection();
    };

    squiffy.ui.scrollToEnd = function() {
        var scrollTo, currentScrollTop, distance, duration;
        if (squiffy.ui.settings.scroll === 'element') {
            scrollTo = squiffy.ui.output[0].scrollHeight - squiffy.ui.output.height();
            currentScrollTop = squiffy.ui.output.scrollTop();
            if (scrollTo > currentScrollTop) {
                distance = scrollTo - currentScrollTop;
                duration = distance / 0.4;
                squiffy.ui.output.stop().animate({ scrollTop: scrollTo }, duration);
            }
        }
        else {
            scrollTo = scrollPosition;
            currentScrollTop = Math.max(jQuery('body').scrollTop(), jQuery('html').scrollTop());
            if (scrollTo > currentScrollTop) {
                var maxScrollTop = jQuery(document).height() - jQuery(window).height();
                if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
                distance = scrollTo - currentScrollTop;
                duration = distance / 0.5;
                jQuery('body,html').stop().animate({ scrollTop: scrollTo }, duration);
            }
        }
    };

    squiffy.ui.processText = function(text) {
        function process(text, data) {
            var containsUnprocessedSection = false;
            var open = text.indexOf('{');
            var close;
            
            if (open > -1) {
                var nestCount = 1;
                var searchStart = open + 1;
                var finished = false;
             
                while (!finished) {
                    var nextOpen = text.indexOf('{', searchStart);
                    var nextClose = text.indexOf('}', searchStart);
         
                    if (nextClose > -1) {
                        if (nextOpen > -1 && nextOpen < nextClose) {
                            nestCount++;
                            searchStart = nextOpen + 1;
                        }
                        else {
                            nestCount--;
                            searchStart = nextClose + 1;
                            if (nestCount === 0) {
                                close = nextClose;
                                containsUnprocessedSection = true;
                                finished = true;
                            }
                        }
                    }
                    else {
                        finished = true;
                    }
                }
            }
            
            if (containsUnprocessedSection) {
                var section = text.substring(open + 1, close);
                var value = processTextCommand(section, data);
                text = text.substring(0, open) + value + process(text.substring(close + 1), data);
            }
            
            return (text);
        }

        function processTextCommand(text, data) {
            if (startsWith(text, 'if ')) {
                return processTextCommand_If(text, data);
            }
            else if (startsWith(text, 'else:')) {
                return processTextCommand_Else(text, data);
            }
            else if (startsWith(text, 'label:')) {
                return processTextCommand_Label(text, data);
            }
            else if (/^rotate[: ]/.test(text)) {
                return processTextCommand_Rotate('rotate', text, data);
            }
            else if (/^sequence[: ]/.test(text)) {
                return processTextCommand_Rotate('sequence', text, data);   
            }
            else if (text in squiffy.story.section.passages) {
                return process(squiffy.story.section.passages[text].text, data);
            }
            else if (text in squiffy.story.sections) {
                return process(squiffy.story.sections[text].text, data);
            }
			else if (startsWith(text,'@') && !startsWith(text,'@replace')) {
				processAttributes(text.substring(1).split(","));
				return "";
			}
            return squiffy.get(text);
        }

        function processTextCommand_If(section, data) {
            var command = section.substring(3);
            var colon = command.indexOf(':');
            if (colon == -1) {
                return ('{if ' + command + '}');
            }

            var text = command.substring(colon + 1);
            var condition = command.substring(0, colon);
			condition = condition.replace("<", "&lt;");
            var operatorRegex = /([\w ]*)(=|&lt;=|&gt;=|&lt;&gt;|&lt;|&gt;)(.*)/;
            var match = operatorRegex.exec(condition);

            var result = false;

            if (match) {
                var lhs = squiffy.get(match[1]);
                var op = match[2];
                var rhs = match[3];

				if(startsWith(rhs,'@')) rhs=squiffy.get(rhs.substring(1));
				
                if (op == '=' && lhs == rhs) result = true;
                if (op == '&lt;&gt;' && lhs != rhs) result = true;
                if (op == '&gt;' && lhs > rhs) result = true;
                if (op == '&lt;' && lhs < rhs) result = true;
                if (op == '&gt;=' && lhs >= rhs) result = true;
                if (op == '&lt;=' && lhs <= rhs) result = true;
            }
            else {
                var checkValue = true;
                if (startsWith(condition, 'not ')) {
                    condition = condition.substring(4);
                    checkValue = false;
                }

                if (startsWith(condition, 'seen ')) {
                    result = (squiffy.story.seen(condition.substring(5)) == checkValue);
                }
                else {
                    var value = squiffy.get(condition);
                    if (value === null) value = false;
                    result = (value == checkValue);
                }
            }

            var textResult = result ? process(text, data) : '';

            data.lastIf = result;
            return textResult;
        }

        function processTextCommand_Else(section, data) {
            if (!('lastIf' in data) || data.lastIf) return '';
            var text = section.substring(5);
            return process(text, data);
        }

        function processTextCommand_Label(section, data) {
            var command = section.substring(6);
            var eq = command.indexOf('=');
            if (eq == -1) {
                return ('{label:' + command + '}');
            }

            var text = command.substring(eq + 1);
            var label = command.substring(0, eq);

            return '<span class="squiffy-label-' + label + '">' + process(text, data) + '</span>';
        }

        function processTextCommand_Rotate(type, section, data) {
            var options;
            var attribute = '';
            if (section.substring(type.length, type.length + 1) == ' ') {
                var colon = section.indexOf(':');
                if (colon == -1) {
                    return '{' + section + '}';
                }
                options = section.substring(colon + 1);
                attribute = section.substring(type.length + 1, colon);
            }
            else {
                options = section.substring(type.length + 1);
            }
            var rotation = rotate(options.replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
            if (attribute) {
                squiffy.set(attribute, rotation[0]);
            }
            return '<a class="squiffy-link" data-' + type + '="' + rotation[1] + '" data-attribute="' + attribute + '" role="link">' + rotation[0] + '</a>';
        }

        var data = {
            fulltext: text
        };
        return process(text, data);
    };

    squiffy.ui.transition = function(f) {
        squiffy.set('_transition', f.toString());
        f();
    };

    squiffy.storageFallback = {};

    squiffy.set = function(attribute, value) {
        if (typeof value === 'undefined') value = true;
        if (squiffy.ui.settings.persist && window.localStorage) {
            localStorage[squiffy.story.id + '-' + attribute] = JSON.stringify(value);
        }
        else {
            squiffy.storageFallback[attribute] = JSON.stringify(value);
        }
        squiffy.ui.settings.onSet(attribute, value);
    };

    squiffy.get = function(attribute) {
        var result;
        if (squiffy.ui.settings.persist && window.localStorage) {
            result = localStorage[squiffy.story.id + '-' + attribute];
        }
        else {
            result = squiffy.storageFallback[attribute];
        }
        if (!result) return null;
        return JSON.parse(result);
    };

    var startsWith = function(string, prefix) {
        return string.substring(0, prefix.length) === prefix;
    };

    var rotate = function(options, current) {
        var colon = options.indexOf(':');
        if (colon == -1) {
            return [options, current];
        }
        var next = options.substring(0, colon);
        var remaining = options.substring(colon + 1);
        if (current) remaining += ':' + current;
        return [next, remaining];
    };

    var methods = {
        init: function (options) {
            var settings = jQuery.extend({
                scroll: 'body',
                persist: true,
                restartPrompt: true,
                onSet: function (attribute, value) {}
            }, options);

            squiffy.ui.output = this;
            squiffy.ui.restart = jQuery(settings.restart);
            squiffy.ui.settings = settings;

            if (settings.scroll === 'element') {
                squiffy.ui.output.css('overflow-y', 'auto');
            }

            initLinkHandler();
            squiffy.story.begin();
            
            return this;
        },
        get: function (attribute) {
            return squiffy.get(attribute);
        },
        set: function (attribute, value) {
            squiffy.set(attribute, value);
        },
        restart: function () {
            if (!squiffy.ui.settings.restartPrompt || confirm('Are you sure you want to restart?')) {
                squiffy.story.restart();
            }
        }
    };

    jQuery.fn.squiffy = function (methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions]
                .apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof methodOrOptions === 'object' || ! methodOrOptions) {
            return methods.init.apply(this, arguments);
        } else {
            jQuery.error('Method ' +  methodOrOptions + ' does not exist');
        }
    };
})();

var get = squiffy.get;
var set = squiffy.set;


squiffy.story.start = '_default';
squiffy.story.id = '7a4d823c0f';
squiffy.story.sections = {
	'_default': {
		'text': "<p>You are seated at a restaurant.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"_continue1\" role=\"link\" tabindex=\"0\">&gt;&gt; Take a look around the restaurant.</a></p>",
		'passages': {
		},
	},
	'_continue1': {
		'text': "<p>It is a medium-sized, welcoming establishment: well-kept if a bit pretentious. The walls are made of exposed brick and decorated with <a class=\"squiffy-link link-passage\" data-passage=\"an assortment of ornaments and curiosities\" role=\"link\" tabindex=\"0\">an assortment of ornaments and curiosities</a>. Overhead, a fleet of polished ceiling fans rotate lazily in between wooden rafters, their incandescent bulbs exuding a romantic golden glow onto <a class=\"squiffy-link link-passage\" data-passage=\"the floor below you\" role=\"link\" tabindex=\"0\">the floor below you</a>. Your cozy corner table certainly provides an excellent vantage point of the eatery.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"_continue2\" role=\"link\" tabindex=\"0\">&gt;&gt; Examine the contents of your own table.</a></p>",
		'passages': {
			'an assortment of ornaments and curiosities': {
				'text': "<p>Along the walls of the restaurant are a number of post-modernist paintings and art installments. The west wall assaults your eyeballs with a plethora of vintage clocks. Every persuasion of clockwork is present: analogue, digital, clockwork, cuckoo. Thankfully, their ticking seems to have been muted by some means, and each clock sits quietly at a different (incorrect) time. On the east wall, a watercolor painting by a famous artist - her name escapes you at the moment - is displayed prominently in a gilded frame. It depicts a large bear made out of several smaller bears.</p>\n<p>Above the table at which you are seated is a bronze plaque with the inscription &quot;The Elephant&#39;s Loom, est. 2035.&quot;</p>",
				'attributes': ["loom_ornaments"],
			},
			'the floor below you': {
				'text': "<p>You study the pattern of the rug with great interest. It appears to have been imported from a foreign country - south Asian, perhaps - where its intricate patterns and luxurious detail might have held spiritual significance. It now served as a glorified platter for a child&#39;s serving of mashed potatoes that the wait staff shows little to no interest in retrieving. </p>",
				'attributes': ["loom_floor"],
			},
		},
	},
	'_continue2': {
		'text': "<p>You observe two splendid meals, still warm, sitting atop a pair of porcelain plates. You have ordered tilapia: seared and garnished with lemon and parsley. The parsley is locally sourced. </p>\n<p>There is a curious parallelism to this particular table-for-two. The gentleman seated opposite you shares a tacit appreciation for perennial Alaskan seafood as he has ordered the exact same thing. Each of you holds a wine glass, though yours is filled with white wine and his with red. While your napkin is folded into an isosceles triangle, his is folded into an origami praying mantis. Next to each place setting is a blue ballpoint pen and a black portfolio; <a class=\"squiffy-link link-passage\" data-passage=\"yours\" role=\"link\" tabindex=\"0\">yours</a> is closed while his is opened. </p>\n<p>Your gaze meets his, and you realize that you haven&#39;t looked in his general direction in about ten minutes. </p>\n<p><a class=\"squiffy-link link-section\" data-section=\"likeabite\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Would you like a bite of my tilapia?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"haveabite\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Can I have a bite of your tilapia?&quot;</a></p>",
		'passages': {
			'yours': {
				'text': "<p>You move to open your portfolio, but The Man eyes you suspiciously. He then laughs heartily. &quot;Let&#39;s not get ahead of ourselves! There will be plenty of time for that later.&quot;</p>",
				'attributes': ["denied_portfolio"],
			},
		},
	},
	'likeabite': {
		'text': "<p>&quot;No, thank you,&quot; The Man replies. &quot;I&#39;m allergic to tilapia.&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\">> Take a bite of tilapia.\" role=\"link\" tabindex=\"0\">&gt;&gt; Take a bite of tilapia.</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\">> Take a drink of wine.\" role=\"link\" tabindex=\"0\">&gt;&gt; Take a drink of wine.</a></p>",
		'passages': {
		},
	},
	'haveabite': {
		'text': "<p>The Man raises an eyebrow at your curiously, then shrugs. &quot;Sure, it&#39;s all yours. I ate before we got here anyway.&quot; He forks a generous helping of fish onto your already-full plate.</p>\n<p>Your intuition kicks in. It is almost time for business. You glance down at the table in front of you. A crucial decision awaits.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\">> Take a bite of tilapia.\" role=\"link\" tabindex=\"0\">&gt;&gt; Take a bite of tilapia.</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\">> Take a drink of wine.\" role=\"link\" tabindex=\"0\">&gt;&gt; Take a drink of wine.</a></p>",
		'passages': {
		},
	},
	'>> Take a bite of tilapia.': {
		'text': "<p>It&#39;s a bit dry, but you are very hungry. </p>\n<p><a class=\"squiffy-link link-section\" data-section=\">> It is time for business.\" role=\"link\" tabindex=\"0\">&gt;&gt; It is time for business.</a></p>",
		'attributes': ["ate_tilapia"],
		'passages': {
		},
	},
	'>> Take a drink of wine.': {
		'text': "<p>The wine, despite tasting like watered-down hand soap, is surprisingly potent, and you feel a pleasant warmth in your throat as the alabaster fluid passes your lips. </p>\n<p><a class=\"squiffy-link link-section\" data-section=\">> It is time for business.\" role=\"link\" tabindex=\"0\">&gt;&gt; It is time for business.</a></p>",
		'attributes': ["drank_wine"],
		'passages': {
		},
	},
	'>> It is time for business.': {
		'text': "<p>&quot;Alright,&quot; <a class=\"squiffy-link link-passage\" data-passage=\"The Man\" role=\"link\" tabindex=\"0\">The Man</a> says, clearing his throat. He adjusts the collar of his suit and straightens his tie. &quot;I have something important to show you.&quot;</p>\n<p>With careful deliberation, he leafs through the contents of <a class=\"squiffy-link link-passage\" data-passage=\"his black portfolio\" role=\"link\" tabindex=\"0\">his black portfolio</a>. Occasionally, he pauses to tap his pen to his jaw as if deep in thought. After several minutes, he removes a slip of paper and places it on the white tablecloth. It appears to be some variety of rubric, with criteria such as &quot;body,&quot; &quot;flavor,&quot; and &quot;aroma.&quot; With a few scratches of his pen, the man completes the score sheet. He tucks it back into the portfolio and closes it gently.</p>\n<p>&quot;Now, it is time for business. Do you have any questions for me, before we begin? Otherwise, go ahead and make a mark.&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_1\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;What are we doing here again?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_2\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Why have you chosen me for this job?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_3\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Did you just grade your wine?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01a\" role=\"link\" tabindex=\"0\">&gt;&gt; Read the room.</a></p>",
		'passages': {
			'The Man': {
				'text': "<p>The gentleman sitting across from you has an unmistakably dignified, yet jovial air about him. You have reported to him as long as you can remember. He appears markedly fit for his age; he graduated about fifteen years prior to you. His trademark is an inconspicuous black suit (embroidered with a silver &quot;A.H.&quot;) and a bright orange tie with chocolate stripes. On any other day, you might have shared lunch and a conversation with him in a restaurant such as this. Today, the atmosphere is somewhat professional.</p>",
			},
			'his black portfolio': {
				'text': "<p>The portfolio is sizable, to say the least. Dozens of pink and yellow and blue slips of paper peek out from between the pages, marking different places in the text. You estimate that there are hundreds of dossiers within its folds, each detailing the financial tendencies of one of the Loom&#39;s regular patrons.</p>",
			},
		},
	},
	'tilapia_1': {
		'text': "<p>&quot;Nerves. I understand. You&#39;ve only been with this firm a couple of months, right?&quot; The Man nods sagely. He takes a wistful sip of his wine and leans back in his mahogany chair. &quot;I remember my first time at <a class=\"squiffy-link link-passage\" data-passage=\"the Loom\" role=\"link\" tabindex=\"0\">the Loom</a>. Under hand, over hill, or so they say.&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_1\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;What are we doing here again?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_2\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Why have you chosen me for this job?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_3\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Did you just grade your wine?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01a\" role=\"link\" tabindex=\"0\">&gt;&gt; Read the room.</a></p>",
		'passages': {
			'the Loom': {
				'text': "<p>&quot;What is the significance of this restaurant?&quot; you ask hesitantly. Your acquaintance stares straight ahead as if looking through you in order to examine the wall. </p>\n<p>&quot;The Elephant&#39;s Loom has been a staple of this city for years now. They make a great sauce. It&#39;s a remarkable piece of real estate, too. City limits, right on the county line. A nice place, to be sure, but you won&#39;t find it in any CEO&#39;s address book. It&#39;s a hotspot for the upper crust, real businessmen, the occasional heir. The people that walk through that door have money they don&#39;t know what to do with, and that&#39;s what places it squarely in our jurisdiction.&quot;</p>\n<p>He strokes his face absent-mindedly and glances up at the ceiling, as if convening with a higher power. &quot;Plus, their lips are a lot tighter than their purse-strings, if you catch my drift.&quot;</p>",
			},
		},
	},
	'tilapia_2': {
		'text': "<p>&quot;Why you? They say you&#39;re the very best. Since being transferred to my division you have passed every test and trial with flying colors. The suits seem to think it&#39;s high time that you started working in the field, and I tend to agree. Any old schmuck can follow a script; you know how to improvise. That silver tongue of yours is our hot ticket. These men are going to buy <a class=\"squiffy-link link-passage\" data-passage=\"what we have to sell\" role=\"link\" tabindex=\"0\">what we have to sell</a>, they just don&#39;t know it yet.&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_1\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;What are we doing here again?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_2\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Why have you chosen me for this job?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_3\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Did you just grade your wine?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01a\" role=\"link\" tabindex=\"0\">&gt;&gt; Read the room.</a></p>",
		'passages': {
			'what we have to sell': {
				'text': "<p>&quot;What is it that we&#39;re selling again, exactly?&quot; you ask in earnest.</p>\n<p>&quot;Wow, you really are nervous,&quot; The Man chuckles. &quot;We sell whatever sells. I&#39;ll sort you out with the minutae. Your job is to make the mark.&quot;</p>",
			},
		},
	},
	'tilapia_3': {
		'text': "<p>&quot;Have you not graded yours yet? How else might one assess a beverage of this caliber quantitatively? By what measure do you drink, friend?&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_1\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;What are we doing here again?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_2\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Why have you chosen me for this job?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"tilapia_3\" role=\"link\" tabindex=\"0\">&gt;&gt; &quot;Did you just grade your wine?&quot;</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01a\" role=\"link\" tabindex=\"0\">&gt;&gt; Read the room.</a></p>",
		'passages': {
		},
	},
	'mark_01a': {
		'text': "<p>You scan the room carefully. It is time to make your mark.</p>\n<p>Two tables down from your own, there is a tall man wearing a plaid suit sitting next to a tall, technicolor urn. Resting on the end of his nose are a pair of circular spectacles rimmed with gold, through which he is examining what appears to be an enthralling piece of parchment. A glass of ale rests inches from his left hand; you observe that he has nearly finished it. An inspection of his lapel reveals that he has recently finished a rack of ribs.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"plaid_01\" role=\"link\" tabindex=\"0\">&gt;&gt; Make your mark.</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01b\" role=\"link\" tabindex=\"0\">&gt;&gt; Continue to scan the room.</a></p>",
		'passages': {
		},
	},
	'plaid_01': {
		'text': "<p>&quot;What about the gentleman in the plaid suit?&quot; you ask, nodding in the direction of the table with the urn. &quot;He seems well-off. Do you have him on file?&quot;</p>\n<p>The Man furrows his brow and glances at his documents. He licks his finger and runs it carefully along the edge of the formidable portfolio. He then spreads it open on the table before him. &quot;Of course, he&#39;s a regular here. His name is Guandinere Johnson. Everything you need to know is right here in his dossier. It looks as if he&#39;s just finished his meal, though; don&#39;t wait too long.&quot;</p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_1\" role=\"link\" tabindex=\"0\">&gt; &quot;Give me some background information.&quot;</a></p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_2\" role=\"link\" tabindex=\"0\">&gt; &quot;Tell me his darkest secrets.&quot;</a></p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_3\" role=\"link\" tabindex=\"0\">&gt; &quot;Tell me <em>your</em> darkest secrets.&quot;</a></p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_4\" role=\"link\" tabindex=\"0\">&gt; &quot;What does he like to eat here?&quot;</a></p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_5\" role=\"link\" tabindex=\"0\">&gt; &quot;What can I sell him?&quot;</a></p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_6\" role=\"link\" tabindex=\"0\">&gt; &quot;Do you have anything about me in there?&quot;</a></p>\n<p><a class=\"squiffy-link link-passage\" data-passage=\"plaid_01_7\" role=\"link\" tabindex=\"0\">&gt; Look at your own portfolio.</a></p>",
		'passages': {
			'plaid_01_1': {
				'text': "<p>&quot;Give me some background information.&quot;</p>\n<p>&quot;Alright, let me see here...&quot; The Man procures a lengthy dossier from the depths of his portfolio. &quot;Guandinere Johnson. His thirty-sixth birthday is next week. Family scores about 8 out of 10 on the wealth scale. His father was a banker and his mother used the bank a lot. At twenty-seven he married some princess in Siam, fourth in line for the throne, 10 out of 10 hot. He&#39;s got a gentleman&#39;s taste, to be sure. Suits, watches, escorts, that sort of thing. Also a bit of a connoisseur when it comes to fine wines.{if drank_wine:  Judging from the look on your face, I&#39;d order him something red.}&quot;</p>",
				'attributes': ["plaid_background","plaid_name"],
			},
			'plaid_01_2': {
				'text': "<p>&quot;What are his darkest secrets?&quot; you ask in earnest.</p>\n<p>&quot;In terms of sketchiness? I&#39;d give him a 5 out of 10.&quot; The Man slides a rubric from the fold of his portfolio. &quot;Mostly typical businessman stuff, unfortunately. Offshore accounts, money mysteriously appearing and disappearing, that sort of thing. Had a close call with amphetamines a couple of years ago, but I&#39;d hardly fault him for that. Being that rich can&#39;t be easy.&quot;</p>",
				'attributes': ["plaid_darkest"],
			},
			'plaid_01_3': {
				'text': "<p>&quot;What are <em>your</em> darkest secrets?&quot; you ask in earnest.</p>\n<p>The Man frowns for a moment, then shrugs. &quot;In 2035, I hit a man with my car at a Mardi Gras parade. Well, actually, it was a kid, actually four kids, and I was driving a float. That isn&#39;t really important to the task at hand, however.&quot;</p>",
				'attributes': ["arthur_darkest"],
			},
			'plaid_01_4': {
				'text': "<p>You can already see the vestiges of prime rib on {if plaid_name: Guandinere Johnson&#39;s}{else: the man&#39;s} lapel. It would be silly to ask what he enjoys eating. He has clearly already eaten, so any relevance of the question to your operations has passed. Additionally, why would he order something from the restaurant that he did not enjoy? You quietly berate yourself for having the audacity to entertain such a frivolous question.</p>",
				'attributes': ["plaid_eat"],
			},
			'plaid_01_5': {
				'text': "<p>&quot;What can I sell him?&quot; you ask in earnest.</p>\n<p>The Man procures another rubric from his portfolio. This one is painstakingly marked up with a red pen.</p>\n<p>&quot;I need you to sell him fourteen ball-bearings.&quot;</p>",
				'attributes': ["plaid_sell"],
			},
			'plaid_01_6': {
				'text': "<p>&quot;Do you have anything about me in that portfolio of yours?&quot; you ask in earnest.</p>\n<p>&quot;Why, of course I do,&quot; reveals The Man without hesitation. &quot;Your name is Aria Wilco. You&#39;re twenty-five, so I suppose you&#39;ve been working at this company your entire adult life. Your skills are all right here in this file: persuasion, improvisation, tact, all 9s and 10s. A perfect 26 on the Aptitude Test. And today, 18th of April, 2113, marks the date of your first real challenge.&quot;</p>",
				'attributes': ["me"],
			},
			'plaid_01_7': {
				'text': "<p>{if denied_portfolio: Wordlessly, you eye the portfolio sitting next to your plate. The Man&#39;s countenance becomes incrementally intense as he realizes your intentions, but he is far too late. The smooth leather finish wafts euphorically into your nasal cavity, it&#39;s sweet contents inches from your prying eyeballs. }{else: You move to open your portfolio, but The Man eyes you suspiciously. He then laughs heartily. &quot;Let&#39;s not get ahead of ourselves! There will be plenty of time for that later.&quot;}</p>\n<p>{if denied_portfolio:{@my_portfolio}}{else:{@denied_portfolio}}</p>",
			},
			'@1': {
				'text': "<p>{if ate_tilapia: You can feel the tilapia churning unceremoniously in your abdomen.}{if drank_wine: The wine&#39;s intoxicating effects begin to take hold of your consciousness as the foul liquid stagnates in your abdomen.} You surmise that time remains for two further inquiries.</p>",
			},
			'@2': {
				'text': "<p>You become aware of an incessant ticking sound. {if loom_ornaments: You glance at the art installment to see if the clocks have begun to turn, but they remain dormant.} The Man flashes a gold watch on his left wrist, reminding you of your pressing time constraint. Time remains for a single question.</p>",
			},
			'@3': {
				'text': "",
				'js': function() {
					squiffy.story.go("plaid_02");
				},
			},
		},
	},
	'plaid_02': {
		'text': "<p>&quot;Alright, it&#39;s time to make your move,&quot; The Man advises. He passes a catalogue across the table to you and winks.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"_continue3\" role=\"link\" tabindex=\"0\">&gt;&gt; Proceed to the route.</a></p>",
		'passages': {
		},
	},
	'_continue3': {
		'text': "<p>Deftly, you rise from your seat and begin to walk towards </p>",
		'passages': {
		},
	},
	'mark_01b': {
		'text': "<p>You scan the room carefully. It is time to make your mark.</p>\n<p>There is an old woman wearing a stunning pearl necklace eating minestrone by the entrance to the parlor. She wears her hair in a top-knot bun, making it abundantly obvious that she is missing an ear. Upon close inspection, you also observe that she is sitting in a wheelchair.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"pearl_01\" role=\"link\" tabindex=\"0\">&gt;&gt; Make your mark.</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01f\" role=\"link\" tabindex=\"0\">&gt;&gt; Continue to scan the room.</a></p>",
		'passages': {
		},
	},
	'pearl_01': {
		'text': "<p>&quot;Eh, not her,&quot; The Man advises.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01f\" role=\"link\" tabindex=\"0\">&gt;&gt; Continue to scan the room.</a></p>",
		'passages': {
		},
	},
	'mark_01f': {
		'text': "<p>You scan the room carefully. It is time to make your mark.</p>\n<p>In the corner opposite you, there is a well-endowed gentleman with a briefcase overflowing with money. He dons an ostentatious golden top hat stuffed with money, and several bundles of cash can be seen haphazardly stashed beneath his <a class=\"squiffy-link link-passage\" data-passage=\"diamond-encrusted ascot\" role=\"link\" tabindex=\"0\">diamond-encrusted ascot</a>. A gilded cane rests elegantly against his chair, which is itself padded with dollar bills. Next to him is a laminated sign that reads &quot;LOOKING TO BUY ANY AND ALL PRODUCTS.&quot;</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"briefcase\" role=\"link\" tabindex=\"0\">&gt;&gt; Make your mark.</a></p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01a\" role=\"link\" tabindex=\"0\">&gt;&gt; Continue to scan the room.</a></p>",
		'passages': {
			'diamond-encrusted ascot': {
				'text': "<p>They are blood diamonds from Sudan.</p>",
			},
		},
	},
	'briefcase': {
		'text': "<p>&quot;What about that guy?&quot; you ask, gesturing vaguely toward the well-endowed gentleman with the briefcase.</p>\n<p>&quot;Ah, a splendid choice,&quot; The Man says warmly. He then leans in loudly and conspicuously, splashing his suit jacket and most of the tablecloth with tilapia fluids. &quot;I know it&#39;s your first time, rookie, but please exercise some degree of caution. The well-endowed gentleman you almost marked is in fact an undercover FBI agent.&quot;</p>\n<p>After detailed examination, you discover that the well-endowed gentleman is wearing a wire. There is also a visible camera in his top hat, and his shirt says &quot;FBI&quot; in huge letters.</p>\n<p><a class=\"squiffy-link link-section\" data-section=\"mark_01a\" role=\"link\" tabindex=\"0\">&gt;&gt; Continue to scan the room.</a></p>",
		'passages': {
		},
	},
}
})();