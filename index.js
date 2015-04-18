var Path = require("path");
var fs = require("fs");
var async = require("async");

var fullFileRegex = /^polyfills\.js\?.*$/
var cache = {};


module.exports = {
    BEFORE: "(function(){",
    AFTER: "}());",
    BEFORE_EACH: "",
    AFTER_EACH: "",
    dir: Path.join(__dirname, "..", "..", "polyfills"),
    serialize: function(string) {
        if(fullFileRegex.test(string)) {
            string = string.slice(12);
        }

        return string.split("&").map(decodeURIComponent);
    },
    getCached: function(string) {
        if(string instanceof Array) {
            string = string.map(encodeURIComponent).join("&");
        }

        return cache[string] || false;
    },
    get: function(features, cb) {
        var self = this;
        var cached = this.getCached(features);
        if(cached) {
            return cached;
        }

        if(typeof features === "string") {
            features = this.serialize(features);
        }

        var files = features.map(function(feature) {
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
            body += self.AFTER_EACH;

            cb(null, body);
        });
    }
}