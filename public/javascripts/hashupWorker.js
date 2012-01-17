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

importScripts('FileStreamer.js', 'sha1.js', 'sha1_stream.js');

hashupWorker = {
  getSha1Hash: function (file, callback) {
    var head = naked_sha1_head();

    var fs = new FileStreamer(4 * 1024 * 1024, true);
    fs.streamAsBinaryString(file, function (data, eof) {
      var buffer = str2binb(data);

      naked_sha1(buffer, data.length * 8, head);

      if (eof) {
        var hash = binb2hex(naked_sha1_tail(head));
        callback(hash);
      }
    });
  },

  getHmacSha1Hash: function (file, key, callback) {
    var head = null;

    var fs = new FileStreamer(4 * 1024 * 1024, true);
    fs.streamAsBinaryString(file, function (data, eof) {
      if (head === null) {
        head = hmac_sha1_stream_head(key, data);
      }
      else {
        hmac_sha1_stream(data, head.naked_hash);
      }

      if (eof) {
        var hash = binb2hex(hmac_sha1_stream_tail(head.opad, head.naked_hash));
        callback(hash);
      }
    });
  }
};

self.addEventListener('message', function (event) {
  var message = event.data;

  var respondFunc = function (result) {
    postMessage({
      action: message.action,
      result: result
    });
  }

  if (message.action === 'getSha1Hash') {
    hashupWorker.getSha1Hash(message.file, respondFunc);
  }
  else if (message.action === 'getHmacSha1Hash') {
    hashupWorker.getHmacSha1Hash(message.file, message.key, respondFunc);
  }
}, false);

