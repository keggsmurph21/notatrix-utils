module.exports = {

  UDWebRoot: 'http://universaldependencies.org',
  headers: {
    'User-Agent': 'ud_scraper',
    'Authorization': '',
  },

  token: process.env.GITHUB_TOKEN,
  outputDir: '/data/treebanks/ud/',
  outputFilename: 'index.json',

};
