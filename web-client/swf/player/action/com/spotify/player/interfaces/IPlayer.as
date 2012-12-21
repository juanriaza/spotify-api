package com.spotify.player.interfaces
{

    public interface IPlayer
    {

        public function IPlayer();

        function initialize() : void;

        function load(param1:String, param2:Object = null) : void;

        function play(param1:Number = 0) : void;

        function playpause() : Boolean;

        function stop(param1:Boolean = false) : void;

        function pause() : void;

        function resume() : void;

        function time() : Number;

        function setVolume(param1:Number) : void;

        function getVolume() : Number;

        function seek(param1:Number) : void;

        function getDuration() : Number;

    }
}
