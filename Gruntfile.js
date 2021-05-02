module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            options: {
                separator: "\n"
            },
            browser: {
                src: ["src/init.js", 
                "src/utils.js", "src/handlers.js", 
                "src/interface.js", "src/extension.js", 
                "src/inPage.js",
                "src/formatting.js", "src/shortcuts.js",
                "src/run.js"],
                dest: "dist/zoteroRoam.js"
            },
            sandbox: {
                src: ["src/init.js", 
                "src/utils.js", "src/handlers.js", 
                "src/interface.js", "src/extension.js", 
                "src/inPage.js",
                "src/formatting.js", "src/shortcuts.js",
                "src/sand.js"],
                dest: "dist/sandbox.js"
            }
        },
        uglify: {
            options: {
                banner: '/* <%= pkg.name %> | <%= pkg.version %> | <%= grunt.template.today("yyyy-mm-dd") %> */\n',
            },
            browser: {
                src: "dist/zoteroRoam.js",
                dest: "dist/zoteroRoam.min.js"
            },
            sandbox: {
                src: "dist/sandbox.js",
                dest: "dist/sandbox.min.js"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    grunt.registerTask("default", ["concat", "uglify"]);
};
