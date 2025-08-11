/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Swiper from "swiper";
import { addEvent, removeEvent } from "../../js/events/events";
import { triggerCustomEvent } from "../../js/events/triggerCustomEvent";
import { enableScrollLock, disableScrollLock } from "../../js/dom/scrollLock";

export default class TicketCalculatorInit {
  /**
   * The constructor is fired once the class is instantiated.
   *
   * @param {HTMLElement} container
   */
  constructor(container, object) {
    // Run initializing code once the this.dom is ready.
    this.init(container, object);
  }

  init(container, object) {
    this.settings = object;

    //Predefine public variables
    this.dom = {};
    this.inputObj = {};
    this.responseText = [];
    this.ticketProcentageArray = [];
    this.threeYearText = false;
    this.topInfo = {};
    this.roadTypes = {};
    this.roadSelectRun = true;
    this.speedLimitOptions = [];
    this.presentation = {};
    this.defaultInput = {};
    this.showTexts = [];
    this.hiddenPresentation = false;
    this.speedLimits = [];

    // Set default input object
    this.inputObj = {
      speed: 40,
      roadType: "country",
      speedLimit: 80,
      trailers: "",
      roadwork: false,
      vehicle: "car"
    };

    // Save in this.defaultInput for later use
    this.defaultInput = this.inputObj;

    //Avaible this.roadTypes
    this.roadTypes = {
      city: {
        text: "Byvej",
        def: 50,
        max: 80,
        min: 30
      },
      country: {
        text: "Land- /Motortrafikvej",
        def: 80,
        max: 90,
        min: 40
      },
      highway: {
        text: "Motorvej",
        def: 130,
        max: 130,
        min: 40
      }
    };

    //Avaible this.speedLimits
    this.speedLimits = [30, 40, 50, 60, 70, 80, 90, 100, 110, 130];

    // Get and store the this.dom-reference to the container we've been given.
    this.dom.container = container;

    // Fetch this.dom elements one time that we will use later
    this.dom.body = document.body;

    this.dom.stepSectionWrappers = this.dom.container.querySelector(
      ".step-section-wrapper"
    );
    this.dom.toggleArrowMobile = this.dom.container.querySelector(
      ".toggle-arrow-mobile"
    );

    this.dom.vehicleSlider = this.dom.container.querySelector(
      ".vehicle-slider"
    );
    this.dom.trailerSelect = this.dom.container.querySelector(
      ".trailer-select"
    );
    this.dom.trailerWrapper = this.dom.container.querySelector(
      ".trailer-wrapper"
    );
    this.dom.roadSelector = this.dom.container.querySelector(".road-select");
    this.dom.roadword = this.dom.container.querySelector(
      ".road-work--tick-box"
    );
    this.dom.roadSlider = this.dom.container.querySelector(".road-slider");
    this.dom.speedLimitslider = this.dom.container.querySelector(
      ".speedlimit-slider"
    );

    this.dom.speedInputSlider = this.dom.container.querySelector(
      ".speedInput-slider"
    );
    this.dom.speedInput = this.dom.container.querySelector("#speed-input");

    // Result modal
    this.dom.resultModal = this.dom.container.querySelector(
      ".resultModalWrapper"
    );
    this.dom.resultModalClose = this.dom.resultModal.querySelector(
      ".resultModal__close"
    );
    this.dom.fineWrapper = this.dom.resultModal.querySelector(".fineWrapper");
    this.dom.fineNumber = this.dom.fineWrapper.querySelector(".fineNumber");
    this.dom.fineText = this.dom.fineWrapper.querySelector(".fineText");
    this.dom.noFine = this.dom.fineWrapper.querySelector(".noFine");
    this.dom.resultModalChildren = this.dom.resultModal.querySelector(
      ".info-text"
    );
    this.dom.resultRandomTextContainer = this.dom.resultModal.querySelector(
      ".resultModal.bottom > .richtextinput"
    );
    this.dom.mytestSelections = this.dom.resultModal.querySelector(
      ".mytest-selections > p.toptext"
    );
    this.dom.tryagainBtn = this.dom.resultModal.querySelector(".tryagain-btn");

    this.dom.resultModalOverlay = this.dom.container.querySelector(
      ".resultModalOverlay"
    );

    // Set the sliders options and this.dom element
    this.sliders = [
      {
        name: "vehicle",
        slider: this.dom.vehicleSlider,
        options: {
          slidesPerView: "auto",
          centeredSlides: true,
          initialSlide: 2,
          a11y: {
            enabled: true
          },

          breakpoints: {
            1024: {
              slidesPerView: 5,
              centeredSlides: true,
              centeredSlidesBounds: true,
              spaceBetween: 20,
              allowSlideNext: false,
              allowSlidePrev: false,
              allowTouchMove: false
            }
          }
        }
      },
      {
        name: "road",
        slider: this.dom.roadSlider,
        options: {
          slidesPerView: "auto",
          centeredSlides: true,
          initialSlide: 1,
          a11y: {
            enabled: true
          },

          breakpoints: {
            500: {
              allowSlideNext: false,
              allowSlidePrev: false,
              allowTouchMove: false
            },
            1024: {
              slidesPerView: 5,
              centeredSlides: true,
              spaceBetween: 20,
              allowSlideNext: false,
              allowSlidePrev: false,
              allowTouchMove: false
            }
          }
        }
      },
      {
        name: "speedInput",
        slider: this.dom.speedInputSlider,
        options: {
          centeredSlides: true,
          slidesPerView: "auto",
          initialSlide: 0,
          a11y: {
            enabled: true
          }
        }
      },
      {
        name: "speedlimit",
        slider: this.dom.speedLimitslider,
        options: {
          centeredSlides: true,
          slidesPerView: "auto",
          initialSlide: 4,
          observer: true,
          a11y: {
            enabled: true
          }
        }
      }
    ];

    // Start listening to user input
    this.listenToInput();

    // Init slider
    this.slider();
  }

