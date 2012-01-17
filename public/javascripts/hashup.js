/*
 * Copyright (c) 2012, Rohan Singh (rohan@washington.edu)
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0
 * Unported License. To view a copy of this license, visit:
 * http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Or send a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View,
 * California, 94041, USA.
 */

hashup = function (workerPath) {
  var hashup = {};
  var getWorker = function () {
    // We spawn a new worker so that each action can run in parallel.
    var worker = new Worker(workerPath);

    if (worker.webkitPostMessage) {
      worker.postMessage = worker.webkitPostMessage;
    }

    return worker;
  }

  hashup.getSha1Hash = function (file, callback) {
    var worker = getWorker();

    worker.onmessage = function (event) {
      callback(event.data);
    };

    worker.postMessage({
      action: 'getSha1Hash',
      file: file,
    });
  }

  hashup.getHmacSha1Hash = function (file, key, callback) {
    var worker = getWorker();

    worker.onmessage = function (event) {
      callback(event.data);
    };

    worker.postMessage({
      action: 'getHmacSha1Hash',
      file: file,
      key: key
    });
  }

  return hashup;
};

