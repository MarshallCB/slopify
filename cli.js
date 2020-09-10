#!/usr/bin/env node

const sade = require('sade');
const pkg = require('./package.json')
const path = require('path')
const slopify = require('./index.js');

sade('slopify [input]', true)
.version(pkg.version)
.describe(pkg.description)
.example('slopify depth.png -o terrain.png')
.option('-o, --output', 'Output filepath', "terrain.png")
.option('-k, --kernel', 'Kernel size', 3)
.action((input, opts) => {
  // TODO: smarter output default
  slopify(input, opts.output, {
    kernel: opts.kernel
  })
})
.parse(process.argv);