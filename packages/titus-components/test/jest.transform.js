module.exports = require('babel-jest').createTransformer({
  presets: [
    [
      'env',
      {
        targets: { browsers: ['last 1 versions'] },
        exclude: ['transform-regenerator']
      }
    ],
    'react'
  ],
  plugins: ['transform-class-properties', 'transform-object-rest-spread']
})