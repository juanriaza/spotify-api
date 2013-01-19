package com.spotify.bridge.models
{

    public class Credentials extends Object
    {
        private var _token:String;
        private var _type:Number;
        private var _payload:String;
        private var _signature:String;
        private var _message:String;
        public var credentials:Array;
        public static const CREDENTIALS_TYPE_TOKEN:Number = 3;

        public function Credentials()
        {
            this.credentials = new Array();
            return;
        }// end function

        public function parseCredentials(param1:String) : void
        {
            this.credentials = param1.split(":");
            if (parseInt(this.credentials[0], 10) > 200)
            {
                this._type = this.credentials.shift();
                this._signature = this.credentials.shift();
                this._message = this.credentials.join(":");
                this.credentials = [this._type, this._signature, this._message];
            }
            else
            {
                this._type = this.credentials[0];
                this._token = this.credentials[1];
            }
            return;
        }// end function

        public function get token() : String
        {
            return this._token;
        }// end function

        public function set token(param1:String) : void
        {
            this._token = param1;
            this.credentials[1] = this._token;
            return;
        }// end function

    }
}
