'use strict';

const _ = require('underscore');
const nx = require('notatrix');

class NotatrixUtilityError extends nx.NotatrixError {};
class DBError extends NotatrixUtilityError {};
class ServerError extends NotatrixUtilityError {};

module.exports = {

  NotatrixError: nx.NotatrixError,
  NotatrixUtilityError,
  DBError,
  ServerError,

};
