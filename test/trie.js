'use strict';

const _ = require('underscore');
const expect = require('chai').expect;
const sinon = require('sinon');
const nxu = require('..');
const Trie = require('../src/utils').Trie;

describe('Trie', () => {

  it('should add some strings and check if they\'re there', () => {

    const trie = new Trie();

    'this is a short sentence'.split(' ').forEach(str => {
      trie.add(str, 10);
    });

    expect(trie.has('this')).to.equal(true);
    expect(trie.has('is')).to.equal(true);
    expect(trie.has('a')).to.equal(true);
    expect(trie.has('short')).to.equal(true);
    expect(trie.has('sentence')).to.equal(true);

    expect(trie.get('this')).to.equal(10);
    expect(trie.get('is')).to.equal(10);
    expect(trie.get('a')).to.equal(10);
    expect(trie.get('short')).to.equal(10);
    expect(trie.get('sentence')).to.equal(10);

    expect(trie.has('that')).to.equal(false);
    expect(trie.has('was')).to.equal(false);
    expect(trie.has('an')).to.equal(false);
    expect(trie.has('long')).to.equal(false);
    expect(trie.has('word')).to.equal(false);

    expect(trie.get('that')).to.equal(undefined);
    expect(trie.get('was')).to.equal(undefined);
    expect(trie.get('an')).to.equal(undefined);
    expect(trie.get('long')).to.equal(undefined);
    expect(trie.get('word')).to.equal(undefined);

  });
});
