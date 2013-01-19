package com.spotify.player.events
{

    public class PlayerEvents extends Object
    {
        public static const TRACK_ENDED:String = "TRACK_ENDED";
        public static const INVALID_TRACK_URI:String = "INVALID_TRACK_URI";
        public static const CANNOT_PLAY_TRACK:String = "CANNOT_PLAY_TRACK";
        public static const PLAYING:String = "PLAYING";
        public static const PAUSED:String = "PAUSED";
        public static const STOPPED:String = "STOPPED";
        public static const POSITION_CHANGED:String = "POSITION_CHANGED";
        public static const PLAYBACK_FAILED:String = "PLAYBACK_FAILED";
        public static const STREAM_LIMIT_REACHED:String = "STREAM_LIMIT_REACHED";
        public static const STREAM_INITIALIZED:String = "STREAM_INITIALIZED";
        public static const EMPTY_BUFFER:String = "EMPTY_BUFFER";
        public static const PLAYER_LOADED:String = "PLAYER_LOADED";
        public static const REGION_BLOCKED:String = "REGION_BLOCKED";
        public static const SONG_LOADED:String = "SONG_LOADED";
        public static const NO_SOUND_CAPABILITIES:String = "NO_SOUND_CAPABILITIES";
        public static const LOAD:String = "LOAD";
        public static const FIRST_BYTES:String = "FIRST_BYTES";
        public static const HTTP_PLAYER:String = "FLASH_HTTP";
        public static const AAC_PLAYER:String = "FLASH_AAC";
        public static const RTMPS_PLAYER:String = "FLASH_RTMPS";
        public static const DURATION:String = "DURATION";
        public static const SEEKING:String = "SEEKING";

        public function PlayerEvents()
        {
            return;
        }// end function

    }
}
