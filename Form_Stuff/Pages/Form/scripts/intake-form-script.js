//global variables
//timer for the people search function
var peoplePickerTimer;
//timer to show and hide the loading circle
var loadingTimer;
//array of object containing the data on all attached files
var attachedFileData;
//the attached files in the file input
var attachmentFiles;
//the current users title
var currUser;

window.onload = initIntakeForm;

function initIntakeForm(){
//initalize variables
attachedFileData = [];
loadingTimer = new Timer(1000,function(){
  $("#submitLoadingImage").removeClass("hidden");
  $("#submitLoadingText").removeClass("hidden");
},function(){
  $("#submitLoadingImage").addClass("hidden");
  $("#submitLoadingText").addClass("hidden");
});
peoplePickerTimer = new Timer(750,function(typedVal,inputId){
    searchForUser(typedVal,inputId);
});

//initalize the date picker element
//this is a jquery ui widget
$("#datePicker").datepicker({
  //when a user selects a date update the publishDateInput with the selected value and close the date picker
  onSelect: function(date,instance){
    $("#publishDateInput").val(date);
    $("#datePicker").fadeOut(500);
  },
});

//before doing anything else make a request for the user information to set the greeting
// and to set the date and time info in the top right banner
setGreetingName().then(function(){
  //once the request has completed show the selection container and add the events to the form
  //this prevents the user from trying to make a form selection before the greeting has been set and the events have been attached
  $("#formselectionContainer").animate({
  	height: "224px"
  },1000);
  //attach the events to the controls
  attachEvents();
});

}

//checks that all inputs that are going to be submitted are valid
function validateForm(){
//initalize the deferred object
//will resolve if all inputs are valid, reject if any of the inputs are invalid
var validationDeferred = $.Deferred();
//get the files to read
//if the attachment input is empty set the attachmentFiles variable to undefined, otherwise set it to the attached files
attachmentFiles = typeof $("#attachmentInput:visible")[0] !== "undefined" ? $("#attachmentInput:visible")[0].files : undefined;
//an array from promises returned from the readFile function
//once all fileRead promises have been resolved the validation process can continue
var promises = [];
//loop through all attachments and add a promise to the promise array
$.each(attachmentFiles,function(){
  promises.push(readFile(this,fileReadSucess,fileReadFail));
});
//validation process should only continue once all files have been read
$.when.apply($, promises).then(function(e){
  //once all files have been processed sucessfully, mark the attachmentinput as valid and continue with the rest of the form validation
  $("#attachmentInput").addClass("valid");
  $("#attachmentInput").removeClass("invalid");

  //check all required inputs
  $("#intakeFormContainer .intakeFormSection:visible .requiredInput").each(function(){
    //if the input is blank or null mark the input invalid and turn it red
    if(($(this).val() == "" || $(this).val() == null)){
      $(this).addClass("invalid");
      $(this).addClass("incorrect_color");
      $(this).removeClass("valid");
    }
    //if the input is not blank but has already been determined incorrect set it as invalid
    //Note: at the moment the only inputs that are determined incorrect or correct is the owner and co-owner fields
    else if($(this).hasClass("incorrect_response")){
      $(this).addClass("invalid");
      $(this).removeClass("valid");
    }
    //If none of the above conditions are true, the input is valid
    else{
      $(this).addClass("valid");
      $(this).removeClass("incorrect_color");
      $(this).removeClass("invalid");
    }
  });
  //check all optionl inputs
  $("#intakeFormContainer .intakeFormSection:visible .optionalInput").each(function(){
    //if the input is not blank and the value is not null and the value has not been marked as inccorect the input is valid
    // or if the value is blank the input is also considered valid
    if(($(this).val() !== "" && $(this).val() !== null && !$(this).hasClass("incorrect_response")) || ($(this).val() == "")){
      $(this).addClass("valid");
      $(this).removeClass("incorrect_color");
      $(this).removeClass("invalid");
    }
    //if the the above conditions failed, the input is invalid
    else{
      $(this).addClass("invalid");
      $(this).addClass("incorrect_color");
      $(this).removeClass("valid");
    }
  });

  //check the validity of all visible inputs
  //if any input is marked as invalid or has not been made valid alert the user that provided information is incorrect and reject the promise
  if($("#intakeFormContainer .intakeFormSection:visible .formInput").hasClass("invalid") || !$("#intakeFormContainer .intakeFormSection:visible .formInput").hasClass("valid")){
    alert("Please fill in all fields with the correct information");
    //reject the promise
    validationDeferred.reject("All fields were not filled in properly");
  }
  //otherwise all information provided is valid and resolve the promise
  else{
    validationDeferred.resolve("All fields contain vailid data");
  }
},function(rejectMessage){
  //if any of the attached files are rejected mark the attachment input as invalid and tell the user why their attached file was rejected
  $("#attachmentInput").addClass("invalid");
  $("#attachmentInput").removeClass("valid");
  alert(rejectMessage);
  validationDeferred.reject(rejectMessage);
});

return validationDeferred.promise();

}


