package com.demonsters.debugger
{
    import flash.display.*;

    public class MonsterDebugger extends Object
    {
        private static var _enabled:Boolean = true;
        private static var _initialized:Boolean = false;
        public static var logger:Function;
        static const VERSION:Number = 3.01;

        public function MonsterDebugger()
        {
            return;
        }// end function

        public static function get enabled() : Boolean
        {
            return _enabled;
        }// end function

        public static function trace(param1, param2, param3:String = "", param4:String = "", param5:uint = 0, param6:int = 5) : void
        {
            if (_initialized)
            {
            }
            if (_enabled)
            {
                MonsterDebuggerCore.trace(param1, param2, param3, param4, param5, param6);
            }
            return;
        }// end function

        static function send(param1:String, param2:Object) : void
        {
            if (_initialized)
            {
            }
            if (_enabled)
            {
                MonsterDebuggerConnection.send(param1, param2, false);
            }
            return;
        }// end function

        public static function log(... args) : void
        {
            args = new activation;
            var target:String;
            var stack:String;
            var lines:Array;
            var s:String;
            var bracketIndex:int;
            var methodIndex:int;
            var args:* = args;
            if (_initialized)
            {
            }
            if (_enabled)
            {
                if (length == 0)
                {
                    return;
                }
                target;
                try
                {
                    throw new Error();
                }
                catch (e:Error)
                {
                    stack = e.getStackTrace();
                    if (e != null)
                    {
                    }
                    if (e != "")
                    {
                        stack = e.split("\t").join("");
                        lines = e.split("\n");
                        if (e.length > 2)
                        {
                            e.shift();
                            e.shift();
                            s = e[0];
                            s = e.substring(3, e.length);
                            bracketIndex = e.indexOf("[");
                            methodIndex = e.indexOf("/");
                            if (e == -1)
                            {
                                bracketIndex = e.length;
                            }
                            if (e == -1)
                            {
                                methodIndex = e;
                            }
                            target = MonsterDebuggerUtils.parseType(e.substring(0, e));
                            if (e == "<anonymous>")
                            {
                                target;
                            }
                            if (e == "")
                            {
                                target;
                            }
                        }
                    }
                }
                if (length == 1)
                {
                    MonsterDebuggerCore.trace(, [0], "", "", 0, 5);
                }
                else
                {
                    MonsterDebuggerCore.trace(, , "", "", 0, 5);
                }
            }
            return;
        }// end function

        public static function clear() : void
        {
            if (_initialized)
            {
            }
            if (_enabled)
            {
                MonsterDebuggerCore.clear();
            }
            return;
        }// end function

        public static function unregisterPlugin(param1:String) : void
        {
            if (_initialized)
            {
                MonsterDebuggerCore.unregisterPlugin(param1);
            }
            return;
        }// end function

        public static function set enabled(param1:Boolean) : void
        {
            _enabled = param1;
            return;
        }// end function

        public static function snapshot(param1, param2:DisplayObject, param3:String = "", param4:String = "") : void
        {
            if (_initialized)
            {
            }
            if (_enabled)
            {
                MonsterDebuggerCore.snapshot(param1, param2, param3, param4);
            }
            return;
        }// end function

        public static function inspect(param1) : void
        {
            if (_initialized)
            {
            }
            if (_enabled)
            {
                MonsterDebuggerCore.inspect(param1);
            }
            return;
        }// end function

        public static function registerPlugin(param1:Class) : void
        {
            var _loc_2:* = null;
            if (_initialized)
            {
                _loc_2 = new param1;
                MonsterDebuggerCore.registerPlugin(_loc_2.id, _loc_2);
            }
            return;
        }// end function

        public static function hasPlugin(param1:String) : Boolean
        {
            if (_initialized)
            {
                return MonsterDebuggerCore.hasPlugin(param1);
            }
            return false;
        }// end function

        public static function breakpoint(param1, param2:String = "breakpoint") : void
        {
            if (_initialized)
            {
            }
            if (_enabled)
            {
                MonsterDebuggerCore.breakpoint(param1, param2);
            }
            return;
        }// end function

        public static function initialize(param1:Object, param2:String = "127.0.0.1", param3:Function = null) : void
        {
            if (!_initialized)
            {
                _initialized = true;
                MonsterDebuggerCore.base = param1;
                MonsterDebuggerCore.initialize();
                MonsterDebuggerConnection.initialize();
                MonsterDebuggerConnection.address = param2;
                MonsterDebuggerConnection.onConnect = param3;
                MonsterDebuggerConnection.connect();
            }
            return;
        }// end function

    }
}
