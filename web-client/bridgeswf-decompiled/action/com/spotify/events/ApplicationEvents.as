package com.spotify.events
{

    public class ApplicationEvents extends Object
    {
        public static const SECURITY_ERROR:String = "SECURITY_ERROR";
        public static const UNKNOWN_ERROR:String = "UNKNOWN_ERROR";
        public static const READY:String = "READY";
        public static const NOT_READY:String = "NOT_READY";
        public static const NOTICE:String = "NOTICE";
        public static const ERROR:String = "ERROR";

        public function ApplicationEvents()
        {
            return;
        }// end function

    }
}