//returns the object containing all the information that will be sent to sharepoint to generate a new list item
function gatherFormData(){
//the type of request the form submission is
var requestType = $(".typeOfRequest.selected").html();
//the title of the sharepoint list item
var title = "Windows Devices Group - Publishing Request ("+requestType+")";
//object containing the data to send to sharepoint
var itemData = {
  '__metadata': {'type': "SP.Data.WDGIntakeFormListItem"},
  'RequestType1': requestType,
  'Title': title,
  'CurrentUser': currUser
};
//add all visible and valid input values to the object
$("#intakeFormContainer .intakeFormSection:visible .formInput.valid").each(function(){
  //ignore the attachements input and do not add it to the item object
  //due to how the api works, the attachemtns are sent to sharepoint AFTER the initial list item is created
  //because of this the attachemnts cannot be sent along with the rest of the data or sharepoint will throw an error
  if($(this).attr("data-property")!== "Attachments"){
    //use the data-property attribute to set the correct property name in the itemData object
    //this property name cooresponds to which sharepoint list column the data should be added to
    //EX: data-property = Details means that input's data will be placed in the Details column on sharepoint
    itemData[$(this).attr("data-property")] = $(this).val();
  }
});

return itemData;
}


//creates a new SP list item
//itemProperties => the object containing all the data for the new list item you want to create EX. Title, description, etc.
//attachment => the object containing all attachment data, if there is any
function createListItem(itemProperties,attachment){
  //before the request make sure you obtain a new form digest value and the list type
  $.when(
    getFormDigest(),
    getListType()
  ).then(function(data){
    $.ajax({
        url: siteUrl + "/_api/web/lists/getbytitle('WDGIntakeForm')/items",
        type: "POST",
        contentType: "application/json;odata=verbose",
        data: JSON.stringify(itemProperties),
        headers: {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": data[0].d.GetContextWebInformation.FormDigestValue
        },
        success: function (successData) {
          //the id of the list item that was just created
          var itemId = successData.d.Id;
          //text value of the footer at the time the submission succeeded
          //used as part of the thank you screen text
          var typeofRequest = $(".typeOfRequest.selected").attr("data-footerVal");
          //check if there is an attachment
          //if there is send all the attached file to the newly created sharepoint list item
          if(typeof attachmentFiles !== "undefined"){
            //a promise to pass to the sendAttachments function
            //will be resolved if all attachments are successfully attached
            //and will be rejected if one of the attachments fail to be sent properly
            var promise = $.Deferred();
            promise.promise();
            sendAttachments(itemId,attachment,promise);
            //when the promise passed to sendAttachments resolves, show the thank you screen
            // or if the promise is rejected show the error
            $.when(promise).then(function(e){
              //stop the loading timer and hide the image
              loadingTimer.stopTimer();
              console.log("Created new list item ");
              //enable the submit button
              $("#addBtn").removeClass("disabled");
              //show the thank you screen
              showThankYou(itemId,typeofRequest);
              //trigger the flow
              triggerFlow(itemId);
            },function(data){
              //stop the loading timer and hide the image
              loadingTimer.stopTimer();
              alert("There was an error with the attached file.");
              //enable the submit button
              $("#addBtn").removeClass("disabled");
              console.log(data);
              throw new Error("There was an error in attaching the file to the sharepoint list");
            });
          }
          //if there is no attachment alert that a new item has been created
          else{
            //stop the loading timer and hide the image
            loadingTimer.stopTimer();
            console.log("Created new list item ");
            $("#addBtn").removeClass("disabled");
            showThankYou(itemId,typeofRequest);
            triggerFlow(itemId);
          }
        },
        error: function (data) {
          //stop the loading timer and hide the image
          loadingTimer.stopTimer();
          alert("There was an error with writing to the sharepoint list");
          $("#addBtn").removeClass("disabled");
          console.log(data);
          throw new Error("There was an error in writing to the sharepoint list");
        }
    });
  });
}

