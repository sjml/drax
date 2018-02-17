
export class GitHubUser {
  public fullName: string;
  public login: string;
  public avatarUrl: string;
}

export abstract class GitHubNavNode {}

export class GitHubRepoList extends GitHubNavNode {
  // TODO: this is kind of silly; it's a dummy class used
  //   to link to the repo list. Gotta be a better way.
}

export class GitHubRepo extends GitHubNavNode {
  public owner: string;
  public name: string;
  public lastFetchTime: number;

  private _isPrivate: boolean;
  private _description: string;
  private _defaultBranch: string;

  public isPrivate: boolean;
  public description: string;
  public defaultBranch: string;
  public config: object = {
    hasConfig: false,
    ignoreHiddenFiles: true,
    contentRoot: '',
    showOnlyMarkdown: false
  };

  public get getRouterPath(): string[] {
    const ret = [this.owner, this.name];
    if (this.defaultBranch !== null) {
      ret.push(this.defaultBranch);
    }
    return ret;
  }
}

export class GitHubItem extends GitHubNavNode {
  public repo: GitHubRepo;
  public branch: string;
  public dirPath: string;
  public fileName: string;
  public isDirectory: boolean;
  public isBinary: boolean;
  public lastGet: string;

  public pathMatch(other: GitHubItem): boolean {
    if (this.repo !== other.repo) {
      if (this.repo === null || other.repo === null) {
        return false;
      }
      if (this.repo.owner !== other.repo.owner) {
        return false;
      }
      if (this.repo.name !== other.repo.name) {
        return false;
      }
    }
    if (this.branch !== other.branch) {
      return false;
    }
    if (this.dirPath !== other.dirPath) {
      return false;
    }
    if (this.fileName !== other.fileName) {
      return false;
    }

    return true;
  }

  public getFullPath(): string {
    if (this.dirPath === undefined || this.dirPath === null || this.dirPath.length === 0) {
      return this.fileName;
    }
    else {
      return `${this.dirPath}/${this.fileName}`;
    }
  }

  public getRouterPath(dirOnly: boolean = false): string[] {
    let ret = [this.repo.owner, `${this.repo.name}:${this.branch}`];
    const dir = this.dirPath.split('/').filter(s => s.length > 0);
    ret = ret.concat(dir);
    if (!dirOnly) {
      ret.push(this.fileName);
    }
    return ret;
  }

  public getGitHubLink(): string {
    let link = `https://github.com/${this.repo.owner}/${this.repo.name}/blob/${this.branch}/`;
    if (this.dirPath === null || this.dirPath.length === 0) {
      link += this.fileName;
    }
    else {
      link += `${this.dirPath}/${this.fileName}`;
    }
    return link;
  }

  public makeParentItem(): GitHubItem {
    if (this.dirPath === null || this.dirPath.length === null) {
      return null;
    }
    const parent = new GitHubItem();
    parent.repo = this.repo;
    parent.branch = this.branch;
    parent.isDirectory = true;

    const pathSegs = this.dirPath.split('/');
    parent.fileName = pathSegs.pop();
    parent.dirPath = pathSegs.join('/');
    return parent;
  }
}

export class GitHubFile {
  public isDirty = false;
  public pristine: string = null;
  public contents: string = null;
  public item: GitHubItem = null;

  constructor(originalContents: string) {
    this.pristine = originalContents;
    this.contents = originalContents;
  }
}
