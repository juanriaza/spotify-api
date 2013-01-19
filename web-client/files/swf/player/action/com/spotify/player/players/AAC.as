package com.spotify.player.players
{
    import com.spotify.events.*;
    import com.spotify.player.events.*;
    import com.spotify.utilities.*;
    import flash.events.*;
    import flash.media.*;
    import flash.net.*;
    import flash.system.*;

    public class AAC extends EventDispatcher implements IPlayer
    {
        public var isPlaying:Boolean = false;
        public var id:String = "";
        private var _isPaused:Boolean = false;
        private var _volume:Number = 1;
        private var _position:Number = 0;
        private var _duration:Number = 0;
        private var _isLoaded:Boolean = false;
        private var _transform:SoundTransform;
        private var _ncConnection:NetConnection;
        private var _nsStream:NetStream;
        private var _uri:String;

        public function AAC()
        {
            this._transform = new SoundTransform();
            dispatchEvent(new Event(ApplicationEvents.READY));
            if (!Capabilities.hasAudio)
            {
                dispatchEvent(new Event(PlayerEvents.NO_SOUND_CAPABILITIES));
            }
            return;
        }// end function

        public function initialize() : void
        {
            return;
        }// end function

        public function load(param1:String, param2:Object = null) : void
        {
            if (param1 === "")
            {
                dispatchEvent(new Event(PlayerEvents.CANNOT_PLAY_TRACK));
                return;
            }
            this._uri = param1;
            if (!this._ncConnection)
            {
                this._ncConnection = new NetConnection();
                this._ncConnection.connect(null);
            }
            if (this._nsStream)
            {
                this._nsStream.removeEventListener(NetStatusEvent.NET_STATUS, this.onNetStreamStatus);
            }
            this._nsStream = new NetStream(this._ncConnection);
            this._nsStream.addEventListener(NetStatusEvent.NET_STATUS, this.onNetStreamStatus, false, 0, true);
            this._nsStream.client = this;
            this._isLoaded = true;
            return;
        }// end function

        private function onNetStreamStatus(event:NetStatusEvent) : void
        {
            Log.debug(event.info.code);
            switch(event.info.code)
            {
                case "NetStream.Play.Start":
                {
                    this.setState(PlayerEvents.PLAYING);
                    break;
                }
                case "NetStream.Play.Stop":
                {
                    this.setState(PlayerEvents.STOPPED);
                    break;
                }
                case "NetStream.Pause.Notify":
                {
                    this.setState(PlayerEvents.PAUSED);
                    break;
                }
                case "NetStream.Unpause.Notify":
                {
                    this.setState(PlayerEvents.PLAYING);
                    break;
                }
                case "NetStream.Buffer.Flush":
                {
                    this._isLoaded = true;
                    this.setState(PlayerEvents.TRACK_ENDED);
                    break;
                }
                case "NetStream.Play.StreamNotFound":
                {
                    this.setState(PlayerEvents.CANNOT_PLAY_TRACK);
                    break;
                }
                case "NetStream.Seek.Complete":
                {
                    this.setState(PlayerEvents.POSITION_CHANGED);
                    break;
                }
                default:
                {
                    break;
                    break;
                }
            }
            return;
        }// end function

        private function setState(param1:String) : void
        {
            switch(param1)
            {
                case PlayerEvents.PLAYING:
                {
                    this._isPaused = false;
                    this.isPlaying = true;
                    dispatchEvent(new Event(PlayerEvents.PLAYING));
                    break;
                }
                case PlayerEvents.STOPPED:
                {
                    this.isPlaying = false;
                    this._isPaused = false;
                    this._isLoaded = false;
                    dispatchEvent(new Event(PlayerEvents.STOPPED));
                    break;
                }
                case PlayerEvents.PAUSED:
                {
                    this._isPaused = true;
                    this.isPlaying = false;
                    dispatchEvent(new Event(PlayerEvents.PAUSED));
                    break;
                }
                case PlayerEvents.TRACK_ENDED:
                {
                    this.isPlaying = false;
                    this._position = 0;
                    dispatchEvent(new Event(PlayerEvents.TRACK_ENDED));
                    break;
                }
                case PlayerEvents.CANNOT_PLAY_TRACK:
                {
                    this.isPlaying = false;
                    this._isLoaded = false;
                    this._position = 0;
                    dispatchEvent(new Event(PlayerEvents.CANNOT_PLAY_TRACK));
                    break;
                }
                case PlayerEvents.POSITION_CHANGED:
                {
                    dispatchEvent(new Event(PlayerEvents.POSITION_CHANGED));
                    break;
                }
                default:
                {
                    break;
                    break;
                }
            }
            return;
        }// end function

        public function onMetaData(param1:Object) : void
        {
            this._duration = (param1.duration as Number) * 1000;
            Log.debug(this._duration * 1000);
            return;
        }// end function

        public function play(param1:Number = 0) : void
        {
            if (this._nsStream)
            {
                this._position = param1;
                this._transform = this._nsStream.soundTransform;
                this._transform.volume = this._volume;
                if (this._isLoaded)
                {
                    this.seek(param1);
                    this.resume();
                }
                else
                {
                    this._nsStream.play(this._uri);
                }
            }
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

        public function stop(param1:Boolean = false) : void
        {
            if (this._isLoaded)
            {
            }
            if (this._nsStream)
            {
                this._position = 0;
                this._duration = 0;
                this._nsStream.close();
                this._nsStream = null;
                this.setState(PlayerEvents.STOPPED);
            }
            return;
        }// end function

        public function pause() : void
        {
            if (this._nsStream)
            {
                this._nsStream.pause();
            }
            return;
        }// end function

        public function resume() : void
        {
            if (this._nsStream)
            {
                this._nsStream.resume();
                this._isPaused = false;
                this.isPlaying = true;
            }
            return;
        }// end function

        public function time() : Number
        {
            if (this._nsStream)
            {
                return this._nsStream.time * 1000;
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
            this._transform.volume = this._volume;
            if (this._nsStream)
            {
                this._nsStream.soundTransform = this._transform;
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
            this._nsStream.seek(param1 / 1000);
            return;
        }// end function

        public function getDuration() : Number
        {
            if (this._nsStream !== null)
            {
                return this._duration * 1000;
            }
            return 0;
        }// end function

    }
}
