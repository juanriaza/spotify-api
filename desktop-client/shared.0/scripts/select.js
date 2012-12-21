require([
  '$api/models'
], function(models) {

  var Promise = models.Promise;
  var Collection = models.Collection;
  var Loadable = models.Loadable;

  /**
   *           _           _
   *  ___  ___| | ___  ___| |_
   * / __|/ _ \ |/ _ \/ __| __|
   * \__ \  __/ |  __/ (__| |_
   * |___/\___|_|\___|\___|\__|
   *
   *
   * A pure javascript implementation of async-relieving "queryselectors" for Loadables.
   * This lets you do things like:
   *
   *   require(['$api/toplists#Toplist', '$shared/select#select'], function(Toplist, select) {
   *     var selector = 'playlists[0..5].{name, subscribers.length, owner.{name, username}}';
   *     select(Toplist.forCurrentUser(), selector).done(function(node) {
   *       console.log('example', node, node.playlists[2].owner.name);
   *     });
   *   });
   */

  /**
   * Load a selector on an object
   *
   * @function
   * @name select
   * @param {Loadable} obj The object to load the selector on.
   * @param {string} selector The selector to use.
   * @param {Boolean} mayModifyObj Whether to augment the passed obj or create a new Object.
   * @return {Promise} Gets the result of the select when done.
   */
  var select = function(obj, selector, mayModifyObj) {
    var result;

    if (!mayModifyObj) {
      result = {};
    } else {
      result = obj;
    }
    var selectorTree = parseSelector(selector);
    return loadSelectorTreeForObject(obj, selectorTree, result);
  };

  /**
   * Process loading of a selector tree on an object
   *
   * @function
   * @name loadSelectorTreeForObject
   * @param {Loadable} obj The object to process the selector tree on.
   * @param {Array} selectorTree The selector tree to use.
   * @param {Object} result The object which will get the loaded data.
   * @return {Promise} Gets the result when done.
   * @private
   */
  var loadSelectorTreeForObject = function(obj, selectorTree, result) {
    var objArr, iterationPromises;
    var promise = new Promise();
    var onDone = function(doneObj) {
      // Flatten if applicable
      if (Array.isArray(doneObj) && Array.isArray(doneObj[0])) {
        doneObj = doneObj.reduce(function(a, b) {
          return a.concat(b);
        });
      }

      promise.object = result;
      promise.setDone();
    };
    var onFail = function(err) {
      promise.setFail(err);
    };

    objArr = Array.isArray(obj) ? obj : (obj ? [obj] : []);
    var levelPromises = selectorTree.map(function(node) {

      iterationPromises = objArr.map(function(obj) {
        var iterationPromise = new Promise();
        var onIterationDone = function(obj) {
          iterationPromise.object = result[node.name] = obj;
          if (node.properties && node.properties.length) {
            // If property has sub-properties, wait for them to load
            loadSelectorTreeForObject(obj, node.properties, obj).done(function() {
              iterationPromise.setDone();
            }).fail(onFail);
          } else {
            iterationPromise.setDone();
          }
        };

        obj.load(node.name).done(function(obj) {
          var propertyName = node.name;
          var property = obj[propertyName];
          var propertyIsCollection = property instanceof Collection;
          var propertyIsArray = Array.isArray(property);

          if (node.slice) {
            if (propertyIsCollection) {
              // Snapshot according to limits
              property.snapshot(node.start, node.end - node.start).done(function(snapshot) {
                onIterationDone(snapshot.toArray());
              }).fail(onFail);
            } else if (propertyIsArray) {
              onIterationDone(property.slice(node.start, node.end));
            } else {
              var type = Object.prototype.toString.call(property);
              throw new Error([
                'Tried to slice non-sliceable property ',
                '"' + propertyName + '"',
                ' which is a ',
                type
              ].join(''));
            }
          } else {
            var onlyOneProperty = node.properties && node.properties.length === 1;
            var firstProperty = node.properties && node.properties[0];
            var hasOnlyLengthProperty = onlyOneProperty && firstProperty.name === 'length';

            // Handle simplifying special case for snapshot.length
            if (propertyIsCollection && hasOnlyLengthProperty) {
              property.snapshot(0, 0).done(function(snapshot) {
                onIterationDone(snapshot);
              }).fail(onFail);
            } else {
              onIterationDone(property);
            }
          }
        }).fail(onFail);

        return iterationPromise;
      });

      return Promise.join(iterationPromises);
    });
    Promise.join(levelPromises).done(onDone).fail(onFail);
    return promise;
  }

  /**
   * Parses a selector for the select-function
   *
   * @function
   * @name parseSelector
   * @param {string} selector The selector to parse.
   * @return {Array} An array of nested tokens.
   * @private
   *
   * @example
   * var selectorTree = parseSelector('playlists[0..5].{name, subscribers.length, owner.name}');
   */
  var parseSelector = function(selector) {
    var normalizedSelector = normalizeSelector(selector);
    var reLexer = /,?\.?(@(\d+))?([A-Za-z0-9_]+)?(\[(\d*)(\.{2,3})?(\d*)\])?/g;

    var token;
    var properties = [];
    var lastProperty;

    while (token = nextToken(normalizedSelector, reLexer)) {
      if (token.type === 'group') {
        if (lastProperty) {
          lastProperty.properties = token.properties;
        } else {
          properties = token.properties;
        }
      } else {
        if (lastProperty) {
          if (!lastProperty.properties) {
            lastProperty.properties = [];
          }
          lastProperty.properties.push(token);
        } else {
          properties.push(token);
        }
        lastProperty = token;
      }
    }

    return properties;
  };

  /**
   * Executes the lexer regexp on the selector and return the next token
   *
   * @function
   * @name nextToken
   * @param {string} selector The selector to tokenize.
   * @param {RegExp} reLexer The regexp to execute.
   * @return {Object} A token.
   * @private
   */
  var nextToken = function(selector, reLexer) {

    var token;
    var matches, start, end, hasGroup, groupNumber, propertyName, hasSlice, startAsString;
    var splatType, endAsString, emptyBrackets, splatButNoEnd, dx, endCandidate;

    var strGroups = [];
    var degrouped = replaceGroupsInStr(selector, strGroups);
    var reLastIndexBeforeMatch = reLexer.lastIndex;
    if ((matches = reLexer.exec(degrouped)) && matches[0].length) {
      hasGroup = !!matches[1];

      if (hasGroup) {
        groupNumber = Number(matches[2]);
        var groupStr = matches[1].replace('@' + groupNumber, strGroups[groupNumber]);
        reLexer.lastIndex = reLexer.lastIndex - matches[1].length + groupStr.length + 2;
        var groupGroups = [];
        groupStr = replaceGroupsInStr(groupStr, groupGroups);

        var selectors = groupStr.split(',').map(function(subSelector) {
          return insertGroupsInStr(subSelector, groupGroups);
        });

        var properties = [];
        selectors.forEach(function(subSelector) {
          // Parse sub-selectors
          properties.push(parseSelector(subSelector)[0]);
        });

        token = {
          type: 'group',
          properties: properties
        };

      } else {
        propertyName = matches[3];
        hasSlice = !!matches[4];

        if (hasSlice) {
          startAsString = matches[5];
          splatType = matches[6];
          endAsString = matches[7];

          emptyBrackets = !startAsString && !splatType && !endAsString;
          splatButNoEnd = splatType && !endAsString;

          start = Number(startAsString) || 0;
          dx = splatType === '..' ? 0 : 1;
          endCandidate = Number(endAsString) || start;
          end = emptyBrackets || splatButNoEnd ? Infinity : endCandidate + dx;
        }

        token = {
          name: propertyName
        };

        if (hasSlice) {
          token.slice = true;
          token.start = start;
          token.end = end;
        }
      }
    } else if (reLexer.lastIndex !== selector.length && reLastIndexBeforeMatch !== selector.length) {
      throw new SyntaxError('Bad syntax');
    }

    return token;
  }

  /**
   * Find the ending index of the first delimiter pair.
   * Comes from Jade by TJ Holowaychuk <tj@vision-media.ca>
   *
   * @function
   * @name indexOfDelimiters
   * @param {string} str The string to find the delimiters in.
   * @param {string} start The starting delimiter.
   * @param {string} end The ending delimiter.
   * @return {Number} The index of the ending delimiter or 0 if unavailable.
   * @private
   *
   * @example
   * var indexOfEndingDelimiter = indexOfDelimiters('the {hay{s}}}tack} to search}', '{', '}');
   */
  var indexOfDelimiters = function(str, start, end) {
    var nstart = 0, nend = 0, pos = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
      if (start == str.charAt(i)) {
        ++nstart;
      } else if (end == str.charAt(i)) {
        if (++nend == nstart) {
          pos = i;
          break;
        }
      }
    }
    return pos;
  };

  /**
   * Port of Array.splice for strings.
   * Note that it does not change the passed string as it is a primitive,
   * but rather returns the resulting spliced string.
   *
   * @function
   * @name spliceString
   * @param {string} str The string to splice.
   * @param {Number} start The start index.
   * @param {Number} charactersToSplice Number of characters to splice.
   * @param {string} insert Text to insert.
   * @return {string} The result of splicing the string.
   * @private
   *
   * @example
   * var helloStitch = spliceString('Hello World!', 6, 5, 'Stitch');
   */
  var spliceString = function(str, start, charactersToSplice, insert) {
    var arr = str.split('');
    arr.splice(start, (charactersToSplice || Infinity), insert);
    return arr.join('');
  }

  /**
   * Replaces groups of {...} with @{n}
   *
   * @function
   * @name replaceGroupsInStr
   * @param {string} str The string whose groups to replace.
   * @param {Array} groups Gets the replaced groups.
   * @return {string} The string with its groups replaced.
   * @private
   *
   * @example
   * var helloAt0 = replaceGroupsInStr('Hello {stitch}!', []);
   */
  var replaceGroupsInStr = function(str, groups) {
    var groupStart;
    while ((groupStart = str.indexOf('{')) !== -1) {
      var groupEnd = indexOfDelimiters(str.substring(groupStart), '{', '}');
      if (groupEnd === 0) {
        throw new SyntaxError('Unclosed group');
      }
      groups.push(str.substring(groupStart + 1, groupStart + groupEnd));
      str = spliceString(str, groupStart, groupEnd + 1, '@' + (groups.length - 1));
    }

    return str;
  }

  /**
   * Replaces @{n} in string with passed groups
   *
   * @function
   * @name insertGroupsInStr
   * @param {string} str The string to inject the groups into.
   * @param {Array} groups Groups to insert.
   * @return {string} The string with the groups inserted.
   * @private
   *
   * @example
   * var helloStitch = insertGroupsInStr('Hello @0!', ['Stitch']);
   */
  var insertGroupsInStr = function(str, groups) {
    return str.replace(/@(\d+)/g, function($0, n) {
      return '{' + groups[n] + '}';
    });
  };

  /**
   * Normalizes the passed selector to a whitespace-less and properly grouped string.
   *
   * @function
   * @name normalizeSelector
   * @param {string|Array} selector The selector to normalize.
   * @return {string} The string with the groups inserted.
   * @private
   */
  var normalizeSelector = function(selector) {
    var args = SP.varargs(selector);
    var normalizedSelector;

    if (typeof args === 'string') {
      if (~args.indexOf(',') && ~replaceGroupsInStr(args, []).indexOf(',')) {
        normalizedSelector = '{' + args + '}';
      } else {
        normalizedSelector = args;
      }
    } else {
      if (args.length > 1) {
        normalizedSelector = '{' + args.join(',') + '}';
      } else {
        normalizedSelector = args[0];
      }
    }

    return normalizedSelector.replace(/\s+/g, '');
  };

  /**
   * Extends the Loadable prototype with the select method.
   * Use this if you want to be able to do playlist.select(selector),
   */
  var extendLoadables = function() {
    // Augment the Loadable prototype with some select goodness
    Loadable.prototype.select = function() {
      return select(this, arguments);
    };
  }

  exports.select = select;
  exports.parseSelector = parseSelector;
  exports.extendLoadables = extendLoadables;

});
