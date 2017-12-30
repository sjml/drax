import { GitHubRepo, GitHubItem } from './githubaccess.component';

// TODO: unify the formatting of all these

export module Queries {
  const userInfoTemplate = {
    'query': `
      {
        viewer {
          name
          avatarUrl
          login
        }
      }
      `
  };
  export function getUserInfo(): object {
    return userInfoTemplate;
  }

  const repoInfoTemplate = {
    'query': `
      {
        viewer {
          repositories (
            %%CONTINUATION%%
            first:50,
            affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              node {
                name
                owner {login}
                isPrivate
                description
                defaultBranchRef {
                  name
                }
              }
            }
          }
        }
      }
      `
  };
  export function getRepoInfo(continuation: string = null): object {
    let contQuery = '';
    if (continuation !== null) {
      contQuery = 'after: "' + continuation + '"';
    }
    const qString = repoInfoTemplate.query.replace('%%CONTINUATION%%', contQuery);
    const repoInfoQuery = {};
    repoInfoQuery['query'] = qString;

    return repoInfoQuery;
  }

  const singleRepoInfoTemplate = {
    'query': `
      {
        repository(owner: "%%OWNER%%", name: "%%NAME%%") {
          name
          owner {login}
          isPrivate
          description
          defaultBranchRef {
            name
          }
        }
      }
      `
  };
  export function getSingleRepoInfo(owner: string, repoName: string): object {
    const qString = singleRepoInfoTemplate.query
                      .replace('%%OWNER%%', owner)
                      .replace('%%NAME%%', repoName);

    return {query: qString};
  }

  const fileListTemplate = `
    {
      repository(owner: "%%OWNER%%", name: "%%NAME%%") {
        object(expression: "%%EXPRESSION%%") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  isBinary
                }
              }
            }
          }
        }
      }
    }
  `;
  export function getFileList(repo: GitHubRepo, path: string): object {
    let expr = repo.defaultBranch + ':';
    if (path.length > 0) {
      expr += path;
    }
    const qString = fileListTemplate
                      .replace('%%OWNER%%', repo.owner)
                      .replace('%%NAME%%', repo.name)
                      .replace('%%EXPRESSION%%', expr);

    return {query: qString};
  }

  const fileContentsTemplate = `
    {
      repository(owner: "%%OWNER%%", name: "%%NAME%%") {
        object(expression: "%%EXPRESSION%%") {
          ... on Blob {
            %%TEXT%%
            oid
          }
        }
      }
    }
  `;
  export function getFileContents(item: GitHubItem): object {
    const qString = fileContentsTemplate
                      .replace('%%OWNER%%', item.repo.owner)
                      .replace('%%NAME%%', item.repo.name)
                      .replace('%%EXPRESSION%%', `${item.repo.defaultBranch}:${item.fullPath}`)
                      .replace('%%TEXT%%', 'text');
    return {query: qString};
  }

  export function getFileSha(item: GitHubItem): object {
    const expr = item.repo.defaultBranch + ':' + item.fullPath;
    const qString = fileContentsTemplate
                      .replace('%%OWNER%%', item.repo.owner)
                      .replace('%%NAME%%', item.repo.name)
                      .replace('%%EXPRESSION%%', expr)
                      .replace('%%TEXT%%', '');

    return {query: qString};
  }

  const pathInfoTemplate = `
    {
      repository(owner: "%%OWNER%%", name: "%%NAME%%") {
        object(expression: "%%EXPRESSION%%") {
          __typename
          oid
        }
      }
    }
  `;
  export function getPathInfo(repo: GitHubRepo, path: string): object {
    const expr = repo.defaultBranch + ':' + path;
    const qString = pathInfoTemplate
                      .replace('%%OWNER%%', repo.owner)
                      .replace('%%NAME%%', repo.name)
                      .replace('%%EXPRESSION%%', expr);

    return {query: qString};
  }
}
