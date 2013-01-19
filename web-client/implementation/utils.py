import binascii

BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

class SpotifyUtils(object):

    @staticmethod
    def gid2id(gid):
        return binascii.hexlify(gid).rjust(32, "0")

    @staticmethod
    def id2uri(uritype, v):
        res = []
        v = int(v, 16)
        while v > 0:
            res = [v % 62] + res
            v = v / 62
        id = ''.join([BASE62[i] for i in res])
        return ("spotify:"+uritype+":"+id).rjust(22, "0")

    @staticmethod
    def uri2id(uri):
        parts = uri.split(":")
        if len(parts) > 3 and parts[3] == "playlist":
            s = parts[4]
        else:
            s = parts[2]

        v = 0
        for c in s:
            v = v * 62 + BASE62.index(c)
        return hex(v)[2:-1].rjust(32, "0")

    @staticmethod
    def gid2uri(uritype, gid):
        id = SpotifyUtils.gid2id(gid)
        uri = SpotifyUtils.id2uri(uritype, id)
        return uri

    @staticmethod
    def get_uri_type(uri):
        return uri.split(":")[1]
