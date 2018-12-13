'use strict';

const _ = require('underscore');
const errors = require('./utils/errors');

module.exports = _.extend({

  constants: require('./utils/constants'),
  funcs: require('./utils/funcs'),
  regex: require('./utils/regex'),

  db: require('./db'),
  server: require('./server'),

}, errors);
