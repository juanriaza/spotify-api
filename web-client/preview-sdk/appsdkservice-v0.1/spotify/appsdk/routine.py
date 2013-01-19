# -*- coding: utf-8 -*-
# Copyright (c) 2012 Spotify AB

import mimetypes
import os
import re
import webob


HTTP_METHODS = ('GET', 'POST', 'PUT', 'HEAD', 'DELETE')
DEFAULTHOST = r'.*'

def expose(pattern, method=None, methods=HTTP_METHODS, hostname=DEFAULTHOST):
    def decorate(f):
        if not hasattr(f, '_routine'):
            f._routine = {}
        all_methods = [method] if method else methods
        f._routine.setdefault('expose', []).append((all_methods, pattern, hostname))
        return f
    return decorate


def get_mimetype(path):
    type, encoding = mimetypes.guess_type(path)
    # We'll ignore encoding, even though we shouldn't really
    return type or 'application/octet-stream'


def file_response(path):
    res = webob.Response(content_type=get_mimetype(path),
        conditional_response=True)
    res.app_iter = FileIterable(path)
    res.content_length = os.path.getsize(path)
    res.last_modified = os.path.getmtime(path)
    res.etag = '%s-%s-%s' % (
        os.path.getmtime(path), os.path.getsize(path), hash(path))
    return res


class FileIterable(object):

    def __init__(self, filename, start=None, stop=None):
        self.filename = filename
        self.start = start
        self.stop = stop

    def __iter__(self):
        return FileIterator(self.filename, self.start, self.stop)

    def app_iter_range(self, start, stop):
        return self.__class__(self.filename, start, stop)


class FileIterator(object):

    chunk_size = 4096

    def __init__(self, filename, start, stop):
        self.filename = filename
        self.fileobj = open(self.filename, 'rb')
        if start:
            self.fileobj.seek(start)
        if stop is not None:
            self.length = stop - start
        else:
            self.length = None

    def __iter__(self):
        return self

    def next(self):
        if self.length is not None and self.length <= 0:
            raise StopIteration
        chunk = self.fileobj.read(self.chunk_size)
        if not chunk:
            raise StopIteration
        if self.length is not None:
            self.length -= len(chunk)
            if self.length < 0:
                # Chop off the extra:
                chunk = chunk[:self.length]
        return chunk

    __next__ = next # py3 compat


class Routine(object):
    """Represents a WSGI application.
    """

    def __init__(self):
        self.__handlers = []
        for name in dir(self):
            if name.startswith('_'):
                continue
            f = getattr(self, name)
            if not hasattr(f, '_routine'):
                continue
            for methods, pattern, hostpattern in f._routine.get('expose', ()):
                if not pattern.endswith('$'):
                    pattern += '$'
                cp = re.compile(pattern)
                cp2 = re.compile(hostpattern)
                for method in methods:
                    if method not in HTTP_METHODS:
                        raise ValueError('unknown method %s for handler %s' %
                                         (method, f))
                self.__handlers.append((cp, f, set(methods), cp2))

    def __call__(self, environ, start_response):
        assert hasattr(self, '_Routine__handlers'), 'Routine constructor was not called'
        response = webob.Response()
        path = environ['PATH_INFO']
        method = environ['REQUEST_METHOD']
        host = environ['HTTP_HOST']

        # find handler among exposed methods
        handler, match_allow = None, None
        for pattern, f, allowed_methods, hostpattern in self.__handlers:
            m = pattern.match(path)
            m2 = hostpattern.match(host)
            if m and m2:
                match_allow = allowed_methods
                if method in allowed_methods:
                    kwargs = m.groupdict()
                    handler = f
                    break

        # 404 if no pattern match, 405 if pattern match but method mismatch
        if handler is None:
            if match_allow:
                response.status = 405
                response.body = 'method not allowed'
                response.headers['Allow'] = ', '.join(match_allow)
            else:
                response.status = 404
                response.body = 'no such resource'
            return response(environ, start_response)

        # call handler
        request = webob.Request(environ)
        try:
            ret = handler(request, response, **kwargs)
            response = ret if ret is not None else response
        except StandardError:
            response.status = 500
            return response(environ, start_response)

        return response(environ, start_response)
