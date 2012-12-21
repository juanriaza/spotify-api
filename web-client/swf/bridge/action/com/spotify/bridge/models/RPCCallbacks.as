package com.spotify.bridge.models
{
    import com.spotify.utilities.*;

    public class RPCCallbacks extends Object
    {
        protected var _method:String;
        protected var _requestId:int;
        protected var _successEnum:String = "RPC_CALLBACK";
        protected var _errorCallbackEnum:String = "RPC_ERRBACK";

        public function RPCCallbacks(param1:String, param2:int)
        {
            this._method = param1;
            this._requestId = param2;
            return;
        }// end function

        public function onRPCSuccess(param1:Object) : void
        {
            JSInterface.notify(this._successEnum, {method:this._method, requestId:this._requestId, response:param1});
            return;
        }// end function

        public function onRPCError(param1:Object) : void
        {
            JSInterface.notify(this._errorCallbackEnum, {method:this._method, requestId:this._requestId, response:param1});
            return;
        }// end function

    }
}
