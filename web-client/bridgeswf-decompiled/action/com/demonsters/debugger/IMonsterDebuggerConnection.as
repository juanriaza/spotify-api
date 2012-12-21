﻿package com.demonsters.debugger
{

    interface IMonsterDebuggerConnection
    {

        function IMonsterDebuggerConnection();

        function processQueue() : void;

        function set onConnect(param1:Function) : void;

        function set address(param1:String) : void;

        function get connected() : Boolean;

        function connect() : void;

        function send(param1:String, param2:Object, param3:Boolean = false) : void;

    }
}
