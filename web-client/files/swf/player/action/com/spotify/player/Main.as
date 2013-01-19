package com.spotify.player
{
    import com.spotify.bridge.models.*;
    import com.spotify.utilities.*;
    import flash.display.*;
    import flash.events.*;
    import flash.system.*;

    public class Main extends Sprite
    {
        private var _audioManager:AudioManager;

        public function Main()
        {
            Config.parse(loaderInfo);
            if (Config.LOGGING)
            {
                Log.register(new ConsoleLogger());
                Log.register(new MonsterDebuggerLogger());
            }
            this._audioManager = new AudioManager();
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
            this._audioManager.initialize();
            return;
        }// end function

    }
}
