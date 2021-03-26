jQuery(document).ready(function () {
  // click on next button
  jQuery(".design-wizard-next-btn").click(function () {
    var parentFieldset = jQuery(this).parents(".wizard-fieldset");
    var currentActiveStep = jQuery(this)
      .parents(".design-wizard")
      .find(".design-wizard-steps .active");
    var next = jQuery(this);
    var nextWizardStep = true;
    parentFieldset.find(".wizard-required").each(function () {
      var thisValue = jQuery(this).val();

      if (thisValue == "") {
        jQuery(this).siblings(".wizard-form-error").slideDown();
        nextWizardStep = false;
      } else {
        jQuery(this).siblings(".wizard-form-error").slideUp();
      }
    });
    if (nextWizardStep) {
      next.parents(".wizard-fieldset").removeClass("show", "400");
      currentActiveStep
        .removeClass("active")
        .addClass("activated")
        .next()
        .addClass("active", "400");
      next
        .parents(".wizard-fieldset")
        .next(".wizard-fieldset")
        .addClass("show", "400");
      jQuery(document)
        .find(".wizard-fieldset")
        .each(function () {
          if (jQuery(this).hasClass("show")) {
            var formAtrr = jQuery(this).attr("data-tab-content");
            jQuery(document)
              .find(".design-wizard-steps .design-wizard-step-item")
              .each(function () {
                if (jQuery(this).attr("data-attr") == formAtrr) {
                  jQuery(this).addClass("active");
                  var innerWidth = jQuery(this).innerWidth();
                  var position = jQuery(this).position();
                  jQuery(document)
                    .find(".design-wizard-step-move")
                    .css({ left: position.left, width: innerWidth });
                } else {
                  jQuery(this).removeClass("active");
                }
              });
          }
        });
    }
  });
  //click on previous button
  jQuery(".design-wizard-previous-btn").click(function () {
    var counter = parseInt(jQuery(".wizard-counter").text());
    var prev = jQuery(this);
    var currentActiveStep = jQuery(this)
      .parents(".design-wizard")
      .find(".design-wizard-steps .active");
    prev.parents(".wizard-fieldset").removeClass("show", "400");
    prev
      .parents(".wizard-fieldset")
      .prev(".wizard-fieldset")
      .addClass("show", "400");
    currentActiveStep
      .removeClass("active")
      .prev()
      .removeClass("activated")
      .addClass("active", "400");
    jQuery(document)
      .find(".wizard-fieldset")
      .each(function () {
        if (jQuery(this).hasClass("show")) {
          var formAtrr = jQuery(this).attr("data-tab-content");
          jQuery(document)
            .find(".design-wizard-steps .design-wizard-step-item")
            .each(function () {
              if (jQuery(this).attr("data-attr") == formAtrr) {
                jQuery(this).addClass("active");
                var innerWidth = jQuery(this).innerWidth();
                var position = jQuery(this).position();
                jQuery(document)
                  .find(".design-wizard-step-move")
                  .css({ left: position.left, width: innerWidth });
              } else {
                jQuery(this).removeClass("active");
              }
            });
        }
      });
  });
  //click on form submit button
  jQuery(document).on(
    "click",
    ".design-wizard .design-wizard-submit",
    function () {
      var parentFieldset = jQuery(this).parents(".wizard-fieldset");
      var currentActiveStep = jQuery(this)
        .parents(".design-wizard")
        .find(".design-wizard-steps .active");
      parentFieldset.find(".wizard-required").each(function () {
        var thisValue = jQuery(this).val();
        if (thisValue == "") {
          jQuery(this).siblings(".wizard-form-error").slideDown();
        } else {
          jQuery(this).siblings(".wizard-form-error").slideUp();
        }
      });
    }
  );
  // focus on input field check empty or not
  jQuery(".form-control")
    .on("focus", function () {
      var tmpThis = jQuery(this).val();
      if (tmpThis == "") {
        jQuery(this).parent().addClass("focus-input");
      } else if (tmpThis != "") {
        jQuery(this).parent().addClass("focus-input");
      }
    })
    .on("blur", function () {
      var tmpThis = jQuery(this).val();
      if (tmpThis == "") {
        jQuery(this).parent().removeClass("focus-input");
        jQuery(this).siblings(".wizard-form-error").slideDown("3000");
      } else if (tmpThis != "") {
        jQuery(this).parent().addClass("focus-input");
        jQuery(this).siblings(".wizard-form-error").slideUp("3000");
      }
    });
});

var tier1 = document.querySelector("tier1");
var filterResult1 = document.querySelector("#filterResult1");

tier1.addEventListener("change", function (e) {
  var target = e.target;
  var message;
  var genreDis = document.getElementById("genreSelected");
  var eraDis = document.getElementById("eraSelected");
  var movieDis = document.getElementById("movieSelected");
  var instDis = document.getElementById("instSelected");
  var regDis = document.getElementById("regSelected");
  var moodDis = document.getElementById("moodSelected");

  switch (target.id) {
    case "genre":
      genreDis.style.display = "block";
      eraDis.style.display = "none";
      movieDis.style.display = "none";
      instDis.style.display = "none";
      regDis.style.display = "none";
      moodDis.style.display = "none";
      break;
    case "era":
      genreDis.style.display = "none";
      eraDis.style.display = "block";
      movieDis.style.display = "none";
      instDis.style.display = "none";
      regDis.style.display = "none";
      moodDis.style.display = "none";
      break;
    case "movie":
      genreDis.style.display = "none";
      eraDis.style.display = "none";
      movieDis.style.display = "block";
      instDis.style.display = "none";
      regDis.style.display = "none";
      moodDis.style.display = "none";
      break;
    case "instrumentation":
      genreDis.style.display = "none";
      eraDis.style.display = "none";
      movieDis.style.display = "none";
      instDis.style.display = "block";
      regDis.style.display = "none";
      moodDis.style.display = "none";
      break;
    case "region":
      genreDis.style.display = "none";
      eraDis.style.display = "none";
      movieDis.style.display = "none";
      instDis.style.display = "none";
      regDis.style.display = "block";
      moodDis.style.display = "none";
      break;
    case "moods":
      genreDis.style.display = "none";
      eraDis.style.display = "none";
      movieDis.style.display = "none";
      instDis.style.display = "none";
      regDis.style.display = "none";
      moodDis.style.display = "block";
      break;
  }
});
