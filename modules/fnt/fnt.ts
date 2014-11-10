/**
 * Created by Jack on 2014/11/5.
 */

/// <reference path="../jquery/jquery.d.ts" />



interface fnt_Padding{
    left:number; //3
    top:number; // 0
    right:number; // 1
    bottom:number; // 2
}

interface fnt_Spacing{
    left:number;
    top:number;
}

interface fnt_info{
    face:string;
    size:number;
    bold:number;
    italic:number;
    charset:string;
    unicode:number;
    stretchH:number;
    smooth:number;
    aa:number;
    padding:fnt_Padding; // 需要描边，则padding值必须大于或等于描边宽度
    spacing:fnt_Spacing; // 图片字体间距 3px
    outline:number;
}

interface fnt_common{
    lineHeight:number;
    base:number;
    scaleW:number;
    scaleH:number;
    pages:number;
    packed:number;
    alphaChnl:number;
    redChnl:number;
    greenChnl:number;
    blueChnl:number;
}

interface fnt_page{
    id:number;
    file:string;
}

interface fnt_chars{
    count:number;
}

interface fnt_char{
    id:number;
    x:number;
    y:number;
    width:number; // 实际宽度 + padding.left + padding.right
    height:number; // 实际高度 + padding.top + padding.bottom
    xoffset:number;
    yoffset:number;
    xadvance:number;
    page:number;
    chnl:number;
}

interface fnt_res{
    key:string;
    object:HTMLImageElement;
}

