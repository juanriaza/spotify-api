package com.spotify.player
{
    import __AS3__.vec.*;
    import com.spotify.bridge.models.*;
    import com.spotify.events.*;
    import com.spotify.player.events.*;
    import com.spotify.player.players.*;
    import com.spotify.player.services.*;
    import com.spotify.utilities.*;
    import flash.events.*;
    import flash.system.*;
    import flash.utils.*;

    public class AudioManager extends EventDispatcher
    {
        private var _globalVolume:Number;
        private var _players:Vector.<>;
        private var _playersHashTable:Dictionary;
        private var _streamers:Dictionary;
        private var _streamersConnected:Number = 0;

        public function AudioManager()
        {
            this._players = new Vector.<null>;
            this._playersHashTable = new Dictionary();
            this._streamers = new Dictionary();
            this.addEventListeners();
            return;
        }// end function

        public function initialize() : void
        {
            this.registerAllCallbacks();
            if (Config.PLAYER_TYPE === PlayerEvents.RTMPS_PLAYER)
            {
                this.createStreamers();
            }
            else
            {
                JSInterface.notify(ApplicationEvents.READY, null, 1);
            }
            return;
        }// end function

        private function createStreamers() : void
        {
            var _loc_1:* = NaN;
            var _loc_2:* = null;
            if (Config.RTMP_SERVER)
            {
                _loc_1 = 0;
                while (_loc_1 < Config.RTMP_SERVER.length)
                {
                    
                    _loc_2 = new Streamer(Config.RTMP_SERVER[_loc_1]);
                    _loc_2.addEventListener(Event.CONNECT, this.onStreamerConnect, false, 0, true);
                    this._streamers[Config.RTMP_SERVER[_loc_1]] = _loc_2;
                    Log.debug("Will try to connect to " + Config.RTMP_SERVER[_loc_1]);
                    _loc_1 = _loc_1 + 1;
                }
            }
            return;
        }// end function

        private function onStreamerConnect(event:Event) : void
        {
            var _loc_2:* = this;
            var _loc_3:* = this._streamersConnected + 1;
            _loc_2._streamersConnected = _loc_3;
            if (this._streamersConnected === Config.RTMP_SERVER.length)
            {
                JSInterface.notify(ApplicationEvents.READY, null, 1);
            }
            return;
        }// end function

        private function registerAllCallbacks() : void
        {
            try
            {
                JSInterface.registerCallback("sp_hasSound", this.hasSoundCapabilities);
                JSInterface.registerCallback("sp_load", this.load);
                JSInterface.registerCallback("sp_play", this.play);
                JSInterface.registerCallback("sp_playpause", this.playPause);
                JSInterface.registerCallback("sp_stop", this.stop);
                JSInterface.registerCallback("sp_pause", this.pause);
                JSInterface.registerCallback("sp_resume", this.resume);
                JSInterface.registerCallback("sp_time", this.getPosition);
                JSInterface.registerCallback("sp_seek", this.seek);
                JSInterface.registerCallback("sp_playerState", this.getPlayerState);
                JSInterface.registerCallback("sp_setVolume", this.setVolume);
                JSInterface.registerCallback("sp_getVolume", this.getVolume);
                JSInterface.registerCallback("sp_getDuration", this.getDuration);
                JSInterface.registerCallback("sp_initializePlayerById", this.initializePlayer);
                JSInterface.registerCallback("sp_addPlayer", this.addPlayer);
                JSInterface.registerCallback("sp_removePlayerAtIndex", this.removePlayerAtIndex);
            }
            catch (error:SecurityError)
            {
                Log.debug("Security error with the JS interface");
                JSInterface.notify(ApplicationEvents.SECURITY_ERROR);
                ;
            }
            catch (error:Error)
            {
                Log.debug("Unknown error with the JS interface");
                JSInterface.notify(ApplicationEvents.UNKNOWN_ERROR);
            }
            return;
        }// end function

        private function removePlayerAtIndex(param1:Number) : Boolean
        {
            Log.debug("Need to remove player at index " + param1);
            if (!this._players[param1])
            {
                return false;
            }
            this.removeEventListenersFromPlayer(this._players[param1]);
            this._players[param1] = null;
            return true;
        }// end function

        public function initializePlayer(param1:String) : void
        {
            this._playersHashTable[param1].initialize();
            return;
        }// end function

        private function addPlayer(param1:Number, param2:String, param3:String) : Boolean
        {
            Log.debug("Need to add player with index " + param1 + " and of type " + Config.PLAYER_TYPE);
            if (this._playersHashTable[param1])
            {
                return false;
            }
            if (Config.PLAYER_TYPE === PlayerEvents.AAC_PLAYER)
            {
                this._players[param1] = new AAC();
            }
            else if (Config.PLAYER_TYPE === PlayerEvents.HTTP_PLAYER)
            {
                this._players[param1] = new HTTP();
            }
            else if (Config.PLAYER_TYPE === PlayerEvents.RTMPS_PLAYER)
            {
                this._players[param1] = new RTMP();
            }
            this._players[param1].id = param2;
            this._playersHashTable[param2] = this._players[param1];
            this.addEventListenersToPlayer(this._players[param1]);
            return true;
        }// end function

        private function addEventListenersToPlayer(param1) : void
        {
            param1.addEventListener(PlayerEvents.PLAYER_LOADED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.STOPPED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.PAUSED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.PLAYING, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.POSITION_CHANGED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.INVALID_TRACK_URI, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.TRACK_ENDED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.PLAYBACK_FAILED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.SONG_LOADED, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.LOAD, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.FIRST_BYTES, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(PlayerEvents.DURATION, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(ApplicationEvents.READY, this.onPlayerEvent, false, 0, true);
            param1.addEventListener(ApplicationEvents.NOT_READY, this.onPlayerEvent, false, 0, true);
            return;
        }// end function

        private function removeEventListenersFromPlayer(param1) : void
        {
            param1.removeEventListener(PlayerEvents.PLAYER_LOADED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.STOPPED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.PAUSED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.PLAYING, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.POSITION_CHANGED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.INVALID_TRACK_URI, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.TRACK_ENDED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.PLAYBACK_FAILED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.SONG_LOADED, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.LOAD, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.FIRST_BYTES, this.onPlayerEvent);
            param1.removeEventListener(PlayerEvents.DURATION, this.onPlayerEvent);
            param1.removeEventListener(ApplicationEvents.READY, this.onPlayerEvent);
            param1.removeEventListener(ApplicationEvents.NOT_READY, this.onPlayerEvent);
            return;
        }// end function

        private function addEventListeners() : void
        {
            return;
        }// end function

        private function getPlayerById(param1:String)
        {
            return this._playersHashTable[param1];
        }// end function

        private function onPlayerEvent(param1) : void
        {
            var _loc_2:* = param1.currentTarget.id as String;
            if (param1.type !== PlayerEvents.PAUSED)
            {
            }
            if (param1.type !== PlayerEvents.PLAYING)
            {
            }
            if (param1.type === PlayerEvents.POSITION_CHANGED)
            {
                JSInterface.notify(param1.type, this.getPlayerById(_loc_2).time(), 2, _loc_2);
            }
            else if (param1.type === PlayerEvents.SONG_LOADED)
            {
                JSInterface.notify(param1.type, this.getPlayerById(_loc_2).getDuration(), 2, _loc_2);
            }
            else if (param1.type === PlayerEvents.FIRST_BYTES)
            {
                JSInterface.notify(param1.type, param1.params.bytes, 2, _loc_2);
            }
            else if (param1.type === PlayerEvents.DURATION)
            {
                JSInterface.notify(param1.type, param1.params.duration, 2, _loc_2);
            }
            else
            {
                JSInterface.notify(param1.type, null, 2, _loc_2);
            }
            return;
        }// end function

        public function hasSoundCapabilities() : Boolean
        {
            return Capabilities.hasAudio;
        }// end function

        public function load(param1:String, param2:String, param3:Object = null) : void
        {
            Log.debug("Need to load a track from this server " + param3.server);
            if (param3)
            {
                if (param3.protocol === "rtmp")
                {
                    if (!this._streamers[param3.server])
                    {
                        Log.debug("Dont have a streamer for this server: " + param3.server);
                        this._streamers[param3.server] = new Streamer(param3.server);
                    }
                    else
                    {
                        Log.debug("Already have a streamer for this server: " + param3.server);
                    }
                    this.getPlayerById(param1).setStreamer(this._streamers[param3.server]);
                    this.getPlayerById(param1).load(param2, param3);
                }
                else
                {
                    this.getPlayerById(param1).load(param2);
                }
            }
            return;
        }// end function

        public function play(param1:String, param2:Number = 0) : void
        {
            this.getPlayerById(param1).play(param2);
            return;
        }// end function

        public function playPause(param1:String) : Boolean
        {
            return this.getPlayerById(param1).playpause();
        }// end function

        public function pause(param1:String) : void
        {
            this.getPlayerById(param1).pause();
            return;
        }// end function

        public function resume(param1:String) : void
        {
            this.getPlayerById(param1).resume();
            return;
        }// end function

        public function stop(param1:String) : void
        {
            this.getPlayerById(param1).stop();
            return;
        }// end function

        public function getPlayerState(param1:String) : Object
        {
            var _loc_2:* = new Object();
            _loc_2.volume = this.getPlayerById(param1).getVolume();
            _loc_2.duration = this.getPlayerById(param1).getDuration();
            _loc_2.position = this.getPlayerById(param1).time();
            return _loc_2;
        }// end function

        public function getPosition(param1:String) : Number
        {
            return this.getPlayerById(param1).time();
        }// end function

        public function seek(param1:String, param2:Number) : void
        {
            this.getPlayerById(param1).seek(param2);
            return;
        }// end function

        public function setVolume(param1:String, param2:Number) : void
        {
            this.getPlayerById(param1).setVolume(param2);
            this._globalVolume = this.getPlayerById(param1).getVolume();
            return;
        }// end function

        public function getVolume(param1:String = "") : Number
        {
            if (param1 !== "")
            {
                return this.getPlayerById(param1).getVolume();
            }
            return this._globalVolume;
        }// end function

        public function getDuration(param1:String) : Number
        {
            return this.getPlayerById(param1).getDuration();
        }// end function

    }
}
