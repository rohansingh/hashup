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

/* FileStreamer.js */
var FileStreamer = function (sliceSize, useFileReaderSync) {
  this.sliceSize = sliceSize;
  this.useFileReaderSync = useFileReaderSync;
}

FileStreamer.prototype.streamAsBinaryString = function (file, callback) {
  return this.streamFile(file, callback);
}

FileStreamer.prototype.streamAsText = function (file, encoding, callback) {
  return this.streamFile(file, callback, 'text', encoding);
}

FileStreamer.prototype.streamAsArrayBuffer = function (file, callback) {
  return this.streamFile(file, callback, 'buffer');
}

FileStreamer.prototype.streamAsDataURL = function (file, callback) {
  return this.streamFile(file, callback, 'url');
}

FileStreamer.prototype.streamFile = function (file, callback, readType, encoding) {
  var fileReader;
  if (this.useFileReaderSync) {
    fileReader = new FileReaderSync();
  }
  else {
    fileReader = new FileReader();
  }

  var position = 0;
  var eof = false;

  var sliceFunc = (file.webkitSlice) ? file.webkitSlice : file.mozSlice;
  
  var readFunc;
  if (readType === 'text') {
    readFunc = function (blob) {
      return fileReader.readAsText.apply(this, [blob, encoding]);
    }
  }
  else if (readType === 'buffer') {
    readFunc = fileReader.readAsArrayBuffer;
  }
  else if (readType === 'url') {
    readFunc = fileReader.readAsDataURL;
  }
  else {
    readFunc = fileReader.readAsBinaryString;
  }

  var that = this;
  var doRead = function () {
    if (eof) {
      // We've read the entire file.
      return;
    }

    var end = position + that.sliceSize;
    if (end >= file.size) {
      end = file.size;
      eof = true;
    }

    var blob = sliceFunc.apply(file, [position, end]);
    position = end;

    var result =  readFunc.apply(fileReader, [blob]);

    // If we are using FileReaderSync, return the result of the read
    // to the user's callback, and then start reading the next slice.
    if (that.useFileReaderSync && callback.apply(file, [result, eof]) !== false) {
      doRead();
    }
  };

  if (!this.useFileReaderSync) {
    fileReader.onloadend = function (event) {
      if (callback.apply(file, [event, eof]) !== false) {
        doRead();
      }
    };
  }

  doRead();
}

/* sha1.js */
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

/* sha1_stream.js */
/**
 * Support for generating SHA-1 of a stream.
 *
 * Based on http://pajhome.org.uk/crypt/md5/sha1.js.
 */

function naked_sha1_head() {
  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;
  return [w, a, b, c, d, e, [], 0, 0];
}

function naked_sha1(x, len, h) {
  var w = h[0], a = h[1], b = h[2], c = h[3], d = h[4], e = h[5];
  /* prepend data from last time */
  var old_len = h[8];
  var blen = x.length;
  if (x.length > 0) {
    var shift = old_len % 32;
    if (shift > 0) {
      h[6][old_len >> 5] |= x[0] >> shift;
      for (var i=0; i<x.length-1; i++) {
        x[i] = x[i] << (32 - shift) | x[i+1] >> shift;
      }
      x[x.length-1] <<= 32 - shift;
    }
  }
  x = h[6].concat(x)
  var max = (old_len + len) >> 5;
  max -= max % 16;
  for(var i = 0; i < max; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  h[0] = w;
  h[1] = a;
  h[2] = b;
  h[3] = c;
  h[4] = d;
  h[5] = e;
  /* store extra for next time */
  h[6] = x.slice(max, (old_len + len + 24) >> 5);
  h[7] += len;
  h[8] += len - 32 * max;
}

function naked_sha1_tail(h) {
  /* append padding */
  var x = h[6];
  var total_len = h[7];
  var len = h[8];
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = total_len;
  h[8] += 512 - len % 512;
  naked_sha1([], 0, h);
  return h.slice(1, 6);
}

function hmac_sha1_stream_head(key, data) {
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var naked_hash = naked_sha1_head();
  naked_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz, naked_hash);

  return {
    opad: opad,
    naked_hash: naked_hash
  };
}

function hmac_sha1_stream(data, naked_hash) {
  naked_sha1(str2binb(data), data.length * chrsz, naked_hash);
}

function hmac_sha1_stream_tail(opad, naked_hash) {
  var hash = naked_sha1_tail(naked_hash);
  return core_sha1(opad.concat(hash), 512 + 160);
}

