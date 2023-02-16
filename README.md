# stylus-proportional

This is a Stylus preprocessor to make layouts responsively proportional.

## Installation

### npm

```bash
$ npm install stylus-proportional --save
```

### yarn

```bash
$ yarn add stylus-proportional
```

## Configuration

### Gatsby plugin (gatsby-config.js)

```js
module.exports = {
  plugins: [
    'gatsby-plugin-stylus',
    'stylus-proportional',
  ],
}
```

### Webpack (webpack.config.js)

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.styl$/,
        use: [
          'style-loader',
          'css-loader',
          'stylus-loader',
          'stylus-proportional',
        ],
      },
    ],
  },
}
```

### Gulp (gulpfile.js)

```js
const gulp = require('gulp')
const stylusProportional = require('stylus-proportional').gulp
const stylus = require('gulp-stylus')

gulp.task('stylus', function () {
  return gulp
    .src('styl/index.styl')
    .pipe(stylusProportional())
    .pipe(stylus())
    .pipe(gulp.dest('css'))
})
```

## Usage

Make blocks automatically responsive by adding `proportional(query, ratio)` after them, as in the example below.

```stylus
body
  padding 10px
  font-size 14px // @proportional-skip

proportional(max-width 1500px, .8)
```

The code above will output the following CSS:

```css
body {
  padding: 10px;
  font-size: 14px;
}

@media (max-width: 1500px) {
  body {
    padding: 8px;
  }
}
```

The font-size property is not proportionally adjusted once we add `@proportional-skip`.