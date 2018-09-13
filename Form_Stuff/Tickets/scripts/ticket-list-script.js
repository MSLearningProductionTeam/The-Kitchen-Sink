window.onload = function(){
  //globals variables
  //absolute site collection url
  var siteUrl;
  //array tha contains all returned user list items
  var listItems;
  //an array of list item properties
  //used to specify which of the returned list item properties will be used in the program
  //and which form input field the list property value is be placed in
  var properties;
  //array of days in the week
  var daysOfTheWeek;
  //array of the months in the year
  var monthsOfTheYear;
  //array of possible values for the footer banner
  var footerValues;
  //the sharepoint id of the item currently being edited
  var currentEditItemId;

  //call the initalize function
  init();

  //initialization function
  function init(){
    //define the global variables
    if(typeof _spPageContextInfo !== 'undefined'){siteUrl = _spPageContextInfo.webAbsoluteUrl;}
    listItems = [];
    properties = ["Attachments","CoOwner","Comments","Confidentiality","Details","DocumentTitle","FileName","Owner","PageTitle","PageURL","ProductGroup","PublishDate","RequestDetails","ShortDescription","SourceFileLocation","deleteContent"];
    daysOfTheWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturdate"];
    monthsOfTheYear = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    footerValues = [
      "New /Learning Publishing Request: Windows Devices Group - Publishing Request (add new content)",
      "New /Learning Publishing Request: Windows Devices Group - Publishing Request (update existing content)",
      "New /Learning Publishing Request: Windows Devices Group - Publishing Request (remove content)",
      "New /Learning Publishing Request: Windows Devices Group - Publishing Request (request multiple items)",
      "New /Learning Publishing Request: Windows Devices Group - Publishing Request (do something not listed here)"
    ];
    //start the program by getting the current user
    getUser();
  }

  //gets the current user's sharepoint profile info
  function getUser(){
    $.ajax({
        url: siteUrl + "/_api/web/currentUser",
        Type:'GET',
        headers: {
          accept: "application/json;odata=verbose"
        }
    }).done(function(data){
      //set the date and time in the top banner
      setDateAndTime(data.d.Title);
      //get user list items
      //the query string to specify what items are returned for the user's list items
      var query = "?$select=ID,RequestType1,Title,Created,TimeStamp,RequestDetails,Attachments,SourceFileLocation,ShortDescription,Confidentiality,ProductGroup,Comments,Details,DocumentTitle,FileName,PageTitle,RequestTypeTitle,Owner,CoOwner,PublishDate,PageURL&$orderby=ID%20desc&$filter=RequestType1 ne 'Update Existing Ticket' and Request_x0020_State ne 'Completed' and Request_x0020_State ne 'Rejected'";
      getUserListItems(data.d.Id,query);
    });
  }

  //gets all of the list items for the user based on the query string specified
  //userId => the id of the user, returned by getUser
  //queryString => string that specifies the parameters of the search for the users list items
  function getUserListItems(userId,queryString){
    $.ajax({
        url: siteUrl + "/_api/web/lists/GetByTitle('WDGIntakeForm')/items"+queryString+" and AuthorId eq "+userId+"",
        Type:'GET',
        headers: {
          accept: "application/json;odata=verbose"
        }
    }).done(function(data){
      //if no items were returned add text to the list that says the user has no items
      if(data.d.results.length <= 0){
        var htmlString = "<div style='text-align:center;'>You have no open tickets</div>";
        $("#ticketList").append(htmlString);
      }
      else{
        //otherwise loop through the returned results and add each to the listItems array
        $.each(data.d.results,function(i,val){
          //add each list item to the global object
          listItems.push(this);
          //add each list item to the screen
          var htmlString = "<div class='ticket' data-ticketNum='"+i+"' data-requestType='"+this.RequestType1+"' data-listId='"+this.ID+"'><div><div class='editBtn'>...</div></div><div>"+this.ID+"</div><div>"+this.RequestType1+"</div><div>"+this.Title+"</div><div>"+this.Created.substring(0,10)+"</div>";
          $("#ticketList").append(htmlString);
        });
        //attach the needed events
        attachEvents();
      }
    });
  }

  //attachs all the events the program needs to function
  function attachEvents(){
      //the click even on each list item edit button
      $(".editBtn").on("click",function(){
        //the id of the list item on sharepoint
        currentEditItemId = $(this).parent().parent().attr("data-listId");
        //the number of the ticket clicked on, specified in the html
        //this number cooresponds to the tickets position in the listItems array
        var ticketNum = $(this).parent().parent().attr("data-ticketNum");
        //show the edit item view
        showEditView(ticketNum);
      });
      //submit button click event
      $("#addBtn").on("click",function(){
        //submit the information provied to the sharepoint list
        submitChangeRequest(currentEditItemId);
      });
      //go back button click event
      $("#cancelBtn").on("click",function(){
        //cloes the edit view
        closeForm();
      });
      //new request click event
      $("#newRequestBtn").on("click",function(){
        //redirects back to the intake form page
        window.location = "https://microsoft.sharepoint.com/sites/Infopedia_G02Pages/WDG-Intake-Form-POC.aspx";
      });
  }
  //shows the list item edit view
  //ticketNum => the position of the list item to edit in the listItems array
  function showEditView(ticketNum){
    //the object containing all the list item data
    var ticket = listItems[ticketNum];
    //the type of form that the ticket data should be shown in, based on the request type
    //this is used to set the text in the footer as well as show the correct form class
    var formType;
    switch(ticket.RequestType1){
      case "add new content":
        formType = 0;
        break;
      case "update existing content":
        formType = 1
        break;
      case "remove content":
        formType = 2;
        break;
      case "request multiple items":
        formType = 3;
        break;
      case "do something not listed here":
        formType = 4;
        break;
    }
    //loop though the properties array and check each property in the ticket object
    $.each(properties,function(i,val){
      //if the specified property is null then no value was provided when the initial form was submitted
      //if the value is not null then a value was provided and we should fill that value into the correct form input
      if(ticket[val] !== null){
        $(".formInput[data-property='"+val+"']").val(ticket[val]);
      }
    });
    //update the text in the footer
    $("#intakeFormFooter").html(footerValues[formType]);
    //hide all intake sections
    $(".intakeFormSection").addClass("hidden");
    //show the correct form
    $(".Form"+(formType + 1)).removeClass("hidden");
    //hide the list view
    $("#listView").addClass("hidden");
    //show the form view
    $("#formView").removeClass("hidden");
  }

  //updates the sharepoint list item's changeReason and changeRequest fields with the change request information
  //itemId => the id of the list item on sharepoint
  function submitChangeRequest(itemId){
    //only proceed with the http request after the provided information has been valideted and the form digest and list type have been obtained
      $.when(
        validation(),
        getFormDigest(),
        getListType()
      ).then(function(validation,digest,listType){
        //gather the data to send
        var formData = gatherFormData();
        $.ajax({
            url: siteUrl + "/_api/web/lists/getbytitle('WDGIntakeForm')/items("+itemId+")",
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(formData),
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": digest[0].d.GetContextWebInformation.FormDigestValue,
                "X-HTTP-Method": "MERGE",
                "If-Match": "*"
            },
            success: function (successData) {
              alert(" Your request was sucessfully submitted");
              //close the form
              closeForm();
            },
            error: function (data) {
              alert("There was an issue submitting your request");
              console.log(data);
              closeForm();
            }
        });

      });
  }
  //validates the provided information
  function validation(){
    var promise = $.Deferred();
    //check that each required input has been filled in and the value provided is not null
      $(".requiredInput").each(function(){
        //if empty or null mark as invalid
        if($(this).val() == "" || $(this).val() == null){
          $(this).addClass('invalid');
          $(this).addClass('incorrect_color');
          $(this).removeClass("valid");
        }
        //otherwise the input is valid
        else{
          $(this).addClass("valid");
          $(this).removeClass('incorrect_color');
          $(this).removeClass("invalid");
        }
      });
      //if any required inputs have been marked as invalid reject the promise
      if($(".requiredInput").hasClass("invalid")){
        alert("Please fill in all required fields");
        promise.reject("All required fields were not filled in");
      }
      //otherwise resolve the promise
      else{
        promise.resolve("All fields filled in");
      }

    return promise.promise();
  }

  //get a new digest value for the Form
  //the digest value prevents the same form submission from being applied multiple times
  function getFormDigest() {
      return $.ajax({
          url: siteUrl + "/_api/contextinfo",
          method: "POST",
          headers: { "Accept": "application/json; odata=verbose" },
          success: function(data){
            console.log("Obtained new form digest " +data.d.GetContextWebInformation.FormDigestValue);
          }
      });
  }

  //gets the SP list type
  //used when making an api request
  function getListType(){
    return $.ajax({
      url: siteUrl + "/_api/web/lists/getbytitle('WDGIntakeForm')/items",
      Type:'GET',
      headers: {
        accept: "application/json;odata=verbose"
      },
      success: function(data){
        console.log("Obtained list type: "+data);
      }
    });
  }
  //gathers the data provided in the form and returns an object containing that data
  function gatherFormData(){
    var itemData = {
      '__metadata': {'type': "SP.Data.WDGIntakeFormListItem"},
      'ChangeValue': true
    };
    //add each valid input to the item data object
    $(".formInput.valid").each(function(){
        itemData[$(this).attr("data-property")] = $(this).val();
    });
    return itemData;
  }
  //closes the form view and shows the list view
  function closeForm(){
    //clear all input values
    $(".formInput").val("");
    //remove and validation classes
    $(".formInput").removeClass("valid invalid incorrect_color");
    //hide the form view
    $("#formView").addClass("hidden");
    //show the list view
    $("#listView").removeClass("hidden");
  }
  //sets the dat and time string that is appended to the top banner
  function setDateAndTime(userName){
    //make a new date object
    var date = new Date();
    //get the day of the week
    var weekDay = daysOfTheWeek[date.getDay()];
    //get the month
    var month = monthsOfTheYear[date.getMonth()];
    //get the day
    var day = date.getDate();
    //get the year
    var year = date.getFullYear();
    //get the minute
    //if the minute returned is less then 10 add a 0 to it so that it maintains the double digit format
    var minute = date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes();
    //get the second
    var second = date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds();
    //get the hour
    //since the hour is returned in 24 format, reformat the time
    var time = date.getHours() >= 0 && date.getHours() <= 11 ?
     ((date.getHours() + 11) % 12 + 1 )+":"+minute+":"+second+" AM" : ((date.getHours() + 11) % 12 + 1 )+":"+minute+":"+second+" PM" ;
     //combine all variables into a single string
    var dateTimeString = weekDay + ", " + month + " " + day + ", " + year + " | " + time + " " +  userName;
    //add the string to the banner
    $("#formDateTime").html(dateTimeString);
  }

}
