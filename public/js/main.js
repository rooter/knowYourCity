var AppRouter = Backbone.Router.extend({

    routes: {
        ""                  : "home",
        "about"             : "about",
        "directions/:id"    : "directions",
        "game/:id"          : "game",
        "end"               : "end"
    },

    initialize: function () {
        this.headerView = new HeaderView();
        $('.header').html(this.headerView.el);
    },

    home: function (id) {
        if (!this.homeView) {
            this.homeView = new HomeView();
        }
        $('#content').html(this.homeView.el);
    },

    directions: function (id) {
        if (!this.directionsView) {
            this.directionsView = new DirectionsView();
        }
        $('#content').html(this.directionsView.el);
    },

    game: function (id) { 
        var self = this;

        var city = new City({_id: id});
        city.fetch({success: function(){

            if (!this.gameView) {
                this.gameView = new GameView();
            }
            $('#content').html(this.gameView.el);

            

            $('#skip').on('click',function(e){
                $.get("skip", function(data){
                    $('#skip').val('skips: '+data.skips);
                    $('#poi').text(data.nextPoi);
                    if(data.skips === 0){
                        $('#skip').attr("disabled","disabled");
                    }
                });
            });

            $.get("startGame", function(data){
                $('#poi').text(data.nextPoi);
                $('#score span').text(data.score);

                $('#skip').val('skips: 2').removeAttr("disabled"); //TODO Add skip # to startGame service
            }); 

           var styleArray = [
                  {
                    "featureType": "poi.park",
                    "stylers": [
                      { "visibility": "off" }
                    ]
                  },{
                    "featureType": "poi.business",
                    "stylers": [
                      { "visibility": "off" }
                    ]
                  },{
                  }
                ];

            var mapOptions = {  //Need to store this info in city collection
              center: new google.maps.LatLng(city.get('center')[0], city.get('center')[1]),
              zoom: 12,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              disableDefaultUI: true,
              draggable: false,
              disableDoubleClickZoom: true,
              keyboardShortcuts: false,
              styles: styleArray
            };


            var map = new google.maps.Map(document.getElementById("map_canvas"),mapOptions);
            self.startTimer();

            google.maps.event.addListener(map, 'click', function(event) {
                var lat = event.latLng.Ya;
                var lon = event.latLng.Za;
                var circle,color,actualPos,circleOptions;
                $.get("guess/"+lat+"/"+lon, function(data){

                    $('#score span').text(data.score);
                    $('#poi').text(data.nextPoi);

                    color = (data.distance > 2000) ? '#ff0000' : '#00ff00';

                    actualPos = new google.maps.LatLng(data.actualPos[0],data.actualPos[1]);

                    circleOptions = {
                      fillColor: color,
                      fillOpacity: .6,
                      strokeOpacity: 0,
                      map: map,
                      center: actualPos,
                      radius: data.distance
                    };
                    circle = new google.maps.Circle(circleOptions); 
                    setTimeout(function(){
                        circle.setMap(null);
                    },250);
                }); 
            });
        }});    
    },

    startTimer: function(){
        var startTime = Math.round(new Date().getTime() / 1000);
        var currentTime = startTime;
        var timeLeft = 30;
        Poll.start({
            name: "timer",
            interval: 1000,
            action: function(){
                currentTime = Math.round(new Date().getTime() / 1000);
                timeLeft = 30 - (currentTime-startTime);
                $('#timer').text(timeLeft);
                if(timeLeft <= 0){
                    Poll.stop("timer");
                    $('#map_canvas').html("<h1>GAME OVER</h1>");
                    $('#poi').text('-');
                    $('#skip').attr("disabled","disabled");
                    var interval = setInterval(function(){
                        $.get("endGame", function(data){
                            clearInterval(interval);
                            app.navigate('#end',{trigger: true, replace: true});
                        }); 
                    },3000);
                }
            }
        });
    },
    end: function () {
        var self = this;
        if (!this.endView) {
            this.endView = new EndView();
        }

        $('#content').html(this.endView.el);    
        
        self.populateHighScore();



        $('#sub').on('click',function(e){
            $.get('subHighScore/'+$('#initials').val(),function(){
                $('#sub').off('click');
                $('#scoreSub').hide();
                self.populateHighScore();
            });
        });

        $.get('getScore',function(data){
            $('.yourScore span').text(data.score);
            if(data.score > $('td:last').text()){
                $('.recordScore').show();
            }else{
                $('.recordScore').hide();
            }
        });


    },
    populateHighScore: function(){
        $('.topScores tbody').empty();
        $.get("getHighScores", function(data){
            for(var x=0;x<data.length && x<10;x++){
                $('.topScores tbody').append('<tr><td>'+data[x].name+'</td><td>'+data[x].score+'</td></tr>');
            }
        });
    },
    //Not used because of performance issues
    polygonFadeout: function (polygon, seconds, callback){
        var fill = (polygon.fillOpacity*50)/(seconds*999),
        fadeout = setInterval(function(){
            if(polygon.strokeOpacity + polygon.fillOpacity <= 0.0){
                clearInterval(fadeout);
                polygon.setVisible(false);
                if(typeof(callback) == 'function')
                    callback();
                return;
            }
            polygon.setOptions({
                'fillOpacity': Math.max(0, polygon.fillOpacity-fill)
            });
        }, 50);
    }, 
    about: function () {
        var self = this;
        if (!this.aboutView) {
            this.aboutView = new AboutView();
        }
        $('#content').html(this.aboutView.el);

        var styleArray = [
              {
                "featureType": "poi.park",
                "stylers": [
                  { "visibility": "off" }
                ]
              },{
                "featureType": "poi.business",
                "stylers": [
                  { "visibility": "off" }
                ]
              },{
              }
            ];

        var mapOptions = {  //Need to store this info in city collection
          center: new google.maps.LatLng(37.768327,-122.438421),
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          // disableDefaultUI: true,
          // draggable: false,
          // disableDoubleClickZoom: true,
          // keyboardShortcuts: false,
          styles: styleArray
        };

        var map = new google.maps.Map(document.getElementById("map_canvas"),mapOptions);

        $.get("getAllPoi", function(data){
            self.setMarkers(map,data);
        }); 

    },
     setMarkers:   function (map, locations) {
          for (var i = 0; i < locations.length; i++) {
                var poi = locations[i];
                var myLatLng = new google.maps.LatLng(poi.loc[0], poi.loc[1]);
                var marker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    title: poi.name
                });
          }
        }
});

utils.loadTemplate(['HomeView', 'HeaderView', 'AboutView','DirectionsView', 'GameView','EndView'], function() {
    app = new AppRouter();
    Backbone.history.start();
});