package com.spotify.utilities
{
    import com.spotify.bridge.models.*;
    import flash.external.*;

    public class JSInterface extends Object
    {

        public function JSInterface()
        {
            return;
        }// end function

        public static function notify(param1:String, param2 = null, param3:Number = 0, param4:String = "") : void
        {
            var eventType:* = param1;
            var values:* = param2;
            var target:* = param3;
            var id:* = param4;
            Log.debug("[FLASH] External call: " + eventType);
            if (ExternalInterface.available)
            {
                try
                {
                    if (target == 0)
                    {
                        ExternalInterface.call("Spotify.Instances.get(\'" + Config.INSTANCE_ID + "\')._bridge.trigger", eventType, values);
                    }
                    else if (target == 1)
                    {
                        ExternalInterface.call("Spotify.Instances.get(\'" + Config.INSTANCE_ID + "\').audioManager.getInterface().trigger", eventType, values);
                    }
                    else if (target == 2)
                    {
                        ExternalInterface.call("Spotify.Instances.get(\'" + Config.INSTANCE_ID + "\').audioManager.getPlayerById(\'" + id + "\').trigger", eventType, values, id);
                    }
                }
                catch (error:Error)
                {
                    Log.debug("External interface error " + error.message);
                }
            }
            return;
        }// end function

        public static function registerCallback(param1:String, param2:Function) : void
        {
            var functionName:* = param1;
            var callback:* = param2;
            if (ExternalInterface.available)
            {
                try
                {
                    ExternalInterface.addCallback(functionName, callback);
                }
                catch (error:Error)
                {
                    Log.debug("External interface not available " + error.message);
                }
            }
            return;
        }// end function

    }
}
