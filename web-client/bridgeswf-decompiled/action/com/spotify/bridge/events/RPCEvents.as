package com.spotify.bridge.events
{

    public class RPCEvents extends Object
    {
        public static const INVALID_CREDENTIALS:String = "INVALID_CREDENTIALS";
        public static const FAILED_CONNECTING:String = "FAILED_CONNECTING";
        public static const CONNECTION_ESTABLISHED:String = "CONNECTION_ESTABLISHED";
        public static const CONNECTION_CLOSED:String = "CONNECTION_CLOSED";
        public static const ACCOUNT_IN_USE:String = "ACCOUNT_IN_USE";
        public static const RPC_CALLBACK:String = "RPC_CALLBACK";
        public static const RPC_ERRBACK:String = "RPC_ERRBACK";
        public static const REAUTHORIZE_SUCCESS:String = "REAUTHORIZE_SUCCESS";
        public static const REAUTHORIZE_FAILED:String = "REAUTHORIZE_FAILED";
        public static const TOKEN_LOST:String = "TOKEN_LOST";
        public static const WORK:String = "WORK";
        public static const HERMES_B64_MESSAGE:String = "HERMES_B64_MESSAGE";
        public static const LOGIN_COMPLETE:String = "LOGIN_COMPLETE";
        public static const TIMEOUT:String = "TIMEOUT";
        public static const PACKET_SIZE_EXCEEDED:String = "PACKET_SIZE_EXCEEDED";
        public static const USER_INFO_CHANGE:String = "USER_INFO_CHANGE";
        public static const TOKEN_ACQUIRED:String = "TOKEN_ACQUIRED";
        public static const TOKEN_NOT_ACQUIRED:String = "TOKEN_NOT_ACQUIRED";

        public function RPCEvents()
        {
            return;
        }// end function

    }
}
