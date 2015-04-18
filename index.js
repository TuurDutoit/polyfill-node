var Path = require("path");
var fs = require("fs");
var async = require("async");

var fullFileRegex = /^polyfills\.js\?.*$/


module.exports = {
    BEFORE: "(function(){",
    AFTER: "}());",
    BEFORE_EACH: "",
    AFTER_EACH: "",
    cache: {},
    
    dir: Path.join(__dirname, "polyfills"),
    deserialize: function(string) {
        if(fullFileRegex.test(string)) {
            string = string.slice(13);
        }

        return string.split("&").map(decodeURIComponent);
    },
    serialize: function(features) {
        return features.sort(function(a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        }).map(encodeURIComponent).join("&");
    },
    getCached: function(string) {
        if(string instanceof Array) {
            string = this.serialize(string);
        }

        return this.cache[string] || false;
    },
    setCached: function(features, body) {
        if(features instanceof Array) {
            features = this.serialize(features);
        }
        
        this.cache[features] = body;
        
        return this;
    },
    get: function(features, cb) {
        var self = this;
        
        if(features instanceof Array) {
            var featuresArray = features;
            var featuresString = this.serialize(features);
        }
        else {
            var featuresString = features;
            var featuresArray = this.deserialize(features);
        }
        
        var cached = this.getCached(featuresString);
        if(cached) {
            return cached;
        }


        var files = featuresArray.map(function(feature) {
            return Path.join(self.dir, feature+".js");
        });

        async.map(files, fs.readFile, function(err, results) {
            if(err) {
                return cb(err);
            }

            var body = self.BEFORE;
            body += results.map(function(res) {
                return self.BEFORE_EACH + res + self.AFTER_EACH;
            }).join("");
            body += self.AFTER;
            
            self.setCached(featuresString, body);

            cb(null, body);
        });
    }
}