  /**
   * Functionality for listening to trailer change by vehicle selected
   */
  trailerChangeByVehicle(vehicle) {
    if (vehicle === "truck" || vehicle === "mc" || vehicle === "bus") {
      this.dom.container.querySelector(
        ".trailer.trailer-tempo100"
      ).style.display = "none";
      if (this.inputObj.trailers === "trailer-tempo100") {
        triggerCustomEvent(
          this.dom.container.querySelectorAll(".trailer")[0],
          "click"
        );
      }
    } else {
      this.dom.container.querySelector(
        ".trailer.trailer-tempo100"
      ).style.display = "block";
    }
  }

  /**
   * Functionality for listening to available this.speedLimits change by roadtype selected
   */
  speedLimitsChangeByRoadtype(roadType) {
    // Get road value
    this.inputObj.roadType = roadType;
    this.speedLimitFill();
  }

  /**
   * All functionality for listening to this.dom interactions
   */
  listenToInput() {
    var speed = 0,
      roadType = "",
      vehicle = "";

    // Get vehicle value for desktop click event
    addEvent(this.dom.container.querySelectorAll(".vehicle"), "click", e => {
      var $this = e.currentTarget,
        $parent = e.currentTarget.parentElement;

      $parent.querySelector(".selected")?.classList.remove("selected");
      $this.classList.add("selected");
      vehicle = $this.getAttribute("data-vehicle");
      this.vehicleModule(vehicle);

      this.sliders[0].slider.swiper.slideTo(
        parseInt($this.getAttribute("data-index"))
      );

      if (
        $this.dataset.vehicle === "truck" ||
        $this.dataset.vehicle === "mc" ||
        $this.dataset.vehicle === "bus"
      ) {
        this.dom.container.querySelector(
          ".trailer.trailer-tempo100"
        ).style.display = "none";
        if (this.inputObj.trailers === "trailer-tempo100") {
          this.dom.container.querySelectorAll(".trailer")[0].click();
        }
      } else {
        this.dom.container.querySelector(
          ".trailer.trailer-tempo100"
        ).style.display = "block";
      }
    });

    // Get trailer value
    addEvent(
      this.dom.container.querySelectorAll('input[name="trailer"]'),
      "change",
      e => {
        this.inputObj.trailers = e.currentTarget.value;
        this.speedLimitFill();
      }
    );

    // Get road value desktop click event
    addEvent(this.dom.roadSelector.querySelectorAll(".road"), "click", e => {
      var $this = e.currentTarget,
        $parent = e.currentTarget.parentElement;

      roadType = $this.getAttribute("data-road");
      $parent.querySelector(".selected").classList.remove("selected");
      $this.classList.add("selected");

      this.sliders[1].slider.swiper.slideTo(
        parseInt($this.getAttribute("data-index"))
      );
      this.inputObj.roadType = roadType;

      this.speedLimitFill();
    });

    // Get roadwork value
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addEvent(this.dom.roadword, "change", e => {
      this.inputObj.roadwork = !this.inputObj.roadwork;
    });

    // Focusout speed value
    addEvent(this.dom.speedInput, "focusout", e => {
      speed = parseInt(e.currentTarget.value);
      if (speed < 40) {
        speed = 40;
      }
      if (speed > 250) {
        speed = 250;
      }
      this.speedInputCenter(speed);
    });
    // Get speed value
    addEvent(this.dom.speedInput, "input", e => {
      this.inputObj.speed = e.target.value;
    });
    // On enter search
    addEvent(this.dom.speedInput, "keydown", e => {
      if (e.keyCode === 13) {
        const elementOfValue = this.dom.speedInputSlider.querySelector(
          "[data-speed='" + e.target.value + "']"
        );

        if (elementOfValue) {
          const index = Array.prototype.slice
            .call(this.dom.speedInputSlider.querySelectorAll("button"))
            .indexOf(elementOfValue);

          this.dom.speedInputSlider.swiper.slideTo(index);
        }
        this.calcAndProduceTicket();
        this.dom.speedInput.blur();
      }
    });

    //Calculate the ticket
    addEvent(this.dom.container.querySelector(".calc-button"), "click", () => {
      this.calcAndProduceTicket();
    });

    //Start over
    addEvent(this.dom.resultModalClose, "click", e => {
      e.preventDefault();
      this.hideModal();
    });
    addEvent(this.dom.tryagainBtn, "click", e => {
      e.preventDefault();
      this.hideModal();
    });
  }

