//# Set global variables
var 
  dbase    = 'https://script.google.com/macros/s/AKfycbxPU5ZpiVUloEdVaZD3ww_T9QOlXOzujh87FSz55gGyVoWy9czo/exec',
  devEnv   = (window.location.hostname === 'netpro.dev'),
  page2    = false,
  page3    = false,
  isMobile = false,
  mobileTimeout1,
  mobileTimeout2,
  thankHeight,
  formHeight;

//# Return url parameters by name
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//# create unique_id as a crude way to track users if data is POSTed multiple times
function uid() {
  if (devEnv)  { return 'DEV:::' + Math.random().toString(36).substr(2, 5) }
  if (!devEnv) { return Math.random().toString(36).substr(2, 8) }
}

//# Do nothing function for optional callbacks
var noop = function(){};

//# Send the form with whatever data is in it; Callback optional, but format is: function(error, result) {}
function sendForm(callback) {
  callback = callback || noop;
  
  // REGISTER / CLEAN LATE DATA:

  // set mobile input val
  $('#mobile').val(isMobile)

  // trim any extra spaces or enters before submit and
  // set #comment value to trimmed version
  let comTrim = $('#comment').val().trim();   
  $('#comment').val( comTrim ); 

  // POST serialized form data to google sheet url (dbase)
  $.ajax({
    url: dbase,
    type: "post",
    data: $('#net-promoter').serialize()
  })
  .done(function(response, textStatus, jqXHR) {
    console.log("Post done:", response)

    // set page3 to prevent fire of 'beforeunload' on redirect
    page3 = true

    // call submitAnimations if isMobile to avoid creating 
    // callback function when sendForm called
    if (isMobile) { submitAnimations(); }

    // callback(error, result)
    callback(null, response);
  })
  .fail(function(response, textStatus, jqXHR){
    console.log("Post ERROR:", response)

    // callback(error, result)
    callback(response, null);
    throw new Error(textStatus)
  });
}

//# fadeOut & fadeIn animations after form submit
function submitAnimations() {

  // set placeholders to original div heights to ensure smooth fades
  $('#thanks-placeholder').height(thankHeight);
  $('#success-container').height(formHeight);

  // replace form with thank you message
  $('#form-container').fadeOut('fast', function() {
    $('#success-container').fadeIn('fast');
  })

  // remove green thank-you notification at top
  $('#thank-you').fadeOut('fast', function() {
    $('#thanks-placeholder').fadeIn('fast', function() {
      
      // redirect to 'redirect' url variable after timeout
      setTimeout(redirect, 1500)
    });
  })
}

//# Set redirect after thank-you page
function redirect() {
  window.location.replace("https://growthgenius.io/growth-gigs");
}


// =========== DOCUMENT READY ===============

