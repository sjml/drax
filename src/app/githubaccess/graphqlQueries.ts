import { GitHubRepo, GitHubItem } from './githubaccess.component';

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
          isPrivate
          description
          defaultBranchRef {
            name
          }
        }
      }
      `
  };
  export function getSingleRepoInfo(repo: GitHubRepo): object {
    const qString = singleRepoInfoTemplate.query
                      .replace('%%OWNER%%', repo.owner)
                      .replace('%%NAME%%', repo.name);

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
  export function getFileList(item: GitHubItem): object {
    const qString = fileListTemplate
                      .replace('%%OWNER%%', item.repo.owner)
                      .replace('%%NAME%%', item.repo.name)
                      .replace('%%EXPRESSION%%', `${item.branch}:${item.fullPath()}`);

    return {query: qString};
  }

  const fileContentsTemplate = `
    {
      repository(owner: "%%OWNER%%", name: "%%NAME%%") {
        object(%%EXPRESSION%%) {
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
                      .replace('%%EXPRESSION%%', `expression: "${item.branch}:${item.fullPath()}"`)
                      .replace('%%TEXT%%', 'text');
    return {query: qString};
  }

  export function getFileContentsByOid(repo: GitHubRepo, oid: string): object {
    const qString = fileContentsTemplate
                      .replace('%%OWNER%%', repo.owner)
                      .replace('%%NAME%%', repo.name)
                      .replace('%%EXPRESSION%%', `oid: "${oid}"`)
                      .replace('%%TEXT%%', 'text');
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
  export function getPathInfo(item: GitHubItem): object {
    let branch = item.branch;
    if (branch === null || branch.length === 0) {
      branch = item.repo.defaultBranch;
    }
    const qString = pathInfoTemplate
                      .replace('%%OWNER%%', item.repo.owner)
                      .replace('%%NAME%%', item.repo.name)
                      .replace('%%EXPRESSION%%', `${branch}:${item.fullPath()}`);
    return {query: qString};
  }

  const fileHistoryTemplate = `
    {
      repository(owner: "%%OWNER%%", name: "%%NAME%%") {
        ref(qualifiedName: "%%BRANCH%%") {
          target {
            ... on Commit {
              history(first:20, path: "%%PATH%%") {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  oid
                  author {
                    user {
                      login
                      avatarUrl
                    }
                  }
                  message
                  messageHeadline
                  committedDate
                }
              }
            }
          }
        }
      }
    }
  `;
  export function getFileHistory(item: GitHubItem): object {
    let branch = item.branch;
    if (branch === null || branch.length === 0) {
      branch = item.repo.defaultBranch;
    }
    const qString = fileHistoryTemplate
                      .replace('%%OWNER%%', item.repo.owner)
                      .replace('%%NAME%%', item.repo.name)
                      .replace('%%BRANCH%%', branch)
                      .replace('%%PATH%%', item.fullPath());
    return {query: qString};
  }
}
