'use strict';

const _ = require('underscore');

const constants = require('./constants');
const errors = require('./errors');
const funcs = require('./funcs');
const re = require('./regex');
const Trie = require('./trie');

module.exports = _.extend({

  re,
  Trie,

}, errors, constants, funcs);
