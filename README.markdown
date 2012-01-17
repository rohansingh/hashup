hashup
======

hashup uses file hashes to reduce bandwidth usage by skipping the upload of a
large file if the file has been previously uploaded to the server. It uses HTML5 
web workers to preserve UI performance, and HMAC's (hash-based message
authentication codes) to preserve file security and prevent information leakage.

This project is primarily a proof-of-concept implementation. However, it should
be possible to reuse `hashup.js` and `hashupWorker.js` in any application,
regardless of whether a nodejs backend is available.

Usage
-----
To run the current implementation:

    node app.js

You should then be able to browse to the project.

Status
------
Currently, I've implemented upload ticket issuance and client-side file hashing.
However, I haven't yet implemented any of the actual file upload.

To see the current code at work, run the project and select a file to hash. Ticket
and hash information will be display in your JavaScript console.

Licensing
---------
This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0
Unported License. To view a copy of this license, visit:
[http://creativecommons.org/licenses/by-nc-sa/3.0/](http://creativecommons.org/licenses/by-nc-sa/3.0/)

This is a proof-of-concept that may have security vulnerabilities and is not
suitable for use in production environments.