  vehicleModule(vehicle) {
    this.trailerChangeByVehicle(vehicle);
    this.inputObj.vehicle = vehicle;
    this.speedLimitFill();
  }

  speedLimitModule(speedLimit) {
    this.inputObj.speedLimit = parseInt(speedLimit);
  }

  speedInputCenter(speedLimit) {
    var speedItem = this.dom.container.querySelector(
      '.speed-input[data-speed="' + speedLimit + '"]'
    );
    if (speedItem !== null) {
      var speedValue = speedItem.getAttribute("data-index");
      this.dom.speedInputSlider.swiper.slideTo(parseInt(speedValue));
    }
  }

  getRandomKeyFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Capitalize first letter
  capitalizeFirstLetters(str) {
    str =
      str.toUpperCase().substr(0, 1) + str.toLowerCase().substr(1, str.length);
    return str.split("tempo").join("Tempo");
  }

  displayResult(fine, texts) {
    this.showTexts = typeof texts !== "undefined" ? texts : [];

    // Set dom text from result text array
    if (this.settings.randomTexts) {
      const domText = this.getRandomKeyFromArray(this.settings.randomTexts);
      this.dom.resultRandomTextContainer.innerHTML =
        domText.TicketCalculatorResponseText;
    }

    this.showTexts.map(showText => {
      this.dom.resultModal
        .querySelector("." + showText)
        .classList.add("active");
    });

    // Add/remove old fine
    if (fine !== 0) {
      this.dom.fineNumber.classList.add("active");
      this.dom.fineText.classList.add("active");
      this.dom.fineNumber.textContent = fine + " kr.";
    } else {
      this.dom.fineNumber.classList.remove("active");
      this.dom.fineText.classList.remove("active");
      this.dom.fineNumber.textContent = "";
    }

    // MyTest selection
    // Verhicle text
    var mytestText = "";
    mytestText += this.dom.vehicleSlider.querySelector(".vehicle.selected > p")
      .textContent;

    // Trailer text
    var selectedTrailer = this.dom.trailerWrapper.querySelector(
      "input[name='trailer']:checked"
    );
    mytestText +=
      selectedTrailer.value !== ""
        ? " med " + selectedTrailer.nextElementSibling.textContent
        : "";

    // Speed limit
    mytestText +=
      ", hastighedsgrænse " +
      this.dom.speedLimitslider.querySelector(".speed-limit.selected").dataset
        .speed +
      " km/t";

    // Road text
    mytestText +=
      ", " +
      this.dom.roadSelector.querySelector(".road.selected > p").textContent;

    mytestText += this.dom.roadword.checked
      ? ", " + this.dom.roadword.nextElementSibling.textContent
      : "";

    // My speed
    mytestText += " og din fart " + this.inputObj.speed + " km/t.";

    this.dom.mytestSelections.textContent = this.capitalizeFirstLetters(
      mytestText
    );

    // Show modal
    this.dom.body.classList.add("resultModalActiveBody");
    this.dom.resultModalOverlay.classList.add("active");
    this.dom.resultModalOverlay.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
    enableScrollLock();
  }