//sends a file or files to a sharepoint list item as an attchment of that list item
//sends each attachment one after the other to avoid any save conflicts should two or more attachments try to attach at the same time
//itemId => the id of the sharepoint list item you want to attach the file to
//attachment => and array of objects where each object is an attached file containing the name of the file and the file data
//deferedPromise => a promise passed to the function wich will resolve when all files have been sent
function sendAttachments(itemId,attachmentArray,deferredPromise){
  //if the arrachment array length is 0 all attachemtns have been send
  //resolve the promise and return out of the function
  if(attachmentArray.length <= 0){
    deferredPromise.resolve("All attachments sent");
    return;
  }
  //if the attachemnt array is not empty send the next attachment to sharepoint
  else{
    $.when(getFormDigest()).then(function(data){
      $.ajax({
        url: siteUrl + "/_api/web/lists/getbytitle('WDGIntakeForm')/items("+itemId+")/AttachmentFiles/add(FileName='"+attachmentArray[0].fileName+"')",
        type: "POST",
        data: attachmentArray[0].fileString,
        processData: false,
        headers: {
            "Accept": "application/json;odata=verbose",
            "content-type": "application/json; odata=verbose",
            "X-RequestDigest":  data.d.GetContextWebInformation.FormDigestValue
        },
        success: function (data) {
          console.log("Attached file to list item");
          //remove the attachment that was just sent to sharepoint from the array
          attachmentArray.shift();
          //call the function again
          sendAttachments(itemId,attachmentArray,deferredPromise);
        },
        error: function (data) {
          console.log(data);
          //reject the promise as the attachment failed to be sent
          deferredPromise.reject("there was an error with one or more of the attachments");
        }
      });
    });
  }
}


