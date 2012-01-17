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

  hashup.uploadFile = function (file, uploadPath, ticket, callback) {
    // Here's what we're going to do:
    // 
    // 1. Kick off the upload of the full file.
    // 2. Start calculating the hash of the file.
    // 3. Start calculating the HMAC for the file.
    //
    // If #1 completes, we cancel #2 and #3. If #2 and #3 complete,
    // we send the resulting fob to the server. If the fob is accepted,
    // we cancel #1.
    //
    // We use the upload ticket for any communication with the server,
    // so if things work out correctly, in the end that ticket should
    // be correlated with an actual file on the server (either the one
    // that we just uploaded, or a pre-existing matched file).

    var sendFileXhr = null, sendFobXhr = null,
        hashWorker = null, hmacWorker = null;

    // The fob contains the data we will send to the server to
    // see if we can skip the upload.
    var fob = {
      hash: null,
      hmac: null,
      fileName: file.name,
      ticket: ticket.key
    };

    var sendFile = function() {
      var formData = new FormData();

      // Upload the file along with the the upload ticket so that
      // the upload can be identified later.
      formData.append('ticket', fob.ticket);
      formData.append(file.name, file);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', uploadPath);

      xhr.onreadystatechange = function (event) {
        if (xhr.readyState === 4 && xhr.status === 200) {
          // The file has been uploaded so there is no reason
          // to keep calculating hashes and all that. Terminate.
          hashWorker.terminate();
          hmacWorker.terminate();
          sendFobXhr.abort();

          // Let the user know that we uploaded the file succesfully.
          callback({
            success: true,
            method: 'upload',
            ticket: fob.ticket
          });
        }
      };

      xhr.send(formData);

      return xhr;
    }

    var sendFob = function () {
      if (fob.hash === null || fob.hmac === null) {
        // The fob doesn't have all its parts so it can't be sent yet.
        return;
      }

      var formData = new FormData();
      formData.append('hash', fob.hash);
      formData.append('hmac', fob.hmac);
      formData.append('fileName', fob.fileName);
      formData.append('ticket', fob.ticket);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', uploadPath);

      xhr.onreadystatechange = function (event) {
        if (xhr.readyState === 4 && xhr.status === 200) {
          // The fob was accepted, meaning there was a file match
          // and we don't have to upload the rest of the file. Stop
          // the upload and let the user now.
          sendFileXhr.abort();

          // Let the user know that we skipped the upload process.
          callback({
            success: true,
            method: 'hash',
            ticket: fob.ticket
          });
        }
        else {
          // Either the fob was rejected, or there was some kind of
          // error. It doesn't really matter, the normal upload will
          // serve as the fallback.
        }
      }

      xhr.send(formData);
    }

    var getSha1Hash = function () {
      var worker = getWorker();

      worker.onmessage = function (event) {
        fob.hash = event.data.result;
        sendFob();
      };

      worker.postMessage({
        action: 'getSha1Hash',
        file: file,
      });

      return worker;
    }

    var getHmacSha1Hash = function () {
      var worker = getWorker();

      worker.onmessage = function (event) {
        fob.hmac = event.data.result;
        sendFob();
      };

      worker.postMessage({
        action: 'getHmacSha1Hash',
        file: file,
        key: fob.ticket
      });

      return worker;
    }

    // Do all those things I said we'd do.
    sendFileXhr = sendFile();
    hashWorker = getSha1Hash();
    hmacWorker = getHmacSha1Hash();
  };

  return hashup;
};

