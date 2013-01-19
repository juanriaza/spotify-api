package com.demonsters.debugger
{
    import flash.utils.*;

    class MonsterDebuggerDescribeType extends Object
    {
        private static var cache:Object = {};

        function MonsterDebuggerDescribeType()
        {
            return;
        }// end function

        static function get(param1) : XML
        {
            var _loc_2:* = getQualifiedClassName(param1);
            if (_loc_2 in cache)
            {
                return cache[_loc_2];
            }
            var _loc_3:* = describeType(param1);
            cache[_loc_2] = _loc_3;
            return _loc_3;
        }// end function

    }
}
