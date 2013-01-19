# -*- coding: utf-8 -*-
# Copyright (c) 2012 Spotify AB

import json
import logging
import os

log = logging.getLogger(__name__)


class AppCollection(object):

    def __init__(self, app_root_dirs=None):
        self._roots = app_root_dirs or []
        self._apps = {}
        self.reload()

    def reload(self):
        apps = {}
        for root in self._roots:
            root = os.path.abspath(
                   os.path.normpath(
                   os.path.expanduser(
                   os.path.expandvars(
                       root))))
            for dirpath, dirnames, filenames in os.walk(root, followlinks=True):
                if 'manifest.json' in filenames:
                    mf_path = os.path.join(dirpath, 'manifest.json')
                    try:
                        mf = json.loads(open(mf_path, 'r').read())
                        apps[mf['BundleIdentifier']] = dirpath
                    except Exception, ex:
                        log.error(
                            'could not load manifest "%s": %s' % (mf_path, ex))
        self._apps = apps

    def apps(self):
        return self._apps.items()

    def app_root(self, app_identifier):
        return self._apps[app_identifier]
