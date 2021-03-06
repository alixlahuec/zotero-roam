module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                separator: "\n"
            },
            dist: {
                src: ["src/init.js", 
                "src/utils.js", "src/handlers.js", 
                "src/interface.js", "src/extension.js", 
                "src/pageRefs.js",
                "src/formatting.js", "src/shortcuts.js",
                "src/run.js"],
                dest: "dist/zoteroRoam.js"
            }
        },
        uglify: {
            options: {
                banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            min: {
                src: "dist/zoteroRoam.js",
                dest: "dist/zoteroRoam.min.js"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["concat", "uglify"]);
};
