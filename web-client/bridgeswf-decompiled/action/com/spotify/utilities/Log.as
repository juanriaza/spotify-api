package com.spotify.utilities
{
    import com.spotify.interfaces.*;

    public class Log extends Object
    {
        private static var loggers:Array = [];

        public function Log()
        {
            return;
        }// end function

        public static function register(param1:ILogger) : void
        {
            loggers.push(param1);
            return;
        }// end function

        public static function debug(param1) : void
        {
            var _loc_2:* = null;
            for each (_loc_2 in loggers)
            {
                
                _loc_2.trace(param1);
            }
            return;
        }// end function

    }
}
