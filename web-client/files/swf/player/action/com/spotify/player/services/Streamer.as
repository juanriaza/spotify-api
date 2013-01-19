package com.spotify.player.services
{
    import com.spotify.utilities.*;
    import flash.events.*;
    import flash.net.*;
    import flash.utils.*;

    public class Streamer extends EventDispatcher
    {
        public var isConnected:Boolean = false;
        public var server:String = "";
        private var _nc:NetConnection;
        private var _timer:Timer;

        public function Streamer(param1:String)
        {
            this._timer = new Timer(5000);
            Log.debug("Streamer will try to connect...");
            this.server = param1;
            this._timer.addEventListener(TimerEvent.TIMER, this.onTick, false, 0, true);
            this._nc = new NetConnection();
            this._nc.client = this;
            this._nc.addEventListener(NetStatusEvent.NET_STATUS, this.netStatusHandler);
            this._nc.addEventListener(SecurityErrorEvent.SECURITY_ERROR, this.securityErrorHandler);
            this._nc.addEventListener(AsyncErrorEvent.ASYNC_ERROR, this.onAsyncError);
            this.connect();
            return;
        }// end function

        public function connect() : void
        {
            if (!this.isConnected)
            {
                this._nc.connect(this.server);
            }
            return;
        }// end function

        public function getNetConnection() : NetConnection
        {
            return this._nc;
        }// end function

        public function onBWDone() : void
        {
            return;
        }// end function

        private function securityErrorHandler(event:SecurityErrorEvent) : void
        {
            this.isConnected = false;
            Log.debug("Security Error Handler...");
            return;
        }// end function

        private function netStatusHandler(event:NetStatusEvent) : void
        {
            Log.debug("Streamer Net Status: " + event.info.code);
            switch(event.info.code)
            {
                case "NetConnection.Connect.Success":
                {
                    this.isConnected = true;
                    this._timer.stop();
                    this._timer.reset();
                    dispatchEvent(new Event(Event.CONNECT));
                    break;
                }
                case "NetConnection.Connect.Closed":
                {
                    this.isConnected = false;
                    this._timer.stop();
                    this._timer.reset();
                    this._timer.start();
                    dispatchEvent(new Event(Event.CLOSE));
                }
                default:
                {
                    break;
                    break;
                }
            }
            return;
        }// end function

        private function onTick(event:TimerEvent) : void
        {
            Log.debug("Streamer trying to connect...");
            this.connect();
            return;
        }// end function

        private function onAsyncError(event:AsyncErrorEvent) : void
        {
            Log.debug("Async Error " + event.error);
            return;
        }// end function

    }
}