$(document).ready(function() {

  //# setup focus event for when email field is clicked, then...
  $('#email').click(function(e) {
    $(this).focus()
  })

  //# click (tap for mobile) on email field on page
  //# load to force mobile keyboard to appear
  // $('#email').click()

  $('#email').tap()
  


  //# set uid to enable tracking multiple submits
  let xuid = uid();
  $('#uid').val(xuid)

  //# set date on form hidden field
  $('#date').val( new Date() )

  //# set rating based on URL query (?nps=#); included in URL of email signature
  let rating = getParameterByName('nps')
  $('#rating').val(rating)

  //# Check if mobile device by checking property of div set to appear only when 
  //# screen width is xs
  if( $('#is-mobile').css('display') !== 'none' ) { isMobile = true }

  
  if (isMobile) {
    // set buttons to 100% width on mobile 
    $('.btn.btn-primary').css("width","100%")

    //If mobile device, send form after 30s to capture rating data if user abandonds
    mobileTimeout1 = setTimeout(sendForm, 30000)
  }

  //# When user tries to close tab / window, execute function 
  //# (fails on mobile unless user actually closes tab manually. Rare.)
  window.addEventListener("beforeunload", function (e) {
    // don't run on final form page to avoid alert on redirect
    if (!page3) {                               
      sendForm();                               
      var confirmationMessage = "\o/";
      e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
      return confirmationMessage;              // Gecko, WebKit, Chrome <34
    }
  })

  //# get heights of thank-you and form so on fadeOut they can be replaced
  //# by placeholder divs with the same height; smooth UX
  thankHeight = $('#thank-you').height();
  formHeight = $('#form-container').height();

  //# Next button listener (email field -> comment field transition)
  $('#form-next').click(function(e) {
    e.preventDefault();

    // prevent autosend of form if next button clicked
    clearTimeout(mobileTimeout1);

    // set new timeout for mobile in case user abandonds at this point    
    if (isMobile) { mobileTimeout2 = setTimeout(sendForm, 30000) }   

    // sendForm(); <-- Commented out when sendForm was placed on unbeforeload to hopefully reduce number of duplicate entries in db

    // Hide email field, show comment field and focus on it. Thinking more likely to submit email if split up from comment textarea.
    $('#form-pg1').fadeOut('fast', function() {
      $('#form-pg2').fadeIn('fast');
      page2 = true;
      $('#comment').focus();
    })

    // set value if email is blank. Do at end to avoid showing user.
    if ( $('#email').val() === "" ) { $('#email').val( '(left blank)' ) }
  })

  //# Form submit listener
  $('#net-promoter').submit(function(e) {
    e.preventDefault();

    // stop autosend of form
    clearTimeout(mobileTimeout2);

    // disable submit button                
    $('#submit').prop( "disabled", true );             

    // submit form with callback
    sendForm(function(error, result) {          
      if (error) { 
        alert("Something broke... we'd appreciate you letting us know!");
        // re-enable submit button
        $('#submit').prop( "disabled", false );  
      }
      if (result) {
        // hide form & show thank-you, then redirect
        submitAnimations();                     
      }
    });
  })

  // USING SHIFT + ENTER TO SUBMIT FORM to prevent accidental submit in textarea
  
  //# Create object to store current keypress state
  //# 13 = ENTER, 16 = SHIFT
  var map = {13: false, 16: false}; 

  //# On any keydown event check vs map && page2, set keydown to TRUE
  //# Submit form if both ENTER and SHIFT are down at the same time
  $(document).keydown(function(e) {
    if (e.keyCode in map && page2) {
          map[e.keyCode] = true;
          if (map[13] && map[16]) {
              $('#net-promoter').submit();
          }
        }

      // set key state to false on keyup 
    }).keyup(function(e) {            
        if (e.keyCode in map) {
            map[e.keyCode] = false;
        }
    });

  //# Hide notice that SHIFT + ENTER is required to submit form
  function resetBlockHelper() {
    $('#helpBlock').fadeOut('slow', function() {
      $('#helpBlockHolder').fadeIn('fast');
    })
  }

  //# ENTER key listener
  $(document).keypress(function (e) {
    
    // ENTER + !page2 allows user to progress from email input to 
    // comment textarea without showing helper below
    if (e.which == 13 && !page2) {        
      // Do nothing here.'ENTER' keypress interpreted as click, which we want
    }

    // ENTER keypress while on comment page shows helper: Use SHIFT + ENTER to submit form
    if (e.which == 13 && page2) {

      // because function captures keypress and prevents it from executing actual ENTER:
      // grab current comment textfield value        
      let comVal = $('#comment').val()
      // add spoofed ENTER to end   
      let retVal = comVal.concat('\r\n')
      // set comment textfield to original value + newline  
      $('#comment').val(retVal)           

      // Notify user that SHIFT + ENTER is required to submit form, 
      // then hide notice after timeout
      $('#helpBlockHolder').fadeOut('fast', function() { 
        $('#helpBlock').fadeIn('fast', function() {
          setTimeout(resetBlockHelper, 3500);
        })
      })

      // prevent default action 
      // (basically preventDefault & stopPropogation)
      return false;   
    }
  })


}) // end document.ready


