package com.demonsters.debugger
{

    class MonsterDebuggerConnection extends Object
    {
        private static var connector:IMonsterDebuggerConnection;

        function MonsterDebuggerConnection()
        {
            return;
        }// end function

        static function initialize() : void
        {
            connector = new MonsterDebuggerConnectionDefault();
            return;
        }// end function

        static function processQueue() : void
        {
            connector.com.demonsters.debugger:IMonsterDebuggerConnection::processQueue();
            return;
        }// end function

        static function set onConnect(param1:Function) : void
        {
            connector.com.demonsters.debugger:IMonsterDebuggerConnection::onConnect = param1;
            return;
        }// end function

        static function set address(param1:String) : void
        {
            connector.com.demonsters.debugger:IMonsterDebuggerConnection::address = param1;
            return;
        }// end function

        static function get connected() : Boolean
        {
            return connector.com.demonsters.debugger:IMonsterDebuggerConnection::connected;
        }// end function

        static function connect() : void
        {
            connector.com.demonsters.debugger:IMonsterDebuggerConnection::connect();
            return;
        }// end function

        static function send(param1:String, param2:Object, param3:Boolean = false) : void
        {
            connector.com.demonsters.debugger:IMonsterDebuggerConnection::send(param1, param2, param3);
            return;
        }// end function

    }
}
