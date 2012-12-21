var config = exports;

config.CATEGORIES = ['artists', 'albums', 'playlists'];
config.SEARCH_PROPERTIES = {
  'search': ['fuzzyMatch', 'tracks', 'artists', 'albums', 'playlists']
};
config.COLS = 3;
config.ROW_OFFSET = 60; // must be modulus 3 == 0
config.ROW_OFFSET_LENGTH = config.COLS * config.ROW_OFFSET;
config.POD_HEIGHT = 177;
config.LONER_AMOUNT = 20;
