# -*- coding: utf-8 -*-
# Copyright (c) 2012 Spotify AB

import json
import mimetypes
import os
import urllib2
from webob.exc import HTTPNotFound, HTTPForbidden, HTTPTemporaryRedirect

from spotify.appsdk import routine


SPOTILOCAL_PATTERN = r'^([0-9a-f]+)-([a-z][a-z0-9_-]+)\.app\.spotilocal\.com'


class Service(routine.Routine):

    cdn_url_pattern = 'https://{prefix}-{appid}.spapps.co/{path}' # prefix = hash of username and appid, plus a secret
    sdk_url_pattern = 'http://d1hza3lyffsoht.cloudfront.net/preview-sdk/{path}'

    access_control_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400'}

    def __init__(self, app_collection):
        self._app_collection = app_collection
        super(Service, self).__init__()

    def _send_json_response(self, response, data):
        response.content_type = 'application/json'
        response.body = json.dumps(data) + '\n'

    def _get_mimetype(self, filename):
        type, encoding = mimetypes.guess_type(filename)
        # We'll ignore encoding, even though we shouldn't really
        return type or 'application/octet-stream'

    def _cdn_redirect(self, prefix, app_identifier, path):
        url = self.cdn_url_pattern \
            .replace('{prefix}', prefix) \
            .replace('{appid}', app_identifier) \
            .replace('{path}', path)
        response = HTTPTemporaryRedirect(location=url)
        response.headers.update(self.access_control_headers)
        return response

    def _file_response(self, app_root, file_path):
        file_path = 'index.html' if not file_path\
        else os.path.normpath(file_path)
        if os.path.split(file_path)[0] == '..':
            return HTTPForbidden()
        full_path = os.path.join(app_root, file_path)
        if not os.path.isfile(full_path):
            return HTTPNotFound()
        response = routine.file_response(full_path)
        response.headers.update(self.access_control_headers)
        return response

    def _parse_hostname(self, hostname):
        group = hostname.split('.')[0]
        split = group.split('-')
        prefix = split[0]
        app_identifier = '-'.join(split[1:])
        return prefix, app_identifier

    @routine.expose(r'/apps', methods=['GET'])
    def apps(self, request, response):
        data = [a[0] for a in self._app_collection.apps()]
        self._send_json_response(response, data)

    @routine.expose(r'/_sdk/(?P<file_path>.*)', methods=['GET'])
    def sdk(self, request, response, file_path):
        local_path = 'js/dist/' + file_path
        if os.path.isfile(local_path):
            response = routine.file_response(local_path)
            response.headers.update(self.access_control_headers)
            return response
        url = self.sdk_url_pattern.replace('{path}', file_path)
        data = urllib2.urlopen(url)
        head = data.info()
        body = data.read()
        response.headers.update({'Content-Type': head['Content-Type']})
        response.headers.update(self.access_control_headers)
        response.body = body
        return response

    @routine.expose(r'/(?P<unknown_hash>[a-f0-9]+)(/(?P<file_path>.*))?',
        methods=['GET'],
        hostname=SPOTILOCAL_PATTERN)
    def file_by_hash_and_path(self, request, response, unknown_hash, file_path=None):
        if file_path is None:
            file_path = ''
        prefix, app_identifier = self._parse_hostname(request.host)
        try:
            self._app_collection.app_root(app_identifier)
        except KeyError:
            return self._cdn_redirect(
                prefix, app_identifier, unknown_hash + '/' + file_path)
        return HTTPTemporaryRedirect(location='/' + file_path)

    @routine.expose(r'(/(?P<file_path>.*))?',
        methods=['GET'],
        hostname=SPOTILOCAL_PATTERN)
    def file_by_path_only(self, request, response, file_path=None):
        prefix, app_identifier = self._parse_hostname(request.host)
        try:
            app_root = self._app_collection.app_root(app_identifier)
        except KeyError:
            return self._cdn_redirect(
                prefix, app_identifier, file_path)
        return self._file_response(app_root, file_path)
