'use strict';

const _ = require('underscore');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const request = require('request');
const Emitter = require('events');
const utils = require('../utils');
const defaultConfig = require('./config');

const re = {
  repo: /^Repository/,
  github: /^http.*com\/([\w-]*)\/([\w-]*)\/tree\/([\w-]*)$/,
  slug: /[^\w]/g,
  conllu: /\.conllu$/,
};

class Corpus {
  constructor(url) {

    const chunks = url.match(re.github);

    this.url = url;
    this.org = chunks[1];
    this.name = chunks[2];
    this.branch = chunks[3];
    this.files = {};

  }

  get filesUrl() {
    return `https://api.github.com/repos/${this.org}/${this.name}/contents?ref=${this.branch}`;
  }

  get id() {
    return this.name + '@' + this.branch;
  }
}

class Scraper extends Emitter {
  constructor(customConfig) {

    super();

    this.config = _.defaults(customConfig || {}, defaultConfig);

    if (!this.config.token)
      throw new utils.ScraperError('No Github token provided.  For help generating one, visit https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/');

    this.config.headers.Authorization = 'token ' + this.config.token;

    if (!this.config.outputDir)
      throw new utils.ScraperError('No output destination specified');

    mkdirp(this.config.outputDir);

    this.corpora = {};

    console.log('configuration:');
    console.log(this.config);
  }

  get(url, next) {
    request.get(url, { headers: this.config.headers }, (err, res, body) => {

      if (err)
        return next(err);

      if (res.statusCode !== 200) {
        const msg = 'Got response ' + res.statusCode + ' from ' + url;
        if (body.message)
          msg += ' (' + body.message + ')';

        console.log(msg);
        return next();
      }

      return next(null, body);
    });
  }

  scrape(next) {

    this.get(this.config.UDWebRoot, (err, contents) => {

      if (err)
        return reject(err);

      const $ = cheerio.load(contents);

      let urls = [];
      $('#accordion').first().find('ul').find('li:nth-child(2)').each((i, li) => {

        li = $(li);

        if (re.repo.test(li.text()))
          li.find('a').each((j, a) => {

            urls.push($(a).attr('href'));

          });
      });

      Promise.all(urls.map(url => {

        const corpus = new Corpus(url);
        this.corpora[corpus.id] = corpus;
        console.log('found corpus ' + corpus.id, corpus.filesUrl);

        return new Promise((resolve, reject) => {
          this.get(corpus.filesUrl, (err, contents) => {
            if (contents)

              Promise.all(JSON.parse(contents).map(file => {
                if (re.conllu.test(file.name)) {

                  corpus.files[file.name] = null;

                  return new Promise((resolve, reject) => {
                    this.get(file.download_url, (err, contents) => {
                      if (contents) {

                        let filepath = path.join(this.config.outputDir, corpus.name, corpus.branch);
                        mkdirp(filepath, err => {

                          filepath = path.join(filepath, file.name);
                          fs.writeFile(filepath, contents, err => {

                            if (err)
                              reject(err);

                            corpus.files[file.name] = filepath;
                            console.log('wrote corpus to ' + filepath);

                            resolve();

                          });

                        });

                      }
                    });
                  });
                }
              })).then(resolve).catch(reject);

          });
        });

      })).then(() => {

        this.writeResults(next);

      }).catch(err => {

        if (err)
          throw err;

        throw new utils.ScraperError();

      });
    });
  }

  getResults() {

    console.log(this.corpora);

    let corpora = {};
    _.each(this.corpora, corpus => {

      if (!corpora[corpus.name])
        corpora[corpus.name] = {};

      corpora[corpus.name][corpus.branch] = {
        url: corpus.url,
        files: corpus.files,
      };

    });

    return corpora;
  }

  writeResults(next) {

    const filepath = path.join(this.config.outputDir, this.config.outputFilename);
    const contents = JSON.stringify(this.getResults(), null, 2);

    console.log(contents);
    fs.writeFile(filepath, contents, err => {

      if (err)
        throw err;

      console.log('wrote summary file to ' + filepath);

      if (next)
        next(this.corpora);

    });
  }
}

const s = new Scraper();
s.scrape(corpora => {
  console.log('done!');
})