  /**
   * Hides the result modal
   */
  hideModal() {
    this.showTexts.map(showText => {
      this.dom.container
        .querySelector("." + showText)
        .classList.remove("active");
    });
    this.dom.body.classList.remove("resultModalActiveBody");
    disableScrollLock();
    this.dom.resultModalOverlay.classList.remove("active");
  }

  /**
   * Calculates the span of this.speedLimits avaible based on the chosen criteria
   */
  speedLimitFill() {
    if (!this.inputObj.roadType) {
      return;
    }

    var maxLimit;
    var minLimit = this.speedLimits[0];

    var defaultLimit = 50;
    maxLimit = this.roadTypes[this.inputObj.roadType].max;
    minLimit = this.roadTypes[this.inputObj.roadType].min;
    defaultLimit = this.roadTypes[this.inputObj.roadType].def;

    // MC and Car - City and Country
    if (this.inputObj.vehicle === "mc" || this.inputObj.vehicle === "car") {
      if (this.inputObj.roadType === "city") {
        maxLimit = 70;
        defaultLimit = 50;
      } else if (this.inputObj.roadType === "country") {
        minLimit = 40;
        maxLimit = 100;
        defaultLimit = 80;
      }
    }

    // Car - Highway
    if (this.inputObj.vehicle === "mc" || this.inputObj.vehicle === "car") {
      if (this.inputObj.roadType === "highway") {
        minLimit = 50;
        maxLimit = 130;
        defaultLimit = 130;
      }
    }

    // Car with normal trailer - Country and highway
    if (
      (this.inputObj.vehicle === "mc" || this.inputObj.vehicle === "car") &&
      this.inputObj.trailers === "trailer"
    ) {
      if (this.inputObj.roadType === "country") {
        minLimit = 40;
        maxLimit = 80;
        defaultLimit = 80;
      } else if (this.inputObj.roadType === "highway") {
        minLimit = 50;
        maxLimit = 80;
        defaultLimit = 80;
      }
    }

    // Car with tempo100 trailer - Highway
    if (
      this.inputObj.vehicle === "car" &&
      this.inputObj.trailers === "trailer-tempo100"
    ) {
      if (this.inputObj.roadType === "country") {
        minLimit = 50;
        maxLimit = 80;
        defaultLimit = 80;
      } else if (this.inputObj.roadType === "highway") {
        minLimit = 50;
        maxLimit = 100;
        defaultLimit = 100;
      }
    }

    // Bus and Bus100 - City and Country
    if (this.inputObj.vehicle === "bus" || this.inputObj.vehicle === "bus100") {
      if (this.inputObj.roadType === "city") {
        maxLimit = 70;
        defaultLimit = 50;
      }
      if (this.inputObj.roadType === "country") {
        minLimit = 40;
        maxLimit = 80;
        defaultLimit = 80;
      }
    }

    // Bus - Highway
    if (
      this.inputObj.vehicle === "bus" &&
      this.inputObj.roadType === "highway"
    ) {
      minLimit = 50;
      maxLimit = 80;
      defaultLimit = 80;
    }

    // Bus100 - Highway
    if (this.inputObj.vehicle === "bus100") {
      if (this.inputObj.roadType === "highway") {
        minLimit = 50;
        maxLimit = 80;
        defaultLimit = 80;
      }

      if (this.inputObj.trailers === "trailer") {
        if (this.inputObj.roadType === "highway") {
          minLimit = 50;
          maxLimit = 80;
          defaultLimit = 60;
        }
      }
    }

    // Truck - City, Country and Highway
    if (this.inputObj.vehicle === "truck") {
      if (this.inputObj.roadType === "city") {
        maxLimit = 70;
        defaultLimit = 50;
      } else if (this.inputObj.roadType === "country") {
        minLimit = 40;
        maxLimit = 80;
        defaultLimit = 80;
      } else if (this.inputObj.roadType === "highway") {
        minLimit = 50;
        maxLimit = 80;
        defaultLimit = 80;
      }
    }

    this.speedLimitOptions = {
      default: 0,
      options: []
    };

    //Get the index of the minimum and maximum speedlimit in our this.speedLimits array
    var minIndex = this.speedLimits.indexOf(minLimit);
    var maxIndex = this.speedLimits.indexOf(maxLimit);

    //Increment with one as slice just gives the span between and not including the last
    maxIndex += 1;
    this.speedLimitOptions.default = defaultLimit;
    this.speedLimitOptions.options = this.speedLimits.slice(minIndex, maxIndex);

    this.inputObj.speedLimit = defaultLimit;
    console.log("t2", this.speedLimitOptions);

    triggerCustomEvent(this.dom.speedLimitslider, "speedlimitUpdated");
  }

