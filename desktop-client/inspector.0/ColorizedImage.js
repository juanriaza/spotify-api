WebInspector.ColorizedImage = function(file, opt_color)
{
	this.file = file;
	this.color = opt_color;
	this._createElement();
};

WebInspector.ColorizedImage._imageCache = {};

WebInspector.ColorizedImage.prototype._createElement = function()
{
    var canvas = document.createElement('canvas');

    var file = this.file;
    var cache = WebInspector.ColorizedImage._imageCache;
    if (!cache[file]) {
    	var self = this;
        var img = new Image();
        img.onload = function() {
        	document.body.appendChild(img);
        	canvas.width = img.width;
        	canvas.height = img.height;
        	document.body.removeChild(img);
            cache[file] = img;
        };
        img.src = file;
    } else {
    	var img = cache[file];
    	canvas.width = img.width;
    	canvas.height = img.height;
    }

    this.node = canvas;
};

WebInspector.ColorizedImage.prototype.setColor = function(color, cb)
{
	if (this.color !== color) {
		this.color = color;
		this.update(cb);
	}
};

WebInspector.ColorizedImage.prototype.update = function(cb)
{
	var file = this.file;
	var image = WebInspector.ColorizedImage._imageCache[file];
	if (!image) {
		var self = this;
		setTimeout(function(){
			self.update(cb);
		}, 15);
		return;
	}

    this.draw(image, cb);
};

WebInspector.ColorizedImage.prototype.draw = function(image, cb)
{
	var canvas = this.node;
	var ctx = canvas.getContext('2d');
	var width = canvas.width;
	var height = canvas.height;
	var toneColor = this.color;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, width, height);
    var newImageData = ctx.createImageData(width, height);

    var utils = WebInspector.ColorizedImage.utils;

    var color;

    for (var y = 0, ly = height; y < ly; y++) {
        for (var x = 0, lx = width; x < lx; x++) {
            color = utils.getColor(imageData, x, y);
            color = utils.manipulateColor(color, toneColor);
            utils.setColor(newImageData, x, y, color);
        }
    }

    ctx.putImageData(newImageData, 0, 0);

    if (typeof cb === 'function') {
    	cb.call(this);
    }
};

