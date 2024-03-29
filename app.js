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

/**
 * Module dependencies.
 */

var express = require('express')
  , crypto = require('crypto')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'hashup for breakfast!',
  }));
  app.use(express.methodOverride());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


// Routes

app.get('/', routes.index);

app.get('/upload-ticket', function(req, res) {
  crypto.randomBytes(32, function (randomBytes) {
    req.session.tickets = req.session.tickets || {};

    // A ticket consists of an HMAC key, and indicates which hash algorithm
    // to use to calculate the HMAC. This gets sent back to the client.
    var ticket = {
      algorithm: 'sha1',
      key: new Buffer(crypto.randomBytes(32)).toString('base64'),
    };

    req.session.tickets[ticket.key] = ticket;
    res.json(ticket);
  });
});

app.post('/upload', function(req, res, next) {
  var ticket = req.body.ticket;
  var fileName = req.body.fileName;

  if (req.files[fileName]) {
    console.log('file uploaded: ' + fileName);
  }
});

app.listen(8585);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

