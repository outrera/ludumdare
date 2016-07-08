'use strict';

require('es6-promise').polyfill();

var gulp	= require('gulp');
var debug	= require('gulp-debug');
var newer	= require('gulp-newer');
var rename	= require('gulp-rename');
var concat	= require('gulp-concat');
var notify	= require('gulp-notify');
var gzip	= require('gulp-gzip');
var size	= require('gulp-size');

var glob	= require("glob")
var babelignore_files = glob.sync('src/**/.babelignore');
babelignore_files.forEach(function(el,idx,array){
	array[idx] = el.replace('.babelignore','');
});

// Ignore any file prefixed with an underscore, or minified //
var less_files		= ['src/**/*.less','!src/**/_*.less'];
var css_files		= ['src/**/*.css','!src/**/_*.css','!src/**/*.min.css'];

var js_in_files 	= ['src/**/*.js','!src/**/_*.js','!src/**/*.min.js']
						.concat(babelignore_files.map(function(el){return '!'+el+'*.*';}));
var raw_js_in_files	= babelignore_files.map(function(el){return el+'**/*.js';})
						.concat(babelignore_files.map(function(el){return '!'+el+'**/_*.js';}))
						.concat(babelignore_files.map(function(el){return '!'+el+'**/*.min.js';}));

//console.log(raw_js_in_files);


// Ignore any min files, and the output file //
var css_output 			= 'all.css';
var css_min_output		= 'all.min.css';
var css_min_gz_output	= 'all.min.css.gz';
var css_out_files		= ['output/**/*.css','!output/**/_*.css','!output/**/*.min.css','!output/'+css_output];

var js_output			= 'all.js';
var js_min_output		= 'all.min.js';
var js_min_gz_output	= 'all.min.js.gz';
var js_out_files		= ['output/**/*.js','!output/**/_*.js','!output/**/*.min.js','!output/'+js_output];


/* LESS files to CSS */
gulp.task('less', function() {
	var less		= require('gulp-less');
	// NOTE: Sourcemaps is surpressing errors, so it's disabled for now
//	var sourcemaps	= require('gulp-sourcemaps');
//	var less		= require('gulp-less-sourcemap');
	// NOTE: We're running autoprefixer as a LESS plugin, due to problems with postcss sourcemaps
	var autoprefix	= require('less-plugin-autoprefix');

	return gulp.src( less_files )
		.pipe( newer({dest:"output",ext:".css"}) )
		.pipe( debug({title:'less:'}) )
//		.pipe( sourcemaps.init() )
			.pipe( less({
				plugins:[
					new autoprefix(/*{
						browsers: ["last 2 versions"]
					}*/)
				]
			}) )
//		.pipe( sourcemaps.write() )
		.pipe( gulp.dest("output/") );
});
/* Unprocessed CSS files */
gulp.task('css', function() {
	return gulp.src( css_files )
		.pipe( newer({dest:"output"}) )
		.pipe( debug({title:'css:'}) )
		.pipe( gulp.dest("output/") );
});
/* Concatenate all CSS files */
gulp.task('css-cat', ['less','css'], function() {
	return gulp.src( css_out_files )
		.pipe( newer({dest:"output/"+css_output}) )
		.pipe( concat( css_output ) )
		.pipe( size({title:'css-cat:',showFiles:true}) )
		.pipe( gulp.dest( "output/" ) );	
});
/* Minifiy the concatenated CSS file */
gulp.task('css-min', ['css-cat'], function() {
	// Benchmarks: http://goalsmashers.github.io/css-minification-benchmark/
	var cleancss	= require('gulp-cleancss');		// Faster, similar results
//	var cssnano		= require('gulp-cssnano');

	return gulp.src( "output/"+css_output )
		.pipe( newer({dest:"output/"+css_min_output}) )
		.pipe( cleancss() )
//		.pipe( cssnano() )
		.pipe( concat( css_min_output ) )
		.pipe( size({title:'css-min:',showFiles:true}) )
		.pipe( gulp.dest( "output/" ) );	
});
/* GZIP minified (for reference) */
gulp.task('css-min-gz', ['css-min'], function() {
	return gulp.src( "output/"+css_min_output )
		.pipe( newer({dest:"output/"+css_min_gz_output}) )
		.pipe( gzip() )
		.pipe( size({title:'css-min-gz:',showFiles:true}) )
		.pipe( gulp.dest( "output/" ) );
});


/* Use Babel to compile ES2015 files to JS */
gulp.task('babel', function() {
	var babel = require("gulp-babel");
	
	return gulp.src( js_in_files, {base:'src'} )
		.pipe( newer({dest:"output",ext:".o.js"}) )
		.pipe( debug({title:'js (babel):'}) )
		.pipe( babel({presets:['es2015']}) )
		.pipe( rename({extname: ".o.js"}) )
		.pipe( gulp.dest( "output/" ) );
});
/* Unprocessed JS files */
gulp.task('js', function() {
	return gulp.src( raw_js_in_files, {base:'src'} )
		.pipe( newer({dest:"output"}) )
		.pipe( debug({title:'js (raw):'}) )
		.pipe( gulp.dest( "output/" ) );
});
/* Concatenate all JS files */
gulp.task('js-cat', ['babel','js'], function() {
	return gulp.src( js_out_files )
		.pipe( newer({dest:"output/"+js_output}) )
		.pipe( concat( js_output ) )
		.pipe( size({title:'js-cat:',showFiles:true}) )
		.pipe( gulp.dest( "output/" ) );
});
/* Minifiy the concatenated JS file */
gulp.task('js-min', ['js-cat'], function() {
	var uglify = require('gulp-uglify');
	
	return gulp.src( "output/"+js_output )
		.pipe( newer({dest:"output/"+js_min_output}) )
		.pipe( uglify() )
		.pipe( concat( js_min_output ) )
		.pipe( size({title:'js-min:',showFiles:true}) )
		.pipe( gulp.dest( "output/" ) );
});
/* GZIP minified (for reference) */
gulp.task('js-min-gz', ['js-min'], function() {
	return gulp.src( "output/"+js_min_output )
		.pipe( newer({dest:"output/"+js_min_gz_output}) )
		.pipe( gzip() )
		.pipe( size({title:'js-min-gz:',showFiles:true}) )
		.pipe( gulp.dest( "output/" ) );	
});



/* Nuke the output folder */
gulp.task('clean', function() {
	var del = require('del');
	
	return del( 'output/**/*' );
});


// Testing generation of a file used by PHP
//gulp.task('php-com', function() {
//	var fs = require('fs');
//	
//	fs.writeFileSync('src/com/list.gen.php', "<?php\n// WARNING! DO NOT MODIFY! This file is automatically generated!\n\n");
//});


// TODO: Popup notifications when a watch catches an error/linting error
//		.pipe( notify("hello") )


// NOTE: Use gulp-watch instead: https://www.npmjs.com/package/gulp-watch
//gulp.task('less-watch', ['css','js'] function () {
//	gulp.watch(less_files, ['css'])
//	gulp.watch(js_out_files, ['js'])
//});


// By default, GZIP the files, to report roughly how large things are when GZIPPED
gulp.task('default', ['css-min-gz','js-min-gz'], function() {
});
