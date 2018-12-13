'use strict';

const _ = require('underscore');
const nx = require('notatrix');
const constants = require('./constants');
const re = require('./regex');

function slugify(str) {
  return str.replace(/[^\w-.]/g, '_');
}

module.exports = _.extend(nx.funcs, {

  slugify

});
