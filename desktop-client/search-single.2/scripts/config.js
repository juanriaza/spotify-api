var config = exports;

/*
config.PROPERTIES = {
  "artists": [
    "name",
    "uri"
  ],
  "albums": [
    "name",
    "uri",
    {
      "artists": [
        "name"
      ]
    }
  ],
  "playlists": [
    "name",
    "uri"
  ]
};
*/
config.PROPERTIES = {
  'artists': ['name', 'uri', 'image'],
  'albums': ['name', 'uri', 'image'],
  'playlists': ['name', 'uri', 'image']
};
config.ALLOW_PEOPLE = false;
config.TIMEOUT = 6000;
config.CATEGORIES = ['artists', 'albums', 'playlists'];
config.SEARCH_CATEGORIES = ['tracks', 'artists', 'albums', 'playlists'];
config.COLS = 3;
config.ROW_OFFSET = 60; // must be modulus 3 == 0
config.ROW_OFFSET_LENGTH = config.COLS * config.ROW_OFFSET;
config.POD_HEIGHT = 177;
config.LONER_AMOUNT = 20;
config.MINIMAL_MARGIN = 10;
