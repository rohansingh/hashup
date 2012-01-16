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