//checks sharepoint if a provided user value is a valid sharepoint user
// user => the user to query sharepoint for
// inputField => the input box the user is typing into, used to change the input based on the query results
function searchForUser(user,inputField){
  $.when(
    getFormDigest()
  ).then(function(data){
  $.ajax({
      url: siteUrl + "/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser",
      type: "POST",
      data:JSON.stringify({
          'queryParams':{
              '__metadata':{
                  'type':'SP.UI.ApplicationPages.ClientPeoplePickerQueryParameters'
              },
              'AllowEmailAddresses':true,
              'AllowMultipleEntities':false,
              'AllUrlZones':false,
              'MaximumEntitySuggestions':5,
              'Required': true,
              'PrincipalSource':15,
              'PrincipalType': 1,
              'QueryString': user
          }
      }),
      contentType: "application/json;odata=verbose",
      headers: {
          "Accept": "application/json;odata=verbose",
          "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue
      },
      success: function (data) {
        //parse the returned string of user into an object
        var results = JSON.parse(data.d.ClientPeoplePickerSearchUser);
        //if the results returned contains more then 1 user show the returned users in the suggetion box
        if(results.length >= 2){
            var suggestions = "";
            //loop through the results and add each username to the suggestions string
            $.each(results,function(i,val){
              suggestions += "<div>"+this.EntityData.Email+"</div>";
            });

              //add the suggestions to the autocomplete div under the input field that the user was typing in
              $("#"+inputField).next().html(suggestions);
              //show the autocomplete div
              $("#"+inputField).next().removeClass("hidden");
              //show the screen overlay div, used to close the suggestion box if the user clicks anywhere other then a suggestion
              $("#screenOverlay").removeClass("hidden");

              //add the click event to the newly created suggestion elements
              $("#"+inputField).next().children().on("click",function(){
                //update the value in the text input to the value clicked on
                $(this).parent().prev().val($(this).html());
                //hide the suggestion box
                $(this).parent().addClass("hidden");
                //add the correct color and response class and remove the inccorect color and response class
                $(this).parent().prev().removeClass('incorrect_response');
                $(this).parent().prev().removeClass('incorrect_color');
                $(this).parent().prev().addClass('correct_response');
                $(this).parent().prev().addClass('correct_color');
              });

              //remove the correct and incorrect classes
              //the user has not yet made a selection so the input is neither correct or incorrect yet
              $("#"+inputField).removeClass('correct_response');
              $("#"+inputField).removeClass('correct_color');
              $("#"+inputField).removeClass('incorrect_response');
              $("#"+inputField).removeClass('incorrect_color');
        }
        //if no results are returned consider the input incorrect
        else if(results.length <= 0){
          $("#"+inputField).addClass('incorrect_response');
          $("#"+inputField).addClass('incorrect_color');
          $("#"+inputField).removeClass('correct_response');
          $("#"+inputField).removeClass('correct_color');
          //make sure the suggestion box is hidden
          $("#"+inputField).next().addClass("hidden");
        }
        //if the search returns a single result consider it valid and update the text in the input box
        else if(results.length == 1){
          $("#"+inputField).removeClass('incorrect_response');
          $("#"+inputField).removeClass('incorrect_color');
          $("#"+inputField).val(results[0].EntityData.Email);
          $("#"+inputField).addClass('correct_response');
          $("#"+inputField).addClass('correct_color');
          $("#"+inputField).next().addClass("hidden");
        }
      },
      error: function (data) {
        console.log(data);
         throw new Error("There was an issue with querying for the specified user");
      }
    });
  });
}

//display the correct input fields based on which form is selected
// form => the class of the form you want to display
// footer => value of the new footer to display
function swapFormContent(form,footer){
  //a variable to animate the container to the correct height
/*  var containerHeight;
  switch (form){
    case "Form1":
      containerHeight = "1074px";
      break;
    case "Form2":
      containerHeight = "1002px";
      break;
    case "Form3":
      containerHeight = "5424px";
      break;
    case "Form4":
      containerHeight = "1263px";
      break;
    case "Form5":
      containerHeight = "429px";
      break;
  }*/

  //show the form container since it starts hidden
  $("#intakeFormContainer").removeClass("hidden");
  //hide all forms
  $(".intakeFormSection").addClass("hidden");
  //show the selected form
  $("."+form).removeClass("hidden");
  //change the footer value
  $("#intakeFormFooter").html(footer);

/*
  //animate the container
  $("#intakeFormContainer").animate({
    //close the container if it is not already closed
    height:"0px"
  },1000,function(){
    $("#intakeFormContainer").animate({
      height:containerHeight
    },1000);
  });*/
}

