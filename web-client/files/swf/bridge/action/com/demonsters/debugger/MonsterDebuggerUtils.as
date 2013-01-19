package com.demonsters.debugger
{
    import flash.display.*;
    import flash.geom.*;
    import flash.system.*;
    import flash.utils.*;

    class MonsterDebuggerUtils extends Object
    {
        private static var _references:Dictionary = new Dictionary(true);
        private static var _reference:int = 0;

        function MonsterDebuggerUtils()
        {
            return;
        }// end function

        public static function snapshot(param1:DisplayObject, param2:Rectangle = null) : BitmapData
        {
            var m:Matrix;
            var scaled:Rectangle;
            var s:Number;
            var b:BitmapData;
            var object:* = param1;
            var rectangle:* = param2;
            if (object == null)
            {
                return null;
            }
            var visible:* = object.visible;
            var alpha:* = object.alpha;
            var rotation:* = object.rotation;
            var scaleX:* = object.scaleX;
            var scaleY:* = object.scaleY;
            try
            {
                object.visible = true;
                object.alpha = 1;
                object.rotation = 0;
                object.scaleX = 1;
                object.scaleY = 1;
            }
            catch (e1:Error)
            {
            }
            var bounds:* = object.getBounds(object);
            bounds.x = int(bounds.x + 0.5);
            bounds.y = int(bounds.y + 0.5);
            bounds.width = int(bounds.width + 0.5);
            bounds.height = int(bounds.height + 0.5);
            if (object is Stage)
            {
                bounds.x = 0;
                bounds.y = 0;
                bounds.width = Stage(object).stageWidth;
                bounds.height = Stage(object).stageHeight;
            }
            var bitmapData:BitmapData;
            if (bounds.width > 0)
            {
            }
            if (bounds.height <= 0)
            {
                return null;
            }
            bitmapData = new BitmapData(bounds.width, bounds.height, false, 16777215);
            m = new Matrix();
            m.tx = -bounds.x;
            m.ty = -bounds.y;
            bitmapData.draw(object, m, null, null, null, false);
            try
            {
                object.visible = visible;
                object.alpha = alpha;
                object.rotation = rotation;
                object.scaleX = scaleX;
                object.scaleY = scaleY;
            }
            catch (e2:Error)
            {
            }
            if (rectangle != null)
            {
                if (bounds.width <= rectangle.width)
                {
                }
                if (bounds.height <= rectangle.height)
                {
                    return bitmapData;
                }
                scaled = bounds.clone();
                scaled.width = rectangle.width;
                scaled.height = rectangle.width * (bounds.height / bounds.width);
                if (scaled.height > rectangle.height)
                {
                    scaled = bounds.clone();
                    scaled.width = rectangle.height * (bounds.width / bounds.height);
                    scaled.height = rectangle.height;
                }
                s = scaled.width / bounds.width;
                b = new BitmapData(scaled.width, scaled.height, false, 0);
                m = new Matrix();
                m.scale(s, s);
                b.draw(bitmapData, m, null, null, null, true);
                return b;
            }
            return bitmapData;
        }// end function

        private static function parseClass(param1, param2:String, param3:XML, param4:int = 1, param5:int = 5, param6:Boolean = true) : XML
        {
            var key:String;
            var itemsArrayLength:int;
            var item:*;
            var itemXML:XML;
            var itemAccess:String;
            var itemPermission:String;
            var itemIcon:String;
            var itemType:String;
            var itemName:String;
            var itemTarget:String;
            var isXMLString:XML;
            var i:int;
            var prop:*;
            var displayObject:DisplayObjectContainer;
            var displayObjects:Array;
            var child:DisplayObject;
            var object:* = param1;
            var target:* = param2;
            var description:* = param3;
            var currentDepth:* = param4;
            var maxDepth:* = param5;
            var includeDisplayObjects:* = param6;
            var rootXML:* = new XML("<root/>");
            var nodeXML:* = new XML("<node/>");
            var variables:* = description..variable;
            var accessors:* = description..accessor;
            var constants:* = description..constant;
            var isDynamic:* = description.@isDynamic;
            var variablesLength:* = variables.length();
            var accessorsLength:* = accessors.length();
            var constantsLength:* = constants.length();
            var childLength:int;
            var keys:Object;
            var itemsArray:Array;
            var isXML:Boolean;
            if (isDynamic)
            {
                var _loc_8:* = 0;
                var _loc_9:* = object;
                while (_loc_9 in _loc_8)
                {
                    
                    prop = _loc_9[_loc_8];
                    key = String(prop);
                    if (!keys.hasOwnProperty(key))
                    {
                        keys[key] = key;
                        itemName = key;
                        itemType = parseType(getQualifiedClassName(object[key]));
                        itemTarget = target + "." + key;
                        itemAccess = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        itemPermission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        itemIcon = MonsterDebuggerConstants.ICON_VARIABLE;
                        itemsArray[itemsArray.length] = {name:itemName, type:itemType, target:itemTarget, access:itemAccess, permission:itemPermission, icon:itemIcon};
                    }
                }
            }
            i;
            while (i < variablesLength)
            {
                
                key = variables[i].@name;
                if (!keys.hasOwnProperty(key))
                {
                    keys[key] = key;
                    itemName = key;
                    itemType = parseType(variables[i].@type);
                    itemTarget = target + "." + key;
                    itemAccess = MonsterDebuggerConstants.ACCESS_VARIABLE;
                    itemPermission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                    itemIcon = MonsterDebuggerConstants.ICON_VARIABLE;
                    itemsArray[itemsArray.length] = {name:itemName, type:itemType, target:itemTarget, access:itemAccess, permission:itemPermission, icon:itemIcon};
                }
                i = (i + 1);
            }
            i;
            while (i < accessorsLength)
            {
                
                key = accessors[i].@name;
                if (!keys.hasOwnProperty(key))
                {
                    keys[key] = key;
                    itemName = key;
                    itemType = parseType(accessors[i].@type);
                    itemTarget = target + "." + key;
                    itemAccess = MonsterDebuggerConstants.ACCESS_ACCESSOR;
                    itemPermission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                    itemIcon = MonsterDebuggerConstants.ICON_VARIABLE;
                    if (accessors[i].@access == MonsterDebuggerConstants.PERMISSION_READONLY)
                    {
                        itemPermission = MonsterDebuggerConstants.PERMISSION_READONLY;
                        itemIcon = MonsterDebuggerConstants.ICON_VARIABLE_READONLY;
                    }
                    if (accessors[i].@access == MonsterDebuggerConstants.PERMISSION_WRITEONLY)
                    {
                        itemPermission = MonsterDebuggerConstants.PERMISSION_WRITEONLY;
                        itemIcon = MonsterDebuggerConstants.ICON_VARIABLE_WRITEONLY;
                    }
                    itemsArray[itemsArray.length] = {name:itemName, type:itemType, target:itemTarget, access:itemAccess, permission:itemPermission, icon:itemIcon};
                }
                i = (i + 1);
            }
            i;
            while (i < constantsLength)
            {
                
                key = constants[i].@name;
                if (!keys.hasOwnProperty(key))
                {
                    keys[key] = key;
                    itemName = key;
                    itemType = parseType(constants[i].@type);
                    itemTarget = target + "." + key;
                    itemAccess = MonsterDebuggerConstants.ACCESS_CONSTANT;
                    itemPermission = MonsterDebuggerConstants.PERMISSION_READONLY;
                    itemIcon = MonsterDebuggerConstants.ICON_VARIABLE_READONLY;
                    itemsArray[itemsArray.length] = {name:itemName, type:itemType, target:itemTarget, access:itemAccess, permission:itemPermission, icon:itemIcon};
                }
                i = (i + 1);
            }
            itemsArray.sortOn("name", Array.CASEINSENSITIVE);
            if (includeDisplayObjects)
            {
            }
            if (object is DisplayObjectContainer)
            {
                displayObject = DisplayObjectContainer(object);
                displayObjects;
                childLength = displayObject.numChildren;
                i;
                while (i < childLength)
                {
                    
                    child;
                    try
                    {
                        child = displayObject.getChildAt(i);
                    }
                    catch (e1:Error)
                    {
                    }
                    if (child != null)
                    {
                        itemXML = MonsterDebuggerDescribeType.get(child);
                        itemType = parseType(itemXML.@name);
                        itemName;
                        if (child.name != null)
                        {
                            itemName = itemName + (" - " + child.name);
                        }
                        itemTarget = target + "." + "getChildAt(" + i + ")";
                        itemAccess = MonsterDebuggerConstants.ACCESS_DISPLAY_OBJECT;
                        itemPermission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        itemIcon = child is DisplayObjectContainer ? (MonsterDebuggerConstants.ICON_ROOT) : (MonsterDebuggerConstants.ICON_DISPLAY_OBJECT);
                        displayObjects[displayObjects.length] = {name:itemName, type:itemType, target:itemTarget, access:itemAccess, permission:itemPermission, icon:itemIcon, index:i};
                    }
                    i = (i + 1);
                }
                displayObjects.sortOn("name", Array.CASEINSENSITIVE);
                itemsArray = displayObjects.concat(itemsArray);
            }
            itemsArrayLength = itemsArray.length;
            i;
            while (i < itemsArrayLength)
            {
                
                itemType = itemsArray[i].type;
                itemName = itemsArray[i].name;
                itemTarget = itemsArray[i].target;
                itemPermission = itemsArray[i].permission;
                itemAccess = itemsArray[i].access;
                itemIcon = itemsArray[i].icon;
                try
                {
                    if (itemAccess == MonsterDebuggerConstants.ACCESS_DISPLAY_OBJECT)
                    {
                        item = DisplayObjectContainer(object).getChildAt(itemsArray[i].index);
                    }
                    else
                    {
                        item = object[itemName];
                    }
                }
                catch (e2:Error)
                {
                    item;
                }
                if (item != null)
                {
                }
                if (itemPermission != MonsterDebuggerConstants.PERMISSION_WRITEONLY)
                {
                    if (itemType != MonsterDebuggerConstants.TYPE_STRING)
                    {
                    }
                    if (itemType != MonsterDebuggerConstants.TYPE_BOOLEAN)
                    {
                    }
                    if (itemType != MonsterDebuggerConstants.TYPE_NUMBER)
                    {
                    }
                    if (itemType != MonsterDebuggerConstants.TYPE_INT)
                    {
                    }
                    if (itemType != MonsterDebuggerConstants.TYPE_UINT)
                    {
                    }
                    if (itemType == MonsterDebuggerConstants.TYPE_FUNCTION)
                    {
                        isXML;
                        isXMLString = new XML();
                        if (itemType == MonsterDebuggerConstants.TYPE_STRING)
                        {
                            try
                            {
                                isXMLString = new XML(item);
                                if (!isXMLString.hasSimpleContent())
                                {
                                }
                                isXML = isXMLString.children().length() > 0;
                            }
                            catch (error:TypeError)
                            {
                            }
                        }
                        if (!isXML)
                        {
                            nodeXML = new XML("<node/>");
                            nodeXML.@icon = itemIcon;
                            nodeXML.@label = itemName + " (" + itemType + ") = " + printValue(item, itemType);
                            nodeXML.@name = itemName;
                            nodeXML.@type = itemType;
                            nodeXML.@value = printValue(item, itemType);
                            nodeXML.@target = itemTarget;
                            nodeXML.@access = itemAccess;
                            nodeXML.@permission = itemPermission;
                            rootXML.appendChild(nodeXML);
                        }
                        else
                        {
                            nodeXML = new XML("<node/>");
                            nodeXML.@icon = itemIcon;
                            nodeXML.@label = itemName + " (" + itemType + ")";
                            nodeXML.@name = itemName;
                            nodeXML.@type = itemType;
                            nodeXML.@value = "";
                            nodeXML.@target = itemTarget;
                            nodeXML.@access = itemAccess;
                            nodeXML.@permission = itemPermission;
                            nodeXML.appendChild(parseXML(isXMLString, itemTarget + "." + "children()", currentDepth, maxDepth).children());
                            rootXML.appendChild(nodeXML);
                        }
                    }
                    else
                    {
                        nodeXML = new XML("<node/>");
                        nodeXML.@icon = itemIcon;
                        nodeXML.@label = itemName + " (" + itemType + ")";
                        nodeXML.@name = itemName;
                        nodeXML.@type = itemType;
                        nodeXML.@target = itemTarget;
                        nodeXML.@access = itemAccess;
                        nodeXML.@permission = itemPermission;
                        if (item != null)
                        {
                        }
                        if (itemType != MonsterDebuggerConstants.TYPE_BYTEARRAY)
                        {
                            nodeXML.appendChild(parse(item, itemTarget, (currentDepth + 1), maxDepth, includeDisplayObjects).children());
                        }
                        rootXML.appendChild(nodeXML);
                    }
                }
                i = (i + 1);
            }
            return rootXML;
        }// end function

        private static function parseArray(param1, param2:String, param3:int = 1, param4:int = 5, param5:Boolean = true) : XML
        {
            var nodeXML:XML;
            var childXML:XML;
            var key:*;
            var object:* = param1;
            var target:* = param2;
            var currentDepth:* = param3;
            var maxDepth:* = param4;
            var includeDisplayObjects:* = param5;
            var rootXML:* = new XML("<root/>");
            var childType:String;
            var childTarget:String;
            var isXML:Boolean;
            var isXMLString:* = new XML();
            var i:int;
            nodeXML = new XML("<node/>");
            nodeXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
            nodeXML.@label = "length" + " (" + MonsterDebuggerConstants.TYPE_UINT + ") = " + object["length"];
            nodeXML.@name = "length";
            nodeXML.@type = MonsterDebuggerConstants.TYPE_UINT;
            nodeXML.@value = object["length"];
            nodeXML.@target = target + "." + "length";
            nodeXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
            nodeXML.@permission = MonsterDebuggerConstants.PERMISSION_READONLY;
            var keys:Array;
            var isNumeric:Boolean;
            var _loc_7:* = 0;
            var _loc_8:* = object;
            while (_loc_8 in _loc_7)
            {
                
                key = _loc_8[_loc_7];
                if (!(key is int))
                {
                    isNumeric;
                }
                keys.push(key);
            }
            if (isNumeric)
            {
                keys.sort(Array.NUMERIC);
            }
            else
            {
                keys.sort(Array.CASEINSENSITIVE);
            }
            i;
            while (i < keys.length)
            {
                
                childType = parseType(MonsterDebuggerDescribeType.get(object[keys[i]]).@name);
                childTarget = target + "." + String(keys[i]);
                if (childType != MonsterDebuggerConstants.TYPE_STRING)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_BOOLEAN)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_NUMBER)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_INT)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_UINT)
                {
                }
                if (childType == MonsterDebuggerConstants.TYPE_FUNCTION)
                {
                    isXML;
                    isXMLString = new XML();
                    if (childType == MonsterDebuggerConstants.TYPE_STRING)
                    {
                        try
                        {
                            isXMLString = new XML(object[keys[i]]);
                            if (!isXMLString.hasSimpleContent())
                            {
                            }
                            if (isXMLString.children().length() > 0)
                            {
                                isXML;
                            }
                        }
                        catch (error:TypeError)
                        {
                        }
                    }
                    if (!isXML)
                    {
                        childXML = new XML("<node/>");
                        childXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                        childXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        childXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        childXML.@label = "[" + keys[i] + "] (" + childType + ") = " + printValue(object[keys[i]], childType);
                        childXML.@name = "[" + keys[i] + "]";
                        childXML.@type = childType;
                        childXML.@value = printValue(object[keys[i]], childType);
                        childXML.@target = childTarget;
                        nodeXML.appendChild(childXML);
                    }
                    else
                    {
                        childXML = new XML("<node/>");
                        childXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                        childXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        childXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        childXML.@label = "[" + keys[i] + "] (" + childType + ")";
                        childXML.@name = "[" + keys[i] + "]";
                        childXML.@type = childType;
                        childXML.@value = "";
                        childXML.@target = childTarget;
                        childXML.appendChild(parseXML(object[keys[i]], childTarget, (currentDepth + 1), maxDepth).children());
                        nodeXML.appendChild(childXML);
                    }
                }
                else
                {
                    childXML = new XML("<node/>");
                    childXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                    childXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                    childXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                    childXML.@label = "[" + keys[i] + "] (" + childType + ")";
                    childXML.@name = "[" + keys[i] + "]";
                    childXML.@type = childType;
                    childXML.@value = "";
                    childXML.@target = childTarget;
                    childXML.appendChild(parse(object[keys[i]], childTarget, (currentDepth + 1), maxDepth, includeDisplayObjects).children());
                    nodeXML.appendChild(childXML);
                }
                i = (i + 1);
            }
            rootXML.appendChild(nodeXML);
            return rootXML;
        }// end function

        public static function parseFunctions(param1, param2:String = "") : XML
        {
            var itemXML:XML;
            var key:String;
            var returnType:String;
            var parameters:XMLList;
            var parametersLength:int;
            var args:Array;
            var argsString:String;
            var methodXML:XML;
            var parameterXML:XML;
            var object:* = param1;
            var target:* = param2;
            var rootXML:* = new XML("<root/>");
            var description:* = MonsterDebuggerDescribeType.get(object);
            var type:* = parseType(description.@name);
            var itemType:String;
            var itemName:String;
            var itemTarget:String;
            var keys:Object;
            var methods:* = description..method;
            var methodsArr:Array;
            var methodsLength:* = methods.length();
            var optional:Boolean;
            var i:int;
            var n:int;
            itemXML = new XML("<node/>");
            itemXML.@icon = MonsterDebuggerConstants.ICON_DEFAULT;
            itemXML.@label = "(" + type + ")";
            itemXML.@target = target;
            i;
            while (i < methodsLength)
            {
                
                key = methods[i].@name;
                try
                {
                    if (!keys.hasOwnProperty(key))
                    {
                        keys[key] = key;
                        methodsArr[methodsArr.length] = {name:key, xml:methods[i], access:MonsterDebuggerConstants.ACCESS_METHOD};
                    }
                }
                catch (e:Error)
                {
                }
                i = (i + 1);
            }
            methodsArr.sortOn("name", Array.CASEINSENSITIVE);
            methodsLength = methodsArr.length;
            i;
            while (i < methodsLength)
            {
                
                itemType = MonsterDebuggerConstants.TYPE_FUNCTION;
                itemName = methodsArr[i].xml.@name;
                itemTarget = target + MonsterDebuggerConstants.DELIMITER + itemName;
                returnType = parseType(methodsArr[i].xml.@returnType);
                parameters = methodsArr[i].xml..parameter;
                parametersLength = parameters.length();
                args;
                argsString;
                optional;
                n;
                while (n < parametersLength)
                {
                    
                    if (parameters[n].@optional == "true")
                    {
                    }
                    if (!optional)
                    {
                        optional;
                        args[args.length] = "[";
                    }
                    args[args.length] = parseType(parameters[n].@type);
                    n = (n + 1);
                }
                if (optional)
                {
                    args[args.length] = "]";
                }
                argsString = args.join(", ");
                argsString = argsString.replace("[, ", "[");
                argsString = argsString.replace(", ]", "]");
                methodXML = new XML("<node/>");
                methodXML.@icon = MonsterDebuggerConstants.ICON_FUNCTION;
                methodXML.@type = MonsterDebuggerConstants.TYPE_FUNCTION;
                methodXML.@access = MonsterDebuggerConstants.ACCESS_METHOD;
                methodXML.@label = itemName + "(" + argsString + "):" + returnType;
                methodXML.@name = itemName;
                methodXML.@target = itemTarget;
                methodXML.@args = argsString;
                methodXML.@returnType = returnType;
                n;
                while (n < parametersLength)
                {
                    
                    parameterXML = new XML("<node/>");
                    parameterXML.@type = parseType(parameters[n].@type);
                    parameterXML.@index = parameters[n].@index;
                    parameterXML.@optional = parameters[n].@optional;
                    methodXML.appendChild(parameterXML);
                    n = (n + 1);
                }
                itemXML.appendChild(methodXML);
                i = (i + 1);
            }
            rootXML.appendChild(itemXML);
            return rootXML;
        }// end function

        public static function parseXML(param1, param2:String = "", param3:int = 1, param4:int = -1) : XML
        {
            var _loc_6:* = null;
            var _loc_7:* = null;
            var _loc_9:* = null;
            var _loc_5:* = new XML("<root/>");
            var _loc_8:* = 0;
            if (param4 != -1)
            {
            }
            if (param3 > param4)
            {
                return _loc_5;
            }
            if (param2.indexOf("@") != -1)
            {
                _loc_6 = new XML("<node/>");
                _loc_6.@icon = MonsterDebuggerConstants.ICON_XMLATTRIBUTE;
                _loc_6.@type = MonsterDebuggerConstants.TYPE_XMLATTRIBUTE;
                _loc_6.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                _loc_6.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                _loc_6.@label = param1;
                _loc_6.@name = "";
                _loc_6.@value = param1;
                _loc_6.@target = param2;
                _loc_5.appendChild(_loc_6);
            }
            else
            {
                if ("name" in param1)
                {
                }
                if (param1.name() == null)
                {
                    _loc_6 = new XML("<node/>");
                    _loc_6.@icon = MonsterDebuggerConstants.ICON_XMLVALUE;
                    _loc_6.@type = MonsterDebuggerConstants.TYPE_XMLVALUE;
                    _loc_6.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                    _loc_6.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                    _loc_6.@label = "(" + MonsterDebuggerConstants.TYPE_XMLVALUE + ") = " + printValue(param1, MonsterDebuggerConstants.TYPE_XMLVALUE);
                    _loc_6.@name = "";
                    _loc_6.@value = printValue(param1, MonsterDebuggerConstants.TYPE_XMLVALUE);
                    _loc_6.@target = param2;
                    _loc_5.appendChild(_loc_6);
                }
                else
                {
                    if ("hasSimpleContent" in param1)
                    {
                    }
                    if (param1.hasSimpleContent())
                    {
                        _loc_6 = new XML("<node/>");
                        _loc_6.@icon = MonsterDebuggerConstants.ICON_XMLNODE;
                        _loc_6.@type = MonsterDebuggerConstants.TYPE_XMLNODE;
                        _loc_6.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        _loc_6.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        _loc_6.@label = param1.name() + " (" + MonsterDebuggerConstants.TYPE_XMLNODE + ")";
                        _loc_6.@name = param1.name();
                        _loc_6.@value = "";
                        _loc_6.@target = param2;
                        if (param1 != "")
                        {
                            _loc_7 = new XML("<node/>");
                            _loc_7.@icon = MonsterDebuggerConstants.ICON_XMLVALUE;
                            _loc_7.@type = MonsterDebuggerConstants.TYPE_XMLVALUE;
                            _loc_7.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                            _loc_7.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                            _loc_7.@label = "(" + MonsterDebuggerConstants.TYPE_XMLVALUE + ") = " + printValue(param1, MonsterDebuggerConstants.TYPE_XMLVALUE);
                            _loc_7.@name = "";
                            _loc_7.@value = printValue(param1, MonsterDebuggerConstants.TYPE_XMLVALUE);
                            _loc_7.@target = param2;
                            _loc_6.appendChild(_loc_7);
                        }
                        _loc_8 = 0;
                        while (_loc_8 < param1.attributes().length())
                        {
                            
                            _loc_7 = new XML("<node/>");
                            _loc_7.@icon = MonsterDebuggerConstants.ICON_XMLATTRIBUTE;
                            _loc_7.@type = MonsterDebuggerConstants.TYPE_XMLATTRIBUTE;
                            _loc_7.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                            _loc_7.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                            _loc_7.@label = "@" + param1.attributes()[_loc_8].name() + " (" + MonsterDebuggerConstants.TYPE_XMLATTRIBUTE + ") = " + param1.attributes()[_loc_8];
                            _loc_7.@name = "";
                            _loc_7.@value = param1.attributes()[_loc_8];
                            _loc_7.@target = param2 + "." + "@" + param1.attributes()[_loc_8].name();
                            _loc_6.appendChild(_loc_7);
                            _loc_8 = _loc_8 + 1;
                        }
                        _loc_5.appendChild(_loc_6);
                    }
                    else
                    {
                        _loc_6 = new XML("<node/>");
                        _loc_6.@icon = MonsterDebuggerConstants.ICON_XMLNODE;
                        _loc_6.@type = MonsterDebuggerConstants.TYPE_XMLNODE;
                        _loc_6.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        _loc_6.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        _loc_6.@label = param1.name() + " (" + MonsterDebuggerConstants.TYPE_XMLNODE + ")";
                        _loc_6.@name = param1.name();
                        _loc_6.@value = "";
                        _loc_6.@target = param2;
                        _loc_8 = 0;
                        while (_loc_8 < param1.attributes().length())
                        {
                            
                            _loc_7 = new XML("<node/>");
                            _loc_7.@icon = MonsterDebuggerConstants.ICON_XMLATTRIBUTE;
                            _loc_7.@type = MonsterDebuggerConstants.TYPE_XMLATTRIBUTE;
                            _loc_7.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                            _loc_7.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                            _loc_7.@label = "@" + param1.attributes()[_loc_8].name() + " (" + MonsterDebuggerConstants.TYPE_XMLATTRIBUTE + ") = " + param1.attributes()[_loc_8];
                            _loc_7.@name = "";
                            _loc_7.@value = param1.attributes()[_loc_8];
                            _loc_7.@target = param2 + "." + "@" + param1.attributes()[_loc_8].name();
                            _loc_6.appendChild(_loc_7);
                            _loc_8 = _loc_8 + 1;
                        }
                        _loc_8 = 0;
                        while (_loc_8 < param1.children().length())
                        {
                            
                            _loc_9 = param2 + "." + "children()" + "." + _loc_8;
                            _loc_6.appendChild(parseXML(param1.children()[_loc_8], _loc_9, (param3 + 1), param4).children());
                            _loc_8 = _loc_8 + 1;
                        }
                        _loc_5.appendChild(_loc_6);
                    }
                }
            }
            return _loc_5;
        }// end function

        public static function resume() : Boolean
        {
            try
            {
                System.resume();
                return true;
            }
            catch (e:Error)
            {
            }
            return false;
        }// end function

        public static function getObjectUnderPoint(param1:DisplayObjectContainer, param2:Point) : DisplayObject
        {
            var _loc_3:* = null;
            var _loc_4:* = null;
            var _loc_6:* = null;
            if (param1.areInaccessibleObjectsUnderPoint(param2))
            {
                return param1;
            }
            _loc_3 = param1.getObjectsUnderPoint(param2);
            _loc_3.reverse();
            if (_loc_3 != null)
            {
            }
            if (_loc_3.length == 0)
            {
                return param1;
            }
            _loc_4 = _loc_3[0];
            _loc_3.length = 0;
            while (true)
            {
                
                _loc_3[_loc_3.length] = _loc_4;
                if (_loc_4.parent == null)
                {
                    break;
                }
                _loc_4 = _loc_4.parent;
            }
            _loc_3.reverse();
            var _loc_5:* = 0;
            while (_loc_5 < _loc_3.length)
            {
                
                _loc_6 = _loc_3[_loc_5];
                if (_loc_6 is DisplayObjectContainer)
                {
                    _loc_4 = _loc_6;
                    if (!DisplayObjectContainer(_loc_6).mouseChildren)
                    {
                        break;
                    }
                }
                else
                {
                    break;
                }
                _loc_5 = _loc_5 + 1;
            }
            return _loc_4;
        }// end function

        public static function getReferenceID(param1) : String
        {
            if (param1 in _references)
            {
                return _references[param1];
            }
            var _loc_2:* = "#" + String(_reference);
            _references[param1] = _loc_2;
            var _loc_4:* = _reference + 1;
            _reference = _loc_4;
            return _loc_2;
        }// end function

        public static function printValue(param1, param2:String) : String
        {
            if (param2 == MonsterDebuggerConstants.TYPE_BYTEARRAY)
            {
                return param1["length"] + " bytes";
            }
            if (param1 == null)
            {
                return "null";
            }
            return String(param1);
        }// end function

        private static function parseObject(param1, param2:String, param3:int = 1, param4:int = 5, param5:Boolean = true) : XML
        {
            var childXML:XML;
            var prop:*;
            var object:* = param1;
            var target:* = param2;
            var currentDepth:* = param3;
            var maxDepth:* = param4;
            var includeDisplayObjects:* = param5;
            var rootXML:* = new XML("<root/>");
            var nodeXML:* = new XML("<node/>");
            var childType:String;
            var childTarget:String;
            var isXML:Boolean;
            var isXMLString:* = new XML();
            var i:int;
            var properties:Array;
            var isNumeric:Boolean;
            var _loc_7:* = 0;
            var _loc_8:* = object;
            while (_loc_8 in _loc_7)
            {
                
                prop = _loc_8[_loc_7];
                if (!(prop is int))
                {
                    isNumeric;
                }
                properties.push(prop);
            }
            if (isNumeric)
            {
                properties.sort(Array.NUMERIC);
            }
            else
            {
                properties.sort(Array.CASEINSENSITIVE);
            }
            i;
            while (i < properties.length)
            {
                
                childType = parseType(MonsterDebuggerDescribeType.get(object[properties[i]]).@name);
                childTarget = target + "." + properties[i];
                if (childType != MonsterDebuggerConstants.TYPE_STRING)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_BOOLEAN)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_NUMBER)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_INT)
                {
                }
                if (childType != MonsterDebuggerConstants.TYPE_UINT)
                {
                }
                if (childType == MonsterDebuggerConstants.TYPE_FUNCTION)
                {
                    isXML;
                    isXMLString = new XML();
                    if (childType == MonsterDebuggerConstants.TYPE_STRING)
                    {
                        try
                        {
                            isXMLString = new XML(object[properties[i]]);
                            if (!isXMLString.hasSimpleContent())
                            {
                            }
                            if (isXMLString.children().length() > 0)
                            {
                                isXML;
                            }
                        }
                        catch (error:TypeError)
                        {
                        }
                    }
                    if (!isXML)
                    {
                        childXML = new XML("<node/>");
                        childXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                        childXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        childXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        childXML.@label = properties[i] + " (" + childType + ") = " + printValue(object[properties[i]], childType);
                        childXML.@name = properties[i];
                        childXML.@type = childType;
                        childXML.@value = printValue(object[properties[i]], childType);
                        childXML.@target = childTarget;
                        nodeXML.appendChild(childXML);
                    }
                    else
                    {
                        childXML = new XML("<node/>");
                        childXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                        childXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                        childXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                        childXML.@label = properties[i] + " (" + childType + ")";
                        childXML.@name = properties[i];
                        childXML.@type = childType;
                        childXML.@value = "";
                        childXML.@target = childTarget;
                        childXML.appendChild(parseXML(object[properties[i]], childTarget, (currentDepth + 1), maxDepth).children());
                        nodeXML.appendChild(childXML);
                    }
                }
                else
                {
                    childXML = new XML("<node/>");
                    childXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                    childXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                    childXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                    childXML.@label = properties[i] + " (" + childType + ")";
                    childXML.@name = properties[i];
                    childXML.@type = childType;
                    childXML.@value = "";
                    childXML.@target = childTarget;
                    childXML.appendChild(parse(object[properties[i]], childTarget, (currentDepth + 1), maxDepth, includeDisplayObjects).children());
                    nodeXML.appendChild(childXML);
                }
                i = (i + 1);
            }
            rootXML.appendChild(nodeXML.children());
            return rootXML;
        }// end function

        public static function parse(param1, param2:String = "", param3:int = 1, param4:int = 5, param5:Boolean = true) : XML
        {
            var _loc_8:* = null;
            var _loc_13:* = 0;
            var _loc_14:* = null;
            var _loc_6:* = new XML("<root/>");
            var _loc_7:* = new XML("<node/>");
            var _loc_9:* = new XML();
            var _loc_10:* = "";
            var _loc_11:* = "";
            var _loc_12:* = false;
            if (param4 != -1)
            {
            }
            if (param3 > param4)
            {
                return _loc_6;
            }
            if (param1 == null)
            {
                _loc_8 = new XML("<node/>");
                _loc_8.@icon = MonsterDebuggerConstants.ICON_WARNING;
                _loc_8.@label = "Null object";
                _loc_8.@name = "Null object";
                _loc_8.@type = MonsterDebuggerConstants.TYPE_WARNING;
                _loc_7.appendChild(_loc_8);
                _loc_10 = "null";
            }
            else
            {
                _loc_9 = MonsterDebuggerDescribeType.get(param1);
                _loc_10 = parseType(_loc_9.@name);
                _loc_11 = parseType(_loc_9.@base);
                _loc_12 = _loc_9.@isDynamic;
                if (param1 is Class)
                {
                    _loc_7.appendChild(parseClass(param1, param2, _loc_9, param3, param4, param5).children());
                }
                else if (_loc_10 == MonsterDebuggerConstants.TYPE_XML)
                {
                    _loc_7.appendChild(parseXML(param1, param2 + "." + "children()", param3, param4).children());
                }
                else if (_loc_10 == MonsterDebuggerConstants.TYPE_XMLLIST)
                {
                    _loc_8 = new XML("<node/>");
                    _loc_8.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                    _loc_8.@type = MonsterDebuggerConstants.TYPE_UINT;
                    _loc_8.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                    _loc_8.@permission = MonsterDebuggerConstants.PERMISSION_READONLY;
                    _loc_8.@target = param2 + "." + "length";
                    _loc_8.@label = "length" + " (" + MonsterDebuggerConstants.TYPE_UINT + ") = " + param1.length();
                    _loc_8.@name = "length";
                    _loc_8.@value = param1.length();
                    _loc_13 = 0;
                    while (_loc_13 < param1.length())
                    {
                        
                        _loc_8.appendChild(parseXML(param1[_loc_13], param2 + "." + String(_loc_13) + ".children()", param3, param4).children());
                        _loc_13 = _loc_13 + 1;
                    }
                    _loc_7.appendChild(_loc_8);
                }
                else
                {
                    if (_loc_10 != MonsterDebuggerConstants.TYPE_STRING)
                    {
                    }
                    if (_loc_10 != MonsterDebuggerConstants.TYPE_BOOLEAN)
                    {
                    }
                    if (_loc_10 != MonsterDebuggerConstants.TYPE_NUMBER)
                    {
                    }
                    if (_loc_10 != MonsterDebuggerConstants.TYPE_INT)
                    {
                    }
                    if (_loc_10 == MonsterDebuggerConstants.TYPE_UINT)
                    {
                        _loc_7.appendChild(parseBasics(param1, param2, _loc_10).children());
                    }
                    else
                    {
                        if (_loc_10 != MonsterDebuggerConstants.TYPE_ARRAY)
                        {
                        }
                        if (_loc_10.indexOf(MonsterDebuggerConstants.TYPE_VECTOR) == 0)
                        {
                            _loc_7.appendChild(parseArray(param1, param2, param3, param4).children());
                        }
                        else if (_loc_10 == MonsterDebuggerConstants.TYPE_OBJECT)
                        {
                            _loc_7.appendChild(parseObject(param1, param2, param3, param4, param5).children());
                        }
                        else
                        {
                            _loc_7.appendChild(parseClass(param1, param2, _loc_9, param3, param4, param5).children());
                        }
                    }
                }
            }
            if (param3 == 1)
            {
                _loc_14 = new XML("<node/>");
                _loc_14.@icon = MonsterDebuggerConstants.ICON_ROOT;
                _loc_14.@label = "(" + _loc_10 + ")";
                _loc_14.@type = _loc_10;
                _loc_14.@target = param2;
                _loc_14.appendChild(_loc_7.children());
                _loc_6.appendChild(_loc_14);
            }
            else
            {
                _loc_6.appendChild(_loc_7.children());
            }
            return _loc_6;
        }// end function

        public static function parseType(param1:String) : String
        {
            var _loc_2:* = null;
            var _loc_3:* = null;
            if (param1.indexOf("::") != -1)
            {
                param1 = param1.substring(param1.indexOf("::") + 2, param1.length);
            }
            if (param1.indexOf("::") != -1)
            {
                _loc_2 = param1.substring(0, (param1.indexOf("<") + 1));
                _loc_3 = param1.substring(param1.indexOf("::") + 2, param1.length);
                param1 = _loc_2 + _loc_3;
            }
            param1 = param1.replace("()", "");
            param1 = param1.replace(MonsterDebuggerConstants.TYPE_METHOD, MonsterDebuggerConstants.TYPE_FUNCTION);
            return param1;
        }// end function

        public static function getReference(param1:String)
        {
            var _loc_2:* = undefined;
            var _loc_3:* = null;
            if (param1.charAt(0) != "#")
            {
                return null;
            }
            for (_loc_2 in _references)
            {
                
                _loc_3 = _references[_loc_2];
                if (_loc_3 == param1)
                {
                    return _loc_2;
                }
            }
            return null;
        }// end function

        public static function pause() : Boolean
        {
            try
            {
                System.pause();
                return true;
            }
            catch (e:Error)
            {
            }
            return false;
        }// end function

        public static function getMemory() : uint
        {
            return System.totalMemory;
        }// end function

        public static function getObject(param1, param2:String = "", param3:int = 0)
        {
            var index:Number;
            var base:* = param1;
            var target:* = param2;
            var parent:* = param3;
            if (target != null)
            {
            }
            if (target == "")
            {
                return base;
            }
            if (target.charAt(0) == "#")
            {
                return getReference(target);
            }
            var object:* = base;
            var splitted:* = target.split(MonsterDebuggerConstants.DELIMITER);
            var i:int;
            while (i < splitted.length - parent)
            {
                
                if (splitted[i] != "")
                {
                    try
                    {
                        if (splitted[i] == "children()")
                        {
                            object = object.children();
                        }
                        else
                        {
                            if (object is DisplayObjectContainer)
                            {
                            }
                            if (splitted[i].indexOf("getChildAt(") == 0)
                            {
                                index = splitted[i].substring(11, splitted[i].indexOf(")", 11));
                                object = DisplayObjectContainer(object).getChildAt(index);
                            }
                            else
                            {
                                object = object[splitted[i]];
                            }
                        }
                    }
                    catch (e:Error)
                    {
                        break;
                    }
                }
                i = (i + 1);
            }
            return object;
        }// end function

        public static function stackTrace() : XML
        {
            var childXML:XML;
            var stack:String;
            var lines:Array;
            var i:int;
            var s:String;
            var bracketIndex:int;
            var methodIndex:int;
            var classname:String;
            var method:String;
            var file:String;
            var line:String;
            var functionXML:XML;
            var rootXML:* = new XML("<root/>");
            childXML = new XML("<node/>");
            try
            {
                throw new Error();
            }
            catch (e:Error)
            {
                stack = e.getStackTrace();
                if (stack != null)
                {
                }
                if (stack == "")
                {
                    return new XML("<root><error>Stack unavailable</error></root>");
                }
                stack = stack.split("\t").join("");
                lines = stack.split("\n");
                if (lines.length <= 4)
                {
                    return new XML("<root><error>Stack to short</error></root>");
                }
                lines.shift();
                lines.shift();
                lines.shift();
                lines.shift();
                i;
                while (i < lines.length)
                {
                    
                    s = lines[i];
                    s = s.substring(3, s.length);
                    bracketIndex = s.indexOf("[");
                    methodIndex = s.indexOf("/");
                    if (bracketIndex == -1)
                    {
                        bracketIndex = s.length;
                    }
                    if (methodIndex == -1)
                    {
                        methodIndex = bracketIndex;
                    }
                    classname = MonsterDebuggerUtils.parseType(s.substring(0, methodIndex));
                    method;
                    file;
                    line;
                    if (methodIndex != s.length)
                    {
                    }
                    if (methodIndex != bracketIndex)
                    {
                        method = s.substring((methodIndex + 1), bracketIndex);
                    }
                    if (bracketIndex != s.length)
                    {
                        file = s.substring((bracketIndex + 1), s.lastIndexOf(":"));
                        line = s.substring((s.lastIndexOf(":") + 1), (s.length - 1));
                    }
                    functionXML = new XML("<node/>");
                    functionXML.@classname = classname;
                    functionXML.@method = method;
                    functionXML.@file = file;
                    functionXML.@line = line;
                    childXML.appendChild(functionXML);
                    i = (i + 1);
                }
            }
            rootXML.appendChild(childXML.children());
            return rootXML;
        }// end function

        public static function isDisplayObject(param1) : Boolean
        {
            if (!(param1 is DisplayObject))
            {
            }
            return param1 is DisplayObjectContainer;
        }// end function

        private static function parseBasics(param1, param2:String, param3:String, param4:int = 1, param5:int = 5) : XML
        {
            var object:* = param1;
            var target:* = param2;
            var type:* = param3;
            var currentDepth:* = param4;
            var maxDepth:* = param5;
            var rootXML:* = new XML("<root/>");
            var nodeXML:* = new XML("<node/>");
            var isXML:Boolean;
            var isXMLString:* = new XML();
            if (type == MonsterDebuggerConstants.TYPE_STRING)
            {
                try
                {
                    isXMLString = new XML(object);
                    if (!isXMLString.hasSimpleContent())
                    {
                    }
                    isXML = isXMLString.children().length() > 0;
                }
                catch (error:TypeError)
                {
                }
            }
            if (!isXML)
            {
                nodeXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                nodeXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                nodeXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                nodeXML.@label = "(" + type + ") = " + printValue(object, type);
                nodeXML.@name = "";
                nodeXML.@type = type;
                nodeXML.@value = printValue(object, type);
                nodeXML.@target = target;
            }
            else
            {
                nodeXML.@icon = MonsterDebuggerConstants.ICON_VARIABLE;
                nodeXML.@access = MonsterDebuggerConstants.ACCESS_VARIABLE;
                nodeXML.@permission = MonsterDebuggerConstants.PERMISSION_READWRITE;
                nodeXML.@label = "(" + MonsterDebuggerConstants.TYPE_XML + ")";
                nodeXML.@name = "";
                nodeXML.@type = MonsterDebuggerConstants.TYPE_XML;
                nodeXML.@value = "";
                nodeXML.@target = target;
                nodeXML.appendChild(parseXML(isXMLString, target + "." + "children()", currentDepth, maxDepth).children());
            }
            rootXML.appendChild(nodeXML);
            return rootXML;
        }// end function

    }
}
