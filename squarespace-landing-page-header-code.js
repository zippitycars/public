// Add Luxon
var script = document.createElement('script');
script.src = 'https://moment.github.io/luxon/global/luxon.min.js';
var head = document.head;
head.insertBefore(script, head.firstChild);

// Wait for DOM loaded AND luxon loaded
script.onload(() => {
  if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
});

function ready() {
  // We query the API by location name eg. "Fidelity"
  const LOCATION_NAME = 'Tuck';

  const LuxonDt = luxon.DateTime;

  const fetchUrl =
    'https://brain.zippitycars.com/schedule?location=' + LOCATION_NAME;

  fetch(fetchUrl)
    .then((results) => results.json())
    .then((results) => {
      console.log(results);
      if (!results || !results.schedule || results.schedule.length === 0) {
        return;
      }

      // Format the dates like "January 12"
      const humanizedDates = results.schedule.map((date) => {
        return LuxonDt.fromISO(date).toLocaleString({
          month: 'long',
          day: 'numeric',
        });
      });

      const nextDate = LuxonDt.fromISO(results[0]);
      const now = LuxonDt.local();
      const serviceIsToday = now.hasSame(nextDate, 'day');
      const advertiseToday = serviceIsToday && now.hour <= 12;

      // The HTML where we will insert the dates
      const textElement = document.getElementsByClassName(
        'sqs-slice-body-content',
      )[0];

      let htmlString = '';

      if (advertiseToday) {
        htmlString += `<strong>We're here TODAY! Book service for today until 12pm at zippitycars.com!</strong>
        <br/>`;
      }

      // If service is happening today, don't include today's date in the dates list
      if (serviceIsToday) {
        humanizedDates.shift();
      }

      htmlString += `<strong>We're coming next on ${
        humanizedDates[0]
      }!</strong>`;

      // Discard the first date b/c we used it in the headline
      // Only show up to 4 upcoming dates
      const upcomingDates = humanizedDates
        .slice(1, 5)
        .map((date, index, array) => {
          if (index + 1 === array.length) {
            return `${date}`;
          }
          return `${date} | `;
        });

      if (upcomingDates.length > 0) {
        htmlString += `<br/>More services available on ${upcomingDates.join(
          '',
        )}`;
      }

      return (textElement.innerHTML = htmlString);
    });
}
