//variables and functions shared across the user edit list item page and the admin edit list item page

//global variables
//array tha contains all returned user list items
var listItems = [];
//an array of list item properties
//used to specify which of the returned list item properties will be used in the program
//and which form input field the list property value is be placed in
var properties = properties = ["Attachments","CoOwner","Comments","Confidentiality","Details","DocumentTitle","FileName","Owner","PageTitle","PageURL","ProductGroup","PublishDate","RequestDetails","ShortDescription","SourceFileLocation","deleteContent"];
//the sharepoint id of the item currently being edited
var currentEditItemId;

//gets all of the list items for the user based on the query string specified
//queryString => string that specifies the parameters of the search for the users list items
function getUserListItems(queryString){
  return $.ajax({
      url: siteUrl + "/_api/web/lists/GetByTitle('WDGIntakeForm')/items"+queryString+"",
      Type:'GET',
      headers: {
        accept: "application/json;odata=verbose"
      }
  });
}

//shows the list item in the edit view
//ticketNum => the position of the list item to edit in the listItems array
//listItemsArray => an array containing all list items
function showEditView(ticketNum,listItems){
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
      validateChangeRequest(),
      getFormDigest(),
      getListType()
    ).then(function(validation,digest,listType){
      //gather the data to send
      var formData = gatherChangeRequestData();
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

//gathers the data provided in the form and returns an object containing that data
  function gatherChangeRequestData(){
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
//validates the change request information
function validateChangeRequest(){
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
