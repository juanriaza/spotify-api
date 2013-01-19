package com.demonsters.debugger
{

    public class MonsterDebuggerPlugin extends Object
    {
        private var _id:String;

        public function MonsterDebuggerPlugin(param1:String)
        {
            _id = param1;
            return;
        }// end function

        protected function send(param1:Object) : void
        {
            MonsterDebugger.send(_id, param1);
            return;
        }// end function

        public function get id() : String
        {
            return _id;
        }// end function

        public function handle(param1:MonsterDebuggerData) : void
        {
            return;
        }// end function

    }
}
