/**
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2015 Canadian BioSample Repository (CBSR)
 */
module.exports = function(grunt) {

  //	Initialize the grunt tasks
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    karma: {
      options: {
        configFile: 'karma.conf.js',
        reporters: ['spec']
      },
      unit: {
        singleRun: true,
        colors: true
      },
      coverage: {
        options: {
          reporters: ['dots', 'coverage']
        },
        preprocessors: {
          'app/assets/javascripts/**/*.js': 'coverage'
        },
        coverageReporter: {
          type: 'html',
          dir: 'coverage',
          reporters: [
            { type: 'html', subdir: 'report-html' }
          ]
        }
      }
    },

    ngdocs: {
      all: [ 'app/assets/javascripts/**/*.js' ],
      options: {
        dest: 'docs',
        scripts: ['../app.min.js'],
      }
    }

    // ngAnnotate: {
    //   options: {
    //     add: false,
    //     remove: false,
    //     singleQuotes: true
    //   },
    //   bbwebApp: {
    //     files: [
    //       {
    //         expand: true,
    //         src: ['app/assets/javascripts/**/*.js'],
    //         ext: '.annotated.js', // Dest filepaths will have this extension.
    //         extDot: 'last'       // Extensions in filenames begin after the last dot
    //       },
    //     ],
    //   }
    // },

    // jshint: {
    //   files: ['Gruntfile.js', 'app/assets/javascripts/**/*.js', 'test/assets/javascripts/**/*.js'],
    //   options: {
    //     jshintrc: '.jshintrc'
    //   }
    // },

    // protractor: {
    //   options: {
    //     configFile: "node_modules/protractor/referenceConf.js", // Default config file
    //     keepAlive: true, // If false, the grunt process stops when the test fails.
    //     noColor: false, // If true, protractor will not use colors in its output.
    //     args: {
    //       // Arguments passed to the command
    //     }
    //   },
    //   your_target: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
    //     options: {
    //       configFile: "e2e.conf.js", // Target-specific config file
    //       args: {} // Target-specific arguments
    //     }
    //   },
    // }

  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-ngdocs');

  // grunt.registerTask('test', 'Run tests on singleRun karma server', function () {
  //   if (grunt.option('coverage')) {
  //     var karmaOptions = grunt.config.get('karma.options'),
  //         coverageOpts = grunt.config.get('karma.coverage');
  //     grunt.util._.extend(karmaOptions, coverageOpts);
  //     grunt.config.set('karma.options', karmaOptions);
  //   }
  //   grunt.task.run('karma:unit');
  // });

  grunt.registerTask('default', ['karma:unit']);

};