//sends a http request to trigger the flow
//itemId => the id of the sharepoint item you want to send in the flow email
function triggerFlow(itemId){
  $.ajax({
      url: "https://prod-22.westus.logic.azure.com:443/workflows/531f6351cfe444dc8fc5b06467738320/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cvtZhEM-fX6CAULFhyTX7UvxkctYzeiAyhuIHiGlxpk",
      type: "POST",
      contentType: "application/json;odata=verbose",
      data: JSON.stringify({"ID":itemId}),
      headers: {
          "Accept": "application/json;odata=verbose",
      },
  });
}

//shows the submission successful thank you view
// itemId => the id of the item just created
// requestType => the text of the type of request just submitted
function showThankYou(itemId,requestType){
  //empty the attachmentFiles array as the attachments are no longer being used and it will clear up browswer memory
    attachmentFiles = [];
    //fill in the item id and the type of request
    $("#intakeFormThankYou #requestType").html(requestType);
    $("#intakeFormThankYou #itemId").html("Item ID #"+itemId);

    //hide the form selection, form footer, and form buttonContainer
    $("#formselectionContainer, #intakeFormFooter, #intakeFormContainer").addClass("hidden");
    //show the thank you buttonContainer
    $("#intakeFormThankYou").removeClass("hidden");
    //scroll the page up to make sure the thankyou screen is in for for the user
    $('html, body').animate({
        scrollTop: ($('#intakeFormContentContainer').offset().top)
    },500);
}

//resets the form view to be like on page load
function resetForm(){
  //reset text fields with a blank value
  $(".formInput[type='text']").val("");
  //reset the textareas
  $("textarea").val("");
  //reset the date picker to the default value
  $("#publishDateInput").val("");
  //reset the product group
  $("#productGroupInput").val("");
  //reset the drop down boxes to the first option
  $("select").val("");
  //reset checkboxes
  $(".fakeCheckbox").val("");
  $(".fakeCheckbox").children().addClass("hidden");
  //reset the attachment input
  $("#attachmentInput").val(null);
  //remove all valid, invalid, correct, and incorrect classes from all inputs
  $(".formInput").removeClass("valid invalid incorrect_response correct_response correct_color incorrect_color");
  //hide the thank you buttonContainer
  $("#intakeFormThankYou").addClass("hidden");
  //hide the form container
  $("#intakeFormContainer").addClass("hidden");
  //make sure none of the form selections are selected
    $(".typeOfRequest").removeClass("selected");
  //remove text from the footer
  $("#intakeFormFooter").html("");
  //show the selection container and footer
    $("#formselectionContainer, #intakeFormFooter").removeClass("hidden");
}


//sets the greeting at the top of the form to be the current users first name
//as well we the name, date, and time in the top banner
function setGreetingName(){
  return $.ajax({
      url: siteUrl + "/_api/web/currentUser",
      Type:'GET',
      headers: {
        accept: "application/json;odata=verbose"
      }
    }).done(function(data){
        currUser = data.d.Title;
        //set the greeting to be the first name of the returned user
        $("#formGreeting").html("Hi, "+ data.d.Title.substring(0,data.d.Title.indexOf(" ")));
        setDateAndTime(currUser);
    });
}

//reads the file provided and outputs it as an array buffer
//file => the file to read, needs to be a blob or file object
//onSuccess => function to run if the read operation completes
//onFail => function to run if the read operation fails
function readFile(file,onSuccess,onFail){
  //what type of file is being read
  var fileType = file.name.substr(file.name.indexOf("."));
  //an array of common video extentions to check against
  var videoExtentions = [".mp4",".avi", ".mov", ".wmv"];
  //the size of the file being read in mb
  var fileSize = (file.size / 1024) / 2024;
  //deferred object to resolve or reject after the file is read
  var deferred = $.Deferred();
  //if the file being read is a video throw and error and alert the user that videos cannot be attached
  //currently trying to send video files causes the browser to crash
  if(videoExtentions.indexOf(fileType) != -1){
    deferred.reject("Cannot attach video files");
  }
  //currently sending too large a file also causes the browser to crash
  else if (fileSize > 100){
  deferred.reject("Attached File is too large");
  }
  //if the file is undefined there is not file to read so resolve the promise
  else if(typeof file == "undefined"){
    deferred.resolve("No file to read");
  }
  //otherwise set up callbacks and begin reading the file
  else{
    var reader = new FileReader();
    //called when the reader has finished reading the file
    reader.onload = function(data){
      //pass the file data and the name of the file to the success callback
      onSuccess(data,file.name);
      deferred.resolve("File Read Sucessful");
    };
    //called if the reader errors out
    reader.onerror = function(data){onFail(data); deferred.reject("Could not read file " + file.name);};
    //begin reading the file
    reader.readAsArrayBuffer(file);
  }

  return deferred.promise();
}

