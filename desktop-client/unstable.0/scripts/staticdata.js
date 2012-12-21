/**
 * @fileoverview Static data such as popular artists and users.
 */

'use strict';

/*
 * Exports
 */
exports.getInterestingPeople = getInterestingPeople;

/*
 * Variables
 */
var staticUsers = [{
  canonicalUsername: 'spotify',
  name: 'Curated by Spotify',
  picture: 'spotify:image:2b276a1713e133aba9aa5d366b09b1e38277bcd2'
}, {
  canonicalUsername: 'apechtold',
  name: 'Alexander Pechtold',
  picture: 'spotify:image:19d0595837a0f0d66a73a38fb4202ccbbec1615a'
}, {
  canonicalUsername: 'barackobama',
  name: 'Barack Obama',
  //v1: picture: spotify:image:27222a9559cd2fa40c3336ec81e7a1a9f8ef921f
  //v2: picture: spotify:image:5c5cc54bd034019326ff5f2e1dc51dcd83656efd
  picture: 'spotify:image:5baaf52b919f76422771b5e7748d2f67ab76c92a'
}, {
  canonicalUsername: 'brightnl',
  name: 'Bright NL',
  picture: 'spotify:image:94d0092ca0e2c6e5631f206f50edaac6aee8ab35'
}, {
  canonicalUsername: 'eliodirupo',
  name: 'Elio Di Rupo',
  picture: 'spotify:image:2486411b3de40bfdee8635f49bba4dd418f32f3b'
}, {
  canonicalUsername: 'ellenetherlands',
  name: 'Elle NL',
  picture: 'spotify:image:5e87aa2727d2701ef1d31eb0af7e07dfe98be5ec'
}, {
  canonicalUsername: 'esquirenl',
  name: 'Esquire NL',
  picture: 'spotify:image:d0cd9ff89347a80270a68060d62b30f45f6e5171'
}, {
  canonicalUsername: 'facebookstories',
  name: 'Facebook Stories',
  picture: 'spotify:image:a94b37112425705549c90da54eb911ad41c57633'
}, {
  canonicalUsername: 'glamournl',
  name: 'Glamour NL',
  picture: 'spotify:image:54c979612c26846e65801204c80700125578b750'
}, {
  canonicalUsername: 'lindamagazine',
  name: 'Linda Magazine',
  picture: 'spotify:image:57eeac471f0c12481e2c0db13d8bf39110373655'
}, {
  canonicalUsername: 'mittromney',
  name: 'Mitt Romney',
  picture: 'spotify:image:fc24d4b769799d56b094546bef9224305fb7fd97'
}, {
  canonicalUsername: 'marqueelv',
  name: 'Marquee Las Vegas',
  picture: 'spotify:image:2a7d2a743b4c085389dc277859d541cf83e55c0e'
}, {
  canonicalUsername: 'taolasvegas',
  name: 'Tao Las Vegas',
  picture: 'spotify:image:4fba78038315c0d42ae32934bec4cdcc9db7725f'
}, {
  canonicalUsername: 'lavolv',
  name: 'Lavo Las Vegas',
  picture: 'spotify:image:1ad22f7505058b25314a66de7d9c3f6b0b496605'
}, {
  canonicalUsername: 'voguenl',
  name: 'Vogue NL',
  picture: 'spotify:image:39cf29904be92ef278210d416668d895292be10d'
}, {
  canonicalUsername: 'willgluck',
  name: 'Will Gluck',
  picture: 'spotify:image:c46e7fe24dee37f409c81c4da992c535ef037f23'
}, {
  canonicalUsername: 'vincentvq',
  name: 'Vincent Van Quickenborne',
  picture: 'spotify:image:5acc22ca1c2972408f33d62cde0e614e38f25ff3'
}, {
  canonicalUsername: 'jasonaldean',
  name: 'Jason Aldean',
  picture: 'spotify:image:0c3c5f7ac44037a2754aa78593f557a221c22265'
}, {
  canonicalUsername: 'kendricklamar',
  name: 'Kendrick Lamar',
  picture: 'spotify:image:10727c47476a3d478ff008e874d14aaece33ad65'
}];

