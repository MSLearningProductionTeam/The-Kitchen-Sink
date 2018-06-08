//*****************Script is still a work in progress**********
//Needs to check for removals and updates
//needs error handling
(function(){
  var textFieldIds = [];
  var cardListIds = [];
  var pingTimer;
  //request permissions for desktop notifications
  Notification.requestPermission().then(function(result) {
    console.log(result);
  });
  $("body").append("<div id='inputBox'><input type='text'></input><button>Submit</button><select><option value='add'>Add</option><option value='remove'>Remove</option><option value='update'>Update</option></select></div>");
  $("#inputBox").css({'position':"absolute",'top':'0px','background':'yellow','left':'50%','transform':'translateX(-50%)','width':'300px','padding':'10px'});


  $("#inputBox button").on("click",function(){
    //how often the crawl should be checked
    var timerSeconds = $("#inputBox input").val();
    //what kind of changes are being looked for
    // Add/Remove/Update card
    var watchFor = $("#inputBox select").val();

    $("#inputBox").remove();
    $( "input[value='Lookup']").trigger("click");


    //get all ids in the text field
    for( var i = 1; i < $("#lookupKCIDs").val().split("G").length; i++){
     textFieldIds.push("G"+ $("#lookupKCIDs").val().split("G")[i].replace(/\r?\n|\r/,""));
    }

   pingTimer = setInterval(function(){
      $( "input[value='Lookup']").trigger("click");

      switch(watchFor){
        case "add":
          checkCardsAdded();
          break;
        case "remove":
          checkCardsRemoved();
          break;
        case "update":
          checkCardsUpdated();
          break;
      }
    },Number(timerSeconds));
  });

//checks if cards added are showing up in search
  function checkCardsAdded (){
    //proceed only once the page has recieved a response from the server
    if($(".loader").css("display") == "none"){
      //get the ids of all cards displayed after a search
        $(".card .card-title.ng-not-empty").each(function(){
          cardListIds.push($(this).text().split(" |")[0]);
        });
        //compare the the ids in the text field to the ids in the cardListIds
        //If a match is found, alert that the item has crawled and remove it from the textFieldIds array
        $.each(textFieldIds,function(index,val){
          $.each(cardListIds,function(subIndex,subVal){
            if(textFieldIds[index] === cardListIds[subIndex]){
              var date = new Date(Date.now());
              var time = date.getHours() + ":" + date.getMinutes();
              createNotification(textFieldIds[index],"Item crawled at "+time);
              textFieldIds.splice(index,1);
              console.log("crawled");
            }
          });
        });
        //once all items have crawled clear the timer
        var date = new Date(Date.now());
        var time = date.getHours() + ":" + date.getMinutes();
        if(textFieldIds.length == 0){clearInterval(pingTimer); createNotification("All Items Crawled","Everything crawled at"+time);}
    }
    else{
      //check if the page has loaded every 250 milliseconds
      setTimeout(checkCards,250);
    }
  }

//checks that deleted cards are not showing up in search
function checkCardsRemoved(){

}
//checks updated cards for new badge
function checkCardsUpdated(){

}

  function createNotification(title,body){
    var options = {
      body: body,
      renotify: false,
      slient: false
    };
    var n = new Notification(title, options);
  }

})();
