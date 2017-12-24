
export module Queries {

  const userInfo = {
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
    return userInfo;
  }

  const repoInfo = {
    'query': `
      {
        viewer {
          repositories (%%CONTINUATION%% first:30, orderBy: {field: CREATED_AT, direction: DESC}) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              node {
                name
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
    const qString = repoInfo.query.replace('%%CONTINUATION%%', contQuery);
    const repoInfoQuery = {};
    repoInfoQuery['query'] = qString;

    return repoInfoQuery;
  }
}
