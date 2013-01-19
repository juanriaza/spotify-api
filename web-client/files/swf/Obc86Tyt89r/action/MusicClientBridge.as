package 
{
    import flash.display.*;
    import flash.events.*;
    import flash.external.*;
    import flash.net.*;
    import flash.system.*;

    public class MusicClientBridge extends Sprite {
        private var appID:String;
        private var domainValidated:Boolean;
        private var client:String;
        private var serverLcNames:Object;
        private var connection:LocalConnection;
        private var provider:String;
        private static const STATUS:Object = {READY:"BRIDGE_READY", SEND_ERROR:"SEND_ERROR", ALREADY_CONNECTED:"ALREADY_CONNECTED", DEBUG_LOG:"DEBUG_LOG", ERROR_LOG:"ERROR_LOG"};
        private static const ALREADY_CONNECTED_ERROR_ID:Number = 2082;
        private static const JS_CALLBACK:String = "FB.Music.flashCallback";

        public function MusicClientBridge() {
            var params:* = this.root.loaderInfo.parameters;
            this.appID = params["app_id"];
            this.provider = params["domain"] != "*" ? (params["domain"]) : ("invalid");
            Security.allowDomain(this.provider);
            Security.allowInsecureDomain(this.provider);
            this.debugLog("constructing MusicClientBridge v0.1.3 @ " + this.provider);
            try{
                this.client = this.provider + "_client";
                this.serverLcNames = {};
                this.connection = new LocalConnection();
                this.connection.isPerUser = true;
                this.connection.client = this;
                this.connection.addEventListener(SecurityErrorEvent.SECURITY_ERROR, this.onSecurityError);
                this.connection.addEventListener(StatusEvent.STATUS, this.onStatusEvent);
                this.connection.connect(this.client);
                this.debugLog("app_id: " + this.appID + ", connection_name: " + this.client);
                ExternalInterface.addCallback("validate", this.validate);
                JS.call(JS_CALLBACK, STATUS.READY);
            }
            catch (e){
                errorLog("constructor", e.toString());
                if (e.errorID === e.ALREADY_CONNECTED_ERROR_ID){
                    JS.call(e.JS_CALLBACK, e.STATUS.ALREADY_CONNECTED);
                }
            }
            return;
        }
        private function onSecurityError(event:SecurityErrorEvent) : void {
            this.errorLog("Security Error", event.toString());
            return;
        }
        private function onStatusEvent(event:StatusEvent) : void {
            if (event.level == "error"){
                this.errorLog("Send Status", event.toString());
            }
            return;
        }
        public function receive(param1:String, param2:Object) : void {
            var _loc_3:* = param2.serverlc;
            this.debugLog("received " + param1 + " request from server bridge " + _loc_3);
            if (!this.serverLcNames[_loc_3]){
                this.serverLcNames[_loc_3] = 1;
            }
            if (!this.domainValidated){
                this.debugLog("domain not yet validated");
                return;
            }
            JS.call(JS_CALLBACK, param1, param2);
            return;
        }
        public function validate() : void {
            this.debugLog(this.provider + " validated as domain");
            this.domainValidated = true;
            ExternalInterface.addCallback("send", this.send);
            return;
        }
        public function send(param1:String, param2:Object) : void {
            var sent_something:Boolean;
            var server:String;
            var op:* = param1;
            var msg:* = param2;
            this.debugLog("client called send with OP: " + op);
            try{
                sent_something;
                var _loc_4:* = 0;
                var _loc_5:* = this.serverLcNames;
                while (_loc_5 in _loc_4){
                    
                    server = _loc_5[_loc_4];
                    sent_something;
                    this.debugLog("sending " + op + " to server bridge " + server);
                    this.connection.send(server, "status", op, msg, this.appID);
                }
                if (!sent_something){
                    this.errorLog("send", "called without any LC targets");
                }
            }
            catch (e){
                errorLog("send", e.toString());
            }
            return;
        }
        private function debugLog(param1:String) : void {
            JS.call(JS_CALLBACK, STATUS.DEBUG_LOG, {msg:param1});
            return;
        }
        private function errorLog(param1:String, param2:String) : void {
            JS.call(JS_CALLBACK, STATUS.ERROR_LOG, {msg:param1 + ": " + param2});
            return;
        }
    }
}
