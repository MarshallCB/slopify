#!/usr/bin/env node

const sade = require('sade');
const pkg = require('./package.json')
const path = require('path')
const slopify = require('./index.js');

sade('slopify [input] [output]', true)
.version(pkg.version)
.describe(pkg.description)
.example('slopify depth.png terrain.png')
.option('-k, --kernel', 'Kernel size', 3)
.action((input, output, opts) => {
  slopify(input, output, opts)
})
.parse(process.argv);