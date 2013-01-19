import json, base64
import requests
from types import FunctionType
from lxml.html import fromstring
from twisted.internet import reactor
from autobahn.websocket import WebSocketClientFactory, WebSocketClientProtocol, connectWS

import logging
logging.basicConfig(level=logging.DEBUG)

from protos import mercury_pb2, metadata_pb2
from utils import SpotifyUtils


class SpotifyClientProtocol(WebSocketClientProtocol):

    def onOpen(self):
        self.seq = 0
        self.cmd_callbacks = {}
        self.login()

    def login(self):
        credentials = self.sp_settings['credentials'][0].split(':', 2)
        credentials[2] = credentials[2].decode('string_escape')
        self.send_command('connect', credentials, self.login_callback)

    def onMessage(self, msg, binary):
        logging.debug('GOT %s' % msg)
        msg = json.loads(str(msg))
        if 'id' in msg:
            pid = msg['id']
            if pid in self.cmd_callbacks:
                callback = self.cmd_callbacks[pid]
                if isinstance(callback, FunctionType):
                    callback(self, msg)
                else:
                    callback(msg)
                self.cmd_callbacks.pop(pid)

    def send_command(self, name, args=None, callback=None):
        if not args:
            args = []
        msg = {
            'name': name,
            'id': str(self.seq),
            'args': args}

        if callback:
            self.cmd_callbacks[self.seq] = callback
        self.seq += 1
        msg_enc = json.dumps(msg, separators=(',',':'))
        logging.debug('SENT %s' % msg_enc)
        self.sendMessage(msg_enc)

    def metadata_request(self, uris):
        mercury_requests = mercury_pb2.MercuryMultiGetRequest()

        if type(uris) != list:
            uris = [uris]

        for uri in uris:
            uri_type = SpotifyUtils.get_uri_type(uri)
            uri_id = SpotifyUtils.uri2id(uri)
            mercury_request = mercury_pb2.MercuryRequest()
            mercury_request.body = 'GET'
            mercury_request.uri = 'hm://metadata/%s/%s' % (uri_type, uri_id)
            mercury_requests.request.extend([mercury_request])

        args = self.generate_multiget_args(SpotifyUtils.get_uri_type(uris[0]), mercury_requests)

        self.send_command('sp/hm_b64', args, self.metadata_response)

    def metadata_response(self, data):
        obj = self.parse_metadata(data)
        print type(obj)

    def generate_multiget_args(self, metadata_type, requests):
        args = [0]
        if len(requests.request) == 1:
            req = base64.encodestring(requests.request[0].SerializeToString())
            args.append(req)
        else:
            header = mercury_pb2.MercuryRequest()
            header.body = 'GET'
            header.uri = 'hm://metadata/%ss' % metadata_type
            header.content_type = 'vnd.spotify/mercury-mget-request'

            header_str = base64.encodestring(header.SerializeToString())
            req = base64.encodestring(requests.SerializeToString())
            args.extend([header_str, req])
        return args

    def parse_metadata_item(self, content_type, body):
        if content_type =='vnd.spotify/metadata-album':
            obj = metadata_pb2.Album()
        elif content_type == 'vnd.spotify/metadata-track':
            obj = metadata_pb2.Track()
        else:
            raise ValueError('Unrecognised metadata type %s' % content_type)

        obj.ParseFromString(body)
        return obj

    def parse_metadata(self, resp):
        resp = resp['result']
        header = mercury_pb2.MercuryReply()
        header.ParseFromString(base64.decodestring(resp[0]))
        if header.status_message == 'vnd.spotify/mercury-mget-reply':
            mget_reply = mercury_pb2.MercuryMultiGetReply()
            mget_reply.ParseFromString(base64.decodestring(resp[1]))
            items = []
            for reply in mget_reply.reply:
                item = self.parse_metadata_item(reply.content_type, reply.body)
                items.append(item)
            return items
        else:
            return self.parse_metadata_item(header.status_message, base64.decodestring(resp[1]))


class Spotify(object):

    def __init__(self, login_callback):
        self.login_callback = login_callback

    def login_auth(self, username, password):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.101 Safari/537.11'
        }
        session = requests.session()
        secret_payload = {
            'album': 'http://open.spotify.com/album/2mCuMNdJkoyiXFhsQCLLqw',
            'song': 'http://open.spotify.com/track/6JEK0CvvjDjjMUBFoXShNZ'}
        req_home = session.get('https://play.spotify.com/redirect/facebook/notification.php', headers=headers, params=secret_payload)

        req_home_tree = fromstring(req_home.content)
        secret_token = req_home_tree.forms[0][0].attrib['value']

        payload = {
            'type': 'sp',
            'username': username,
            'password': password,
            'secret': secret_token
        }
        req = session.post('https://play.spotify.com/xhr/json/auth.php', data=payload, headers=headers)
        self.settings = req.json()['config']

    def connect(self, username, password):
        self.login_auth(username, password)

        ws = WebSocketClientFactory(
            self.settings['aps']['ws'][0],
            useragent='rick astley',
            debug=True,
            debugCodePaths=True)
        SpotifyClientProtocol.sp_settings = self.settings
        SpotifyClientProtocol.login_callback = self.login_callback
        ws.protocol = SpotifyClientProtocol
        connectWS(ws)
        reactor.run()


def second_callback(sp, data):
    print sp
    print data

def my_callback(sp, login_data):
    #sp.metadata_request('spotify:track:3oHTgUVzVmSrtN2crDANHk')
    args = ["mp3160", SpotifyUtils.uri2id('spotify:track:5NTu6K3dvyDyQnjVelWIjW')]
    sp.send_command("sp/track_uri", args, second_callback)

sp = Spotify(my_callback)
sp.connect('user', 'pwd')
