const { series, parallel, src, dest, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const maps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const server = browserSync.create();
// const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const gulpEsbuild = require('gulp-esbuild');

const pkg = require('./package.json');

// The banner to add to the top of each file
// Pulls details from the package.json file
const banner = `
/** 
 * ${pkg.license} ${new Date().getFullYear()} for ${
	pkg.company
} - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by ${pkg.author}, email us at hello@frescoyfino.com
 */`;

const paths = {
	sass: {
		src: './src/scss/*.scss',
		watcher: './src/scss/**/*.scss',
		dest: './dist/css/',
	},
	css: {
		src: './dist/css/*.css',
		dest: './dist/css/min/',
	},
	bundle: {
		src: './src/js/main.js',
		watcher: ['./src/js/**/**.js', './src/js/main.js'],
		dest: './dist/js/',
	},
	min: {
		src: './src/js/main.js',
		dest: './dist/js/min/',
	},
};

/* Gulp Task for compiling SASS main file */
function scss() {
	return (
		src(paths.sass.src)
			.pipe(plumber())
			.pipe(maps.init())
			.pipe(
				sass({
					errLogToConsole: true,
				})
			)
			// .pipe(autoprefixer())
			.pipe(maps.write('./'))
			.pipe(dest(paths.sass.dest))
			.pipe(server.stream())
	);
}

/* Gulp Pipe for minifying CSS main file */
function minCss() {
	return src(paths.css.src)
		.pipe(
			cleanCSS({ debug: true }, (details) => {
				console.log(
					`The original file named ${details.name} was ${details.stats.originalSize} Bytes and now is ${details.stats.minifiedSize} Bytes of size :)`
				);
			})
		)
		.pipe(rename({ extname: '.min.css' }))
		.pipe(dest(paths.css.dest));
}

// /* Gulp task to Bundle and Minify the Javascript Code */
function bundle() {
	return src(paths.bundle.src)
		.pipe(
			gulpEsbuild({
				outfile: 'script.mjs',
				bundle: true,
				platform: 'neutral',
				logLevel: 'debug',
				format: 'esm',
				sourcemap: 'inline',
			})
		)
		.pipe(dest(paths.bundle.dest));
}

function minJs() {
	return src(paths.min.src)
		.pipe(
			gulpEsbuild({
				outfile: 'script.min.js',
				bundle: true,
				logLevel: 'debug',
				platform: 'browser',
				format: 'esm',
				// drop: ['console'],
				minify: true,
				treeShaking: true,
				banner: {
					js: banner,
				},
			})
		)
		.pipe(dest(paths.min.dest));
}

/* Gulp Watch */
function watcher() {
	server.init({
		proxy: 'http://127.0.0.1:5500',
		browser: 'chrome',
	});
	watch(paths.sass.watcher).on('change', series(scss, server.reload));
	watch(paths.bundle.watcher).on('change', series(bundle, server.reload));
	watch('./**/*.php').on('change', server.reload);
}

exports.scss = scss;
exports.minCss = minCss;
exports.bundle = bundle;
exports.minJs = minJs;
exports.build = parallel(minJs, minCss);
exports.watcher = watcher;
