package com.demonsters.debugger
{
    import flash.display.*;
    import flash.events.*;
    import flash.external.*;
    import flash.geom.*;
    import flash.system.*;
    import flash.text.*;
    import flash.utils.*;

    class MonsterDebuggerCore extends Object
    {
        private static var _highlightInfo:TextField;
        private static var _monitorStart:Number;
        private static var _monitorTime:Number;
        private static const HIGHLITE_COLOR:uint = 3381759;
        private static var _monitorFrames:int;
        private static var _highlightTarget:DisplayObject;
        static const ID:String = "com.demonsters.debugger.core";
        private static var _base:Object = null;
        private static var _highlight:Sprite;
        private static var _monitorSprite:Sprite;
        private static var _highlightUpdate:Boolean;
        private static var _plugins:Object = {};
        private static var _monitorTimer:Timer;
        private static const MONITOR_UPDATE:int = 1000;
        private static var _highlightMouse:Boolean;
        private static var _stage:Stage = null;

        function MonsterDebuggerCore()
        {
            return;
        }// end function

        static function sendInformation() : void
        {
            var UIComponentClass:*;
            var tmpLocation:String;
            var tmpTitle:String;
            var NativeApplicationClass:*;
            var descriptor:XML;
            var ns:Namespace;
            var filename:String;
            var FileClass:*;
            var slash:int;
            var playerType:* = Capabilities.playerType;
            var playerVersion:* = Capabilities.version;
            var isDebugger:* = Capabilities.isDebugger;
            var isFlex:Boolean;
            var fileTitle:String;
            var fileLocation:String;
            try
            {
                UIComponentClass = getDefinitionByName("mx.core::UIComponent");
                if (UIComponentClass != null)
                {
                    isFlex;
                }
            }
            catch (e1:Error)
            {
            }
            if (_base is DisplayObject)
            {
            }
            if (_base.hasOwnProperty("loaderInfo"))
            {
                if (DisplayObject(_base).loaderInfo != null)
                {
                    fileLocation = unescape(DisplayObject(_base).loaderInfo.url);
                }
            }
            if (_base.hasOwnProperty("stage"))
            {
                if (_base["stage"] != null)
                {
                }
                if (_base["stage"] is Stage)
                {
                    fileLocation = unescape(Stage(_base["stage"]).loaderInfo.url);
                }
            }
            if (playerType != "ActiveX")
            {
            }
            if (playerType == "PlugIn")
            {
                if (ExternalInterface.available)
                {
                    try
                    {
                        tmpLocation = ExternalInterface.call("window.location.href.toString");
                        tmpTitle = ExternalInterface.call("window.document.title.toString");
                        if (tmpLocation != null)
                        {
                            fileLocation = tmpLocation;
                        }
                        if (tmpTitle != null)
                        {
                            fileTitle = tmpTitle;
                        }
                    }
                    catch (e2:Error)
                    {
                    }
                }
            }
            if (playerType == "Desktop")
            {
                try
                {
                    NativeApplicationClass = getDefinitionByName("flash.desktop::NativeApplication");
                    if (NativeApplicationClass != null)
                    {
                        descriptor = NativeApplicationClass["nativeApplication"]["applicationDescriptor"];
                        ns = descriptor.namespace();
                        filename = ns::filename;
                        FileClass = getDefinitionByName("flash.filesystem::File");
                        if (Capabilities.os.toLowerCase().indexOf("windows") != -1)
                        {
                            filename = filename + ".exe";
                            var _loc_2:* = FileClass["applicationDirectory"];
                            fileLocation = _loc_2.FileClass["applicationDirectory"]["resolvePath"](filename)["nativePath"];
                        }
                        else if (Capabilities.os.toLowerCase().indexOf("mac") != -1)
                        {
                            filename = filename + ".app";
                            var _loc_2:* = FileClass["applicationDirectory"];
                            fileLocation = _loc_2.FileClass["applicationDirectory"]["resolvePath"](filename)["nativePath"];
                        }
                    }
                }
                catch (e3:Error)
                {
                }
            }
            if (fileTitle == "")
            {
            }
            if (fileLocation != "")
            {
                slash = Math.max(fileLocation.lastIndexOf("\\"), fileLocation.lastIndexOf("/"));
                if (slash != -1)
                {
                    fileTitle = fileLocation.substring((slash + 1), fileLocation.lastIndexOf("."));
                }
                else
                {
                    fileTitle = fileLocation;
                }
            }
            if (fileTitle == "")
            {
                fileTitle;
            }
            var data:Object;
            send(data, true);
            MonsterDebuggerConnection.processQueue();
            return;
        }// end function

        private static function handleInternal(param1:MonsterDebuggerData) : void
        {
            var obj:*;
            var xml:XML;
            var method:Function;
            var displayObject:DisplayObject;
            var bitmapData:BitmapData;
            var bytes:ByteArray;
            var item:* = param1;
            switch(item.data["command"])
            {
                case MonsterDebuggerConstants.COMMAND_HELLO:
                {
                    sendInformation();
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_BASE:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, "", 0);
                    if (obj != null)
                    {
                        xml = XML(MonsterDebuggerUtils.parse(obj, "", 1, 2, true));
                        send({command:MonsterDebuggerConstants.COMMAND_BASE, xml:xml});
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_INSPECT:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (obj != null)
                    {
                        _base = obj;
                        xml = XML(MonsterDebuggerUtils.parse(obj, "", 1, 2, true));
                        send({command:MonsterDebuggerConstants.COMMAND_BASE, xml:xml});
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_GET_OBJECT:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (obj != null)
                    {
                        xml = XML(MonsterDebuggerUtils.parse(obj, item.data["target"], 1, 2, true));
                        send({command:MonsterDebuggerConstants.COMMAND_GET_OBJECT, xml:xml});
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_GET_PROPERTIES:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (obj != null)
                    {
                        xml = XML(MonsterDebuggerUtils.parse(obj, item.data["target"], 1, 1, false));
                        send({command:MonsterDebuggerConstants.COMMAND_GET_PROPERTIES, xml:xml});
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_GET_FUNCTIONS:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (obj != null)
                    {
                        xml = XML(MonsterDebuggerUtils.parseFunctions(obj, item.data["target"]));
                        send({command:MonsterDebuggerConstants.COMMAND_GET_FUNCTIONS, xml:xml});
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_SET_PROPERTY:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 1);
                    if (obj != null)
                    {
                        try
                        {
                            obj[item.data["name"]] = item.data["value"];
                            send({command:MonsterDebuggerConstants.COMMAND_SET_PROPERTY, target:item.data["target"], value:obj[item.data["name"]]});
                        }
                        catch (e1:Error)
                        {
                        }
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_GET_PREVIEW:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (obj != null)
                    {
                    }
                    if (MonsterDebuggerUtils.isDisplayObject(obj))
                    {
                        displayObject = obj as DisplayObject;
                        bitmapData = MonsterDebuggerUtils.snapshot(displayObject, new Rectangle(0, 0, 300, 300));
                        if (bitmapData != null)
                        {
                            bytes = bitmapData.getPixels(new Rectangle(0, 0, bitmapData.width, bitmapData.height));
                            send({command:MonsterDebuggerConstants.COMMAND_GET_PREVIEW, bytes:bytes, width:bitmapData.width, height:bitmapData.height});
                        }
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_CALL_METHOD:
                {
                    method = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (method != null)
                    {
                    }
                    if (method is Function)
                    {
                        if (item.data["returnType"] == MonsterDebuggerConstants.TYPE_VOID)
                        {
                            method.apply(null, item.data["arguments"]);
                        }
                        else
                        {
                            try
                            {
                                obj = method.apply(null, item.data["arguments"]);
                                xml = XML(MonsterDebuggerUtils.parse(obj, "", 1, 5, false));
                                send({command:MonsterDebuggerConstants.COMMAND_CALL_METHOD, id:item.data["id"], xml:xml});
                            }
                            catch (e2:Error)
                            {
                            }
                        }
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_PAUSE:
                {
                    MonsterDebuggerUtils.pause();
                    send({command:MonsterDebuggerConstants.COMMAND_PAUSE});
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_RESUME:
                {
                    MonsterDebuggerUtils.resume();
                    send({command:MonsterDebuggerConstants.COMMAND_RESUME});
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_HIGHLIGHT:
                {
                    obj = MonsterDebuggerUtils.getObject(_base, item.data["target"], 0);
                    if (obj != null)
                    {
                    }
                    if (MonsterDebuggerUtils.isDisplayObject(obj))
                    {
                        if (DisplayObject(obj).stage != null)
                        {
                        }
                        if (DisplayObject(obj).stage is Stage)
                        {
                            _stage = obj["stage"];
                        }
                        if (_stage != null)
                        {
                            highlightClear();
                            send({command:MonsterDebuggerConstants.COMMAND_STOP_HIGHLIGHT});
                            _highlight.removeEventListener(MouseEvent.CLICK, highlightClicked);
                            _highlight.mouseEnabled = false;
                            _highlightTarget = DisplayObject(obj);
                            _highlightMouse = false;
                            _highlightUpdate = true;
                        }
                    }
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_START_HIGHLIGHT:
                {
                    highlightClear();
                    _highlight.addEventListener(MouseEvent.CLICK, highlightClicked, false, 0, true);
                    _highlight.mouseEnabled = true;
                    _highlightTarget = null;
                    _highlightMouse = true;
                    _highlightUpdate = true;
                    send({command:MonsterDebuggerConstants.COMMAND_START_HIGHLIGHT});
                    break;
                }
                case MonsterDebuggerConstants.COMMAND_STOP_HIGHLIGHT:
                {
                    highlightClear();
                    _highlight.removeEventListener(MouseEvent.CLICK, highlightClicked);
                    _highlight.mouseEnabled = false;
                    _highlightTarget = null;
                    _highlightMouse = false;
                    _highlightUpdate = false;
                    send({command:MonsterDebuggerConstants.COMMAND_STOP_HIGHLIGHT});
                    break;
                }
                default:
                {
                    break;
                }
            }
            return;
        }// end function

        static function unregisterPlugin(param1:String) : void
        {
            if (param1 in _plugins)
            {
                _plugins[param1] = null;
            }
            return;
        }// end function

        static function initialize() : void
        {
            _monitorTime = new Date().time;
            _monitorStart = new Date().time;
            _monitorFrames = 0;
            _monitorTimer = new Timer(MONITOR_UPDATE);
            _monitorTimer.addEventListener(TimerEvent.TIMER, monitorTimerCallback, false, 0, true);
            _monitorTimer.start();
            if (_base.hasOwnProperty("stage"))
            {
                _base.hasOwnProperty("stage");
            }
            if (_base["stage"] != null)
            {
            }
            if (_base["stage"] is Stage)
            {
                _stage = _base["stage"] as Stage;
            }
            _monitorSprite = new Sprite();
            _monitorSprite.addEventListener(Event.ENTER_FRAME, frameHandler, false, 0, true);
            var _loc_1:* = new TextFormat();
            _loc_1.font = "Arial";
            _loc_1.color = 16777215;
            _loc_1.size = 11;
            _loc_1.leftMargin = 5;
            _loc_1.rightMargin = 5;
            _highlightInfo = new TextField();
            _highlightInfo.embedFonts = false;
            _highlightInfo.autoSize = TextFieldAutoSize.LEFT;
            _highlightInfo.mouseWheelEnabled = false;
            _highlightInfo.mouseEnabled = false;
            _highlightInfo.condenseWhite = false;
            _highlightInfo.embedFonts = false;
            _highlightInfo.multiline = false;
            _highlightInfo.selectable = false;
            _highlightInfo.wordWrap = false;
            _highlightInfo.defaultTextFormat = _loc_1;
            _highlightInfo.text = "";
            _highlight = new Sprite();
            _highlightMouse = false;
            _highlightTarget = null;
            _highlightUpdate = false;
            return;
        }// end function

        private static function highlightDraw(param1:Boolean) : void
        {
            var fill:* = param1;
            if (_highlightTarget == null)
            {
                return;
            }
            var boundsOuter:* = _highlightTarget.getBounds(_stage);
            if (_highlightTarget is Stage)
            {
                boundsOuter.x = 0;
                boundsOuter.y = 0;
                boundsOuter.width = _highlightTarget["stageWidth"];
                boundsOuter.height = _highlightTarget["stageHeight"];
            }
            else
            {
                boundsOuter.x = int(boundsOuter.x + 0.5);
                boundsOuter.y = int(boundsOuter.y + 0.5);
                boundsOuter.width = int(boundsOuter.width + 0.5);
                boundsOuter.height = int(boundsOuter.height + 0.5);
            }
            var boundsInner:* = boundsOuter.clone();
            boundsInner.x = boundsInner.x + 2;
            boundsInner.y = boundsInner.y + 2;
            boundsInner.width = boundsInner.width - 4;
            boundsInner.height = boundsInner.height - 4;
            if (boundsInner.width < 0)
            {
                boundsInner.width = 0;
            }
            if (boundsInner.height < 0)
            {
                boundsInner.height = 0;
            }
            _highlight.graphics.clear();
            _highlight.graphics.beginFill(HIGHLITE_COLOR, 1);
            _highlight.graphics.drawRect(boundsOuter.x, boundsOuter.y, boundsOuter.width, boundsOuter.height);
            _highlight.graphics.drawRect(boundsInner.x, boundsInner.y, boundsInner.width, boundsInner.height);
            if (fill)
            {
                _highlight.graphics.beginFill(HIGHLITE_COLOR, 0.25);
                _highlight.graphics.drawRect(boundsInner.x, boundsInner.y, boundsInner.width, boundsInner.height);
            }
            if (_highlightTarget.name != null)
            {
                _highlightInfo.text = String(_highlightTarget.name) + " - " + String(MonsterDebuggerDescribeType.get(_highlightTarget).@name);
            }
            else
            {
                _highlightInfo.text = String(MonsterDebuggerDescribeType.get(_highlightTarget).@name);
            }
            var boundsText:* = new Rectangle(boundsOuter.x, boundsOuter.y - (_highlightInfo.textHeight + 3), _highlightInfo.textWidth + 15, _highlightInfo.textHeight + 5);
            if (boundsText.y < 0)
            {
                boundsText.y = boundsOuter.y + boundsOuter.height;
            }
            if (boundsText.y + boundsText.height > _stage.stageHeight)
            {
                boundsText.y = _stage.stageHeight - boundsText.height;
            }
            if (boundsText.x < 0)
            {
                boundsText.x = 0;
            }
            if (boundsText.x + boundsText.width > _stage.stageWidth)
            {
                boundsText.x = _stage.stageWidth - boundsText.width;
            }
            _highlight.graphics.beginFill(HIGHLITE_COLOR, 1);
            _highlight.graphics.drawRect(boundsText.x, boundsText.y, boundsText.width, boundsText.height);
            _highlight.graphics.endFill();
            _highlightInfo.x = boundsText.x;
            _highlightInfo.y = boundsText.y;
            try
            {
                _stage.addChild(_highlight);
                _stage.addChild(_highlightInfo);
            }
            catch (e:Error)
            {
            }
            return;
        }// end function

        static function inspect(param1) : void
        {
            var _loc_2:* = undefined;
            var _loc_3:* = null;
            if (MonsterDebugger.enabled)
            {
                _base = param1;
                _loc_2 = MonsterDebuggerUtils.getObject(_base, "", 0);
                if (_loc_2 != null)
                {
                    _loc_3 = XML(MonsterDebuggerUtils.parse(_loc_2, "", 1, 2, true));
                    send({command:MonsterDebuggerConstants.COMMAND_BASE, xml:_loc_3});
                }
            }
            return;
        }// end function

        private static function frameHandler(event:Event) : void
        {
            if (MonsterDebugger.enabled)
            {
                var _loc_3:* = _monitorFrames + 1;
                _monitorFrames = _loc_3;
                if (_highlightUpdate)
                {
                    highlightUpdate();
                }
            }
            return;
        }// end function

        private static function send(param1:Object, param2:Boolean = false) : void
        {
            if (MonsterDebugger.enabled)
            {
                MonsterDebuggerConnection.send(MonsterDebuggerCore.ID, param1, param2);
            }
            return;
        }// end function

        private static function highlightUpdate() : void
        {
            var _loc_1:* = undefined;
            highlightClear();
            if (_highlightMouse)
            {
                if (_base.hasOwnProperty("stage"))
                {
                    _base.hasOwnProperty("stage");
                }
                if (_base["stage"] != null)
                {
                }
                if (_base["stage"] is Stage)
                {
                    _stage = _base["stage"] as Stage;
                }
                if (Capabilities.playerType == "Desktop")
                {
                    _loc_1 = getDefinitionByName("flash.desktop::NativeApplication");
                    if (_loc_1 != null)
                    {
                    }
                    if (_loc_1["nativeApplication"]["activeWindow"] != null)
                    {
                        _stage = _loc_1["nativeApplication"]["activeWindow"]["stage"];
                    }
                }
                if (_stage == null)
                {
                    _highlight.removeEventListener(MouseEvent.CLICK, highlightClicked);
                    _highlight.mouseEnabled = false;
                    _highlightTarget = null;
                    _highlightMouse = false;
                    _highlightUpdate = false;
                    return;
                }
                _highlightTarget = MonsterDebuggerUtils.getObjectUnderPoint(_stage, new Point(_stage.mouseX, _stage.mouseY));
                if (_highlightTarget != null)
                {
                    highlightDraw(true);
                }
                return;
            }
            if (_highlightTarget != null)
            {
                if (_highlightTarget.stage != null)
                {
                }
                if (_highlightTarget.parent == null)
                {
                    _highlight.removeEventListener(MouseEvent.CLICK, highlightClicked);
                    _highlight.mouseEnabled = false;
                    _highlightTarget = null;
                    _highlightMouse = false;
                    _highlightUpdate = false;
                    return;
                }
                highlightDraw(false);
            }
            return;
        }// end function

        static function set base(param1) : void
        {
            _base = param1;
            return;
        }// end function

        static function handle(param1:MonsterDebuggerData) : void
        {
            if (MonsterDebugger.enabled)
            {
                if (param1.id != null)
                {
                }
                if (param1.id == "")
                {
                    return;
                }
                if (param1.id == MonsterDebuggerCore.ID)
                {
                    handleInternal(param1);
                }
                else
                {
                    if (param1.id in _plugins)
                    {
                    }
                    if (_plugins[param1.id] != null)
                    {
                        MonsterDebuggerPlugin(_plugins[param1.id]).handle(param1);
                    }
                }
            }
            return;
        }// end function

        static function registerPlugin(param1:String, param2:MonsterDebuggerPlugin) : void
        {
            if (param1 in _plugins)
            {
                return;
            }
            _plugins[param1] = param2;
            return;
        }// end function

        static function snapshot(param1, param2:DisplayObject, param3:String = "", param4:String = "") : void
        {
            var _loc_5:* = null;
            var _loc_6:* = null;
            var _loc_7:* = null;
            if (MonsterDebugger.enabled)
            {
                _loc_5 = MonsterDebuggerUtils.snapshot(param2);
                if (_loc_5 != null)
                {
                    _loc_6 = _loc_5.getPixels(new Rectangle(0, 0, _loc_5.width, _loc_5.height));
                    _loc_7 = {command:MonsterDebuggerConstants.COMMAND_SNAPSHOT, memory:MonsterDebuggerUtils.getMemory(), date:new Date(), target:String(param1), reference:MonsterDebuggerUtils.getReferenceID(param1), bytes:_loc_6, width:_loc_5.width, height:_loc_5.height, person:param3, label:param4};
                    send(_loc_7);
                }
            }
            return;
        }// end function

        static function trace(param1, param2, param3:String = "", param4:String = "", param5:uint = 0, param6:int = 5) : void
        {
            var _loc_7:* = null;
            var _loc_8:* = null;
            if (MonsterDebugger.enabled)
            {
                _loc_7 = XML(MonsterDebuggerUtils.parse(param2, "", 1, param6, false));
                _loc_8 = {command:MonsterDebuggerConstants.COMMAND_TRACE, memory:MonsterDebuggerUtils.getMemory(), date:new Date(), target:String(param1), reference:MonsterDebuggerUtils.getReferenceID(param1), xml:_loc_7, person:param3, label:param4, color:param5};
                send(_loc_8);
            }
            return;
        }// end function

        static function clear() : void
        {
            if (MonsterDebugger.enabled)
            {
                send({command:MonsterDebuggerConstants.COMMAND_CLEAR_TRACES});
            }
            return;
        }// end function

        static function get base()
        {
            return _base;
        }// end function

        private static function highlightClicked(event:MouseEvent) : void
        {
            event.preventDefault();
            event.stopImmediatePropagation();
            highlightClear();
            _highlightTarget = MonsterDebuggerUtils.getObjectUnderPoint(_stage, new Point(_stage.mouseX, _stage.mouseY));
            _highlightMouse = false;
            _highlight.removeEventListener(MouseEvent.CLICK, highlightClicked);
            _highlight.mouseEnabled = false;
            if (_highlightTarget != null)
            {
                inspect(_highlightTarget);
                highlightDraw(false);
            }
            send({command:MonsterDebuggerConstants.COMMAND_STOP_HIGHLIGHT});
            return;
        }// end function

        static function hasPlugin(param1:String) : Boolean
        {
            return param1 in _plugins;
        }// end function

        private static function monitorTimerCallback(event:TimerEvent) : void
        {
            var _loc_2:* = NaN;
            var _loc_3:* = NaN;
            var _loc_4:* = 0;
            var _loc_5:* = 0;
            var _loc_6:* = null;
            if (MonsterDebugger.enabled)
            {
                _loc_2 = new Date().time;
                _loc_3 = _loc_2 - _monitorTime;
                _loc_4 = _monitorFrames / _loc_3 * 1000;
                _loc_5 = 0;
                if (_stage == null)
                {
                    if (_base.hasOwnProperty("stage"))
                    {
                        _base.hasOwnProperty("stage");
                    }
                    if (_base["stage"] != null)
                    {
                    }
                    if (_base["stage"] is Stage)
                    {
                        _stage = Stage(_base["stage"]);
                    }
                }
                if (_stage != null)
                {
                    _loc_5 = _stage.frameRate;
                }
                _monitorFrames = 0;
                _monitorTime = _loc_2;
                if (MonsterDebuggerConnection.connected)
                {
                    _loc_6 = {command:MonsterDebuggerConstants.COMMAND_MONITOR, memory:MonsterDebuggerUtils.getMemory(), fps:_loc_4, fpsMovie:_loc_5, time:_loc_2};
                    send(_loc_6);
                }
            }
            return;
        }// end function

        static function breakpoint(param1, param2:String = "breakpoint") : void
        {
            var _loc_3:* = null;
            var _loc_4:* = null;
            if (MonsterDebugger.enabled)
            {
            }
            if (MonsterDebuggerConnection.connected)
            {
                _loc_3 = MonsterDebuggerUtils.stackTrace();
                _loc_4 = {command:MonsterDebuggerConstants.COMMAND_PAUSE, memory:MonsterDebuggerUtils.getMemory(), date:new Date(), target:String(param1), reference:MonsterDebuggerUtils.getReferenceID(param1), stack:_loc_3, id:param2};
                send(_loc_4);
                MonsterDebuggerUtils.pause();
            }
            return;
        }// end function

        private static function highlightClear() : void
        {
            if (_highlight != null)
            {
            }
            if (_highlight.parent != null)
            {
                _highlight.parent.removeChild(_highlight);
                _highlight.graphics.clear();
                _highlight.x = 0;
                _highlight.y = 0;
            }
            if (_highlightInfo != null)
            {
            }
            if (_highlightInfo.parent != null)
            {
                _highlightInfo.parent.removeChild(_highlightInfo);
                _highlightInfo.x = 0;
                _highlightInfo.y = 0;
            }
            return;
        }// end function

    }
}
