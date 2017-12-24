
export namespace Queries {
  export const userInfo = {
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

  export const repoInfo = {
    'query': `
      {
        viewer {
          repositories (orderBy: {field: CREATED_AT, direction: DESC}, first:20) {
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
}
