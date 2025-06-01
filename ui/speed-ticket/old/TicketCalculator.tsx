import React, { useRef, useEffect } from "react";
import Anime from "react-anime";
import { useInView } from "react-intersection-observer";
import { animeChildrenProps } from "@helpers/animations";
import { Heading } from "@components/Heading/Heading";
import stylesHeading from "@components/Heading/styles.module.scss";
import { Container } from "@components/Container/Container";

export interface TicketCalculatorProps {
  imageFolder: string;
  headline?: string;
  randomTexts?: string[];
}

interface initTicketCalculatorProps {
  imageFolder: string;
  randomTexts?: string[];
}

async function initializeTicketCalculator(
  ref: HTMLElement,
  settings: initTicketCalculatorProps
) {
  const { default: TicketCalculatorInit } = await import(
    "./TicketCalculator.init.js"
  );
  new TicketCalculatorInit(ref, settings);
}

const TicketCalculator: React.FC<TicketCalculatorProps> = ({
  imageFolder,
  headline,
  randomTexts
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.2
  });
  const animateEachChild = {
    ...animeChildrenProps,
    ...(inView ? { autoplay: true } : { autoplay: false })
  };

  useEffect(() => {
    if (containerRef.current) {
      initializeTicketCalculator(containerRef.current, {
        imageFolder: imageFolder,
        randomTexts: randomTexts
      });
    }
  }, [imageFolder, randomTexts]);

  return (
    <div ref={containerRef} className="ticketcalculator-ribbon">
      <section ref={ref} className="ticketcalculator">
        {headline && (
          <Container variant="noBottom">
            <Heading
              as="h2"
              center={true}
              className={stylesHeading.headingRibbon}
            >
              {headline}
            </Heading>
          </Container>
        )}

        <Anime {...animateEachChild}>
          <div className="row top">
            <div className="step-title">Køretøj</div>
            <div className="ticketcalculator-vehicle">
              <div className="step-section-wrapper vehicle-wrapper active-section">
                <div className="vehicle-slider global-slider-styles swiper-container">
                  <div className="swiper-wrapper">
                    <button
                      className="swiper-slide vehicle"
                      data-vehicle="mc"
                      data-index="0"
                    >
                      <img
                        width="89"
                        height="89"
                        src={`${imageFolder}img/ticketcalculator/vehicles/ticket-mc.svg`}
                        alt="Motorcykel"
                      />
                      <p>Motorcykel</p>
                    </button>
                    <button
                      className="swiper-slide vehicle"
                      data-vehicle="truck"
                      data-index="1"
                    >
                      <img
                        width="89"
                        height="89"
                        src={`${imageFolder}img/ticketcalculator/vehicles/ticket-truck.svg`}
                        alt="Lastbil"
                      />
                      <p>Lastbil</p>
                    </button>
                    <button
                      className="swiper-slide swiper-slide-active vehicle selected"
                      data-vehicle="car"
                      data-index="2"
                    >
                      <img
                        width="89"
                        height="89"
                        src={`${imageFolder}img/ticketcalculator/vehicles/ticket-car.svg`}
                        alt="Personbil"
                      />
                      <p>Personbil</p>
                    </button>
                    <button
                      className="swiper-slide vehicle"
                      data-vehicle="bus"
                      data-index="3"
                    >
                      <img
                        width="89"
                        height="89"
                        src={`${imageFolder}img/ticketcalculator/vehicles/ticket-bus.svg`}
                        alt="Bus"
                      />
                      <p>Bus</p>
                    </button>
                    <button
                      className="swiper-slide vehicle"
                      data-vehicle="bus100"
                      data-index="4"
                    >
                      <img
                        width="89"
                        height="89"
                        src={`${imageFolder}img/ticketcalculator/vehicles/ticket-bus100.svg`}
                        alt="Bus Tempo 100"
                      />
                      <p>Bus Tempo 100</p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="trailer-select">
                <div className="step-section-wrapper">
                  <div className="trailer-title">
                    <p
                      data-default-text="Anhænger?"
                      className="selectedtext step-title"
                    >
                      Anhænger?
                    </p>
                  </div>
                  <div className="trailer-wrapper">
                    <label className="trailer tick-box" htmlFor="trailer1">
                      <input
                        type="radio"
                        name="trailer"
                        id="trailer1"
                        value=""
                        defaultChecked
                      />
                      <span className="trailer-text">Ingen anhænger</span>
                    </label>
                    <label className="trailer tick-box" htmlFor="trailer2">
                      <input
                        type="radio"
                        name="trailer"
                        id="trailer2"
                        value="trailer"
                      />
                      <span className="trailer-text">Almindelig anhænger</span>
                    </label>
                    <label
                      className="trailer trailer-tempo100 tick-box"
                      htmlFor="trailer3"
                    >
                      <input
                        type="radio"
                        name="trailer"
                        id="trailer3"
                        value="trailer-tempo100"
                      />
                      <span className="trailer-text">Tempo 100-godkendt anhænger</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="step-title">Vejtype</div>
            <div className="ticketcalculator-road">
              <div className="step-section-wrapper road-wrapper">
                <div className="road-slider global-slider-styles road-select swiper-container">
                  <div className="swiper-wrapper">
                    <button
                      data-road="city"
                      className="swiper-slide road"
                      data-index="0"
                    >
                      <img
                        width="65"
                        height="65"
                        src={`${imageFolder}img/ticketcalculator/roads/ticket-city.svg`}
                        alt="Byzone"
                      />
                      <p>Byzone</p>
                    </button>
                    <button
                      data-road="country"
                      data-index="1"
                      className="swiper-slide swiper-slide-active road selected"
                    >
                      <img
                        width="65"
                        height="65"
                        src={`${imageFolder}img/ticketcalculator/roads/ticket-country.svg`}
                        alt="Landevej / Motortrafikvej"
                      />
                      <p>Landevej / Motortrafikvej</p>
                    </button>
                    <button
                      data-road="highway"
                      data-index="2"
                      className="swiper-slide road"
                    >
                      <img
                        width="65"
                        height="65"
                        src={`${imageFolder}img/ticketcalculator/roads/ticket-highway.svg`}
                        alt="Motorvej"
                      />
                      <p>Motorvej</p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="road-work">
                <div className="road-title">
                  <p
                    data-default-text="Vejarbejde?"
                    className="selectedtext step-title"
                  >
                    Vejarbejde?
                  </p>
                </div>

                <label className="tick-box" htmlFor="roadwork1">
                  <input
                    type="checkbox"
                    name="road-work"
                    id="roadwork1"
                    className="road-work--tick-box"
                  />
                  <span>Strækning med vejarbejde</span>
                </label>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="mySpeed-speedLimit-wrapper">
              <div className="col-md-6">
                <div className="step-title">Hastighedsgrænse</div>
                <div className="step-section-wrapper speedlimit-slider-wrapper">
                  <div className="speedlimit-slider-inner-wrapper">
                    <div className="speedlimit-select">
                      <div className="speedlimit-select-wrapper">
                        <div className="speedlimit-slider swiper-container">
                          <div className="swiper-wrapper">
                            <button
                              data-index="0"
                              data-speed="40"
                              className="swiper-slide speed-limit"
                            >
                              <img
                                width="93"
                                height="93"
                                src={`${imageFolder}img/ticketcalculator/speedlimits/40.svg`}
                                alt=""
                              />
                            </button>
                            <button
                              data-index="1"
                              data-speed="50"
                              className="swiper-slide speed-limit"
                            >
                              <img
                                width="93"
                                height="93"
                                src={`${imageFolder}img/ticketcalculator/speedlimits/50.svg`}
                                alt=""
                              />
                            </button>
                            <button
                              data-index="2"
                              data-speed="60"
                              className="swiper-slide speed-limit"
                            >
                              <img
                                width="93"
                                height="93"
                                src={`${imageFolder}img/ticketcalculator/speedlimits/60.svg`}
                                alt=""
                              />
                            </button>
                            <button
                              data-index="3"
                              data-speed="70"
                              className="swiper-slide speed-limit"
                            >
                              <img
                                width="93"
                                height="93"
                                alt=""
                                src={`${imageFolder}img/ticketcalculator/speedlimits/70.svg`}
                              />
                            </button>
                            <button
                              data-index="4"
                              data-speed="80"
                              className="swiper-slide speed-limit selected"
                            >
                              <img
                                width="93"
                                height="93"
                                alt=""
                                src={`${imageFolder}img/ticketcalculator/speedlimits/80.svg`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="step-title">Din fart</div>
                <div className="step-section-wrapper speedinput-slider-wrapper">
                  <div className="speed-input-wrapper">
                    <input type="text" id="speed-input" defaultValue="40" />
                  </div>
                  <div className="speedInput-slider swiper-container">
                    <div className="swiper-wrapper">
                      {[...Array(211)].map((e, index) => {
                        return (
                          <button
                            key={`speedinput${index}`}
                            data-index={index}
                            data-speed={index + 40}
                            className="swiper-slide speed-input"
                          ></button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="non-active">
              <div className="calculate">
                <button className="calc-button">Beregn bøde</button>
                {/* <button className="calculate-mobile">Beregn bøde</button> */}
              </div>
            </div>
          </div>
        </Anime>
      </section>
      <div className="resultModalOverlay">
        <div className="resultModalWrapper">
          <div className="resultModalInnerWrapper">
            <div className="resultModal top">
              <button className="resultModal__close"></button>
              <div className="ticket-text-and-fine">
                <div className="fineWrapper">
                  <p className="fineText info-text">DU FÅR EN BØDE PÅ</p>
                  <p className="fineNumber info-text">0 kr.</p>
                  <p className="noFine info-text">Du får ingen bøde</p>
                  <p></p>
                  <p className="overSpeed info-text">
                    Bøden kan ikke beregnes ved hastigheder over 300 km/t
                  </p>
                </div>
                <div className="info-text-wrapper">
                  <div className="betkor info-text">
                    <p className="topText">
                      Hvis du har haft kørekort i 3 år eller mere:
                    </p>
                    <ul>
                      <li>
                        Du får også en{" "}
                        <span className="red">
                          betinget frakendelse af dit kørekort.
                        </span>
                      </li>
                      <li>Du skal også betale 500 kr. til Offerfonden.</li>
                    </ul>
                    <p className="topText">
                      Hvis du har haft kørekort i mindre end 3 år:
                    </p>
                    <ul>
                      <li>
                        Du får også <span className="red">kørselsforbud.</span>
                      </li>
                      <li>Du skal også betale 500 kr. til Offerfonden.</li>
                    </ul>
                  </div>
                  <div className="ubet info-text">
                    <p className="ubetheadline">Ubetinget frakendelse</p>
                    <p>Du får en ubetinget frakendelse af dit kørekort.</p>
                    <p>
                      Køretøjet kan blive konfiskeret, og du risikerer
                      fængselsstraf, da hastigheden defineres som vanvidskørsel.
                    </p>
                  </div>
                  <p className="ubetplusoffer info-text">
                    Du får også en stor bøde, der afhænger af de konkrete
                    omstændigheder, og du skal betale 500 kr. til Offerfonden.
                  </p>
                  <p className="klip info-text">
                    Du får også et klip i kørekortet og skal betale 500 kr. til
                    Offerfonden.
                  </p>
                  <div className="truck info-text">
                    <p className="topText">
                      En lastbil må ikke kunne køre mere end 90 km/t:
                      <br />
                      Du vil blive straffet, hvis der er foretaget indgreb i
                      fartbegrænseren.
                    </p>
                  </div>
                  <div className="bus info-text">
                    <p className="topText">
                    En bus må ikke kunne køre mere end 100 km/t.
                      <br />
                      Du vil blive straffet, hvis der er foretaget indgreb i
                      fartbegrænseren.
                    </p>
                  </div>
                  <div className="bus-tempo100 info-text">
                    <p className="topText">
                      En bus Tempo 100 må ikke kunne køre mere end 100 km/t.
                      <br />
                      Du vil blive straffet, hvis der er foretaget indgreb i
                      fartbegrænseren.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mytest-selections">
                <p>Dine valg:</p>
                <p className="toptext"></p>
              </div>
              <div className="btnrow">
                <button className="tryagain-btn">Prøv igen</button>
              </div>
            </div>
            <div className="resultModal bottom">
              {/* <script type="text/javascript">
                window.ticketCalculatorRibbonResultRandomTexts = new Array();
              </script>
              <script type="text/javascript">
                window.ticketCalculatorRibbonResultRandomTexts.push('
                <p>
                  <a href="/kampagner/saenk-farten?id=13475#13475">
                    Test, hvad for høj fart betyder, hvis du pludselig får brug
                    for at standse
                  </a>
                </p>
                ');
              </script> */}
              <div className="richtextinput"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { TicketCalculator };
