package com.spotify.bridge.models
{
    import flash.display.*;

    public class Config extends Object
    {
        public static var AUTH_URL:String = "";
        public static var LOGGING:Boolean = false;
        public static var INSTANCE_ID:String = "";
        public static var PLAYER_TYPE:String = "";
        public static var EVENT_CALLBACK:String = "event";
        public static var ERROR_CALLBACK:String = "";
        public static var CREDENTIALS:Credentials;
        public static var URL:String = "";
        public static var RTMP_SERVER:Array;
        private static var LENGTH:Number = 0;
        private static var _proxyType:String = "";
        private static var _allowDomain:String = "";

        public function Config()
        {
            return;
        }// end function

        public static function parse(param1:LoaderInfo) : void
        {
            URL = param1.url;
            CREDENTIALS = new Credentials();
            var _loc_2:* = param1.parameters;
            if (undefined !== _loc_2.length)
            {
            }
            if (_loc_2.length != 0)
            {
                LENGTH = _loc_2.length;
            }
            if (undefined !== _loc_2.eventCallback)
            {
                EVENT_CALLBACK = _loc_2.eventCallback;
            }
            if (undefined !== _loc_2.allowDomain)
            {
                _allowDomain = _loc_2.allowDomain;
            }
            if (undefined !== _loc_2.errorCallback)
            {
                ERROR_CALLBACK = _loc_2.errorCallback;
            }
            else
            {
                ERROR_CALLBACK = EVENT_CALLBACK;
            }
            if (undefined !== _loc_2.logging)
            {
                LOGGING = _loc_2.logging == 1;
            }
            if (undefined !== _loc_2.instanceId)
            {
                INSTANCE_ID = _loc_2.instanceId;
            }
            if (undefined !== _loc_2.rtmpServer)
            {
                RTMP_SERVER = _loc_2.rtmpServer.split("|");
            }
            if (undefined !== _loc_2.playerType)
            {
                PLAYER_TYPE = _loc_2.playerType;
            }
            if (undefined !== _loc_2.authUrl)
            {
                AUTH_URL = _loc_2.authUrl;
            }
            return;
        }// end function

        public static function setCredentials(param1:String) : void
        {
            if (CREDENTIALS)
            {
                CREDENTIALS.parseCredentials(param1);
            }
            return;
        }// end function

        public static function getProxyType() : String
        {
            return "best";
        }// end function

        public static function allowAllDomains() : Boolean
        {
            var _loc_1:* = new RegExp("http[s]?://.*.spotify.net", "i");
            var _loc_2:* = _loc_1.exec(URL);
            if (_loc_2)
            {
                return true;
            }
            return false;
        }// end function

    }
}
