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
var button = document.getElementById('uploadButton');

button.onclick = function () {
  var h = hashup('/javascripts/hashupWorker.js');

  now.getUploadTicket(function (ticket) {
    console.log('Received an upload ticket with key: ' + ticket.key);

    h.uploadFile(input.files[0], '/upload', ticket, function (result) {
      console.log(result);
    });
  });
};

