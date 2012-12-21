package com.spotify.utilities
{

    public class Restrictions extends Object
    {
        private static var MAX_PACKET_SIZE:Number = 32768;

        public function Restrictions()
        {
            return;
        }// end function

        public static function isPacketSizeOk(param1:String) : Boolean
        {
            if (param1.length > MAX_PACKET_SIZE)
            {
                return false;
            }
            return true;
        }// end function

    }
}
