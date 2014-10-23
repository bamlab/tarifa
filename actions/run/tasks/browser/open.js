var Q = require('q'),
    format = require('util').format,
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    path = require('path'),
    print = require('../../../../lib/helper/print'),
    pathHelper = require('../../../../lib/helper/path'),
    settings = require('../../../../lib/settings');

function openChromeOnDarwin(conf) {
    var defer = Q.defer(),
        cmd = path.join('platforms', 'browser', 'cordova', 'run'),
        options = {
            cwd:settings.cordovaAppPath,
            timeout : 100000,
            maxBuffer: 1024 * 400
        };

    if(conf.verbose)
        print.success('trying to open browser!');

    exec(cmd, options, function (err, stdout, stderr) {
        if(err) {
            if(conf.verbose) {
                print.error('command: %s', cmd);
                print.error('stderr %s', stderr);
            }
            defer.reject(cmd + ' command failed;');
        }
        else {
            defer.resolve(conf);
        }
    });

    return defer.promise;
}

function openChromeOnWin32(conf) {
    var indexPath = path.resolve(process.cwd(), settings.cordovaAppPath, 'platforms', 'browser', 'www', 'index.html'),
        project = format('file://%s', indexPath);
        child = spawn(
            'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
            ['--user-data-dir=C:/Chromedevsession', '--disable-web-security', project],
            { detached: true , stdio:'ignore'}
        );

    child.unref();
    return Q.resolve(conf);
}

function openChromeOnLinux(conf) {
    var indexPath = path.resolve(process.cwd(), settings.cordovaAppPath, 'platforms', 'browser', 'www', 'index.html'),
        project = format('file://%s', indexPath);
        child = spawn(
            'chromium',
            ['--user-data-dir=/tmp/temp_chrome_user_data_dir_for_cordova_browser', '--disable-web-security', project],
            { detached: true , stdio:'ignore'}
        );

    child.unref();
    return Q.resolve(conf);
}

module.exports = function (conf) {
    switch(process.platform) {
        case 'darwin':
            return openChromeOnDarwin(conf);
        case 'win32':
            return openChromeOnWin32(conf);
        case 'linux':
            return openChromeOnLinux(conf);
        default:
            return Q.reject(format('Can not run on platform %s!', process.platform));
    }
};