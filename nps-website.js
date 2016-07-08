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
  if (devEnv)  { return 'DEV' + Math.random().toString(36).substr(2, 5) }
  if (!devEnv) { return Math.random().toString(36).substr(2, 8) }
}

function sendForm(callback) {
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
  devEnv = (window.location.hostname === 'netpro.dev');

$(document).ready(function() {

  // set uid to enable tracking multiple submits
  var xuid = uid();
  $('#uid').val(xuid)

  // set date on form
  $('#date').val( new Date() )

  // set rating based on URL query
  var rating = getParameterByName('nps')
  $('#rating').val(rating)

  // send initial values right away in case user doesn't want to add additional info
  sendForm(function(error, result) { console.log(error); console.log(result); });

  var thankHeight = $('#thank-you').height();
  var formHeight = $('#form-container').height();

  $('#net-promoter').submit(function(e) {
    e.preventDefault();
    $('#submit').prop( "disabled", true );
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
          $('#thanks-placeholder').fadeIn('fast');
        })
      }
    });
  })


})