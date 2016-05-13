
function Stream() {
    this.callbacks = []
}

Stream.prototype.subscribe = function(func) {
    this.callbacks.push(func);
};

Stream.prototype._push = function(val) {
    for(var i = 0; i < this.callbacks.length; i++){
        var callback = this.callbacks[i];
        callback(val);
    }
};

Stream.prototype._push_many = function(arr) {
    for(var i = 0; i < arr.length; i++){
        var val = arr[i];
        this._push(val);
    }
};

// First
Stream.prototype.first = function() {
    var s = new Stream();
    s.alreadyPushed = false;
    this.subscribe(function(val){
        if (!s.alreadyPushed){
            s.alreadyPushed = true;
            s._push(val);
        }
    });
    return s;
};

// Map
Stream.prototype.map = function(map) {
    var s = new Stream();
    this.subscribe(function(val){
        var mappedVal = map(val);
        s._push(mappedVal);
    });
    return s;
};

// PART 1 HERE

var FIRE911URL = "https://data.seattle.gov/views/kzjm-xkqj/rows.json?accessType=WEBSITE&method=getByIds&asHashes=true&start=0&length=10&meta=false&$order=:id";

window.WIKICALLBACKS = {}

function WIKIPEDIAGET(s, cb) {
    $.ajax({
        url: "https://en.wikipedia.org/w/api.php",
        dataType: "jsonp",
        jsonp: "callback",
        data: {
            action: "opensearch",
            search: s,
            namespace: 0,
            limit: 10,
        },
        success: function(data) {cb(data[1])},
    })
}

$(function() {
    // PART 2 INTERACTIONS HERE

});