//callback function for when a file read succeeds
function fileReadSucess(fileArray,fileName){
  //if the read operation completes
  //create and object containing the file array and the file name
  //then add that object to the attachedFileData array
  var fileData = {
    fileString:fileArray.target.result,
    fileName: fileName
  }
  attachedFileData.push(fileData);
  console.log(attachedFileData);
}
//callback function for when a file read fails
function fileReadFail(data){
  console.log(data);
}

//a timer class that sets up a timer that will call a function after a specified time
//timing => the amount of time that should pass before the timer goes off
//startCallback => a function to call when the timer goes off
//stopCallback => a function to call when the timer is stopped, optional parameter
function Timer(timing,startCallback,stopCallback){
  var that = this;
  this.timing = timing;
  this.startCallback = startCallback;
  this.stopCallback = stopCallback;
  //startTimer and stopTimer optionally take an array of parameters that will be called on their callback functions
  //starts the count down until the timer goes off
  this.startTimer = function(parameters){
    this.params = parameters;
    this.intervalTimer = setTimeout(function(){
      that.startCallback.apply(null,that.params);
    },that.timing);
  }
  //stops the timer before it goes off
  this.stopTimer = function(parameters){
    this.params = parameters;
    clearTimeout(this.intervalTimer);
    //only call the function if is it not undefined
    if(typeof stopCallback !== "undefined"){
      that.stopCallback.apply(null,that.params);
    }
  }
}

