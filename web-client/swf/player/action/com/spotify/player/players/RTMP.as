package com.spotify.player.players
{
    import com.spotify.events.*;
    import com.spotify.player.events.*;
    import com.spotify.player.services.*;
    import com.spotify.utilities.*;
    import flash.events.*;
    import flash.media.*;
    import flash.net.*;
    import flash.system.*;

    public class RTMP extends EventDispatcher implements IPlayer
    {
        public var isPlaying:Boolean = false;
        public var id:String = "";
        private var _isPaused:Boolean = false;
        private var _volume:Number = 1;
        private var _position:Number = 0;
        private var _duration:Number = 0;
        private var _isLoaded:Boolean = false;
        private var _transform:SoundTransform;
        private var _nsStream:NetStream;
        private var _uri:String;
        private var _streamer:Streamer;
        private var _responder:Responder;
        private var _isSeeeking:Boolean;

        public function RTMP()
        {
            this._transform = new SoundTransform();
            if (!Capabilities.hasAudio)
            {
                dispatchEvent(new Event(PlayerEvents.NO_SOUND_CAPABILITIES));
            }
            this._responder = new Responder(this.onStreamLength);
            return;
        }// end function

        public function setStreamer(param1:Streamer) : void
        {
            if (this._streamer)
            {
                if (this._streamer)
                {
                }
            }
            if (this._streamer.server !== param1.server)
            {
                if (this._streamer)
                {
                    this._streamer.removeEventListener(Event.CLOSE, this.onConnectionLost);
                    this._streamer.removeEventListener(Event.CONNECT, this.onConnect);
                }
                this._streamer = param1;
                if (this._streamer.isConnected)
                {
                    dispatchEvent(new Event(ApplicationEvents.READY));
                }
                this._streamer.addEventListener(Event.CLOSE, this.onConnectionLost, false, 0, true);
                this._streamer.addEventListener(Event.CONNECT, this.onConnect, false, 0, true);
                Log.debug("Need to update the streamer");
            }
            else
            {
                Log.debug("No need to update the streamer");
            }
            return;
        }// end function

        public function initialize() : void
        {
            return;
        }// end function

        public function load(param1:String, param2:Object = null) : void
        {
            Log.debug("Track with uri is loaded " + param1);
            if (param1 === "")
            {
                dispatchEvent(new Event(PlayerEvents.CANNOT_PLAY_TRACK));
                return;
            }
            this._isPaused = true;
            this._uri = param1;
            if (this._nsStream)
            {
                this._nsStream.close();
                this._nsStream.removeEventListener(NetStatusEvent.NET_STATUS, this.onNetStreamStatus);
            }
            this._nsStream = new NetStream(this._streamer.getNetConnection());
            this._nsStream.addEventListener(NetStatusEvent.NET_STATUS, this.onNetStreamStatus, false, 0, true);
            this._nsStream.addEventListener(AsyncErrorEvent.ASYNC_ERROR, this.onAsyncError, false, 0, true);
            this._nsStream.client = this;
            this._streamer.getNetConnection().call("getStreamLength", this._responder, param1);
            this._transform.volume = this._volume;
            this._nsStream.soundTransform = this._transform;
            this._nsStream.play(this._uri);
            this._isLoaded = true;
            dispatchEvent(new Event(PlayerEvents.LOAD));
            if (param2)
            {
                Log.debug("Autoplay " + param2.autoplay);
                Log.debug("Start from " + param2.startFrom);
                if (param2.startFrom)
                {
                    this.seek(param2.startFrom);
                }
                if (param2.autoplay == false)
                {
                    this.pause();
                }
                else
                {
                    this.setState(PlayerEvents.PLAYING);
                }
            }
            return;
        }// end function

        private function onAsyncError(event:AsyncErrorEvent) : void
        {
            return;
        }// end function

        private function onConnect(event:Event) : void
        {
            dispatchEvent(new Event(ApplicationEvents.READY));
            return;
        }// end function

        private function onConnectionLost(event:Event) : void
        {
            dispatchEvent(new Event(ApplicationEvents.NOT_READY));
            return;
        }// end function

        private function onNetStreamStatus(event:NetStatusEvent) : void
        {
            Log.debug(event.info.code);
            switch(event.info.code)
            {
                case "NetStream.Play.Start":
                {
                    break;
                }
                case "NetStream.Play.Stop":
                {
                    this.setState(PlayerEvents.STOPPED);
                    this.setState(PlayerEvents.TRACK_ENDED);
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
                    break;
                }
                case "NetStream.Buffer.Full":
                {
                    this._isLoaded = true;
                    break;
                }
                case "NetStream.Play.NoSupportedTrackFound":
                {
                    this.setState(PlayerEvents.CANNOT_PLAY_TRACK);
                    break;
                }
                case "NetStream.Seek.Notify":
                {
                    this.setState(PlayerEvents.SEEKING);
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
                case PlayerEvents.SEEKING:
                {
                    break;
                }
                case PlayerEvents.POSITION_CHANGED:
                {
                    Log.debug("Position changed");
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
            return;
        }// end function

        public function play(param1:Number = 0) : void
        {
            Log.debug("I was asked to play");
            if (this._nsStream)
            {
                this._position = param1;
                if (this._isLoaded)
                {
                    this.seek(this._position);
                    if (this._isPaused)
                    {
                        this.resume();
                    }
                }
                this.setState(PlayerEvents.PLAYING);
            }
            return;
        }// end function

        private function onStreamLength(param1:Object) : void
        {
            this._duration = (param1 as Number) * 1000;
            Log.debug("The stream length is " + this._duration + " in ms");
            dispatchEvent(new CustomEvent(PlayerEvents.DURATION, {duration:this._duration}));
            return;
        }// end function

        public function playpause() : Boolean
        {
            Log.debug("Play/Pause...");
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
            Log.debug("Stopping...");
            if (this._nsStream)
            {
                this._position = 0;
                this._duration = 0;
                this._nsStream.close();
                this._nsStream = null;
            }
            this.setState(PlayerEvents.STOPPED);
            return;
        }// end function

        public function pause() : void
        {
            Log.debug("Pausing...");
            if (this._nsStream)
            {
                this._nsStream.pause();
            }
            return;
        }// end function

        public function resume() : void
        {
            Log.debug("Resuming...");
            this._nsStream.resume();
            this._isPaused = false;
            this.isPlaying = true;
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
            Log.debug("Seeking at " + param1 / 1000);
            this._position = param1;
            if (this._nsStream)
            {
                this._nsStream.seek(param1 / 1000);
            }
            return;
        }// end function

        public function getDuration() : Number
        {
            if (this._nsStream !== null)
            {
                return this._duration;
            }
            return 0;
        }// end function

    }
}
