
/**
 * Module dependencies.
 */

var express = require('express')
  , crypto = require('crypto')
  , nowjs = require('now')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'hashup for breakfast!'
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

app.listen(8585);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var everyone = nowjs.initialize(app, { cookieKey: 'connect.sid' });

everyone.now.getUploadTicket = function (callback) {
  var session = this.user.session;

  crypto.randomBytes(32, function (randomBytes) {
    session.tickets = session.tickets || {};

    // A ticket consists of an HMAC key, and indicates which hash algorithm
    // to use to calculate the HMAC. This gets sent back to the client.
    var ticket = {
      algorithm: 'sha1',
      key: new Buffer(crypto.randomBytes(32)).toString('base64'),
    };

    session.tickets[ticket.key] = ticket;
    callback(ticket);
  });
};

