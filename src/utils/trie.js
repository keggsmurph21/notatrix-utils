'use strict';

const _ = require('underscore');

class TrieNode {
  constructor(char) {

    this.children = {};
    this.isWord = false;
    this.value = null;
    this.char = char;

  }

  getChild(char) {
    return this.children[char];
  }

  hasChild(char) {
    return !!this.getChild(char);
  }

  addChild(char) {

    const child = new TrieNode(char);
    this.children[char] = child;

    return child;

  }
}

class Trie {
  constructor() {

    this.root = new TrieNode();

  }

  add(str, value) {

    let node = this.root;

    str.split('').forEach(char => {

      if (node.hasChild(char)) {

        node = node.children[char];

      } else {

        node = node.addChild(char);

      }

    });

    node.isWord = true;
    node.value = value;

    return this;
  }

  has(str) {

    let node = this.root;

    for (let i=0; i<str.length; i++) {

      node = node.getChild(str[i]);
      if (!node)
        return false;

    }

    return node.isWord;
  }

  get(str) {

    let node = this.root;

    for (let i=0; i<str.length; i++) {

      node = node.getChild(str[i]);
      if (!node)
        return undefined;

    }

    return node.value;
  }
}

module.exports = Trie;
