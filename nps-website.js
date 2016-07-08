function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function uid() {
  if (devEnv)  { return 'DEV:::' + Math.random().toString(36).substr(2, 5) }
  if (!devEnv) { return Math.random().toString(36).substr(2, 8) }
}

var noop = function(){}; // do nothing.

function sendForm(callback) {
  callback = callback || noop;
    $.ajax({
    url: dbase,
    type: "post",
    data: $('#net-promoter').serialize()
  })
  .done(function(response, textStatus, jqXHR) {
    console.log("initial post done")
    console.log(response)
    callback(null, response);
  })
  .fail(function(response, textStatus, jqXHR){
    console.log("initial post ERROR")
    console.log(response)
    callback(response, null);
    throw new Error(textStatus)
  });
}

var 
  dbase = 'https://script.google.com/macros/s/AKfycbxPU5ZpiVUloEdVaZD3ww_T9QOlXOzujh87FSz55gGyVoWy9czo/exec',
  devEnv = (window.location.hostname === 'netpro.dev'),
  page2 = false,
  page3 = false;



$(document).ready(function() {


  $('#email').focus()

  // set uid to enable tracking multiple submits
  var xuid = uid();
  $('#uid').val(xuid)

  // set date on form
  $('#date').val( new Date() )

  // set rating based on URL query
  var rating = getParameterByName('nps')
  $('#rating').val(rating)

  // send initial values right away in case user doesn't want to add additional info
  // if (!page2) { sendForm(); }

  var thankHeight = $('#thank-you').height();
  var formHeight = $('#form-container').height();

  function redirect() {
    window.location.replace("https://growthgenius.io/growth-gigs");
  }

  $('#net-promoter').submit(function(e) {
    e.preventDefault();
    $('#submit').prop( "disabled", true );
    page3 = true;
    sendForm(function(error, result) {
      if (error) { 
        alert("Something broke... we'd appreciate you letting us know!");
        $('#submit').prop( "disabled", false );
      }
      if (result) {
        $('#thanks-placeholder').height(thankHeight);
        $('#success-container').height(formHeight);

        $('#form-container').fadeOut('fast', function() {
          $('#success-container').fadeIn('fast');
        })

        $('#thank-you').fadeOut('fast', function() {
          $('#thanks-placeholder').fadeIn('fast', function() {
            setTimeout(redirect, 1500)
          });
        })
      }
    });
  })

  $('#form-next').click(function(e) {
    e.preventDefault();
    // sendForm();
    $('#form-pg1').fadeOut('fast', function() {
      $('#form-pg2').fadeIn('fast');
      page2 = true;
      $('#comment').focus();
    })
  })

  window.addEventListener("beforeunload", function (e) {
    if (!page3) {
      sendForm(); // send form if user tries to close window

      var confirmationMessage = "\o/";
      e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
      return confirmationMessage;              // Gecko, WebKit, Chrome <34
    }
    
  });


  var map = {13: false, 16: false};

  $(document).keydown(function(e) {
    if (e.keyCode in map && page2) {
          map[e.keyCode] = true;
          if (map[13] && map[16]) {
              $('#net-promoter').submit();
          }
        }
    }).keyup(function(e) {
        if (e.keyCode in map) {
            map[e.keyCode] = false;
        }
    });

  function resetBlockHelper() {
    $('#helpBlock').fadeOut('slow', function() {
      $('#helpBlockHolder').fadeIn('fast');
    })
  }

  $(document).keypress(function (e) {
    if (e.which == 13 && !page2) {
      // $('#form-next').click();
    }

    if (e.which == 13 && page2) {
      let comVal = $('#comment').val()
      let retVal = comVal.concat('\r\n')
      $('#comment').val(retVal)

      $('#helpBlockHolder').fadeOut('fast', function() {
        $('#helpBlock').fadeIn('fast', function() {
          setTimeout(resetBlockHelper, 3500);
        })
      })
      return false;   
    }
  })


})