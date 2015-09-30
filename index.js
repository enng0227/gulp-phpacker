/* jshint node: true */
'use strict';
/**
 * 模块依赖
 */
var through = require( 'through2' );
var gutil = require( 'gulp-util' );
var PluginError = gutil.PluginError;


//php代理处理函数
var PHPacker = function ( _options ) {
	this.options = _options || {};;
};
PHPacker.prototype = {
	/**
	 * [getBanner 获取标语]
	 * @return {[String]} [标语文本]
	 */
	getBanner: function () {
		var code = '';
		var multiline = (
			Object.prototype.toString.call( this.options.banner ) ===
			'[object Array]'
		); //是否为多行
		if ( multiline ) {
			code += '\n';
		}
		code += '/*';
		if ( multiline ) {
			code += '\n';
			for ( var i = 0; i < this.options.banner.length; i++ ) {
				code += ' * ' + this.options.banner[ i ] + '\n';
			}
		} else {
			code += ( ' ' + this.options.banner + ' ' );
		}
		code += ' */\n';
		return code;
	},

	/**
	 * [extractCode 提取php代码体( 排除:<?php 和 ?> )]
	 * @param  {[String]} data [php文件内容]
	 * @return {[String]}      [php代码体]
	 */
	extractCode: function ( data ) {
		var code = '';
		var chars = data.split( '' );
		var codeSection = false; //是否发现了php代码
		var insideString = false;
		var stringClosingChar = '';
		for ( var i = 0; i < chars.length; i++ ) {
			var currentChar = chars[ i ];
			var nextChar = chars[ i + 1 ] ? chars[ i + 1 ] : '';
			var prevChar = chars[ i - 1 ] ? chars[ i - 1 ] : '';
			//如果还没有发现php代码体
			if ( !codeSection ) {
				if ( data.substr( i, 5 ) === '<?php' ) {
					codeSection = true;
					i += 4;
					continue;
				}
				if ( currentChar === '<' && nextChar === '?' ) {
					codeSection = true;
					i++;
					continue;
				}
			}
			if ( codeSection && !insideString ) {
				if ( currentChar === '?' && nextChar === '>' ) {
					codeSection = false;
					i++;
					continue;
				}
			}
			if ( codeSection ) {
				if ( !insideString ) {
					if ( currentChar === '"' || currentChar === "'" ) {
						insideString = true;
						stringClosingChar = currentChar;
					}
				} else if ( insideString ) {
					if ( currentChar === stringClosingChar && prevChar !== "\\" ) {
						insideString = false;
						stringClosingChar = '';
					}
				}
				code += currentChar;
			}
		}
		return code;
	},

	/**
	 * [minifyCode 压缩代码]
	 * @param  {[String]} data [去掉开头的'<?php'和结尾'?>'的php文件内容]
	 * @return {[String]}      [压缩后的php文件内容]
	 */
	minifyCode: function ( data ) {
		var result = '';
		var chars = data.split( '' );
		var stringClosingChar = '';
		var insideString = false;
		var insideComment = false;
		var commentIsMultiline = false;
		var alreadySpaced = false;
		for ( var i = 0; i < chars.length; i++ ) {
			var currentChar = chars[ i ];
			var nextChar = chars[ i + 1 ] ? chars[ i + 1 ] : '';
			var prevChar = chars[ i - 1 ] ? chars[ i - 1 ] : '';
			if ( !insideString && !insideComment ) {
				if ( currentChar === '/' && nextChar === '/' ) {
					insideComment = true;
					commentIsMultiline = false;
					i++;
					continue;
				} else if ( currentChar === '/' && nextChar === '*' ) {
					insideComment = true;
					commentIsMultiline = true;
					i++;
					continue;
				}
			}
			if ( !insideString && insideComment ) {
				if ( !commentIsMultiline && currentChar === "\n" ) {
					insideComment = false;
					commentIsMultiline = false;
				} else if ( commentIsMultiline && currentChar === '*' && nextChar === '/' ) {
					insideComment = false;
					commentIsMultiline = false;
					i++;
					continue;
				}
			}
			if ( !insideComment ) {
				if ( !insideString ) {
					if ( currentChar === '"' || currentChar === "'" ) {
						insideString = true;
						stringClosingChar = currentChar;
					}
				} else if ( insideString ) {
					if ( currentChar === stringClosingChar && prevChar !== "\\" ) {
						insideString = false;
						stringClosingChar = '';
					}
				}
			}
			if ( !insideComment && !insideString ) {
				if ( /\s+/.test( currentChar ) === true ) {
					if ( !alreadySpaced ) {
						result += ' ';
						alreadySpaced = true;
						continue;
					}
				} else {
					alreadySpaced = false;
					result += currentChar;
					continue;
				}
			}
			if ( insideString ) {
				result += currentChar;
			}
			//$result .= $currentChar;
		}
		return result;
	},
	/**
	 * [run 入口]
	 * @param  {[String]} _contents [php文件内容]
	 * @return {[String]}           [处理后的内容]
	 */
	run: function ( _contents ) {
		var code = '<?php ';
		if ( this.options.banner ) {
			code += this.getBanner();
		}
		var codeChunk = this.extractCode( _contents );
		if ( this.options.minify ) {
			codeChunk = this.minifyCode( codeChunk );
		}
		code += codeChunk;
		if ( this.options.whitespace ) {
			code += ' ';
		}
		code += '?>';
		return code;
	}
};
// 插件级别的函数
function enngPhpacker( _options ) {
	// 创建一个 stream 通道，以让每个文件通过
	var stream = through.obj( function ( file, enc, cb ) {
		if ( file.isStream() ) {
			this.emit( 'error', new PluginError( PLUGIN_NAME, 'Streams are not supported!//不支持流' ) );
			return cb();
		}

		if ( file.isBuffer() ) {
			var _data = file.contents.toString();
			var packer = new PHPacker( _options );
			_data = packer.run( _data );
			file.contents = new Buffer( _data );
		}

		// 确保文件进入下一个 gulp 插件
		this.push( file );

		// 告诉 stream 引擎，我们已经处理完了这个文件
		cb();
	} );

	// 返回文件 stream
	return stream;
};

// 保留出插件主函数
module.exports = enngPhpacker;
