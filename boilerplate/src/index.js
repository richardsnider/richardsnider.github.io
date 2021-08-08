const loop = require('./utilities/loop');
const newElement = require('./utilities/newElement');
const messages = require('./data/messages');
const svgContent = require('./components/getSvgContentConfig');
const banner = require('./components/getBannerConfig');
const header = require('./components/getHeaderConfig');
const menu = require('./components/getMenuConfig');
const notifications = require('./components/getNotificationsConfig');
const settings = require('./components/getSettingsConfig');
const mainRow = require('./components/getMainRowConfig');
const footer = require('./components/getFooterConfig');
const fillDataTable = require('./actions/fillDataTable');

const startup = async () => {
  console.log(`Document intialized.`);

  document.body.classList.add(`grey-111`);

  const svgContentElement = newElement(document.body, svgContent());
  const bannerElement = newElement(document.body, banner(messages.bannerMessage, `welcome-banner`));
  const headerElement = newElement(document.body, header());
  const menuElement = newElement(document.body, menu());
  const notificationsElement = newElement(document.body, notifications());
  const settingsElement = newElement(document.body, settings());

  const mainRowElement = newElement(document.body, mainRow());
  const footerElement = newElement(document.body, footer());

  document.getElementById(`filter-input`).focus();

  const targetDirectory = new URLSearchParams(location.search).get(`directory`) || ``;
  await fillDataTable(targetDirectory);
};

(async () => {
  document.addEventListener(`DOMContentLoaded`, startup);
})();