var interestingPeople = [{
  canonicalUsername: 'britneyspears',
  name: 'Britney Spears',
  picture: 'spotify:image:2e59bc6e8379191774e4cded65e9bfe5812b0ba9'
},{
  canonicalUsername: 'brokemogul',
  name: 'Scott Vener',
  picture: 'spotify:image:9db35cb6717a1ed3fb6a03d7c942d9fc6c67c120'
}, {
  canonicalUsername: 'dawallach',
  name: 'D.A. Wallach',
  picture: 'spotify:image:86aa704b598091bbbbe2e32bdc670d22a9d091f1'
}, {
  canonicalUsername: 'snoopdogg',
  name: 'Snoop',
  picture: 'spotify:image:46bf6b8e228b0597ceaf68e334c20f42b5f4a58f'
}, {
  canonicalUsername: 'diplomaddecent',
  name: 'Diplo',
  picture: 'spotify:image:e54d6a430e9128c8e322951451feb024f906a500'
}, {
  canonicalUsername: 'napstersean',
  name: 'Sean Parker',
  picture: 'spotify:image:21713e6729b33d9ec04b133cb43118a0a9f2913a'
}, {
  canonicalUsername: '126358325',
  name: 'Ray William Johnson',
  picture: 'spotify:image:68ce354bb51467e9878e93fb51e56c6fd9b349a3'
}, {
  canonicalUsername: 'chamillitary',
  name: 'Chamillionaire',
  picture: 'spotify:image:b0200f4b7b66a0ec76611f0f5a1d49367112f25c'
}, {
  canonicalUsername: 'm_shinoda',
  name: 'Mike Shinoda',
  picture: 'spotify:image:a58e5e26a8ca18f1518057c57f60b0a8f5f31e22'
}, {
  canonicalUsername: 'kellyrowland',
  name: 'Kelly Rowland',
  picture: 'spotify:image:bcc17b681599b2506e651f8b39035cf0349cb538'
}, {
  canonicalUsername: 'arminvanbuurenofficial',
  name: 'Armin van Buuren',
  picture: 'spotify:image:086ba06c837225c3a49fc5daf6ee7acba71f3fb2'
}, {
  canonicalUsername: 'mariahcarey',
  name: 'Mariah Carey',
  picture: 'spotify:image:f87a97ae0e4c30209c8aeedb6c1195f4111e6d06'
}, {
  canonicalUsername: 'officiallykkeli',
  name: 'Lykke Li',
  picture: 'spotify:image:f371bf6f2a8470abe7fbcf6bcc05c3b5851d795f'
}, {
  canonicalUsername: 'katyonamission',
  name: 'Katy B',
  picture: 'spotify:image:ffdb0e55b545ad552f0470bc9d32af1968e44478'
}, {
  canonicalUsername: 'mistersmims',
  name: 'Mark Foster',
  picture: 'spotify:image:ac1b35ffe51f2ca35f64f781a642c4213800fac3'
}, {
  canonicalUsername: 'kaskadeofficial',
  name: 'Kaskade',
  picture: 'spotify:image:80993d83eae140c16d874959af6cd88f0be6e59c'
}, {
  canonicalUsername: 'fitzandthetantrums',
  name: 'Noelle Scaggs',
  picture: 'spotify:image:43323c67f8a89781ac3ed58ff9a78ab041349fb0'
}, {
  canonicalUsername: 'maroon5',
  name: 'Maroon 5',
  picture: 'spotify:image:7e80f49739f8077ae3905b127e92be929a230b43'
}, {
  canonicalUsername: 'liambaileymusic',
  name: 'Liam Bailey',
  picture: 'spotify:image:c9dccde86ba28657da9f47fe24fd0fd62c83fd4b'
}, {
  canonicalUsername: '113713161',
  name: 'Justice',
  picture: 'spotify:image:a5149b8cdcafdd37bf702f8042bf035df4ad11e2'
}, {
  canonicalUsername: 'christinaperriofficial',
  name: 'Christina Perri',
  picture: 'spotify:image:42382dc80c4b46c37e42b085aa47247b2e012644'
}, {
  canonicalUsername: 'jasonderulomusic',
  name: 'Jason Derulo',
  picture: 'spotify:image:6df3824c8abd5baec15e342e381652688f4bf602'
}, {
  canonicalUsername: 'aplusk',
  name: 'Christopher A. Kutcher',
  picture: 'spotify:image:88d74da41496a853ac0ca618a7cd7f56c60b164b'
}, {
  canonicalUsername: 'pharrell.williams',
  name: 'Pharrell Williams',
  picture: 'spotify:image:876b69fe2dcdc65544cc07dcf56e70fe2af38a8c'
}, {
  canonicalUsername: 'shakiraofficial',
  name: 'Shakira',
  picture: 'spotify:image:9adcb3cbc103b1c90e114a19997f78bf26853289'
}, {
  canonicalUsername: 'idriselba',
  name: 'Idris Elba',
  picture: 'spotify:image:c9b354f0b6f73a268d4bd9721bc2629f4f421f0b'
}];


/**
 * A static list of interesting people to pad with on What's New.
 * @param {string} username The canonical username to compare with.
 * @return {boolean|Array} A list of interesting people if no username was specified; otherwise, a boolean indicating
 *   whether the user is an interesting user.
 */
function getInterestingPeople(username) {
  var foundUser = false;

  if (username === undefined)
    return interestingPeople;

  staticUsers.forEach(function(user, index) {
    if (user.canonicalUsername === username) {
      foundUser = user;
    }
  });

  interestingPeople.forEach(function(user, index) {
    if (user.canonicalUsername === username) {
      foundUser = user;
    }
  });

  return foundUser;
}