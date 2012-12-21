package com.spotify.bridge.services
{
    import com.spotify.bridge.events.*;
    import com.spotify.bridge.models.*;
    import com.spotify.events.*;
    import com.spotify.utilities.*;
    import flash.events.*;
    import flash.net.*;

    public class RPC extends EventDispatcher
    {
        public var isConnected:Boolean = false;
        private var _connection:NetConnection;
        private var _client:Object;

        public function RPC() : void
        {
            this._client = new Object();
            this._connection = new NetConnection();
            this._connection.addEventListener(NetStatusEvent.NET_STATUS, this.onNetStatus, false, 0, true);
            this._connection.addEventListener(SecurityErrorEvent.SECURITY_ERROR, this.onSecurityError);
            this._connection.client = this._client;
            this._client.onCallClient = this.onCallClient;
            this.addEventListeners();
            return;
        }// end function

        public function initialize() : void
        {
            this.registerAllCallbacks();
            return;
        }// end function

        private function registerAllCallbacks() : void
        {
            try
            {
                JSInterface.registerCallback("sp_rpc", this.call);
                JSInterface.registerCallback("sp_connect", this.connect);
                JSInterface.registerCallback("sp_disconnect", this.disconnect);
                JSInterface.notify(ApplicationEvents.READY, null, 0);
            }
            catch (error:SecurityError)
            {
                Log.debug("Security error with the JS interface");
                JSInterface.notify(ApplicationEvents.SECURITY_ERROR);
                ;
            }
            catch (error:Error)
            {
                Log.debug("Unknown error with the JS interface");
                JSInterface.notify(ApplicationEvents.UNKNOWN_ERROR);
            }
            return;
        }// end function

        private function addEventListeners() : void
        {
            this.addEventListener(RPCEvents.CONNECTION_CLOSED, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.CONNECTION_ESTABLISHED, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.INVALID_CREDENTIALS, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.FAILED_CONNECTING, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.REAUTHORIZE_SUCCESS, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.REAUTHORIZE_FAILED, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.TOKEN_LOST, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.HERMES_B64_MESSAGE, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.USER_INFO_CHANGE, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.WORK, this.onRPCEvent, false, 0, true);
            this.addEventListener(RPCEvents.LOGIN_COMPLETE, this.onRPCEvent, false, 0, true);
            return;
        }// end function

        private function onRPCEvent(param1) : void
        {
            if (param1.type === RPCEvents.TOKEN_LOST)
            {
                JSInterface.notify(param1.type, null, 0);
            }
            else
            {
                if (param1.type !== RPCEvents.WORK)
                {
                }
                if (param1.type === RPCEvents.LOGIN_COMPLETE)
                {
                    JSInterface.notify(param1.type, param1.params.eval, 0);
                }
                else if (param1.type === RPCEvents.HERMES_B64_MESSAGE)
                {
                    JSInterface.notify(RPCEvents.HERMES_B64_MESSAGE, param1.params.args, 0);
                }
                else
                {
                    if (param1.type !== RPCEvents.CONNECTION_CLOSED)
                    {
                    }
                    if (param1.type === RPCEvents.FAILED_CONNECTING)
                    {
                        JSInterface.notify(RPCEvents.FAILED_CONNECTING, null, 0);
                    }
                    else
                    {
                        JSInterface.notify(param1.type, null, 0);
                    }
                }
            }
            return;
        }// end function

        public function connect(param1:String = null, param2:String = "") : void
        {
            if (param1 !== null)
            {
                Config.CREDENTIALS.parseCredentials(param1);
            }
            Log.debug("[Flash] RPC trying to connect to " + param2 + " with " + Config.CREDENTIALS.credentials.join(":"));
            if (!this.isConnected)
            {
                this._connection.proxyType = Config.getProxyType();
                this._connection.connect.apply(this._connection, [param2].concat(Config.CREDENTIALS.credentials));
            }
            return;
        }// end function

        public function disconnect() : void
        {
            Log.debug("RPC disconnect...");
            try
            {
                if (this.isConnected)
                {
                    this._connection.close();
                    this.isConnected = false;
                }
            }
            catch (error:Error)
            {
                Log.debug("Problem with disconnecting");
            }
            return;
        }// end function

        public function call(param1:String, param2:int, ... args) : void
        {
            var _loc_6:* = null;
            args = new RPCCallbacks(param1, param2);
            var _loc_5:* = new Object();
            _loc_5._ = [].concat(args);
            if (Restrictions.isPacketSizeOk(JSON.stringify(_loc_5)))
            {
                _loc_6 = ["sp/" + param1, new Responder(args.onRPCSuccess, args.onRPCError)].concat(args);
                this._connection.call.apply(this._connection, _loc_6);
            }
            else
            {
                args.onRPCError([16, 1, RPCEvents.PACKET_SIZE_EXCEEDED]);
            }
            return;
        }// end function

        private function onSecurityError(event:SecurityErrorEvent) : void
        {
            Log.debug("RPC Security Error");
            return;
        }// end function

        private function onNetStatus(event:NetStatusEvent) : void
        {
            Log.debug("Net Status: " + event.info.code);
            switch(event.info.code)
            {
                case "NetConnection.Connect.Success":
                {
                    this.isConnected = true;
                    dispatchEvent(new Event(RPCEvents.CONNECTION_ESTABLISHED));
                    break;
                }
                case "NetConnection.Connect.Failed":
                {
                    this.isConnected = false;
                    switch(event.info.description)
                    {
                        case "Invalid user":
                        {
                            dispatchEvent(new Event(RPCEvents.INVALID_CREDENTIALS));
                            break;
                        }
                        default:
                        {
                            dispatchEvent(new Event(RPCEvents.FAILED_CONNECTING));
                            break;
                            break;
                        }
                    }
                    break;
                }
                case "NetConnection.Connect.Closed":
                {
                    this.isConnected = false;
                    dispatchEvent(new Event(RPCEvents.CONNECTION_CLOSED));
                    break;
                }
                default:
                {
                    break;
                    break;
                }
            }
            return;
        }// end function

        private function onCallClient(... args) : int
        {
            args = null;
            var _loc_3:* = "";
            if (args[0])
            {
                args = args[0];
            }
            if (args[1])
            {
                _loc_3 = args[1];
            }
            if (args === "hm_b64")
            {
                dispatchEvent(new CustomEvent(RPCEvents.HERMES_B64_MESSAGE, {args:args}));
            }
            if (args === "token_lost")
            {
                dispatchEvent(new Event(RPCEvents.TOKEN_LOST));
            }
            if (args === "do_work")
            {
                dispatchEvent(new CustomEvent(RPCEvents.WORK, {eval:_loc_3}));
            }
            if (args === "login_complete")
            {
                dispatchEvent(new CustomEvent(RPCEvents.LOGIN_COMPLETE, {eval:0}));
            }
            if (args === "time_out")
            {
                dispatchEvent(new Event(RPCEvents.TIMEOUT));
            }
            if (args === "user_info_change")
            {
                dispatchEvent(new Event(RPCEvents.USER_INFO_CHANGE));
            }
            return 0;
        }// end function

        public function get connection() : NetConnection
        {
            return this._connection;
        }// end function

    }
}
