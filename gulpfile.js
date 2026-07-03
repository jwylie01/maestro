const jsdoc2md = require('jsdoc-to-markdown');
const { parallel, series } = require('gulp');
const fs = require('fs');
const zip = require('gulp-zip');
const gulp = require('gulp');
const version = require('./package.json').version;
const fetch  = require('node-fetch');

function docs(done) {
  jsdoc2md.render({ files: ['modules/*.?(m)js', '*.js'], configure: 'jsdoc-conf.json' })
    .then(output => fs.writeFileSync('API.md', output));
  return done();
}

// const chores = parallel(patrons, docs);

//exports.build = build;
exports.docs = docs;
//exports.patrons = patrons;
//exports.chores = chores;
//exports.default = series(chores, build);
exports.default = docs;