class fnt{
    file_path : string;
    file_name : string;
    font_name : string;
    info:fnt_info;
    common:fnt_common;
    page_list:fnt_page[];
    page_res_list:fnt_res[];
    loaded_res_count:number;
    chars:fnt_chars;
    char_list:fnt_char[];
    is_ready: boolean;
    constructor(font_name : string, file_name : string, file_path : string){
        this.font_name = font_name;
        this.file_name = file_name;
        this.file_path = file_path;

        this.is_ready = false;
        this.loaded_res_count = 0;
        this.page_list = [];
        this.page_res_list = [];
        this.char_list = [];
    }
    load_file (){
        var url:string = this.file_path + "/" + this.file_name;
        $.get(url,(data:string)=>{
            this.fnt_encode(data);
            this.load_res();
        });
    }
    load_res (){
        var img:HTMLImageElement,filename:string;
        var res:fnt_res,len:number = this.page_list.length;
        for(var i:number = len - 1;i>=0;--i){
            res = <fnt_res>{};
            img = document.createElement("img");
            filename = this.page_list[i].file;
            img.src = this.file_path + "/" + filename;
            res.key = filename;
            res.object = img;
            console.log(img.src);
            img.onload = (e)=>{
                ++this.loaded_res_count;
                //console.log(e.currentTarget);
                if(this.loaded_res_count == len){
                    this.is_ready = true;
                    this._onLoad();
                }
            }
            this.page_res_list.push(res);
        }
    }
    _onLoad(){
        this.onLoad();
    }
    onLoad(){
        this.update_font();
    }
    set_font(font_name:string){
        this.font_name = font_name;
    }
    get_char(char_code:number):fnt_char{
        for(var i:number = this.char_list.length - 1;i >= 0;--i){
            var char:fnt_char = this.char_list[i];
            if (char.id == char_code){
                return char;
            }
        }
        return null;
    }
    update_font(){
        $("[font-family="+this.font_name+"]").each((number,element)=>{
            var jelement:any = $(element);
            var text:string = jelement.text();
            var charcodes:number[] = this.char2number(text);
            var charcode:number,char:fnt_char,dom_char:string;
            var buff:string = "";
            for(var i:number = 0,len:number = charcodes.length;i<len;i++){
                charcode = charcodes[i];
                char = this.get_char(charcode);
                if(char){
                    dom_char = this.create_dom_char(char);
                    buff += dom_char;
                }
            }
            jelement.append(buff);
        })
    }
    create_dom_char(char:fnt_char):string{
        if(typeof char == "undefined" || char == null){
            return "";
        }
        var page:fnt_page,image_path:string;

        if (typeof char.page != "undefined" && char.page != null){
            page = this.get_page(char.page);
            if(page!=null){
                image_path = this.file_path + "/" + page.file;
            }else{
                throw "Error: The page not found.";
            }
        }else{
            throw "Error: The page not found.";
        }
        var posx:number = char.x;
        var posy:number = char.y;
        var width:number = char.width;
        var height:number = char.height;
        var margin_left:number = -((width - char.xoffset) / 2);
        var margin_top:number = -((height - char.yoffset) / 2);

        var dom_char:string[];
        dom_char = ['<span style="position: relative;' ,
            'display: inline-block;' ,
            'width: '+(width)+'px;' ,
            'height: '+this.common.lineHeight+'px;' ,
            '">' ,
            '<span style="background: url('+image_path+') no-repeat '+(-posx)+'px '+(-posy)+'px;' ,
            'position: absolute;' ,
            'left:50%;' ,
            'top:50%;' ,
            'width: '+width+'px;' ,
            'margin-left:'+ margin_left +'px;' ,
            'height: '+height+'px;' ,
            'margin-top:'+ margin_top +'px;"></span>' ,
            '</span>'];
        return dom_char.join(" ");
    }
    get_page(id:number):fnt_page{
        var page:fnt_page;
        for(var i:number = this.page_list.length - 1; i>=0; --i){
            page = this.page_list[i];
            if(page.id == id){
                return page;
            }
        }
        return null;
    }
    fnt_encode (data:string){
        var list:string[] = data.split(/\r\n/);
        var line,line_list:string[];
        for(var i:number = list.length - 1;i>=0;--i){
            line = list[i];
            if(line.length == 0) continue;
            line_list = line.split(/\s+/);
            if(line_list.length > 1){
                switch (line_list[0]){
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
    }
    fnt_encode_info(data:string[]){
        var info:fnt_info = <fnt_info>{},param:string[];
        var reg:RegExp = /\"([^\"]*)\"/
        for(var i:number = data.length - 1;i>0;--i){
            param = data[i].split("=");
            if(2 == param.length){
                switch (param[0]){
                    case "face":
                        var str:string[] = param[1].match(reg);
                        if (str.length == 2){
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
                        var str:string[] = param[1].match(reg);
                        if (str.length == 2){
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
                        var nums:string[] = param[1].split(",");
                        info.padding = <fnt_Padding>{
                            left:parseInt(nums[3]),
                            top:parseInt(nums[0]),
                            right:parseInt(nums[1]),
                            bottom:parseInt(nums[2])
                        };
                        break;
                    case "spacing":
                        var nums:string[] = param[1].split(",");
                        info.spacing = <fnt_Spacing>{
                            left:parseInt(nums[0]),
                            top:parseInt(nums[1])
                        };
                        break;
                    case "outline":
                        info.outline = parseInt(param[1]);
                        break;
                }
            }
        }
        this.info = info;
    }
    fnt_encode_common(data:string[]){
        var common:fnt_common = <fnt_common>{},param:string[];
        for(var i:number = data.length - 1;i>0;--i) {
            param = data[i].split("=");
            if(2 == param.length) {
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
    }
    fnt_encode_page(data:string[]){
        var reg:RegExp = /\"([^\"]*)\"/;
        var page:fnt_page = <fnt_page>{},param:string[];
        for(var i:number = data.length - 1;i>0;--i) {
            param = data[i].split("=");
            if(2 == param.length) {
                switch (param[0]) {
                    case "id":
                        page.id = parseInt(param[1]);
                        break;
                    case "file":
                        var str:string[] = param[1].match(reg);
                        if (str.length == 2){
                            page.file = str[1];
                        }
                        break;
                }
            }
        }
        this.page_list.push(page);
    }
    fnt_encode_chars(data:string[]){
        var chars:fnt_chars = <fnt_chars>{},param:string[];
        for(var i:number = data.length - 1;i>0;--i) {
            param = data[i].split("=");
            if(2 == param.length) {
                switch (param[0]) {
                    case "count":
                        chars.count = parseInt(param[1]);
                        break;
                }
            }
        }
        this.chars = chars;
    }
    fnt_encode_char(data:string[]){
        var char:fnt_char = <fnt_char>{},param:string[];
        for(var i:number = data.length - 1;i>0;--i) {
            param = data[i].split("=");
            if(2 == param.length) {
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
    }
    char2number(chars:string):number[]{
        var nums:number[] = [];
        for(var i:number = 0,len:number = chars.length;i<len;i++){
            nums.push(chars.charCodeAt(i));
        }
        return nums;
    }
}