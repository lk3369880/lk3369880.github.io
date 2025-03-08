window.__require = function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
        o = b;
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
}({
  MultTextures: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "9adc5aULtFMOZEhCtCp6XHg", "MultTextures");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getMultMaterial = exports.MultBatch2D = void 0;
    var MultUtils_1 = require("./MultUtils");
    cc.Component.prototype.useMult = false;
    var _textrue = {
      texture: null,
      defalut: new cc.Texture2D(),
      getImpl: function() {
        return this.texture;
      }
    };
    cc.gfx.Texture2D.prototype.texID = -1;
    var _cachdUseCount = 0;
    var _isMultTexture = false;
    var _cacheMaterials = [];
    exports.MultBatch2D = {
      nativeObj: null,
      enable: false,
      parent: null,
      curID: 0,
      incID: 0,
      count: 0,
      hash: 0,
      reset: function() {
        this.count > 0 && this.curID++;
        this.incID += this.count;
        this.count = 0;
      },
      clear: function() {
        var materials = _cacheMaterials;
        for (var i = 0; i < materials.length; i++) {
          var m = materials[i];
          m.destroy();
          m.decRef();
        }
        _cacheMaterials.length = 0;
      }
    };
    var loadMultTextures = function() {
      exports.MultBatch2D.enable = false;
      cc.resources.load("multTextures/Mult-material", cc.Material, function(err, material) {
        if (!err) {
          var cacheMat = cc.Material.getBuiltinMaterial("2d-sprite");
          if (cacheMat) {
            exports.MultBatch2D.hash = MultUtils_1.getMaterialHash(cacheMat);
            exports.MultBatch2D.parent = material;
            exports.MultBatch2D.enable = true;
            material.addRef();
          }
        }
      });
    };
    var getMultMaterial = function(oldMat) {
      exports.MultBatch2D.reset();
      _isMultTexture = false;
      if (!exports.MultBatch2D.enable || !oldMat || !oldMat.isMultTextures) return oldMat;
      if (!exports.MultBatch2D.parent || !exports.MultBatch2D.parent.isValid) {
        loadMultTextures();
        return oldMat;
      }
      var newMat = _cacheMaterials[_cachdUseCount++];
      if (!newMat || !newMat.isValid) {
        var MaterialVariant = cc.MaterialVariant;
        newMat = new MaterialVariant(exports.MultBatch2D.parent);
        _cacheMaterials[_cachdUseCount - 1] = newMat;
        for (var i = 0; i < 8; i++) newMat.setProperty("texture" + i, _textrue.defalut);
        newMat.updateHash(exports.MultBatch2D.hash);
        newMat.define("USE_TEXTURE", true);
        newMat["isMultTextures"] = true;
        newMat["cacheTextures"] = [ -1 ];
        newMat.addRef();
      }
      false;
      _isMultTexture = true;
      return newMat;
    };
    exports.getMultMaterial = getMultMaterial;
    var fillRenderDataTexID = function(cmp, texID) {
      var renderData = cmp._assembler._renderData;
      if (!renderData) return false;
      var uvX = 0;
      var vbuf = renderData.vDatas[0];
      if (cmp.dataDirty) {
        cmp.dataDirty = false;
        for (var i = 0, length = vbuf.length; i < length; i += 5) {
          uvX = ~~(1e5 * vbuf[i + 2]);
          vbuf[i + 2] = 10 * uvX + texID;
        }
      } else if (cmp.texID != texID) for (var i = 0, length = vbuf.length; i < length; i += 5) {
        uvX = ~~(.1 * vbuf[i + 2]);
        vbuf[i + 2] = 10 * uvX + texID;
      }
      cmp.texID = texID;
    };
    var bindMultTexture = function(cmp, material, renderer) {
      if (!_isMultTexture || !material) return;
      var texture = material.effect.passes[0].getProperty("texture");
      if (!texture) {
        console.warn(cmp.node.name, " texture lost !!!!!");
        material.setProperty("texture", _textrue.defalut);
        texture = _textrue.defalut;
      }
      var JSB = false;
      var MB = exports.MultBatch2D;
      var effect = material.effect;
      var id = texture.texID - MB.incID;
      if (id < 0) {
        if (MB.count >= 8) {
          JSB || renderer._flush();
          renderer.material = exports.getMultMaterial(material);
          renderer.node = material.getDefine("CC_USE_MODEL") ? cmp.node : renderer._dummyNode;
        }
        id = MB.count++;
        texture.texID = id + MB.incID;
        var curMaterial = renderer.material;
        var cache = curMaterial["cacheTextures"];
        if (cache[id] !== texture._id) {
          cache[id] = texture._id;
          _textrue.texture = texture;
          curMaterial.setProperty("texture" + id, _textrue);
          curMaterial.effect._dirty = false;
          curMaterial._dirty = false;
        }
      }
      if (JSB) {
        var obj = MB.nativeObj;
        if (material._obj !== obj) {
          material._obj = obj;
          effect._nativeObj.setEffect(obj);
        }
        var hash = MB.curID + .5;
        if (material._hash !== hash) {
          material._hash = hash;
          effect._nativeObj.updateHash(hash);
        }
      }
      fillRenderDataTexID(cmp, id);
    };
    var injectMotionStreak = function() {
      if (cc.MotionStreak) {
        var MotionStreak = cc.MotionStreak.prototype;
        var lateUpdate_1 = MotionStreak.lateUpdate;
        MotionStreak.useMult = true;
        MotionStreak.lateUpdate = function(dt) {
          lateUpdate_1.call(this, dt);
          this._assembler && this._points.length >= 2 && (this.dataDirty = true);
        };
      }
    };
    var injectRenderCmp = function() {
      false;
      var RenderCmp = cc.RenderComponent.prototype;
      RenderCmp.texID = -1;
      RenderCmp.vDitry = true;
      RenderCmp.dataDirty = true;
      Object.defineProperty(RenderCmp, "_vertsDirty", {
        get: function() {
          return this.vDitry;
        },
        set: function(flag) {
          !flag && this.vDitry && (this.dataDirty = true);
          this.vDitry = flag;
        }
      });
      var setMaterial = RenderCmp.setMaterial;
      RenderCmp.setMaterial = function(index, material) {
        var newMat = setMaterial.call(this, index, material);
        this.setVertsDirty();
        return newMat;
      };
      var Material = cc.Material.prototype;
      var getHash = Material.getHash;
      Material.getHash = function() {
        var effect = this._effect;
        if (exports.MultBatch2D.enable && effect && effect._dirty) {
          this["isMultTextures"] = false;
          var uir = this._owner;
          var label = uir instanceof cc.Label;
          var sprite = uir instanceof cc.Sprite;
          if (uir && uir.useMult || sprite || label && !uir._nativeTTF()) {
            var hash = MultUtils_1.getMaterialHash(this);
            if (hash == exports.MultBatch2D.hash) {
              this["isMultTextures"] = true;
              effect._dirty = false;
              effect._hash = hash;
              return hash;
            }
          }
        }
        return getHash.call(this);
      };
      RenderCmp._checkBacth = function(renderer, cullingMask) {
        var material = this._materials[0];
        if (material && material.getHash() !== renderer.material.getHash() || renderer.cullingMask !== cullingMask) {
          true;
          renderer._flush();
          renderer.node = material.getDefine("CC_USE_MODEL") ? this.node : renderer._dummyNode;
          renderer.material = exports.getMultMaterial(material);
          renderer.cullingMask = cullingMask;
        }
        bindMultTexture(this, material, renderer);
      };
      cc.director.on(cc.Director.EVENT_BEFORE_DRAW, function() {
        _cachdUseCount = 0;
        exports.MultBatch2D.reset();
        exports.MultBatch2D.curID = 0;
      });
    };
    var injectToNative = function() {
      true;
      return;
      var MeshRender;
      var onEnable_1;
      var Particles;
      var onEnable_2;
      var RenderFlow;
      var _dirtyTargets;
      var _dirtyWaiting;
      var _rendering;
      var director;
      var empty_cullingMask;
      var empty_node;
      var empty_material;
      var Renderer;
      var FLAG_RENDER;
      var FLAG_DONOTHING;
      var FLAG_POST_RENDER;
      var buildTree;
    };
    cc.game.once(cc.game.EVENT_GAME_INITED, function() {
      var vers = cc.ENGINE_VERSION.split(".");
      if (parseInt(vers[2]) < 3 || parseInt(vers[1]) < 4 || parseInt(vers[0]) < 2) return;
      loadMultTextures();
      injectMotionStreak();
      injectRenderCmp();
      injectToNative();
    });
    cc._RF.pop();
  }, {
    "./MultUtils": "MultUtils"
  } ],
  MultUtils: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "4cc4f2NmTJMGaluoWmweHIF", "MultUtils");
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getMaterialHash = exports.murmurhash2 = exports.serializeUniforms = exports.serializePasses = exports.serializePass = exports.serializeDefines = void 0;
    var hashArray = [];
    function serializeDefines(defines, names) {
      if (names) {
        var len = names.length;
        for (var i = 0; i < len; i++) {
          var name = names[i];
          hashArray[i] = name + defines[name];
        }
        hashArray.length = len;
      } else {
        var i = 0;
        for (var name in defines) hashArray[i++] = name + defines[name];
        hashArray.length = i;
      }
      return hashArray.join("");
    }
    exports.serializeDefines = serializeDefines;
    function serializePass(pass, excludeProperties) {
      void 0 === excludeProperties && (excludeProperties = false);
      var str = pass._programName + pass._cullMode;
      pass._blend && (str += pass._blendEq + pass._blendAlphaEq + pass._blendSrc + pass._blendDst + pass._blendSrcAlpha + pass._blendDstAlpha + pass._blendColor);
      pass._depthTest && (str += pass._depthWrite + pass._depthFunc);
      pass._stencilTest && (str += pass._stencilFuncFront + pass._stencilRefFront + pass._stencilMaskFront + pass._stencilFailOpFront + pass._stencilZFailOpFront + pass._stencilZPassOpFront + pass._stencilWriteMaskFront + pass._stencilFuncBack + pass._stencilRefBack + pass._stencilMaskBack + pass._stencilFailOpBack + pass._stencilZFailOpBack + pass._stencilZPassOpBack + pass._stencilWriteMaskBack);
      str += serializeDefines(pass._defines, pass._defineNames);
      excludeProperties || (str += serializeUniforms(pass._properties, pass._propertyNames));
      return str;
    }
    exports.serializePass = serializePass;
    function serializePasses(passes, uniforms) {
      void 0 === uniforms && (uniforms = false);
      var hashData = "";
      for (var i = 0; i < passes.length; i++) hashData += serializePass(passes[i], uniforms);
      return hashData;
    }
    exports.serializePasses = serializePasses;
    function serializeUniforms(uniforms, names) {
      var index = 0;
      if (names) for (var i = 0, len = names.length; i < len; i++) {
        var param = uniforms[names[i]];
        var prop = param.value;
        if (!prop) continue;
        if (void 0 != prop._id) continue;
        hashArray[index] = prop.toString();
        index++;
      } else for (var name in uniforms) {
        var param = uniforms[name];
        var prop = param.value;
        if (!prop) continue;
        if (void 0 != prop._id) continue;
        hashArray[index] = prop.toString();
        index++;
      }
      hashArray.length = index;
      return hashArray.join(";");
    }
    exports.serializeUniforms = serializeUniforms;
    function murmurhash2(str, seed) {
      var l = str.length, h = seed ^ l, i = 0, k;
      while (l >= 4) {
        k = 255 & str.charCodeAt(i) | (255 & str.charCodeAt(++i)) << 8 | (255 & str.charCodeAt(++i)) << 16 | (255 & str.charCodeAt(++i)) << 24;
        k = 1540483477 * (65535 & k) + ((1540483477 * (k >>> 16) & 65535) << 16);
        k ^= k >>> 24;
        k = 1540483477 * (65535 & k) + ((1540483477 * (k >>> 16) & 65535) << 16);
        h = 1540483477 * (65535 & h) + ((1540483477 * (h >>> 16) & 65535) << 16) ^ k;
        l -= 4;
        ++i;
      }
      switch (l) {
       case 3:
        h ^= (255 & str.charCodeAt(i + 2)) << 16;

       case 2:
        h ^= (255 & str.charCodeAt(i + 1)) << 8;

       case 1:
        h ^= 255 & str.charCodeAt(i);
        h = 1540483477 * (65535 & h) + ((1540483477 * (h >>> 16) & 65535) << 16);
      }
      h ^= h >>> 13;
      h = 1540483477 * (65535 & h) + ((1540483477 * (h >>> 16) & 65535) << 16);
      h ^= h >>> 15;
      return h >>> 0;
    }
    exports.murmurhash2 = murmurhash2;
    function getMaterialHash(material) {
      var hash = "";
      var effect = material._effect;
      effect && (hash += serializePasses(effect.passes, false));
      return murmurhash2(hash, 666);
    }
    exports.getMaterialHash = getMaterialHash;
    cc._RF.pop();
  }, {} ]
}, {}, [ "MultTextures", "MultUtils" ]);