WebInspector.ColorizedImage.utils = {

	getColor: function(imageData, x, y)
	{
	    var pixel = ((y * (imageData.width * 4)) + (x * 4));
	    var data = imageData.data;
	    return {
	        red: data[pixel],
	        green: data[pixel + 1],
	        blue: data[pixel + 2],
	        alpha: data[pixel + 3]
	    };
	},

	setColor: function(imageData, x, y, color)
	{
	    var pixel = ((y * (imageData.width * 4)) + (x * 4));;
	    var data = imageData.data;
	    data[pixel] = color.red;
	    data[pixel + 1] = color.green;
	    data[pixel + 2] = color.blue;
	    data[pixel + 3] = color.alpha;
	},

	manipulateColor: function(color, dotColor)
	{
	    var newColor = {
	        red: color.red,
	        green: color.green,
	        blue: color.blue,
	        alpha: color.alpha
	    };

	    if (color.alpha > 0) {
	        var factor = (color.red / 127.5);
	        newColor.red = factor > 1 ? dotColor.red + (1 - (2 - factor)) * (255 - dotColor.red) : factor * dotColor.red;
	        newColor.green = factor > 1 ? dotColor.green + (1 - (2 - factor)) * (255 - dotColor.green) : factor * dotColor.green;
	        newColor.blue = factor > 1 ? dotColor.blue + (1 - (2 - factor)) * (255 - dotColor.blue) : factor * dotColor.blue;
	        newColor.alpha = color.alpha;
	    }

	    return newColor;
	},

	getColorComponents: function(color)
	{
	    var matches = color.match(/rgb\((\d+)\s?,\s?(\d+)\s?,\s?(\d+)\)/);
	    return {
	        red: parseInt(matches[1], 10),
	        green: parseInt(matches[2], 10),
	        blue: parseInt(matches[3], 10),
	        alpha: 1
	    };
	},

	generateNewColor: function(seedText, format)
	{
		var color = seedText ? this.getColorBasedOnSeed(seedText, format) : this.getRandomNewColor(format);
	    return format === 'hex' ? this.getColorString(color) : color;
	},

	getRandomNewColor: function(format) {
		// Create (or get) containers for used colors
	    // First level contains the 12 base colors in the following order:
	    // red, orange, yellow, chartreuse green, green, spring green, cyan, azure, blue, violet, magenta, rose
	    var usedColors = this.usedCategoryColors;
	    if (!usedColors) {
	        usedColors = this.usedCategoryColors = [
	            [], [], [], [], [], [], [], [], [], [], [], []
	        ];
	    }

	    if (!this.usedNumberOfBaseColors) {
	        this.usedNumberOfBaseColors = 0;
	    }

	    var numBaseColors = usedColors.length;
	    var usedNumBaseColors = this.usedNumberOfBaseColors;
	    var baseColorIndex;
	    var baseColor;
	    while (!baseColor || (usedNumBaseColors < numBaseColors && baseColor.length > 0)) {
	        baseColorIndex = Math.floor(Math.random() * (usedColors.length));
	        baseColor = usedColors[baseColorIndex];
	    }

	    var newColor = this.getBaseColor(baseColorIndex);
	    baseColor.push(newColor);
	    this.usedNumberOfBaseColors++;

	    return this.convertToFormat(format, {
	    	format: 'rgb',
	    	red: newColor.red,
	    	green: newColor.green,
	    	blue: newColor.blue
	    });
	},

	getColorBasedOnSeed: function(seedText, format) {
		var sum = this.getCharacterSum(seedText);
		var hue = (sum * sum) % 360;
		var saturation = 0.8;
		var lightness = .41;

		var rgb = this.convertToFormat('rgb', {
			format: 'hsl',
			hue: hue,
			saturation: saturation,
			lightness: lightness
		});

		return this.convertToFormat('hex', rgb);
	},

	getColorString: function(color) {
		if (color.format === 'hex') {
			return '#' + color.red + color.green + color.blue;
		}
		return '';
	},

	convertToFormat: function(format, color) {
		var methodName = color.format + '_to_' + format;
		if (this[methodName]) {
			return this[methodName](color);
		}
		return color;
	},

	hsl_to_rgb: function(color) {
		var h = color.hue;
		var s = color.saturation;
		var l = color.lightness;
		var r, g, b;

		if (s === 0) {
			r = g = b = l; // achromatic
		} else {
			h = h / 360;
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = this.hueToRGB(p, q, h + 1/3);
			g = this.hueToRGB(p, q, h);
			b = this.hueToRGB(p, q, h - 1/3);
		}

		return {
			format: 'rgb',
			red: Math.round(r * 255),
			green: Math.round(g * 255),
			blue: Math.round(b * 255),
			alpha: 1
		};
	},

	hueToRGB: function(p, q, t) {
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		if(t < 1/6) return p + (q - p) * 6 * t;
		if(t < 1/2) return q;
		if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	},

	rgb_to_hex: function(color) {
		var color = {
			format: 'hex',
			red: color.red.toString(16),
			green: color.green.toString(16),
			blue: color.blue.toString(16)
		};
		color.red = color.red === '0' ? '00' : color.red;
		color.green = color.green === '0' ? '00' : color.green;
		color.blue = color.blue === '0' ? '00' : color.blue;
		return color;
	},

	hex_to_rgb: function(color) {
		return {
			format: 'rgb',
			red: parseInt(color.red, 16),
			green: parseInt(color.green, 16),
			blue: parseInt(color.blue, 16)
		};
	},

	adjustLightness: function(color, amount) {
		if (typeof color !== 'string') return color;
		if (color.charAt(0) !== '#') return color;

		color = this.convertToFormat('rgb', {
			format: 'hex',
			red: color.substr(1, 2),
			green: color.substr(3, 2),
			blue: color.substr(5, 2)
		});

		color.red = Math.round(Math.min(Math.max(color.red + 255 * (amount / 100), 0), 255));
		color.green = Math.round(Math.min(Math.max(color.green + 255 * (amount / 100), 0), 255));
		color.blue = Math.round(Math.min(Math.max(color.blue + 255 * (amount / 100), 0), 255));

		color = this.convertToFormat('hex', color);
		return this.getColorString(color);
	},

	getBaseColor: function(index)
	{
	    // Indexes within the usedRecordIconColors array of base colors
	    var red255 = [0, 1, 2, 10, 11];
	    var red127 = [3, 9];
	    var green255 = [2, 3, 4, 5, 6];
	    var green127 = [1, 7];
	    var blue255 = [6, 7, 8, 9, 10];
	    var blue127 = [5, 11];

	    var maxValue = 210;
	    var middleValue = 127;

	    return {
	        red: ~red255.indexOf(index) ? maxValue : (~red127.indexOf(index) ? middleValue : 0),
	        green: ~green255.indexOf(index) ? maxValue : (~green127.indexOf(index) ? middleValue : 0),
	        blue: ~blue255.indexOf(index) ? maxValue : (~blue127.indexOf(index) ? middleValue : 0),
	        alpha: 1
	    };
	},

	getCharacterSum: function(seedText)
	{
		var sum = 0;
		for (var i = 0, l = seedText.length; i < l; i++) {
			sum += seedText.charCodeAt(i);
		}
		return sum;
	}
};