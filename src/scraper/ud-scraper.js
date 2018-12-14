'use strict';

const _ = require('underscore');
const cheerio = require('cheerio');
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

function parseGitHubUrl(url) {

  const chunks = url.match(re.github);
  return {
    org: chunks[1],
    repo: chunks[2],
    branch: chunks[3],
  };

}

class Scraper extends Emitter {
  constructor(customConfig) {

    super();
    
    this.config = _.defaults(customConfig || {}, defaultConfig);

    if (!this.config.token)
      throw new utils.ScraperError('No Github token provided.  For help generating one, visit https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/');

    if (!this.config.outputDir)
      throw new utils.ScraperError('No output destination specified');

    mkdirp(this.config.outputDir);

  }
}

// main
request.get('http://universaldependencies.org', (err, res, body) => {
  if (err)
    throw err;

  const $ = cheerio.load(body);

  let repos = [];
  $('#accordion').first().find('ul').find('li:nth-child(2)').each((i, li) => {

    li = $(li);

    if (re.repo.test(li.text()))
      li.find('a').each((j, a) => {

        repos.push($(a).attr('href'));

      });
  });

  repos = repos.map(parseGitHubUrl).forEach(repo => {

    const files_url = 'https://api.github.com/repos/'
      + `${repo.org}/${repo.repo}/contents?ref=${repo.branch}`;

    request.get(files_url, { headers: {

      'User-Agent': 'ud_scraper',
      'Authorization': 'token ' + gh_token, // to avoid throttling

    }}, (err, res, body) => {
      if (err)
        throw err;

      body = JSON.parse(body);

      if (res.statusCode === 200) {

        body.forEach(file => {

          if (re.conllu.test(file.name))
            request.get(file.download_url, (err, res, body) => {
              if (err)
                throw err;

              if (res.statusCode === 200) {

                fs.writeFile(dest_path + file.name, body, err => {
                  if (err)
                    throw err;

                  process.stderr.write(`Wrote file to ${dest_path + file.name}\n`);
                });

              } else {
                process.stderr.write(`Bad response from ${file.download_url}\n`);
              }
            });
        });

      } else {
        process.stderr.write(`Bad response from ${files_url}: ${body.message}\n`);
      }
    });
  });
});
