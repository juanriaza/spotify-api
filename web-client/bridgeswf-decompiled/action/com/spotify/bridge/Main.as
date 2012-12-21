package com.spotify.bridge
{
    import com.spotify.bridge.models.*;
    import com.spotify.bridge.services.*;
    import com.spotify.utilities.*;
    import flash.display.*;
    import flash.events.*;
    import flash.system.*;

    public class Main extends Sprite
    {
        private var _rpc:RPC;

        public function Main()
        {
            Config.parse(loaderInfo);
            if (Config.LOGGING)
            {
                Log.register(new ConsoleLogger());
                Log.register(new MonsterDebuggerLogger());
            }
            this._rpc = new RPC();
            if (Config.allowAllDomains())
            {
                Security.allowDomain("*");
            }
            else
            {
                Security.allowDomain("play.spotify.com", "link.spotify.com");
            }
            this.addEventListeners();
            return;
        }// end function

        private function addEventListeners() : void
        {
            addEventListener(Event.ADDED, this.onLoad);
            return;
        }// end function

        private function onLoad(event:Event) : void
        {
            this._rpc.initialize();
            return;
        }// end function

    }
}
