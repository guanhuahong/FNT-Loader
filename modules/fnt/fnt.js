/**
 * Created by Jack on 2014/11/5.
 */
/// <reference path="../jquery/jquery.d.ts" />
var fnt = (function () {
    function fnt(font_name, file_name, file_path) {
        this.font_name = font_name;
        this.file_name = file_name;
        this.file_path = file_path;
        this.is_ready = false;
        this.loaded_res_count = 0;
        this.page_list = [];
        this.page_res_list = [];
        this.char_list = [];
    }
    fnt.prototype.load_file = function () {
        var _this = this;
        var url = this.file_path + "/" + this.file_name;
        $.get(url, function (data) {
            _this.fnt_encode(data);
            _this.load_res();
        });
    };
    fnt.prototype.load_res = function () {
        var _this = this;
        var img, filename;
        var res, len = this.page_list.length;
        for (var i = len - 1; i >= 0; --i) {
            res = {};
            img = document.createElement("img");
            filename = this.page_list[i].file;
            img.src = this.file_path + "/" + filename;
            res.key = filename;
            res.object = img;
            console.log(img.src);
            img.onload = function (e) {
                ++_this.loaded_res_count;
                //console.log(e.currentTarget);
                if (_this.loaded_res_count == len) {
                    _this.is_ready = true;
                    _this._onLoad();
                }
            };
            this.page_res_list.push(res);
        }
    };
    fnt.prototype._onLoad = function () {
        this.onLoad();
    };
    fnt.prototype.onLoad = function () {
        this.update_font();
    };
    fnt.prototype.set_font = function (font_name) {
        this.font_name = font_name;
    };
    fnt.prototype.get_char = function (char_code) {
        for (var i = this.char_list.length - 1; i >= 0; --i) {
            var char = this.char_list[i];
            if (char.id == char_code) {
                return char;
            }
        }
        return null;
    };
    fnt.prototype.update_font = function () {
        var _this = this;
        $("[font-family=" + this.font_name + "]").each(function (number, element) {
            var jelement = $(element);
            var text = jelement.text();
            var charcodes = _this.char2number(text);
            var charcode, char, dom_char;
            var buff = "";
            for (var i = 0, len = charcodes.length; i < len; i++) {
                charcode = charcodes[i];
                char = _this.get_char(charcode);
                if (char) {
                    dom_char = _this.create_dom_char(char);
                    buff += dom_char;
                }
            }
            jelement.append(buff);
        });
    };
    fnt.prototype.create_dom_char = function (char) {
        if (typeof char == "undefined" || char == null) {
            return "";
        }
        var page, image_path;
        if (typeof char.page != "undefined" && char.page != null) {
            page = this.get_page(char.page);
            if (page != null) {
                image_path = this.file_path + "/" + page.file;
            }
            else {
                throw "Error: The page not found.";
            }
        }
        else {
            throw "Error: The page not found.";
        }
        var posx = char.x;
        var posy = char.y;
        var width = char.width;
        var height = char.height;
        var margin_left = -((width - char.xoffset) / 2);
        var margin_top = -((height - char.yoffset) / 2);
        var dom_char;
        dom_char = ['<span style="position: relative;', 'display: inline-block;', 'width: ' + (width) + 'px;', 'height: ' + this.common.lineHeight + 'px;', '">', '<span style="background: url(' + image_path + ') no-repeat ' + (-posx) + 'px ' + (-posy) + 'px;', 'position: absolute;', 'left:50%;', 'top:50%;', 'width: ' + width + 'px;', 'margin-left:' + margin_left + 'px;', 'height: ' + height + 'px;', 'margin-top:' + margin_top + 'px;"></span>', '</span>'];
        return dom_char.join(" ");
    };
    fnt.prototype.get_page = function (id) {
        var page;
        for (var i = this.page_list.length - 1; i >= 0; --i) {
            page = this.page_list[i];
            if (page.id == id) {
                return page;
            }
        }
        return null;
    };
    fnt.prototype.fnt_encode = function (data) {
        var list = data.split(/\r\n/);
        var line, line_list;
        for (var i = list.length - 1; i >= 0; --i) {
            line = list[i];
            if (line.length == 0)
                continue;
            line_list = line.split(/\s+/);
            if (line_list.length > 1) {
                switch (line_list[0]) {
                    case 'info':
                        this.fnt_encode_info(line_list);
                        break;
                    case 'common':
                        this.fnt_encode_common(line_list);
                        break;
                    case 'page':
                        this.fnt_encode_page(line_list);
                        break;
                    case 'chars':
                        this.fnt_encode_chars(line_list);
                        break;
                    case 'char':
                        this.fnt_encode_char(line_list);
                        break;
                }
            }
        }
    };
    fnt.prototype.fnt_encode_info = function (data) {
        var info = {}, param;
        var reg = /\"([^\"]*)\"/;
        for (var i = data.length - 1; i > 0; --i) {
            param = data[i].split("=");
            if (2 == param.length) {
                switch (param[0]) {
                    case "face":
                        var str = param[1].match(reg);
                        if (str.length == 2) {
                            info.face = str[1];
                        }
                        break;
                    case "size":
                        info.size = parseInt(param[1]);
                        break;
                    case "bold":
                        info.bold = parseInt(param[1]);
                        break;
                    case "italic":
                        info.italic = parseInt(param[1]);
                        break;
                    case "charset":
                        var str = param[1].match(reg);
                        if (str.length == 2) {
                            info.charset = str[1];
                        }
                        break;
                    case "unicode":
                        info.unicode = parseInt(param[1]);
                        break;
                    case "stretchH":
                        info.stretchH = parseInt(param[1]);
                        break;
                    case "smooth":
                        info.smooth = parseInt(param[1]);
                        break;
                    case "aa":
                        info.aa = parseInt(param[1]);
                        break;
                    case "padding":
                        var nums = param[1].split(",");
                        info.padding = {
                            left: parseInt(nums[3]),
                            top: parseInt(nums[0]),
                            right: parseInt(nums[1]),
                            bottom: parseInt(nums[2])
                        };
                        break;
                    case "spacing":
                        var nums = param[1].split(",");
                        info.spacing = {
                            left: parseInt(nums[0]),
                            top: parseInt(nums[1])
                        };
                        break;
                    case "outline":
                        info.outline = parseInt(param[1]);
                        break;
                }
            }
        }
        this.info = info;
    };
    fnt.prototype.fnt_encode_common = function (data) {
        var common = {}, param;
        for (var i = data.length - 1; i > 0; --i) {
            param = data[i].split("=");
            if (2 == param.length) {
                switch (param[0]) {
                    case "lineHeight":
                        common.lineHeight = parseInt(param[1]);
                        break;
                    case "base":
                        common.base = parseInt(param[1]);
                        break;
                    case "scaleW":
                        common.scaleW = parseInt(param[1]);
                        break;
                    case "scaleH":
                        common.scaleH = parseInt(param[1]);
                        break;
                    case "pages":
                        common.pages = parseInt(param[1]);
                        break;
                    case "packed":
                        common.packed = parseInt(param[1]);
                        break;
                    case "alphaChnl":
                        common.alphaChnl = parseInt(param[1]);
                        break;
                    case "redChnl":
                        common.redChnl = parseInt(param[1]);
                        break;
                    case "greenChnl":
                        common.greenChnl = parseInt(param[1]);
                        break;
                    case "blueChnl":
                        common.blueChnl = parseInt(param[1]);
                        break;
                }
            }
        }
        this.common = common;
    };
    fnt.prototype.fnt_encode_page = function (data) {
        var reg = /\"([^\"]*)\"/;
        var page = {}, param;
        for (var i = data.length - 1; i > 0; --i) {
            param = data[i].split("=");
            if (2 == param.length) {
                switch (param[0]) {
                    case "id":
                        page.id = parseInt(param[1]);
                        break;
                    case "file":
                        var str = param[1].match(reg);
                        if (str.length == 2) {
                            page.file = str[1];
                        }
                        break;
                }
            }
        }
        this.page_list.push(page);
    };
    fnt.prototype.fnt_encode_chars = function (data) {
        var chars = {}, param;
        for (var i = data.length - 1; i > 0; --i) {
            param = data[i].split("=");
            if (2 == param.length) {
                switch (param[0]) {
                    case "count":
                        chars.count = parseInt(param[1]);
                        break;
                }
            }
        }
        this.chars = chars;
    };
    fnt.prototype.fnt_encode_char = function (data) {
        var char = {}, param;
        for (var i = data.length - 1; i > 0; --i) {
            param = data[i].split("=");
            if (2 == param.length) {
                switch (param[0]) {
                    case "id":
                        char.id = parseInt(param[1]);
                        break;
                    case "x":
                        char.x = parseInt(param[1]);
                        break;
                    case "y":
                        char.y = parseInt(param[1]);
                        break;
                    case "width":
                        char.width = parseInt(param[1]);
                        break;
                    case "height":
                        char.height = parseInt(param[1]);
                        break;
                    case "xoffset":
                        char.xoffset = parseInt(param[1]);
                        break;
                    case "yoffset":
                        char.yoffset = parseInt(param[1]);
                        break;
                    case "xadvance":
                        char.xadvance = parseInt(param[1]);
                        break;
                    case "page":
                        char.page = parseInt(param[1]);
                        break;
                    case "chnl":
                        char.chnl = parseInt(param[1]);
                        break;
                }
            }
        }
        this.char_list.push(char);
    };
    fnt.prototype.char2number = function (chars) {
        var nums = [];
        for (var i = 0, len = chars.length; i < len; i++) {
            nums.push(chars.charCodeAt(i));
        }
        return nums;
    };
    return fnt;
})();
//# sourceMappingURL=fnt.js.map