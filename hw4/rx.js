
function Stream() {
    this.callbacks = []
}

// PART 1 HERE

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

// Filter
Stream.prototype.filter = function(filter) {
    var s = new Stream();
    this.subscribe(function(val){
        var res = filter(val);
        if (res){
            s._push(val);
        }
    });
    return s;
};

// Flatten
Stream.prototype.flatten = function() {
    var s = new Stream();
    this.subscribe(function(arr){
        for(var i = 0; i < arr.length; i++){
            var val = arr[i];
            s._push(val);
        }
    });
    return s;
};

// Join
Stream.prototype.join = function(s2) {
    var s1 = this;
    var s = new Stream();
    s1.subscribe(function(val){
        s._push(val);
    });
    s2.subscribe(function(val){
        s._push(val);
    });
    return s;
};

// Combine
Stream.prototype.combine = function() {
    var s = new Stream();
    this.subscribe(function(newStream){
        newStream.subscribe(function(val){
            s._push(val);
        });
    });
    return s;
};

// Zip
Stream.prototype.zip = function(B, f) {
    var s = new Stream();
    var A = this;
    A.subscribe(function(val){
        A.lastValue = val;
        if (A.lastValue != null && B.lastValue != null){
            var mappedVal = f(A.lastValue, B.lastValue);
            s._push(mappedVal);
        }
    });
    B.subscribe(function(val){
        B.lastValue = val;
        if (A.lastValue != null && B.lastValue != null){
            var mappedVal = f(A.lastValue, B.lastValue);
            s._push(mappedVal);
        }
    });

    return s;
};

// END PART 1

// timer
Stream.prototype.timer = function(N) {
    var s = this;
    setInterval(function(){
        var currentTime = new Date();
        s._push(currentTime);
    }, N);
};

// dom
Stream.prototype.dom = function(element, eventname) {
    var s = this;
    element.addEventListener(eventname, function(e){
        s._push(e);
    });
};

// dom
Stream.prototype.throttle = function(N) {
    var throttledStream = this;
    var s = new Stream();
    s.allowPush = true;
    setInterval(function(){
        s.allowPush = true;
        if (s.pendingPush){
            s._push(s.pendingPush);
            s.pendingPush = null;
            s.allowPush = false;
        }
    }, N);
    throttledStream.subscribe(function(val){
        if(s.allowPush){
            s.allowPush = false;
            s._push(val);
        } else {
            s.pendingPush = val;
        }
    });
    return s;
};

// url
Stream.prototype.url = function(url) {
    var s = this;
    $.get(url, function(parsedJson){
        s._push(parsedJson);
    }, "json");
};

// latest
Stream.prototype.latest = function() {
    var s = new Stream();
    s.latestStream = null;
    this.subscribe(function(newStream){
        s.latestStream = newStream;
        newStream.subscribe(function(val){
            if (s.latestStream == newStream){
                s._push(val);
            }
        });
    });
    return s;
};

// unique
Stream.prototype.unique = function(f) {
    var s = new Stream();
    s.hashset = {};
    this.subscribe(function(val){
        var id = f(val);
        if (!s.hashset[id]){
            s.hashset[id] = true;
            s._push(val);
        }
    });
    return s;
};

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

var refreshMs = 150;
var wikipediaThrottle = 100;

$(function() {
    // PART 2 INTERACTIONS HERE

    // Timer
    var timerStream = new Stream();
    timerStream.timer(refreshMs);
    timerStream.subscribe(function(val){
        $("#time").text(val);
    });

    // Click count
    var clicksSpan = $("#clicks");
    var button = document.getElementById("button");
    var clickStream = new Stream();
    clickStream.dom(button, "click");
    var clickCount = 0;
    clickStream.subscribe(function(e){
        clickCount++;
        clicksSpan.text(clickCount);
    });

    // Throttled update
    var mousePositionSpan = $("#mouseposition");
    var mouseMoveDiv = document.getElementById("mousemove");
    var mouseMoveStream = new Stream();
    mouseMoveStream.dom(mouseMoveDiv, "mousemove");
    var throttledMouseMove = mouseMoveStream.throttle(1000);
    throttledMouseMove.subscribe(function(e){
        mousePositionSpan.text("X:" + e.pageX + " Y: " + e.pageY);
    });

    // Old implementation
    // Url
    // var urlStream = new Stream();
    // urlStream.url(FIRE911URL);
    // var addressStream = urlStream.flatten().map(function(parsedJson){
    //     // Extract only the address
    //     return parsedJson["3479077"]
    // });
    // addressStream.subscribe(function(address){
    //     $("#fireevents").append($("<li></li>").text(address));
    // });

    // New implementation (P3Q1)
    var minuteStream = new Stream();
    minuteStream.timer(5000); // Make 10 seconds for testing
    minuteStream.subscribe(function (currentTime){
        // Clear the list
        $("#fireevents").empty();

        // Issue a web request
        var urlStream = new Stream();
        urlStream.url(FIRE911URL);
        var fireStream = urlStream.flatten().unique(function(element){
            // Extract unique id's
            return element.id;
        }).map(function(parsedJson){
            // Extract only the address
            return parsedJson["3479077"];
        });
        fireStream.subscribe(function(address){
            $("#fireevents").append($("<li></li>").text(address));
        });
    });
    // Artificially start the first iteration
    minuteStream._push(new Date());

    // Wikipedia throttled search
    var wikipediaInputText = document.getElementById("wikipediasearch");
    var textChangedStream = new Stream();
    textChangedStream.dom(wikipediaInputText, "input");
    var throttledTextChangedStream = textChangedStream.throttle(wikipediaThrottle);

    // This will be a stream of streams - we only want latest from there
    var searchStreams = new Stream();

    // add a stream to searchstreams on every key press
    throttledTextChangedStream.subscribe(function(e){
        // create a new stream for each searching
        var searchStream = new Stream();
        var searchTerm = wikipediaInputText.value;
        WIKIPEDIAGET(searchTerm, function(titles){
            searchStream._push(titles);
        });
        searchStreams._push(searchStream);
    });

    var titlesStream = searchStreams.latest();
    titlesStream.subscribe(function(titles){
        $("#wikipediasuggestions").empty();
        for(var i = 0; i < titles.length; i++){
            var title = titles[i];
            $("#wikipediasuggestions").append($("<li></li>").text(title));
        }
    });
});
