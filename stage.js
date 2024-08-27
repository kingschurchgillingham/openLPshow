/******************************************************************************
 * OpenLP - Open Source Lyrics Projection                                      *
 * --------------------------------------------------------------------------- *
 * Copyright (c) 2008-2021 OpenLP Developers                                   *
 * --------------------------------------------------------------------------- *
 * This program is free software; you can redistribute it and/or modify it     *
 * under the terms of the GNU General Public License as published by the Free  *
 * Software Foundation; version 2 of the License.                              *
 *                                                                             *
 * This program is distributed in the hope that it will be useful, but WITHOUT *
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or       *
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for    *
 * more details.                                                               *
 *                                                                             *
 * You should have received a copy of the GNU General Public License along     *
 * with this program; if not, write to the Free Software Foundation, Inc., 59  *
 * Temple Place, Suite 330, Boston, MA 02111-1307 USA                          *
 * *****************************************************************************
 *Olasunkanmi Arowolo 2/5/2024 10:00
Logo * @format
 */

// Global variable to determine if the slide should be hidden
var hideSlide = false;

// The main OpenLP object
window.OpenLP = {
  // Function to connect to the OpenLP Remote WebSocket and handle updates
  myWebSocket: function (data, status) {
    const host = window.location.hostname;
    const websocket_port = 4317;
    var myTwelve;

    // Create a new WebSocket connection
    ws = new WebSocket(`ws://${host}:${websocket_port}`);
    ws.onmessage = (event) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Parse the JSON data received from the WebSocket
        data = JSON.parse(reader.result.toString()).results;
        // Set some global variables
        OpenLP.myTwelve = data.twelve;
        const state = JSON.parse(reader.result.toString()).results;

        // Check the state and hide/show the body element accordingly
        if (state.blank || state.theme || state.display) {
          // Run code to blank your stage view here
          $("body").hide();
        } else {
          $("body").show();
        }

        // Check if the current item or service has changed, and update the UI accordingly
        if (OpenLP.currentItem != data.item || OpenLP.currentService != data.service) {
          $("#header").hide();
          $("#title").html("");
          $("#author").html("");
          $("#currentslide").hide();
          OpenLP.currentItem = data.item;
          OpenLP.currentService = data.service;
          OpenLP.loadSlides();
        } else if (OpenLP.currentSlide != data.slide) {
          $("#currentslide").hide();
          $("#header").hide();
          OpenLP.currentSlide = parseInt(data.slide, 10);
          OpenLP.updateSlide();
        } else {
          OpenLP.updateSlide();
        }

        // Update the current blank state
        OpenLP.currentBlank = data.blank;
      };
      reader.readAsText(event.data);
    };
  },

  // Function to load the service items
  loadService: function (event) {
    $.getJSON(
      "/api/v2/service/items", function (data, status) {
        for (idx in data) {
          var item = data[parseInt(idx, 10)];
          if(item["selected"]){
             OpenLP.currentPlugin = item["plugin"];
             break;
          }
        }
        OpenLP.updateSlide();
      }
    );
  },

  // Function to load the slides
  loadSlides: function (event) {
    $.getJSON("/api/v2/controller/live-items", function (data, status) {
        OpenLP.currentSlides = data.slides;
        OpenLP.currentSlide = 0;

        // Array of types of items that should hide the slide
        var dontWant = ["images", "presentations", "media"];

        // Determine if the current item type is in the "dontWant" array, and set the hideSlide flag accordingly
        if ($.inArray(data.name, dontWant) != -1) {
          hideSlide = true;
        } else {
          hideSlide = false;
        }

        // Handle the display of the song title and author based on the item type
        if(data.name=="songs"){
          let title = data.footer[0];
          let words = title.split(' ');
          let lastword = words[words.length-1];
          if(lastword.endsWith('.')){
            lastword = lastword.substr(0, lastword.length-1);
          }
          if(!isNaN(lastword)){
            title = words.slice(0, words.length-1).join(' ');
          }
          $("#title").html(title + '<br />');
          let footer = "";
          for(let i = 1; i<data.footer.length; i++){
            let text = data.footer[i];
            if(text.trim()!=""){
              if(text.startsWith("©")){
                text = text.substr(2);
              }
              footer += text + '<br>';
            }
          }
          $("#author").html(footer);
        } else if(data.name=="bibles") {
          $("#title").html(data.footer[0] +' <span class="biblename">'+"(" + data.footer[1]+ ")"+ '</span>  ');
          $("#author").html("");
        } else {
          $("#title").html("");
          $("#author").html("");
        }

        // Find the currently selected slide
        $.each(data.slides, function(idx, slide) {
          if (slide["selected"])
            OpenLP.currentSlide = idx;
        })
        OpenLP.loadService();
      }
    );
  },

  // Function to update the current slide
  updateSlide: function() {
    var slide = OpenLP.currentSlides[OpenLP.currentSlide];
    var text = slide["html"].trim();

    // Hide everything if the hideSlide flag is true
    if (hideSlide == true) {
      $("body").hide();
    }

    // If the slide is an image or from the media plugin, display nothing
    if (slide["img"] || OpenLP.currentPlugin == 'media') {
      text = '';
    }

    // Replace newlines with HTML line breaks
    text = text.replace(/\n/g, "<br>");
    if(text == '<br>'){
      text = '';
    }

    // Update the slide content
    $("#currenttext").html(text);
    if(text == '') {
        $("#currentslide").hide();
        $("#header").hide();
    } else {
        $("#currentslide").show();
        $("#currenttext").html(text);
        if(OpenLP.currentSlide == 0 || OpenLP.currentPlugin == 'bibles'){
           $("#header").show();
        }
    }
  },
}





// Set up AJAX caching
$.ajaxSetup({ cache: false });

// Start the WebSocket connection
OpenLP.myWebSocket();