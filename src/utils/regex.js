'use strict';

const _ = require('underscore');
const nx = require('notatrix');

module.exports = _.extend(nx.regex, {

  repo: /^Repository/,
  github: /^http.*com\/([\w-]*)\/([\w-]*)\/tree\/([\w-]*)$/,
  conllu: /\.conllu$/,

});
