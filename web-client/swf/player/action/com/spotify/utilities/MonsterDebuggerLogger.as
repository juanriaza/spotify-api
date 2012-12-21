package com.spotify.utilities
{
    import com.demonsters.debugger.*;

    public class MonsterDebuggerLogger extends Object implements ILogger
    {

        public function MonsterDebuggerLogger()
        {
            MonsterDebugger.initialize(this);
            return;
        }// end function

        public function trace(param1) : void
        {
            MonsterDebugger.trace(this, param1);
            return;
        }// end function

    }
}
