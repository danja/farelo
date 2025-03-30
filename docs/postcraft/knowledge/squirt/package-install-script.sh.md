#!/bin/bash
# Script to install yasgui and its dependencies

# Install yasgui
npm install @triply/yasgui@4.2.28 --save

# Install required peer dependencies
npm install codemirror@5.65.12 --save
npm install @codemirror/state@5.2.0 --save-dev
npm install @codemirror/view@5.6.2 --save-dev
npm install @codemirror/language@5.2.0 --save-dev

# Update webpack dependencies
npm install css-loader style-loader --save-dev

# Rebuild the project
npm run build
