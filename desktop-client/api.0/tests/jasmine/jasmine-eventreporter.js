jasmine.EventReporter = function () {
	this.observers = {};
    this.suites = [];
};

jasmine.EventReporter.prototype.EVENTS = {
	RUNNER_START: 1,
	RUNNER_RESULTS: 2,
	SUITE_START: 3,
	SUITE_RESULTS: 4,
	SPEC_START: 5,
	SPEC_RESULTS: 6
};

jasmine.EventReporter.prototype.observe = function (event, observer) {
	if (!this.observers[event])
        this.observers[event] = [];
    this.observers[event].push(observer);
    return this;
};

jasmine.EventReporter.prototype.ignore = function (event, observer) {
	var index = -1;
    // Remove all observers
    if (1 === arguments.length) {
        delete this.observers[event];
        return this;
    }
    // Remove one observer
    if (this.observers[event]) {
        index = this.observers[event].indexOf(observer);
        if (-1 !== index)
            this.observers[event][index] = null; // Can't splice it out, that messes up notify()
    }
    return this;
};

jasmine.EventReporter.prototype.notify = function (event, data) {
	var observers = this.observers[event];
    if (!observers) return this;
    for (var i = 0; i < observers.length; ++i) {
        if (null !== observers[i])
            observers[i](data);
    }
    for (var i = 0; i < observers.length; ++i) {
        if (null === observers[i])
            observers.splice(i, 1);
    }
    if (0 === observers.length)
        delete this.observers[event];
    return this;
};

jasmine.EventReporter.prototype.reportRunnerStarting = function () {
	this.notify(this.EVENTS.RUNNER_START);
};

jasmine.EventReporter.prototype.reportRunnerResults = function(runner) {
    var results = this.collectResults(runner.results());
	this.notify(this.EVENTS.RUNNER_RESULTS, results);
};

jasmine.EventReporter.prototype.reportSuiteResults = function(suite) {
    var parent, root;
    if (this.suites.length === 0) {
        root = suite;
        parent = suite.parentSuite;
        while (parent) {
            root = parent;
            parent = parent.parentSuite;
        }
        this.rootSuite = root;
        this.suites = root.children();
    }
	this.notify(this.EVENTS.SUITE_RESULTS, suite);
};

jasmine.EventReporter.prototype.reportSpecStarting = function(spec) {
	this.notify(this.EVENTS.SPEC_START, spec);
};

jasmine.EventReporter.prototype.reportSpecResults = function(spec) {
	this.notify(this.EVENTS.SPEC_RESULTS, spec);
};

jasmine.EventReporter.prototype.log = function() {
	var console = jasmine.getGlobal().console;
	if (console && console.log) {
		if (console.log.apply) {
			console.log.apply(console, arguments);
		} else {
			console.log(arguments); // ie fix: console.log.apply doesn't exist on ie
		}
	}
	this.notify(this.EVENTS.LOG, arguments);
};


jasmine.EventReporter.prototype.collectResults = function (results) {
    this.resultSuites = results.getItems()[0].getItems();

    return {
        errors: this.getErrors(results.getItems()[0]) || [],
        originalResults: results
    };
};

jasmine.EventReporter.prototype.getErrors = function (item, parent, indexSuite, indexSubSuite) {
    var sef, items, errors, suiteIndex, subSuiteIndex, details;

    self = this;
    errors = [];

    if (item.description) {
        if (item.failedCount) {
            details = [];
            item.getItems().forEach(function (detail) {
                details.push(detail.message);
            });
            return {
                suite: this.suites[indexSuite].description,
                subSuite: ~indexSubSuite ? this.suites[indexSuite].children()[indexSubSuite].description : false,
                message: item.description,
                details: details.join(" | ")
            };
        } else {
            return false;
        }
    } else if (item.passedCount < item.totalCount) {
        item.parent = parent;
        items = item.getItems();
        if (parent) {
            suiteIndex = this.getSuiteIndex(item, parent);
            subSuiteIndex = this.resultSuites[suiteIndex].getItems().indexOf(item);
        }
        items.forEach(function (i) {
            var error = self.getErrors(i, item, suiteIndex, subSuiteIndex);
            if (error) {
                if (error instanceof Array) {
                    error.forEach(function (err) {
                        errors.push(err);
                    });
                } else {
                    errors.push(error);
                }
            }
        });
        return errors;
    } else {
        return false;
    }
};

jasmine.EventReporter.prototype.getSuiteIndex = function (item, parent, parentSuite) {
    parentSuite = parentSuite || this.resultSuites;
    var index = parentSuite.indexOf(item);
    return ~index ? index : this.getSuiteIndex(parent, parent ? parent.parent : undefined, parentSuite);
};