var Q = require('q'),
    chalk = require('chalk'),
    cordova = require('cordova'),
    argsHelper = require('../../lib/args'),
    settings = require('../../lib/settings'),
    tarifaFile = require('../../lib/tarifa-file'),
    path = require('path'),
    fs = require('fs'),
    prepareAction = require('../prepare');

var build = function (platform, config, verbose) {
    var cwd = process.cwd();
    var tarifaFilePath = path.join(cwd, 'tarifa.json');

    return tarifaFile.parseFromFile(tarifaFilePath, platform, config).then(function (localSettings) {
        var defer = Q.defer();
        var localConf = localSettings.configurations[platform][config];
        var mode = (platform === 'android' && (localConf.keystore_path && localConf.keystore_alias)) ? '--release' : null;

        if(verbose) console.log(chalk.green('✔') + ' start to build the www project');
        return prepareAction.prepare(platform, config, verbose).then(function () {
            process.chdir(path.join(cwd, settings.cordovaAppPath));
            if(verbose) console.log(chalk.green('✔') + ' start cordova build');
            cordova.build({
                verbose: verbose,
                platforms: [ platform ],
                options: mode ? [ mode ] : []
            }, function (err, result) {
                process.chdir(cwd);
                if(err) defer.reject(err);
                defer.resolve();
            });
            return defer.promise;
        });
    });
};

var action = function (argv) {
    var verbose = false;
    if(argsHelper.matchSingleOptions(argv, 'h', 'help')) {
        console.log(fs.readFileSync(path.join(__dirname, 'usage.txt'), 'utf-8'));
        return Q.resolve();
    }

    if(argsHelper.matchSingleOptions(argv, 'V', 'verbose', [1,2])) {
        verbose = true;
    } else if(argv._.length != 1 && argv._.length != 2) {
        console.log(fs.readFileSync(path.join(__dirname, 'usage.txt'), 'utf-8'));
        return Q.resolve();
    }

    return build(argv._[0], argv._[1] || 'default', verbose);
}

action.build = build;

module.exports = action;