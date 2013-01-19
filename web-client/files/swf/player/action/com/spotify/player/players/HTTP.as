package com.spotify.player.players
{
    import com.spotify.events.*;
    import com.spotify.player.events.*;
    import com.spotify.utilities.*;
    import flash.events.*;
    import flash.media.*;
    import flash.net.*;

    public class HTTP extends EventDispatcher implements IPlayer
    {
        public var isPlaying:Boolean = false;
        public var id:String = "";
        private var _isPaused:Boolean = false;
        private var _volume:Number = 1;
        private var _position:Number = 0;
        private var _sound:Sound;
        private var _channel:SoundChannel;
        private var _transform:SoundTransform;
        private var _context:SoundLoaderContext;
        private var _isFullyBuffered:Boolean = false;
        private var _isLoaded:Boolean = false;
        private var _request:URLRequest;
        private var _firstBytesArrived:Boolean = false;
        private static const _BUFFER_SIZE:int = 100;

        public function HTTP()
        {
            this._transform = new SoundTransform();
            this._context = new SoundLoaderContext(_BUFFER_SIZE, true);
            dispatchEvent(new Event(PlayerEvents.PLAYER_LOADED));
            return;
        }// end function

        public function load(param1:String, param2:Object = null) : void
        {
            if (param1 === "")
            {
                dispatchEvent(new Event(PlayerEvents.CANNOT_PLAY_TRACK));
                return;
            }
            this._request = new URLRequest(param1);
            this._isLoaded = false;
            this._isFullyBuffered = false;
            this._firstBytesArrived = false;
            this._isPaused = true;
            if (this._sound !== null)
            {
                this._sound.removeEventListener(ProgressEvent.PROGRESS, this.onProgress);
                this._sound.removeEventListener(IOErrorEvent.IO_ERROR, this.onIOError);
                this._sound.removeEventListener(Event.COMPLETE, this.onSongComplete);
            }
            this._sound = new Sound();
            this._sound.addEventListener(ProgressEvent.PROGRESS, this.onProgress);
            this._sound.addEventListener(IOErrorEvent.IO_ERROR, this.onIOError, false, 0, true);
            this._sound.addEventListener(Event.COMPLETE, this.onSongComplete, false, 0, true);
            this._sound.load(this._request, this._context);
            this._isLoaded = true;
            dispatchEvent(new Event(PlayerEvents.LOAD));
            return;
        }// end function

        public function initialize() : void
        {
            dispatchEvent(new Event(ApplicationEvents.READY));
            return;
        }// end function

        public function play(param1:Number = 0) : void
        {
            this._position = param1;
            this.seek(param1);
            this.resume();
            Log.debug("[FLASH] Play music");
            return;
        }// end function

        public function playpause() : Boolean
        {
            if (this.isPlaying)
            {
                this.pause();
            }
            else
            {
                this.resume();
            }
            return this.isPlaying;
        }// end function

        public function stop(param1:Boolean = true) : void
        {
            this.isPlaying = false;
            this._isPaused = false;
            this._position = 0;
            if (!this._isFullyBuffered)
            {
                this._sound.close();
            }
            if (this._channel !== null)
            {
                this._channel.stop();
            }
            Log.debug("[FLASH] Stop music");
            if (param1)
            {
                dispatchEvent(new Event(PlayerEvents.STOPPED));
            }
            return;
        }// end function

        public function pause() : void
        {
            if (this.isPlaying)
            {
                this._position = this.time();
                this._channel.stop();
                this.isPlaying = false;
                this._isPaused = true;
                Log.debug("[FLASH] Pause music");
                dispatchEvent(new Event(PlayerEvents.PAUSED));
            }
            return;
        }// end function

        public function resume() : void
        {
            if (!this.isPlaying)
            {
            }
            if (this._isPaused)
            {
            }
            if (this._isLoaded)
            {
                this._transform.volume = this._volume;
                if (this._channel !== null)
                {
                    this._channel.removeEventListener(Event.SOUND_COMPLETE, this.onTrackEnd);
                }
                this._channel = this._sound.play(this._position, 0, this._transform);
                this._channel.addEventListener(Event.SOUND_COMPLETE, this.onTrackEnd, false, 0, true);
                this._isPaused = false;
                this.isPlaying = true;
                dispatchEvent(new Event(PlayerEvents.PLAYING));
            }
            return;
        }// end function

        public function time() : Number
        {
            if (this._channel !== null)
            {
                return Math.floor(this._channel.position);
            }
            return 0;
        }// end function

        public function setVolume(param1:Number) : void
        {
            if (param1 > 1)
            {
                this._volume = 1;
            }
            else if (param1 < 0)
            {
                this._volume = 0;
            }
            else
            {
                this._volume = param1;
            }
            if (this._channel !== null)
            {
                this._transform.volume = this._volume;
                this._channel.soundTransform = this._transform;
            }
            return;
        }// end function

        public function getVolume() : Number
        {
            return this._volume;
        }// end function

        public function seek(param1:Number) : void
        {
            this._position = param1;
            if (this.isPlaying)
            {
                if (this._channel !== null)
                {
                    this._channel.stop();
                    this._channel.removeEventListener(Event.SOUND_COMPLETE, this.onTrackEnd);
                }
                this._channel = this._sound.play(this._position, 0, this._transform);
                this._channel.addEventListener(Event.SOUND_COMPLETE, this.onTrackEnd, false, 0, true);
            }
            Log.debug("[FLASH] Seek music " + param1);
            dispatchEvent(new Event(PlayerEvents.POSITION_CHANGED));
            return;
        }// end function

        public function getDuration() : Number
        {
            if (this._channel !== null)
            {
                return Math.floor(this._sound.bytesTotal / (this._sound.bytesLoaded / this._sound.length));
            }
            return 0;
        }// end function

        private function onIOError(event:IOErrorEvent) : void
        {
            this.isPlaying = false;
            this._isLoaded = false;
            this._position = 0;
            Log.debug("[FLASH] Cannot load song");
            dispatchEvent(new Event(PlayerEvents.CANNOT_PLAY_TRACK));
            return;
        }// end function

        private function onTrackEnd(event:Event) : void
        {
            this.isPlaying = false;
            this._position = 0;
            Log.debug("[FLASH] Track ended");
            dispatchEvent(new Event(PlayerEvents.TRACK_ENDED));
            return;
        }// end function

        private function onSongComplete(event:Event) : void
        {
            this._isFullyBuffered = true;
            Log.debug("[FLASH] Song loaded");
            dispatchEvent(new Event(PlayerEvents.SONG_LOADED));
            return;
        }// end function

        private function onProgress(event:ProgressEvent) : void
        {
            if (this._firstBytesArrived === false)
            {
            }
            if (event.bytesLoaded > 0)
            {
                this._firstBytesArrived = true;
                dispatchEvent(new CustomEvent(PlayerEvents.FIRST_BYTES, {bytes:event.bytesLoaded}));
            }
            return;
        }// end function

    }
}