  /**
   * Calculates the result - both ticket amount and info texts
   */
  calcAndProduceTicket() {
    var fine = 0,
      displayTexts = [],
      e = 0;

    var pctOver = (this.inputObj.speed / this.inputObj.speedLimit) * 100 - 100;

    if (!this.inputObj.speed || this.inputObj.speed === 0) {
      return false;
    }
    if (this.inputObj.speed > 300) {
      this.displayResult(0, ["overSpeed"]);
      return false;
    }

    if (this.inputObj.speedLimit >= this.inputObj.speed) {
      this.displayResult(0, ["noFine"]);
      return false;
    }

    if (this.inputObj.vehicle === "truck" && this.inputObj.speed > 90) {
      displayTexts.push("truck");
    } else if (this.inputObj.vehicle === "bus" && this.inputObj.speed > 100) {
      displayTexts.push("bus");
    } else if (
      this.inputObj.vehicle === "bus100" &&
      this.inputObj.speed > 100
    ) {
      displayTexts.push("bus-tempo100");
    }

    console.log("Procent", pctOver);

    if (
      this.inputObj.speed >= 200 ||
      ((this.inputObj.vehicle === "car" || this.inputObj.vehicle === "mc") &&
        this.inputObj.trailers === "" &&
        pctOver >= 101 &&
        this.inputObj.speed >= 101) ||
      ((this.inputObj.vehicle === "car" || this.inputObj.vehicle === "mc") &&
        this.inputObj.trailers !== "" &&
        pctOver >= 100 &&
        this.inputObj.speed >= 101) ||
      ((this.inputObj.vehicle.startsWith("bus") ||
        this.inputObj.vehicle === "truck") &&
        pctOver >= 101 &&
        this.inputObj.speed >= 101)
    ) {
      displayTexts.push("ubet");
      displayTexts.push("ubetplusoffer");
      this.displayResult(0, displayTexts);
      return false;
    }

    // Set numbers for ticket calculation.
    this.ticketProcentageArray = [
      {
        pct: 0,
        rate1: 1200,
        rate2: 1200,
        rate3: 1800
      },
      {
        pct: 20,
        rate1: 1800,
        rate2: 1800,
        rate3: 1800
      },
      {
        pct: 30,
        rate1: 1800,
        rate2: 2400,
        rate3: 2400
      },
      {
        pct: 40,
        rate1: 2400,
        rate2: 3000,
        rate3: 3000
      },
      {
        pct: 50,
        rate1: 2400,
        rate2: 3600,
        rate3: 3600
      },
      {
        pct: 60,
        rate1: 3000,
        rate2: 4200,
        rate3: 4200
      },
      {
        pct: 70,
        rate1: 3600,
        rate2: 5400,
        rate3: 5400
      },
      {
        pct: 80,
        rate1: 4200,
        rate2: 6000,
        rate3: 6000
      },
      {
        pct: 90,
        rate1: 5400,
        rate2: 7800,
        rate3: 7800
      },
      {
        pct: 100,
        rate1: 6000,
        rate2: 9000,
        rate3: 9000
      }
    ];

    // rate1 - Under/= 100km og mc eller car og ingen trailer
    // rate3 - Bus eller truck eller, mc eller car og trailer eller trailer-tempo100
    // rate2 - Over/= 100km og mc eller car

    var i = this.ticketProcentageArray.length;
    for (i >= 0; i--;) {
      if (pctOver >= this.ticketProcentageArray[i].pct) {
        if (
          this.inputObj.speedLimit < 100 &&
          (this.inputObj.vehicle === "mc" || this.inputObj.vehicle === "car") &&
          this.inputObj.trailers === ""
        ) {
          fine += this.ticketProcentageArray[i].rate1;
          console.log("Rate 1", fine, "Procent", pctOver);
        } else {
          if (
            this.inputObj.vehicle.startsWith("bus") ||
            this.inputObj.vehicle === "truck" ||
            ((this.inputObj.vehicle === "mc" ||
              this.inputObj.vehicle === "car") &&
              (this.inputObj.trailers === "trailer" ||
                this.inputObj.trailers === "trailer-tempo100"))
          ) {
            fine += this.ticketProcentageArray[i].rate3;
            console.log("Rate 3", fine, "Procent", pctOver);
          } else {
            if (
              this.inputObj.speedLimit >= 100 &&
              (this.inputObj.vehicle === "mc" ||
                this.inputObj.vehicle === "car")
            ) {
              fine += this.ticketProcentageArray[i].rate2;
              console.log("Rate 2", fine, "Procent", pctOver);
            }
          }
        }
        break;
      }
    }

    console.log("roadType", this.inputObj.roadType);
    console.log("speedLimit", this.inputObj.speedLimit);
    console.log("speed", this.inputObj.speed);
    // Highspeed  and over/= 30
    if (
      (this.inputObj.roadType === "city" ||
        (this.inputObj.roadType === "country" &&
          this.inputObj.speedLimit <= 90)) &&
      pctOver >= 30
    ) {
      fine += this.ticketProcentageArray[0].rate1;
      console.log(
        "Fine highspeed over/= 30%",
        fine -
        this.ticketProcentageArray[0].rate1 +
        "+" +
        this.ticketProcentageArray[0].rate1,
        " = " + fine
      );
    }

    // Speed over/= 140
    if (this.inputObj.speed >= 140) {
      console.log(
        "Fine: " + fine,
        "Speed times over: " + Math.floor((this.inputObj.speed - 140) / 10),
        "Speed times over * 600: " +
        Math.floor((this.inputObj.speed - 140) / 10) * 600
      );
      e =
        Math.floor((this.inputObj.speed - 140) / 10) *
        (this.ticketProcentageArray[0].rate1 / 2) +
        this.ticketProcentageArray[0].rate1;
      fine += e;
      console.log("Fine over/= 140 km", fine - e + "+" + e, " = " + fine);
    }

    // Roadwork
    if (this.inputObj.roadwork) {
      fine *= 2;
      console.log("Roadwork dubble-up", fine);
    }

    // Texts to show
    if (pctOver > 40 && this.inputObj.roadwork) {
      displayTexts.push("betkor");
    } else {
      if (
        pctOver > 40 &&
        (this.inputObj.vehicle.startsWith("bus") ||
          this.inputObj.vehicle === "truck" ||
          ((this.inputObj.vehicle === "truck" ||
            this.inputObj.vehicle === "mc" ||
            this.inputObj.vehicle === "car") &&
            (this.inputObj.trailers === "trailer" ||
              this.inputObj.trailers === "trailer-tempo100")))
      ) {
        displayTexts.push("betkor");
      } else {
        if (
          (pctOver > 60 &&
            (this.inputObj.vehicle === "mc" ||
              this.inputObj.vehicle === "car") &&
            this.inputObj.trailers === "") ||
          this.inputObj.speed >= 160
        ) {
          displayTexts.push("betkor");
        } else {
          if (pctOver > 30) {
            displayTexts.push("klip");
          }
        }
      }
    }
    fine = this.formatNumbers(fine);
    this.displayResult(fine, displayTexts);
  }

