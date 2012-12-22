

BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

class SpotifyUtils(object):

    @staticmethod
    def get_uri_type(uri):
        return uri.split(':')[1]

    @staticmethod
    def uri2id(uri):
        parts = uri.split(':')
        if len(parts) > 3 and parts[3] == 'playlist':
            s = parts[4]
        else:
            s = parts[2]

        v = 0
        for c in s:
            v = v * 62 + BASE62.index(c)
        return hex(v)[2:-1].rjust(32, '0')
