const columnHeader = require('../components/getColumnHeaderConfig');
const util = require('../utilities/all');
const makeGithubContentsRequest = require('./makeGithubContentsRequest');

const githubPagesDomain = `${window.env.GITHUB_USERNAME}.github.io`;

module.exports = async (path = ``) => {
  const requestContentsTask = makeGithubContentsRequest(path);

  // TODO: show number of results and number selected
  const dataTable = document.getElementById(`data-table`);
  util.clearElement(dataTable);

  util.newElement(dataTable, {
    tag: `tr`,
    class: `grey-444`,
    children: [
      columnHeader(`name`),
      columnHeader(`type`),
      columnHeader(`download link`)
    ]
  });

  const contentsReponse = await requestContentsTask;
  if(contentsReponse.status !== 200) throw new Error(`Github returned status code ${contentsReponse.status} ${await contentsReponse.text()}`);

  /** @type {Array<import('./makeGithubContentsRequest').GithubResponse>} */
  const contents = await contentsReponse.json();
  generateRows(dataTable, contents);
};

/**
 * @param {HTMLElement} tableElement 
 * @param {Array<import('./makeGithubContentsRequest').GithubResponse>} contents
 * @returns {Array<HTMLElement>}
 */
const generateRows = (tableElement, contents) => util.loop(contents, (key, /** @type {import('./makeGithubContentsRequest').GithubResponse} */ value) =>
  util.newElement(tableElement, {
    tag: `tr`,
    id: `data-${key}`,
    children: [
      {
        tag: `td`,
        class: `grey-border`,
        // onclick: value.type === `dir` ? alert(`hello`) : undefined,
        children: [{
          tag: `a`,
          href: value.type === `dir` ? value.html_url : value.download_url,
          target: `_blank`,
          textContent: value.name
        }]
      },
      {
        tag: `td`,
        class: `grey-border`,
        textContent: value.type
      },
      {
        tag: `td`,
        class: `grey-border`,
        children: [{
          tag: `a`,
          href: `https://${githubPagesDomain}/${value.path}`,
          target: `_blank`,
          textContent: `${githubPagesDomain}/${value.path}`
        }]
      }
    ]
  }));
