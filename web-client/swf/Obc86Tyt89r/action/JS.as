package 
{
    import flash.external.*;

    public class JS extends Object {

        public function JS() {
            return;
        }
        public static function call(... args) {
            args = String(args[0]);
            JS.validateName(args);
            args[0] = args;
            var _loc_3:* = 1;
            while (_loc_3 < args.length){
                
                args[_loc_3] = JS.sanitizeArg(args[_loc_3]);
                _loc_3 = _loc_3 + 1;
            }
            return ExternalInterface.call.apply(null, args);
        }
        private static function validateName(param1:String) {
            var _loc_4:* = null;
            param1 = String(param1);
            var _loc_2:* = param1.length;
            var _loc_3:* = 0;
            while (_loc_3 < _loc_2){
                
                _loc_4 = param1.charAt(_loc_3);
                if (_loc_4 >= "0" && _loc_4 <= "9" || _loc_4 >= "A" && _loc_4 <= "Z" || _loc_4 >= "a" && _loc_4 <= "z" || _loc_4 == "_" || _loc_4 == "."){
                }
                else{
                    throw new Error("invalid method name for JS call");
                }
                _loc_3 = _loc_3 + 1;
            }
            return;
        }
        private static function sanitizeArg(param1) {
            var _loc_2:* = null;
            var _loc_3:* = NaN;
            var _loc_4:* = null;
            var _loc_5:* = undefined;
            var _loc_6:* = undefined;
            var _loc_7:* = null;
            if (typeof(param1) == "string"){
                _loc_2 = "";
                do{
                    
                    _loc_2 = _loc_2 + param1.substr(0, _loc_3);
                    _loc_2 = _loc_2 + "\\\\";
                    param1 = param1.substr((_loc_3 + 1));
                    var _loc_8:* = param1.indexOf("\\");
                    _loc_3 = param1.indexOf("\\");
                }while (_loc_8 !== -1)
                return _loc_2 + param1;
            }
            else{
                if (typeof(param1) == "number"){
                    return param1;
                }
                if (typeof(param1) == "boolean"){
                    return param1;
                }
                if (typeof(param1) == "null"){
                    return param1;
                }
                if (param1 instanceof Array){
                    _loc_4 = new Array();
                    for (_loc_5 in param1){
                        
                        _loc_6 = param1[_loc_5];
                        if (typeof(_loc_6) == "undefined"){
                            continue;
                        }
                        JS.validateName(_loc_5);
                        _loc_4[_loc_5] = JS.sanitizeArg(_loc_6);
                    }
                    return _loc_4;
                }
                else{
                    if (param1 instanceof Object){
                        _loc_7 = new Object();
                        for (_loc_5 in param1){
                            
                            _loc_6 = param1[_loc_5];
                            if (typeof(_loc_6) == "undefined"){
                                continue;
                            }
                            JS.validateName(_loc_5);
                            _loc_7[_loc_5] = JS.sanitizeArg(_loc_6);
                        }
                        return _loc_7;
                    }
                    else{
                        return "thisisclowntown";
                    }
                }
            }
        }
    }
}
