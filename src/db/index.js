'use strict';

const _ = require('underscore');
const Emitter = require('events');
const path = require('path');
const LineReader = require('line-by-line');
const sizeof = require('object-sizeof');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const nx = require('notatrix');
const utils = require('../utils');
const DBError = utils.DBError;
const defaults = require('./defaults');
const Corpus = require('./models/corpus');

class Cache {
  constructor(name, emitter) {

    this.name = name;
    this.emitter = emitter;
    this.id = null;
    this.items = [];
    this.MAX_LENGTH = 1000;

  }

  setId(id) {
    this.id = id;
  }

  push(item, next) {

    if (this.items.length === this.MAX_LENGTH)
      this.clear(next);

    this.items.push(item);

  }

  clear(next) {

    const currentLength = this.items.length;

    if (currentLength === 0)
      return next ? next() : null;

    Corpus.findByIdAndUpdate(this.id, {
      $push: {
        sentences: {
          $each: this.items
        }
      }
    }, err => {

      if (err && err.codeName !== 'BSONObjectTooLarge')
        throw err;

      this.emitter.emit('pushed-chunk', {
        name: this.name,
        num: currentLength,
      });

      if (next)
        next();
    });

    this.items = [];
  }
}

class CorporaDB extends Emitter {
  constructor(config) {

    super();

    // make sure to start with db in uninit'ed state
    this.db_connected = false;

    config = _.defaults(config, defaults);

    const db_path = (config.username && config.password)
      ? config.username + ':' + config.password + '@' + config.uri
      : config.uri;

    const db_opts = {
      useNewUrlParser: true,
      dbName: db_path,
    };

    var self = this;
    mongoose.connect('mongodb://' + db_path, db_opts, err => {

      if (err)
        throw err;

      self.db_connected = true;
      self.emit('ready');

    });
  }

  readFile(file) {

    // hack to get around this-rebinding
    var self = this;

    if (!self.db_connected)
      throw new DBError('no database connected');

    var corpus = new Corpus({

      name: file.name,
      filename: path.basename(file.path),

    });

    var chunk = [];
    var lineNum = 0;
    var numBlankLines = 0;
    var sentencesCache = [];
    var cache = new Cache(file.name, self);

    const lr = new LineReader(file.path);
    lr.pause();
    corpus.save(() => {

      self.emit('read-begin', { name: file.name });
      cache.setId(corpus.id);
      lr.resume();

    });

    lr.on('line', line => {

      if (utils.re.whitespaceLine.test(line)) {
        if (chunk.length > 0) {

          lr.emit('chunk', chunk, lineNum);
          chunk = [];

        }
      } else {
        chunk.push(line);
      }

      ++lineNum;
    });

    lr.on('end', () => {

      cache.clear(() => {
        self.emit('read-end', { name: file.name });
      });

    });

    lr.on('chunk', (chunk, lineNum) => {

      const sent = new nx.Sentence(chunk.join('\n'));
      const serial = sent.serialize();
      cache.push(serial);

    });
  }
}

module.exports = CorporaDB;
