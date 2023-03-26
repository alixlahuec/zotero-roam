module.exports = {
	"hooks": {
		"after:bump": [
			"npm run build:prod",
			"npm run build:roam",
			"npm run build:sandbox"
		]
	},
	"git": {
		"changelog": "npx auto-changelog --stdout --config dev/.auto-changelog",
		"commitMessage": "release: v${version}",
		"tag": true,
		"tagMatch": "[0-9]*\\.[0-9]*\\.[0-9]*"
	},
	"github": {
		"assets": ["dist/*.js", "./extension.css", "./extension.js"],
		"draft": true,
		"release": true,
		"releaseName": "v${version}",
		releaseNotes(context){
			// Remove the header
			return context.changelog.split('\n').slice(2).join('\n');
		}
	},
	"npm": {
		"allowSameVersion": false,
		"publish": true
	}
};