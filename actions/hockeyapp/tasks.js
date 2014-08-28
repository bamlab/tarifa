var Q = require('q'),
fs = require('q-io/fs'),
path = require('path'),
tarifaFile = require('../../lib/tarifa-file'),
pathHelper = require('../../lib/helper/path'),
collsHelper = require('../../lib/helper/collections'),
getMode = require('../../lib/helper/getReleaseMode'),
argsHelper = require('../../lib/helper/args'),
hockeyapp = require('../../lib/hockeyapp/hockeyapp'),
print = require('../../lib/helper/print');

var upload = function (platform, config, argv, verbose) {

    return tarifaFile.parse(pathHelper.root(), platform, config).then(function (localSettings) {
        if (!localSettings.configurations[platform][config].hockeyapp_id)
            return Q.reject('No hockeyapp_id key is available in ' + config + 'for platform ' + platform);

        if (!localSettings.hockeyapp || !localSettings.hockeyapp.api_url ||
        !localSettings.hockeyapp.token) {
            return Q.reject('No hockeyapp informations are available in the current tarifa.json' +
            'file.');
        }

        // check for hockeyapp options in conf
        var params = {};
        if (localSettings.hockeyapp instanceof Object) {
            params = collsHelper.filterKeys(localSettings.hockeyapp, function (e) {
                return [
                    'versions_notify',
                    'versions_status',
                    'versions_tags',
                    'versions_teams',
                    'versions_users'
                ].indexOf(e) > -1;
            });
            params = collsHelper.mapKeys(params, function (e) {
                return e.replace(/^versions_/, '');
            });
        }

        // get relevant options in cmd args
        var opts = collsHelper.filterKeys(argv, function(e) {
            return ['notes', 'notify', 'status', 'tags', 'teams', 'users'].indexOf(e) > -1;
        });

        params = collsHelper.mergeObject(params, opts);

        var conf = {
            localSettings: localSettings,
            envSettings: localSettings.configurations[platform][config],
            uploadParams: params,
            verbose: verbose
        };
        var productFileName = pathHelper.productFile(
            platform,
            conf.envSettings.product_file_name,
            getMode(platform, config, localSettings)
        );

        return hockeyapp.uploadVersion(productFileName, conf);
    });
};

var clean = function(nbToKeep, argv, verbose) {
    return tarifaFile.parse(pathHelper.root()).then(function (localSettings) {
        var appIds = collsHelper.findByKey(localSettings, 'hockeyapp_id');
        return hockeyapp.clean(appIds, localSettings, nbToKeep).then(function (total) {
            print.success('Successfully deleted ' + total + ' version(s)');
        });
    });
};

var updateLast = function(platform, config, argv, verbose) {

    return tarifaFile.parse(pathHelper.root(), platform, config).then(function (localSettings) {
        if (!localSettings.configurations[platform][config].hockeyapp_id)
            return Q.reject('No hockeyapp_id key is available in ' + config + 'for platform ' + platform);

        if (!localSettings.hockeyapp || !localSettings.hockeyapp.api_url ||
        !localSettings.hockeyapp.token) {
            return Q.reject('No hockeyapp informations are available in the current tarifa.json' +
            'file.');
        }

        // get relevant options in cmd args
        var opts = collsHelper.filterKeys(argv, function(e) {
            return ['notes', 'notify', 'status', 'tags', 'teams', 'users'].indexOf(e) > -1;
        });

        var conf = {
            localSettings: localSettings,
            envSettings: localSettings.configurations[platform][config],
            uploadParams: opts,
            verbose: verbose
        };

        return hockeyapp.listVersions(conf, false).then(function (list) {
            return hockeyapp.updateVersion(list.app_versions[0].id, conf).then(function () {
              print.success('Updated version successfully.');
            });
        });
    });

};

var list = function(platform, config, verbose) {

    return tarifaFile.parse(pathHelper.root(), platform, config).then(function (localSettings) {
        if (!localSettings.configurations[platform][config].hockeyapp_id)
            return Q.reject('No hockeyapp_id key is available in ' + config + ' for platform ' + platform);

        if (!localSettings.hockeyapp || !localSettings.hockeyapp.api_url ||
        !localSettings.hockeyapp.token) {
            return Q.reject('No hockeyapp informations are available in the current tarifa.json' +
            'file.');
        }

        var conf = {
            localSettings: localSettings,
            envSettings: localSettings.configurations[platform][config]
        };

        return hockeyapp.listVersions(conf, true);
    });
};

module.exports.list = list;
module.exports.upload = upload;
module.exports.clean = clean;
module.exports.updateLast = updateLast;
