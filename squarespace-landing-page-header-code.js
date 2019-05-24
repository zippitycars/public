var head = document.head;

// Add Luxon
var luxonScript = document.createElement('script');
luxonScript.src = 'https://moment.github.io/luxon/global/luxon.min.js';
head.insertBefore(luxonScript, head.firstChild);

// Add qs
var qsScript = document.createElement('script');
qsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qs/6.5.1/qs.min.js';
head.insertBefore(qsScript, head.firstChild);

// Wait for DOM loaded AND luxon loaded
luxonScript.onload = ready;
qsScript.onload = ready;

var readyMarker = false;

function ready() {
  // ready must be called twice (by both script tags) to execute fully
  if (!readyMarker) {
    return (readyMarker = true);
  }

  if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', showSchedule);
  } else {
    showSchedule();
  }
}

function showSchedule() {
  // We query the API by location name eg. "Fidelity"
  // In production we set this inside the Squarespace Header Code box
  // const LOCATION_NAME = 'Tuck';

  // Get the location name from query string 'location' value
  // Eg. "?location=Fidelity"
  const queryString = Qs.parse(document.location.search.replace(/^\?/, ''));

  if (!queryString || !queryString.location) {
    return;
  }

  const LOCATION_NAME = queryString.location.toLowerCase();

  // Append location as query string to the action buttons
  // so we can use it in the form on the next page
  const buttons = document.querySelectorAll('.sqs-slice-buttons a');

  buttons.forEach((button) => {
    button.href += `?SQF_LOCATION=${LOCATION_NAME}`;
  });

  const LuxonDt = luxon.DateTime;

  const fetchClientsUrl = 'https://brain2.zippitycars.com/client-location';

  fetch(fetchClientsUrl)
    .then((results) => results.json())
    .then((results) => {
      return results.find(
        (client) => client.short_name.toLowerCase() === LOCATION_NAME,
      );
    })
    .then((client) => {
      if (!client || !client.client_location_id) {
        return;
      }

      const yesterdayISO = LuxonDt.local()
        .minus({ days: 1 })
        .toISODate();

      const fetchScheduleUrl = `https://brain2.zippitycars.com/schedule?filter={"client_location_id": ${
        client.client_location_id
      }, "start_time_after": "${yesterdayISO}" }&sort=["start_time", "ASC"]`;

      fetch(fetchScheduleUrl)
        .then((results) => results.json())
        .then((results) => {
          console.log(results);
          if (!results || results.length === 0) {
            return;
          }

          const nextInstanceStartTime = results[0].start_time.substring(0, 10);
          const nextDate = LuxonDt.fromISO(nextInstanceStartTime);
          const now = LuxonDt.local();
          const serviceIsToday = now.hasSame(nextDate, 'day');
          const advertiseToday = serviceIsToday && now.hour < 12;

          // If service is happening today, don't include today's date in the dates list
          if (serviceIsToday) {
            results.shift();
          }

          // Format the dates like "January 12"
          let humanizedDates = [];
          let weekdays = [];

          results.forEach((instance) => {
            const startTime = instance.start_time.substring(0, 10);

            const humanized = LuxonDt.fromISO(startTime).toLocaleString({
              month: 'long',
              day: 'numeric',
            });
            humanizedDates.push(humanized);

            const weekday = LuxonDt.fromISO(startTime).toLocaleString({
              weekday: 'long',
            });
            weekdays.push(weekday);
          });

          // The HTML where we will insert the dates
          const textElement = document.getElementsByClassName(
            'sqs-slice-body-content',
          )[0];

          let htmlString = '';

          if (advertiseToday) {
            htmlString += `<strong>We're here TODAY! Book service for today until 12pm at zippitycars.com!</strong>`;
          } else {
            htmlString += `<strong>We're coming on ${weekdays[0]}, ${
              humanizedDates[0]
            }!</strong>`;
          }

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
            htmlString += `<br/><br/><strong>More services available on <br/> ${upcomingDates.join(
              '',
            )}</strong>`;
          }

          return (textElement.innerHTML = htmlString);
        });
    });
}
