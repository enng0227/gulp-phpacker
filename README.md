# gulp-phpacker

> gulp plugin for PHP bundling

## Getting Started 新手入门 
This plugin requires gulp 

### Overview


```js
gulp.task( 'php', function () {
  var Phpacker = require( 'gulp-phpacker' );
  var Src = './app/**/*.php',
    Dst = './dist/php/';
  var _opt = {
    "minify": true,
    "banner": [ 'this is a test...', '这是第二行' ]
  };
  gulp.src( Src ) //指定源
    .pipe( Phpacker( _opt ) )
    .pipe( gulp.dest( Dst ) ); //输出
} );
```

### Options
minify:boolean, //是否压缩代码
banner:String, //标语,加在代码开头

### Usage Examples