//attachs all necessary event handlers
function attachEvents(){
  //event handler for the add list item button
  //creaes a new list item based on form information
  $("#addBtn").on("click",function(){
    //check if the submit button is disabled
    //this will prevent multiple multiple submissions being made at the same time
    if(!$("#addBtn").hasClass("disabled")){
      //disable the submit button, prevents the user from making the same submission multiple times
      $("#addBtn").addClass("disabled");

      //start the loading image timer
      loadingTimer.startTimer();

      //emtpy the attachedFileData array, this data will be after the form ahs been validated
      attachedFileData = [];
      //only gather the data and create the list once the form has been validated
      $.when(validateForm()).then(function(msg){
        var itemData = gatherFormData();
        createListItem(itemData,attachedFileData);
      },function(msg){
        //if the form was not validated show why
        console.log(msg);
        //unlock the submit button
        $("#addBtn").removeClass("disabled");
        //stop the timer
        loadingTimer.stopTimer();
      });
    }
  });


  //event handler for the people picker input box
  //check when the user has stopped typing and runs a people serach
  $("#ownerInput, #coownerInput").on("keyup",function(){
    //the value in the input box after the user has stopped typing
    var typedVal = $(this).val();
    var inputId = $(this).attr("id");

    //only run the people search if the value in the input field is not empty
    if(typedVal !== ""){
      //stop the peoplePickerTimer in case it was alreay going
      peoplePickerTimer.stopTimer();
      //start the timer
      peoplePickerTimer.startTimer([typedVal,inputId]);
    }
    //if the input value is emtpy remove incorrect and correct classes as a blank value is considered neither
    else{
      $(this).removeClass("incorrect_color");
      $(this).removeClass("incorrect_response");
      $(this).removeClass("correct_color");
      $(this).removeClass("correct_response");
    }
  });
  //clears the people search timer when the user resumes typing
  $("#ownerInput, #coownerInput").on("keydown",function(){
    //stop showing the loading icon
    peoplePickerTimer.stopTimer();
  });
  //on all inputs other then owner and co owner remove the incorrect_color class if the value changes
  //this is to remove the red color from an inccorect input field after validation
  //owner and coowner are excluded as they have a separate event that handles this functionality
  $(".optionalInput:not(#coownerInput), .requiredInput:not(#ownerInput)").on("input",function(){
    $(this).removeClass("incorrect_color");
  });
  //event for the screenOverlay
  //ths screenOverlay is used to close the suggestion box/datePicker when the user does not click on a suggestion and instead clicks off of the suggestion box
  $("#screenOverlay").on("click",function(){
    //hide the suggestion box
    $(".autocomplete").addClass("hidden");
    //hide the suggestion box
    $("#datePicker").fadeOut(500);
    //hide the overlay
    $("#screenOverlay").addClass("hidden");
  });


  //shows and hides the example image
  $(".seeExampleButton").on("click", function(){
    if($(this).next().hasClass("hidden")){
      $(this).next().removeClass("hidden");
      $(this).addClass("selected");
    }
    else{
        $(this).next().addClass("hidden");
        $(this).removeClass("selected");
    }
  });

  //click event on the form selection box options that will change what field values are shown in the form based on which slection is clicked
  $('#formSelectionItem .typeOfRequest').on("click",function(){
    //remove the selected class from all the selection options
    $('.typeOfRequest').removeClass("selected");
    //add selected to the selection that was clicked
    $(this).addClass("selected");
    var selectedForm = $(this).attr("data-form");
    var footer = $(this).attr("data-footerVal");
    //show the correct form input fields
    swapFormContent(selectedForm,footer);
      //animate the hover bar to the position of the selction clicked on
      $("#hoverBar").removeClass("hidden");
      $("#hoverBar").animate({
        top:$(this).position().top
      },500);
  });

  // events for the thank you screen button
  //takes the user to the edit ticket page
  $("#editBtn").on("click",function(){
    window.location = "https://microsoft.sharepoint.com/sites/Infopedia_G02/Pages/WDG-Open-Tickets-POC.aspx";
  });
  //resets the form view to be exactly as it was when the page loaded
  $("#newBtn").on("click",function(){
    resetForm();
  });

  //shows the date picker
  $("#publishDateInput, #calendarImg").on("click",function(){
    $("#datePicker").fadeIn(500);
    $("#screenOverlay").removeClass("hidden");
  });

  //toggles the value of a fake checkbox between Yes and No
  $(".fakeCheckbox").on("click",function(){
    //if is not already set to yes, set it
    if(!$(this).val()){
      $(this).val("Yes");
      //show the checkmark lines
      $(this).children().removeClass("hidden");
    }
    //otherwise set it to be No
    else{
        $(this).val("No");
        $(this).children().addClass("hidden");
    }
  });

  //event for when the user selects or deselects attachment files
  $("#attachmentInput").on("change",function(){
    var plural = this.files.length <= 1 ? "file" : "files";
    //update the attachment input text div with the number of files selected
    $("#attachmentInputText").text(this.files.length + " " + plural);
  });



  /*
  $("#ninjaTile").draggable();

  $('#ninjaButton').on("click",function(){
      $("#ninjaCat").animate({
        left:"-200px"
      },500,function(){
        console.log("Animated off screen");
        $("#ninjaCat").removeClass("hidden");
      }).promise().done(function(){
        $("#ninjaCat").animate({
          left:"1000px"
        },3500,function(){
          $("#ninjaCat").addClass("hidden");
        });
      });
    }); */

}
