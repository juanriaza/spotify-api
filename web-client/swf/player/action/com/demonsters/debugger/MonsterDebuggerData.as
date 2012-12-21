package com.demonsters.debugger
{
    import flash.utils.*;

    public class MonsterDebuggerData extends Object
    {
        private var _data:Object;
        private var _id:String;

        public function MonsterDebuggerData(param1:String, param2:Object)
        {
            _id = param1;
            _data = param2;
            return;
        }// end function

        public function get data() : Object
        {
            return _data;
        }// end function

        public function set bytes(param1:ByteArray) : void
        {
            var value:* = param1;
            var bytesId:* = new ByteArray();
            var bytesData:* = new ByteArray();
            try
            {
                value.readBytes(bytesId, 0, value.readUnsignedInt());
                value.readBytes(bytesData, 0, value.readUnsignedInt());
                _id = bytesId.readObject() as String;
                _data = bytesData.readObject() as Object;
            }
            catch (e:Error)
            {
                _id = null;
                _data = null;
            }
            bytesId;
            bytesData;
            return;
        }// end function

        public function get id() : String
        {
            return _id;
        }// end function

        public function get bytes() : ByteArray
        {
            var _loc_1:* = new ByteArray();
            var _loc_2:* = new ByteArray();
            _loc_1.writeObject(_id);
            _loc_2.writeObject(_data);
            var _loc_3:* = new ByteArray();
            _loc_3.writeUnsignedInt(_loc_1.length);
            _loc_3.writeBytes(_loc_1);
            _loc_3.writeUnsignedInt(_loc_2.length);
            _loc_3.writeBytes(_loc_2);
            _loc_3.position = 0;
            _loc_1 = null;
            _loc_2 = null;
            return _loc_3;
        }// end function

        public static function read(param1:ByteArray) : MonsterDebuggerData
        {
            var _loc_2:* = new MonsterDebuggerData(null, null);
            _loc_2.bytes = param1;
            return _loc_2;
        }// end function

    }
}
