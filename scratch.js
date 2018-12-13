'use strict';

const sizeof = require('object-sizeof');
const nx = require('notatrix');
const nxu = require('.');
const db = new nxu.db();
const Corpus = require('./src/db/models/corpus');
const server = nxu.server();
const corpora = [
  {
    name: 'small corpus',
    path: '/data/treebanks/ud/mr_ufal-ud-dev.conllu',
  },
  {
    name: 'large corpus',
    path: '/data/treebanks/ud/ja_bccwj-ud-train.conllu',
  },
];


db.on('ready', () => {

  console.log('db connected');
  corpora.forEach(corpus => {
    db.readFile(corpus);
  });

});

db.on('read-begin', args => console.log('begin', args.name));
//db.on('serialized-chunk', args => console.log('serialized', args));
db.on('pushed-chunk', args => console.log('chunk', args));
db.on('read-end', args => console.log('end', args.name));

module.exports = db;
