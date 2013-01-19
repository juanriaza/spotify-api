package com.spotify.utilities
{
    import flash.external.*;

    public class ConsoleLogger extends Object implements ILogger
    {

        public function ConsoleLogger()
        {
            return;
        }// end function

        public function trace(param1) : void
        {
            if (ExternalInterface.available)
            {
                ExternalInterface.call("console.log", param1);
            }
            return;
        }// end function

    }
}
