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

var input = document.getElementById('fileInput');
var button = document.getElementById('hashButton');

button.onclick = function () {
  start = new Date();
  var h = hashup('/javascripts/hashupWorker.js');

  h.getSha1Hash(input.files[0], function (message) {
    end = new Date();

    console.log('SHA1 hash took: ' + (end - start));
    console.log(message);
  });

  now.getUploadTicket(function (ticket) {
    console.log('Received an upload ticket with key: ' + ticket.key);

    h.getHmacSha1Hash(input.files[0], ticket.key, function (message) {
      end = new Date();

      console.log('SHA1 HMAC took: ' + (end - start));
      console.log(message);
    });
  });
};

