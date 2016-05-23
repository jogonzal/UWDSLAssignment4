
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

// throttle
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

    // Old implementation - commented out
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

    // var searchInputElement = document.getElementById("firesearch");

    // New implementation (P3) - commented out since optimized version is running
    // var minuteStream = new Stream();
    // minuteStream.timer(60000); // Reduce time here for testing
    // var listOfAddress = [];
    // var uiNotificationStream = new Stream();
    // uiNotificationStream.subscribe(function(val){
    //     // Clear the list and display all the elements
    //     $("#fireevents").empty();
    //     for(var i = 0; i < listOfAddress.length; i++){
    //         var address = listOfAddress[i];
    //         var shouldInclude = true;
    //         if (searchInputElement.value != ""){
    //             shouldInclude = address.indexOf(searchInputElement.value) != -1;
    //         }
    //         if (shouldInclude){
    //             $("#fireevents").append($("<li></li>").text(address));
    //         }
    //     }
    // });
    //
    // var uniquenessStream = new Stream();
    // uniquenessStream.unique(function(element){
    //     // Extract unique id's - will never repeat them
    //     return element.id;
    // }).map(function(parsedJson){
    //     // Extract only the address
    //     return parsedJson["3479077"];
    // }).subscribe(function(address){
    //     listOfAddress.push(address);
    //     // Notify UI update
    //     uiNotificationStream._push(new Date());
    // });
    //
    // minuteStream.subscribe(function (currentTime){
    //     // Issue a web request
    //     listOfAddress = [];
    //     var urlStream = new Stream();
    //     urlStream.url(FIRE911URL);
    //
    //     var individualAddressStream = urlStream.flatten();
    //     individualAddressStream.subscribe(function(val){
    //         uniquenessStream._push(val);
    //         uiNotificationStream._push(new Date());
    //     });
    // });
    //
    // var searchStream = new Stream();
    // searchStream.dom(searchInputElement, "input");
    // var mappedStream = searchStream.subscribe(function(e){
    //     // Notify UI update
    //     uiNotificationStream._push(new Date());
    // });
    //
    // // Artificially start the first iteration
    // minuteStream._push(new Date());


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

// FOOD FOR THOUGHT ANSWER
/*
If this library had access to an AST, it could have made a few smart optimizations similar to HW2, since it would be
able to analyze the tree before running - it would be able to replace it with a functionally equivalent but more efficient
tree.
An example of the optimizations that can be done is on array processing - when we see a:
    .uri() // Returns an array
    .flatten().unique().map().filter()...
This means that an array is being iterated on multiple times to be filtered, mapped, and unique'd.
A possible optimization here is to replace some of those nodes with an internal node type. For example,
    .flatten().map(mappingFunc).filter(filteringFunc)
    .flattenWithMapAndFilter(mappingFunc, filteringFunc)
Subscribing to the stream that is flattened and implementing this in a for loop would be equivalent. That is the path
I chose for this HW below.
 */
 var searchInputElement = document.getElementById("firesearch")

 var minuteStream = new Stream();
 minuteStream.timer(5000); // Reduce time here for testing
 var fullList = null;
 var uiNotificationStream = new Stream();
 uiNotificationStream.subscribe(function(val){
     // flattenWithMapAndFilter Optimization: map and filter happen here
     $("#fireevents").empty();
     if (fullList == null){
         return;
     }
     for(var i = 0; i < fullList.length; i++){
         var address = fullList[i];
         address = address["3479077"];

         var shouldInclude = true;
         if (searchInputElement.value != ""){
             shouldInclude = address.indexOf(searchInputElement.value) != -1;
         }
         if (shouldInclude){
             $("#fireevents").append($("<li></li>").text(address));
         }
     }
 });
 var uniquenessVar = {};
 var uniquenessStream = new Stream();
 uniquenessStream.subscribe(function(arr){
     // Extract unique id's - will never repeat them
     var res = [];
     for(var i = 0; i < arr.length; i++){
         var elem = arr[i];
         var shouldInclude =  uniquenessVar[elem.id] == null;
         uniquenessVar[elem.id] = elem;
         if (shouldInclude){
             res.push(elem);
         }
     }
     fullList = res;
   uiNotificationStream._push(res);
 });

 minuteStream.subscribe(function (currentTime){
     // Issue a web request
     listOfAddress = [];
     var urlStream = new Stream();
     urlStream.url(FIRE911URL);

     urlStream.subscribe(function(val){
         uniquenessStream._push(val);
     });
 });

 var searchStream = new Stream();
 searchStream.dom(searchInputElement, "input");
 var mappedStream = searchStream.subscribe(function(e){
     // Notify UI update
     uiNotificationStream._push(fullList);
 });

 // Artificially start the first iteration
 minuteStream._push(fullList);

});