/**
 * Module dependencies.
 */
var passport = require('passport')
  , util = require('util')
  , BadRequestError = require('./errors/badrequesterror');


/**
 * `Strategy` constructor.
 *
 * The token authentication strategy authenticates requests based on the
 * credentials submitted through standard request headers or body.
 *
 * Applications must supply a `verify` callback which accepts `username` and
 * `token` credentials, and then calls the `done` callback supplying a
 * `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occured, `err` should be set.
 *
 * Optionally, `options` can be used to change the fields in which the
 * credentials are found.
 *
 * Options:
 *
 *   - `usernameHeader`  header name where the username is found, defaults to 'x-username'
 *   - `tokenHeader`  header name where the token is found, defaults to 'x-token'
 *   - `usernameField`  field name where the username is found, defaults to 'username'
 *   - `tokenField`  field name where the password is found, defaults to 'password'
 *   - `usernameQuery`  query string name where the username is found, defaults to 'username'
 *   - `tokenQuery`  query string name where the password is found, defaults to 'password'
 *   - `passReqToCallback`  when `true`, `req` is the first argument to the verify callback (default: `false`)
 *
 * Examples:
 *
 *     passport.use(new TokenStrategy(
 *       function(username, token, done) {
 *         User.findOne({ username: username, token: token }, function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  
  if (!verify) throw new Error('token authentication strategy requires a verify function');
  
  this._usernameHeader = options.usernameHeader ? options.usernameHeader.toLowerCase() : 'x-username';
  this._tokenHeader    = options.tokenHeader ? options.tokenHeader.toLowerCase()    : 'x-token';
  
  this._usernameField = options.usernameField ? options.usernameField.toLowerCase() : 'username';
  this._tokenField    = options.tokenField ? options.tokenField.toLowerCase()    : 'token';

  this._usernameQuery = options.usernameQuery ? options.usernameQuery.toLowerCase() : this._usernameField;
  this._tokenQuery    = options.tokenQuery ? options.tokenQuery.toLowerCase()    : this._tokenField;
  
  passport.Strategy.call(this);
  this.name = 'token';
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var self = this;
  var username = req.headers[this._usernameHeader] || lookup(req.body, this._usernameField) || lookup(req.query, this._usernameQuery);
  var token    = req.headers[this._tokenHeader] || lookup(req.body, this._tokenField) || lookup(req.query, this._tokenQuery);

  if (!username || !token) {
    return this.fail(new BadRequestError(options.badRequestMessage || 'Missing credentials'));
  }
  
  function verified(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    self.success(user, info);
  }
  
  if (self._passReqToCallback) {
    this._verify(req, username, token, verified);
  } else {
    this._verify(username, token, verified);
  }
  
  function lookup(obj, field) {
    if (!obj) { return null; }
    var chain = field.split(']').join('').split('[');
    for (var i = 0, len = chain.length; i < len; i++) {
      var prop = obj[chain[i]];
      if (typeof(prop) === 'undefined') { return null; }
      if (typeof(prop) !== 'object') { return prop; }
      obj = prop;
    }
    return null;
  }
}


/**
 * Expose `Strategy`.
 */ 
module.exports = Strategy;