  // Format numbers
  formatNumbers(obj) {
    var cx = /(\d+)(\d{3})/;
    return String(obj).replace(/^\d+/, function (text) {
      for (; cx.test(text);) {
        text = text.replace(cx, "$1.$2");
      }
      return text;
    });
  }

  /**
   * Initializes slider functionality
   *  @uses http://kenwheeler.github.io/slick/ as bower component
   */
  slider() {
    // Loop through each slider, initalize and set options.
    this.sliders.map(slider => {
      const swiper = new Swiper(slider.slider, slider.options);

      if (slider.name === "speedlimit") {
        this.speedLimitslider = swiper;
      }

      if (slider.name === "speedlimit" || slider.name === "speedInput") {
        const slides = slider.slider.querySelectorAll("button");
        addEvent(slides, "click", e => {
          var index = parseInt(e.currentTarget.getAttribute("data-index"));
          swiper.slideTo(index);
        });
      }

      swiper.on("activeIndexChange", event => {
        // Get the current slide
        let selected = event.el.querySelector(".selected");
        if (selected) {
          selected.classList.remove("selected");
        }

        const currentElement = event.el.querySelector(
          'button[data-index="' + event.activeIndex + '"]'
        );
        currentElement.classList.add("selected");

        // Each slider has different functionalities for input values
        if (slider.name === "vehicle") {
          var vehicle = currentElement.dataset.vehicle;
          this.vehicleModule(vehicle);
        } else if (slider.name === "road") {
          var roadType = currentElement.dataset.road;
          this.speedLimitsChangeByRoadtype(roadType);
        } else if (slider.name === "speedlimit") {
          var speedLimit = currentElement.getAttribute("data-speed");
          this.speedLimitModule(speedLimit);
          this.speedInputCenter(speedLimit);
        } else if (slider.name === "speedInput") {
          var yourSpeed = parseInt(currentElement.getAttribute("data-speed"));
          console.log(yourSpeed);
          this.dom.speedInput.value = yourSpeed;
          this.inputObj.speed = yourSpeed;
        }
      });
    });

    var speedLimitslider = this.sliders[3].slider;
    var options = this.sliders[3].options;

    addEvent(speedLimitslider, "speedlimitUpdated", () => {
      if (this.speedLimitOptions.length === 0) {
        return;
      }
      var sliderElements = [];
      var defaultIndex = 0;
      console.log("t");
      removeEvent(speedLimitslider.querySelectorAll(".speed-limit"), "click");
      this.speedLimitslider.destroy();
      this.speedLimitOptions.options.map((speedLimit, indexSlide) => {
        var sliderElement = "";
        if (speedLimit === this.speedLimitOptions.default) {
          defaultIndex = indexSlide;
          sliderElement = `<button data-index="${indexSlide}" data-speed="${speedLimit}" class="speed-limit swiper-slide selected"><img src="${this.settings.imageFolder}img/ticketcalculator/speedlimits/${speedLimit}.svg" type="image/svg+xml" /></button>`;
        } else {
          sliderElement = `<button data-index="${indexSlide}" data-speed="${speedLimit}" class="speed-limit swiper-slide"><img src="${this.settings.imageFolder}img/ticketcalculator/speedlimits/${speedLimit}.svg" type="image/svg+xml" /></button>`;
        }

        sliderElements.push(sliderElement);
      });

      var html = sliderElements.join("");
      speedLimitslider.innerHTML = `<div class="swiper-wrapper">${html}</div`;

      addEvent(
        speedLimitslider.querySelectorAll(".speed-limit"),
        "click",
        e => {
          var index = parseInt(e.currentTarget.getAttribute("data-index"));
          this.speedLimitslider.slideTo(index);
        }
      );

      this.speedLimitslider = new Swiper(this.dom.speedLimitslider, options);
      this.speedLimitslider.on("activeIndexChange", event => {
        let selected = event.el.querySelector(".selected");
        if (selected) {
          selected.classList.remove("selected");
        }

        const currentElement = event.el.querySelector(
          'button[data-index="' + event.activeIndex + '"]'
        );
        currentElement.classList.add("selected");

        var speedLimit = currentElement.getAttribute("data-speed");
        this.speedLimitModule(speedLimit);
        this.speedInputCenter(speedLimit);
      });
      this.speedLimitslider.slideTo(defaultIndex, true);
    });
  }
}
