/**
 * @fileoverview Survey module for What's New homepage in the client.
 * @author adams@spotify.com (Adam Smith)
 */

'use strict';

var fs = sp.require('$util/fs'),
    lang = sp.require('$util/language'),
    logger = sp.require('$util/logger'),
    dom = sp.require('$util/dom'),
    storage = sp.require('$util/storage'),
    util = sp.require('$util/util');

var Survey = {
  wrapper: null,
  content: null,
  form: null,
  fieldset: null,
  title: null,
  q1: {},
  q2: {},
  q3: {},
  store: {},
  submitted: false,
  logData: {},
  submitBtn: null,
  thanks: null,
  thanksTitle: null,
  team: null,
  surveyTest: {},
  loggingVersion: null,
  stepCallback: function() {},
  translations: {},

  init: function() {
    var content = fs.readFile('/assets/templates/survey.html');

    this.store.viewed = storage.getWithDefault('survey.viewed', {});
    this.store.closed = storage.getWithDefault('survey.closed', {});

    this.wrapper = dom.id('Survey');
    this.wrapper.innerHTML = content;
    this.wrapper.classList.add('is-inited');

    this.content = dom.queryOne('.survey-content', this.wrapper);
    this.form = dom.id('form-survey');
    this.fieldset = dom.queryOne('fieldset', this.form);
    this.thanks = dom.queryOne('.thanks', this.wrapper);
    this.title = dom.queryOne('.title', this.form);

    this.q1.container = dom.id('q1');
    this.q1.question = dom.queryOne('.question', this.q1.container);
    this.q1.negative = dom.queryOne('.negative', this.q1.container);
    this.q1.positive = dom.queryOne('.positive', this.q1.container);
    this.q2.container = dom.id('q2');
    this.q2.question = dom.queryOne('.question', this.q2.container);
    this.q3.container = dom.id('q3');
    this.q3.question = dom.queryOne('.question', this.q3.container);
    this.q3.negative = dom.queryOne('.negative', this.q3.container);
    this.q3.positive = dom.queryOne('.positive', this.q3.container);
    this.submitBtn = dom.id('submit-survey');

    this.thanksTitle = dom.queryOne('#thanks .title', this.wrapper);
    this.team = document.createElement('span');
    this.team.classList.add('spotify-team');

    this.logData = {
      surveyTestGroup: this.surveyTest.group,
      date: this.surveyTest.today,
      q1_description: this.translations.q1.question,
      q2_description: this.translations.q2.question,
      q3_description: this.translations.q3.question,
      q1: '',
      q2: '',
      q3: ''
    };

    //populate translations
    this.addTranslations();
  },

  addTranslations: function() {
    var self = this;

    this.title.textContent = this.translations.title;
    this.q1.question.textContent = this.translations.q1.question;
    this.q1.negative.textContent = this.translations.q1.negative;
    this.q1.positive.textContent = this.translations.q1.positive;
    this.q2.question.textContent = this.translations.q2.question;
    this.q3.question.textContent = this.translations.q3.question;
    this.q3.negative.textContent = this.translations.q3.negative;
    this.q3.positive.textContent = this.translations.q3.positive;
    this.submitBtn.value = this.translations.submit;
    this.thanksTitle.textContent = this.translations.thanks;
    this.team.textContent = this.translations.team;
    this.thanksTitle.appendChild(this.team);
  },

  build: function() {
    var self = this;

    // we don't want to display the survey if the user has
    // submitted or closed the survey previously, or
    // if there was not a test group match.
    if ('true' === this.store.closed || !this.surveyTest.display) {
      dom.destroy(this.wrapper);
      self.stepCallback(true);
      return;
    }
    this.wrapper.classList.remove('hidden');

    this.fieldset.style.height = window.getComputedStyle(self.q1.container, null).getPropertyValue('height');

    setTimeout(function() {
      self.setHeight();
    }, 10);

    storage.set('survey.viewed', 'true');

    logger.logClientEvent('Survey', 'User viewed survey', self.loggingVersion, self.surveyTest.version, self.logData);

    this.handleEvents();

    self.stepCallback(true);
  },

  handleEvents: function() {
    var self = this;
    var openHandler = function(e) {
      if (e.target.nodeName === 'INPUT') {
        self.wrapper.classList.remove('is-inited');
        self.fieldset.style.height = 'auto';
        self.setHeight();
        self.wrapper.classList.add('is-active');
        self.logData['q1'] = self.getRadioValue(self.form.elements['recommend']);

        setTimeout(function() {
          self.form.elements['why'].focus();
        }, 1250);

        self.form.removeEventListener('click', openHandler);
      }
    };
    var closeHandler = function(e) {
      if (e.target.nodeName === 'SPAN') {
        var eventMsg = 'User closed survey before submitting form';

        storage.set('survey.closed', 'true');

        if (self.submitted) {
          eventMsg = 'User closed survey after submitting form';
        }
        logger.logClientEvent('Survey', eventMsg, self.loggingVersion, self.surveyTest.version, self.logData);

        self.remove();
      }
    };
    var formHandler = function(e) {
      var recommend = self.form.elements['recommend'],
          why = self.form.elements['why'].value,
          satisfied = self.form.elements['satisfied'];

      e.preventDefault();

      self.submitted = true;
      storage.set('survey.closed', 'true');

      self.wrapper.classList.remove('is-active');
      self.wrapper.classList.add('is-submitted');
      dom.destroy(self.form);
      self.thanks.classList.remove('hidden');
      setTimeout(function() {
        self.setHeight();
      }, 10);

      self.logData['q1'] = self.getRadioValue(recommend);
      self.logData['q2'] = why;
      self.logData['q3'] = self.getRadioValue(satisfied);

      logger.logClientEvent('Survey', 'User submitted survey form', self.loggingVersion, self.surveyTest.version, self.logData);

      setTimeout(function() {
        self.remove();
      }, 5000);

      return false;
    };

    dom.listen(this.form, 'click', openHandler);
    dom.listen(this.wrapper, 'click', closeHandler);
    dom.listen(this.form, 'submit', formHandler);
    dom.listen(window, 'resize', util.debounce(function(e) {
      self.wrapper.classList.add('is-resizing');
      if (self.wrapper.classList.contains('is-inited')) {
        self.fieldset.style.height = window.getComputedStyle(self.q1.container, null).getPropertyValue('height');
      }
      self.setHeight();

      //this is hacky...
      setTimeout(function() {
        self.wrapper.classList.remove('is-resizing');
      }, 1000);

    }, 100));
  },

  getRadioValue: function(array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].checked) {
        return array[i].value;
      }
    }
    return null;
  },

  remove: function() {
    var self = this;

    this.wrapper.classList.add('is-removed');
    self.setHeight('0px');
    dom.listen(this.wrapper, 'webkitTransitionEnd', function(e) {
      dom.empty(self.wrapper);
      dom.destroy(self.wrapper);
    });
  },

  setHeight: function(opt_value) {
    var contentCSS,
        height,
        paddingTop,
        paddingBtm,
        totalHeight;

    if (arguments.length === 0 || 'undefined' === typeof opt_value) {
      contentCSS = window.getComputedStyle(this.content, null);
      height = contentCSS.getPropertyValue('height');
      paddingTop = contentCSS.getPropertyValue('padding-top');
      paddingBtm = contentCSS.getPropertyValue('padding-bottom');
      totalHeight = (parseInt(height, 10) + parseInt(paddingTop, 10) + parseInt(paddingBtm, 10)) + 'px';
    } else {
      totalHeight = opt_value;
    }
    this.wrapper.style['height'] = totalHeight;
  },

  setTranslations: function(translations) {
    this.translations = translations;
  },

  setStepCallback: function(fn) {
    this.stepCallback = fn;
  },

  setSurveyTest: function(surveyTest) {
    this.surveyTest = surveyTest;
  },

  setLoggingVersion: function(loggingVersion) {
    this.loggingVersion = loggingVersion;
  }
};


exports.Survey = Survey;
